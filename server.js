import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Readable } from "node:stream"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

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

app.get("/api/iptv-proxy", async (req, res) => {
  const urlStr = req.query?.url
  if (!urlStr) return res.status(400).end("Missing url")

  const targetUrl = decodeURIComponent(urlStr)

  const doFetch = (ua) =>
    fetch(targetUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: {
        "User-Agent": ua,
        Accept: "*/*",
      },
    })

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

    // Base correta para reescrever links relativos: a URL FINAL (pós-redirect)
    const finalUrl = proxyRes.url || targetUrl
    const contentType = proxyRes.headers.get("content-type") || ""
    const looksM3U8 =
      /\.m3u8/i.test(finalUrl) ||
      /\.m3u8/i.test(targetUrl) ||
      /mpegurl/i.test(contentType)

    if (looksM3U8) {
      const body = await proxyRes.text()
      // Confirma pelo conteúdo (evita reescrever algo que não é playlist)
      if (body.trimStart().startsWith("#EXTM3U") || body.includes("#EXTINF")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
        return res.end(rewritePlaylist(body, finalUrl))
      }
      res.setHeader("Content-Type", contentType || "text/plain")
      return res.end(body)
    }

    // Segmentos de vídeo e demais conteúdos: repassar em streaming, sem
    // carregar tudo na memória (essencial para VOD e segmentos grandes)
    res.setHeader("Content-Type", contentType || "video/MP2T")
    const length = proxyRes.headers.get("content-length")
    if (length) res.setHeader("Content-Length", length)
    Readable.fromWeb(proxyRes.body).pipe(res)
  } catch (e) {
    const msg = e?.name === "TimeoutError" ? "Upstream timeout (20s)" : e.message || String(e)
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
