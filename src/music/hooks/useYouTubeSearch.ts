import { useState, useCallback, useRef } from "react"
import type { Track } from "../types"

interface UseYouTubeSearchReturn {
  results: Track[]
  loading: boolean
  error: string | null
  search: (query: string) => Promise<void>
}

const CACHE_KEY = "streamhub-youtube-search-cache"
const CACHE_TTL = 24 * 60 * 60 * 1000
const UNAVAILABLE = "Busca do YouTube indisponível no momento. Tente de novo em instantes."

const PIPED_FALLBACKS = [
  "https://api.piped.private.coffee",
  "https://pipedapi.reallyaweso.me",
  "https://pipedapi.leptons.xyz",
]

interface CachedResult {
  data: Track[]
  timestamp: number
}

function getCachedResults(query: string): Track[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: Record<string, CachedResult> = JSON.parse(raw)
    const key = query.toLowerCase().trim()
    const entry = cache[key]
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      delete cache[key]
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setCachedResults(query: string, data: Track[]) {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const cache: Record<string, CachedResult> = raw ? JSON.parse(raw) : {}
    const key = query.toLowerCase().trim()
    cache[key] = { data, timestamp: Date.now() }
    const keys = Object.keys(cache)
    if (keys.length > 50) {
      const oldest = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)
      for (let i = 0; i < keys.length - 50; i++) {
        delete cache[oldest[i]]
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore
  }
}

function videoIdFromPipedUrl(url: string): string | null {
  const match = String(url).match(/[?&]v=([\w-]{11})/) || String(url).match(/([\w-]{11})$/)
  return match?.[1] || null
}

function tracksFromPiped(data: unknown): Track[] {
  const root = data as { items?: unknown[] }
  const items = Array.isArray(root?.items) ? root.items : Array.isArray(data) ? data : []
  const tracks: Track[] = []
  for (const raw of items) {
    const item = raw as { type?: string; url?: string; title?: string; uploaderName?: string; id?: string }
    if (item.type && item.type !== "stream") continue
    const videoId = item.id || videoIdFromPipedUrl(item.url || "")
    if (!videoId) continue
    tracks.push({
      id: `yt-${videoId}`,
      title: item.title || "Sem título",
      artist: item.uploaderName || "YouTube",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      source: "youtube",
      streamUrl: `https://www.youtube.com/watch?v=${videoId}`,
      platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
    })
    if (tracks.length >= 20) break
  }
  return tracks
}

async function searchViaApi(query: string, signal: AbortSignal): Promise<Track[] | null> {
  const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`, { signal })
  if (!res.ok) return null
  const json = (await res.json()) as { tracks?: Track[] }
  return Array.isArray(json.tracks) && json.tracks.length > 0 ? json.tracks : null
}

async function searchViaPiped(query: string, signal: AbortSignal): Promise<Track[] | null> {
  for (const api of PIPED_FALLBACKS) {
    try {
      const res = await fetch(
        `${api}/search?q=${encodeURIComponent(query)}&filter=videos`,
        { signal, headers: { Accept: "application/json" } },
      )
      if (!res.ok) continue
      const tracks = tracksFromPiped(await res.json())
      if (tracks.length) return tracks
    } catch {
      continue
    }
  }
  return null
}

export function useYouTubeSearch(): UseYouTubeSearchReturn {
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return

    const requestId = ++requestIdRef.current
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    const cached = getCachedResults(query)
    if (cached) {
      setResults(cached)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fromApi = await searchViaApi(query, abort.signal)
      if (requestId !== requestIdRef.current) return
      if (fromApi?.length) {
        setCachedResults(query, fromApi)
        setResults(fromApi)
        setLoading(false)
        return
      }

      const fromPiped = await searchViaPiped(query, abort.signal)
      if (requestId !== requestIdRef.current) return
      if (fromPiped?.length) {
        setCachedResults(query, fromPiped)
        setResults(fromPiped)
        setLoading(false)
        return
      }

      setResults([])
      setError(UNAVAILABLE)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      if ((err as { name?: string })?.name === "AbortError") return
      setResults([])
      setError(UNAVAILABLE)
    }

    if (requestId === requestIdRef.current) setLoading(false)
  }, [])

  return { results, loading, error, search }
}
