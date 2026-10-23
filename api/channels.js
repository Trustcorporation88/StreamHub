import { readFileSync } from "node:fs"

/**
 * Lista curada de canais, servida a partir de uma base no Airtable.
 *
 * O navegador NUNCA fala com o Airtable: o token é secreto e vive apenas aqui,
 * no servidor. O front-end chama /api/channels no próprio domínio, o que também
 * evita CORS e mantém o site dentro do limite de 5 req/s da API do Airtable.
 *
 * Variáveis de ambiente (Railway):
 *   AIRTABLE_TOKEN   - Personal Access Token com escopo data.records:read
 *   AIRTABLE_BASE_ID - id da base (começa com "app")
 *   AIRTABLE_TABLE   - nome da tabela (padrão: "Canais")
 *
 * Sem essas variáveis — ou se o Airtable falhar — a rota devolve a lista
 * embutida em src/data/channels.json. O site nunca fica sem canais.
 */

const FALLBACK_CHANNELS = JSON.parse(
  readFileSync(new URL("../src/data/channels.json", import.meta.url), "utf8")
)

const CACHE_MS = 5 * 60 * 1000
const AIRTABLE_TIMEOUT_MS = 10000

let cache = { ts: 0, channels: null, source: null }

/** Aceita variações de nome de campo para não quebrar se a coluna for renomeada. */
function pick(fields, ...names) {
  for (const n of names) {
    const v = fields[n]
    if (v !== undefined && v !== null && String(v).trim() !== "") return v
  }
  return undefined
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Só aceitamos http(s): nada de javascript: ou data: vindo de uma planilha. */
function isSafeUrl(value) {
  try {
    const u = new URL(String(value))
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

/** Converte um registro do Airtable no formato Channel usado pelo front-end. */
function toChannel(record) {
  const f = record.fields || {}
  const url = pick(f, "url", "URL", "stream", "link")
  if (!url || !isSafeUrl(url)) return null

  const name = pick(f, "nome", "Nome", "name", "Name")
  if (!name) return null

  const ativo = pick(f, "ativo", "Ativo", "active")
  if (ativo === false) return null

  const logoField = pick(f, "logo", "Logo")
  const logo = Array.isArray(logoField) ? logoField[0]?.url : logoField
  const website = pick(f, "site", "Site", "website", "Website")

  return {
    id: String(pick(f, "id", "ID", "slug") || slugify(name)),
    name: String(name),
    url: String(url),
    category: String(pick(f, "categoria", "Categoria", "category") || "Outros"),
    quality: String(pick(f, "qualidade", "Qualidade", "quality") || "HD"),
    ...(logo && isSafeUrl(logo) ? { logo: String(logo) } : {}),
    ...(website && isSafeUrl(website) ? { website: String(website) } : {}),
    _ordem: Number(pick(f, "ordem", "Ordem", "order") ?? Number.MAX_SAFE_INTEGER),
  }
}

async function fetchFromAirtable() {
  const token = process.env.AIRTABLE_TOKEN
  const baseId = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_TABLE || "Canais"
  if (!token || !baseId) return null

  const url =
    `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}` +
    `?pageSize=100`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(AIRTABLE_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Airtable HTTP ${res.status}`)

  const body = await res.json()
  const channels = (body.records || [])
    .map(toChannel)
    .filter(Boolean)
    .sort((a, b) => a._ordem - b._ordem)
    .map(({ _ordem, ...ch }) => ch)

  // Uma base vazia (ou toda desativada) não deve apagar os canais do site.
  if (channels.length === 0) throw new Error("Airtable retornou 0 canais válidos")
  return channels
}

/** Lista de canais com cache de 5 min. Nunca lança: cai para o fallback. */
export async function getChannels({ force = false } = {}) {
  if (!force && cache.channels && Date.now() - cache.ts < CACHE_MS) {
    return { channels: cache.channels, source: cache.source, cached: true }
  }

  try {
    const fromAirtable = await fetchFromAirtable()
    if (fromAirtable) {
      cache = { ts: Date.now(), channels: fromAirtable, source: "airtable" }
      return { channels: fromAirtable, source: "airtable", cached: false }
    }
  } catch (err) {
    console.warn("[channels] Airtable indisponível, usando fallback:", err.message)
    // Cache quente vale mais que o arquivo estático quando o Airtable pisca.
    if (cache.channels) {
      return { channels: cache.channels, source: cache.source, cached: true, stale: true }
    }
  }

  cache = { ts: Date.now(), channels: FALLBACK_CHANNELS, source: "fallback" }
  return { channels: FALLBACK_CHANNELS, source: "fallback", cached: false }
}

export async function channelsHandler(req, res) {
  const force = req.query?.refresh === "1"
  const result = await getChannels({ force })
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({
    channels: result.channels,
    source: result.source,
    count: result.channels.length,
  })
}

export { FALLBACK_CHANNELS, toChannel }
