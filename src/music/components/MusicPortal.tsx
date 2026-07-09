import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { Music, Keyboard, Radio, ListMusic, Headphones, Globe, Heart, Disc3, AudioLines } from "lucide-react"
import YouTubeSearch from "./YouTubeSearch"
import InternetRadio from "./InternetRadio"
import MyPlaylists from "./MyPlaylists"
import MusicPlayer from "./MusicPlayer"
import { MusicProvider } from "../MusicContext"
import { motion, AnimatePresence } from "framer-motion"
import type { MusicSource } from "../types"

type MusicTab = MusicSource | "playlists"

const TABS: { id: MusicTab; label: string; icon: typeof Music; hint: string }[] = [
  { id: "youtube", label: "YouTube Music", icon: Headphones, hint: "Busque e toque" },
  { id: "radio", label: "Rádio Online", icon: Radio, hint: "Estações globais" },
  { id: "playlists", label: "Minhas Playlists", icon: ListMusic, hint: "Filas salvas" },
]

const stats = [
  { label: "Estações de Rádio", value: "45K+", icon: Radio, gradient: "from-cyan-500/20 to-blue-500/20", iconColor: "text-cyan-400", glow: "shadow-cyan-500/10" },
  { label: "Países", value: "200+", icon: Globe, gradient: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400", glow: "shadow-emerald-500/10" },
  { label: "Grátis para Sempre", value: "100%", icon: Heart, gradient: "from-pink-500/20 to-rose-500/20", iconColor: "text-pink-400", glow: "shadow-pink-500/10" },
]

function MusicPortalContent() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [activeTab, setActiveTab] = useState<MusicTab>("youtube")
  const [showShortcuts, setShowShortcuts] = useState(false)

  const mutedText = isDark ? "text-slate-400" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"

  return (
    <div className="relative flex flex-col gap-6 pb-24 min-h-screen">
      {/* Cinematic Ambient Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px] animate-[blob_8s_ease-in-out_infinite]" />
        <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-pink-500/12 blur-[100px] animate-[blob_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-40 left-1/3 w-64 h-64 rounded-full bg-indigo-500/10 blur-[90px] animate-[blob_12s_ease-in-out_infinite_2s]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--tw-gradient-to,transparent)]" />
      </div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-2xl p-5 sm:p-7 ${
          isDark
            ? "bg-white/[0.03] border-white/[0.08] shadow-2xl shadow-purple-900/10"
            : "bg-white/80 border-slate-200/80 shadow-xl shadow-slate-900/5"
        }`}
      >
        {/* Hero inner gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/[0.06] via-transparent to-pink-500/[0.04]" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Animated Icon */}
            <motion.div
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shrink-0 shadow-xl shadow-purple-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Disc3 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-sm" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AudioLines className="w-4 h-4 text-purple-400" />
                <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] ${mutedText}`}>
                  StreamHub Música
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Música
              </h1>
              <p className={`mt-2 max-w-xl text-sm sm:text-base leading-relaxed ${mutedText}`}>
                Search YouTube Music, browse 45,000+ internet radio stations worldwide — all free, no login required.
              </p>

              {/* Feature Chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "YouTube", gradient: "from-red-500/25 to-red-600/15", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
                  { label: "Radio", gradient: "from-cyan-500/25 to-blue-500/15", text: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-400" },
                  { label: "Playlists", gradient: "from-fuchsia-500/25 to-purple-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/20", dot: "bg-fuchsia-400" },
                ].map((chip) => (
                  <motion.span
                    key={chip.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${chip.gradient} ${chip.text} ${chip.border}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                    {chip.label}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm ${
                isDark
                  ? "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]"
                  : "bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 border border-slate-200/80"
              }`}
              title="Atalhos de teclado"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Atalhos
            </motion.button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className={`relative mt-5 pt-4 border-t ${isDark ? "border-white/[0.06]" : "border-slate-200/60"}`}>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0 border border-white/[0.06]`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm sm:text-base font-bold leading-tight ${strongText}`}>{stat.value}</p>
                  <p className={`text-[10px] sm:text-[11px] font-medium truncate ${mutedText}`}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos de Teclado Panel */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-2xl border backdrop-blur-xl ${
                isDark ? "bg-white/[0.04] border-white/[0.06]" : "bg-slate-50/80 border-slate-200/80"
              }`}>
                <p className={`text-xs font-bold mb-3 uppercase tracking-wider ${mutedText}`}>Atalhos de Teclado</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    { key: "Space", action: "Reproduzir / Pausar" },
                    { key: "←", action: "Voltar 10s" },
                    { key: "→", action: "Avançar 10s" },
                    { key: "Shift+←", action: "Anterior" },
                    { key: "Shift+→", action: "Próxima" },
                    { key: "↑↓", action: "Volume" },
                    { key: "M", action: "Mudo" },
                    { key: "S", action: "Aleatório" },
                    { key: "R", action: "Repetir" },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <kbd className={`inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-mono font-bold ${
                        isDark ? "bg-white/10 text-white border border-white/10" : "bg-slate-200/80 text-slate-700 border border-slate-300/80"
                      }`}>
                        {s.key}
                      </kbd>
                      <span className={`text-[10px] font-medium ${mutedText}`}>{s.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Tab Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={`flex gap-1.5 p-1.5 rounded-2xl backdrop-blur-xl border ${
          isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-100/80 border-slate-200/80"
        }`}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 sm:gap-2.5 py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl transition-all duration-300 ${
                isActive
                  ? isDark
                    ? "text-white"
                    : "text-slate-900"
                  : isDark
                    ? "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
              }`}
              whileTap={{ scale: 0.97 }}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className={`absolute inset-0 rounded-xl border ${
                    isDark
                      ? "bg-gradient-to-r from-purple-500/20 via-fuchsia-500/15 to-pink-500/20 border-purple-400/20 shadow-lg shadow-purple-500/10"
                      : "bg-white border-slate-200 shadow-md"
                  }`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <tab.icon className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? (isDark ? "text-purple-300" : "text-purple-600") : ""}`} />
              <span className="relative z-10 flex flex-col items-start min-w-0">
                <span className={`text-[11px] sm:text-sm font-semibold truncate ${isActive ? (isDark ? "text-white" : "text-slate-900") : ""}`}>
                  {tab.label}
                </span>
                <span className={`hidden sm:block text-[10px] truncate ${isActive ? "opacity-70" : "opacity-50"}`}>
                  {tab.hint}
                </span>
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === "youtube" && <YouTubeSearch />}
          {activeTab === "radio" && <InternetRadio />}
          {activeTab === "playlists" && <MyPlaylists />}
        </motion.div>
      </AnimatePresence>

      <MusicPlayer />
    </div>
  )
}

export default function MusicPortal() {
  return (
    <MusicProvider>
      <MusicPortalContent />
    </MusicProvider>
  )
}
