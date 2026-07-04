"use client";

import { ChangeEvent, KeyboardEvent, MouseEvent, PointerEvent, WheelEvent, useRef, useState } from "react";
import { segmentRectPoints, windowBlockPolygons } from "@/lib/drawing-window-shape";
import type { DrawingGeometry, DrawingPoint, QuantityRow, QuantitySummary } from "@/lib/types";

const palette = ["#2f80ed", "#27ae60", "#f2994a", "#9b51e0", "#00a6a6", "#eb5757", "#6fcf97", "#f2c94c", "#56ccf2"];

function centerOf(points: DrawingPoint[]) {
  const total = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function pointList(points: DrawingPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function pointInPolygon(point: DrawingPoint, polygon: DrawingPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];
    const intersects = current.y > point.y !== previous.y > point.y && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y || 1) + current.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInAnyPolygon(point: DrawingPoint, polygons: DrawingPoint[][]) {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

function segmentCenter(segment: { start: DrawingPoint; end: DrawingPoint }) {
  return { x: (segment.start.x + segment.end.x) / 2, y: (segment.start.y + segment.end.y) / 2 };
}

function segmentInAnyPolygon(segment: { start: DrawingPoint; end: DrawingPoint }, polygons: DrawingPoint[][]) {
  return pointInAnyPolygon(segmentCenter(segment), polygons) || pointInAnyPolygon(segment.start, polygons) || pointInAnyPolygon(segment.end, polygons);
}

function boundaryInAnyPolygon(boundary: DrawingPoint[], polygons: DrawingPoint[][]) {
  return pointInAnyPolygon(centerOf(boundary), polygons) || boundary.some((point) => pointInAnyPolygon(point, polygons));
}

function bboxForPoints(points: DrawingPoint[], fallback: DrawingGeometry["bbox"]) {
  if (points.length === 0) {
    return fallback;
  }
  return {
    min_x: Math.min(...points.map((point) => point.x)),
    min_y: Math.min(...points.map((point) => point.y)),
    max_x: Math.max(...points.map((point) => point.x)),
    max_y: Math.max(...points.map((point) => point.y)),
  };
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
  const [showDemolitionWalls, setShowDemolitionWalls] = useState(true);
  const [showBaseCabinets, setShowBaseCabinets] = useState(true);
  const [showWallCabinets, setShowWallCabinets] = useState(true);
  const [showCustomCabinets, setShowCustomCabinets] = useState(true);
  const [showExteriorWalls, setShowExteriorWalls] = useState(true);
  const [showBathroomFixtures, setShowBathroomFixtures] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [showDoors, setShowDoors] = useState(true);
  const [selectedWindowIndex, setSelectedWindowIndex] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("");

  if (!drawing || !summary) {
    return null;
  }

  const floorOptions = Array.from(new Set(rows.map((row) => row.floor))).filter(Boolean);
  const effectiveFloor = selectedFloor === "all" || floorOptions.includes(selectedFloor) ? selectedFloor : floorOptions[0] ?? "all";
  const showAllFloors = effectiveFloor === "all";
  const visibleSpaceEntries = drawing.spaces
    .map((space, index) => ({ space, index, row: rows[index] }))
    .filter((entry) => showAllFloors || entry.row?.floor === effectiveFloor);
  const visibleSpacePolygons = visibleSpaceEntries.map((entry) => entry.space.points);
  const visibleDrawing = (() => {
    if (showAllFloors || visibleSpacePolygons.length === 0) {
      return drawing;
    }
    return {
      ...drawing,
      base_segments: drawing.base_segments.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      walls: drawing.walls.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      measured_walls: drawing.measured_walls.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      opening_edges: drawing.opening_edges?.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      void_boundaries: drawing.void_boundaries?.filter((boundary) => boundaryInAnyPolygon(boundary, visibleSpacePolygons)),
      railings: drawing.railings?.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      tile_walls: drawing.tile_walls.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      new_walls: drawing.new_walls.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      demolition_walls: drawing.demolition_walls.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      background_walls: drawing.background_walls?.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      base_cabinets: drawing.base_cabinets.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      wall_cabinets: drawing.wall_cabinets.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      base_cabinet_boundaries: drawing.base_cabinet_boundaries?.filter((boundary) => boundaryInAnyPolygon(boundary, visibleSpacePolygons)),
      wall_cabinet_boundaries: drawing.wall_cabinet_boundaries?.filter((boundary) => boundaryInAnyPolygon(boundary, visibleSpacePolygons)),
      custom_cabinets: drawing.custom_cabinets.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      toilets: drawing.toilets.filter((point) => pointInAnyPolygon(point, visibleSpacePolygons)),
      bathroom_vanities: drawing.bathroom_vanities.filter((point) => pointInAnyPolygon(point, visibleSpacePolygons)),
      window_openings: drawing.window_openings.filter((window) => window.segments.some((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons))),
      windows: drawing.windows.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      door_openings: drawing.door_openings.filter((door) => segmentInAnyPolygon(door.segment, visibleSpacePolygons)),
      doors: drawing.doors.filter((segment) => segmentInAnyPolygon(segment, visibleSpacePolygons)),
      exterior_wall_boundaries: [],
      spaces: visibleSpaceEntries.map((entry) => entry.space),
      bbox: bboxForPoints(visibleSpacePolygons.flat(), drawing.bbox),
    };
  })();
  const width = Math.max(visibleDrawing.bbox.max_x - visibleDrawing.bbox.min_x, 1);
  const height = Math.max(visibleDrawing.bbox.max_y - visibleDrawing.bbox.min_y, 1);
  const padding = Math.max(width, height) * 0.05;
  const baseViewBox = { x: visibleDrawing.bbox.min_x - padding, y: visibleDrawing.bbox.min_y - padding, width: width + padding * 2, height: height + padding * 2 };
  const viewWidth = baseViewBox.width / zoom;
  const viewHeight = baseViewBox.height / zoom;
  const center = panCenter ?? { x: baseViewBox.x + baseViewBox.width / 2, y: baseViewBox.y + baseViewBox.height / 2 };
  const viewX = center.x - viewWidth / 2;
  const viewY = center.y - viewHeight / 2;
  const viewBox = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`;
  const labelWidth = Math.max(width, height) * 0.9;
  const labelHeight = Math.max(width, height) * 0.22;
  const labelFontSize = Math.max(width, height) * 0.018;
  const indexedWindows = visibleDrawing.window_openings.map((window) => ({ window, index: drawing.window_openings.indexOf(window) }));
  const indexedDoors = visibleDrawing.door_openings.map((door) => ({ door, index: drawing.door_openings.indexOf(door) }));
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

  function changeFloor(nextFloor: string) {
    setSelectedFloor(nextFloor);
    setSelectedWindowIndex(null);
    setEditingIndex(null);
    resetView();
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
        <div><span>建筑面积</span><strong>{summary.building_area_m2.toFixed(2)} m2</strong></div>
        <div><span>地面面积</span><strong>{summary.floor_area_total_m2.toFixed(2)} m2</strong></div>
        <div><span>墙线长度</span><strong>{summary.wall_measure_length_total_m.toFixed(2)} m</strong></div>
        <div><span>窗洞面积</span><strong>{summary.window_area_total_m2.toFixed(2)} m2</strong></div>
        <div><span>墙面乳胶漆</span><strong>{summary.latex_paint_area_total_m2.toFixed(2)} m2</strong></div>
      </div>

      <div className="drawingToolbar">
        <button type="button" onClick={() => applyZoom(zoom / 1.25)}>-</button>
        <input aria-label="图纸缩放" max="6" min="0.75" step="0.05" type="range" value={zoom} onChange={(event) => applyZoom(Number(event.target.value))} />
        <button type="button" onClick={() => applyZoom(zoom * 1.25)}>+</button>
        <button type="button" onClick={resetView}>适应窗口</button>
        <span>{Math.round(zoom * 100)}%</span>
        {floorOptions.length > 1 && (
          <div className="floorFilter" aria-label="图纸楼层筛选">
            <button type="button" className={effectiveFloor === "all" ? "active" : ""} onClick={() => changeFloor("all")}>全部楼层</button>
            {floorOptions.map((floor) => (
              <button type="button" className={effectiveFloor === floor ? "active" : ""} onClick={() => changeFloor(floor)} key={floor}>{floor}</button>
            ))}
          </div>
        )}
        <label className="drawingLayerToggle"><input type="checkbox" checked={showMeasuredWalls} onChange={(event) => setShowMeasuredWalls(event.target.checked)} />计入墙线 {visibleDrawing.measured_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showTileWalls} onChange={(event) => setShowTileWalls(event.target.checked)} />贴砖墙 {visibleDrawing.tile_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showNewWalls} onChange={(event) => setShowNewWalls(event.target.checked)} />新砌墙 {visibleDrawing.new_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showDemolitionWalls} onChange={(event) => setShowDemolitionWalls(event.target.checked)} />拆墙 {visibleDrawing.demolition_walls.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showBaseCabinets} onChange={(event) => setShowBaseCabinets(event.target.checked)} />地柜 {visibleDrawing.base_cabinets.length + (visibleDrawing.base_cabinet_boundaries?.length ?? 0)}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showWallCabinets} onChange={(event) => setShowWallCabinets(event.target.checked)} />吊柜 {visibleDrawing.wall_cabinets.length + (visibleDrawing.wall_cabinet_boundaries?.length ?? 0)}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showCustomCabinets} onChange={(event) => setShowCustomCabinets(event.target.checked)} />定制柜 {visibleDrawing.custom_cabinets.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showExteriorWalls} onChange={(event) => setShowExteriorWalls(event.target.checked)} />外墙 {visibleDrawing.exterior_wall_boundaries.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showBathroomFixtures} onChange={(event) => setShowBathroomFixtures(event.target.checked)} />洁具 {visibleDrawing.toilets.length + visibleDrawing.bathroom_vanities.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showWindows} onChange={(event) => setShowWindows(event.target.checked)} />窗 {visibleDrawing.window_openings.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showDoors} onChange={(event) => setShowDoors(event.target.checked)} />门 {visibleDrawing.door_openings.length}</label>
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
          <g transform={`scale(1 -1) translate(0 ${-(visibleDrawing.bbox.min_y + visibleDrawing.bbox.max_y)})`}>
            {visibleDrawing.base_segments.map((segment, index) => <line key={`base-${index}`} className="svgBase" x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y} />)}
            {visibleDrawing.walls.map((wall, index) => <line key={`wall-${index}`} className="svgWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showExteriorWalls && visibleDrawing.exterior_wall_boundaries.map((boundary, index) => <polygon key={`exterior-wall-${index}`} points={pointList(boundary)} className="svgExteriorWall" />)}
            {visibleSpaceEntries.map(({ space, index }) => <polygon key={`space-${index}-${space.name}`} points={pointList(space.points)} className="svgSpace" style={{ fill: palette[index % palette.length], stroke: palette[index % palette.length] }} />)}
            {showMeasuredWalls && visibleDrawing.measured_walls.map((wall, index) => <line key={`measured-wall-${index}`} className="svgMeasuredWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showTileWalls && visibleDrawing.tile_walls.map((wall, index) => <line key={`tile-wall-${index}`} className="svgTileWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showNewWalls && visibleDrawing.new_walls.map((wall, index) => <line key={`new-wall-${index}`} className="svgNewWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showDemolitionWalls && visibleDrawing.demolition_walls.map((wall, index) => <line key={`demolition-wall-${index}`} className="svgDemolitionWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showBaseCabinets && visibleDrawing.base_cabinet_boundaries?.map((boundary, index) => <polygon key={`base-cabinet-boundary-${index}`} className="svgBaseCabinet" points={pointList(boundary)} />)}
            {showBaseCabinets && visibleDrawing.base_cabinets.map((cabinet, index) => <line key={`base-cabinet-${index}`} className="svgBaseCabinet" x1={cabinet.start.x} y1={cabinet.start.y} x2={cabinet.end.x} y2={cabinet.end.y} />)}
            {showWallCabinets && visibleDrawing.wall_cabinet_boundaries?.map((boundary, index) => <polygon key={`wall-cabinet-boundary-${index}`} className="svgWallCabinet" points={pointList(boundary)} />)}
            {showWallCabinets && visibleDrawing.wall_cabinets.map((cabinet, index) => <line key={`wall-cabinet-${index}`} className="svgWallCabinet" x1={cabinet.start.x} y1={cabinet.start.y} x2={cabinet.end.x} y2={cabinet.end.y} />)}
            {showCustomCabinets && visibleDrawing.custom_cabinets.map((cabinet, index) => <line key={`custom-cabinet-${index}`} className="svgCustomCabinet" x1={cabinet.start.x} y1={cabinet.start.y} x2={cabinet.end.x} y2={cabinet.end.y} />)}
            {showBathroomFixtures && visibleDrawing.toilets.map((point, index) => <circle key={`toilet-${index}`} className="svgToilet" cx={point.x} cy={point.y} r="0.16" />)}
            {showBathroomFixtures && visibleDrawing.bathroom_vanities.map((point, index) => <rect key={`bathroom-vanity-${index}`} className="svgBathroomVanity" x={point.x - 0.16} y={point.y - 0.16} width="0.32" height="0.32" />)}
            {showWindows && indexedWindows.map(({ window, index }) => (
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
                {!window.included_in_wall_deduction &&
                  windowBlockPolygons(window).map((polygon, polygonIndex) => <polygon key={`window-block-${index}-${polygonIndex}`} className="svgWindowBlock" points={pointList(polygon)} />)}
                {window.segments.map((segment, segmentIndex) => (
                  <line key={`window-line-${index}-${segmentIndex}`} className="svgWindow" x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y} />
                ))}
                {windowBlockPolygons(window).map((polygon, polygonIndex) => <polygon key={`window-hit-${index}-${polygonIndex}`} className="svgWindowHitArea" points={pointList(polygon)} />)}
                <title>{window.included_in_wall_deduction ? "窗洞已计入扣减，点击改为不计入" : "窗洞未计入扣减，点击改为计入"}</title>
              </g>
            ))}
            {showDoors && indexedDoors.map(({ door, index }) => (
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
          {visibleSpaceEntries.map(({ space, index, row }) => {
            const labelCenter = centerOf(space.points);
            const labelX = labelCenter.x;
            const labelY = visibleDrawing.bbox.min_y + visibleDrawing.bbox.max_y - labelCenter.y;
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
