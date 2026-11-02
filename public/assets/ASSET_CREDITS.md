# Bundled Asset Credits

## Meta mixed reality station

This work is based on "Meta logo" (https://sketchfab.com/3d-models/meta-logo-913b2a99b7404b80b75a8d3927ce20d0) by Elin (https://sketchfab.com/ElinHohler), licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). The original license is retained in `models/meta-logo.LICENSE.txt`, and the scene links to the author, model, and license.

The Quest 3 model comes from the user-supplied `assets/meta-quest-3.zip` (`source/Quest3.glb`). This archive contains no source attribution or license record; no license or author is inferred. The assets retain their own rights separately from the application code.

Rebuild both models with `npm run optimize:meta`. Adaptations: animation frozen at the authored rest pose, centering, uniform display scaling, static transforms flattened, Meshopt geometry compression, and texture recompression as WebP up to 2048px. The downloaded geometry is retained. Source archives, hashes, and output bounds are recorded in `models/meta.meta.json`.

## Colosseum, Rome, Italy

"Colosseum, Rome, Italy" (https://skfb.ly/orOMD) by Brian Trepanier is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

The supplied attribution is retained in `models/colosseum.LICENSE.txt` and embedded in the adapted GLB. The webpage links to the source and license, and its education details include the author credit.

Adaptations: uniform display scaling and centering, flattening static transforms, batching compatible geometry, rebuilding vertex normals, mesh simplification constrained to a maximum relative error of 0.001, texture recompression as WebP, quantization, and Meshopt compression. The full 8192 × 8192 texture resolution is retained. Source and output hashes, geometry counts, and settings are recorded in `models/colosseum.meta.json`.

The original 234 MB GLB is kept locally at `assets/colosseum_rome_italy.glb` and excluded from Git; only the optimized GLB is served. Rebuild with `npm run optimize:colosseum` after downloading the original model.

## CERN ATLAS detector

This work is based on "CERN ATLAS Detector" (https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd) by physics.atlas.vr (https://sketchfab.com/physics.atlas.vr) licensed under CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/).

The supplied attribution is retained in `models/atlas.LICENSE.txt`. The downloaded source archive is retained at `assets/cern_atlas_detector.zip` in the repository. Its hash, output hash, triangle counts, and conversion settings are pinned in `models/atlas.meta.json`.

Adaptations: uniform display scaling and centering, flattening of static transforms, batching compatible geometry by material, removal of unused resources, mesh simplification constrained to a maximum relative error of 0.001, quantization, and Meshopt compression. The adapted GLB retains attribution in its metadata. The webpage also provides a visible author credit and link to the source.

## KiCad component geometry

Source: https://github.com/KiCad/kicad-packages3d
Pinned revision: b8b3cfdfad88ba66f21002b3de51dc6f7d55ba5a.
License: Creative Commons Attribution-ShareAlike 4.0, with the KiCad design-use exception. See the bundled /portfolio/assets/models/LICENSE.md and each original WRL header. These redistributed model assets retain their own license separately from application code.

The component files are unchanged source WRL models; their original headers and embedded attribution are retained. KiCad StepUp is credited in the capacitor, ceramic capacitor, header, QFP, resistor, and SOIC headers. Other model contributions are attributed to the KiCad library contributors and their source credit records.

Models used:

- Package_QFP.3dshapes/LQFP-48_7x7mm_P0.5mm.wrl
- Package_SO.3dshapes/SOIC-16_3.9x9.9mm_P1.27mm.wrl
- Capacitor_THT.3dshapes/C_Radial_D6.3mm_H11.0mm_P2.50mm.wrl
- Capacitor_SMD.3dshapes/C_0603_1608Metric.wrl
- Resistor_SMD.3dshapes/R_0603_1608Metric.wrl
- Inductor_SMD.3dshapes/L_Bourns-SRN4018.wrl
- Crystal.3dshapes/Crystal_SMD_3225-4Pin_3.2x2.5mm.wrl
- Connector_USB.3dshapes/USB_Micro-B_Molex_47346-0001.wrl
- Connector_PinHeader_2.54mm.3dshapes/PinHeader_1x04_P2.54mm_Vertical.wrl

The crystal has no embedded copyright or license header and no upstream credit record at this pinned revision (the CREDITS.md URL returns 404). Its attribution is the KiCad library project and pinned source above, and its license is the repository license included with this collection. The inductor and USB files also have no embedded license header; their available upstream family credit records are bundled. Original headers are retained where present, not claimed where absent.

Source credit records: https://github.com/KiCad/kicad-packages3d/tree/b8b3cfdfad88ba66f21002b3de51dc6f7d55ba5a

Runtime adaptations: millimeter-scale normalization, Z-up to Y-up transformation, explicit footprint origins, batching of faces by source material, and product-rendering PBR material/color replacements. No hardware design or manufacturer affiliation is implied by this illustrative board.

## Poly Haven lighting

Studio Small 09, 1K HDRI, from Poly Haven.
Source: https://polyhaven.com/a/studio_small_09
Downloaded file: https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr
License: CC0 1.0 Universal. https://polyhaven.com/license
Original downloaded HDR is unchanged. It is used as the scene's studio-lighting environment.
