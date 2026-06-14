import {
  Tv,
  List,
  Trophy,
  ExternalLink,
  Monitor,
  Radio,
  Zap,
  Globe,
  Heart,
  ArrowRight,
  Play,
  Wifi,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import type { Tab } from "../App"

interface HomePageProps {
  onNavigate: (tab: Tab) => void
}

const features = [
  {
    id: "iptv" as Tab,
    icon: Tv,
    title: "IPTV Player",
    description:
      "Stream curated free IPTV channels with a built-in HLS player. Quality badges, category filters, and real-time connection status.",
    color: "from-violet-500 to-purple-600",
    stats: "4+ channels",
  },
  {
    id: "catalog" as Tab,
    icon: List,
    title: "IPTV Catalog",
    description:
      "Browse thousands of community-maintained channels from iptv-org. Search by name, filter by category, and preview instantly.",
    color: "from-blue-500 to-cyan-500",
    stats: "2500+ channels",
  },
  {
    id: "sports" as Tab,
    icon: Trophy,
    title: "Live Sports",
    description:
      "Watch live sports streams across football, basketball, NFL, hockey, and more via the free SportSRC API with embedded players.",
    color: "from-amber-500 to-orange-500",
    stats: "8 categories",
  },
]

const techStack = [
  { name: "React 19", icon: "⚛️" },
  { name: "TypeScript", icon: "📘" },
  { name: "Tailwind CSS", icon: "🎨" },
  { name: "Vite", icon: "⚡" },
  { name: "HLS.js", icon: "📺" },
  { name: "Lucide Icons", icon: "✨" },
]

export default function HomePage({ onNavigate }: HomePageProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero Section */}
      <div className="relative mb-8">
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 rounded-3xl overflow-hidden ${
            isDark ? "opacity-40" : "opacity-20"
          }`}
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent rounded-full blur-[128px]" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sport-green rounded-full blur-[128px]" />
        </div>

        <div
          className={`relative rounded-3xl p-8 lg:p-12 border backdrop-blur-sm ${
            isDark
              ? "bg-dark-300/30 border-white/5"
              : "bg-white/60 border-slate-200"
          }`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-sport-green flex items-center justify-center shrink-0 shadow-lg shadow-accent/25">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className={`text-3xl lg:text-4xl font-extrabold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Stream
                <span className="gradient-text">Hub</span>
              </h1>
              <p
                className={`text-base lg:text-lg max-w-2xl ${
                  isDark ? "text-dark-100" : "text-slate-500"
                }`}
              >
                A free, open-source IPTV dashboard for streaming live TV
                channels, browsing community playlists, and watching sports — all
                in one place.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              {
                label: "IPTV Channels",
                value: "2500+",
                icon: Radio,
                color: "text-accent-light",
              },
              {
                label: "Sports Categories",
                value: "8",
                icon: Trophy,
                color: "text-sport-yellow",
              },
              {
                label: "Free & Open Source",
                value: "100%",
                icon: Heart,
                color: "text-sport-red",
              },
              {
                label: "Live Streams",
                value: "∞",
                icon: Wifi,
                color: "text-sport-green",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isDark
                    ? "bg-white/5 border-white/5"
                    : "bg-white/80 border-slate-200"
                }`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
                <div>
                  <p
                    className={`text-lg font-bold leading-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`text-[10px] ${
                      isDark ? "text-dark-100" : "text-slate-500"
                    }`}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Zap
            className={`w-5 h-5 ${isDark ? "text-dark-100" : "text-slate-400"}`}
          />
          <h2
            className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => onNavigate(feature.id)}
              className={`group text-left p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                isDark
                  ? "bg-dark-300/30 border-white/5 hover:border-white/10 hover:bg-white/5"
                  : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3
                className={`text-lg font-bold mb-1.5 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`text-sm mb-3 leading-relaxed ${
                  isDark ? "text-dark-100" : "text-slate-500"
                }`}
              >
                {feature.description}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    isDark
                      ? "bg-white/10 text-dark-100"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {feature.stats}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-accent-light group-hover:gap-2 transition-all">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Credits Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Heart
            className={`w-5 h-5 ${isDark ? "text-dark-100" : "text-slate-400"}`}
          />
          <h2
            className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Credits & Data Sources
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* iptv-org */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? "bg-dark-300/30 border-white/5 hover:border-white/10"
                : "bg-white/80 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/25">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    iptv-org/iptv
                  </h3>
                  <a
                    href="https://github.com/iptv-org/iptv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-light hover:text-accent transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p
                  className={`text-sm mb-2 leading-relaxed ${
                    isDark ? "text-dark-100" : "text-slate-500"
                  }`}
                >
                  Community-curated collection of{" "}
                  <span className="font-semibold text-sport-green">
                    2,500+ free IPTV channels
                  </span>{" "}
                  from around the world. Powers the IPTV Catalog with channels
                  organized by category and country.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      isDark
                        ? "bg-green-500/10 text-green-400"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    M3U Playlists
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      isDark
                        ? "bg-green-500/10 text-green-400"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    Open Source
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      isDark
                        ? "bg-green-500/10 text-green-400"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    MIT License
                  </span>
                </div>
              </div>
            </div>
            <a
              href="https://github.com/iptv-org/iptv"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isDark
                  ? "bg-white/5 text-dark-100 hover:bg-white/10 hover:text-white border border-white/5"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* SportSRC API */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? "bg-dark-300/30 border-white/5 hover:border-white/10"
                : "bg-white/80 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    SportSRC API
                  </h3>
                  <a
                    href="https://sportsrc.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-light hover:text-accent transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p
                  className={`text-sm mb-2 leading-relaxed ${
                    isDark ? "text-dark-100" : "text-slate-500"
                  }`}
                >
                  Free sports streaming API providing match schedules and
                  embedded stream links for{" "}
                  <span className="font-semibold text-sport-yellow">
                    8 sports categories
                  </span>{" "}
                  including football, basketball, NFL, hockey, and more.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      isDark
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    REST API
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      isDark
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    Free
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      isDark
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    Live Streams
                  </span>
                </div>
              </div>
            </div>
            <a
              href="https://sportsrc.org"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isDark
                  ? "bg-white/5 text-dark-100 hover:bg-white/10 hover:text-white border border-white/5"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Visit SportSRC
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Tech Stack & Get Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Tech Stack */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark
              ? "bg-dark-300/30 border-white/5"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🛠️</span>
            <h3
              className={`text-base font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Built With
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium ${
                  isDark
                    ? "bg-white/5 text-dark-100"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span>{tech.icon}</span>
                <span>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Get Started */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isDark
              ? "bg-gradient-to-br from-accent/10 to-sport-green/10 border-accent/20"
              : "bg-gradient-to-br from-accent/5 to-sport-green/5 border-accent/10"
          }`}
        >
          <div>
            <h3
              className={`text-base font-bold mb-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Ready to start?
            </h3>
            <p
              className={`text-sm mb-4 leading-relaxed ${
                isDark ? "text-dark-100" : "text-slate-500"
              }`}
            >
              Jump into the IPTV Player to stream curated channels, browse the
              full catalog, or check out live sports schedules.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate("iptv")}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-accent/25 active:scale-95"
            >
              <Play className="w-4 h-4" />
              Start Streaming
            </button>
            <button
              onClick={() => onNavigate("catalog")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isDark
                  ? "bg-white/10 text-dark-100 hover:text-white hover:bg-white/15 border border-white/10"
                  : "bg-white text-slate-500 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <List className="w-4 h-4" />
              Browse Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`text-center py-6 border-t ${
          isDark ? "border-white/5" : "border-slate-200"
        }`}
      >
        <p
          className={`text-xs ${isDark ? "text-dark-100" : "text-slate-500"}`}
        >
          Built with React, TypeScript & Tailwind CSS. IPTV data provided by{" "}
          <a
            href="https://github.com/iptv-org/iptv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-light hover:underline"
          >
            iptv-org
          </a>{" "}
          &amp;{" "}
          <a
            href="https://sportsrc.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-light hover:underline"
          >
            SportSRC
          </a>
          .
        </p>
      </div>
    </div>
  )
}
