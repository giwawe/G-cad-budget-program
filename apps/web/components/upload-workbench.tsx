"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { FileUp, Layers3, Loader2, Settings2 } from "lucide-react";
import { DrawingReview } from "@/components/drawing-review";
import { QuantityTable } from "@/components/quantity-table";
import type { CalibrationComparison, DrawingGeometry, QuantityRow, QuantitySummary, ReviewStatus } from "@/lib/types";

const DEFAULT_DOOR_HEIGHT_M = 2.1;

type ApiQuantityRow = {
  floor: string;
  space_name: string;
  space_type: string;
  floor_area_m2: number;
  ceiling_area_m2: number;
  wall_measure_length_m: number;
  height_m: number;
  window_width_total_m: number;
  window_area_m2: number;
  door_width_total_m: number;
  door_deduct_area_m2: number;
  wall_gross_area_m2: number;
  latex_paint_area_m2: number;
  evidence: string;
  anomalies: string[];
  status: ReviewStatus;
};

type ReviewResponse = {
  rows: ApiQuantityRow[];
  drawing: DrawingGeometry;
  summary: QuantitySummary;
};

type CompareResponse = {
  rows: ApiQuantityRow[];
  summary: QuantitySummary;
  comparison: CalibrationComparison;
};

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    const apiHost = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
    if (window.location.port === "3010") {
      return `http://${apiHost}:8010`;
    }
    return `http://${apiHost}:8000`;
  }
  return "http://127.0.0.1:8000";
}

function toQuantityRow(row: ApiQuantityRow): QuantityRow {
  return {
    floor: row.floor,
    spaceName: row.space_name,
    spaceType: row.space_type,
    floorAreaM2: row.floor_area_m2,
    ceilingAreaM2: row.ceiling_area_m2,
    wallMeasureLengthM: row.wall_measure_length_m,
    heightM: row.height_m,
    windowWidthTotalM: row.window_width_total_m,
    windowAreaM2: row.window_area_m2,
    doorWidthTotalM: row.door_width_total_m,
    doorDeductAreaM2: row.door_deduct_area_m2,
    wallGrossAreaM2: row.wall_gross_area_m2,
    latexPaintAreaM2: row.latex_paint_area_m2,
    evidence: row.evidence,
    anomalies: row.anomalies,
    status: row.status,
  };
}

function summarizeRows(rows: QuantityRow[]): QuantitySummary {
  return {
    space_count: rows.length,
    floor_area_total_m2: round2(rows.reduce((sum, row) => sum + row.floorAreaM2, 0)),
    wall_measure_length_total_m: round2(rows.reduce((sum, row) => sum + row.wallMeasureLengthM, 0)),
    window_area_total_m2: round2(rows.reduce((sum, row) => sum + row.windowAreaM2, 0)),
    latex_paint_area_total_m2: round2(rows.reduce((sum, row) => sum + row.latexPaintAreaM2, 0)),
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function UploadWorkbench({ initialRows }: { initialRows: QuantityRow[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const calibrationInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<QuantityRow[]>(initialRows);
  const [currentDxfFile, setCurrentDxfFile] = useState<File | null>(null);
  const [calibrationFileName, setCalibrationFileName] = useState("");
  const [fileName, setFileName] = useState("样例数据");
  const [isUploading, setIsUploading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drawing, setDrawing] = useState<DrawingGeometry | null>(null);
  const [summary, setSummary] = useState<QuantitySummary | null>(null);
  const [comparison, setComparison] = useState<CalibrationComparison | null>(null);

  const excludedCount = useMemo(() => rows.filter((row) => row.status === "excluded").length, [rows]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");
    setComparison(null);
    setCalibrationFileName("");
    setMessage(`正在上传到 ${getApiBaseUrl()}`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${getApiBaseUrl()}/api/parse-dxf-review`, { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error(`DXF 解析失败：HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ReviewResponse;
      const nextRows = payload.rows.map(toQuantityRow);
      setRows(nextRows);
      setDrawing(payload.drawing);
      setSummary(payload.summary);
      setFileName(file.name);
      setCurrentDxfFile(file);
      setMessage(`解析完成：${payload.rows.length} 个空间`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "DXF 解析失败");
      setMessage("");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleCalibrationChange(event: ChangeEvent<HTMLInputElement>) {
    const calibrationFile = event.target.files?.[0];
    if (!calibrationFile) {
      return;
    }
    if (!currentDxfFile) {
      setError("请先上传 DXF 文件，再上传校准 JSON");
      event.target.value = "";
      return;
    }

    setIsComparing(true);
    setError("");
    setMessage(`正在对比校准文件 ${calibrationFile.name}`);

    try {
      const formData = new FormData();
      formData.append("file", currentDxfFile);
      formData.append("calibration", calibrationFile);
      const response = await fetch(`${getApiBaseUrl()}/api/compare-dxf-calibration`, { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error(`校准对比失败：HTTP ${response.status}`);
      }

      const payload = (await response.json()) as CompareResponse;
      const nextRows = payload.rows.map(toQuantityRow);
      setRows(nextRows);
      setSummary(payload.summary);
      setComparison(payload.comparison);
      setCalibrationFileName(calibrationFile.name);
      setMessage(payload.comparison.passed ? "校准通过：系统算量与校准 JSON 一致" : `发现 ${payload.comparison.differences.length} 项差异`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "校准对比失败");
      setMessage("");
    } finally {
      setIsComparing(false);
      event.target.value = "";
    }
  }

  function handleRenameSpace(index: number, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    const previousName = drawing?.spaces[index]?.name;
    if (!previousName) {
      return;
    }
    setDrawing((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        spaces: current.spaces.map((space, spaceIndex) => (spaceIndex === index ? { ...space, name: trimmedName } : space)),
        door_openings: current.door_openings.map((door) => ({
          ...door,
          space_names: door.space_names.map((spaceName) => (spaceName === previousName ? trimmedName : spaceName)),
        })),
        window_openings: current.window_openings.map((window) => ({
          ...window,
          space_names: window.space_names.map((spaceName) => (spaceName === previousName ? trimmedName : spaceName)),
        })),
      };
    });
    setRows((current) => current.map((row) => (row.spaceName === previousName ? { ...row, spaceName: trimmedName } : row)));
  }

  function handleToggleDoorDeduction(index: number) {
    const door = drawing?.door_openings[index];
    if (!drawing || !door) {
      return;
    }
    const nextDeduct = !door.deduct_from_wall;
    const delta = round2((nextDeduct ? 1 : -1) * door.width_m * DEFAULT_DOOR_HEIGHT_M);

    const nextRows = rows.map((row) => {
      if (!door.space_names.includes(row.spaceName)) {
        return row;
      }
      const doorDeductAreaM2 = round2(Math.max(row.doorDeductAreaM2 + delta, 0));
      const latexPaintAreaM2 = round2(Math.max(row.latexPaintAreaM2 - delta, 0));
      return {
        ...row,
        doorDeductAreaM2,
        latexPaintAreaM2,
        evidence: `墙面展开面积 ${row.wallMeasureLengthM.toFixed(2)}m * ${row.heightM.toFixed(2)}m = ${row.wallGrossAreaM2.toFixed(2)}m2；乳胶漆面积 ${row.wallGrossAreaM2.toFixed(2)}m2 - 窗洞 ${row.windowAreaM2.toFixed(2)}m2 - 门洞 ${doorDeductAreaM2.toFixed(2)}m2 = ${latexPaintAreaM2.toFixed(2)}m2；门洞扣减已人工调整。`,
      };
    });

    setRows(nextRows);
    setSummary(summarizeRows(nextRows));
    setDrawing({
      ...drawing,
      door_openings: drawing.door_openings.map((item, doorIndex) =>
        doorIndex === index ? { ...item, deduct_from_wall: nextDeduct, review_required: false, opening_type: nextDeduct ? "manual_deduct" : "manual_no_deduct" } : item,
      ),
    });
  }

  function handleToggleWindowDeduction(index: number) {
    const windowOpening = drawing?.window_openings[index];
    if (!drawing || !windowOpening) {
      return;
    }
    const nextIncluded = !windowOpening.included_in_wall_deduction;
    const delta = round2((nextIncluded ? 1 : -1) * windowOpening.width_m * windowOpening.height_m);
    const nextRows = applyWindowAreaDelta(rows, windowOpening.space_names, delta, "窗洞扣减已人工调整。");

    setRows(nextRows);
    setSummary(summarizeRows(nextRows));
    setDrawing({
      ...drawing,
      window_openings: drawing.window_openings.map((item, windowIndex) =>
        windowIndex === index ? { ...item, included_in_wall_deduction: nextIncluded } : item,
      ),
    });
  }

  function handleChangeWindowHeight(index: number, heightM: number) {
    const windowOpening = drawing?.window_openings[index];
    if (!drawing || !windowOpening) {
      return;
    }
    const nextHeight = round2(heightM);
    const delta = windowOpening.included_in_wall_deduction ? round2(windowOpening.width_m * (nextHeight - windowOpening.height_m)) : 0;
    const nextRows = delta === 0 ? rows : applyWindowAreaDelta(rows, windowOpening.space_names, delta, "窗高已人工调整。");

    setRows(nextRows);
    setSummary(summarizeRows(nextRows));
    setDrawing({
      ...drawing,
      window_openings: drawing.window_openings.map((item, windowIndex) => (windowIndex === index ? { ...item, height_m: nextHeight } : item)),
    });
  }

  function applyWindowAreaDelta(currentRows: QuantityRow[], spaceNames: string[], delta: number, note: string) {
    return currentRows.map((row) => {
      if (!spaceNames.includes(row.spaceName)) {
        return row;
      }
      const windowAreaM2 = round2(Math.max(row.windowAreaM2 + delta, 0));
      const latexPaintAreaM2 = round2(Math.max(row.latexPaintAreaM2 - delta, 0));
      return {
        ...row,
        windowAreaM2,
        latexPaintAreaM2,
        evidence: `墙面展开面积 ${row.wallMeasureLengthM.toFixed(2)}m * ${row.heightM.toFixed(2)}m = ${row.wallGrossAreaM2.toFixed(2)}m2；乳胶漆面积 ${row.wallGrossAreaM2.toFixed(2)}m2 - 窗洞 ${windowAreaM2.toFixed(2)}m2 - 门洞 ${row.doorDeductAreaM2.toFixed(2)}m2 = ${latexPaintAreaM2.toFixed(2)}m2；${note}`,
      };
    });
  }

  return (
    <main>
      <input ref={inputRef} hidden className="fileInput" type="file" accept=".dxf" onChange={handleFileChange} />
      <input ref={calibrationInputRef} hidden className="fileInput" type="file" accept=".json,application/json" onChange={handleCalibrationChange} />
      <section className="topbar">
        <div>
          <p>DXF 空间算量验证工具</p>
          <h1>CAD 工程量校对工作台</h1>
        </div>
        <div className="topbarActions">
          <button type="button" disabled={isUploading || isComparing} onClick={() => inputRef.current?.click()}>
            {isUploading ? <Loader2 aria-hidden="true" className="spin" size={18} /> : <FileUp aria-hidden="true" size={18} />}
            {isUploading ? "解析中" : "上传 DXF"}
          </button>
          <button type="button" disabled={!currentDxfFile || isUploading || isComparing} onClick={() => calibrationInputRef.current?.click()}>
            {isComparing ? <Loader2 aria-hidden="true" className="spin" size={18} /> : <FileUp aria-hidden="true" size={18} />}
            {isComparing ? "对比中" : "上传校准 JSON"}
          </button>
        </div>
      </section>

      <section className="summaryGrid">
        <div className="panel">
          <div className="panelTitle">
            <Settings2 aria-hidden="true" size={18} />
            项目默认参数
          </div>
          <div className="fieldGrid">
            <label>项目名称<input defaultValue="商品房算量验证" /></label>
            <label>默认层高<input defaultValue="2.80 m" /></label>
            <label>默认窗高<input defaultValue="1.50 m" /></label>
            <label>默认门高<input defaultValue="2.10 m" /></label>
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">
            <Layers3 aria-hidden="true" size={18} />
            识别图层
          </div>
          <div className="layerList">{layers.map((layer) => <code key={layer}>{layer}</code>)}</div>
        </div>

        <div className="panel metricPanel">
          <div className="metricLabel">{fileName}</div>
          <strong>{rows.length}</strong>
          <span>个空间，其中 {excludedCount} 个默认不计价</span>
          {message && <small className="infoText">{message}</small>}
          {error && <small className="errorText">{error}</small>}
          {calibrationFileName && <small className="infoText">校准文件：{calibrationFileName}</small>}
        </div>
      </section>

      {comparison && (
        <section className={`calibrationPanel ${comparison.passed ? "passed" : "failed"}`}>
          <div className="calibrationSummary">
            <strong>{comparison.passed ? "校准通过" : "校准存在差异"}</strong>
            <span>匹配 {comparison.matched_count} 个空间，差异空间 {comparison.failed_count} 个</span>
            {(comparison.missing_spaces.length > 0 || comparison.unexpected_spaces.length > 0) && (
              <span>
                缺失 {comparison.missing_spaces.length} 个，多余 {comparison.unexpected_spaces.length} 个
              </span>
            )}
          </div>
          {comparison.differences.length > 0 && (
            <div className="calibrationDifferences">
              {comparison.differences.slice(0, 12).map((difference) => (
                <div key={`${difference.space_name}-${difference.field}`}>
                  <strong>{difference.space_name}</strong>
                  <span>{difference.field}</span>
                  <code>
                    {difference.actual} / {difference.expected} ({difference.delta > 0 ? "+" : ""}
                    {difference.delta}, {difference.percent_delta}%)
                  </code>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <DrawingReview
        drawing={drawing}
        rows={rows}
        summary={summary}
        onRenameSpace={handleRenameSpace}
        onToggleDoorDeduction={handleToggleDoorDeduction}
        onToggleWindowDeduction={handleToggleWindowDeduction}
        onChangeWindowHeight={handleChangeWindowHeight}
      />

      <section className="reviewSection">
        <div className="sectionHeader">
          <div>
            <h2>空间工程量校对表</h2>
            <p>第一期重点验证 DXF 自动算出的空间面积、墙面计量长度、窗洞扣减和计算依据。</p>
          </div>
        </div>
        <QuantityTable rows={rows} />
      </section>
    </main>
  );
}

const layers = ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_OPENING", "QUOTE_WINDOW", "QUOTE_DOOR", "QUOTE_FLOOR", "QUOTE_HEIGHT", "QUOTE_EXT_WALL"];
