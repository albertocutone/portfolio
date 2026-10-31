# From Photons to Edge Intelligence

Alberto Cutone's scroll-driven 3D portfolio. A tailored PCB with real component assets connects sensing, instrumentation, edge intelligence, and system architecture through a macro product-film camera tour. The board extends beyond every shot; component dimensions remain physically scaled.

## Local Development

Requires Node.js 24 and a browser with WebGL support.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/portfolio/`.

## Validation

Use lightweight local checks while developing:

```sh
npm test
npm run build
```

Every main commit runs unit tests and a build, deploys to GitHub Pages, records its SHA at `revision.json`, then runs focused browser checks against that published revision. Desktop and Retina checks run on separate GitHub runners; complete validation uses eight interaction shards plus separate forward tour, reverse tour, interruption, and performance runners per display project. Reports, screenshots, and failure traces are available in the workflow's `pages-browser-evidence` artifacts.

For the complete published-site suite, including independent forward/reverse station cases, dialog interruption, full-size motion recordings, and hardware performance checks:

```sh
gh workflow run pages.yml --ref main -f full_validation=true
```

GitHub runners use software WebGL. A bounded steady-state sample is recorded on software WebGL. The three warmed 20 ms p95 measurements are explicitly skipped there and require a hardware GPU. Native browser video capture is used on GitHub; saved movies are streamed into a browser decoder with HTTP Range support to check actual decoded frames, dimensions, and duration; the macOS recording helper uses browser-encoded CDP frames because native FFmpeg was unavailable in the original environment.

To run the full suite from a WebGL-capable laptop against the public deployment, without a local server:

```sh
PLAYWRIGHT_BASE_URL=https://albertocutone.github.io/portfolio/ npm run test:e2e
```

Playwright uses installed Google Chrome on macOS. Set `PLAYWRIGHT_CHANNEL=chromium` for bundled Chromium. The Retina project exercises the Canvas DPR cap of 1.5. Fonts, component geometry, and studio lighting are self-hosted.

If public-page testing is blocked, use a dedicated production preview and one focused check:

```sh
npm run preview -- --port 4175
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4175/portfolio/ npm run test:e2e -- tests/e2e/smoke.spec.js --project=desktop
```

For the most recent local browser report, run `npx playwright show-report`.

## Asset Credits

The official KiCad component library supplies licensed CAD geometry under CC-BY-SA 4.0 and the KiCad design-use exception. Available source headers and family credits are retained; the crystal's absent header/credit record and repository-license provenance are explicitly recorded in `/Users/albertocutone/local/projects/portfolio/public/assets/ASSET_CREDITS.md`. Poly Haven's Studio Small 09 HDRI is CC0.

## Content and Deployment

Station copy, camera waypoints, and optional CV/contact destinations live in `/Users/albertocutone/local/projects/portfolio/src/config/stations.js`. Missing destinations produce no controls. No dates, metrics, or additional employment claims are invented.

The architecture reference is `/Users/albertocutone/local/projects/portfolio/doc/design.md`.

GitHub Pages uses `/portfolio/` as the asset base. Configure the repository's Pages source to **GitHub Actions**. Pushes to main or manual workflow dispatch run unit tests, build, deploy, and verify the exact published revision with browser checks; pull requests only run unit tests and build. Manual full validation includes motion recordings and all browser scenarios. The local development workflow does not publish automatically.
