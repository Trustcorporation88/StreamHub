import type React from "react"
import { Tv, Monitor, List, Trophy, Sun, Moon, Home } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

type Tab = "home" | "iptv" | "catalog" | "sports"

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const navItems: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "iptv", label: "IPTV Player", icon: Tv },
  { id: "catalog", label: "IPTV Catalog", icon: List },
  { id: "sports", label: "Live Sports", icon: Trophy },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"

  return (
    <aside
      className={`w-64 h-screen flex flex-col shrink-0 transition-colors duration-300 ${
        isDark
          ? "glass border-r border-white/5"
          : "bg-white/80 backdrop-blur-xl border-r border-slate-200"
      }`}
    >
      {/* Logo */}
      <div className={`p-6 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-sport-green flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              StreamHub
            </h1>
            <p className={`text-xs ${isDark ? "text-dark-100" : "text-slate-500"}`}>
              IPTV Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? isDark
                    ? "bg-accent/20 text-accent-light border border-accent/30 shadow-lg shadow-accent/10"
                    : "bg-accent/10 text-accent-dark border border-accent/20 shadow-md shadow-accent/10"
                  : isDark
                    ? "text-dark-100 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t space-y-2 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isDark
              ? "bg-white/5 text-dark-100 hover:text-white hover:bg-white/10"
              : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-5 h-5" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              Dark Mode
            </>
          )}
        </button>

        {/* Status */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            isDark ? "bg-white/5" : "bg-slate-100"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-sport-green animate-pulse" />
          <span className={`text-xs ${isDark ? "text-dark-100" : "text-slate-500"}`}>
            System Ready
          </span>
        </div>
      </div>
    </aside>
  )
}
