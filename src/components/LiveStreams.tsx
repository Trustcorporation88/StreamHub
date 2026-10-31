import { useState, useMemo, useEffect, useRef, type CSSProperties } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Signal,
  CircleDot,
  Clock,
  X,
  ExternalLink,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useLiveStream } from "../context/LiveStreamContext"
import VideoPlayer from "./VideoPlayer"
import SportsPlayer from "./SportsPlayer"
import type { StreamSource } from "./SportsPlayer"
import type { Channel } from "../types"
import { GLOBO_RJ_OFFICIAL_URL, getOfficialWatchInfo, isYouTubeWatchUrl } from "../lib/officialWatch"
import fallbackChannels from "../data/channels.json"

const GLOBO_CHANNEL_ID = "tv-globo"

/**
 * Lista embutida no bundle. Serve como estado inicial (a grade aparece sem
 * esperar rede) e como rede de seguranca se /api/channels falhar. A lista
 * publicada vem do Airtable, servida pelo proprio servidor em /api/channels.
 */
const FALLBACK_CHANNELS = fallbackChannels as Channel[]

function isChannelList(value: unknown): value is Channel[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      c =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Channel).id === "string" &&
        typeof (c as Channel).name === "string" &&
        typeof (c as Channel).url === "string"
    )
  )
}


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

const heroVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
}
const heroExit = { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }

const LAST_CHANNEL_KEY = "seligaaqui-last-channel"

function channelInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
  return letters.join("").toUpperCase()
}

function ChannelPoster({
  channel,
  isActive,
  isDark,
  onSelect,
}: {
  channel: Channel
  isActive: boolean
  isDark: boolean
  onSelect: (channel: Channel) => void
}) {
  const [broken, setBroken] = useState(false)
  const opensOutside = channel.id === GLOBO_CHANNEL_ID
  return (
    <button
      type="button"
      onClick={() => onSelect(channel)}
      aria-current={isActive ? "true" : undefined}
      aria-label={opensOutside ? `${channel.name}, abre no Globoplay` : channel.name}
      className="min-w-0 w-full text-left"
    >
      <div
        className={`relative aspect-video overflow-hidden rounded-md bg-zinc-950 shadow-lg transition duration-200 hover:ring-white/30 ${
          isActive
            ? isDark
              ? "ring-2 ring-white"
              : "ring-2 ring-slate-900"
            : "ring-1 ring-white/10"
        }`}
      >
        {channel.logo && !broken ? (
          <img
            src={channel.logo}
            alt=""
            className="absolute inset-0 m-auto h-[58%] w-[72%] object-contain"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tracking-wide text-white/80">
            {channelInitials(channel.name)}
          </span>
        )}
        {isActive && <span className="absolute inset-x-0 bottom-0 h-1 bg-sport-red" />}
        {opensOutside && (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            <ExternalLink className="h-2.5 w-2.5" />
            Globoplay
          </span>
        )}
      </div>
      <p
        className={`mt-2 truncate text-sm font-semibold ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        {channel.name}
      </p>
      <p className={`truncate text-xs ${isDark ? "text-white/45" : "text-slate-500"}`}>
        {opensOutside ? "Abre no Globoplay" : channel.category}
        <span className="mx-1">·</span>
        {channel.quality}
      </p>
    </button>
  )
}

function ChannelShelf({
  channels,
  activeId,
  watchingLive,
  isDark,
  onSelect,
}: {
  channels: Channel[]
  activeId: string
  watchingLive: boolean
  isDark: boolean
  onSelect: (channel: Channel) => void
}) {
  const columns = Math.max(1, Math.ceil(channels.length / 2))
  return (
    <section aria-label="Canais">
      <div
        className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:[grid-template-columns:repeat(var(--channel-cols),minmax(0,1fr))]"
        style={{ "--channel-cols": columns } as CSSProperties}
      >
        {channels.map((channel) => (
          <ChannelPoster
            key={channel.id}
            channel={channel}
            isActive={!watchingLive && activeId === channel.id}
            isDark={isDark}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

function firstPlayableChannel(list: Channel[]): Channel {
  return list.find((channel) => channel.id !== GLOBO_CHANNEL_ID) ?? list[0]
}

function readLastChannel(list: Channel[]): Channel {
  try {
    const id = localStorage.getItem(LAST_CHANNEL_KEY)
    return list.find((channel) => channel.id === id && channel.id !== GLOBO_CHANNEL_ID) ?? firstPlayableChannel(list)
  } catch {
    return firstPlayableChannel(list)
  }
}

export default function LiveStreams() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { liveMatch } = useLiveStream()
  const [channels, setChannels] = useState<Channel[]>(FALLBACK_CHANNELS)
  const [activeChannel, setActiveChannel] = useState<Channel>(() => readLastChannel(FALLBACK_CHANNELS))
  const [attempt, setAttempt] = useState(0)
  const [watchingLive, setWatchingLive] = useState(false)
  const officialInfo = !watchingLive ? getOfficialWatchInfo(activeChannel.url) : null
  const playsYouTubeHere =
    isYouTubeWatchUrl(activeChannel.url) ||
    (officialInfo ? isYouTubeWatchUrl(officialInfo.href) : false)
  const officialWatch = officialInfo && !playsYouTubeHere ? officialInfo : null
  const [dismissedNotification, setDismissedNotification] = useState(false)
  const [activeSource, setActiveSource] = useState<StreamSource | null>(null)
  const autoPlayRef = useRef(false)

  useEffect(() => {
    if (liveMatch && !watchingLive && !autoPlayRef.current) {
      autoPlayRef.current = true
      setWatchingLive(true)
    }
    if (!liveMatch) {
      autoPlayRef.current = false
    }
  }, [liveMatch, watchingLive])

  // Lista publicada (Airtable). Chega depois do primeiro paint e substitui a
  // lista embutida. Qualquer falha mantém o fallback — a grade nunca fica vazia.
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/channels", { signal: controller.signal })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { channels?: unknown }) => {
        const list = data.channels
        if (!isChannelList(list)) return
        setChannels(list)
        // Mantém o canal em exibição se ele ainda existir na lista nova.
        setActiveChannel(prev => list.find(c => c.id === prev.id) ?? readLastChannel(list))
      })
      .catch(() => {
        /* fallback embutido já está na tela */
      })
    return () => controller.abort()
  }, [])

  const prevMatchIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (liveMatch && liveMatch.id !== prevMatchIdRef.current) {
      prevMatchIdRef.current = liveMatch.id
      setDismissedNotification(false)
      setActiveSource(liveMatch.sources[0] || null)
    }
  }, [liveMatch])

  useEffect(() => {
    try {
      localStorage.setItem(LAST_CHANNEL_KEY, activeChannel.id)
    } catch {
      // navegador sem armazenamento
    }
  }, [activeChannel.id])

  const selectChannel = (channel: Channel) => {
    setActiveChannel(channel)
    setWatchingLive(false)
    setAttempt(0)
  }

  const [now, setNow] = useState(() => Date.now())
  // Single minute-tick for every time-dependent bit of this view. Previously
  // there were two clocks: an empty setTick interval that forced a re-render,
  // and a mount-time useMemo for `now` that never updated — so the re-render
  // repainted the same frozen "em 2h 15m" once a minute.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

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

  const playNext = () => {
    const list = channels.filter((channel) => channel.id !== GLOBO_CHANNEL_ID)
    if (list.length === 0) return
    const index = list.findIndex((channel) => channel.id === activeChannel.id)
    const next = list[(index + 1) % list.length]
    if (next) selectChannel(next)
  }

  const openChannel = (channel: Channel) => {
    if (channel.id === GLOBO_CHANNEL_ID) {
      window.location.assign(GLOBO_RJ_OFFICIAL_URL)
      return
    }
    selectChannel(channel)
  }

  return (
    <div className="pb-10">
      <div>
        <p className={`mb-3 text-[11px] font-bold uppercase tracking-[0.22em] ${isDark ? "text-white/45" : "text-slate-500"}`}>
          Canais ao vivo
        </p>

        <div className={`${officialWatch ? "min-h-[420px]" : "mx-auto aspect-video w-full max-w-[calc(48vh*16/9)]"} relative overflow-hidden rounded-xl bg-black shadow-2xl`}>
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
              key={`${activeChannel.id}-${attempt}`}
              src={activeChannel.url}
              title={`${activeChannel.name} — ${activeChannel.category}`}
              fillContainer
              onRetry={() => setAttempt((value) => value + 1)}
              onNext={playNext}
            />
          )}

          <AnimatePresence>
            {liveMatch && matchStatus && !dismissedNotification && !watchingLive && (
              <motion.div
                key={liveMatch.id}
                variants={heroVariants}
                initial="hidden"
                animate="visible"
                exit={heroExit}
                className="absolute top-3 right-3 z-20 w-[calc(100%-24px)] rounded-xl border border-white/10 bg-black/70 shadow-2xl backdrop-blur-xl sm:w-80"
              >
                <div className="p-3 sm:p-3.5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${matchStatus.isLive ? "bg-sport-red/25" : "bg-sport-yellow/25"}`}>
                        <CircleDot className={`h-3 w-3 ${matchStatus.isLive ? "text-sport-red" : "text-sport-yellow"}`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${matchStatus.isLive ? "text-sport-red" : "text-sport-yellow"}`}>
                        {matchStatus.isLive ? "Futebol ao Vivo" : "Próximos Jogos de Futebol"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissedNotification(true)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Fechar aviso"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mb-2 truncate text-sm font-bold text-white">{liveMatch.title}</p>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setWatchingLive(true)
                        setDismissedNotification(true)
                      }}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                        matchStatus.isLive ? "bg-sport-red hover:bg-sport-red/90" : "bg-sport-yellow hover:bg-sport-yellow/90"
                      }`}
                    >
                      <Play className="h-3 w-3" />
                      {matchStatus.isLive ? "Assistir Agora" : "Criar Lembrete"}
                    </motion.button>
                    {!matchStatus.isLive && matchStatus.countdown && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/50">
                        <Clock className="h-2.5 w-2.5" />
                        {matchStatus.countdown}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sport-red">
                <span className="h-1.5 w-1.5 rounded-full bg-sport-red animate-pulse" />
                Ao vivo
              </span>
              {!watchingLive && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getQualityColor(activeChannel.quality, isDark)}`}>
                  {activeChannel.quality}
                </span>
              )}
            </div>
            <h2 className={`truncate text-2xl font-extrabold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>
              {watchingLive && liveMatch ? liveMatch.title : activeChannel.name}
            </h2>
            <p className={`mt-1 truncate text-sm ${isDark ? "text-white/55" : "text-slate-500"}`}>
              {watchingLive && liveMatch
                ? `${liveMatch.teams.home.name} vs ${liveMatch.teams.away.name}`
                : activeChannel.category}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            {!officialWatch ? (
              <>
                <Signal className="h-3.5 w-3.5 text-sport-green" />
                <span className="hidden font-medium text-sport-green sm:inline">No ar</span>
              </>
            ) : (
              <a
                href={officialWatch.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-accent-light hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{officialWatch.provider}</span>
              </a>
            )}
          </div>
        </div>

        {liveMatch && matchStatus && (
          <button
            type="button"
            onClick={() => setWatchingLive(true)}
            className={`mt-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
              watchingLive
                ? "border-sport-red/50 bg-sport-red/10"
                : isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sport-red/20">
              <CircleDot className="h-5 w-5 text-sport-red" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {liveMatch.teams.home.name} vs {liveMatch.teams.away.name}
              </p>
              <p className={`truncate text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}>{liveMatch.title}</p>
            </div>
            {matchStatus.isLive ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-sport-red/15 px-1.5 py-0.5 text-[9px] font-bold text-sport-red">
                <span className="h-1 w-1 rounded-full bg-sport-red animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-sport-yellow/15 px-1.5 py-0.5 text-[9px] font-bold text-sport-yellow">
                <Clock className="h-2.5 w-2.5" />
                {matchStatus.countdown}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="mt-8">
        <ChannelShelf
          channels={channels}
          activeId={activeChannel.id}
          watchingLive={watchingLive}
          isDark={isDark}
          onSelect={openChannel}
        />
      </div>
    </div>
  )
}
