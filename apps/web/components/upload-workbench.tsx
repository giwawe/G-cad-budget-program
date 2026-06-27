"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Download, FileUp, Layers3, Loader2, ReceiptText, Settings2 } from "lucide-react";
import { DrawingReview } from "@/components/drawing-review";
import { QuantityTable } from "@/components/quantity-table";
import { calibrationTemplateFileName, quantityRowsToCalibrationTemplate } from "@/lib/calibration-template";
import { resolveCalibrationDifference } from "@/lib/calibration-differences";
import { quantityRowAnchorHref } from "@/lib/quantity-row-anchor";
import {
  buildHealthFixListMarkdown,
  buildQuantityHealthChecks,
  filterAcceptedHealthChecks,
  filterQuantityHealthChecks,
  healthCheckKey,
  healthFixListFileName,
  summarizeQuantityHealthChecks,
  type QuantityHealthCheck,
  type QuantityHealthFilter,
} from "@/lib/quantity-health";
import { confirmQuantityRowsBySpaceNames, updateQuantityRowCurtainWallWidth, updateQuantityRowStatus, updateQuantityRowsStatusBySpaceNames } from "@/lib/quantity-row-status";
import { buildQuoteExcelHtml, quoteExcelFileName } from "@/lib/quote-excel";
import {
  apartmentPendingQuoteMetrics,
  buildQuoteMapping,
  curtainQuoteReadiness,
  DEFAULT_QUOTE_RULES_NAME,
  defaultQuoteRules,
  exportQuoteMappingConfirmationMessages,
  formatCurtainReadinessSpaces,
  integratedCeilingPriceReminderItems,
  parseQuoteRules,
  projectSummaryQuoteItems,
  quoteMappingFileName,
  quoteRulesTemplateFileName,
  type QuoteMapping,
  type QuoteRule,
  updateQuoteRuleUnitPrice,
} from "@/lib/quote-mapping";
import { buildReviewSnapshot, parseReviewSnapshot, reviewSnapshotFileName } from "@/lib/review-snapshot";
import type { CalibrationComparison, CeilingFinishType, CurtainWallWidthSource, DrawingGeometry, QuantityRow, QuantitySummary, ReviewStatus } from "@/lib/types";

const DEFAULT_DOOR_HEIGHT_M = 2.1;
const FULL_WALL_TILE_SPACE_TYPES = new Set(["厨房", "卫生间"]);
const DEFAULT_INTEGRATED_CEILING_SPACE_TYPES = new Set(["厨房", "卫生间"]);

type ApiQuantityRow = {
  floor: string;
  space_name: string;
  space_type: string;
  floor_area_m2: number;
  ceiling_area_m2: number;
  ceiling_finish_type?: CeilingFinishType;
  wall_measure_length_m: number;
  height_m: number;
  window_width_total_m: number;
  windowsill_length_m: number;
  curtain_wall_width_m: number;
  curtain_wall_width_source?: CurtainWallWidthSource;
  window_area_m2: number;
  door_width_total_m: number;
  door_deduct_area_m2: number;
  wall_gross_area_m2: number;
  latex_paint_area_m2: number;
  wall_tile_measure_length_m: number;
  wall_tile_area_m2: number;
  floor_tile_piece_count: number;
  electrical_scope_area_m2: number;
  plumbing_scope_area_m2: number;
  new_wall_length_m: number;
  new_wall_area_m2: number;
  demolition_wall_length_m: number;
  demolition_wall_area_m2: number;
  interior_door_count: number;
  bathroom_door_count: number;
  sliding_door_area_m2: number;
  sliding_door_casing_length_m: number;
  kitchen_base_cabinet_length_m: number;
  kitchen_wall_cabinet_length_m: number;
  custom_cabinet_area_m2: number;
  toilet_count: number;
  bathroom_vanity_count: number;
  waterproof_area_m2: number;
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
    ceilingFinishType: row.ceiling_finish_type ?? defaultCeilingFinishType(row.space_type),
    wallMeasureLengthM: row.wall_measure_length_m,
    heightM: row.height_m,
    windowWidthTotalM: row.window_width_total_m,
    windowsillLengthM: row.windowsill_length_m,
    curtainWallWidthM: row.curtain_wall_width_m,
    curtainWallWidthSource: row.curtain_wall_width_source ?? "not_applicable",
    windowAreaM2: row.window_area_m2,
    doorWidthTotalM: row.door_width_total_m,
    doorDeductAreaM2: row.door_deduct_area_m2,
    wallGrossAreaM2: row.wall_gross_area_m2,
    latexPaintAreaM2: row.latex_paint_area_m2,
    wallTileMeasureLengthM: row.wall_tile_measure_length_m ?? 0,
    wallTileAreaM2: row.wall_tile_area_m2,
    floorTilePieceCount: row.floor_tile_piece_count ?? 0,
    electricalScopeAreaM2: row.electrical_scope_area_m2 ?? 0,
    plumbingScopeAreaM2: row.plumbing_scope_area_m2 ?? 0,
    newWallLengthM: row.new_wall_length_m ?? 0,
    newWallAreaM2: row.new_wall_area_m2 ?? 0,
    demolitionWallLengthM: row.demolition_wall_length_m ?? 0,
    demolitionWallAreaM2: row.demolition_wall_area_m2 ?? 0,
    interiorDoorCount: row.interior_door_count ?? 0,
    bathroomDoorCount: row.bathroom_door_count ?? 0,
    slidingDoorAreaM2: row.sliding_door_area_m2 ?? 0,
    slidingDoorCasingLengthM: row.sliding_door_casing_length_m ?? 0,
    kitchenBaseCabinetLengthM: row.kitchen_base_cabinet_length_m ?? 0,
    kitchenWallCabinetLengthM: row.kitchen_wall_cabinet_length_m ?? 0,
    customCabinetAreaM2: row.custom_cabinet_area_m2 ?? 0,
    toiletCount: row.toilet_count ?? 0,
    bathroomVanityCount: row.bathroom_vanity_count ?? 0,
    waterproofAreaM2: row.waterproof_area_m2,
    evidence: row.evidence,
    anomalies: row.anomalies,
    status: row.status,
  };
}

function defaultCeilingFinishType(spaceType: string): CeilingFinishType {
  return DEFAULT_INTEGRATED_CEILING_SPACE_TYPES.has(spaceType) ? "integrated" : "gypsum";
}

function summarizeRows(rows: QuantityRow[]): QuantitySummary {
  return {
    space_count: rows.length,
    building_area_m2: 0,
    floor_area_total_m2: round2(rows.reduce((sum, row) => sum + row.floorAreaM2, 0)),
    wall_measure_length_total_m: round2(rows.reduce((sum, row) => sum + row.wallMeasureLengthM, 0)),
    window_area_total_m2: round2(rows.reduce((sum, row) => sum + row.windowAreaM2, 0)),
    latex_paint_area_total_m2: round2(rows.reduce((sum, row) => sum + row.latexPaintAreaM2, 0)),
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateWallTileArea(row: QuantityRow, windowAreaM2 = row.windowAreaM2, doorWidthTotalM = row.doorWidthTotalM) {
  if (row.spaceType === "厨房" || row.spaceType === "卫生间") {
    return round2(Math.max(row.wallMeasureLengthM * 2.5 - windowAreaM2 - doorWidthTotalM * DEFAULT_DOOR_HEIGHT_M, 0));
  }
  if (row.wallTileMeasureLengthM > 0) {
    return round2(Math.max(row.wallTileMeasureLengthM * row.heightM, 0));
  }
  return 0;
}

function shouldRecalculateWallTileForOpening(row: QuantityRow) {
  return row.spaceType === "厨房" || row.spaceType === "卫生间";
}

function calculateOpeningAdjustedWallTileArea(row: QuantityRow, windowAreaM2 = row.windowAreaM2, doorWidthTotalM = row.doorWidthTotalM) {
  if (!shouldRecalculateWallTileForOpening(row)) {
    return row.wallTileAreaM2;
  }
  return calculateWallTileArea(row, windowAreaM2, doorWidthTotalM);
}

function calculateLatexPaintArea(spaceType: string, latexPaintBaseAreaM2: number, windowAreaM2: number, doorDeductAreaM2: number, wallTileAreaM2: number) {
  if (FULL_WALL_TILE_SPACE_TYPES.has(spaceType) && wallTileAreaM2 > 0) {
    return 0;
  }
  return round2(Math.max(latexPaintBaseAreaM2 - windowAreaM2 - doorDeductAreaM2 - wallTileAreaM2, 0));
}

function formatLatexPaintEvidence(
  spaceType: string,
  latexPaintBaseAreaM2: number,
  windowAreaM2: number,
  doorDeductAreaM2: number,
  wallTileAreaM2: number,
  latexPaintAreaM2: number,
) {
  if (FULL_WALL_TILE_SPACE_TYPES.has(spaceType) && wallTileAreaM2 > 0) {
    return `厨房/卫生间墙面默认贴砖 ${wallTileAreaM2.toFixed(2)}m2，墙面乳胶漆面积计 0m2`;
  }
  return `墙面乳胶漆面积 ${latexPaintBaseAreaM2.toFixed(2)}m2 - 窗洞 ${windowAreaM2.toFixed(2)}m2 - 已选门洞扣减 ${doorDeductAreaM2.toFixed(2)}m2 - 贴砖墙面 ${wallTileAreaM2.toFixed(2)}m2 = ${latexPaintAreaM2.toFixed(2)}m2`;
}

export function UploadWorkbench({
  initialFileName = "样例数据",
  initialRows,
  initialSummary = null,
}: {
  initialFileName?: string;
  initialRows: QuantityRow[];
  initialSummary?: QuantitySummary | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const calibrationInputRef = useRef<HTMLInputElement>(null);
  const snapshotInputRef = useRef<HTMLInputElement>(null);
  const quoteRulesInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<QuantityRow[]>(initialRows);
  const [currentDxfFile, setCurrentDxfFile] = useState<File | null>(null);
  const [calibrationFileName, setCalibrationFileName] = useState("");
  const [fileName, setFileName] = useState(initialFileName);
  const [isUploading, setIsUploading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drawing, setDrawing] = useState<DrawingGeometry | null>(null);
  const [summary, setSummary] = useState<QuantitySummary | null>(initialSummary);
  const [comparison, setComparison] = useState<CalibrationComparison | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<{ fileName: string; content: string } | null>(null);
  const [generatedSnapshot, setGeneratedSnapshot] = useState<{ fileName: string; content: string } | null>(null);
  const [generatedHealthFixList, setGeneratedHealthFixList] = useState<{ fileName: string; content: string } | null>(null);
  const [generatedQuoteMapping, setGeneratedQuoteMapping] = useState<{ fileName: string; content: string; mapping: QuoteMapping } | null>(null);
  const [quoteRules, setQuoteRules] = useState<QuoteRule[]>(() => defaultQuoteRules());
  const [quoteRulesFileName, setQuoteRulesFileName] = useState(DEFAULT_QUOTE_RULES_NAME);
  const [generatedQuoteRules, setGeneratedQuoteRules] = useState<{ fileName: string; content: string } | null>(null);
  const [healthFilter, setHealthFilter] = useState<QuantityHealthFilter>("all");
  const [acceptedHealthCheckKeys, setAcceptedHealthCheckKeys] = useState<string[]>([]);

  const excludedCount = useMemo(() => rows.filter((row) => row.status === "excluded").length, [rows]);
  const pendingQuoteMetrics = useMemo(() => apartmentPendingQuoteMetrics(), []);
  const curtainReadiness = useMemo(() => curtainQuoteReadiness(rows), [rows]);
  const projectSummaryItems = generatedQuoteMapping ? projectSummaryQuoteItems(generatedQuoteMapping.mapping) : [];
  const integratedCeilingPriceReminderItemsForMapping = generatedQuoteMapping ? integratedCeilingPriceReminderItems(generatedQuoteMapping.mapping) : [];
  const quoteExportRisks = generatedQuoteMapping ? exportQuoteMappingConfirmationMessages(generatedQuoteMapping.mapping) : [];
  const rawHealthChecks = useMemo(
    () => buildQuantityHealthChecks({ rows, summary, quoteMapping: generatedQuoteMapping?.mapping ?? null }),
    [rows, summary, generatedQuoteMapping],
  );
  const healthChecks = useMemo(() => filterAcceptedHealthChecks(rawHealthChecks, acceptedHealthCheckKeys), [rawHealthChecks, acceptedHealthCheckKeys]);
  const healthSummary = useMemo(() => summarizeQuantityHealthChecks(healthChecks), [healthChecks]);
  const filteredHealthChecks = useMemo(() => filterQuantityHealthChecks(healthChecks, healthFilter), [healthChecks, healthFilter]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");
    setComparison(null);
    setCalibrationFileName("");
    setGeneratedTemplate(null);
    setGeneratedSnapshot(null);
    setGeneratedHealthFixList(null);
    setGeneratedQuoteMapping(null);
    setGeneratedQuoteRules(null);
    setAcceptedHealthCheckKeys([]);
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
      setGeneratedQuoteMapping(null);
      setGeneratedHealthFixList(null);
      setAcceptedHealthCheckKeys([]);
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

  async function handleSnapshotChange(event: ChangeEvent<HTMLInputElement>) {
    const snapshotFile = event.target.files?.[0];
    if (!snapshotFile) {
      return;
    }
    try {
      const snapshot = parseReviewSnapshot(await snapshotFile.text());
      setRows(snapshot.rows);
      setSummary(snapshot.summary);
      setComparison(snapshot.comparison);
      setFileName(snapshot.source_file);
      setCalibrationFileName(snapshot.calibration_file ?? "");
      setCurrentDxfFile(null);
      setDrawing(null);
      setGeneratedTemplate(null);
      setGeneratedHealthFixList(null);
      setGeneratedQuoteMapping(null);
      setGeneratedQuoteRules(null);
      setAcceptedHealthCheckKeys(snapshot.accepted_health_check_keys);
      setGeneratedSnapshot({ fileName: snapshotFile.name, content: `${JSON.stringify(snapshot, null, 2)}\n` });
      setError("");
      setMessage(`已恢复校对快照：${snapshotFile.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "快照导入失败");
      setMessage("");
    } finally {
      event.target.value = "";
    }
  }

  function handleDownloadCalibrationTemplate() {
    const content = `${JSON.stringify(quantityRowsToCalibrationTemplate(rows, summary), null, 2)}\n`;
    const downloadName = calibrationTemplateFileName(fileName);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setGeneratedTemplate({ fileName: downloadName, content });
    setMessage(`已生成校准模板：${downloadName}`);
  }

  async function handleCopyCalibrationTemplate() {
    if (!generatedTemplate) {
      return;
    }
    await navigator.clipboard.writeText(generatedTemplate.content);
    setMessage(`已复制校准模板：${generatedTemplate.fileName}`);
  }

  function handleDownloadReviewSnapshot() {
    const downloadName = reviewSnapshotFileName(fileName);
    const content = `${JSON.stringify(buildReviewSnapshot({ fileName, calibrationFileName, rows, acceptedHealthCheckKeys, summary, comparison }), null, 2)}\n`;
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setGeneratedSnapshot({ fileName: downloadName, content });
    setMessage(`已生成校对快照：${downloadName}`);
  }

  async function handleCopyReviewSnapshot() {
    if (!generatedSnapshot) {
      return;
    }
    await navigator.clipboard.writeText(generatedSnapshot.content);
    setMessage(`已复制校对快照：${generatedSnapshot.fileName}`);
  }

  function handleDownloadHealthFixList() {
    const downloadName = healthFixListFileName(fileName);
    const content = buildHealthFixListMarkdown({ fileName, checks: healthChecks, rows });
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setGeneratedHealthFixList({ fileName: downloadName, content });
    setMessage(`已生成 CAD 修图清单：${downloadName}`);
  }

  async function handleCopyHealthFixList() {
    if (!generatedHealthFixList) {
      return;
    }
    await navigator.clipboard.writeText(generatedHealthFixList.content);
    setMessage(`已复制 CAD 修图清单：${generatedHealthFixList.fileName}`);
  }

  function handleDownloadQuoteMapping() {
    const mapping = buildCurrentQuoteMapping();
    if (!mapping) {
      return;
    }
    const quoteHealthSummary = mapping.quantity_health_readiness;
    downloadQuoteMappingJson(mapping, quoteHealthSummary.warning);
  }

  function buildCurrentQuoteMapping() {
    const baseMapping = buildQuoteMapping(rows, quoteRules, summary ?? undefined);
    const quoteHealthChecks = filterAcceptedHealthChecks(buildQuantityHealthChecks({ rows, summary, quoteMapping: baseMapping }), acceptedHealthCheckKeys);
    const quoteHealthSummary = summarizeQuantityHealthChecks(quoteHealthChecks);
    const mapping = buildQuoteMapping(rows, quoteRules, summary ?? undefined, quoteHealthSummary);
    const confirmationMessages = exportQuoteMappingConfirmationMessages(mapping);
    if (confirmationMessages.length > 0) {
      const confirmed = window.confirm(`当前报价映射仍有待确认风险，将作为草稿报价导出：\n\n${confirmationMessages.join("\n")}\n\n是否继续导出？`);
      if (!confirmed) {
        setMessage("已取消导出草稿报价，请先处理风险项或接受对应健康检查。");
        return null;
      }
    }
    return mapping;
  }

  function downloadQuoteMappingJson(mapping: QuoteMapping, warningCount: number) {
    const downloadName = quoteMappingFileName(fileName);
    const content = `${JSON.stringify(mapping, null, 2)}\n`;
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setGeneratedQuoteMapping({ fileName: downloadName, content, mapping });
    setMessage(
      warningCount > 0
        ? `已生成报价映射：${downloadName}；当前还有 ${warningCount} 项需优先处理，建议先导出修图清单或修图后复核。`
        : `已生成报价映射：${downloadName}`,
    );
  }

  async function handleCopyQuoteMapping() {
    if (!generatedQuoteMapping) {
      return;
    }
    await navigator.clipboard.writeText(generatedQuoteMapping.content);
    setMessage(`已复制报价映射：${generatedQuoteMapping.fileName}`);
  }

  function handleDownloadQuoteExcel(mapping: QuoteMapping) {
    const downloadName = quoteExcelFileName(fileName);
    const content = buildQuoteExcelHtml(mapping, fileName);
    const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(`已生成 Excel 报价草稿：${downloadName}`);
  }

  function handleDownloadQuoteExcelDraft() {
    const mapping = buildCurrentQuoteMapping();
    if (!mapping) {
      return;
    }
    const downloadName = quoteMappingFileName(fileName);
    const content = `${JSON.stringify(mapping, null, 2)}\n`;
    setGeneratedQuoteMapping({ fileName: downloadName, content, mapping });
    handleDownloadQuoteExcel(mapping);
  }

  function handleDownloadQuoteRulesTemplate() {
    const downloadName = quoteRulesTemplateFileName(fileName);
    const content = `${JSON.stringify(quoteRules, null, 2)}\n`;
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setGeneratedQuoteRules({ fileName: downloadName, content });
    setMessage(`已生成报价规则模板：${downloadName}`);
  }

  async function handleCopyQuoteRulesTemplate() {
    if (!generatedQuoteRules) {
      return;
    }
    await navigator.clipboard.writeText(generatedQuoteRules.content);
    setMessage(`已复制报价规则模板：${generatedQuoteRules.fileName}`);
  }

  async function handleQuoteRulesChange(event: ChangeEvent<HTMLInputElement>) {
    const rulesFile = event.target.files?.[0];
    if (!rulesFile) {
      return;
    }
    try {
      const parsedRules = parseQuoteRules(await rulesFile.text());
      setQuoteRules(parsedRules);
      setQuoteRulesFileName(rulesFile.name);
      setGeneratedQuoteMapping(null);
      setGeneratedHealthFixList(null);
      setGeneratedQuoteRules({ fileName: rulesFile.name, content: `${JSON.stringify(parsedRules, null, 2)}\n` });
      setError("");
      setMessage(`已导入报价规则：${rulesFile.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "报价规则导入失败");
      setMessage("");
    } finally {
      event.target.value = "";
    }
  }

  function handleChangeQuoteRuleUnitPrice(index: number, value: string) {
    if (!value.trim()) {
      return;
    }
    const unitPrice = Number(value);
    try {
      setQuoteRules((current) => updateQuoteRuleUnitPrice(current, index, unitPrice));
      setQuoteRulesFileName((current) => (current.endsWith("（已编辑）") ? current : `${current}（已编辑）`));
      setGeneratedQuoteMapping(null);
      setGeneratedHealthFixList(null);
      setGeneratedQuoteRules(null);
      setError("");
      setMessage("报价规则单价已更新，重新导出报价映射后生效");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "报价规则单价更新失败");
      setMessage("");
    }
  }

  function handleChangeStatus(spaceName: string, status: ReviewStatus) {
    setRows((current) => updateQuantityRowStatus(current, spaceName, status));
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(`${spaceName} 状态已更新为 ${statusLabels[status]}`);
  }

  function handleMarkHealthCheckNeedsFix(spaceNames: string[]) {
    if (spaceNames.length === 0) {
      return;
    }
    setRows((current) => updateQuantityRowsStatusBySpaceNames(current, spaceNames, "needs_fix"));
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(`${spaceNames.join("、")} 已标记为需修图`);
  }

  function handleAcceptHealthCheck(check: QuantityHealthCheck) {
    const key = healthCheckKey(check);
    setAcceptedHealthCheckKeys((current) => (current.includes(key) ? current : [...current, key]));
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(`${check.title} 已接受`);
  }

  function handleRestoreAcceptedHealthChecks() {
    setAcceptedHealthCheckKeys([]);
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage("已恢复显示全部健康检查项");
  }

  function handleConfirmHealthCheckSpaces(check: QuantityHealthCheck) {
    if (!check.spaceNames?.length) {
      return;
    }
    setRows((current) => confirmQuantityRowsBySpaceNames(current, check.spaceNames ?? []));
    setAcceptedHealthCheckKeys((current) => {
      const key = healthCheckKey(check);
      return current.includes(key) ? current : [...current, key];
    });
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(`${check.spaceNames.join("、")} 已标记为已确认，${check.title} 已接受`);
  }

  function handleChangeCurtainWallWidth(spaceName: string, widthM: number, source: "manual" | "calibration" = "manual") {
    if (!Number.isFinite(widthM)) {
      return;
    }
    setRows((current) => updateQuantityRowCurtainWallWidth(current, spaceName, widthM));
    if (source === "calibration") {
      setComparison((current) => (current ? resolveCalibrationDifference(current, spaceName, "curtain_wall_width_m") : current));
    }
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(source === "calibration" ? `${spaceName} 窗帘墙宽候选已应用校准值` : `${spaceName} 窗帘墙宽候选已更新`);
  }

  function handleChangeCeilingFinishType(spaceName: string, finishType: CeilingFinishType) {
    setRows((current) => current.map((row) => (row.spaceName === spaceName ? { ...row, ceilingFinishType: finishType } : row)));
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(`${spaceName} 顶面类型已更新为 ${finishType === "integrated" ? "集成吊顶" : "石膏板吊顶"}`);
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
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
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
      const latexPaintBaseAreaM2 = round2((row.wallMeasureLengthM + row.doorWidthTotalM) * row.heightM);
      const wallTileAreaM2 = calculateOpeningAdjustedWallTileArea(row, row.windowAreaM2, row.doorWidthTotalM);
      const latexPaintAreaM2 = calculateLatexPaintArea(row.spaceType, latexPaintBaseAreaM2, row.windowAreaM2, doorDeductAreaM2, wallTileAreaM2);
      const latexPaintEvidence = formatLatexPaintEvidence(row.spaceType, latexPaintBaseAreaM2, row.windowAreaM2, doorDeductAreaM2, wallTileAreaM2, latexPaintAreaM2);
      return {
        ...row,
        doorDeductAreaM2,
        latexPaintAreaM2,
        wallTileAreaM2,
        evidence: `墙面展开面积 ${row.wallMeasureLengthM.toFixed(2)}m * ${row.heightM.toFixed(2)}m = ${row.wallGrossAreaM2.toFixed(2)}m2；墙面乳胶漆基数 ${row.wallMeasureLengthM.toFixed(2)}m + 门洞 ${row.doorWidthTotalM.toFixed(2)}m = ${latexPaintBaseAreaM2.toFixed(2)}m2；${latexPaintEvidence}；门洞扣减已人工调整。`,
      };
    });

    setRows(nextRows);
    setSummary(summarizeRows(nextRows));
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
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
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
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
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
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
      const latexPaintBaseAreaM2 = round2((row.wallMeasureLengthM + row.doorWidthTotalM) * row.heightM);
      const wallTileAreaM2 = calculateOpeningAdjustedWallTileArea(row, windowAreaM2);
      const latexPaintAreaM2 = calculateLatexPaintArea(row.spaceType, latexPaintBaseAreaM2, windowAreaM2, row.doorDeductAreaM2, wallTileAreaM2);
      const latexPaintEvidence = formatLatexPaintEvidence(row.spaceType, latexPaintBaseAreaM2, windowAreaM2, row.doorDeductAreaM2, wallTileAreaM2, latexPaintAreaM2);
      return {
        ...row,
        windowAreaM2,
        latexPaintAreaM2,
        wallTileAreaM2,
        evidence: `墙面展开面积 ${row.wallMeasureLengthM.toFixed(2)}m * ${row.heightM.toFixed(2)}m = ${row.wallGrossAreaM2.toFixed(2)}m2；墙面乳胶漆基数 ${row.wallMeasureLengthM.toFixed(2)}m + 门洞 ${row.doorWidthTotalM.toFixed(2)}m = ${latexPaintBaseAreaM2.toFixed(2)}m2；${latexPaintEvidence}；${note}`,
      };
    });
  }

  return (
    <main>
      <input ref={inputRef} hidden className="fileInput" type="file" accept=".dxf" onChange={handleFileChange} />
      <input ref={calibrationInputRef} hidden className="fileInput" type="file" accept=".json,application/json" onChange={handleCalibrationChange} />
      <input ref={snapshotInputRef} hidden className="fileInput" type="file" accept=".json,application/json" onChange={handleSnapshotChange} />
      <input ref={quoteRulesInputRef} hidden className="fileInput" type="file" accept=".json,application/json" onChange={handleQuoteRulesChange} />
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
          <button type="button" disabled={rows.length === 0 || isUploading || isComparing} onClick={handleDownloadCalibrationTemplate}>
            <Download aria-hidden="true" size={18} />
            下载校准模板
          </button>
          <button type="button" disabled={rows.length === 0 || isUploading || isComparing} onClick={handleDownloadReviewSnapshot}>
            <Download aria-hidden="true" size={18} />
            导出校对快照
          </button>
          <button type="button" disabled={rows.length === 0 || isUploading || isComparing} onClick={handleDownloadQuoteMapping}>
            <ReceiptText aria-hidden="true" size={18} />
            导出报价映射
          </button>
          <button type="button" disabled={rows.length === 0 || isUploading || isComparing} onClick={handleDownloadQuoteExcelDraft}>
            <Download aria-hidden="true" size={18} />
            导出 Excel 草稿
          </button>
          <button type="button" disabled={isUploading || isComparing} onClick={handleDownloadQuoteRulesTemplate}>
            <Download aria-hidden="true" size={18} />
            下载报价规则
          </button>
          <button type="button" disabled={isUploading || isComparing} onClick={() => quoteRulesInputRef.current?.click()}>
            <FileUp aria-hidden="true" size={18} />
            导入报价规则
          </button>
          <button type="button" disabled={isUploading || isComparing} onClick={() => snapshotInputRef.current?.click()}>
            <FileUp aria-hidden="true" size={18} />
            导入校对快照
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
            <label>默认窗高<input defaultValue="1.80 m" /></label>
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
          <small className="infoText">报价规则：{quoteRulesFileName}（{quoteRules.length} 项）</small>
          <small className="infoText">
            {pendingQuoteMetrics.length > 0 ? `待补取数口径：${pendingQuoteMetrics.length} 项不参与当前金额` : "待补取数口径：已全部接入当前规则"}
          </small>
        </div>
      </section>

      <section className="quoteRulesPanel">
        <div className="templateHeader">
          <div>
            <strong>报价规则单价</strong>
            <span>{quoteRulesFileName}</span>
          </div>
        </div>
        <div className="quoteRulesTable">
          <table>
            <thead>
              <tr>
                <th>清单项</th>
                <th>取数指标</th>
                <th>适用空间</th>
                <th>单位</th>
                <th>单价</th>
              </tr>
            </thead>
            <tbody>
              {quoteRules.map((rule, index) => (
                <tr key={`${rule.item_name}-${rule.metric}-${index}`}>
                  <td>{rule.item_name}</td>
                  <td><code>{rule.metric}</code></td>
                  <td>{rule.space_types?.join("、") ?? "全部"}</td>
                  <td>{rule.unit}</td>
                  <td>
                    <input
                      aria-label={`${rule.item_name} 单价`}
                      min="0"
                      step="0.01"
                      type="number"
                      value={rule.unit_price}
                      onChange={(event) => handleChangeQuoteRuleUnitPrice(index, event.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="healthPanel">
        <div className="templateHeader">
          <div>
            <strong>算量健康检查</strong>
            <span>{healthSummary.label}</span>
          </div>
          <button type="button" disabled={healthChecks.length === 0} onClick={handleDownloadHealthFixList}>
            <Download aria-hidden="true" size={18} />
            导出修图清单
          </button>
        </div>
        {acceptedHealthCheckKeys.length > 0 && (
          <p>
            已接受 {acceptedHealthCheckKeys.length} 项检查，不再进入当前健康提示、修图清单和报价风险摘要。
            <button type="button" onClick={handleRestoreAcceptedHealthChecks}>恢复已接受</button>
          </p>
        )}
        <div className="healthFilter" role="group" aria-label="健康检查筛选">
          {healthFilterOptions.map((option) => (
            <button
              type="button"
              className={healthFilter === option.value ? "active" : ""}
              onClick={() => setHealthFilter(option.value)}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        {healthChecks.length > 0 ? (
          <div className="healthList">
            {filteredHealthChecks.map((check) => (
              <div className={`healthCard ${check.severity}`} key={check.id}>
                <strong>{check.title}</strong>
                <span>{check.detail}</span>
                {check.spaceNames && (
                  <div>
                    {check.spaceNames.map((spaceName, index) => (
                      <a href={quantityRowAnchorHref(spaceName)} key={`${spaceName}-${index}`}>{spaceName}</a>
                    ))}
                    <button type="button" onClick={() => handleMarkHealthCheckNeedsFix(check.spaceNames ?? [])}>
                      标记需修图
                    </button>
                    <button type="button" onClick={() => handleConfirmHealthCheckSpaces(check)}>
                      标记已确认
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => handleAcceptHealthCheck(check)}>
                  接受此项
                </button>
              </div>
            ))}
            {filteredHealthChecks.length === 0 && <p>当前筛选下暂无检查项。</p>}
          </div>
        ) : (
          <p>空间类型、建筑面积、窗帘确认和报价规则缺失项目前看起来正常。</p>
        )}
      </section>

      {generatedHealthFixList && (
        <section className="templatePanel">
          <div className="templateHeader">
            <div>
              <strong>CAD 修图清单已生成</strong>
              <span>{generatedHealthFixList.fileName}</span>
            </div>
            <button type="button" onClick={handleCopyHealthFixList}>
              复制 Markdown
            </button>
          </div>
          <textarea readOnly value={generatedHealthFixList.content} aria-label="CAD 修图清单 Markdown" />
        </section>
      )}

      {generatedTemplate && (
        <section className="templatePanel">
          <div className="templateHeader">
            <div>
              <strong>校准模板已生成</strong>
              <span>{generatedTemplate.fileName}</span>
            </div>
            <button type="button" onClick={handleCopyCalibrationTemplate}>
              复制 JSON
            </button>
          </div>
          <textarea readOnly value={generatedTemplate.content} aria-label="校准模板 JSON" />
        </section>
      )}

      {generatedSnapshot && (
        <section className="templatePanel">
          <div className="templateHeader">
            <div>
              <strong>校对快照已生成</strong>
              <span>{generatedSnapshot.fileName}</span>
            </div>
            <button type="button" onClick={handleCopyReviewSnapshot}>
              复制 JSON
            </button>
          </div>
          <textarea readOnly value={generatedSnapshot.content} aria-label="校对快照 JSON" />
        </section>
      )}

      {generatedQuoteRules && (
        <section className="templatePanel">
          <div className="templateHeader">
            <div>
              <strong>报价规则模板</strong>
              <span>{generatedQuoteRules.fileName}</span>
            </div>
            <button type="button" onClick={handleCopyQuoteRulesTemplate}>
              复制 JSON
            </button>
          </div>
          <textarea readOnly value={generatedQuoteRules.content} aria-label="报价规则 JSON" />
        </section>
      )}

      {generatedQuoteMapping && (
        <section className="quotePanel">
          <div className="templateHeader">
            <div>
              <strong>报价映射已生成</strong>
              <span>{generatedQuoteMapping.fileName}</span>
            </div>
            <button type="button" onClick={handleCopyQuoteMapping}>
              复制 JSON
            </button>
            <button type="button" onClick={() => handleDownloadQuoteExcel(generatedQuoteMapping.mapping)}>
              <Download aria-hidden="true" size={18} />
              下载 Excel 草稿
            </button>
          </div>
          <div className="quoteSummary">
            <div>
              <span>计价空间</span>
              <strong>{generatedQuoteMapping.mapping.summary.space_count}</strong>
            </div>
            <div>
              <span>建筑面积</span>
              <strong>{generatedQuoteMapping.mapping.summary.building_area_m2.toFixed(2)}</strong>
            </div>
            <div>
              <span>清单项</span>
              <strong>{generatedQuoteMapping.mapping.summary.item_count}</strong>
            </div>
            <div>
              <span>估算合计</span>
              <strong>{generatedQuoteMapping.mapping.summary.total_amount.toFixed(2)}</strong>
            </div>
          </div>
          <div className="quoteGaps">
            {quoteExportRisks.length > 0 && (
              <div className="quoteExportRiskDetails">
                <strong>导出前风险明细</strong>
                <ul>
                  {quoteExportRisks.map((risk, index) => (
                    <li key={`${risk}-${index}`}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
            {generatedQuoteMapping.mapping.quantity_health_readiness.warning > 0 && (
              <div className="quoteRisk">
                <strong>报价前仍有风险</strong>
                <span>
                  {generatedQuoteMapping.mapping.quantity_health_readiness.label}；本次报价映射已生成，正式报价前建议先处理 warning 并重新导出。
                </span>
              </div>
            )}
            {integratedCeilingPriceReminderItemsForMapping.length > 0 && (
              <div className="quoteReminder">
                <strong>集成吊顶单价待补</strong>
                <span>
                  当前已有 {integratedCeilingPriceReminderItemsForMapping.length} 个空间生成集成吊顶工程量，但金额为 0；请在报价规则 JSON 中补 unit_price。若实际做石膏板吊顶，请在工程量表切换顶面类型。
                </span>
              </div>
            )}
            {projectSummaryItems.length > 0 && (
              <div className="projectSummaryItems">
                <strong>全屋汇总项</strong>
                <div>
                  {projectSummaryItems.map((item, index) => (
                    <span key={`${item.space_name}-${item.item_name}-${index}`}>
                      {item.item_name} {item.quantity.toFixed(2)} {item.unit} / {item.amount.toFixed(2)} 元
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <strong>待补取数口径</strong>
              <span>{pendingQuoteMetrics.length > 0 ? `${pendingQuoteMetrics.length} 项暂不参与金额汇总，后续补齐 metric 后再接入。` : "当前默认规则已无待补取数口径。"}</span>
            </div>
            <div className="curtainReadiness">
              <strong>窗帘/窗帘箱可报价候选 {curtainReadiness.ready_count} 个空间</strong>
              <span>已按自动候选或人工校准值进入暗窗帘箱金额汇总，报价员仍可在工程量表中调整。</span>
            </div>
            {generatedQuoteMapping.mapping.building_area_quote_readiness.missing_item_names.length > 0 && (
              <div className="curtainReadiness">
                <strong>建筑面积未就绪</strong>
                <span>
                  {generatedQuoteMapping.mapping.building_area_quote_readiness.missing_item_names.join("、")} 需要 `QUOTE_EXT_WALL` 建筑面积，当前为 0，未进入金额汇总。
                </span>
              </div>
            )}
            <div className="curtainReadinessDetails">
              <span>可候选：{formatCurtainReadinessSpaces(curtainReadiness.ready_space_names)}</span>
              <span>不适用或未识别：{rows.length - curtainReadiness.ready_count} 个空间</span>
              <span>已导出报价候选：{generatedQuoteMapping.mapping.curtain_quote_candidates.length} 项</span>
            </div>
            {pendingQuoteMetrics.length > 0 && (
              <ul>
                {pendingQuoteMetrics.slice(0, 10).map((item) => (
                  <li key={`${item.source_group}-${item.item_name}`}>
                    <span>{item.source_group}</span>
                    <strong>{item.item_name}</strong>
                    <code>{item.suggested_metric}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="quotePreview">
            <table>
              <thead>
                <tr>
                  <th>空间</th>
                  <th>类型</th>
                  <th>清单项</th>
                  <th>工程量</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                {generatedQuoteMapping.mapping.items.slice(0, 8).map((item, index) => (
                  <tr key={`${item.space_name}-${item.item_name}-${index}`}>
                    <td>{item.space_name}</td>
                    <td>{item.space_type}</td>
                    <td>{item.item_name}</td>
                    <td>
                      {item.quantity.toFixed(2)} {item.unit}
                    </td>
                    <td>{item.unit_price.toFixed(2)}</td>
                    <td>{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <textarea readOnly value={generatedQuoteMapping.content} aria-label="报价映射 JSON" />
        </section>
      )}

      {comparison && (
        <section className={`calibrationPanel ${comparison.passed ? "passed" : "failed"}`}>
          <div className="calibrationSummary">
            <strong>{comparison.passed ? "校准通过" : "校准存在差异"}</strong>
            <span>匹配 {comparison.matched_count} 个空间，差异空间 {comparison.failed_count} 个，项目级差异 {comparison.summary_differences?.length ?? 0} 项</span>
            {(comparison.missing_spaces.length > 0 || comparison.unexpected_spaces.length > 0) && (
              <span>
                缺失 {comparison.missing_spaces.length} 个，多余 {comparison.unexpected_spaces.length} 个
              </span>
            )}
          </div>
          {((comparison.summary_differences?.length ?? 0) > 0 || comparison.differences.length > 0) && (
            <div className="calibrationDifferences">
              {comparison.summary_differences?.map((difference) => (
                <div className="summaryDifferenceCard" key={`summary-${difference.field}`}>
                  <strong>项目汇总</strong>
                  <span>{difference.field}</span>
                  <code>
                    {difference.actual} / {difference.expected} ({difference.delta > 0 ? "+" : ""}
                    {difference.delta}, {difference.percent_delta}%)
                  </code>
                </div>
              ))}
              {comparison.differences.slice(0, 12).map((difference, index) => (
                <a href={quantityRowAnchorHref(difference.space_name)} key={`${difference.space_name}-${difference.field}-${index}`}>
                  <strong>{difference.space_name}</strong>
                  <span>{difference.field}</span>
                  <code>
                    {difference.actual} / {difference.expected} ({difference.delta > 0 ? "+" : ""}
                    {difference.delta}, {difference.percent_delta}%)
                  </code>
                </a>
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
        <QuantityTable rows={rows} differences={comparison?.differences ?? []} onChangeStatus={handleChangeStatus} onChangeCurtainWallWidth={handleChangeCurtainWallWidth} onChangeCeilingFinishType={handleChangeCeilingFinishType} />
      </section>
    </main>
  );
}

const layers = ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_EXT_WALL", "QUOTE_WALL_TILE", "QUOTE_NEW_WALL", "QUOTE_DEMO_WALL", "QUOTE_BASE_CABINET", "QUOTE_WALL_CABINET", "QUOTE_CUSTOM", "QUOTE_TOILET", "QUOTE_BATHROOM_VANITY", "QUOTE_WINDOW", "QUOTE_DOOR", "QUOTE_FLOOR", "QUOTE_HEIGHT"];

const statusLabels: Record<ReviewStatus, string> = {
  pending_review: "待确认",
  confirmed: "已确认",
  needs_fix: "需修图",
  excluded: "不计价",
};

const healthFilterOptions: { value: QuantityHealthFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "warning", label: "需优先处理" },
  { value: "info", label: "提醒" },
];
