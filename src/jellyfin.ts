export const JELLYFIN_URL =
  (import.meta.env.VITE_JELLYFIN_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://jellyfin.seligaaqui.online"

export const JELLYFIN_FALLBACK_URL = "https://jellyfin-production-a6ad.up.railway.app"

export const JELLYFIN_MEDIA_PATH = "/data/media"
