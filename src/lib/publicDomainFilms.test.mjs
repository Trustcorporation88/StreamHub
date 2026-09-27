import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('./publicDomainFilms.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const { FILMS, FILM_GENRES, filterFilms, pickPlayableFile } =
  await import(`data:text/javascript,${encodeURIComponent(outputText)}`)

test('catalog is a fixed list of known titles with unique ids and valid genres', () => {
  assert.ok(FILMS.length >= 50)
  const ids = new Set(FILMS.map((f) => f.id))
  assert.equal(ids.size, FILMS.length)
  const genres = new Set(FILM_GENRES.map((g) => g.id))
  for (const film of FILMS) {
    assert.ok(genres.has(film.genre), `${film.title} has unknown genre ${film.genre}`)
    assert.ok(film.year >= 1900 && film.year <= 1970, `${film.title} year ${film.year}`)
    assert.equal(film.poster, `https://archive.org/services/img/${encodeURIComponent(film.id)}`)
  }
  for (const title of ['Night of the Living Dead', 'Nosferatu', 'Metropolis', 'Charade', 'His Girl Friday']) {
    assert.ok(FILMS.some((f) => f.title === title), `missing ${title}`)
  }
})

test('search matches original and Brazilian titles, ignoring accents and case', () => {
  assert.deepEqual(filterFilms(FILMS, 'all', 'mortos-vivos').map((f) => f.title), ['Night of the Living Dead'])
  assert.deepEqual(filterFilms(FILMS, 'all', 'METROPOLIS').map((f) => f.title), ['Metropolis'])
  assert.deepEqual(filterFilms(FILMS, 'all', 'encouracado').map((f) => f.title), ['Battleship Potemkin'])
  assert.equal(filterFilms(FILMS, 'all', '').length, FILMS.length)
})

test('genre filter keeps only that genre', () => {
  const westerns = filterFilms(FILMS, 'faroeste', '')
  assert.ok(westerns.length > 0)
  assert.ok(westerns.every((f) => f.genre === 'faroeste'))
  assert.deepEqual(filterFilms(FILMS, 'faroeste', 'nosferatu'), [])
})

test('prefers the h.264 MP4 and builds a download URL', () => {
  const url = pickPlayableFile('his_girl_friday', {
    metadata: { licenseurl: 'http://creativecommons.org/licenses/publicdomain/' },
    files: [
      { name: 'his_girl_friday_512kb.mp4', format: '512Kb MPEG4', height: '240' },
      { name: 'his_girl_friday.mp4', format: 'h.264', height: '480' },
      { name: 'his_girl_friday.ogv', format: 'Ogg Video' },
    ],
  })
  assert.equal(url, 'https://archive.org/download/his_girl_friday/his_girl_friday.mp4')
})

test('never picks a Matroska original over the MP4 derivative', () => {
  const url = pickPlayableFile('m', {
    metadata: { licenseurl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
    files: [
      { name: 'Metropolis 1927 BDrip 1080p x265.mkv', format: 'Matroska', height: '1080' },
      { name: 'Metropolis 1927 BDrip 1080p x265.mp4', format: 'h.264', height: '480' },
    ],
  })
  assert.equal(url, 'https://archive.org/download/m/Metropolis%201927%20BDrip%201080p%20x265.mp4')
})

test('items without a public-domain license or without MP4 do not play', () => {
  assert.equal(
    pickPlayableFile('x', { metadata: { licenseurl: 'http://creativecommons.org/licenses/by-nc/3.0/' }, files: [{ name: 'a.mp4' }] }),
    null
  )
  assert.equal(pickPlayableFile('x', { metadata: {}, files: [{ name: 'a.mp4' }] }), null)
  assert.equal(
    pickPlayableFile('x', { metadata: { licenseurl: 'http://creativecommons.org/licenses/publicdomain/' }, files: [{ name: 'a.ogv' }] }),
    null
  )
})
