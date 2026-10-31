const population = [
  { type: 'lqfp', x: 0, z: 0, rotation: 0 },
  { type: 'lqfp', x: 1.2, z: -1.1, rotation: 0 },
  { type: 'soic', x: -1.15, z: 0, rotation: 0 },
  { type: 'capacitor', x: 1.62, z: 0.66, rotation: 0 },
  { type: 'capacitor', x: 1.05, z: 1.25, rotation: 0 },
  { type: 'inductor', x: 1.65, z: 0.05, rotation: 0 },
  { type: 'crystal', x: 0.43, z: -0.94, rotation: 0 },
  { type: 'usb', x: -1.53, z: 1.1, rotation: 0 },
  { type: 'header', x: -1.62, z: -1.25, rotation: Math.PI / 2 },
];

for (const side of [-1, 1]) {
  for (const z of [-0.4, -0.15, 0.1, 0.35]) {
    population.push({ type: side === -1 ? 'resistor' : 'ceramic', x: side * 0.65, z, rotation: Math.PI / 2 });
  }
  for (const x of [-0.32, -0.08, 0.16, 0.4]) {
    population.push({ type: side === -1 ? 'ceramic' : 'resistor', x, z: side * 0.64, rotation: 0 });
  }
}
for (let i = 0; i < 5; i++) {
  population.push({ type: 'resistor', x: -1.72, z: -0.47 + i * 0.24, rotation: Math.PI / 2 });
  population.push({ type: 'ceramic', x: 0.62 + i * 0.24, z: -1.78, rotation: 0 });
}
for (const [x, z] of [[-0.6, 0.86], [-0.25, 1.02], [0.12, 1.1], [-1.02, 0.83], [1.24, 0.19], [1.24, 0.4], [0.1, -1.45]]) {
  population.push({ type: 'ceramic', x, z, rotation: 0 });
}
const surroundingModules = [[-3.8, -3.5], [-3.8, 2.6], [3.8, -3.5], [3.8, 2.6], [0, -4.5], [-6.8, -0.5], [6.8, -0.5], [0, 4.2]];
for (const [index, [x, z]] of surroundingModules.entries()) {
  population.push({ type: index % 3 === 0 ? 'lqfp' : 'soic', x, z, rotation: 0 });
  for (const side of [-1, 1]) {
    for (const lane of [-0.36, -0.12, 0.12, 0.36]) population.push({ type: side < 0 ? 'resistor' : 'ceramic', x: x + side * 0.65, z: z + lane, rotation: Math.PI / 2 });
    for (const lane of [-0.3, -0.06, 0.18, 0.42]) population.push({ type: 'ceramic', x: x + lane, z: z + side * 0.72, rotation: 0 });
  }
  if (index % 2 === 0) {
    population.push({ type: 'inductor', x: x + 1.25, z, rotation: 0 });
    population.push({ type: 'capacitor', x: x + 1.25, z: z + 0.65, rotation: 0 });
  }
}
export const placements = Object.freeze(population.map((part) => Object.freeze(part)));

const paths = [];
for (let lane = 0; lane < 12; lane++) {
  const offset = (lane - 5.5) * 0.05;
  paths.push([[-0.44, offset], [-0.52, offset], [-0.58, offset - 0.06], [-0.76, offset - 0.06], [-0.85, offset - 0.15]]);
  paths.push([[offset, -0.44], [offset, -0.54], [offset + 0.18, -0.72], [0.7 + offset, -0.72], [0.75, -0.88 + offset]]);
  paths.push([[1.2 + offset, -1.55], [1.2 + offset, -1.62], [1.3 + offset, -1.72], [1.3 + offset, -1.83]]);
}
paths.push([[-1.53, 1.02], [-1.53, 0.76], [-1.27, 0.5]], [[-1.14, 0.86], [-0.82, 0.86], [-0.64, 0.68]], [[0.43, -0.94], [0.55, -0.94], [0.7, -1.09]], [[1.62, 0.66], [1.62, 0.36], [1.65, 0.05]], [[1.175, 1.25], [1.175, 0.46], [1.25, 0.11], [1.65, 0.11]]);
export const routes = Object.freeze(paths.map((path) => Object.freeze(path)));
const surroundingPaths = [];
for (const [index, [x, z]] of surroundingModules.entries()) {
  const pin = index % 3 === 0 ? 0.414 : 0.272;
  const pitch = index % 3 === 0 ? 0.05 : 0.127;
  for (const side of [-1, 1]) {
    for (const [lane, offset] of [-0.36, -0.12, 0.12, 0.36].entries()) {
      const contactZ = z + offset - 0.067;
      const pinZ = z + (lane - 1.5) * pitch;
      surroundingPaths.push([[x + side * pin, pinZ], [x + side * 0.48, pinZ], [x + side * 0.57, contactZ], [x + side * 0.65, contactZ]]);
    }
  }
  const coreZ = -1.1 + (index - 3.5) * 0.05;
  const railX = x < 0 ? -2.55 - index * 0.05 : 2.55 + index * 0.05;
  surroundingPaths.push([[x < 0 ? 0.786 : 1.614, coreZ], [railX, coreZ], [railX, z - pitch * 2.5], [x - pin, z - pitch * 2.5]]);
}
export const surroundingRoutes = Object.freeze(surroundingPaths.map((path) => Object.freeze(path)));
