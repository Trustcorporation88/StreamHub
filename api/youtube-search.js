const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

const PIPED_FALLBACKS = [
  "https://api.piped.private.coffee",
  "https://pipedapi.reallyaweso.me",
  "https://pipedapi.leptons.xyz",
  "https://pipedapi.kavin.rocks",
]

const INVIDIOUS_FALLBACKS = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://inv.thepixora.com",
  "https://invidious.f5.si",
  "https://yt.chocolatemoo53.com",
  "https://yewtu.be",
  "https://invidious.materialio.us",
  "https://iv.ggtyler.dev",
]

function ytThumb(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
}

function toTrack(videoId, title, artist) {
  if (!videoId) return null
  return {
    id: `yt-${videoId}`,
    title: title || "Sem título",
    artist: artist || "YouTube",
    thumbnail: ytThumb(videoId),
    source: "youtube",
    streamUrl: `https://www.youtube.com/watch?v=${videoId}`,
    platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

async function fetchJson(url, { timeoutMs = 8000, method = "GET", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("json") && !ct.includes("javascript")) {
    throw new Error("not json")
  }
  return res.json()
}

function unique(urls) {
  return [...new Set(urls.filter(Boolean).map((u) => String(u).replace(/\/+$/, "")))]
}

async function listPipedApis() {
  try {
    const list = await fetchJson("https://piped-instances.kavin.rocks/", { timeoutMs: 6000 })
    const urls = Array.isArray(list) ? list.map((i) => i?.api_url) : []
    return unique([...urls, ...PIPED_FALLBACKS])
  } catch {
    return unique(PIPED_FALLBACKS)
  }
}

async function listInvidiousApis() {
  try {
    const list = await fetchJson("https://api.invidious.io/instances.json?sort_by=health", {
      timeoutMs: 6000,
    })
    const urls = []
    if (Array.isArray(list)) {
      for (const row of list) {
        const host = Array.isArray(row) ? row[0] : row?.uri || row?.name
        const meta = Array.isArray(row) ? row[1] : row
        if (meta?.type && meta.type !== "https") continue
        if (meta?.api === false) continue
        if (typeof host === "string" && host.includes(".")) {
          urls.push(host.startsWith("http") ? host : `https://${host}`)
        }
      }
    }
    return unique([...urls, ...INVIDIOUS_FALLBACKS])
  } catch {
    return unique(INVIDIOUS_FALLBACKS)
  }
}

function tracksFromPiped(data) {
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
  const tracks = []
  for (const item of items) {
    if (item?.type && item.type !== "stream") continue
    const url = String(item?.url || item?.urlId || "")
    const idMatch = url.match(/[?&]v=([\w-]{11})/) || url.match(/\/watch\/([\w-]{11})/) || url.match(/^([\w-]{11})$/)
    const videoId = item?.id || idMatch?.[1]
    const track = toTrack(videoId, item?.title, item?.uploaderName || item?.uploader)
    if (track) tracks.push(track)
    if (tracks.length >= 20) break
  }
  return tracks
}

function tracksFromInvidious(data) {
  if (!Array.isArray(data)) return []
  const tracks = []
  for (const item of data) {
    if (item?.type && item.type !== "video") continue
    const track = toTrack(item.videoId, item.title, item.author)
    if (track) tracks.push(track)
    if (tracks.length >= 20) break
  }
  return tracks
}

function walkVideoRenderers(node, out) {
  if (!node || out.length >= 20) return
  if (Array.isArray(node)) {
    for (const item of node) walkVideoRenderers(item, out)
    return
  }
  if (typeof node !== "object") return
  const vr = node.videoRenderer || node.compactVideoRenderer || node.playlistVideoRenderer
  if (vr?.videoId) {
    const title =
      vr.title?.runs?.map((r) => r.text).join("") ||
      vr.title?.simpleText ||
      vr.headline?.simpleText ||
      ""
    const artist =
      vr.ownerText?.runs?.map((r) => r.text).join("") ||
      vr.shortBylineText?.runs?.map((r) => r.text).join("") ||
      vr.longBylineText?.runs?.map((r) => r.text).join("") ||
      "YouTube"
    const track = toTrack(vr.videoId, title, artist)
    if (track && !out.some((t) => t.id === track.id)) out.push(track)
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") walkVideoRenderers(value, out)
  }
}

async function searchInnerTube(query) {
  const data = await fetchJson("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
    timeoutMs: 10000,
    method: "POST",
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20241201.00.00",
          hl: "pt",
          gl: "BR",
        },
      },
      query,
    }),
  })
  const tracks = []
  walkVideoRenderers(data, tracks)
  return tracks
}

export async function searchYouTube(query) {
  const q = String(query || "").trim()
  if (!q) return []

  const pipedApis = await listPipedApis()
  for (const api of pipedApis) {
    try {
      const data = await fetchJson(
        `${api}/search?q=${encodeURIComponent(q)}&filter=videos`,
        { timeoutMs: 8000 },
      )
      const tracks = tracksFromPiped(data)
      if (tracks.length) return tracks
    } catch {
      // next
    }
  }

  const invApis = await listInvidiousApis()
  for (const api of invApis.slice(0, 8)) {
    try {
      const data = await fetchJson(
        `${api}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance`,
        { timeoutMs: 7000 },
      )
      const tracks = tracksFromInvidious(data)
      if (tracks.length) return tracks
    } catch {
      // next
    }
  }

  try {
    const tracks = await searchInnerTube(q)
    if (tracks.length) return tracks
  } catch {
    // fall through
  }

  throw new Error("UNAVAILABLE")
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  const query = req.query?.q
  if (!query || !String(query).trim()) {
    res.status(400).json({ error: "Missing q" })
    return
  }

  try {
    const tracks = await searchYouTube(String(query))
    res.setHeader("Cache-Control", "public, max-age=120")
    res.status(200).json({ tracks })
  } catch {
    res.status(503).json({
      error: "unavailable",
      message: "Busca do YouTube indisponível no momento. Tente de novo em instantes.",
    })
  }
}
