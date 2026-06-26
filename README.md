# StreamHub - IPTV Dashboard & Music Portal

A free, open-source dashboard for streaming live TV, browsing community playlists, watching sports, and listening to music — all in one place.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)

---

## Features

### IPTV & Live TV
- **IPTV Player** — Stream curated free IPTV channels with a built-in HLS player. Quality badges, category filters, and real-time connection status.
- **IPTV Catalog** — Browse 4,000+ community-maintained channels from [iptv-org/iptv](https://github.com/iptv-org/iptv) and [Free-TV/IPTV](https://github.com/Free-TV/IPTV) with automatic deduplication. Search by name, filter by category or country.
- **Live Sports** — Watch live sports streams across football, basketball, NFL, hockey, cricket, and more via the free [SportSRC API](https://sportsrc.org) with embedded players.
- **Live → Streams Integration** — Latest football match from Live Sports automatically appears in the Streams section as a one-click live card.

### Stream Music (New)
- **Internet Radio** — Browse 45,000+ radio stations from 200+ countries via the free [Radio Browser API](https://www.radio-browser.info). Search by name, filter by genre or country.
- **YouTube Music** — Search and play YouTube music directly in the browser via the [Invidious API](https://invidious.io) (privacy-friendly, no API key needed).
- **Persistent Player Bar** — Always-visible bottom player with play/pause, skip, seek, volume, shuffle, repeat, and queue management.
- **Playlists** — Create, rename, delete custom playlists. Add tracks from search results. All persisted to localStorage.
- **Favorites** — Heart any track to save it to favorites. Persisted across sessions.
- **Recently Played** — Auto-tracks your last 50 played tracks. Shown in the My Playlists tab.
- **Queue System** — Add tracks to queue, play next, reorder, clear queue.
- **YouTube Embed Player** — Floating YouTube iframe with minimize/maximize controls.
- **Audio Visualizer** — Animated bars on currently playing radio tracks.
- **Keyboard Shortcuts** — Full keyboard control (see below).
- **Volume Memory** — Volume setting persists across sessions.

### General
- **URL-based Navigation** — Page state persists across refreshes via URL hash routing (`#home`, `#iptv`, `#catalog`, `#sports`, `#music`).
- **Dark / Light Mode** — Full theme support with smooth transitions.
- **Responsive Design** — Works on desktop, tablet, and mobile.

---
## Screenshots
<img width="1431" height="759" alt="image" src="https://github.com/user-attachments/assets/db785ace-ffc6-4959-8bf4-19a20f29cb94" />
<img width="1433" height="756" alt="image" src="https://github.com/user-attachments/assets/5b6953e6-45f6-4d34-9350-9e86d856dafc" />
<img width="1433" height="759" alt="image" src="https://github.com/user-attachments/assets/78c646b2-fdd1-4247-ba18-679ea277d3ed" />


## Keyboard Shortcuts (Music Player)

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Seek -10s |
| `→` | Seek +10s |
| `Shift+←` | Previous track |
| `Shift+→` | Next track |
| `↑` / `↓` | Volume up/down |
| `M` | Mute toggle |
| `S` | Shuffle toggle |
| `R` | Repeat cycle (none → all → one) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 6.0 |
| Styling | Tailwind CSS 3.4 |
| Build Tool | Vite 8 |
| Animation | Framer Motion |
| Video Player | HLS.js |
| Icons | Lucide React |

---

## Data Sources

| Source | Description | Coverage | License |
|--------|-------------|----------|---------|
| [iptv-org/iptv](https://github.com/iptv-org/iptv) | Community-curated IPTV channels (category-grouped) | 2,500+ | MIT |
| [Free-TV/IPTV](https://github.com/Free-TV/IPTV) | Country-organized IPTV channels (80+ countries) | 1,800+ | MIT |
| [SportSRC API](https://sportsrc.org) | Free sports streaming API (match schedules + embedded streams) | — | Free API |
| [Radio Browser API](https://www.radio-browser.info) | Free, open-source database of internet radio stations | 45,000+ | CC0 |
| [Invidious API](https://invidious.io) | Privacy-friendly YouTube frontend for music search | — | AGPL-3.0 |

> **Deduplication:** IPTV M3U sources are merged at runtime. Duplicate streams (same URL) are automatically removed, resulting in ~4,000+ unique channels.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended 20+)
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/TechKnoWEB/StreamHub.git
cd StreamHub

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
src/
├── components/
│   ├── HomePage.tsx              # Landing page with features & data sources
│   ├── LiveStreams.tsx            # Curated IPTV channel player + live match embed
│   ├── IPTVChannels.tsx          # Multi-source channel catalogue with filters
│   ├── LiveSports.tsx            # Live sports streams & match schedules
│   ├── LegalDisclaimer.tsx       # Legal & terms page
│   ├── Sidebar.tsx               # Navigation sidebar
│   └── VideoPlayer.tsx           # HLS video player component
├── music/
│   ├── types.ts                  # Music-specific TypeScript interfaces
│   ├── MusicContext.tsx           # Global music state (queue, playlists, favourites)
│   ├── hooks/
│   │   ├── useAudioPlayer.ts     # HTML5 Audio controller
│   │   ├── useRadioBrowser.ts    # Radio Browser API integration
│   │   └── useYouTubeSearch.ts   # YouTube search via Invidious
│   └── components/
│       ├── MusicPortal.tsx       # Main music page with tabs
│       ├── MusicPlayer.tsx       # Persistent bottom player bar
│       ├── SourceTabs.tsx        # Radio / YouTube / Playlists switcher
│       ├── TrackCard.tsx         # Reusable track row with actions
│       ├── InternetRadio.tsx     # Radio station browser
│       ├── YouTubeSearch.tsx     # YouTube music search
│       ├── YouTubeEmbed.tsx      # Floating YouTube iframe player
│       └── MyPlaylists.tsx       # Playlist management + favorites + history
├── context/
│   ├── ThemeContext.tsx           # Dark/Light theme provider
│   └── LiveStreamContext.tsx      # Live match state shared between Sports & Streams
├── types.ts                      # IPTV TypeScript interfaces
├── App.tsx                       # Root component with hash-based routing
├── main.tsx                      # Entry point
└── index.css                     # Global styles & Tailwind config
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## How It Works

### IPTV Player
Loads curated free IPTV channels (beIN Sports, Fox Sports, etc.) and streams them via HLS.js through a local proxy to handle CORS. When a live football match is available from the Sports section, a prominent red "Live Match" card appears at the top of the channel list.

### IPTV Catalog
Fetches M3U playlists from **two sources** in parallel (iptv-org + Free-TV), deduplicates by stream URL, and merges into a single unified catalogue. Supports search, category filtering, and country filtering.

### Live Sports
Connects to the SportSRC API to display upcoming match schedules across 9 sport categories. Selecting a match loads embedded stream players directly from `embed.st`.

### Stream Music
The music portal connects to two free APIs:
- **Radio Browser API** — No authentication required. Search 45K+ stations by name, genre, or country. Streams play directly via HTML5 Audio.
- **Invidious API** — Privacy-friendly YouTube frontend. Searches YouTube for music videos and plays them via embedded YouTube iframes.

All user data (volume, favourites, playlists, recently played) is persisted to `localStorage` under the `streamhub-music` key.

### URL Hash Routing
Active tab state is stored in the URL hash (`#home`, `#iptv`, `# catalogue`, `#sports`, `#music`). Refreshing the page restores the last-viewed section. Browser back/forward navigation works correctly.

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- [iptv-org/iptv](https://github.com/iptv-org/iptv) — Community-curated IPTV channel lists
- [Free-TV/IPTV](https://github.com/Free-TV/IPTV) — Country-organized IPTV channels
- [SportSRC](https://sportsrc.org) — Free sports streaming API
- [Radio Browser](https://www.radio-browser.info) — Free internet radio station database
- [Invidious](https://invidious.io) — Privacy-friendly YouTube frontend
- [HLS.js](https://github.com/video-dev/hls.js) — HTTP Live Streaming client
- [Lucide](https://lucide.dev) — Beautiful open-source icons
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) — Animation library for React
