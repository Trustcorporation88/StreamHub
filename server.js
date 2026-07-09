import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"

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
  const isM3U8 = /\.m3u8/i.test(targetUrl)

  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
    })

    if (!proxyRes.ok) {
      return res.status(proxyRes.status).end(`Origin server returned ${proxyRes.status}`)
    }

    if (isM3U8) {
      const body = await proxyRes.text()
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
      res.end(rewritePlaylist(body, targetUrl))
    } else {
      res.setHeader("Content-Type", proxyRes.headers.get("content-type") || "video/MP2T")
      res.end(Buffer.from(await proxyRes.arrayBuffer()))
    }
  } catch (e) {
    res.status(502).end(`IPTV proxy error: ${e.message || e}`)
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
