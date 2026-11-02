# From Photons to Edge Intelligence

## Visual Direction

A scroll-driven CV journey opens with an introduction and pitch, then moves through the Colosseum for education, ATLAS for CERN, and a macro product film over a tailored PCB: real CAD-derived component geometry, deep green solder mask, plated contacts, metal housings, molded plastic, white silkscreen, controlled studio reflections, and a separate readable HTML narrative. The nine topics are Intro, Education, CERN, HCL, xFarm, Matica, Meta, Personal, and Recap. Each topic chooses a named visual pose; the CV determines the order.

The PCB always extends beyond the camera frustum during all PCB poses, including the intro and recap compositions. Physical component dimensions remain fixed at **10 mm per scene unit**; the substrate starts at 320 x 240 mm and conservatively expands for visible PCB camera poses with margin. Extent follows viewport changes, not camera progress; unchanged dimensions reuse buffers, replaced bodies are disposed, and the central detailed surface is built once. A single green cap prevents overlapping outer layers from fighting at distant angles.

The same full-3D scene targets laptops and remains on narrow viewports. There are no quality tiers, separate mobile scenes, or static rendering fallbacks. A failed required asset produces an explicit error and retry control rather than a false ready state.

## CV topics and visual poses

| What | Pose | Highlighted work |
| --- | --- | --- |
| Intro | PCB overview | General introduction and pitch |
| Education | Colosseum, Rome | Both Sapienza degrees, cardiac MRI, and thesis links |
| CERN | ATLAS detector | Cryo-Submarine and the master thesis internship |
| HCL | PCB processor | BigFix Launchpad |
| xFarm | Edge SoC | Connected Farm Sensors |
| Matica | PCB instrumentation | EDIsecure Connect |
| Meta | Image sensor | Insight Debug, Spatial Ground Truth, Mixed Reality Quality |
| Personal | Embedded platform | PetLog and Budget Tracker |
| Recap | PCB overview | Journey summary, featured projects, full workspace, contact |

`src/config/stations.js` separates the topic records from `stationPoses`. `src/content/stationContent.js` resolves each topic against the authored CV and project records. Role names, dates, contractor notes, degree details, and project outcomes retain their content sources. Each related project opens its selected workspace window; a thesis opened from education details restores focus to the original station button on close.

The Education model is “Colosseum, Rome, Italy” by Brian Trepanier, CC BY 4.0 (https://skfb.ly/orOMD). Visible source and license links and bundled attribution remain with the optimized GLB.

## Geometry and Assets

ATLAS uses a self-hosted GLB adapted from the CC BY 4.0 model by `physics.atlas.vr`. `scripts/optimize-atlas.mjs` normalizes the static detector to a centered display model, batches compatible meshes, simplifies within a bounded error, and applies Meshopt compression and quantization. Source and output hashes, triangle counts, bounds, and conversion settings are recorded in `public/assets/models/atlas.meta.json`. Visible attribution links to the original model; detailed credits retain the license and adaptation record.

Official KiCad WRL models supply QFP and SOIC packages, ceramic capacitors, resistors, inductors, crystals, cylindrical capacitors, USB metalwork, and a pin header. A purpose-built sensor surface sits on a detailed package. Runtime assets are bundled locally under the Vite `/portfolio/` base; no third-party model or lighting requests are needed.

The pinned source revision, file hashes, unit scale, mounting plane, footprint origin, material classification, and license are recorded in `/Users/albertocutone/local/projects/portfolio/src/config/componentAssets.js`. The WRL source is parsed with Three's `VRMLLoader`, preserving nested transforms. Geometry is normalized from verified 2.54 mm source units and Z-up coordinates, then merged by material for efficient instancing. Through-hole leads extend below the mounting plane; models are not blindly grounded by their minimum bounding-box coordinate.

The 186-component population uses roughly 165k component triangles and 24 component draw calls. Board details add pads, plated vias, actual substrate through-bores, connected masked routing, solder contacts, and silkscreen. Most copper is covered by solder mask rather than drawn as raised glowing gold roads. Geometry is static while the camera travels.

KiCad geometry retains CC-BY-SA 4.0 licensing, available original headers and family credit records, and the design-use exception. The crystal has neither an embedded header nor an upstream family credit record at the source pin; its project attribution and repository-license provenance are explicit in the credits. The redistributed models retain their own license separately from application code. The selected radial capacitor has an explicit compatible license header. The bundled Poly Haven Studio Small 09 HDRI is CC0. See `/Users/albertocutone/local/projects/portfolio/public/assets/ASSET_CREDITS.md` and `/Users/albertocutone/local/projects/portfolio/public/assets/models/LICENSE.md`.

## Rendering and Motion

Studio environment lighting, a controlled key and rim, static key shadows, and contact shadows establish depth and material contrast. Imported CAD colors are converted to differentiated PBR materials for metal, plastic, ceramic, and plated contacts. Surface roughness has restrained grain. Bloom is subtle, and the focal subject remains sharp.

Canvas DPR remains capped at 1.5. The effect compositor uses four-sample antialiasing, world-unit depth-of-field focus ranges, and reduced-resolution blur. HTML never enters the compositor. Camera and focus vectors are reused, while view offset and projection changes occur on resize rather than every frame.

The pure evaluator in `/Users/albertocutone/local/projects/portfolio/src/scroll/timeline.js` resolves position, look-at target, focus, optical values, active station, scene visibility, and card visibility. Each nonfinal equal-width station interval hold for 35% and travel for 65%. Cubic Bezier paths with lifted PCB transition controls use cached arc-length sampling with quintic progress easing for zero endpoint velocity and acceleration. Focus and optical values change continuously. Transitions between the PCB, Colosseum, and ATLAS worlds fade through the background and switch at the fully faded midpoint. Reverse travel uses the same evaluator. Inactive worlds remain loaded and are hidden from rendering. Static directional shadows refresh at scene switches, and PCB contact shadows are captured after its world becomes visible. The final wider regional composition holds through exact offset 1 without revealing the PCB outline.

`/Users/albertocutone/local/projects/portfolio/src/config/motion.js` owns timing, camera projection, navigation landings, damping, and maximum progress speed. Drei is the sole temporal damping layer: nine pages, damping 0.35, and maximum normalized speed 0.10 per second. Reverse travel evaluates the same stateless paths. On narrow viewports the landmark cameras retreat to fit their models and shifts its composition above the narrative; the PCB uses its existing macro framing.

Navigation returns Intro to zero and lands beyond the arrival fade in every later interval. Commands issued before scene readiness are retained until the native scroll connection is available. Cards fade out early during travel and fade in over the first 0.02 of arrivals. Hidden cards remain inert.

## Input and Content

The shared scroll store exposes subscription, publication, and commands without leaking a DOM element. `/Users/albertocutone/local/projects/portfolio/src/scroll/ScrollBridge.jsx` owns the native Drei container, normalized pixel seeks, wheel forwarding and delta-mode conversion, browser zoom preservation, and keyboard guards. Canvas initialization must maintain event-target ownership before reporting ready. Required component models and studio lighting must also load before readiness.

The semantic overlay remains separate from WebGL. Native project dialogs provide an accessible name, focus containment, independent scrolling, Escape and close controls, and focus restoration. Flight input and publication are paused while details are open and resume from the visible position.

Copy uses only supplied facts: Meta Reality Labs mixed-reality evaluation and sensor visualization; CERN and Matica imaging/robotic integration; Edge Platforms and PetLog firmware and inference pipelines; electronic engineering and perceptual ML. No dates, metrics, links, or employment claims are invented. Missing CV/contact destinations produce no controls.

## Verification and Delivery

`npm test` verifies real asset parsing, unit scale and transforms, pinned hashes, substrate bores and UVs, board-frustum coverage, surrounding population, timeline interpolation and continuity, reverse evaluation, navigation landings, and scroll-store contracts.

`npm run build` creates production assets for `/portfolio/`. `npm run test:e2e` uses hardware-backed Chrome on macOS and targets the production preview at `http://127.0.0.1:4173/portfolio/`. Desktop and Retina projects use host DPRs 1 and 2; the Retina project exercises the actual 1.5 Canvas DPR cap. Tests cover assets/errors, independent station cases in both traversal directions, line/page wheel input and browser zoom preservation, rapid navigation retargeting, repeated modal dismissal and keyboard resume, absent links, and narrow layout. Actual component envelopes and the near plane are checked across the entire camera tour by unit tests.

Full-size station frames and forward/reverse and interruption videos are visual evidence, not automatic realism scores. Performance is sampled during three warmed camera moves, separately from video capture. Each animation frame must be sampled only once. The target is approximately 60 FPS and roughly 20 ms or better p95 frame time on the Apple M3 Pro. Results depend on the host/GPU; software WebGL is not representative.

New runs cancel older runs on the same branch to prevent stale browser validation from delaying publication. The Pages workflow runs unit/build gating, Pages deployment, an HTTP check, and focused browser verification of the exact published SHA. Desktop and Retina checks run on separate runners and upload reports/screenshots/traces; full validation uses eight interaction shards plus separate tour, interruption, and performance runners per display project. Manual dispatch with `full_validation=true` runs the complete suite and records full-size videos. GitHub software WebGL timings are reported separately from the hardware GPU performance target. Pull requests only test/build. Hardware GPU acceptance can be run against the public deployment:

```sh
PLAYWRIGHT_BASE_URL=https://albertocutone.github.io/portfolio/ npm run test:e2e
```

The public URL override disables the local preview server. Release acceptance requires unit/build success, a successful Pages deployment, live browser checks, and visual inspection of actual frames and motion recordings.
