export type Tab =
  | "home"
  | "iptv"
  | "catalog"
  | "mylist"
  | "plex"
  | "sports"
  | "music"
  | "about"
  | "legal"

/**
 * Single source of truth for tab <-> URL. The sidebar, the legacy hash
 * redirect and the router all read from this, so adding a section means
 * touching one list.
 */
export const TAB_PATHS: Record<Tab, string> = {
  home: "/",
  iptv: "/iptv",
  catalog: "/catalog",
  mylist: "/mylist",
  plex: "/plex",
  sports: "/sports",
  music: "/music",
  about: "/about",
  legal: "/legal",
}

export const VALID_TABS = Object.keys(TAB_PATHS) as Tab[]

export function pathForTab(tab: Tab): string {
  return TAB_PATHS[tab]
}

export function tabForPath(pathname: string): Tab {
  const match = (Object.entries(TAB_PATHS) as [Tab, string][]).find(
    ([, path]) => path === pathname
  )
  return match ? match[0] : "home"
}
