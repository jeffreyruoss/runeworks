# Hotkey Foundry

A keyboard-only, stage-based micro-factory builder game built with Phaser 3 and TypeScript. Place production machines on a grid and run tick-based simulations to meet stage goals.

## Getting Started

```bash
npm install
npm run dev
```

## Controls

| Key       | Action                                 |
| --------- | -------------------------------------- |
| WASD      | Move cursor (+ Shift for 5-tile jumps) |
| 1-4       | Select building type                   |
| Enter     | Place building                         |
| Backspace | Delete building                        |
| R         | Rotate building                        |
| Space     | Toggle simulation                      |
| . / ,     | Speed up / slow down simulation        |
| Esc       | Deselect building                      |

## Commands

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run sprites   # Regenerate sprite atlas
```

## Tech Stack

- Phaser 3
- TypeScript
- Vite
