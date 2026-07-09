import { motion } from "framer-motion"
import type React from "react"
import { ArrowRight, Headphones, Monitor, Music, Radio, Trophy, Tv, Zap } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import type { Tab } from "../App"

interface HomePageProps {
  onNavigate: React.Dispatch<React.SetStateAction<Tab>>
}

const QUICK_LINKS: { id: Tab; title: string; description: string; icon: typeof Tv; accent: string }[] = [
  { id: "iptv", title: "Transmissões ao Vivo", description: "Navegue pelos canais ao vivo mais recentes e seleções rápidas.", icon: Tv, accent: "text-accent-light" },
  { id: "catalog", title: "Canais IPTV", description: "Explore coleções de canais organizadas por categoria.", icon: Monitor, accent: "text-sport-green" },
  { id: "sports", title: "Esportes ao Vivo", description: "Acompanhe transmissões de partidas e os próximos jogos.", icon: Trophy, accent: "text-sport-yellow" },
  { id: "music", title: "Música", description: "Abra a busca do YouTube, estações de rádio e playlists.", icon: Music, accent: "text-purple-400" },
  { id: "about", title: "Sobre", description: "Veja o que o StreamHub oferece e como foi construído.", icon: Zap, accent: "text-accent-light" },
  { id: "legal", title: "Jurídico", description: "Leia o aviso legal, os termos e as notas de privacidade.", icon: Radio, accent: "text-sport-red" },
]

export default function HomePage({ onNavigate }: HomePageProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const panelClass = isDark ? "bg-dark-300/30 border-white/[0.06]" : "bg-white border-slate-200"
  const mutedText = isDark ? "text-dark-100" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"

  return (
    <div className="space-y-5 sm:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`overflow-hidden rounded-3xl border ${panelClass}`}
      >
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] bg-accent/10 text-accent-light border border-accent/20">
              <Headphones className="w-3.5 h-3.5" />
              Painel de streaming unificado
            </div>
            <h1 className={`mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight ${strongText}`}>
              TV, Esportes e Música em um só lugar.
            </h1>
            <p className={`mt-4 max-w-2xl text-sm sm:text-base leading-relaxed ${mutedText}`}>
              Alterne entre transmissões ao vivo, catálogo de IPTV, esportes e música sem trocar de aplicativo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("iptv")}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light min-h-[44px]"
              >
                Começar a Assistir
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("music")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Abrir Música
              </button>
            </div>
          </div>

          <div className={`relative flex items-center justify-center p-6 sm:p-8 ${isDark ? "bg-gradient-to-br from-white/[0.04] to-transparent" : "bg-gradient-to-br from-slate-50 to-white"}`}>
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "14 mil+ canais", icon: Tv },
                { label: "45 mil+ rádios", icon: Radio },
                { label: "Esportes ao vivo", icon: Trophy },
                { label: "Busca de músicas", icon: Music },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 text-center ${isDark ? "bg-dark-200/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"}`}>
                  <item.icon className="mx-auto mb-2 h-5 w-5 text-accent-light" />
                  <p className={`text-sm font-semibold ${strongText}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Zap className={`w-4 h-4 ${mutedText}`} />
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${mutedText}`}>Acesso Rápido</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {QUICK_LINKS.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(item.id)}
              className={`group text-left rounded-2xl border p-4 sm:p-5 transition-all hover:-translate-y-0.5 ${panelClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  <item.icon className={`w-5 h-5 ${item.accent}`} />
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${mutedText}`} />
              </div>
              <h3 className={`mt-4 text-base font-bold ${strongText}`}>{item.title}</h3>
              <p className={`mt-1 text-sm leading-relaxed ${mutedText}`}>{item.description}</p>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  )
}
