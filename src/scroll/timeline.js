import { motion } from '../config/motion.js';

export function clampOffset(value) {
  return typeof value !== 'number' || Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value));
}

const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;
const mixTuple = (a, b, t) => a.map((value, index) => mix(value, b[index], t));
const curveCache = new WeakMap();

function bezier(points, t) {
  const s = 1 - t;
  const weights = [s * s * s, 3 * s * s * t, 3 * s * t * t, t * t * t];
  return [0, 1, 2].map((axis) => points.reduce((sum, point, index) => sum + point[axis] * weights[index], 0));
}

function cameraCurve(station, next, progress) {
  if (progress <= 0) return [...station.camera];
  if (progress >= 1) return [...next.camera];
  let cached = curveCache.get(station);
  if (!cached || cached.next !== next) {
    const controls = station.cameraControls ?? [mixTuple(station.camera, next.camera, 1 / 3), mixTuple(station.camera, next.camera, 2 / 3)];
    const points = [station.camera, ...controls, next.camera];
    const lengths = [0];
    let previous = points[0];
    for (let i = 1; i <= 256; i++) {
      const point = bezier(points, i / 256);
      lengths.push(lengths.at(-1) + Math.hypot(...point.map((value, axis) => value - previous[axis])));
      previous = point;
    }
    cached = { points, lengths, next };
    curveCache.set(station, cached);
  }
  const distance = progress * cached.lengths.at(-1);
  let low = 0;
  let high = 256;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (cached.lengths[mid] < distance) low = mid;
    else high = mid;
  }
  const span = cached.lengths[high] - cached.lengths[low];
  const fraction = span === 0 ? 0 : (distance - cached.lengths[low]) / span;
  return bezier(cached.points, (low + fraction) / 256);
}

export function resolveTimeline(value, stations) {
  const offset = clampOffset(value);
  const found = stations.findIndex((station) => offset >= station.scrollRange[0] && offset < station.scrollRange[1]);
  const index = found < 0 ? stations.length - 1 : found;
  const station = stations[index];
  const next = stations[Math.min(index + 1, stations.length - 1)];
  const [start, end] = station.scrollRange;
  const local = (offset - start) / (end - start);
  const travel = index === stations.length - 1 ? 0 : clampOffset((local - motion.dwellRatio) / (1 - motion.dwellRatio));
  const eased = ease(travel);
  const arrival = index === 0 ? 1 : ease(clampOffset((offset - start) / motion.arrivalFade));
  return {
    station, index, transitionProgress: travel,
    position: cameraCurve(station, next, eased),
    target: mixTuple(station.target, next.target, eased),
    focus: mixTuple(station.focus ?? station.anchor, next.focus ?? next.anchor, eased),
    focusRange: mix(station.focusRange ?? 0.3, next.focusRange ?? 0.3, eased),
    bokehScale: mix(station.bokehScale ?? 0.7, next.bokehScale ?? 0.7, eased),
    cardOpacity: arrival * (1 - ease(clampOffset(travel / motion.departureRatio))),
  };
}
