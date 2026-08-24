import type { M3UChannel } from "../types"

export const BRAZIL_CATEGORY = "🇧🇷 Brasil"

/** Ordem de exibição das categorias no catálogo. */
export const CATEGORY_ORDER = [
  "📡 Pluto TV Brasil",
  BRAZIL_CATEGORY,
  "🇺🇸 EUA",
  "🇮🇹 Itália",
  "🎬 Filmes",
  "📺 Séries",
  "🏆 Esportes",
]

export interface M3USource {
  url: string
  label: string
  forceCategory: string
}

export const M3U_SOURCES: M3USource[] = [
  { url: "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br_pluto.m3u", label: "Pluto TV", forceCategory: "📡 Pluto TV Brasil" },
  { url: "https://iptv-org.github.io/iptv/countries/br.m3u", label: "Brasil", forceCategory: BRAZIL_CATEGORY },
  { url: "https://iptv-org.github.io/iptv/countries/us.m3u", label: "EUA", forceCategory: "🇺🇸 EUA" },
  { url: "https://iptv-org.github.io/iptv/countries/it.m3u", label: "Itália", forceCategory: "🇮🇹 Itália" },
  { url: "https://iptv-org.github.io/iptv/categories/movies.m3u", label: "Filmes", forceCategory: "🎬 Filmes" },
  { url: "https://iptv-org.github.io/iptv/categories/series.m3u", label: "Séries", forceCategory: "📺 Séries" },
  { url: "https://iptv-org.github.io/iptv/categories/sports.m3u", label: "Esportes", forceCategory: "🏆 Esportes" },
]

export function categoryRank(cat: string): number {
  const idx = CATEGORY_ORDER.indexOf(cat)
  return idx === -1 ? CATEGORY_ORDER.length : idx
}

export function parseM3U(m3u: string, forceCategory: string | null = null): M3UChannel[] {
  const channels: M3UChannel[] = []
  const lines = m3u.split("\n")
  let currentExtinf: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("#EXTINF:")) {
      currentExtinf = trimmed
    } else if (currentExtinf && trimmed && !trimmed.startsWith("#")) {
      const tvgId = (currentExtinf.match(/tvg-id="([^"]*)"/) || [])[1] || ""
      const tvgLogo = (currentExtinf.match(/tvg-logo="([^"]*)"/) || [])[1] || ""
      const groupTitle = (currentExtinf.match(/group-title="([^"]*)"/) || [])[1] || "Sem categoria"
      const name = currentExtinf.split(",").pop()?.trim() || "Canal Desconhecido"

      channels.push({
        id: tvgId || `ch-${channels.length}`,
        name,
        url: trimmed,
        logo: tvgLogo,
        category: forceCategory ?? groupTitle,
        tvgId,
        raw: currentExtinf,
      })
      currentExtinf = null
    }
  }

  return channels
}

export function extractCountry(channel: M3UChannel): string | null {
  const tvgCountry = channel.raw?.match(/tvg-country="([^"]*)"/)?.[1]
  if (tvgCountry && tvgCountry !== "ALL" && tvgCountry.trim()) {
    return tvgCountry.trim().toUpperCase()
  }
  const id = channel.tvgId || channel.id
  const dotAtMatch = id.match(/\.([a-zA-Z]{2,3})@/)
  if (dotAtMatch) return dotAtMatch[1].toUpperCase()
  const dotTldMatch = id.match(/\.([a-zA-Z]{2,3})$/)
  if (dotTldMatch) return dotTldMatch[1].toUpperCase()
  const shortId = id.match(/^([a-zA-Z]{2,3})$/)
  if (shortId) return shortId[1].toUpperCase()
  return null
}
