import { create } from "zustand"

interface CommandPaletteState {
  open: boolean
  /** Live query, kept here so closing always clears it. */
  query: string
  setQuery: (value: string) => void
  toggle: () => void
  openPalette: () => void
  close: () => void
}

/**
 * Open state lives in a store because the palette has more than one trigger:
 * the Ctrl+K/Cmd+K shortcut, and the search buttons in the sidebar and mobile
 * header. Phones have no Ctrl key, so a keyboard-only palette would be
 * invisible to most of this app's users.
 */
export const useCommandPaletteStore = create<CommandPaletteState>(set => ({
  open: false,
  query: "",
  setQuery: value => set({ query: value }),
  toggle: () => set(state => ({ open: !state.open, query: state.open ? "" : state.query })),
  openPalette: () => set({ open: true }),
  close: () => set({ open: false, query: "" }),
}))
