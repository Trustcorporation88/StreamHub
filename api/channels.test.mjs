import assert from 'node:assert/strict'
import test from 'node:test'
import { FALLBACK_CHANNELS, getChannels, toChannel } from './channels.js'

const record = fields => ({ id: 'rec1', fields })

test('maps an Airtable record to the Channel shape used by the UI', () => {
  const ch = toChannel(
    record({
      id: 'band',
      nome: 'Band',
      url: 'https://exemplo.com/band.m3u8',
      categoria: 'Brasil',
      qualidade: 'HD',
      ordem: 10,
    })
  )
  assert.equal(ch.id, 'band')
  assert.equal(ch.name, 'Band')
  assert.equal(ch.url, 'https://exemplo.com/band.m3u8')
  assert.equal(ch.category, 'Brasil')
  assert.equal(ch.quality, 'HD')
})

test('accepts English and capitalised column names', () => {
  const ch = toChannel(
    record({ Nome: 'CNN', URL: 'https://exemplo.com/cnn.m3u8', Categoria: 'Brasil' })
  )
  assert.equal(ch.name, 'CNN')
  assert.equal(ch.category, 'Brasil')
})

test('derives an id from the name when the column is empty', () => {
  const ch = toChannel(record({ nome: 'TV Canção Nova', url: 'https://exemplo.com/a.m3u8' }))
  assert.equal(ch.id, 'tv-cancao-nova')
})

test('defaults category and quality when the columns are blank', () => {
  const ch = toChannel(record({ nome: 'X', url: 'https://exemplo.com/x.m3u8' }))
  assert.equal(ch.category, 'Outros')
  assert.equal(ch.quality, 'HD')
})

test('drops rows that are unusable or unsafe', () => {
  assert.equal(toChannel(record({ nome: 'Sem URL' })), null)
  assert.equal(toChannel(record({ url: 'https://exemplo.com/a.m3u8' })), null)
  assert.equal(toChannel(record({ nome: 'X', url: 'javascript:alert(1)' })), null)
  assert.equal(toChannel(record({ nome: 'X', url: 'data:text/html,<script>' })), null)
  assert.equal(toChannel(record({ nome: 'X', url: 'nao-e-url' })), null)
})

test('respects the ativo checkbox', () => {
  assert.equal(toChannel(record({ nome: 'X', url: 'https://e.com/x.m3u8', ativo: false })), null)
  assert.ok(toChannel(record({ nome: 'X', url: 'https://e.com/x.m3u8', ativo: true })))
  // Sem a coluna, o canal continua publicado — não exigimos a planilha completa.
  assert.ok(toChannel(record({ nome: 'X', url: 'https://e.com/x.m3u8' })))
})

test('reads the logo from an Airtable attachment or a plain URL', () => {
  const anexo = toChannel(
    record({ nome: 'X', url: 'https://e.com/x.m3u8', logo: [{ url: 'https://e.com/l.png' }] })
  )
  assert.equal(anexo.logo, 'https://e.com/l.png')
  const texto = toChannel(
    record({ nome: 'X', url: 'https://e.com/x.m3u8', logo: 'https://e.com/t.png' })
  )
  assert.equal(texto.logo, 'https://e.com/t.png')
  const ruim = toChannel(record({ nome: 'X', url: 'https://e.com/x.m3u8', logo: 'javascript:1' }))
  assert.equal(ruim.logo, undefined)
})

test('carries the official website link when present and safe', () => {
  const ok = toChannel(
    record({ nome: 'X', url: 'https://e.com/x.m3u8', site: 'https://canal.com.br/' })
  )
  assert.equal(ok.website, 'https://canal.com.br/')
  const ruim = toChannel(
    record({ nome: 'X', url: 'https://e.com/x.m3u8', site: 'javascript:alert(1)' })
  )
  assert.equal(ruim.website, undefined)
})

test('falls back to the bundled list when Airtable is not configured', async () => {
  delete process.env.AIRTABLE_TOKEN
  delete process.env.AIRTABLE_BASE_ID
  const result = await getChannels({ force: true })
  assert.equal(result.source, 'fallback')
  assert.equal(result.channels.length, FALLBACK_CHANNELS.length)
  assert.ok(result.channels.length > 0)
})
