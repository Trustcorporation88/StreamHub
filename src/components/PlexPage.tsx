import { Clapperboard, ExternalLink, Film, Tv, ShieldCheck, UserRound } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { PLEX_HOME_URL, PLEX_LIVE_TV_URL, PLEX_WATCH_URL } from "../plex"
import SectionHero from "./SectionHero"

const NOTES = [
  {
    icon: Film,
    title: "Filmes e séries oficiais",
    text: "O Plex Watch é o catálogo grátis da Plex, com anúncios. Não precisa hospedar arquivo nem subir servidor.",
  },
  {
    icon: Tv,
    title: "TV ao vivo na Plex",
    text: "Além do catálogo, a Plex tem canais ao vivo legais em watch.plex.tv. O IPTV do SeligaAqui continua nas outras abas.",
  },
  {
    icon: UserRound,
    title: "Conta grátis",
    text: "A página /me é a sua lista. Sem login a Plex abre o catálogo geral. Crie a conta grátis no site deles.",
  },
  {
    icon: ShieldCheck,
    title: "Por que abre em nova aba",
    text: "A Plex bloqueia iframe (só o próprio site). O player, o login e os anúncios ficam no domínio watch.plex.tv.",
  },
]

export default function PlexPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const panelClass = isDark ? "bg-dark-300/30 border-white/[0.06]" : "bg-white border-slate-200"
  const mutedText = isDark ? "text-dark-100" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"

  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionHero
        eyebrow="SeligaAqui Plex"
        title="Plex Watch"
        description="Filmes e séries oficiais e grátis, com anúncios. O player abre no site da Plex."
        icon={Clapperboard}
        accent="pink"
        chips={[
          { label: "Grátis", text: "text-pink-300", border: "border-pink-500/20", dot: "bg-pink-400" },
          { label: "Oficial", text: "text-rose-300", border: "border-rose-500/20", dot: "bg-rose-400" },
          { label: "TV ao vivo", text: "text-orange-300", border: "border-orange-500/20", dot: "bg-orange-400" },
        ]}
        stats={[
          { label: "Catálogo", value: "Plex", icon: Film },
          { label: "Login", value: "Opcional", icon: UserRound },
          { label: "Anúncios", value: "Sim", icon: ShieldCheck },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={PLEX_WATCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light min-h-[44px]"
            >
              Abrir meu Plex
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={PLEX_LIVE_TV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px] ${
                isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              TV ao vivo
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={PLEX_HOME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px] ${
                isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Catálogo
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {NOTES.map((note) => (
          <div key={note.title} className={`rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <note.icon className="w-5 h-5 text-accent-light" />
            </div>
            <h2 className={`mt-4 text-base font-bold ${strongText}`}>{note.title}</h2>
            <p className={`mt-1 text-sm leading-relaxed ${mutedText}`}>{note.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
