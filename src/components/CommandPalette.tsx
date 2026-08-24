import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Fuse from "fuse.js"
import {
  Clapperboard,
  CornerDownLeft,
  Home,
  Info,
  KeyRound,
  Loader2,
  Music,
  Search,
  Trophy,
  Tv,
  TvMinimalPlay,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useCatalogStore } from "../stores/catalog"
import { useCommandPaletteStore } from "../stores/commandPalette"
import { pathForTab, type Tab } from "../routes"
import type { M3UChannel } from "../types"

interface NavCommand {
  kind: "nav"
  id: Tab
  label: string
  hint: string
  icon: typeof Home
}

const NAV_COMMANDS: NavCommand[] = [
  { kind: "nav", id: "home", label: "Início", hint: "Página inicial", icon: Home },
  { kind: "nav", id: "iptv", label: "Transmissões ao Vivo", hint: "Canais fixos", icon: Tv },
  { kind: "nav", id: "catalog", label: "Canais IPTV", hint: "Catálogo completo", icon: TvMinimalPlay },
  { kind: "nav", id: "mylist", label: "Minhas Séries", hint: "Sua playlist", icon: KeyRound },
  { kind: "nav", id: "plex", label: "Plex", hint: "Seu servidor", icon: Clapperboard },
  { kind: "nav", id: "sports", label: "Esportes ao Vivo", hint: "Partidas de hoje", icon: Trophy },
  { kind: "nav", id: "music", label: "Música", hint: "Rádio e YouTube", icon: Music },
  { kind: "nav", id: "about", label: "Sobre", hint: "Informações do projeto", icon: Info },
]

type ChannelCommand = { kind: "channel"; channel: M3UChannel }
type Command = NavCommand | ChannelCommand

const MAX_CHANNEL_RESULTS = 8

export default function CommandPalette() {
  const open = useCommandPaletteStore(s => s.open)
  const query = useCommandPaletteStore(s => s.query)
  const setQuery = useCommandPaletteStore(s => s.setQuery)
  const toggle = useCommandPaletteStore(s => s.toggle)
  const closeStore = useCommandPaletteStore(s => s.close)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const channels = useCatalogStore(s => s.channels)
  const status = useCatalogStore(s => s.status)
  const load = useCatalogStore(s => s.load)
  const setActiveChannel = useCatalogStore(s => s.setActiveChannel)

  // Every dismissal goes through here so the query never survives a close.
  const close = useCallback(() => {
    closeStore()
    setActiveIndex(0)
  }, [closeStore])

  // Ctrl+K / Cmd+K from anywhere, Esc to dismiss.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        toggle()
      }
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [close, toggle])

  // Opening the palette warms the catalog. `load` is idempotent, so this is a
  // no-op if the catalog page already fetched it.
  useEffect(() => {
    if (open) load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    // Autofocus after the entry animation has started so the caret doesn't jump.
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  // Fuse over channel names only — 4k entries, rebuilt when the catalog loads.
  const fuse = useMemo(
    () =>
      new Fuse(channels, {
        keys: ["name", "category"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [channels]
  )

  const navResults = useMemo(() => {
    if (!query.trim()) return NAV_COMMANDS
    const q = query.toLowerCase()
    return NAV_COMMANDS.filter(
      c => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)
    )
  }, [query])

  const channelResults = useMemo(() => {
    if (!query.trim()) return []
    return fuse
      .search(query, { limit: MAX_CHANNEL_RESULTS })
      .map(r => ({ kind: "channel" as const, channel: r.item }))
  }, [fuse, query])

  const commands: Command[] = useMemo(
    () => [...navResults, ...channelResults],
    [navResults, channelResults]
  )

  // Reset the highlight while rendering the new query's results, rather than in
  // an effect that would briefly highlight the wrong row.
  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  const runCommand = useCallback(
    (command: Command) => {
      close()
      if (command.kind === "nav") {
        navigate(pathForTab(command.id))
        return
      }
      // The catalog page reads activeChannel straight from the store.
      setActiveChannel(command.channel)
      navigate(pathForTab("catalog"))
    },
    [close, navigate, setActiveChannel]
  )

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => (commands.length ? (i + 1) % commands.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => (commands.length ? (i - 1 + commands.length) % commands.length : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const command = commands[activeIndex]
      if (command) runCommand(command)
    }
  }

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    active?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const surface = isDark
    ? "bg-dark-300/95 border-white/10"
    : "bg-white/95 border-slate-200"
  const muted = isDark ? "text-dark-100" : "text-slate-500"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca rápida"
            className={`relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${surface}`}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className={`flex items-center gap-3 border-b px-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <Search className={`h-4 w-4 shrink-0 ${muted}`} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Buscar canais ou ir para uma seção..."
                className="w-full bg-transparent py-4 text-sm text-text-primary outline-none placeholder:text-slate-500"
              />
              {status === "loading" && <Loader2 className={`h-4 w-4 shrink-0 animate-spin ${muted}`} />}
            </div>

            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {commands.length === 0 && (
                <p className={`px-3 py-6 text-center text-sm ${muted}`}>
                  {status === "loading"
                    ? "Carregando o catálogo..."
                    : `Nenhum resultado para "${query}"`}
                </p>
              )}

              {navResults.length > 0 && (
                <Group label="Ir para" muted={muted}>
                  {navResults.map((command, i) => (
                    <Row
                      key={command.id}
                      index={i}
                      active={activeIndex === i}
                      isDark={isDark}
                      muted={muted}
                      onSelect={() => runCommand(command)}
                      onHover={() => setActiveIndex(i)}
                      icon={<command.icon className="h-4 w-4" />}
                      title={command.label}
                      subtitle={command.hint}
                    />
                  ))}
                </Group>
              )}

              {channelResults.length > 0 && (
                <Group label="Canais" muted={muted}>
                  {channelResults.map((command, i) => {
                    const index = navResults.length + i
                    return (
                      <Row
                        key={`${command.channel.url}-${index}`}
                        index={index}
                        active={activeIndex === index}
                        isDark={isDark}
                        muted={muted}
                        onSelect={() => runCommand(command)}
                        onHover={() => setActiveIndex(index)}
                        icon={
                          command.channel.logo ? (
                            <img
                              src={command.channel.logo}
                              alt=""
                              className="h-4 w-4 rounded object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <Tv className="h-4 w-4" />
                          )
                        }
                        title={command.channel.name}
                        subtitle={command.channel.category}
                      />
                    )
                  })}
                </Group>
              )}
            </div>

            <div
              className={`flex items-center justify-between border-t px-4 py-2 text-[11px] ${muted} ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> para abrir
              </span>
              <span>↑ ↓ para navegar · Esc para fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Group({
  label,
  muted,
  children,
}: {
  label: string
  muted: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <p className={`px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>
        {label}
      </p>
      {children}
    </div>
  )
}

function Row({
  index,
  active,
  isDark,
  muted,
  onSelect,
  onHover,
  icon,
  title,
  subtitle,
}: {
  index: number
  active: boolean
  isDark: boolean
  muted: string
  onSelect: () => void
  onHover: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  const activeBg = isDark ? "bg-white/10" : "bg-slate-100"
  return (
    <button
      type="button"
      data-index={index}
      onClick={onSelect}
      onMouseMove={onHover}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? activeBg : "hover:bg-white/5"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
        isDark ? "bg-white/5" : "bg-slate-100"
      } text-accent-light`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-text-primary">{title}</span>
        <span className={`block truncate text-xs ${muted}`}>{subtitle}</span>
      </span>
    </button>
  )
}
