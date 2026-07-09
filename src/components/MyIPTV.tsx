import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  KeyRound,
  Link2,
  Loader2,
  AlertTriangle,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  LogOut,
  Tv,
  ShieldCheck,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import VideoPlayer from "./VideoPlayer"
import type { M3UChannel } from "../types"

const STORAGE_KEY = "myiptv-config-v1"

interface MyIPTVConfig {
  mode: "xtream" | "m3u"
  host: string
  username: string
  password: string
  m3uUrl: string
}

const EMPTY_CONFIG: MyIPTVConfig = { mode: "xtream", host: "", username: "", password: "", m3uUrl: "" }

function loadConfig(): MyIPTVConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MyIPTVConfig
    if (parsed.mode === "m3u" && parsed.m3uUrl) return parsed
    if (parsed.mode === "xtream" && parsed.host && parsed.username && parsed.password) return parsed
    return null
  } catch {
    return null
  }
}

function buildPlaylistUrl(cfg: MyIPTVConfig): string {
  if (cfg.mode === "m3u") {
    // Normaliza links "ts" para "m3u8" — o player funciona com HLS
    return cfg.m3uUrl
      .trim()
      .replace(/output=ts\b/i, "output=m3u8")
      .replace(/\/m3u-ts\//i, "/m3u-m3u8/")
      .replace(/\/ss-ts\//i, "/m3u-m3u8/")
  }
  const host = cfg.host.trim().replace(/\/+$/, "")
  const base = /^https?:\/\//i.test(host) ? host : `http://${host}`
  return `${base}/get.php?username=${encodeURIComponent(cfg.username.trim())}&password=${encodeURIComponent(cfg.password.trim())}&type=m3u_plus&output=m3u8`
}

function toProxyUrl(url: string): string {
  return `/api/iptv-proxy?url=${encodeURIComponent(url)}`
}

function parseM3U(m3u: string): M3UChannel[] {
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
        id: tvgId || `my-${channels.length}`,
        name,
        url: trimmed,
        logo: tvgLogo,
        category: groupTitle,
        tvgId,
        raw: currentExtinf,
      })
      currentExtinf = null
    }
  }
  return channels
}

// Mantém apenas conteúdo de séries.
// Em playlists Xtream, episódios de série ficam sob a rota /series/ e/ou em
// categorias cujo nome contém "serie"/"series". Canais ao vivo (/live/) e
// filmes (/movie/) são descartados.
function onlySeries(channels: M3UChannel[]): M3UChannel[] {
  const byPath = channels.filter((c) => /\/series\//i.test(c.url))
  if (byPath.length > 0) return byPath
  // Fallback: pela categoria, quando a URL não traz a rota
  return channels.filter(
    (c) =>
      /s[ée]rie/i.test(c.category) &&
      !/\/live\//i.test(c.url) &&
      !/\/movie\//i.test(c.url)
  )
}

export default function MyIPTV() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [config, setConfig] = useState<MyIPTVConfig | null>(() => loadConfig())
  const [form, setForm] = useState<MyIPTVConfig>(() => loadConfig() ?? EMPTY_CONFIG)
  const [editing, setEditing] = useState(() => loadConfig() === null)

  const [channels, setChannels] = useState<M3UChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeChannel, setActiveChannel] = useState<M3UChannel | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const panelClass = isDark ? "bg-dark-300/30 border-white/[0.06]" : "bg-white border-slate-200"
  const mutedText = isDark ? "text-dark-100" : "text-slate-500"
  const strongText = isDark ? "text-white" : "text-slate-900"
  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
    isDark
      ? "bg-dark-200/70 border-white/10 text-white placeholder:text-dark-100/60 focus:border-accent/50"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-accent"
  }`

  const fetchPlaylist = useCallback(async (cfg: MyIPTVConfig) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(toProxyUrl(buildPlaylistUrl(cfg)), {
        signal: controller.signal,
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            cfg.mode === "m3u"
              ? "Acesso negado (login ou senha na URL incorretos, ou conta expirada)."
              : "Login ou senha incorretos, ou conta expirada."
          )
        }
        if (res.status === 404) {
          throw new Error("Servidor não encontrado — verifique o endereço do servidor.")
        }
        if (res.status === 512 || res.status === 456) {
          throw new Error(
            "Conta bloqueada ou já em uso em outro dispositivo (limite de conexões atingido)."
          )
        }
        if (res.status === 502 || res.status === 504) {
          throw new Error("O provedor não respondeu a tempo. Tente novamente em instantes.")
        }
        throw new Error(`Não foi possível conectar (código ${res.status}). Confira o servidor e as credenciais.`)
      }
      const text = await res.text()
      if (!text.includes("#EXTINF")) {
        // Provedor respondeu 200 mas sem playlist: quase sempre credenciais inválidas
        const lower = text.toLowerCase()
        if (lower.includes("auth") || lower.includes("expired") || lower.includes("banned") || text.trim().length < 200) {
          throw new Error("Login ou senha incorretos, ou conta expirada.")
        }
        throw new Error("A resposta não é uma playlist válida — confira a URL e as credenciais.")
      }
      const parsed = onlySeries(parseM3U(text))
      if (parsed.length === 0)
        throw new Error("Sua conta está ativa, mas não encontramos séries na sua lista.")
      setChannels(parsed)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      const raw = (err as Error).message || ""
      const msg = /failed to fetch|network|load failed/i.test(raw)
        ? "Não foi possível alcançar o servidor. Verifique o endereço e sua conexão."
        : raw || "Falha ao carregar a playlist."
      setError(msg)
      setChannels([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (config && !editing) fetchPlaylist(config)
  }, [config, editing, fetchPlaylist])

  const saveConfig = () => {
    const cfg = { ...form }
    const valid =
      cfg.mode === "m3u"
        ? cfg.m3uUrl.trim().length > 0
        : cfg.host.trim().length > 0 && cfg.username.trim().length > 0 && cfg.password.trim().length > 0
    if (!valid) {
      setError(cfg.mode === "m3u" ? "Informe a URL da lista M3U" : "Preencha servidor, usuário e senha")
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
    setConfig(cfg)
    setEditing(false)
    setError(null)
  }

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEY)
    setConfig(null)
    setForm(EMPTY_CONFIG)
    setChannels([])
    setActiveChannel(null)
    setEditing(true)
    setError(null)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return channels
    const q = search.toLowerCase()
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    )
  }, [channels, search])

  const grouped = useMemo(() => {
    const map = new Map<string, M3UChannel[]>()
    for (const ch of filtered) {
      if (!map.has(ch.category)) map.set(ch.category, [])
      map.get(ch.category)!.push(ch)
    }
    return Array.from(map.entries())
  }, [filtered])

  const toggleCategory = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  return (
    <div className="flex flex-col gap-5 sm:gap-6 xl:h-full">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isDark ? "bg-accent/20" : "bg-accent/10"}`}>
            <KeyRound className="w-6 h-6 text-accent-light" />
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-extrabold ${strongText}`}>Minhas Séries</h1>
            <p className={`text-xs sm:text-sm ${mutedText}`}>
              Conecte sua conta e assista às séries da sua lista
            </p>
          </div>
        </div>
        {config && !editing && (
          <div className="flex gap-2">
            <button
              onClick={() => config && fetchPlaylist(config)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              onClick={() => setEditing(true)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Editar acesso
            </button>
            <button
              onClick={disconnect}
              className="inline-flex items-center gap-2 rounded-xl bg-sport-red/15 px-3 py-2 text-sm font-semibold text-sport-red transition-colors hover:bg-sport-red/25"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </div>

      {/* Formulário de conexão */}
      {editing && (
        <section className={`rounded-2xl border p-4 sm:p-6 max-w-2xl ${panelClass}`}>
          <div className="flex gap-2 mb-5">
            {(
              [
                { mode: "xtream" as const, label: "Login Xtream", icon: KeyRound },
                { mode: "m3u" as const, label: "URL M3U", icon: Link2 },
              ]
            ).map((opt) => (
              <button
                key={opt.mode}
                onClick={() => setForm((f) => ({ ...f, mode: opt.mode }))}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  form.mode === opt.mode
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : isDark
                      ? "bg-white/10 text-dark-100 hover:bg-white/15"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>

          {form.mode === "xtream" ? (
            <div className="space-y-3">
              <input
                className={inputClass}
                placeholder="Servidor (ex.: http://provedor.com:8080)"
                value={form.host}
                onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Usuário"
                value={form.username}
                autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Senha"
                type="password"
                value={form.password}
                autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
          ) : (
            <input
              className={inputClass}
              placeholder="URL da lista M3U (ex.: http://provedor.com/get.php?username=...&output=m3u8)"
              value={form.m3uUrl}
              onChange={(e) => setForm((f) => ({ ...f, m3uUrl: e.target.value }))}
            />
          )}

          <div className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed ${isDark ? "bg-white/5" : "bg-slate-50"} ${mutedText}`}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-sport-green" />
            Suas credenciais ficam salvas apenas neste navegador (localStorage) e nunca são enviadas ou armazenadas no servidor do StreamHub.
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={saveConfig}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light"
            >
              <Tv className="w-4 h-4" />
              Conectar e carregar canais
            </button>
            {config && (
              <button
                onClick={() => {
                  setForm(config)
                  setEditing(false)
                  setError(null)
                }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancelar
              </button>
            )}
          </div>
        </section>
      )}

      {/* Erro */}
      {error && (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${isDark ? "bg-sport-red/10 border-sport-red/30 text-sport-red" : "bg-red-50 border-red-200 text-red-600"}`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Carregando */}
      {loading && (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-6 justify-center ${panelClass}`}>
          <Loader2 className="w-5 h-5 animate-spin text-accent-light" />
          <span className={`text-sm ${mutedText}`}>Carregando sua playlist...</span>
        </div>
      )}

      {/* Conteúdo */}
      {!editing && !loading && channels.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr] xl:min-h-0 xl:flex-1">
          {/* Lista de canais */}
          <div className="flex flex-col min-h-0">
            <div className="relative mb-3">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
              <input
                className={`${inputClass} pl-10 pr-10`}
                placeholder={`Buscar entre ${channels.length.toLocaleString("pt-BR")} séries...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
                >
                  <X className={`w-4 h-4 ${mutedText}`} />
                </button>
              )}
            </div>

            <div className={`rounded-2xl border overflow-y-auto max-h-[420px] xl:max-h-none xl:flex-1 ${panelClass}`}>
              {grouped.length === 0 && (
                <p className={`p-4 text-sm ${mutedText}`}>Nenhuma série encontrada</p>
              )}
              {grouped.map(([category, list]) => {
                const isOpen = expanded.has(category) || search.trim().length > 0
                return (
                  <div key={category} className={`border-b last:border-b-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${strongText} ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      <span className="flex-1 truncate">{category}</span>
                      <span className={`text-xs font-normal ${mutedText}`}>{list.length}</span>
                    </button>
                    {isOpen &&
                      list.map((ch) => (
                        <button
                          key={`${ch.id}-${ch.url}`}
                          onClick={() => setActiveChannel(ch)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                            activeChannel?.url === ch.url
                              ? isDark
                                ? "bg-accent/20 text-accent-light"
                                : "bg-accent/10 text-accent-dark"
                              : `${mutedText} ${isDark ? "hover:bg-white/[0.03] hover:text-white" : "hover:bg-slate-50 hover:text-slate-900"}`
                          }`}
                        >
                          {ch.logo ? (
                            <img
                              src={ch.logo}
                              alt=""
                              loading="lazy"
                              className="w-7 h-7 rounded object-contain bg-black/20 shrink-0"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          ) : (
                            <Tv className="w-5 h-5 shrink-0 opacity-50" />
                          )}
                          <span className="truncate">{ch.name}</span>
                        </button>
                      ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Player */}
          <div className="min-h-0">
            {activeChannel ? (
              <div className="flex flex-col gap-3">
                <VideoPlayer src={activeChannel.url} title={activeChannel.name} />
                <div className={`rounded-2xl border px-4 py-3 ${panelClass}`}>
                  <p className={`text-sm font-bold ${strongText}`}>{activeChannel.name}</p>
                  <p className={`text-xs ${mutedText}`}>{activeChannel.category}</p>
                </div>
              </div>
            ) : (
              <div className={`flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border ${panelClass}`}>
                <Tv className={`w-10 h-10 ${mutedText}`} />
                <p className={`text-sm ${mutedText}`}>Selecione uma série para começar a assistir</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
