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
export const CAZE_TV_OFFICIAL_URL = "https://www.youtube.com/@cazetv"

function isCazeOfficialChannel(host: string, path: string): boolean {
  return host === "youtube.com" && /^\/(?:@cazetv|c\/cazetv)(?:\/(?:live|streams))?\/?$/i.test(path)
}

function isLegacyCazeStream(host: string, path: string): boolean {
  return host === "dfr80qz435crc.cloudfront.net" &&
    path === "/MNOP/Amagi/Caze/Caze_TV_BR/Caze_TV.m3u8"
}

function isGloboOfficialHost(host: string): boolean {
  return host === "globoplay.globo.com" || host === "globo.com" || host.endsWith(".globo.com")
}

/** Official watch pages and safe replacements for known unavailable streams. */
export function getOfficialWatchInfo(src: string): OfficialWatchInfo | null {
  try {
    const u = new URL(src)
    const host = u.hostname.replace(/^www\./, "")
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    if (isCazeOfficialChannel(host, u.pathname) || isLegacyCazeStream(host, u.pathname)) {
      return {
        provider: "YouTube · CazéTV",
        href: CAZE_TV_OFFICIAL_URL,
        headline: "Assista à CazéTV no YouTube",
        body: "A fonte de vídeo usada aqui está indisponível. Abra o canal oficial da CazéTV no YouTube para ver as transmissões disponíveis. A reprodução acontece no YouTube, em uma nova aba.",
        cta: "Abrir CazéTV no YouTube",
      }
    }
    if (isGloboOfficialHost(host)) {
      if (host !== "globoplay.globo.com" || u.pathname.replace(/\/$/, "") !== "/tv-globo/ao-vivo/6120663") {
        return {
          provider: "Globo",
          href: src,
          headline: "Assista na plataforma oficial",
          body: "Abra o conteúdo na plataforma oficial da Globo. As condições de acesso, login e assinatura dependem do conteúdo escolhido.",
          cta: "Abrir na Globo",
        }
      }
      return {
        provider: "Globoplay",
        href: src.startsWith("http") ? src : GLOBO_PLAY_LIVE,
        headline: "TV Globo ao vivo grátis",
        body: "Para assistir, é obrigatório fazer login na Conta Globo. Se ainda não tiver uma conta, cadastre-se gratuitamente. Não precisa de assinatura nem de cartão de crédito. A disponibilidade do sinal depende da sua localização.",
        cta: "Assistir grátis no Globoplay",
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
