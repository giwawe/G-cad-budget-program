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
}: {
  drawing: DrawingGeometry | null;
  rows: QuantityRow[];
  summary: QuantitySummary | null;
  onRenameSpace: (index: number, name: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panCenter, setPanCenter] = useState<DrawingPoint | null>(null);
  const [dragStart, setDragStart] = useState<{ pointer: DrawingPoint; center: DrawingPoint } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showMeasuredWalls, setShowMeasuredWalls] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [showDoors, setShowDoors] = useState(true);

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
        <label className="drawingLayerToggle"><input type="checkbox" checked={showWindows} onChange={(event) => setShowWindows(event.target.checked)} />窗 {drawing.windows.length}</label>
        <label className="drawingLayerToggle"><input type="checkbox" checked={showDoors} onChange={(event) => setShowDoors(event.target.checked)} />门 {drawing.doors.length}</label>
      </div>

      <div className="drawingCanvas" onWheel={handleWheel}>
        <svg ref={svgRef} viewBox={viewBox} role="img" aria-label="DXF 空间核对图" onClick={handleSvgClick} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          <g transform={`scale(1 -1) translate(0 ${-(drawing.bbox.min_y + drawing.bbox.max_y)})`}>
            {drawing.base_segments.map((segment, index) => <line key={`base-${index}`} className="svgBase" x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y} />)}
            {drawing.walls.map((wall, index) => <line key={`wall-${index}`} className="svgWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {drawing.spaces.map((space, index) => <polygon key={space.name} points={pointList(space.points)} className="svgSpace" style={{ fill: palette[index % palette.length], stroke: palette[index % palette.length] }} />)}
            {showMeasuredWalls && drawing.measured_walls.map((wall, index) => <line key={`measured-wall-${index}`} className="svgMeasuredWall" x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} />)}
            {showWindows && drawing.windows.map((window, index) => (
              <g key={`window-${index}`}>
                <line className="svgWindowBlock" x1={window.start.x} y1={window.start.y} x2={window.end.x} y2={window.end.y} />
                <line className="svgWindow" x1={window.start.x} y1={window.start.y} x2={window.end.x} y2={window.end.y} />
              </g>
            ))}
            {showDoors && drawing.doors.map((door, index) => (
              <g key={`door-${index}`}>
                <line className="svgDoorBlock" x1={door.start.x} y1={door.start.y} x2={door.end.x} y2={door.end.y} />
                <line className="svgDoor" x1={door.start.x} y1={door.start.y} x2={door.end.x} y2={door.end.y} />
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
