import { Clapperboard, ExternalLink, Film, HardDrive, ShieldCheck, CloudOff } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { JELLYFIN_FALLBACK_URL, JELLYFIN_MEDIA_PATH, JELLYFIN_URL } from "../jellyfin"

const SETUP_STEPS = [
  {
    icon: Film,
    title: "Primeiro acesso",
    text: "Abra a biblioteca e complete o assistente do Jellyfin (idioma, usuário admin e pastas).",
  },
  {
    icon: HardDrive,
    title: "Onde ficam os arquivos",
    text: `Coloque filmes e séries em ${JELLYFIN_MEDIA_PATH} no volume do serviço Jellyfin. Sem volume a biblioteca some no redeploy.`,
  },
  {
    icon: CloudOff,
    title: "Cloudflare",
    text: "No DNS de jellyfin.seligaaqui.online use só DNS (nuvem cinza). Proxy laranja corta stream longo e WebSocket.",
  },
  {
    icon: ShieldCheck,
    title: "Direitos de uso",
    text: "A biblioteca serve só o que você tem direito de armazenar e transmitir. Não substitui IPTV ao vivo.",
  },
]

export default function LibraryPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const panelClass = isDark ? "bg-dark-300/30 border-white/[0.06]" : "bg-white border-slate-200"
  const mutedText = isDark ? "text-dark-100" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className={`overflow-hidden rounded-3xl border ${panelClass}`}>
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.85fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] bg-accent/10 text-accent-light border border-accent/20">
              <Clapperboard className="w-3.5 h-3.5" />
              Biblioteca pessoal
            </div>
            <h1 className={`mt-4 text-3xl sm:text-4xl font-extrabold leading-tight ${strongText}`}>
              Filmes e séries no Jellyfin.
            </h1>
            <p className={`mt-4 max-w-2xl text-sm sm:text-base leading-relaxed ${mutedText}`}>
              O painel IPTV continua aqui. A biblioteca abre no subdomínio do Jellyfin, no mesmo projeto Railway,
              com disco persistente para config e mídia.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={JELLYFIN_FALLBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light min-h-[44px]"
              >
                Abrir biblioteca
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={JELLYFIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Subdomínio (após o DNS)
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className={`mt-3 text-xs sm:text-sm ${mutedText}`}>
              Use {JELLYFIN_FALLBACK_URL.replace(/^https?:\/\//, "")} até o CNAME de {JELLYFIN_URL.replace(/^https?:\/\//, "")} existir no Cloudflare.
            </p>
          </div>

          <div
            className={`relative flex items-center justify-center p-6 sm:p-8 ${
              isDark ? "bg-gradient-to-br from-white/[0.04] to-transparent" : "bg-gradient-to-br from-slate-50 to-white"
            }`}
          >
            <div className={`w-full max-w-sm rounded-2xl border p-5 ${isDark ? "bg-dark-200/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"}`}>
              <Clapperboard className="mb-3 h-8 w-8 text-accent-light" />
              <p className={`text-sm font-semibold ${strongText}`}>Jellyfin no SeligaAqui</p>
              <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                Interface nativa do Jellyfin (wizard, catálogo e player). Abre em nova aba para não cortar o stream.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SETUP_STEPS.map((step) => (
          <div key={step.title} className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <step.icon className="w-5 h-5 text-accent-light" />
            </div>
            <h2 className={`mt-4 text-base font-bold ${strongText}`}>{step.title}</h2>
            <p className={`mt-1 text-sm leading-relaxed ${mutedText}`}>{step.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
