import assert from "node:assert/strict";
import { windowBlockPolygons } from "./drawing-window-shape.ts";

const rectangularWindow = {
  boundary_points: [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 0.2 },
    { x: 0, y: 0.2 },
  ],
  segments: [
    { start: { x: 0, y: 0 }, end: { x: 3, y: 0 } },
    { start: { x: 3, y: 0 }, end: { x: 3, y: 0.2 } },
    { start: { x: 3, y: 0.2 }, end: { x: 0, y: 0.2 } },
    { start: { x: 0, y: 0.2 }, end: { x: 0, y: 0 } },
  ],
};

assert.equal(windowBlockPolygons(rectangularWindow).length, 1);

const lShapedWindowWithOneSideBoundary = {
  boundary_points: [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 0.2 },
    { x: 0, y: 0.2 },
  ],
  segments: [
    { start: { x: 0, y: 0 }, end: { x: 3, y: 0 } },
    { start: { x: 3, y: 0 }, end: { x: 3, y: 0.2 } },
    { start: { x: 3, y: 0.2 }, end: { x: 0, y: 0.2 } },
    { start: { x: 0, y: 0.2 }, end: { x: 0, y: 0 } },
    { start: { x: 0, y: 0.2 }, end: { x: 0.2, y: 0.2 } },
    { start: { x: 0.2, y: 0.2 }, end: { x: 0.2, y: 1.4 } },
    { start: { x: 0.2, y: 1.4 }, end: { x: 0, y: 1.4 } },
    { start: { x: 0, y: 1.4 }, end: { x: 0, y: 0.2 } },
  ],
};

const lShapePolygons = windowBlockPolygons(lShapedWindowWithOneSideBoundary);
assert.equal(lShapePolygons.length, 1);
assert.ok(lShapePolygons.some((polygon) => polygon.some((point) => point.y > 1)), "L-shaped block should cover the vertical window side");
assert.equal(lShapePolygons[0].length, 6);
