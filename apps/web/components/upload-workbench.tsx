"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { FileUp, Layers3, Loader2, Settings2 } from "lucide-react";
import { DrawingReview } from "@/components/drawing-review";
import { QuantityTable } from "@/components/quantity-table";
import type { DrawingGeometry, QuantityRow, QuantitySummary, ReviewStatus } from "@/lib/types";

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
    wallGrossAreaM2: row.wall_gross_area_m2,
    latexPaintAreaM2: row.latex_paint_area_m2,
    evidence: row.evidence,
    anomalies: row.anomalies,
    status: row.status,
  };
}

export function UploadWorkbench({ initialRows }: { initialRows: QuantityRow[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<QuantityRow[]>(initialRows);
  const [fileName, setFileName] = useState("样例数据");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drawing, setDrawing] = useState<DrawingGeometry | null>(null);
  const [summary, setSummary] = useState<QuantitySummary | null>(null);

  const excludedCount = useMemo(() => rows.filter((row) => row.status === "excluded").length, [rows]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage(`正在上传到 ${getApiBaseUrl()}`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${getApiBaseUrl()}/api/parse-dxf-review`, { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error(`DXF 解析失败：HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ReviewResponse;
      setRows(payload.rows.map(toQuantityRow));
      setDrawing(payload.drawing);
      setSummary(payload.summary);
      setFileName(file.name);
      setMessage(`解析完成：${payload.rows.length} 个空间`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "DXF 解析失败");
      setMessage("");
    } finally {
      setIsUploading(false);
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
      return { ...current, spaces: current.spaces.map((space, spaceIndex) => (spaceIndex === index ? { ...space, name: trimmedName } : space)) };
    });
    setRows((current) => current.map((row) => (row.spaceName === previousName ? { ...row, spaceName: trimmedName } : row)));
  }

  return (
    <main>
      <input ref={inputRef} hidden className="fileInput" type="file" accept=".dxf" onChange={handleFileChange} />
      <section className="topbar">
        <div>
          <p>DXF 空间算量验证工具</p>
          <h1>CAD 工程量校对工作台</h1>
        </div>
        <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}>
          {isUploading ? <Loader2 aria-hidden="true" className="spin" size={18} /> : <FileUp aria-hidden="true" size={18} />}
          {isUploading ? "解析中" : "上传 DXF"}
        </button>
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
        </div>
      </section>

      <DrawingReview drawing={drawing} rows={rows} summary={summary} onRenameSpace={handleRenameSpace} />

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
