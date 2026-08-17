import type { ComponentType, ReactNode } from "react"
import { motion } from "framer-motion"
import { useTheme } from "../context/ThemeContext"

type Accent = "violet" | "amber" | "pink" | "cyan" | "emerald"

const ACCENT: Record<
  Accent,
  {
    blobs: string[]
    icon: string
    title: string
    overlay: string
    line: string
  }
> = {
  violet: {
    blobs: ["bg-violet-600/15", "bg-fuchsia-500/12", "bg-indigo-500/10"],
    icon: "from-violet-500 via-fuchsia-500 to-pink-500 shadow-violet-500/25",
    title: "from-white via-violet-200 to-fuchsia-200",
    overlay: "from-violet-500/[0.06] via-transparent to-fuchsia-500/[0.04]",
    line: "via-violet-400/30",
  },
  amber: {
    blobs: ["bg-amber-500/15", "bg-orange-500/12", "bg-yellow-500/10"],
    icon: "from-amber-500 via-orange-500 to-yellow-500 shadow-amber-500/25",
    title: "from-white via-amber-200 to-orange-200",
    overlay: "from-amber-500/[0.06] via-transparent to-orange-500/[0.04]",
    line: "via-amber-400/30",
  },
  pink: {
    blobs: ["bg-pink-600/15", "bg-rose-500/12", "bg-orange-500/10"],
    icon: "from-pink-500 via-rose-500 to-orange-400 shadow-pink-500/25",
    title: "from-white via-pink-200 to-rose-200",
    overlay: "from-pink-500/[0.06] via-transparent to-rose-500/[0.04]",
    line: "via-pink-400/30",
  },
  cyan: {
    blobs: ["bg-cyan-600/15", "bg-sky-500/12", "bg-blue-500/10"],
    icon: "from-cyan-500 via-sky-500 to-blue-500 shadow-cyan-500/25",
    title: "from-white via-cyan-200 to-sky-200",
    overlay: "from-cyan-500/[0.06] via-transparent to-sky-500/[0.04]",
    line: "via-cyan-400/30",
  },
  emerald: {
    blobs: ["bg-emerald-600/15", "bg-teal-500/12", "bg-green-500/10"],
    icon: "from-emerald-500 via-teal-500 to-green-500 shadow-emerald-500/25",
    title: "from-white via-emerald-200 to-teal-200",
    overlay: "from-emerald-500/[0.06] via-transparent to-teal-500/[0.04]",
    line: "via-emerald-400/30",
  },
}

interface Chip {
  label: string
  text: string
  border: string
  dot: string
}

interface Stat {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
}

interface SectionHeroProps {
  eyebrow: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent?: Accent
  chips?: Chip[]
  stats?: Stat[]
  badge?: ReactNode
  actions?: ReactNode
}

export default function SectionHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent = "violet",
  chips,
  stats,
  badge,
  actions,
}: SectionHeroProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const palette = ACCENT[accent]
  const mutedText = isDark ? "text-slate-400" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full ${palette.blobs[0]} blur-[110px] animate-[blob_8s_ease-in-out_infinite]`} />
        <div className={`absolute -top-16 right-0 w-64 h-64 rounded-full ${palette.blobs[1]} blur-[90px] animate-[blob_10s_ease-in-out_infinite_1s]`} />
        <div className={`absolute top-28 left-1/3 w-52 h-52 rounded-full ${palette.blobs[2]} blur-[80px] animate-[blob_12s_ease-in-out_infinite_2s]`} />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-2xl p-5 sm:p-7 ${
          isDark
            ? "bg-white/[0.03] border-white/[0.08] shadow-2xl shadow-black/20"
            : "bg-white/80 border-slate-200/80 shadow-xl shadow-slate-900/5"
        }`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${palette.overlay}`} />
        <div className={`pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${palette.line} to-transparent`} />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <motion.div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${palette.icon} flex items-center justify-center shrink-0 shadow-xl`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] ${mutedText}`}>
                  {eyebrow}
                </span>
              </div>
              <h1 className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${palette.title} bg-clip-text text-transparent`}>
                {title}
              </h1>
              <p className={`mt-2 max-w-xl text-sm sm:text-base leading-relaxed ${mutedText}`}>
                {description}
              </p>
              {chips && chips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip.label}
                      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${chip.text} ${chip.border} ${
                        isDark ? "bg-white/[0.04]" : "bg-white/70"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(badge || actions) && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {badge}
              {actions}
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className={`relative mt-5 pt-4 border-t ${isDark ? "border-white/[0.06]" : "border-slate-200/60"}`}>
            <div className={`grid gap-3 ${stats.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isDark ? "bg-white/[0.05] border-white/[0.06]" : "bg-slate-100 border-slate-200"}`}>
                    <stat.icon className="w-4 h-4 text-accent-light" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm sm:text-base font-bold leading-tight ${strongText}`}>{stat.value}</p>
                    <p className={`text-[10px] sm:text-[11px] font-medium truncate ${mutedText}`}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  )
}
