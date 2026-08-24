import { Suspense, lazy, useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Menu, Monitor } from "lucide-react"
import { ThemeProvider, useTheme } from "./context/ThemeContext"
import { LiveStreamProvider } from "./context/LiveStreamContext"
import Sidebar from "./components/Sidebar"
import ErrorBoundary from "./components/ErrorBoundary"
import { pathForTab, tabForPath, VALID_TABS, type Tab } from "./routes"

// Each section is its own chunk. Before this the whole app — every player, the
// music portal, the 900-line sports view — shipped as one 1.3 MB bundle that
// had to download and parse before the home page could paint.
const HomePage = lazy(() => import("./components/HomePage"))
const LiveStreams = lazy(() => import("./components/LiveStreams"))
const IPTVChannels = lazy(() => import("./components/IPTVChannels"))
const MyIPTV = lazy(() => import("./components/MyIPTV"))
const PlexPage = lazy(() => import("./components/PlexPage"))
const LiveSports = lazy(() => import("./components/LiveSports"))
const MusicPortal = lazy(() => import("./music/components/MusicPortal"))
const AboutPage = lazy(() => import("./components/AboutPage"))
const LegalDisclaimer = lazy(() => import("./components/LegalDisclaimer"))

const CONTENT_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const CONTENT_TRANSITION = { duration: 0.2, ease: "easeOut" as const }

function RouteFallback() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  )
}

/**
 * Sections used to be addressed by hash (`#catalog`). Anything bookmarked or
 * shared under the old scheme still works: we translate it to the new path
 * once, on load, and drop the hash.
 */
function LegacyHashRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (!hash) return
    if (!VALID_TABS.includes(hash as Tab)) return
    if (location.pathname !== "/") return
    navigate(pathForTab(hash as Tab), { replace: true })
  }, [navigate, location.pathname])

  return null
}

function NotFound() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-5xl font-bold text-accent">404</p>
      <h2 className="mb-2 text-lg font-semibold text-text-primary">Página não encontrada</h2>
      <p className="mb-4 text-sm text-text-secondary">
        Esse endereço não existe — talvez a seção tenha sido renomeada.
      </p>
      <a
        href="/"
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
      >
        Voltar ao início
      </a>
    </div>
  )
}

function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = tabForPath(location.pathname)

  const goToTab = (tab: Tab) => navigate(pathForTab(tab))

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-500 text-text-primary transition-colors">
      <LegacyHashRedirect />
      <Sidebar
        activeTab={activeTab}
        onTabChange={goToTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header
          className={`lg:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0 safe-area-top ${
            isDark
              ? "bg-dark-300/50 backdrop-blur-xl border-white/5"
              : "bg-white/80 backdrop-blur-xl border-slate-200"
          }`}
        >
          <motion.button
            onClick={() => setMobileMenuOpen(true)}
            className={`p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isDark ? "hover:bg-white/10 text-dark-100" : "hover:bg-slate-100 text-slate-500"
            }`}
            aria-label="Abrir menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-sport-green flex items-center justify-center">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <span className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              SeligaAqui
            </span>
          </div>
        </header>

        {/* Main Content with Crossfade */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={CONTENT_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={CONTENT_TRANSITION}
              className="min-h-full"
            >
              {/* Keyed by path so a crash in one section doesn't leave the
                  boundary stuck in its error state after navigating away. */}
              <ErrorBoundary key={location.pathname}>
                <Suspense fallback={<RouteFallback />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

/** HomePage and AboutPage take an onNavigate callback; the router supplies it. */
function HomePageRoute() {
  const navigate = useNavigate()
  return <HomePage onNavigate={(tab: Tab) => navigate(pathForTab(tab))} />
}

function AboutPageRoute() {
  const navigate = useNavigate()
  return <AboutPage onNavigate={(tab: Tab) => navigate(pathForTab(tab))} />
}

export default function App() {
  return (
    <ThemeProvider>
      <LiveStreamProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePageRoute />} />
              <Route path="/iptv" element={<LiveStreams />} />
              <Route path="/catalog" element={<IPTVChannels />} />
              <Route path="/mylist" element={<MyIPTV />} />
              <Route path="/plex" element={<PlexPage />} />
              <Route path="/sports" element={<LiveSports />} />
              <Route path="/music" element={<MusicPortal />} />
              <Route path="/about" element={<AboutPageRoute />} />
              <Route path="/legal" element={<LegalDisclaimer />} />
              <Route path="/index.html" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LiveStreamProvider>
    </ThemeProvider>
  )
}
