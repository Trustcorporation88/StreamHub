export type FilmGenre = "terror" | "comedia" | "suspense" | "faroeste" | "ficcao" | "drama"

export interface PublicDomainFilm {
  /** Internet Archive item identifier. */
  id: string
  title: string
  /** Brazilian release title, when there is a well-known one. */
  ptTitle?: string
  year: number
  genre: FilmGenre
  poster: string
}

interface ArchiveFile {
  name?: string
  format?: string
  height?: string | number
}

interface ArchiveMetadata {
  metadata?: { licenseurl?: string }
  files?: ArchiveFile[]
}

const METADATA_URL = "https://archive.org/metadata/"
const DOWNLOAD_URL = "https://archive.org/download/"

export const FILM_GENRES: { id: FilmGenre | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "terror", label: "Terror" },
  { id: "comedia", label: "Comédia" },
  { id: "suspense", label: "Suspense e policial" },
  { id: "ficcao", label: "Ficção científica" },
  { id: "faroeste", label: "Faroeste" },
  { id: "drama", label: "Drama" },
]

export function posterUrl(id: string): string {
  return `https://archive.org/services/img/${encodeURIComponent(id)}`
}

type Entry = [id: string, title: string, year: number, genre: FilmGenre, ptTitle?: string]

// Hand-picked, well-known titles. Each item was checked on archive.org for a
// public-domain mark and a complete, browser-playable MP4. Titles whose US
// copyright was restored (most British Hitchcock films, for example) are left
// out on purpose.
const ENTRIES: Entry[] = [
  ["Night.Of.The.Living.Dead_1080p", "Night of the Living Dead", 1968, "terror", "A Noite dos Mortos-Vivos"],
  ["charade-1963-cary-grant-audrey-hepburn-comedy-mystery-romance-thriller-full-movie", "Charade", 1963, "suspense", "Charada"],
  ["his_girl_friday", "His Girl Friday", 1940, "comedia", "Jejum de Amor"],
  ["metropolis-1927-bdrip-1080p-x-265-dts-hd-ma-5.1-d-0ct-0r-lew-sev", "Metropolis", 1927, "ficcao", "Metrópolis"],
  ["Nosferatu1922VHS", "Nosferatu", 1922, "terror"],
  ["The_General_Buster_Keaton", "The General", 1926, "comedia", "A General"],
  ["the-gold-rush-film-1925", "The Gold Rush", 1925, "comedia", "Em Busca do Ouro"],
  ["the-circus-1928-remastered-bluray-1080p-flac-1.0-x264-sinners", "The Circus", 1928, "comedia", "O Circo"],
  ["safety-last-1923-by-fred-c.-newmeyer-and-sam-taylor", "Safety Last!", 1923, "comedia", "O Homem Mosca"],
  ["sherlockjr1924_201909", "Sherlock Jr.", 1924, "comedia"],
  ["steamboat_bill_ipod", "Steamboat Bill, Jr.", 1928, "comedia"],
  ["our-hospitality-1923-by-buster-keaton-and-john-g.-blystone", "Our Hospitality", 1923, "comedia"],
  ["house_on_haunted_hill_ipod", "House on Haunted Hill", 1959, "terror", "A Casa dos Maus Espíritos"],
  ["The_Little_Shop_of_Horrors.mpeg", "The Little Shop of Horrors", 1960, "terror", "A Pequena Loja dos Horrores"],
  ["CarnivalofSouls", "Carnival of Souls", 1962, "terror"],
  ["TheLastManOnEarth1964_201808", "The Last Man on Earth", 1964, "terror", "Mortos que Matam"],
  ["DasKabinettdesDoktorCaligariTheCabinetofDrCaligari", "The Cabinet of Dr. Caligari", 1920, "terror", "O Gabinete do Dr. Caligari"],
  ["ThePhantomoftheOpera", "The Phantom of the Opera", 1925, "terror", "O Fantasma da Ópera"],
  ["dr.-jekyll-and-mr.-hyde-1920_202504", "Dr. Jekyll and Mr. Hyde", 1920, "terror", "O Médico e o Monstro"],
  ["dementia-13-1963_202312", "Dementia 13", 1963, "terror"],
  ["TheTerror", "The Terror", 1963, "terror"],
  ["The_Killer_Shrews_1959", "The Killer Shrews", 1959, "terror"],
  ["plan-9-from-outer-space-1957-by-ed-wood", "Plan 9 from Outer Space", 1957, "ficcao", "Plano 9 do Espaço Sideral"],
  ["le-voyage-dans-la-lune-1902-georges-melies", "A Trip to the Moon", 1902, "ficcao", "Viagem à Lua"],
  ["lost_world", "The Lost World", 1925, "ficcao", "O Mundo Perdido"],
  ["robot-monster-1953", "Robot Monster", 1953, "ficcao"],
  ["teenagers_from_outerspace", "Teenagers from Outer Space", 1959, "ficcao"],
  ["The_Amazing_Transparent_Man", "The Amazing Transparent Man", 1960, "ficcao"],
  ["santa-claus-conquers-the-martians-1964", "Santa Claus Conquers the Martians", 1964, "ficcao"],
  ["Detour", "Detour", 1945, "suspense", "Curva do Destino"],
  ["d.-o.-a.-1949-dvd-upscale", "D.O.A.", 1950, "suspense"],
  ["TheStranger_0", "The Stranger", 1946, "suspense", "O Estranho"],
  ["ScarletStreet", "Scarlet Street", 1945, "suspense", "Almas Perversas"],
  ["Hitch_Hiker", "The Hitch-Hiker", 1953, "suspense"],
  ["suddenly", "Suddenly", 1954, "suspense"],
  ["kansascityconfidencial", "Kansas City Confidential", 1952, "suspense"],
  ["The_Big_Combo_1955", "The Big Combo", 1955, "suspense"],
  ["mclintok_widescreen", "McLintock!", 1963, "faroeste"],
  ["angel_and_the_badman", "Angel and the Badman", 1947, "faroeste"],
  ["the.-outlaw.-1943.1080p.-blu-ray.x-264-sadpanda", "The Outlaw", 1943, "faroeste", "O Proscrito"],
  ["TheGreatTrainRobbery1903_201307", "The Great Train Robbery", 1903, "faroeste", "O Grande Roubo do Trem"],
  ["meet_john_doe", "Meet John Doe", 1941, "drama"],
  ["AStarIsBorn", "A Star Is Born", 1937, "drama", "Nasce uma Estrela"],
  ["the.-man.with.the.-golden.-arm.-1955.1080p.-blu-ray.-x-264-amiable-no-concorde", "The Man with the Golden Arm", 1955, "drama", "O Homem do Braço de Ouro"],
  ["BattleshipPotemkin", "Battleship Potemkin", 1925, "drama", "O Encouraçado Potemkin"],
  ["The_Hunchback_of_Notre_Dame", "The Hunchback of Notre Dame", 1923, "drama", "O Corcunda de Notre Dame"],
  ["sunrise-1927_202301", "Sunrise", 1927, "drama", "Aurora"],
  ["wings-1927-by-william-a.-wellman", "Wings", 1927, "drama", "Asas"],
  ["Intolerance", "Intolerance", 1916, "drama", "Intolerância"],
  ["nanook-of-the-north-1922-tmdb669", "Nanook of the North", 1922, "drama", "Nanook, o Esquimó"],
  ["penny_serenade", "Penny Serenade", 1941, "drama"],
  ["Kilimanjaro", "The Snows of Kilimanjaro", 1952, "drama", "As Neves do Kilimanjaro"],
  ["rain1932", "Rain", 1932, "drama"],
  ["humanbondage", "Of Human Bondage", 1934, "drama", "Escravos do Desejo"],
  ["salt-of-the-earth-1954", "Salt of the Earth", 1954, "drama", "O Sal da Terra"],
  ["NothingSacred", "Nothing Sacred", 1937, "comedia"],
  ["royal_wedding", "Royal Wedding", 1951, "comedia", "Núpcias Reais"],
  ["TheRoadToBali", "Road to Bali", 1952, "comedia"],
]

export const FILMS: PublicDomainFilm[] = ENTRIES.map(([id, title, year, genre, ptTitle]) => ({
  id,
  title,
  ptTitle,
  year,
  genre,
  poster: posterUrl(id),
}))

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function filterFilms(films: PublicDomainFilm[], genre: string, text: string): PublicDomainFilm[] {
  const q = normalize(text.trim())
  return films.filter((film) => {
    if (genre !== "all" && film.genre !== genre) return false
    if (!q) return true
    return normalize(`${film.title} ${film.ptTitle ?? ""} ${film.year}`).includes(q)
  })
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

export async function resolveFilmUrl(id: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${METADATA_URL}${encodeURIComponent(id)}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const url = pickPlayableFile(id, (await res.json()) as ArchiveMetadata)
  if (!url) throw new Error("Este filme não está disponível para tocar agora.")
  return url
}
