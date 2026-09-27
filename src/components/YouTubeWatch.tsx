import { useState } from "react"
import { Loader2, Play, Search, Tv } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useYouTubeSearch } from "../music/hooks/useYouTubeSearch"
import type { Track } from "../music/types"
import VideoPlayer from "./VideoPlayer"

const QUICK = ["CazéTV ao vivo", "Notícias Brasil", "Esportes", "Música ao vivo"]

function videoIdOf(track: Track): string | null {
  const fromId = track.id.match(/^yt-([\w-]{11})$/)
  if (fromId) return fromId[1]
  const fromUrl = track.streamUrl.match(/[?&]v=([\w-]{11})/)
  return fromUrl ? fromUrl[1] : null
}

export default function YouTubeWatch() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { results, loading, error, search } = useYouTubeSearch()
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTitle, setActiveTitle] = useState("")

  const mutedText = isDark ? "text-dark-100" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"
  const panelClass = isDark ? "bg-dark-300/30 border-white/[0.06]" : "bg-white border-slate-200"

  const runSearch = async (value: string) => {
    const next = value.trim()
    if (!next) return
    setQuery(next)
    await search(next)
  }

  const play = (track: Track) => {
    const id = videoIdOf(track)
    if (!id) return
    setActiveId(id)
    setActiveTitle(track.title)
  }

  return (
    <div className="flex flex-col gap-4 xl:h-full">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isDark ? "bg-accent/20" : "bg-accent/10"}`}>
          <Tv className="w-6 h-6 text-accent-light" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${strongText}`}>YouTube</h1>
          <p className={`text-sm ${mutedText}`}>Clique em um vídeo para assistir aqui no player.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 xl:flex-1 xl:min-h-0">
        <div className="xl:col-span-2 min-h-0">
          {activeId ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/5 xl:h-full xl:aspect-auto">
              <VideoPlayer
                key={activeId}
                src={`https://www.youtube.com/watch?v=${activeId}`}
                title={activeTitle}
                fillContainer
              />
            </div>
          ) : (
            <div className={`flex aspect-video w-full items-center justify-center rounded-2xl border px-6 text-center xl:h-full xl:aspect-auto ${panelClass}`}>
              <div>
                <Play className={`mx-auto mb-3 h-10 w-10 ${mutedText}`} />
                <p className={`text-sm font-medium ${strongText}`}>Nada passando ainda</p>
                <p className={`mt-1 text-sm ${mutedText}`}>Busque e clique num resultado. A reprodução fica neste painel.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void runSearch(query)
            }}
            className="relative"
          >
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no YouTube..."
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none ${
                isDark
                  ? "border-white/10 bg-dark-200/70 text-white placeholder:text-dark-100/60 focus:border-accent/50"
                  : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-accent"
              }`}
            />
          </form>

          <div className="flex flex-wrap gap-2">
            {QUICK.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void runSearch(item)}
                className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-medium ${
                  isDark ? "bg-white/5 text-dark-100 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {loading && (
            <div className={`flex items-center gap-2 text-sm ${mutedText}`}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}
          {error && <p className="text-sm text-sport-red">{error}</p>}

          <div className="max-h-[46vh] space-y-1.5 overflow-y-auto xl:max-h-none xl:flex-1">
            {results.map((track) => {
              const id = videoIdOf(track)
              const selected = id !== null && id === activeId
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => play(track)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                    selected
                      ? isDark
                        ? "border-accent/50 bg-accent/10"
                        : "border-accent/30 bg-accent/5"
                      : isDark
                        ? "border-white/5 bg-dark-300/30 hover:bg-white/5"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {track.thumbnail ? (
                    <img src={track.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className={`flex h-12 w-20 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                      <Tv className="h-4 w-4 text-accent-light" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${selected ? "text-accent-light" : strongText}`}>{track.title}</p>
                    <p className={`truncate text-xs ${mutedText}`}>{track.artist}</p>
                  </div>
                  <Play className={`h-4 w-4 shrink-0 ${selected ? "text-accent-light" : mutedText}`} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
