import { Clapperboard, ExternalLink, Film, Tv, ShieldCheck, UserRound } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { PLEX_HOME_URL, PLEX_LIVE_TV_URL, PLEX_WATCH_URL } from "../plex"

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
      <section className={`overflow-hidden rounded-3xl border ${panelClass}`}>
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.85fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] bg-accent/10 text-accent-light border border-accent/20">
              <Clapperboard className="w-3.5 h-3.5" />
              Plex Watch
            </div>
            <h1 className={`mt-4 text-3xl sm:text-4xl font-extrabold leading-tight ${strongText}`}>
              Filmes e séries grátis, oficiais.
            </h1>
            <p className={`mt-4 max-w-2xl text-sm sm:text-base leading-relaxed ${mutedText}`}>
              Incluímos o Plex Watch no SeligaAqui como atalho. O conteúdo fica na Plex (com anúncios), não no nosso servidor.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={PLEX_WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light min-h-[44px]"
              >
                Abrir meu Plex
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={PLEX_LIVE_TV_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                TV ao vivo na Plex
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={PLEX_HOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Catálogo
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
              <Clapperboard className="mb-3 h-8 w-8 text-accent-light" />
              <p className={`text-sm font-semibold ${strongText}`}>watch.plex.tv</p>
              <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                Streaming da Plex, grátis com anúncios. Login opcional para a página /me.
              </p>
            </div>
          </div>
        </div>
      </section>

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
