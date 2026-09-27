export interface PublicDomainFilm {
  id: string
  title: string
  year?: number
  poster: string
}

export interface FilmGenre {
  id: string
  label: string
  query: string
}

interface ArchiveFile {
  name?: string
  format?: string
  height?: string | number
  size?: string | number
}

interface ArchiveMetadata {
  metadata?: { licenseurl?: string; title?: string }
  files?: ArchiveFile[]
}

const SEARCH_URL = "https://archive.org/advancedsearch.php"
const METADATA_URL = "https://archive.org/metadata/"
const DOWNLOAD_URL = "https://archive.org/download/"
export const PAGE_SIZE = 24

// Only items the uploader marked as public domain. Everything else in the
// feature_films collection may still be under copyright. The format clause
// drops items whose video was taken down and only metadata is left.
const BASE_QUERY =
  'collection:feature_films AND mediatype:movies AND licenseurl:*publicdomain* AND format:(h.264 OR "MPEG4" OR "512Kb MPEG4")'

export const FILM_GENRES: FilmGenre[] = [
  { id: "all", label: "Todos", query: "" },
  { id: "comedy", label: "Comédia", query: "subject:comedy" },
  { id: "horror", label: "Terror e ficção", query: 'subject:(horror OR "science fiction")' },
  { id: "noir", label: "Noir e policial", query: "subject:(noir OR crime)" },
  { id: "western", label: "Faroeste", query: "subject:western" },
  { id: "silent", label: "Cinema mudo", query: "subject:silent" },
]

function cleanSearchText(text: string): string {
  return text.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
}

export function buildSearchUrl({ genre, text, page }: { genre: string; text: string; page: number }): string {
  const parts = [BASE_QUERY]
  const genreQuery = FILM_GENRES.find((g) => g.id === genre)?.query
  if (genreQuery) parts.push(genreQuery)
  const cleaned = cleanSearchText(text)
  if (cleaned) parts.push(`title:(${cleaned})`)

  const params = new URLSearchParams()
  params.set("q", parts.join(" AND "))
  for (const field of ["identifier", "title", "year"]) params.append("fl[]", field)
  params.append("sort[]", "downloads desc")
  params.set("rows", String(PAGE_SIZE))
  params.set("page", String(Math.max(1, page)))
  params.set("output", "json")
  return `${SEARCH_URL}?${params.toString()}`
}

export function posterUrl(id: string): string {
  return `https://archive.org/services/img/${encodeURIComponent(id)}`
}

export function parseSearchResponse(data: unknown): { films: PublicDomainFilm[]; total: number } {
  const response = (data as { response?: { numFound?: number; docs?: unknown[] } })?.response
  const docs = Array.isArray(response?.docs) ? response.docs : []
  const films: PublicDomainFilm[] = []
  for (const raw of docs) {
    const doc = raw as { identifier?: unknown; title?: unknown; year?: unknown }
    if (typeof doc.identifier !== "string" || !doc.identifier) continue
    const year = Number(doc.year)
    films.push({
      id: doc.identifier,
      title: typeof doc.title === "string" && doc.title.trim() ? doc.title.trim() : doc.identifier,
      year: Number.isFinite(year) && year > 1800 ? year : undefined,
      poster: posterUrl(doc.identifier),
    })
  }
  return { films, total: typeof response?.numFound === "number" ? response.numFound : films.length }
}

function isPublicDomain(licenseUrl: string | undefined): boolean {
  return typeof licenseUrl === "string" && /publicdomain/i.test(licenseUrl)
}

function fileRank(file: ArchiveFile): number {
  const format = String(file.format || "")
  if (/^h\.264$/i.test(format)) return 3
  if (/MPEG4/i.test(format)) return 2
  return 1
}

/** Picks the MP4 the browser can play, or null when the item is not public domain. */
export function pickPlayableFile(id: string, data: ArchiveMetadata): string | null {
  if (!isPublicDomain(data.metadata?.licenseurl)) return null
  const files = Array.isArray(data.files) ? data.files : []
  const mp4s = files.filter((f) => typeof f.name === "string" && /\.mp4$/i.test(f.name))
  if (mp4s.length === 0) return null
  const best = [...mp4s].sort((a, b) => fileRank(b) - fileRank(a) || Number(b.height || 0) - Number(a.height || 0))[0]
  const path = String(best.name).split("/").map(encodeURIComponent).join("/")
  return `${DOWNLOAD_URL}${encodeURIComponent(id)}/${path}`
}

export async function searchFilms(
  opts: { genre: string; text: string; page: number },
  signal?: AbortSignal
): Promise<{ films: PublicDomainFilm[]; total: number }> {
  const res = await fetch(buildSearchUrl(opts), { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseSearchResponse(await res.json())
}

export async function resolveFilmUrl(id: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${METADATA_URL}${encodeURIComponent(id)}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const url = pickPlayableFile(id, (await res.json()) as ArchiveMetadata)
  if (!url) throw new Error("Este filme não tem um arquivo em domínio público que o navegador consiga tocar.")
  return url
}
