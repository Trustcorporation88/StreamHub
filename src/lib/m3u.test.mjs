import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('./m3u.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const { parseM3U } = await import(`data:text/javascript,${encodeURIComponent(outputText)}`)

test('Globo channels are dropped from IPTV playlists', () => {
  const playlist = [
    '#EXTM3U',
    '#EXTINF:-1 tvg-id="RedeGlobo.br@SD" group-title="Undefined",Rede Globo (720p)',
    'https://example.com/globo.m3u8',
    '#EXTINF:-1 tvg-id="GloboNews.br@SD" group-title="News",GloboNews (720p)',
    'https://example.com/globonews.m3u8',
    '#EXTINF:-1 tvg-id="RecordNews.br@SD" group-title="News",Record News (720p)',
    'https://example.com/record.m3u8',
  ].join('\n')
  const channels = parseM3U(playlist, 'Brasil')
  assert.deepEqual(channels.map((c) => c.name), ['Record News (720p)'])
  assert.equal(channels[0].url, 'https://example.com/record.m3u8')
})
