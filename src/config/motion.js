export const motion = Object.freeze({
  dwellRatio: 0.35,
  arrivalFade: 0.02,
  departureRatio: 0.18,
  landingRatio: 0.15,
  damping: 0.35,
  maxSpeed: 0.1,
});

export const cameraProjection = Object.freeze({ fov: 35, near: 0.05, far: 200, desktopOffset: 0.17 });

export function stationLanding(stations, index) {
  if (index === 0) return 0;
  const [start, end] = stations[index].scrollRange;
  return start + (end - start) * motion.landingRatio;
}
