# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2026-03-10

### Added

- Zoom in/out controls for the visualizer camera
- Resolution toggle (`Res: High/Low`) to switch between high-fidelity and performance modes
- Auto mode that animates camera motion, zoom, and bloom while staying on the current visualization mode
- Mode cycle button (`Next`) alongside the mode dropdown
- About overlay with usage tips and project description

### Changed

- Reworked control bar into a compact, mobile-friendly React/Tailwind layout:
  - Two-row, multi-column design that adapts between small and large screens
  - Smaller buttons, tighter spacing, and clearer groupings for inputs, modes, and utilities
- Updated fullscreen handling to work more reliably on mobile browsers (including WebKit-prefixed APIs)
- Microphone input is now visual-only (no audio monitor to speakers) to avoid feedback loops

---

## [1.0.0] - 2025-03-09

### Added

- 9 visualization modes: Sphere, Waveform, Bars, Tunnel, Galaxy, Fractals, Water, Texture, Melt
- Microphone and audio file input
- WebGL rendering with Three.js and Unreal Bloom post-processing
- Gain and volume controls
- Fullscreen mode
- GitHub Pages deployment support
- ESLint configuration

### Changed

- Professional README and documentation
- Dark mode for controls and mode selector

### Layout Improvements

#### Control Bar (`ControlBar.tsx`)
- Made the control bar full-width and centered:
  - Uses `inset-x-3 bottom-3` on small screens, slightly larger insets on `sm+`.
- Modified inner layout:
  - Now stacks vertically on mobile (`flex-col`), switches to horizontal (`flex-row`) on larger screens.
- Limited maximum width:
  - Applied `w-full max-w-xl sm:max-w-3xl` for better display on large screens.
- Optimized paddings, gaps, and text sizes for mobile:
  - Adjusted spacing for comfortable fit.
- Grouped playback/time and volume controls:
  - Placed into flexible rows with `w-full sm:w-auto` and alignment changes to prevent horizontal scrolling.
- Improved pointer event handling:
  - Outer wrapper uses `pointer-events-none`, while the bar itself uses `pointer-events-auto` to ensure interactivity without blocking canvas touches.

#### Header Responsiveness (`App.tsx`)
- Changed header layout to stack vertically on small screens and horizontally on `sm+`:
  - Utilizes `flex-col gap-1 sm:flex-row sm:items-center sm:justify-between`.
- Slightly reduced padding and text sizes on mobile for better fitting of the title and status line.
