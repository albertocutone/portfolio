export function clampOffset(value) {
  return Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value));
}

const smoothstep = (t) => t * t * (3 - 2 * t);
const mixTuple = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t);

export function resolveTimeline(value, stations) {
  const offset = clampOffset(value);
  const index = Math.min(stations.length - 1, Math.floor(offset * stations.length));
  const station = stations[index];
  const next = stations[Math.min(index + 1, stations.length - 1)];
  const [start, end] = station.scrollRange;
  const local = (offset - start) / (end - start);
  const travel = index === stations.length - 1 ? 0 : clampOffset((local - 0.7) / 0.3);
  const eased = smoothstep(travel);
  const arrival = index === 0 ? 1 : smoothstep(clampOffset((offset - start) / 0.02));
  return {
    station, index, transitionProgress: travel,
    position: mixTuple(station.camera, next.camera, eased),
    target: mixTuple(station.target, next.target, eased),
    focus: mixTuple(station.focus ?? station.anchor, next.focus ?? next.anchor, eased),
    cardOpacity: arrival * (1 - clampOffset(travel * 3)),
  };
}
