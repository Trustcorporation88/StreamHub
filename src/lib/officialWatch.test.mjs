import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

// Run against the actual TypeScript module without adding a test dependency.
const source = readFileSync(new URL('./officialWatch.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const { getOfficialWatchInfo, CAZE_TV_OFFICIAL_URL, GLOBO_RJ_OFFICIAL_URL } =
  await import(`data:text/javascript,${encodeURIComponent(outputText)}`)

for (const url of [
  CAZE_TV_OFFICIAL_URL,
  'https://youtube.com/@cazetv/',
  'https://www.youtube.com/c/cazetv',
  'https://www.youtube.com/@cazetv/streams',
  'https://www.youtube.com/@cazetv/live?feature=shared',
  'https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8',
  'https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8?example=1',
]) {
  test(`Caze official destination: ${url}`, () => {
    const info = getOfficialWatchInfo(url)
    assert.equal(info.href, CAZE_TV_OFFICIAL_URL)
    assert.equal(info.cta, 'Abrir CazéTV no YouTube')
    assert.match(info.body, /nova aba/)
  })
}

for (const url of [
  'https://www.youtube.com/@CNNbrasil',
  'https://www.youtube.com/watch?v=example',
  'https://youtube.com.evil.example/@cazetv',
  'https://www.youtube.com/@cazetv-fake',
  'https://dfr80qz435crc.cloudfront.net/another-channel.m3u8',
  'https://example.com/channel.m3u8',
  'https://globo.com.evil.example/',
  'ftp://globoplay.globo.com/tv-globo/ao-vivo/6120663/',
  'javascript:alert(1)',
  'not-a-url',
]) {
  test(`Unrelated or unsafe URL is not an official card: ${url}`, () => {
    assert.equal(getOfficialWatchInfo(url), null)
  })
}

test('TV Globo live requires free login without a credit card; regional caveat retained', () => {
  const info = getOfficialWatchInfo(`${GLOBO_RJ_OFFICIAL_URL}?origemId=93228`)
  assert.match(info.body, /obrigatório fazer login na Conta Globo/)
  assert.match(info.body, /gratuitamente/)
  assert.match(info.body, /Não precisa de assinatura nem de cartão de crédito/)
  assert.match(info.body, /localização/)
  assert.equal(info.cta, 'Assistir grátis no Globoplay')
  assert.equal(info.href, `${GLOBO_RJ_OFFICIAL_URL}?origemId=93228`)
})

test('Other Globo content does not inherit the free live-TV promise', () => {
  const info = getOfficialWatchInfo('https://globoplay.globo.com/filme/exemplo/')
  assert.doesNotMatch(info.body, /Não precisa|gratuitamente/)
  assert.match(info.body, /dependem do conteúdo/)
})

test('Curated Caze channel no longer uses the blocked HLS URL', () => {
  const component = readFileSync(new URL('../components/LiveStreams.tsx', import.meta.url), 'utf8')
  assert.match(component, /id: "caze-tv",[\s\S]*?url: CAZE_TV_OFFICIAL_URL/)
  assert.doesNotMatch(component, /Caze_TV\.m3u8/)
})
