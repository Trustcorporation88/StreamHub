import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('./publicDomainFilms.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const { buildSearchUrl, parseSearchResponse, pickPlayableFile, PAGE_SIZE } =
  await import(`data:text/javascript,${encodeURIComponent(outputText)}`)

test('search is limited to public-domain feature films', () => {
  const url = new URL(buildSearchUrl({ genre: 'all', text: '', page: 1 }))
  assert.equal(url.origin, 'https://archive.org')
  const q = url.searchParams.get('q')
  assert.match(q, /collection:feature_films/)
  assert.match(q, /licenseurl:\*publicdomain\*/)
  assert.match(q, /format:\(h\.264 OR "MPEG4"/)
  assert.equal(url.searchParams.get('rows'), String(PAGE_SIZE))
})

test('genre and title search are added; query syntax is stripped from user text', () => {
  const url = new URL(buildSearchUrl({ genre: 'western', text: 'rio "bravo") OR licenseurl:*', page: 3 }))
  const q = url.searchParams.get('q')
  assert.match(q, /subject:western/)
  assert.match(q, /title:\(rio bravo OR licenseurl\)/)
  assert.equal((q.match(/licenseurl:\*publicdomain\*/g) || []).length, 1)
  assert.equal(url.searchParams.get('page'), '3')
})

test('search response becomes film cards and skips broken rows', () => {
  const { films, total } = parseSearchResponse({
    response: {
      numFound: 7667,
      docs: [
        { identifier: 'his_girl_friday', title: 'His Girl Friday', year: 1940 },
        { title: 'no id' },
        { identifier: 'untitled', year: 'n/a' },
      ],
    },
  })
  assert.equal(total, 7667)
  assert.deepEqual(films.map((f) => f.id), ['his_girl_friday', 'untitled'])
  assert.equal(films[0].year, 1940)
  assert.equal(films[1].title, 'untitled')
  assert.equal(films[1].year, undefined)
  assert.equal(films[0].poster, 'https://archive.org/services/img/his_girl_friday')
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

test('file names with spaces or folders are encoded per segment', () => {
  const url = pickPlayableFile('item', {
    metadata: { licenseurl: 'http://creativecommons.org/publicdomain/mark/1.0/' },
    files: [{ name: 'part one/My Film.mp4', format: 'h.264' }],
  })
  assert.equal(url, 'https://archive.org/download/item/part%20one/My%20Film.mp4')
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
