import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createSensorFrame() { return new RoundedBoxGeometry(0.49, 0.018, 0.49, 3, 0.006); }

function shape(width, depth, drills) {
  const outline = new Shape();
  outline.moveTo(-width / 2, -depth / 2);
  outline.lineTo(width / 2, -depth / 2);
  outline.lineTo(width / 2, depth / 2);
  outline.lineTo(-width / 2, depth / 2);
  outline.closePath();
  for (const drill of drills) {
    if (Math.abs(drill.x) + drill.radius >= width / 2 || Math.abs(drill.z + 0.3) + drill.radius >= depth / 2) continue;
    const hole = new Path();
    hole.absarc(drill.x, -drill.z - 0.3, drill.radius, 0, Math.PI * 2, true);
    outline.holes.push(hole);
  }
  return outline;
}

function surface(outline, width, depth) {
  const geometry = new ShapeGeometry(outline, 8);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) uv.setXY(i, Math.min(1, Math.max(0, (positions.getX(i) + width / 2) / width)), Math.min(1, Math.max(0, (positions.getY(i) + depth / 2) / depth)));
  return geometry;
}

export function createBoardDetail(drills = []) { return surface(shape(4.4, 3.4, drills), 4.4, 3.4); }

export function createBoardGeometry(extent, drills = [], sharedDetail) {
  const body = new ExtrudeGeometry(shape(extent.width, extent.depth, drills), { depth: 0.16, bevelEnabled: false, curveSegments: 8 });
  body.rotateX(-Math.PI / 2).translate(0, -0.16, -0.3);
  const detail = sharedDetail ?? createBoardDetail(drills);
  return { body, detail, dispose() { body.dispose(); if (!sharedDetail) detail.dispose(); } };
}
