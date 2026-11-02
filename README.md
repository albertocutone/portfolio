# From Photons to Edge Intelligence

Alberto Cutone's scroll-driven CV portfolio. A general introduction and pitch open the journey, followed by Education (the Colosseum in Rome), CERN (ATLAS), HCL, xFarm, Matica, Meta Reality Labs, personal projects, and a final recap. Each CV station highlights its related experience and projects. The board extends beyond every PCB shot; component dimensions remain physically scaled.

The 2D workspace is available from the header, each related project, and the recap. Browse ten projects, search by technology, filter work/research/personal projects, and select overview, build, or outcome notes. A public-project directory links six repositories and their available demos. Experience cards link to their projects; About includes skills, education, the approved GitHub/LinkedIn/LeetCode links, and a contact-form button. Email and phone are excluded. Escape closes the window, returns focus, and resumes the 3D journey.

The CERN and Meta stations include muted autoplay YouTube frames. CERN's DUNE experiment video is also linked from the Cryo-Submarine project. The robot is intended to operate inside DUNE's cryostat; its separate liquid-argon level measurement PCB is intended to sit outside and measure the level inside. Each player unloads when leaving its station or opening a dialog. Browser autoplay still depends on the visitor's browser and YouTube availability.

## Local Development

### Contact form

"Let's talk" opens a contact form. Configure an opaque HTTPS endpoint (for example, a Formspree form ID) with `VITE_CONTACT_FORM_ENDPOINT` in `.env.local` for local builds, and the GitHub repository variable `CONTACT_FORM_ENDPOINT` for Pages deployments. Keep the recipient address and any delivery credentials in the provider's private settings; never put them in frontend code or `VITE_*` variables. The endpoint must accept JSON POST requests and return JSON. Without an endpoint, the form displays an unavailable message and cannot submit. Success is shown only after the provider confirms a successful response.

Email and phone have been removed from the current source files. Existing Git history may still contain earlier versions; this change does not rewrite that history.

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

Meta Reality Labs displays the downloaded Meta logo, Quest 3, and Meta VR glasses models. The logo loops its original animation, and both products rotate around Y once every 45 seconds, 180° apart, while this scene is visible. The CERN ATLAS detector and Colosseum use the same rotation period while their scenes are visible. Rebuild the self-hosted GLBs with `npm run optimize:meta` using `assets/meta_logo.zip`, `assets/meta-quest-3.zip`, and `assets/meta_vr_glasses.glb`. The logo is by Elin and the glasses are by rogeressig, both licensed under CC BY 4.0 and credited in the scene. The user-supplied Quest archive contains no source attribution or license record. Conversion notes and asset hashes are recorded in `public/assets/models/meta.meta.json`.

"Colosseum, Rome, Italy" (https://skfb.ly/orOMD) by Brian Trepanier is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/). The scene includes visible author credit, source and license links, and education details drawn from the CV. Its self-hosted GLB retains attribution and adaptation notes; provenance and optimization settings are recorded in `public/assets/models/colosseum.meta.json`.

The original Colosseum GLB is kept locally in `assets/colosseum_rome_italy.glb` and ignored by Git because it is 234 MB. After downloading it, rebuild the optimized asset with `npm run optimize:colosseum`. The conversion uses Sharp to recompress its full-resolution 8192 × 8192 texture as WebP and Meshopt to compress simplified geometry with reconstructed vertex normals.

The ATLAS detector model is by `physics.atlas.vr`, licensed under CC BY 4.0. The source is [CERN ATLAS Detector on Sketchfab](https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd). The scene includes visible attribution and links to the original. Its optimized GLB is self-hosted; the browser does not contact Sketchfab. Asset provenance and the conversion settings are recorded in `public/assets/models/atlas.meta.json`.

The downloaded source archive is retained in `assets/cern_atlas_detector.zip`. To rebuild the GLB, run:

```sh
npm run optimize:atlas -- assets/cern_atlas_detector.zip
```

The conversion script extracts the archive into a temporary directory, centers and scales the static detector, batches compatible geometry, removes unused resources, simplifies within a bounded geometric error, and applies Meshopt compression. Only the optimized asset is served from `public/`.

The official KiCad component library supplies licensed CAD geometry under CC-BY-SA 4.0 and the KiCad design-use exception. Available source headers and family credits are retained; the crystal's absent header/credit record and repository-license provenance are explicitly recorded in `/Users/albertocutone/local/projects/portfolio/public/assets/ASSET_CREDITS.md`. Poly Haven's Studio Small 09 HDRI is CC0.

## Content and Deployment

Content comes directly from the converted Markdown documents in [`src/content/cv.md`](src/content/cv.md) and [`src/content/experiences-and-projects.md`](src/content/experiences-and-projects.md). They include clear sections for profile, skills, career, education, and project notes. `src/config/portfolio.js` imports these files as text and `src/content/readPortfolio.js` reads their sections; the UI has no duplicate CV or project data. The CV is an authoring source with no public download or CV controls. See [`src/content/README.md`](src/content/README.md) for the editing format.

CV topic order and named visual poses live in `src/config/stations.js`. Camera waypoints are defined once in `stationPoses`, and each topic chooses a pose. Intro and recap provide the general panels; the middle stations follow the CV chronologically. The CV supplies exact employment dates; projects retain contractor attribution and distinguish planned features from completed work. No dates, metrics, or additional employment claims are invented.

Focused workspace and mobile checks:

```sh
npm run build
npx playwright test tests/e2e/workspace.spec.js tests/e2e/smoke.spec.js --project=desktop
```

The architecture reference is `/Users/albertocutone/local/projects/portfolio/doc/design.md`.

GitHub Pages uses `/portfolio/` as the asset base. Configure the repository's Pages source to **GitHub Actions**. Pushes to main or manual workflow dispatch run unit tests, build, deploy, and verify the exact published revision with browser checks; pull requests only run unit tests and build. Manual full validation includes motion recordings and all browser scenarios. The local development workflow does not publish automatically.

## Deployment queue

New pushes cancel older runs on the same branch so a long browser validation cannot keep the latest CV journey queued. The published revision is available at `/portfolio/revision.json`.
