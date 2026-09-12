export type OfficialWatchInfo = {
  provider: string
  href: string
  headline: string
  body: string
  note?: string
  cta: string
  secondaryHref?: string
  secondaryCta?: string
}

const GLOBO_PLAY_LIVE =
  "https://globoplay.globo.com/tv-globo/ao-vivo/6120663/?origemId=93228&glbproduct=UA-296593-56&assinaturaHIT=desconhecido"

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
        headline: "Assista à TV Globo ao vivo gratuitamente",
        body: "Clique no link abaixo e faça login na sua Conta Globo para assistir. Se ainda não tiver uma conta, cadastre-se gratuitamente.",
        note: "É grátis e não é necessário informar cartão de crédito. O login é obrigatório para acessar a transmissão.",
        cta: "Assistir à TV Globo ao vivo",
      }
    }
    return null
  } catch {
    return null
  }
}

export const GLOBO_RJ_OFFICIAL_URL = GLOBO_PLAY_LIVE
