import { createContext } from "react"
import type { MusicPlayerState, MusicAction, Track } from "./types"
import type { YouTubeControls } from "./hooks/useYouTubePlayer"

/**
 * The music context lives in its own module so that MusicContext.tsx can stay a
 * component-only file — Fast Refresh bails out on any file that exports both a
 * component and a non-component value.
 */
export interface MusicContextValue {
  state: MusicPlayerState
  dispatch: React.Dispatch<MusicAction>
  playTrack: (track: Track, queue?: Track[]) => void
  togglePlay: () => void
  nextTrack: () => void
  prevTrack: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  toggleMute: () => void
  addToQueue: (track: Track) => void
  addToQueueNext: (track: Track) => void
  playQueue: (tracks: Track[], startIndex?: number) => void
  toggleFavorite: (track: Track) => void
  isFavorite: (trackId: string) => boolean
  createPlaylist: (name: string) => void
  deletePlaylist: (id: string) => void
  renamePlaylist: (id: string, name: string) => void
  addToPlaylist: (playlistId: string, track: Track) => void
  removeFromPlaylist: (playlistId: string, trackIndex: number) => void
  registerYouTubeControls: (controls: YouTubeControls) => void
  unregisterYouTubeControls: () => void
  removeFromRecentlyPlayed: (trackId: string) => void
}

export const MusicContext = createContext<MusicContextValue | null>(null)
