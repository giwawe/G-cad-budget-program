export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingSegment = {
  start: DrawingPoint;
  end: DrawingPoint;
};

export type DrawingWindowShape = {
  segments: DrawingSegment[];
  boundary_points?: DrawingPoint[];
};

export function segmentRectPoints(segment: DrawingSegment, thickness: number) {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const length = Math.hypot(dx, dy) || 1;
  const halfThickness = Math.max(0.04, Math.min(0.45, thickness || 0.12)) / 2;
  const nx = (-dy / length) * halfThickness;
  const ny = (dx / length) * halfThickness;

  return [
    { x: segment.start.x + nx, y: segment.start.y + ny },
    { x: segment.end.x + nx, y: segment.end.y + ny },
    { x: segment.end.x - nx, y: segment.end.y - ny },
    { x: segment.start.x - nx, y: segment.start.y - ny },
  ];
}

export function windowPolygonPoints(window: DrawingWindowShape) {
  if (window.boundary_points && window.boundary_points.length >= 4) {
    return window.boundary_points;
  }
  return openingPolygonPoints(window.segments);
}

export function windowBlockPolygons(window: DrawingWindowShape) {
  const boundary = window.boundary_points && window.boundary_points.length >= 4 ? window.boundary_points : null;
  if (boundary && boundaryContainsSegments(boundary, window.segments)) {
    return [boundary];
  }
  const merged = mergedAxisAlignedOutline(window.segments);
  if (merged.length >= 4) {
    return [merged];
  }
  return window.segments.map((segment) => segmentRectPoints(segment, 0.18));
}

function mergedAxisAlignedOutline(segments: DrawingSegment[]) {
  const cycles = openingCycles(segments).filter((cycle) => isAxisAlignedPolygon(cycle));
  if (cycles.length < 2) {
    return [];
  }
  const xs = uniqueSorted(cycles.flatMap((cycle) => cycle.map((point) => point.x)));
  const ys = uniqueSorted(cycles.flatMap((cycle) => cycle.map((point) => point.y)));
  if (xs.length < 2 || ys.length < 2) {
    return [];
  }

  const covered = new Set<string>();
  for (let xIndex = 0; xIndex < xs.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < ys.length - 1; yIndex += 1) {
      const center = { x: (xs[xIndex] + xs[xIndex + 1]) / 2, y: (ys[yIndex] + ys[yIndex + 1]) / 2 };
      if (cycles.some((cycle) => pointInPolygon(center, cycle))) {
        covered.add(cellKey(xIndex, yIndex));
      }
    }
  }
  if (!covered.size) {
    return [];
  }

  const boundaryEdges: Array<[DrawingPoint, DrawingPoint]> = [];
  for (const key of covered) {
    const [xIndex, yIndex] = key.split(",").map(Number);
    if (!covered.has(cellKey(xIndex, yIndex - 1))) {
      boundaryEdges.push([{ x: xs[xIndex], y: ys[yIndex] }, { x: xs[xIndex + 1], y: ys[yIndex] }]);
    }
    if (!covered.has(cellKey(xIndex + 1, yIndex))) {
      boundaryEdges.push([{ x: xs[xIndex + 1], y: ys[yIndex] }, { x: xs[xIndex + 1], y: ys[yIndex + 1] }]);
    }
    if (!covered.has(cellKey(xIndex, yIndex + 1))) {
      boundaryEdges.push([{ x: xs[xIndex + 1], y: ys[yIndex + 1] }, { x: xs[xIndex], y: ys[yIndex + 1] }]);
    }
    if (!covered.has(cellKey(xIndex - 1, yIndex))) {
      boundaryEdges.push([{ x: xs[xIndex], y: ys[yIndex + 1] }, { x: xs[xIndex], y: ys[yIndex] }]);
    }
  }

  return simplifyCollinearPoints(traceBoundary(boundaryEdges));
}

function openingCycles(segments: DrawingSegment[]) {
  const pointByKey = new Map<string, DrawingPoint>();
  const edges = segments.map((segment, id) => {
    const startKey = pointKey(segment.start);
    const endKey = pointKey(segment.end);
    pointByKey.set(startKey, segment.start);
    pointByKey.set(endKey, segment.end);
    return { id, startKey, endKey };
  });
  const incident = new Map<string, typeof edges>();
  for (const edge of edges) {
    incident.set(edge.startKey, [...(incident.get(edge.startKey) ?? []), edge]);
    incident.set(edge.endKey, [...(incident.get(edge.endKey) ?? []), edge]);
  }

  const cycles: DrawingPoint[][] = [];
  for (const edge of edges) {
    findCycles(edge.endKey, edge.startKey, [edge.startKey, edge.endKey], new Set([edge.id]), incident, pointByKey, cycles);
  }
  const seen = new Set<string>();
  return cycles.filter((cycle) => {
    const key = canonicalCycleKey(cycle);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return Math.abs(polygonSignedArea(cycle)) > 0.0001;
  });
}

function boundaryContainsSegments(boundary: DrawingPoint[], segments: DrawingSegment[]) {
  const bbox = pointsBbox(boundary);
  return segments.every((segment) => pointInBbox(segment.start, bbox) && pointInBbox(segment.end, bbox));
}

function pointsBbox(points: DrawingPoint[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function pointInBbox(point: DrawingPoint, bbox: ReturnType<typeof pointsBbox>) {
  const tolerance = 0.001;
  return point.x >= bbox.minX - tolerance && point.x <= bbox.maxX + tolerance && point.y >= bbox.minY - tolerance && point.y <= bbox.maxY + tolerance;
}

function openingPolygonPoints(segments: DrawingSegment[]) {
  const cycles = openingCycles(segments);
  const bestCycle = cycles.sort((first, second) => Math.abs(polygonSignedArea(second)) - Math.abs(polygonSignedArea(first)))[0];
  if (bestCycle) {
    return bestCycle;
  }

  const points = segments.flatMap((segment) => [segment.start, segment.end]);
  const bbox = pointsBbox(points);
  return [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY },
  ];
}

function findCycles(
  currentKey: string,
  startKey: string,
  pathKeys: string[],
  usedEdgeIds: Set<number>,
  incident: Map<string, { id: number; startKey: string; endKey: string }[]>,
  pointByKey: Map<string, DrawingPoint>,
  cycles: DrawingPoint[][],
) {
  if (pathKeys.length > 10) {
    return;
  }
  for (const edge of incident.get(currentKey) ?? []) {
    if (usedEdgeIds.has(edge.id)) {
      continue;
    }
    const nextKey = edge.startKey === currentKey ? edge.endKey : edge.startKey;
    if (nextKey === startKey && pathKeys.length >= 4) {
      cycles.push(pathKeys.map((key) => pointByKey.get(key)).filter((point): point is DrawingPoint => Boolean(point)));
      continue;
    }
    if (pathKeys.includes(nextKey)) {
      continue;
    }
    findCycles(nextKey, startKey, [...pathKeys, nextKey], new Set([...usedEdgeIds, edge.id]), incident, pointByKey, cycles);
  }
}

function pointKey(point: DrawingPoint) {
  return `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
}

function cellKey(xIndex: number, yIndex: number) {
  return `${xIndex},${yIndex}`;
}

function polygonSignedArea(points: DrawingPoint[]) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function isAxisAlignedPolygon(points: DrawingPoint[]) {
  return points.every((point, index) => {
    const next = points[(index + 1) % points.length];
    return Math.abs(point.x - next.x) <= 0.001 || Math.abs(point.y - next.y) <= 0.001;
  });
}

function uniqueSorted(values: number[]) {
  return [...new Set(values.map((value) => Number(value.toFixed(3))))].sort((first, second) => first - second);
}

function pointInPolygon(point: DrawingPoint, polygon: DrawingPoint[]) {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = current.y > point.y !== previous.y > point.y && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function traceBoundary(edges: Array<[DrawingPoint, DrawingPoint]>) {
  if (!edges.length) {
    return [];
  }
  const outgoing = new Map<string, DrawingPoint[]>();
  for (const [start, end] of edges) {
    outgoing.set(pointKey(start), [...(outgoing.get(pointKey(start)) ?? []), end]);
  }
  const start = minPoint(edges.flatMap(([edgeStart, edgeEnd]) => [edgeStart, edgeEnd]));
  const points = [start];
  let current = start;
  const used = new Set<string>();
  for (let guard = 0; guard < edges.length + 3; guard += 1) {
    const candidates = outgoing.get(pointKey(current)) ?? [];
    const next = candidates.find((candidate) => !used.has(`${pointKey(current)}>${pointKey(candidate)}`));
    if (!next) {
      break;
    }
    used.add(`${pointKey(current)}>${pointKey(next)}`);
    if (pointKey(next) === pointKey(start)) {
      break;
    }
    points.push(next);
    current = next;
  }
  return points;
}

function minPoint(points: DrawingPoint[]) {
  return points.reduce((best, point) => (point.y < best.y || (point.y === best.y && point.x < best.x) ? point : best), points[0]);
}

function simplifyCollinearPoints(points: DrawingPoint[]) {
  if (points.length < 4) {
    return points;
  }
  return points.filter((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    return !((Math.abs(previous.x - point.x) <= 0.001 && Math.abs(point.x - next.x) <= 0.001) || (Math.abs(previous.y - point.y) <= 0.001 && Math.abs(point.y - next.y) <= 0.001));
  });
}

function canonicalCycleKey(points: DrawingPoint[]) {
  const keys = points.map(pointKey);
  const rotations = keys.map((_, index) => [...keys.slice(index), ...keys.slice(0, index)].join("|"));
  const reversed = [...keys].reverse();
  const reverseRotations = reversed.map((_, index) => [...reversed.slice(index), ...reversed.slice(0, index)].join("|"));
  return [...rotations, ...reverseRotations].sort()[0];
}
