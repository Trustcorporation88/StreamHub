export type OfficialWatchInfo = {
  provider: string
  href: string
  headline: string
  body: string
  cta: string
  secondaryHref?: string
  secondaryCta?: string
}

const GLOBO_YOUTUBE = "https://www.youtube.com/@tvglobo"
const GLOBO_PLAY_LIVE = "https://globoplay.globo.com/tv-globo/ao-vivo/6120663/"

function isGloboOfficialHost(host: string): boolean {
  return host === "globoplay.globo.com" || host === "globo.com" || host.endsWith(".globo.com")
}

/** Official linear destinations that cannot be embedded (CSP / X-Frame-Options). */
export function getOfficialWatchInfo(src: string): OfficialWatchInfo | null {
  try {
    const u = new URL(src)
    const host = u.hostname.replace(/^www\./, "")
    if (isGloboOfficialHost(host)) {
      return {
        provider: "Globoplay",
        href: src.startsWith("http") ? src : GLOBO_PLAY_LIVE,
        headline: "TV Globo no Globoplay",
        body: "O sinal IPTV antigo foi bloqueado pelo servidor. A programação linear da Globo no Rio é oficial no Globoplay — pode pedir login ou assinatura.",
        cta: "Assistir no Globoplay",
        secondaryHref: GLOBO_YOUTUBE,
        secondaryCta: "Canal oficial no YouTube",
      }
    }
    return null
  } catch {
    return null
  }
}

export const GLOBO_RJ_OFFICIAL_URL = GLOBO_PLAY_LIVE
