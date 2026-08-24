import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { M3U_SOURCES, parseM3U } from "../lib/m3u"
import type { M3UChannel } from "../types"

export type CatalogStatus = "idle" | "loading" | "ready" | "error"

interface CatalogState {
  status: CatalogStatus
  channels: M3UChannel[]
  error: string | null
  /** How many of the M3U_SOURCES have come back, for the progress readout. */
  sourcesLoaded: number

  // Filters. These live in the store rather than in the page component so that
  // leaving the tab and coming back doesn't silently reset the user's view.
  search: string
  selectedCategory: string
  selectedCountry: string

  load: (options?: { force?: boolean }) => Promise<void>
  setSearch: (value: string) => void
  setCategory: (value: string) => void
  setCountry: (value: string) => void
  resetFilters: () => void
}

/**
 * The IPTV catalog: seven upstream M3U playlists, merged and de-duplicated.
 *
 * This is a store rather than component state because the fetch is expensive
 * (seven playlists, 30s timeout each, thousands of entries parsed) and the data
 * is needed in more than one place. Previously it lived inside IPTVChannels, so
 * every visit to another tab unmounted the component and the next visit
 * re-downloaded and re-parsed the entire catalog from scratch.
 */
export const useCatalogStore = create<CatalogState>()(
  subscribeWithSelector((set, get) => ({
    status: "idle",
    channels: [],
    error: null,
    sourcesLoaded: 0,

    search: "",
    selectedCategory: "All",
    selectedCountry: "All",

    load: async ({ force = false } = {}) => {
      const { status } = get()
      // Idempotent by design: concurrent callers (the catalog page and the
      // command palette both mounting) share one in-flight fetch.
      if (!force && (status === "loading" || status === "ready")) return

      set({ status: "loading", error: null, sourcesLoaded: 0 })

      try {
        const results = await Promise.allSettled(
          M3U_SOURCES.map(src =>
            fetch(src.url, { signal: AbortSignal.timeout(30000) }).then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`)
              return res.text()
            })
          )
        )

        const seen = new Set<string>()
        const merged: M3UChannel[] = []

        for (const [idx, result] of results.entries()) {
          if (result.status === "fulfilled") {
            const parsed = parseM3U(result.value, M3U_SOURCES[idx].forceCategory)
            for (const ch of parsed) {
              const key = ch.url.toLowerCase().trim()
              if (!seen.has(key)) {
                seen.add(key)
                merged.push(ch)
              }
            }
          }
          set(state => ({ sourcesLoaded: state.sourcesLoaded + 1 }))
        }

        if (merged.length === 0) {
          throw new Error("Nenhum canal encontrado em nenhuma fonte")
        }

        set({ channels: merged, status: "ready" })
      } catch (err) {
        set({
          status: "error",
          error: (err as Error).message || "Falha ao carregar a lista de canais",
        })
      }
    },

    setSearch: value => set({ search: value }),
    setCategory: value => set({ selectedCategory: value }),
    setCountry: value => set({ selectedCountry: value }),
    resetFilters: () => set({ search: "", selectedCategory: "All", selectedCountry: "All" }),
  }))
)
