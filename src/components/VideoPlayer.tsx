import { useEffect, useRef, useState, useCallback } from "react"
import Hls from "hls.js"
import mpegts from "mpegts.js"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  WifiOff,
  AlertTriangle,
} from "lucide-react"

interface VideoPlayerProps {
  src: string
  title?: string
  fillContainer?: boolean
}

function toProxyUrl(url: string): string {
  if (typeof window === "undefined") return url
  if (window.location.protocol === "file:") return url
  return `/api/iptv-proxy?url=${encodeURIComponent(url)}`
}

// Reconhece links do YouTube e devolve a URL de embed apropriada.
// - vídeo/live por ID  -> embed do vídeo
// - canal (channel/UC...) -> embed do "ao vivo agora" do canal
// Retorna null se não for YouTube.
function youTubeEmbedUrl(src: string): string | null {
  try {
    const u = new URL(src)
    const host = u.hostname.replace(/^www\./, "")
    if (!/youtube\.com$|youtu\.be$/.test(host)) return null

    const base = "https://www.youtube-nocookie.com/embed/"
    const common = "autoplay=1&mute=0&playsinline=1&rel=0"

    // youtu.be/<id>
    if (host === "youtu.be") {
      const id = u.pathname.slice(1)
      return id ? `${base}${id}?${common}` : null
    }
    // youtube.com/live/<id>
    const liveMatch = u.pathname.match(/^\/live\/([\w-]+)/)
    if (liveMatch) return `${base}${liveMatch[1]}?${common}`
    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v")
    if (v) return `${base}${v}?${common}`
    // youtube.com/embed/<id>
    const embedMatch = u.pathname.match(/^\/embed\/([\w-]+)/)
    if (embedMatch) return `${base}${embedMatch[1]}?${common}`
    // youtube.com/channel/<UC...> -> live atual do canal
    const chMatch = u.pathname.match(/^\/channel\/([\w-]+)/)
    if (chMatch) return `${base}live_stream?channel=${chMatch[1]}&${common}`
    return null
  } catch {
    return null
  }
}

export default function VideoPlayer({ src, title, fillContainer = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hlsRef = useRef<Hls | null>(null)
  const mpegtsRef = useRef<ReturnType<typeof mpegts.createPlayer> | null>(null)

  const isHEVC = src.toLowerCase().includes("hvc1") || src.toLowerCase().includes("hev1")
  const ytEmbed = youTubeEmbedUrl(src)

  useEffect(() => {
    if (ytEmbed) return // YouTube usa iframe; não precisa de HLS/mpegts
    const videoMaybe = videoRef.current
    if (!videoMaybe) return
    const media: HTMLVideoElement = videoMaybe

    setLoading(true)
    setError(null)
    hlsRef.current?.destroy()
    hlsRef.current = null
    mpegtsRef.current?.destroy()
    mpegtsRef.current = null

    // Tudo passa pelo proxy: resolve CORS e conteúdo http:// em página https://.
    const isDirectFile =
      /\.(mp4|webm|mov|mkv|avi|ts)(\?|$)/i.test(src) ||
      /\/series\//i.test(src) ||
      /\/movie\//i.test(src)
    const playableSrc = toProxyUrl(src)
    let cancelled = false

    function startHls() {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          startLevel: 0,
          capLevelToPlayerSize: true,
        })
        hlsRef.current = hls
        hls.loadSource(playableSrc)
        hls.attachMedia(media)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false)
          media.play().catch(() => {})
          setPlaying(true)
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            let reason: string
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              reason = data.response?.code
                ? `HTTP ${data.response.code}`
                : "Erro de rede — servidor inacessível ou bloqueado por CORS"
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              if (isHEVC) {
                reason = "HEVC (H.265) codec not supported by this browser"
              } else {
                reason = "Erro de decodificação de mídia"
              }
            } else {
              reason = data.details || "Erro desconhecido"
            }
            setError(`Stream failed: ${reason}`)
            setLoading(false)
          }
        })
      } else if (media.canPlayType("application/vnd.apple.mpegurl")) {
        media.src = playableSrc
        media.addEventListener("loadedmetadata", () => setLoading(false))
      } else {
        setError("HLS playback not supported in this browser.")
        setLoading(false)
      }
    }

    function startMpegts() {
      if (!mpegts.isSupported()) {
        setError("Este navegador não suporta reprodução de MPEG-TS ao vivo.")
        setLoading(false)
        return
      }
      let retries = 0
      const buildPlayer = () => {
        const player = mpegts.createPlayer(
          { type: "mpegts", isLive: true, url: playableSrc },
          {
            enableWorker: true,
            liveBufferLatencyChasing: true,
            lazyLoad: false,
            reuseRedirectedURL: true,
          }
        )
        mpegtsRef.current = player
        player.attachMediaElement(media)
        player.load()
        player.on(mpegts.Events.ERROR, (type: string, detail: string) => {
          // Streams ao vivo caem de vez em quando; tenta reconectar até 3x
          if (retries < 3 && !cancelled) {
            retries++
            try {
              player.destroy()
            } catch {
              /* ignore */
            }
            setTimeout(() => {
              if (!cancelled) buildPlayer()
            }, 1200)
            return
          }
          const legivel =
            /network/i.test(type)
              ? "Canal indisponível ou fora do ar no momento."
              : `${type}${detail ? ` — ${detail}` : ""}`
          setError(`Falha na transmissão: ${legivel}`)
          setLoading(false)
        })
        media.addEventListener("loadeddata", () => setLoading(false), { once: true })
        player.play()?.catch(() => {})
        setPlaying(true)
      }
      buildPlayer()
    }

    async function probeAndStart() {
      // Sonda os primeiros bytes: playlist HLS começa com "#EXTM3U";
      // MPEG-TS bruto começa com o sync byte 0x47. Provedores Xtream
      // costumam responder TS cru mesmo em URLs ".m3u8".
      // A sondagem fecha a conexão imediatamente após ler o primeiro chunk,
      // para não ocupar uma das (poucas) conexões simultâneas da conta.
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 15000)
        const res = await fetch(playableSrc, { signal: controller.signal })
        if (!res.ok) {
          clearTimeout(timer)
          controller.abort()
          if (!cancelled) {
            setError(
              res.status === 502 || res.status === 504
                ? "Falha na transmissão: canal indisponível ou fora do ar."
                : `Falha na transmissão: HTTP ${res.status}`
            )
            setLoading(false)
          }
          return
        }
        const ct = res.headers.get("content-type") || ""
        const reader = res.body?.getReader()
        const { value } = (await reader?.read()) ?? {}
        // Encerra a conexão de sondagem antes de abrir a de reprodução
        await reader?.cancel().catch(() => {})
        controller.abort()
        clearTimeout(timer)
        if (cancelled) return

        const head = value ? new TextDecoder().decode(value.slice(0, 16)) : ""
        const isTs = (value && value[0] === 0x47) || /video\/mp2t/i.test(ct)
        // Pequena pausa para o provedor liberar a conexão de sondagem
        await new Promise((r) => setTimeout(r, 300))
        if (cancelled) return
        if (head.startsWith("#EXTM3U")) startHls()
        else if (isTs) startMpegts()
        else startHls() // fallback: deixa o HLS.js tentar e reportar o erro
      } catch (e) {
        if (cancelled) return
        if ((e as Error)?.name === "AbortError") {
          setError("Falha na transmissão: tempo esgotado ao conectar ao canal.")
          setLoading(false)
        } else {
          startHls()
        }
      }
    }

    // Canais ao vivo de provedores Xtream seguem o padrão /live/user/pass/id.
    // Eles entregam MPEG-TS bruto (mesmo em URLs ".m3u8") — vão direto ao mpegts.js,
    // sem sondagem (que consumiria uma conexão simultânea e às vezes classifica errado).
    const isXtreamLive = /\/live\//i.test(src) || /[?&]type=live/i.test(src)

    if (isDirectFile) {
      media.src = playableSrc
      media.addEventListener("loadedmetadata", () => setLoading(false))
    } else if (isXtreamLive) {
      startMpegts()
    } else {
      probeAndStart()
    }

    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
      mpegtsRef.current?.destroy()
      mpegtsRef.current = null
      media.src = ""
    }
  }, [src, isHEVC, ytEmbed])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
    setPlaying(!videoRef.current.paused)
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }, [])

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (!videoRef.current) return
    videoRef.current.volume = v
    videoRef.current.muted = v === 0
    setVolume(v)
    setMuted(v === 0)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
    setDuration(v.duration)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    if (v?.duration) v.currentTime = pos * v.duration
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000) as unknown as ReturnType<typeof setTimeout>
  }, [playing])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`
  }

  if (ytEmbed) {
    return (
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden bg-black shadow-2xl ${
          fillContainer ? "h-full" : "aspect-video"
        }`}
      >
        <iframe
          src={ytEmbed}
          title={title || "YouTube"}
          className="w-full h-full"
          style={fillContainer ? undefined : { aspectRatio: "16 / 9" }}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          frameBorder="0"
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative group rounded-2xl overflow-hidden bg-black shadow-2xl ${
        fillContainer ? "h-full" : ""
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className={`w-full object-contain cursor-pointer ${
          fillContainer ? "h-full" : "aspect-video"
        }`}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setLoading(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
        webkit-playsinline="true"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-accent-light animate-spin mx-auto mb-3" />
            <p className="text-sm text-dark-100">Carregando transmissão...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-8 max-w-md">
            {isHEVC && error.includes("HEVC") ? (
              <AlertTriangle className="w-12 h-12 text-sport-yellow mx-auto mb-4" />
            ) : (
              <WifiOff className="w-8 h-8 text-sport-red mx-auto mb-4" />
            )}
            <p className="text-lg font-semibold text-white mb-2">Erro na Transmissão</p>
            <p className="text-sm text-dark-100 break-words">{error}</p>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-3 sm:px-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Seek bar — taller on mobile for easier tapping */}
        <div className="h-1.5 sm:h-1 bg-white/20 rounded-full cursor-pointer mb-3 sm:mb-4 group/progress min-h-[12px] sm:min-h-0 flex items-center" onClick={handleSeek}>
          <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full relative w-full" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-3 sm:h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 sm:group-hover/progress:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play button — larger on mobile */}
            <button onClick={togglePlay} className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              {playing ? <Pause className="w-5 h-5 sm:w-4 sm:h-4 text-white" /> : <Play className="w-5 h-5 sm:w-4 sm:h-4 text-white ml-0.5" />}
            </button>

            {/* Volume — slider hidden on mobile, mute toggle always visible */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolume} className="hidden sm:block w-20 h-1 accent-accent cursor-pointer" />
            </div>

            <span className="text-[11px] sm:text-xs text-white/60 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <button onClick={toggleFullscreen} className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            {fullscreen ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {title && (
        <div className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            {title}
            {isHEVC && <span className="px-1.5 py-0.5 text-[10px] bg-sport-yellow/20 text-sport-yellow rounded">HEVC</span>}
          </h3>
        </div>
      )}
    </div>
  )
}
