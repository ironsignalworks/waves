# Waves

> Transform sound into stunning visual experiences with real-time audio-reactive 3D visualization.

[![Node 18+](https://img.shields.io/badge/node-18+-green)](https://nodejs.org)

Waves is a web-based audio visualizer that turns music and ambient sound into dynamic 3D graphics. Built with React, Three.js, and the Web Audio API, it runs entirely in the browser—no installation required.

---

## Features

| Feature | Description |
|---------|-------------|
| **9 Visualization Modes** | Sphere, Waveform, Bars, Tunnel, Galaxy, Fractals, Water, Texture, Melt |
| **Dual Audio Input** | Microphone capture or upload any audio file |
| **WebGL Rendering** | Hardware-accelerated 3D with Unreal Bloom post-processing |
| **Responsive** | Fullscreen support, adapts to any screen size |
| **Zero Dependencies** | Runs client-side only; no backend or sign-in needed |

---

## Quick Start

**Prerequisites:** Node.js 18+ and npm

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages |
| `npm run lint` | Run ESLint |

---

## Deployment

The project is configured for GitHub Pages and deploys automatically on push to `main`. For manual deployment:

```bash
npm run deploy
```

Configure **Settings → Pages → Source** to use the `gh-pages` branch (or GitHub Actions if using the included workflow). The app expects to be served at `/waves/`.

---

## Tech Stack

- **React 18** + TypeScript
- **Three.js** - WebGL rendering, EffectComposer, UnrealBloomPass
- **Vite** - Build tooling
- **Tailwind CSS** - Styling
- **Web Audio API** - Mic input, FFT analysis, file playback

---

## License

[MIT](LICENSE)
