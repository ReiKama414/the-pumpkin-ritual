# The Pumpkin Ritual

**English** · [繁體中文](./README.zh-TW.md)

> **Local Halloween WebGL ritual** — a self-contained React experience where a parametric pumpkin splits, suspends, and rebuilds under moonlight

<p align="center">
  <a href="https://github.com/ReiKama414/the-pumpkin-ritual"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-ReiKama414%2Fthe--pumpkin--ritual-181717?logo=github" /></a>
  <a href="https://reikama414.vercel.app/"><img alt="Portfolio" src="https://img.shields.io/badge/Site-reikama414.vercel.app-0A0A0A" /></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-r182-000000?logo=threedotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green" />
</p>

<p align="center">
  <strong><a href="https://github.com/ReiKama414/the-pumpkin-ritual">★ Star this repo</a></strong>
  ·
  <a href="https://reikama414.vercel.app/">Portfolio</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#license">License</a>
</p>

---

## Why this project?

Most Halloween demos lean on video loops, texture swaps, or stacked spheres. **The Pumpkin Ritual** is a single-scene interactive piece: ten carved parametric shells, physical cut walls, scroll-driven chapters, and a repeatable separation → suspension → reconstruction cycle — all rendered in the browser with no external media requests.

Built for anyone who wants a small, craft-heavy WebGL vignette that still feels tactile: designers chasing mood references, curious front-end learners, and late-night scrollers.

---

## Highlights

- **Parametric pumpkin** — outer skin, inner flesh, and clipped tessellated walls; no face textures, alpha masks, or video stand-ins  
- **Five expressions** — Classic, Wicked, Haunted, Hollow, and Cursed with coordinated contract-and-unfurl topology changes  
- **Ritual choreography** — exploded petals keep full 3D meshes; foliage lifts with the same separation driver  
- **Scroll narrative** — five chapters via scroll or keyboard; chapter dots jump to a stage  
- **Midnight Ritual** — triple-click easter egg; finish to unlock a secret Classic face  
- **Procedural audio** — Web Audio API synthesis only; sound stays off until you enable it  
- **Accessible shell** — native About modal, reduced-motion path, labeled SVG fallback when WebGL fails  
- **Performance guardrails** — adaptive DPR cap (1.6) and quality-aware postprocessing  

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19, Zustand, Tailwind CSS 4 |
| 3D | Three.js, React Three Fiber, Drei, postprocessing |
| Motion | GSAP, ScrollTrigger |
| Geometry | polygon-clipping, custom parametric shells |
| Tooling | Vite 7, TypeScript, Vitest |

---

## Quick start

**Requirements:** Node.js 20+ recommended, a GPU with WebGL2.

```bash
git clone https://github.com/ReiKama414/the-pumpkin-ritual.git
cd the-pumpkin-ritual
npm install
npm run dev
```

Open the local URL Vite prints. Production: `npm run build`, then `npm run preview`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server + hot reload |
| `npm run build` | Typecheck + production bundle |
| `npm run typecheck` | `tsc -b` |
| `npm run preview` | Preview the production build |
| `npm test` | Vitest (geometry + ritual lifecycle) |

---

## Controls

| Input | Action |
| --- | --- |
| Scroll · ↑ ↓ · Page Up / Down | Move through five ritual chapters |
| Chapter dots | Jump to a chapter |
| Drag pumpkin · ← → | Rotate freely |
| Click pumpkin · Space | Run separation / suspension / reconstruction |
| `1`–`5` | Switch expression (when page focused) |
| Triple-click pumpkin | Summon Midnight Ritual |
| About | Keyboard-accessible control reference |
| Audio toggle | Enable synthesized sound |

> **Note:** Reduced motion disables idle drift, dust, sparks, and ghost effects, shortens transitions, and skips automated ritual spins. Dragging and scroll scrubbing still work.

---

## Project map

```
src/
├── App.tsx           # layout, UI chrome, modal
├── Scene.tsx         # R3F scene, lighting, post FX
├── geometry.ts       # parametric shells, clipping, transitions
├── materials.ts      # PBR + custom GLSL skin / wood
├── ritual.ts         # chapter state, separation, midnight flow
├── sound.ts          # Web Audio synthesis
├── geometry.test.ts  # raycasts, thickness, attribute sanity
└── ritual.test.ts    # lifecycle, timing, scroll endpoints
```

---

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Geometry tests raycast through eye openings for all five forms, check shell thickness at an uncarved cheek, and assert finite positions and normals. Lifecycle tests cover repeated reconstruction, transition timing, interruption, and exact scroll endpoints (11 tests).

Browser QA covers the rendered scene, stage controls, all five shapes, drag, triple-click Midnight Ritual, restart, audio toggle, and the keyboard-accessible modal. Layouts were checked at 1440×900, 390×844, and 320×700. A stable 60 FPS on every desktop GPU is a target, not a guarantee; embedded WebView and touch hardware were not fully exercised here.

---

## Third-party libraries

Runtime dependencies (React, Three.js, GSAP, etc.) remain under their respective licenses. That does **not** re-license this repository beyond the [MIT License](./LICENSE) below.

---

## Links

| | |
| --- | --- |
| **GitHub** | [ReiKama414/the-pumpkin-ritual](https://github.com/ReiKama414/the-pumpkin-ritual) |
| **Author** | [ReiKama414 (Myers)](https://github.com/ReiKama414) |
| **Portfolio** | [reikama414.vercel.app](https://reikama414.vercel.app/) |

---

## License

**This repository is released under the [MIT License](./LICENSE).**  
Copyright (c) 2026 ReiKama414.

You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this software, subject to the conditions in the license file.

- [GitHub](https://github.com/ReiKama414/the-pumpkin-ritual)
- [Portfolio](https://reikama414.vercel.app/)
- [Full license text](./LICENSE)

---

<p align="center"><sub>The Pumpkin Ritual · by ReiKama414 · after midnight.</sub></p>
