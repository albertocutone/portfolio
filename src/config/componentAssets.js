const revision = 'b8b3cfdfad88ba66f21002b3de51dc6f7d55ba5a';
const root = `https://raw.githubusercontent.com/KiCad/kicad-packages3D/${revision}/`;
const define = (id, path, sha256, kind, centerMm = [0, 0]) => Object.freeze({
  id, file: `assets/models/${id}.wrl`, source: root + path, sha256, kind,
  unitMm: 2.54, centerMm, seatOffsetMm: 0, license: 'CC-BY-SA-4.0',
});

export const componentAssets = Object.freeze([
  define('lqfp', 'Package_QFP.3dshapes/LQFP-48_7x7mm_P0.5mm.wrl', 'd9bb166b76d34470d09eb349a5bd00e7245217d1d912c9edd9b1bd6656cc2f04', 'package'),
  define('soic', 'Package_SO.3dshapes/SOIC-16_3.9x9.9mm_P1.27mm.wrl', '0c5aed31467ef2b2650924689f8af00d0ae0ce595db29289c9ffd1bc8b74ca5f', 'package'),
  define('capacitor', 'Capacitor_THT.3dshapes/C_Radial_D6.3mm_H11.0mm_P2.50mm.wrl', '0608e355733117c76ab4c7019fe8d10be54622b9dedfbdda52efde7067ebbb58', 'capacitor', [1.25, 0]),
  define('ceramic', 'Capacitor_SMD.3dshapes/C_0603_1608Metric.wrl', 'd8b095ab562bf44b3a6bcb4059c87775c51b7c5672480f3b2fdc796f165c8505', 'ceramic'),
  define('resistor', 'Resistor_SMD.3dshapes/R_0603_1608Metric.wrl', 'eadfec9e71c67b1dd3910c72b45d811a06f0ab5397d0609354b10e9a3a4c1fdd', 'resistor'),
  define('inductor', 'Inductor_SMD.3dshapes/L_Bourns-SRN4018.wrl', '467ca847d6e49fedb51ed891a76d26d1e619a66a6a5995895a6f3873390c9338', 'inductor'),
  define('crystal', 'Crystal.3dshapes/Crystal_SMD_3225-4Pin_3.2x2.5mm.wrl', '5aae8f02639acee21d6df9c617a4f12283ea353d1eac3a77fea905ab07f7b1b2', 'crystal'),
  define('usb', 'Connector_USB.3dshapes/USB_Micro-B_Molex_47346-0001.wrl', '7ad5e269c357dbc43efc1f2141850a9b705d8b7ff2656351cbeeecbcbbe6d03f', 'connector', [0, -1.05]),
  define('header', 'Connector_PinHeader_2.54mm.3dshapes/PinHeader_1x04_P2.54mm_Vertical.wrl', '3b81133ef90dcd96495f3c112fa779566c9142ebbb346d62f887bc76dfd84141', 'connector', [0, -3.81]),
]);

export const environmentAsset = Object.freeze({
  file: 'assets/environment/studio.hdr',
  source: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
  md5: 'd5d7eb9d26d341d6aa4d11c1a54fd97c', license: 'CC0-1.0',
});
