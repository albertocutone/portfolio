# From Photons to Edge Intelligence

Alberto Cutone's scroll-driven 3D portfolio. A CERN ATLAS detector model opens the journey at station 1. Scrolling transitions to the tailored PCB at station 2, followed by instrumentation, edge intelligence, and an interactive project station. The board extends beyond every PCB shot; component dimensions remain physically scaled.

The 2D workspace is available from the header and the project station. Browse ten projects, search by technology, filter work/research/personal projects, and select overview, build, or outcome notes. Experience cards link to their projects; About & CV includes skills, education, contact details, and the original downloadable CV. Escape closes the window, returns focus, and resumes the 3D journey.

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

The ATLAS detector model is by `physics.atlas.vr`, licensed under CC BY 4.0. The source is [CERN ATLAS Detector on Sketchfab](https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd). The scene includes visible attribution and links to the original. Its optimized GLB is self-hosted; the browser does not contact Sketchfab. Asset provenance and the conversion settings are recorded in `public/assets/models/atlas.meta.json`.

The downloaded source archive is retained in `assets/cern_atlas_detector.zip`. To rebuild the GLB, run:

```sh
npm run optimize:atlas -- assets/cern_atlas_detector.zip
```

The conversion script extracts the archive into a temporary directory, centers and scales the static detector, batches compatible geometry, removes unused resources, simplifies within a bounded geometric error, and applies Meshopt compression. Only the optimized asset is served from `public/`.

The official KiCad component library supplies licensed CAD geometry under CC-BY-SA 4.0 and the KiCad design-use exception. Available source headers and family credits are retained; the crystal's absent header/credit record and repository-license provenance are explicitly recorded in `/Users/albertocutone/local/projects/portfolio/public/assets/ASSET_CREDITS.md`. Poly Haven's Studio Small 09 HDRI is CC0.

## Content and Deployment

Content comes directly from the converted Markdown documents in [`src/content/cv.md`](src/content/cv.md) and [`src/content/experiences-and-projects.md`](src/content/experiences-and-projects.md). They include clear sections for profile, skills, career, education, and project notes. `src/config/portfolio.js` imports these files as text and `src/content/readPortfolio.js` reads their sections; the UI has no duplicate CV or project data. The same CV Markdown is served as the download. See [`src/content/README.md`](src/content/README.md) for the editing format.

Camera waypoints and scene presentation live in `src/config/stations.js`. The CV supplies exact employment dates; projects retain contractor attribution and distinguish planned features from completed work. No dates, metrics, or additional employment claims are invented.

Focused workspace and mobile checks:

```sh
npm run build
npx playwright test tests/e2e/workspace.spec.js tests/e2e/smoke.spec.js --project=desktop
```

The architecture reference is `/Users/albertocutone/local/projects/portfolio/doc/design.md`.

GitHub Pages uses `/portfolio/` as the asset base. Configure the repository's Pages source to **GitHub Actions**. Pushes to main or manual workflow dispatch run unit tests, build, deploy, and verify the exact published revision with browser checks; pull requests only run unit tests and build. Manual full validation includes motion recordings and all browser scenarios. The local development workflow does not publish automatically.
