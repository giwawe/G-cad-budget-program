"use client";

import { ChangeEvent, KeyboardEvent, MouseEvent, PointerEvent, WheelEvent, useRef, useState } from "react";
import type { DrawingGeometry, DrawingPoint, QuantityRow, QuantitySummary } from "@/lib/types";

const palette = ["#2f80ed", "#27ae60", "#f2994a", "#9b51e0", "#00a6a6", "#eb5757", "#6fcf97", "#f2c94c", "#56ccf2"];

function centerOf(points: DrawingPoint[]) {
  const total = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function pointList(points: DrawingPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function segmentRectPoints(segment: { start: DrawingPoint; end: DrawingPoint }, thickness: number) {
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

function openingPolygonPoints(segments: { start: DrawingPoint; end: DrawingPoint }[]) {
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
  const bestCycle = cycles.sort((first, second) => Math.abs(polygonSignedArea(second)) - Math.abs(polygonSignedArea(first)))[0];
  if (bestCycle) {
    return bestCycle;
  }

  const points = segments.flatMap((segment) => [segment.start, segment.end]);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return [
    { x: Math.min(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.max(...ys) },
    { x: Math.min(...xs), y: Math.max(...ys) },
  ];
}

function windowPolygonPoints(window: { segments: { start: DrawingPoint; end: DrawingPoint }[]; boundary_points?: DrawingPoint[] }) {
  if (window.boundary_points && window.boundary_points.length >= 4) {
    return window.boundary_points;
  }
  return openingPolygonPoints(window.segments);
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

function polygonSignedArea(points: DrawingPoint[]) {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function chineseOnly(name: string) {
  return name
    .split("/")
    .map((part) => part.trim())
    .filter((part) => /[\u4e00-\u9fff]/.test(part))
    .join("/");
}

export function DrawingReview({
  drawing,
  rows,
  summary,
  onRenameSpace,
  onToggleDoorDeduction,
  onToggleWindowDeduction,
  onChangeWindowHeight,
}: {
  drawing: DrawingGeometry | null;
  rows: QuantityRow[];
  summary: QuantitySummary | null;
  onRenameSpace: (index: number, name: string) => void;
  onToggleDoorDeduction: (index: number) => void;
  onToggleWindowDeduction: (index: number) => void;
  onChangeWindowHeight: (index: number, heightM: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panCenter, setPanCenter] = useState<DrawingPoint | null>(null);
  const [dragStart, setDragStart] = useState<{ pointer: DrawingPoint; center: DrawingPoint } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showMeasuredWalls, setShowMeasuredWalls] = useState(true);
  const [showTileWalls, setShowTileWalls] = useState(true);
  const [showNewWalls, setShowNewWalls] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [showDoors, setShowDoors] = useState(true);
  const [selectedWindowIndex, setSelectedWindowIndex] = useState<number | null>(null);

  if (!drawing || !summary) {
    return null;
  }

  const width = Math.max(drawing.bbox.max_x - drawing.bbox.min_x, 1);
  const height = Math.max(drawing.bbox.max_y - drawing.bbox.min_y, 1);
  const padding = Math.max(width, height) * 0.05;
  const baseViewBox = { x: drawing.bbox.min_x - padding, y: drawing.bbox.min_y - padding, width: width + padding * 2, height: height + padding * 2 };
  const viewWidth = baseViewBox.width / zoom;
  const viewHeight = baseViewBox.height / zoom;
  const center = panCenter ?? { x: baseViewBox.x + baseViewBox.width / 2, y: baseViewBox.y + baseViewBox.height / 2 };
  const viewX = center.x - viewWidth / 2;
  const viewY = center.y - viewHeight / 2;
  const viewBox = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`;
  const labelWidth = Math.max(width, height) * 0.9;
  const labelHeight = Math.max(width, height) * 0.22;
  const labelFontSize = Math.max(width, height) * 0.018;
  const selectedWindow = selectedWindowIndex === null ? null : drawing.window_openings[selectedWindowIndex] ?? null;

  function clientPointToSvgPoint(clientX: number, clientY: number): DrawingPoint | null {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }
    const rect = svg.getBoundingClientRect();
    return { x: viewX + ((clientX - rect.left) / rect.width) * viewWidth, y: viewY + ((clientY - rect.top) / rect.height) * viewHeight };
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const point = clientPointToSvgPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }
    setZoom((current) => {
      const next = event.deltaY < 0 ? current * 1.15 : current / 1.15;
      const clamped = Math.min(6, Math.max(0.75, next));
      const factor = current / clamped;
      setPanCenter({ x: point.x + (center.x - point.x) * factor, y: point.y + (center.y - point.y) * factor });
      return clamped;
    });
  }

  function applyZoom(nextZoom: number) {
    setZoom(Math.min(6, Math.max(0.75, nextZoom)));
  }

  function resetView() {
    setZoom(1);
    setPanCenter(null);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const point = clientPointToSvgPoint(event.clientX, event.clientY);
    if (!point || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ pointer: point, center });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragStart) {
      return;
    }
    const point = clientPointToSvgPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }
    setPanCenter({ x: dragStart.center.x + dragStart.pointer.x - point.x, y: dragStart.center.y + dragStart.pointer.y - point.y });
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragStart) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragStart(null);
  }

  function handleSvgClick(event: MouseEvent<SVGSVGElement>) {
    if (event.detail === 2) {
      resetView();
    }
  }

  function handleNameChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    onRenameSpace(index, event.target.value);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      setEditingIndex(null);
    }
  }

  function handleWindowHeightChange(event: ChangeEvent<HTMLInputElement>) {
    if (selectedWindowIndex === null) {
      return;
    }
    const nextHeight = Number(event.target.value);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
      return;
    }
    onChangeWindowHeight(selectedWindowIndex, nextHeight);
  }

  return (
    <section className="drawingReview">
      <div className="summaryCards">
        <div><span>空间</span><strong>{summary.space_count}</strong></div>
        <div><span>地面面积</span><strong>{summary.floor_area_total_m2.toFixed(2)} m2</strong></div>
        <div><span>墙线长度</span><strong>{summary.wall_measure_length_total_m.toFixed(2)} m</strong></div>
        <div><span>窗洞面积</span><strong>{summary.window_area_total_m2.toFixed(2)} m2</strong></div>
        <div><span>乳胶漆面积</span><strong>{summary.latex_paint_area_total_m2.toFixed(2)} m2</strong></div>
      </div>

      <div className="drawingToolbar">
        <button type="button" onClick={() => applyZoom(zoom / 1.25)}>-</button>
        <input aria-label="图纸缩放" max="6" min="0.75" step="0.05" type="range" value={zoom} onChange={(event) => applyZoom(Number(event.target.value))} />
        <button type="button" onClick={() => applyZoom(zoom * 1.25)}>+</button>
        <button type="button" onClick={resetView}>适应窗口</button>
        <span>{Math.round(zoom * 100)}%</span>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showMeasuredWalls} onChange={(event) => setShowMeasuredWalls(event.target.checked)} />计入墙线 {drawing.measured_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showTileWalls} onChange={(event) => setShowTileWalls(event.target.checked)} />贴砖墙 {drawing.tile_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showNewWalls} onChange={(event) => setShowNewWalls(event.target.checked)} />新砌墙 {drawing.new_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showWindows} onChange={(event) => setShowWindows(event.target.checked)} />窗 {drawing.window_openings.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showDoors} onChange={(event) => setShowDoors(event.target.checked)} />门 {drawing.door_openings.length}</label>
        {selectedWindow && (
          <div className="windowEditor">
            <span>窗宽 {selectedWindow.width_m.toFixed(2)} m</span>
            <label>
              窗高
              <input min="0.1" step="0.05" type="number" value={selectedWindow.height_m} onChange={handleWindowHeightChange} />
            </label>
            <span>扣减 {(selectedWindow.included_in_wall_deduction ? selectedWindow.width_m * selectedWindow.height_m : 0).toFixed(2)} m2</span>
          </div>
        )}
      </div>

      <div className="drawingCanvas" onWheel={handleWheel}>
        <svg ref={svgRef} viewBox={viewBox} role="img" aria-label="DXF 空间核对图" onClick={handleSvgClick} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          <g transform={`scale(1 -1) translate(0 ${-(drawing.bbox.min_y + drawing.bbox.max_y)})`}>
            {drawing.base_segments.map((segment, index) => <line key={`base-${index}`} className="svgBase" x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y} />)}
            {drawing.walls.map((wall, index) => <line key={`wall-${index}`} className="svgWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {drawing.spaces.map((space, index) => <polygon key={space.name} points={pointList(space.points)} className="svgSpace" style={{ fill: palette[index % palette.length], stroke: palette[index % palette.length] }} />)}
            {showMeasuredWalls && drawing.measured_walls.map((wall, index) => <line key={`measured-wall-${index}`} className="svgMeasuredWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showTileWalls && drawing.tile_walls.map((wall, index) => <line key={`tile-wall-${index}`} className="svgTileWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showNewWalls && drawing.new_walls.map((wall, index) => <line key={`new-wall-${index}`} className="svgNewWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showWindows && drawing.window_openings.map((window, index) => (
              <g
                key={`window-${index}`}
                className={`svgWindowGroup ${selectedWindowIndex === index ? "selected" : ""}`}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedWindowIndex(index);
                  onToggleWindowDeduction(index);
                }}
              >
                {!window.included_in_wall_deduction && <polygon className="svgWindowBlock" points={pointList(windowPolygonPoints(window))} />}
                {window.segments.map((segment, segmentIndex) => (
                  <line key={`window-line-${index}-${segmentIndex}`} className="svgWindow" x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y} />
                ))}
                <polygon className="svgWindowHitArea" points={pointList(windowPolygonPoints(window))} />
                <title>{window.included_in_wall_deduction ? "窗洞已计入扣减，点击改为不计入" : "窗洞未计入扣减，点击改为计入"}</title>
              </g>
            ))}
            {showDoors && drawing.door_openings.map((door, index) => (
              <g
                key={`door-${index}`}
                className="svgDoorGroup"
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleDoorDeduction(index);
                }}
              >
                <polygon
                  className={`svgDoorBlock ${door.deduct_from_wall ? "deducted" : ""} ${door.review_required ? "review" : ""}`}
                  points={pointList(segmentRectPoints(door.segment, door.thickness_m))}
                />
                <line className="svgDoor" x1={door.segment.start.x} y1={door.segment.start.y} x2={door.segment.end.x} y2={door.segment.end.y} />
                <title>{door.deduct_from_wall ? "门洞扣减，点击改为不扣减" : "门洞不扣减，点击改为扣减"}</title>
              </g>
            ))}
          </g>
          {drawing.spaces.map((space, index) => {
            const labelCenter = centerOf(space.points);
            const row = rows.find((item) => item.spaceName === space.name);
            const labelX = labelCenter.x;
            const labelY = drawing.bbox.min_y + drawing.bbox.max_y - labelCenter.y;
            const name = chineseOnly(space.name);
            return (
              <g key={`label-${index}-${space.name}`}>
                <text className="svgSpaceLabelText" x={labelX} y={labelY - labelFontSize * 1.25} fontSize={labelFontSize} onClick={() => setEditingIndex(index)}>
                  <tspan x={labelX} dy="0">{name}</tspan>
                  <tspan x={labelX} dy={labelFontSize * 1.35}>地面 {row ? row.floorAreaM2.toFixed(2) : "--"} m2</tspan>
                  <tspan x={labelX} dy={labelFontSize * 1.35}>墙线 {row ? row.wallMeasureLengthM.toFixed(2) : "--"} m</tspan>
                </text>
                {editingIndex === index && (
                  <foreignObject className="svgNameEditorObject" x={labelX - labelWidth / 2} y={labelY - labelHeight / 2} width={labelWidth} height={labelHeight}>
                    <input aria-label={`${space.name} 空间名称`} autoFocus className="svgNameEditor" value={name} onBlur={() => setEditingIndex(null)} onChange={(event) => handleNameChange(index, event)} onKeyDown={handleNameKeyDown} />
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
