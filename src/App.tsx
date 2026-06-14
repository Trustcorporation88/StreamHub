import { useState } from "react"
import { ThemeProvider } from "./context/ThemeContext"
import Sidebar from "./components/Sidebar"
import HomePage from "./components/HomePage"
import IPTVPlayer from "./components/IPTVPlayer"
import IPTVCatalog from "./components/IPTVCatalog"
import LiveSports from "./components/LiveSports"

export type Tab = "home" | "iptv" | "catalog" | "sports"

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home")

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-surface-500 text-text-primary transition-colors">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === "home" && <HomePage onNavigate={setActiveTab} />}
          {activeTab === "iptv" && <IPTVPlayer />}
          {activeTab === "catalog" && <IPTVCatalog />}
          {activeTab === "sports" && <LiveSports />}
        </main>
      </div>
    </ThemeProvider>
  )
}
