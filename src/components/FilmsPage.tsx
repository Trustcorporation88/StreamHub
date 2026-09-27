import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Film, Loader2, Play, Search, X } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { FILMS, FILM_GENRES, filterFilms, resolveFilmUrl, type PublicDomainFilm } from "../lib/publicDomainFilms"
import VideoPlayer from "./VideoPlayer"

interface Playing {
  film: PublicDomainFilm
  url: string
}

export default function FilmsPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [genre, setGenre] = useState("all")
  const [text, setText] = useState("")
  const query = useDebouncedValue(text, 200)
  const films = useMemo(() => filterFilms(FILMS, genre, query), [genre, query])

  const [opening, setOpening] = useState<string | null>(null)
  const [playing, setPlaying] = useState<Playing | null>(null)
  const [playError, setPlayError] = useState<string | null>(null)
  const openAbort = useRef<AbortController | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const panelClass = isDark ? "bg-dark-300/30 border-white/[0.06]" : "bg-white border-slate-200"
  const mutedText = isDark ? "text-dark-100" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"

  const openFilm = async (film: PublicDomainFilm) => {
    openAbort.current?.abort()
    const controller = new AbortController()
    openAbort.current = controller
    setOpening(film.id)
    setPlayError(null)
    try {
      const url = await resolveFilmUrl(film.id, controller.signal)
      if (controller.signal.aborted) return
      setPlaying({ film, url })
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      setPlayError(
        /HTTP|fetch|network/i.test((e as Error).message || "")
          ? "Não foi possível abrir este filme agora. Tente de novo em instantes."
          : (e as Error).message
      )
    } finally {
      if (openAbort.current === controller) setOpening(null)
    }
  }

  useEffect(() => () => openAbort.current?.abort(), [])

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isDark ? "bg-accent/20" : "bg-accent/10"}`}>
          <Film className="w-6 h-6 text-accent-light" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${strongText}`}>Filmes</h1>
          <p className={`text-sm ${mutedText}`}>
            {FILMS.length} clássicos famosos. Clique no filme e assista aqui no player.
          </p>
        </div>
      </div>

      <div ref={playerRef} className="scroll-mt-4">
        {playing ? (
          <div className="flex flex-col gap-3">
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-black">
              <VideoPlayer
                key={playing.url}
                src={playing.url}
                title={playing.film.ptTitle ?? playing.film.title}
                fillContainer
              />
            </div>
            <div className={`flex items-start justify-between gap-3 rounded-2xl border p-3 sm:p-4 ${panelClass}`}>
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${strongText}`}>
                  {playing.film.ptTitle ?? playing.film.title}
                </p>
                <p className={`text-xs ${mutedText}`}>
                  {playing.film.ptTitle ? `${playing.film.title} · ` : ""}
                  {playing.film.year} · Domínio público · Internet Archive
                </p>
              </div>
              <button
                onClick={() => setPlaying(null)}
                className={`flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-xl ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label="Fechar player"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex min-h-[160px] items-center justify-center rounded-2xl border px-6 py-8 text-center ${panelClass}`}>
            <div>
              <Play className={`mx-auto mb-3 h-10 w-10 ${mutedText}`} />
              <p className={`text-sm font-medium ${strongText}`}>Escolha um filme abaixo</p>
              <p className={`mt-1 text-sm ${mutedText}`}>A reprodução começa neste painel.</p>
            </div>
          </div>
        )}
        {playError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-sport-red/20 bg-sport-red/10 p-3 text-sm text-sport-red">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{playError}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Buscar filme pelo título..."
            className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none ${
              isDark
                ? "border-white/10 bg-dark-200/70 text-white placeholder:text-dark-100/60 focus:border-accent/50"
                : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-accent"
            }`}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FILM_GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`min-h-[36px] whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                genre === g.id
                  ? "bg-accent text-white shadow-lg shadow-accent/25"
                  : isDark
                    ? "bg-white/5 text-dark-100 hover:bg-white/10 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {films.length === 0 && <p className={`text-sm ${mutedText}`}>Nenhum filme encontrado com esse título.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {films.map((film) => {
          const isActive = playing?.film.id === film.id
          const isOpening = opening === film.id
          return (
            <button
              key={film.id}
              onClick={() => openFilm(film)}
              disabled={isOpening}
              className={`group overflow-hidden rounded-2xl border text-left transition-colors ${
                isActive
                  ? "border-accent/60 ring-1 ring-accent/40"
                  : isDark
                    ? "border-white/5 bg-dark-300/30 hover:border-white/15"
                    : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className={`relative aspect-[2/3] w-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                <img
                  src={film.poster}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden"
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  {isOpening ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
              </div>
              <div className="p-2.5">
                <p className={`line-clamp-2 text-xs font-semibold leading-snug ${isActive ? "text-accent-light" : strongText}`}>
                  {film.ptTitle ?? film.title}
                </p>
                <p className={`mt-0.5 truncate text-[11px] ${mutedText}`}>
                  {film.ptTitle ? `${film.title} · ` : ""}
                  {film.year}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className={`text-xs leading-relaxed ${mutedText}`}>
        Filmes do acervo do Internet Archive (archive.org) marcados como domínio público. Os arquivos são servidos
        direto pelo Internet Archive.
      </p>
    </div>
  )
}
