# StreamHub - IPTV Dashboard

A free, open-source IPTV dashboard for streaming live TV channels, browsing community playlists, and watching sports — all in one place.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)

---

## Features

- **IPTV Player** — Stream curated free IPTV channels with a built-in HLS player. Quality badges, category filters, and real-time connection status.
- **IPTV Catalog** — Browse thousands of community-maintained channels from [iptv-org/iptv](https://github.com/iptv-org/iptv). Search by name, filter by category, and preview instantly.
- **Live Sports** — Watch live sports streams across football, basketball, NFL, hockey, cricket, and more via the free [SportSRC API](https://sportsrc.org) with embedded players.
- **Dark / Light Mode** — Full theme support with smooth transitions.
- **Responsive Design** — Works on desktop, tablet, and mobile.

---

## Screenshots

> Add screenshots here after building the project.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 6.0 |
| Styling | Tailwind CSS 3.4 |
| Build Tool | Vite 8 |
| Video Player | HLS.js |
| Icons | Lucide React |

---

## Data Sources

| Source | Description | License |
|--------|-------------|---------|
| [iptv-org/iptv](https://github.com/iptv-org/iptv) | 2,500+ community-curated free IPTV channels | MIT |
| [SportSRC API](https://sportsrc.org) | Free sports streaming API (match schedules + embedded streams) | Free API |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended 20+)
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/iptv-dashboard.git
cd iptv-dashboard

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
│   ├── HomePage.tsx        # Landing page with features & credits
│   ├── IPTVPlayer.tsx      # Curated IPTV channel player
│   ├── IPTVCatalog.tsx     # Full channel catalog from iptv-org
│   ├── LiveSports.tsx      # Live sports streams
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── VideoPlayer.tsx     # HLS video player component
├── context/
│   └── ThemeContext.tsx     # Dark/Light theme provider
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Root component with routing
├── main.tsx                # Entry point
└── index.css               # Global styles & Tailwind config
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
Loads curated free IPTV channels (beIN Sports, Fox Sports, etc.) and streams them via HLS.js through a local proxy to handle CORS.

### IPTV Catalog
Fetches the M3U playlist from `iptv-org/iptv` (~2.5MB), parses `#EXTINF` tags, and organizes channels by category. Supports search and country filtering.

### Live Sports
Connects to the SportSRC API to display upcoming match schedules. Selecting a match loads embedded stream players directly from `embed.st` (bypassing ad wrappers).

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
- [SportSRC](https://sportsrc.org) — Free sports streaming API
- [HLS.js](https://github.com/video-dev/hls.js) — HTTP Live Streaming client
- [Lucide](https://lucide.dev) — Beautiful open-source icons
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS framework
