# From Photons to Edge Intelligence

Alberto Cutone's scroll-driven 3D portfolio. A procedural PCB connects sensing, instrumentation, edge intelligence, and system architecture.

## Local Development

Requires Node.js 24 and a browser with WebGL support.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/portfolio/`.

## Validation

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts the production preview automatically at `http://127.0.0.1:4173/portfolio/`. On macOS it uses installed Google Chrome for hardware-backed WebGL; Linux CI uses bundled Chromium. Set `PLAYWRIGHT_CHANNEL=chromium` to use bundled Chromium locally, or `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome elsewhere. Software WebGL performance is not representative of the laptop GPU.

The browser suite covers navigation in both directions, Canvas/card wheel input, keyboard endpoints, dialog scroll isolation and focus restoration, asset errors, screenshots, a narrow viewport, and a frame-performance sample. Fonts are bundled locally, so rendering needs no third-party font requests.

For a standalone preview, run `npm run preview`. To inspect the most recent browser report, run `npx playwright show-report`.

## Content and Deployment

Station copy, camera waypoints, and optional CV/contact destinations live in `/Users/albertocutone/local/projects/portfolio/src/config/stations.js`. Missing destinations produce no controls. No dates, metrics, or additional employment claims are invented.

The architecture reference is `/Users/albertocutone/local/projects/portfolio/doc/design.md`.

GitHub Pages uses `/portfolio/` as the asset base. Configure the repository's Pages source to **GitHub Actions**. Pushes to main or manual workflow dispatch validate, build, and deploy; pull requests only validate. The local development workflow does not publish automatically.
