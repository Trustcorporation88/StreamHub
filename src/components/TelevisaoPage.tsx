import { ExternalLink, Globe, MonitorSmartphone, ShieldCheck, Tv } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { TELEVISAO_TV_URL } from "../televisao"

const NOTES = [
  {
    icon: MonitorSmartphone,
    title: "Abre em nova aba",
    text: "O Televisão.TV só aparece na página deles. O botão abre https://televisao.tv numa nova aba, e o player fica lá.",
  },
  {
    icon: Tv,
    title: "Catálogo em português",
    text: "Notícias, entretenimento, música, filmes, desenhos, regionais e canais de Portugal, Angola e Moçambique, do jeito que o site deles organiza.",
  },
  {
    icon: ShieldCheck,
    title: "Site independente",
    text: "O SeligaAqui não hospeda esses sinais, não incorpora o player e não é o site oficial do Televisão.TV nem das emissoras.",
  },
  {
    icon: Globe,
    title: "Disponibilidade",
    text: "Cada transmissão depende do sinal de origem e da conexão. Se um canal não abrir, a orientação está na página deles.",
  },
]

export default function TelevisaoPage() {
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
              <Globe className="w-3.5 h-3.5" />
              Televisão.TV
            </div>
            <h1 className={`mt-4 text-3xl sm:text-4xl font-extrabold leading-tight ${strongText}`}>
              Canais de TV em português.
            </h1>
            <p className={`mt-4 max-w-2xl text-sm sm:text-base leading-relaxed ${mutedText}`}>
              Atalho para o catálogo do Televisão.TV. A lista, a busca e o player ficam no site deles.
              O SeligaAqui só guarda o link.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={TELEVISAO_TV_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light min-h-[44px]"
              >
                Abrir Televisão.TV
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div
            className={`relative flex items-center justify-center p-6 sm:p-8 ${
              isDark ? "bg-gradient-to-br from-white/[0.04] to-transparent" : "bg-gradient-to-br from-slate-50 to-white"
            }`}
          >
            <div className={`w-full max-w-sm rounded-2xl border p-5 ${isDark ? "bg-dark-200/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"}`}>
              <Globe className="mb-3 h-8 w-8 text-sky-400" />
              <p className={`text-sm font-semibold ${strongText}`}>televisao.tv</p>
              <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                Catálogo externo de canais ao vivo em português. Sem aplicativo: abre no navegador.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {NOTES.map((note) => (
          <div key={note.title} className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <note.icon className="w-5 h-5 text-sky-400" />
            </div>
            <h2 className={`mt-4 text-base font-bold ${strongText}`}>{note.title}</h2>
            <p className={`mt-1 text-sm leading-relaxed ${mutedText}`}>{note.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
