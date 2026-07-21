import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Tv,
  Radio,
  Play,
  Signal,
  Zap,
  CircleDot,
  Clock,
  X,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useLiveStream } from "../context/LiveStreamContext"
import VideoPlayer from "./VideoPlayer"
import SportsPlayer from "./SportsPlayer"
import type { StreamSource } from "./SportsPlayer"
import type { Channel } from "../types"

const channels: Channel[] = [
  {
    id: "tv-globo-rj",
    name: "TV Globo (RJ)",
    url: "http://45.190.28.50/GLOBO_HD/index.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "caze-tv",
    name: "Cazé TV",
    url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "record-news",
    name: "Record News",
    url: "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "sbt-interior",
    name: "SBT Interior",
    url: "https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "telecine-action",
    name: "Telecine Action",
    url: "http://45.162.231.38:7779/Telecine_Action/index.m3u8",
    category: "Filmes",
    quality: "HD",
  },
  {
    id: "telecine-premium",
    name: "Telecine Premium",
    url: "http://45.162.231.38:7779/Telecine_Premium/index.m3u8",
    category: "Filmes",
    quality: "HD",
  },
  {
    id: "telecine-pipoca",
    name: "Telecine Pipoca",
    url: "http://45.162.231.38:7779/Telecine_Pipoca/index.m3u8",
    category: "Filmes",
    quality: "HD",
  },
  {
    id: "tv-aparecida",
    name: "TV Aparecida",
    url: "https://cdn.jmvstream.com/w/LVW-9716/LVW9716_HbtQtezcaw/playlist.m3u8",
    category: "Brasil",
    quality: "FHD",
  },
  {
    id: "tv-cancao-nova",
    name: "TV Canção Nova",
    url: "https://5c65286fc6ace.streamlock.net/cancaonova/CancaoNova.stream_720p/playlist.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "rede-vida",
    name: "Rede Vida",
    url: "http://45.162.231.38:7779/Rede_Vida/index.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "band",
    name: "Band",
    url: "http://45.190.28.50/BAND_HD/index.m3u8",
    category: "Brasil",
    quality: "HD",
  },
  {
    id: "jovem-pan-news",
    name: "Jovem Pan News",
    url: "https://www.youtube.com/channel/UCP391YRAjSOdM_bwievgaZA",
    category: "Brasil",
    quality: "FHD",
  },
  {
    id: "cnn-brasil",
    name: "CNN Brasil",
    url: "https://www.youtube.com/@CNNbrasil",
    category: "Brasil",
    quality: "FHD",
  },
  {
    id: "band-jornalismo",
    name: "BandNews TV",
    url: "https://www.youtube.com/@bandjornalismo",
    category: "Brasil",
    quality: "FHD",
  },
  {
    id: "tv-cultura",
    name: "TV Cultura",
    url: "https://www.youtube.com/@tvcultura",
    category: "Brasil",
    quality: "FHD",
  },
  {
    id: "redetv-news",
    name: "RedeTV News",
    url: "https://www.youtube.com/@redetv",
    category: "Brasil",
    quality: "FHD",
  },
]

function getQualityColor(q: string, isDark: boolean) {
  switch (q) {
    case "FHD":
      return isDark
        ? "bg-sport-green/20 text-sport-green border-sport-green/30"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "HD":
      return isDark
        ? "bg-accent/20 text-accent-light border-accent/30"
        : "bg-violet-50 text-violet-700 border-violet-200"
    case "SD":
      return isDark
        ? "bg-white/5 text-dark-100 border-white/10"
        : "bg-slate-100 text-slate-500 border-slate-200"
    default:
      return isDark
        ? "bg-white/5 text-dark-100 border-white/10"
        : "bg-slate-100 text-slate-500 border-slate-200"
  }
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
}

const heroVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
}
const heroExit = { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }

export default function LiveStreams() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { liveMatch } = useLiveStream()
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0])
  const [filter, setFilter] = useState<string>("All")
  const [watchingLive, setWatchingLive] = useState(false)
  const [dismissedNotification, setDismissedNotification] = useState(false)
  const [activeSource, setActiveSource] = useState<StreamSource | null>(null)
  const [, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoPlayRef = useRef(false)

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 60000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  useEffect(() => {
    if (liveMatch && !watchingLive && !autoPlayRef.current) {
      autoPlayRef.current = true
      setWatchingLive(true)
    }
    if (!liveMatch) {
      autoPlayRef.current = false
    }
  }, [liveMatch, watchingLive])

  const prevMatchIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (liveMatch && liveMatch.id !== prevMatchIdRef.current) {
      prevMatchIdRef.current = liveMatch.id
      setDismissedNotification(false)
      setActiveSource(liveMatch.sources[0] || null)
    }
  }, [liveMatch])

  const now = useMemo(() => Date.now(), []) // eslint-disable-line react-hooks/exhaustive-deps

  const matchStatus = useMemo(() => {
    if (!liveMatch) return null
    const diff = liveMatch.date - now
    if (diff <= 0) return { isLive: true, countdown: null }
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return {
      isLive: false,
      countdown: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
    }
  }, [liveMatch, now])

  const filtered = useMemo(
    () => (filter === "All" ? channels : channels.filter((c) => c.category === filter)),
    [filter]
  )

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const ch of channels) {
      map.set(ch.category, (map.get(ch.category) || 0) + 1)
    }
    return map
  }, [])

  return (
    <div className="flex flex-col xl:h-full">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${isDark ? "bg-accent/20" : "bg-accent/10"}`}>
            <Tv className="w-6 h-6 text-accent-light" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Canais IPTV ao Vivo
            </h2>
            <p className={`text-sm ${isDark ? "text-dark-100" : "text-slate-500"}`}>
              Selecione um canal para começar a assistir
            </p>
          </div>
          {liveMatch && matchStatus?.isLive && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sport-green/20 text-sport-green rounded-full border border-sport-green/30"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sport-green animate-pulse" />
              LIVE
            </motion.span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 xl:flex-1 xl:min-h-0">
        {/* Player Section */}
        <div className="xl:col-span-2 flex flex-col min-h-0">
          <div className="aspect-video sm:aspect-[16/9] md:aspect-[3/2] w-full rounded-2xl overflow-hidden bg-black border border-white/5 xl:aspect-auto xl:flex-1 xl:min-h-0 relative">
            {watchingLive && liveMatch ? (
              liveMatch.sources.length > 0 ? (
                <SportsPlayer
                  key={liveMatch.id}
                  sources={liveMatch.sources}
                  activeSource={activeSource}
                  onSourceChange={setActiveSource}
                  title={liveMatch.title}
                  fillContainer
                />
              ) : (
                <VideoPlayer
                  key={liveMatch.id}
                  src={liveMatch.embedUrl}
                  title={liveMatch.title}
                  fillContainer
                />
              )
            ) : (
              <VideoPlayer
                src={activeChannel.url}
                title={`${activeChannel.name} — ${activeChannel.category}`}
                fillContainer
              />
            )}

            {/* Live Match Overlay Notification */}
            <AnimatePresence>
              {liveMatch && matchStatus && !dismissedNotification && !watchingLive && (
                <motion.div
                  key={liveMatch.id}
                  variants={heroVariants}
                  initial="hidden"
                  animate="visible"
                  exit={heroExit}
                  className={`absolute top-3 right-3 z-20 w-[calc(100%-24px)] sm:w-80 rounded-xl border backdrop-blur-xl shadow-2xl ${
                    isDark
                      ? "bg-black/70 border-white/10"
                      : "bg-black/60 border-white/15"
                  }`}
                >
                  <div className="p-3 sm:p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${matchStatus.isLive ? "bg-sport-red/25" : "bg-sport-yellow/25"}`}>
                          <CircleDot className={`w-3 h-3 ${matchStatus.isLive ? "text-sport-red" : "text-sport-yellow"}`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${matchStatus.isLive ? "text-sport-red" : "text-sport-yellow"}`}>
                          {matchStatus.isLive ? "Futebol ao Vivo" : "Próximos Jogos de Futebol"}
                        </span>
                        {matchStatus.isLive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold bg-sport-red/20 text-sport-red rounded">
                            <span className="w-1 h-1 rounded-full bg-sport-red animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setDismissedNotification(true)}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-white mb-2 truncate">
                      {liveMatch.title}
                    </p>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setWatchingLive(true)
                          setDismissedNotification(true)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer ${
                          matchStatus.isLive
                            ? "bg-sport-red hover:bg-sport-red/90"
                            : "bg-sport-yellow hover:bg-sport-yellow/90"
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        {matchStatus.isLive ? "Assistir Agora" : "Criar Lembrete"}
                      </motion.button>
                      {!matchStatus.isLive && matchStatus.countdown && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/50">
                          <Clock className="w-2.5 h-2.5" />
                          {matchStatus.countdown}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tocando Agora Bar */}
          <AnimatePresence mode="wait">
            <motion.div
              key={watchingLive ? `live-${liveMatch?.id}` : `channel-${activeChannel.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl border backdrop-blur-sm transition-colors ${isDark ? "bg-dark-300/30 border-white/5" : "bg-white/80 border-slate-200"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${watchingLive ? "bg-sport-red/20" : isDark ? "bg-accent/20" : "bg-accent/10"}`}>
                    {watchingLive ? (
                      <CircleDot className="w-4 h-4 sm:w-5 sm:h-5 text-sport-red" />
                    ) : (
                      <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-accent-light" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      {watchingLive && liveMatch ? liveMatch.title : activeChannel.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs hidden sm:inline ${isDark ? "text-dark-100" : "text-slate-500"}`}>
                        {watchingLive && liveMatch ? liveMatch.teams.home.name + " vs " + liveMatch.teams.away.name : activeChannel.category}
                      </span>
                      {watchingLive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-sport-red/15 text-sport-red rounded">
                          <span className="w-1 h-1 rounded-full bg-sport-red animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {!watchingLive && (
                        <>
                          <span className={`w-1 h-1 rounded-full hidden sm:block ${isDark ? "bg-dark-100" : "bg-slate-400"}`} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getQualityColor(activeChannel.quality, isDark)}`}>
                            {activeChannel.quality}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <Signal className="w-3.5 h-3.5 text-sport-green" />
                  <span className="text-sport-green font-medium hidden sm:inline">Conectado</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col min-h-0">
          <div className="relative mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-4 h-4 ${isDark ? "text-dark-100" : "text-slate-400"}`} />
              <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Canais
              </h3>
              <span className={`text-xs ${isDark ? "text-dark-100" : "text-slate-400"}`}>
                ({channels.length})
              </span>
            </div>
            <div className="relative">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide pr-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("All")}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                    filter === "All"
                      ? "bg-accent text-white shadow-lg shadow-accent/25"
                      : isDark
                        ? "bg-white/5 text-dark-100 hover:text-white hover:bg-white/10"
                        : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  All
                </motion.button>
                {Array.from(categoryCounts.entries()).map(([cat, count]) => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(cat)}
                    className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                      filter === cat
                        ? "bg-accent text-white shadow-lg shadow-accent/25"
                        : isDark
                          ? "bg-white/5 text-dark-100 hover:text-white hover:bg-white/10"
                          : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                    <span className="ml-1 opacity-50">{count}</span>
                  </motion.button>
                ))}
              </div>
              <div
                className={`pointer-events-none absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l to-transparent ${
                  isDark ? "from-dark-500" : "from-[var(--surface-500,#f8fafc)]"
                }`}
              />
            </div>
          </div>

          <div className="max-h-[46vh] xl:max-h-none xl:flex-1 overflow-y-auto space-y-1.5 pr-1 pb-1">
            {liveMatch && matchStatus && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setWatchingLive(true)}
                className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ${
                  watchingLive
                    ? isDark
                      ? "border-sport-red/50 bg-sport-red/10 shadow-lg shadow-sport-red/10"
                      : "border-sport-red/30 bg-sport-red/5 shadow-md shadow-sport-red/10"
                    : isDark
                      ? "border-sport-red/20 bg-sport-red/5 hover:border-sport-red/30 hover:bg-sport-red/10"
                      : "border-sport-red/20 bg-red-50 hover:border-sport-red/30 hover:bg-red-50/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-sport-red/20">
                    <CircleDot className="w-5 h-5 text-sport-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-sport-red">
                        {liveMatch.teams.home.name} vs {liveMatch.teams.away.name}
                      </p>
                      {matchStatus.isLive ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-sport-red/15 text-sport-red rounded shrink-0">
                          <span className="w-1 h-1 rounded-full bg-sport-red animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-sport-yellow/15 text-sport-yellow rounded shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {matchStatus.countdown}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${isDark ? "text-dark-100" : "text-slate-500"}`}>
                        {liveMatch.title}
                      </span>
                      {liveMatch.viewers > 0 && (
                        <span className={`text-[10px] ${isDark ? "text-dark-100" : "text-slate-400"}`}>
                          {liveMatch.viewers} viewers
                        </span>
                      )}
                    </div>
                  </div>
                  {watchingLive && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Play className="w-4 h-4 text-sport-red" />
                      <div className="w-2 h-2 rounded-full bg-sport-red animate-pulse" />
                    </div>
                  )}
                </div>
              </motion.button>
            )}

            <motion.div
              key={filter}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-1.5"
            >
              {filtered.map((channel) => {
                const isActive = !watchingLive && activeChannel.id === channel.id
                return (
                  <motion.button
                    key={channel.id}
                    variants={cardVariants}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveChannel(channel); setWatchingLive(false) }}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ${
                      isActive
                        ? isDark
                          ? "border-accent/50 bg-accent/10 shadow-lg shadow-accent/10"
                          : "border-accent/30 bg-accent/5 shadow-md shadow-accent/10"
                        : isDark
                          ? "border-white/5 bg-dark-300/30 hover:border-white/10 hover:bg-white/5"
                          : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isActive
                            ? "bg-accent/20 text-accent-light"
                            : isDark
                              ? "bg-white/5 text-dark-100"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Tv className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-accent-light" : isDark ? "text-white" : "text-slate-900"}`}>
                          {channel.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${isDark ? "text-dark-100" : "text-slate-500"}`}>
                            {channel.category}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getQualityColor(channel.quality, isDark)}`}>
                            {channel.quality}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Play className="w-4 h-4 text-accent-light" />
                          <div className="w-2 h-2 rounded-full bg-sport-green animate-pulse" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
