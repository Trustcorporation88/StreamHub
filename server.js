import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Readable } from "node:stream"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8080

// ---- IPTV proxy (portado de api/iptv-proxy.js, formato Vercel -> Express) ----
function rewritePlaylist(body, targetUrl) {
  const proxyEndpoint = "/api/iptv-proxy?url="
  const proxy = (url) => proxyEndpoint + encodeURIComponent(new URL(url, targetUrl).href)
  return body
    .replace(/URI="([^"]*)"/g, (_, u) => `URI="${proxy(u)}"`)
    .replace(/^(?!#)(.+)$/gm, (line) => {
      const u = line.trim()
      return u && !u.startsWith("#") ? proxy(u) : line
    })
}

app.use("/api/iptv-proxy", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Headers", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  if (req.method === "OPTIONS") return res.status(200).end()
  next()
})

// ---- Diagnóstico IPTV: testa playlist -> manifesto -> segmento ----
app.get("/api/iptv-debug", async (req, res) => {
  const urlStr = req.query?.url
  if (!urlStr) return res.status(400).json({ erro: "Faltou ?url=<link da playlist>" })

  const report = { etapas: [] }
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  const mask = (u) => String(u).replace(/(username|password)=[^&]*/gi, "$1=***").replace(/\/\d{4,}\/\d{4,}\//g, "/***/***/")

  async function step(nome, url, readMode) {
    const entry = { etapa: nome, url: mask(url).slice(0, 140) }
    try {
      const r = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
        headers: { "User-Agent": ua, Accept: "*/*" },
      })
      entry.status = r.status
      entry.redirecionou_para = r.url !== url ? mask(r.url).slice(0, 140) : "(sem redirect)"
      entry.content_type = r.headers.get("content-type") || "(vazio)"
      let text = ""
      if (readMode === "partial") {
        const reader = r.body.getReader()
        const dec = new TextDecoder()
        while (text.length < 200000) {
          const { done, value } = await reader.read()
          if (done) break
          text += dec.decode(value, { stream: true })
        }
        reader.cancel().catch(() => {})
        entry.parcial = true
      } else {
        text = await r.text()
      }
      entry.amostra = mask(text.slice(0, 300))
      return { entry, body: text, finalUrl: r.url }
    } catch (e) {
      entry.erro = e?.name === "TimeoutError" ? "TIMEOUT 20s" : String(e?.cause?.code || e.message || e)
      return { entry, body: null, finalUrl: url }
    } finally {
      report.etapas.push(entry)
    }
  }

  try {
    const playlistUrl = decodeURIComponent(urlStr)
    const p = await step("1-playlist", playlistUrl, "partial")
    if (!p.body || !p.body.includes("#EXTINF")) {
      report.conclusao = "A playlist não veio ou não é M3U — veja status/erro da etapa 1."
      return res.json(report)
    }
    const urls = p.body.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    report.canais_na_amostra = urls.length
    if (urls.length === 0) {
      report.conclusao = "Playlist veio mas sem URLs de canais na amostra."
      return res.json(report)
    }
    const m = await step("2-manifesto-canal", urls[0])
    if (!m.body || !m.body.trimStart().startsWith("#EXTM3U")) {
      report.conclusao = "O canal não retornou um manifesto HLS — provável bloqueio do provedor (IP de datacenter ou limite de conexões) ou canal fora do ar. Veja a etapa 2."
      return res.json(report)
    }
    const segLine = m.body.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("#"))
    if (!segLine) {
      report.conclusao = "Manifesto veio vazio (sem segmentos) — canal possivelmente fora do ar."
      return res.json(report)
    }
    const segUrl = new URL(segLine, m.finalUrl).href
    const sg = await step("3-segmento", segUrl)
    report.conclusao =
      sg.entry.status === 200
        ? "TUDO OK do lado do servidor — playlist, manifesto e segmento respondem. O problema estaria no navegador/player."
        : "Manifesto OK, mas o segmento falhou — veja a etapa 3."
    res.json(report)
  } catch (e) {
    report.erro_geral = String(e.message || e)
    res.status(500).json(report)
  }
})

// ---- YouTube: resolver a live ATUAL de um canal ----
// Recebe ?channel=<UC...> e devolve { videoId } da transmissão ao vivo do momento.
// Assim o player nunca precisa de um ID fixo que expira.
const ytCache = new Map() // channelId -> { videoId, ts }
const YT_CACHE_MS = 60 * 1000 // 1 min

app.get("/api/youtube-live", async (req, res) => {
  const channel = req.query?.channel
  if (!channel || !/^[@\w-]+$/.test(channel)) {
    return res.status(400).json({ error: "Parâmetro channel inválido" })
  }

  const cached = ytCache.get(channel)
  if (cached && Date.now() - cached.ts < YT_CACHE_MS) {
    return res.json({ videoId: cached.videoId, cached: true })
  }

  // Aceita tanto ID de canal (UC...) quanto handle (@nome)
  const path = channel.startsWith("@") ? channel : `channel/${channel}`

  try {
    let videoId = null

    const tryLivePage = async (host) => {
      const r = await fetch(`https://${host}/${path}/live`, {
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Cookie": "CONSENT=YES+cb; SOCS=CAI",
        },
      })
      if (!r.ok) return null
      const html = await r.text()
      // O link canonical da página /live aponta para a transmissão ao vivo
      // principal do momento — é a fonte mais confiável.
      const canonical = html.match(
        /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/
      )
      const id = canonical?.[1] || (html.match(/"videoId":"([\w-]{11})"/) || [])[1] || null
      if (!id) return null

      // Confirma que ESSE vídeo está ao vivo agora (não é gravação).
      // Procura o marcador de live perto da ocorrência do próprio id.
      const liveNow =
        /"isLiveNow":true/.test(html) ||
        /"style":"LIVE"/.test(html) ||
        /BADGE_STYLE_TYPE_LIVE_NOW/.test(html) ||
        /"iconType":"LIVE"/.test(html)
      return { id, isLive: liveNow }
    }

    let result = await tryLivePage("www.youtube.com")
    if (!result) result = await tryLivePage("m.youtube.com")
    videoId = result?.id || null

    if (!videoId) {
      return res.status(404).json({ error: "Nenhuma transmissão ao vivo encontrada agora" })
    }

    // Se a página não indica transmissão AO VIVO agora, é um vídeo gravado
    // (o YouTube devolve o último vídeo quando não há live). Recusamos, para
    // não tocar matéria antiga achando que é ao vivo.
    if (result && result.isLive === false) {
      return res.status(404).json({ error: "Este canal não está ao vivo no momento." })
    }

    ytCache.set(channel, { videoId, ts: Date.now() })
    res.json({ videoId, isLive: result?.isLive ?? null })
  } catch (e) {
    const msg = e?.name === "TimeoutError" ? "Tempo esgotado ao consultar o YouTube" : String(e.message || e)
    res.status(502).json({ error: msg })
  }
})

app.get("/api/iptv-proxy", async (req, res) => {
  const urlStr = req.query?.url
  if (!urlStr) return res.status(400).end("Missing url")

  const targetUrl = decodeURIComponent(urlStr)

  // Timeout apenas para estabelecer conexão/receber cabeçalhos.
  // O corpo pode demorar o quanto precisar (playlists de 20+ MB, VOD etc.)
  const doFetch = (ua) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    return fetch(targetUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": ua, Accept: "*/*" },
    }).finally(() => clearTimeout(timer))
  }

  try {
    let proxyRes = await doFetch(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    // Alguns provedores IPTV só aceitam User-Agent de players conhecidos
    if (!proxyRes.ok && [401, 403, 451, 456, 458].includes(proxyRes.status)) {
      proxyRes = await doFetch("VLC/3.0.20 LibVLC/3.0.20")
    }

    if (!proxyRes.ok) {
      return res.status(proxyRes.status).end(`Origin server returned ${proxyRes.status}`)
    }

    const finalUrl = proxyRes.url || targetUrl
    const contentType = proxyRes.headers.get("content-type") || ""
    const contentLength = Number(proxyRes.headers.get("content-length") || 0)
    // Streams de vídeo (ex.: Xtream devolvendo MPEG-TS cru em URL ".m3u8")
    // jamais entram no caminho de texto — corpo é infinito.
    const isVideoStream = /^video\//i.test(contentType)
    const maybeM3U8 =
      !isVideoStream &&
      (/\.m3u8/i.test(finalUrl) ||
        /\.m3u8/i.test(targetUrl) ||
        /mpegurl/i.test(contentType))

    // Só vale a pena inspecionar/reescrever manifestos pequenos.
    // Playlists de catálogo (get.php) têm dezenas de MB e NÃO devem ser reescritas.
    if (maybeM3U8 && (contentLength === 0 || contentLength < 2_000_000)) {
      const body = await proxyRes.text()
      // Reescreve apenas manifestos HLS de verdade (têm tags #EXT-X-...).
      // Playlists de canais (só #EXTINF) passam intactas para o cliente.
      if (body.trimStart().startsWith("#EXTM3U") && body.includes("#EXT-X-")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
        return res.end(rewritePlaylist(body, finalUrl))
      }
      res.setHeader("Content-Type", contentType || "text/plain")
      return res.end(body)
    }

    // Todo o resto (segmentos, VOD, playlists gigantes): repassar em streaming
    res.setHeader("Content-Type", contentType || "video/MP2T")
    // Content-Length só faz sentido para conteúdo finito (segmentos, VOD).
    // Streams ao vivo (video/mp2t contínuo) não têm tamanho definido.
    if (contentLength && !isVideoStream) res.setHeader("Content-Length", String(contentLength))
    if (isVideoStream) {
      // Evita que camadas intermediárias segurem o buffer do stream ao vivo
      res.setHeader("Cache-Control", "no-cache, no-store")
      res.setHeader("X-Accel-Buffering", "no")
      res.flushHeaders?.()
    }

    const upstream = Readable.fromWeb(proxyRes.body)

    // Se o cliente (navegador) fechar a conexão — troca de canal, reconexão do
    // player, fechar aba — abortamos a leitura do upstream sem derrubar o processo.
    const cleanup = () => {
      upstream.destroy()
    }
    res.on("close", cleanup)
    res.on("error", cleanup)
    upstream.on("error", () => {
      if (!res.headersSent) res.status(502).end("Upstream stream error")
      else res.end()
    })

    upstream.pipe(res)
  } catch (e) {
    const msg = e?.name === "AbortError" || e?.name === "TimeoutError"
      ? "Upstream connection timeout (20s)"
      : e.message || String(e)
    if (!res.headersSent) res.status(502).end(`IPTV proxy error: ${msg}`)
    else res.end()
  }
})

// ---- Site estático (build do Vite) + fallback SPA ----
const distDir = path.join(__dirname, "dist")
app.use(express.static(distDir))
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"))
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`StreamHub rodando na porta ${PORT}`)
})
