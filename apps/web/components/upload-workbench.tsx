"use client";

import { ChangeEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileUp, Layers3, Loader2, ReceiptText, Settings2 } from "lucide-react";
import { DrawingReview } from "@/components/drawing-review";
import { HydropowerReviewPanel } from "@/components/hydropower-review-panel";
import { QuantityTable } from "@/components/quantity-table";
import { calibrationTemplateFileName, quantityRowsToCalibrationTemplate } from "@/lib/calibration-template";
import { resolveCalibrationDifference } from "@/lib/calibration-differences";
import { buildHydropowerEstimate } from "@/lib/hydropower-estimate";
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
import { confirmQuantityRowsBySpaceNames, updateQuantityRowCurtainWallWidth, updateQuantityRowSpaceType, updateQuantityRowStatus, updateQuantityRowsStatusBySpaceNames } from "@/lib/quantity-row-status";
import { buildQuoteExcelHtml, quoteExcelFileName, type QuoteExcelManualItemQuantities } from "@/lib/quote-excel";
import {
  aluminumWindowSuggestedAreaFromRows,
  bathroomChoiceKey,
  bathroomManualChoicesFromQuantities,
  bathroomRowsFromRows,
  type BathroomManualChoice,
  manualQuoteInputsFromQuantities,
  manualQuoteInputsFromBathroomChoices,
  manualQuoteQuantitiesFromInputs,
} from "@/lib/manual-quote-options";
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
  QUOTE_PACKAGE_DEFINITIONS,
  quoteMappingFileName,
  quoteRulesTemplateFileName,
  type QuoteMapping,
  type QuoteMode,
  type QuotePackageId,
  type QuoteRule,
  updateQuoteRulePricePart,
  withDefaultQuoteRuleCoverage,
} from "@/lib/quote-mapping";
import { shouldResetSavedQuoteRules } from "@/lib/quote-rule-storage";
import { buildReviewSnapshot, parseReviewSnapshot, reviewSnapshotFileName } from "@/lib/review-snapshot";
import { buildSpaceNamingGuideMarkdown, spaceNamingGuideFileName } from "@/lib/space-naming-guide";
import type { CalibrationComparison, CeilingFinishType, CurtainWallWidthSource, DrawingGeometry, HydropowerEstimate, QuantityRow, QuantitySummary, ReviewStatus } from "@/lib/types";

const DEFAULT_DOOR_HEIGHT_M = 2.1;
const FULL_WALL_TILE_SPACE_TYPES = new Set(["厨房", "卫生间"]);
const DEFAULT_INTEGRATED_CEILING_SPACE_TYPES = new Set(["厨房", "卫生间"]);
const QUOTE_RULES_STORAGE_KEY = "cad-budget-program.quote-rules.v2";
const DEFAULT_QUOTE_RULES_STORAGE_VERSION = 8;
const QUOTE_RULE_GROUPS_STORAGE_KEY = "cad-budget-program.quote-rule-groups.v1";
const ALUMINUM_WINDOW_ITEM_NAME = "铝合金封门窗";
const MANUAL_QUOTE_OPTION_ITEMS = [{ itemName: ALUMINUM_WINDOW_ITEM_NAME, unit: "M2", hint: "按窗户实际面积，默认不计价" }];
const QUOTE_MODE_OPTIONS: { value: QuoteMode; label: string; hint: string }[] = [
  { value: "hard", label: "硬装（半包）", hint: "只输出施工和硬装基础项" },
  { value: "full", label: "整装（全包）", hint: "输出全部已接入报价项" },
  { value: "hard_plus", label: "硬装 + 自选增项", hint: "半包基础上叠加选中的整装包" },
];
const quoteRuleGroups = [
  {
    title: "墙顶地/湿区",
    itemNames: new Set([
      "墙面界面剂处理",
      "墙面批嵌",
      "墙面乳胶漆",
      "轻钢龙骨平顶",
      "双眼皮/边吊吊顶",
      "石膏线吊顶",
      "顶面批嵌",
      "顶面乳胶漆",
      "厨房卫生间集成吊顶",
      "地面找平",
      "地面砖铺贴(750X1500)",
      "地面瓷砖",
      "墙面瓷砖",
      "瓷砖加工费",
      "美缝",
      "墙面贴瓷砖(600X1200)",
      "墙地面防漏处理",
    ]),
  },
  {
    title: "全屋拆改/其他工程",
    itemNames: new Set([
      "砌砖墙",
      "砌120厚砖墙",
      "砌240厚砖墙",
      "现浇钢筋混凝土楼板",
      "拆改及拆墙",
      "外墙批嵌以及修补",
      "砖墙门窗洞过梁",
      "水泥墙开槽",
      "打混凝土过梁孔",
      "厨房、卫生间排污管包隔音棉",
      "补线、管槽及零星修补",
    ]),
  },
  {
    title: "水电/项目服务",
    itemNames: new Set([
      "强电插座",
      "开关",
      "灯位",
      "筒灯/射灯",
      "设备专线",
      "弱电点位",
      "强电线管",
      "弱电线管",
      "强电箱",
      "弱电箱",
      "分配电箱",
      "给水点",
      "热水点",
      "排水点",
      "给水管",
      "排水管",
      "强电布线",
      "弱电布线",
      "水路布管",
      "材料搬运费",
      "垃圾清运费",
      "墙地面现场保护",
      "全屋保洁",
    ]),
  },
  {
    title: "门窗/定制",
    itemNames: new Set([
      "背景墙",
      "入户门",
      "室内门",
      "卫生间门",
      "厨房推拉门",
      "厨房推拉门双包套",
      "阳台推拉门",
      "阳台推拉门双包套",
      "铝合金封门窗",
      "橱柜",
      "全屋定制",
    ]),
  },
  {
    title: "洁具/灯饰",
    itemNames: new Set(["马桶", "蹲坑", "浴室柜", "淋浴隔断", "玻璃淋浴房", "花洒", "卫浴五件套", "全屋插座开关", "全屋灯饰"]),
  },
  {
    title: "窗帘/收口",
    itemNames: new Set(["窗帘", "窗台石", "暗窗帘箱"]),
  },
];

const QUOTE_INTEGRATION_STATUS_GROUPS = [
  {
    title: "已自动取数",
    items: [
      "墙顶地面、墙砖/地砖、防水",
      "强弱电、水路、搬运、清运、成品保护",
      "砌墙/拆墙/现浇楼板/开槽/过梁孔/管槽修补",
      "门类、推拉门、橱柜、全屋定制、洁具、灯饰、窗帘",
    ],
  },
  {
    title: "自动取数，需复核",
    items: ["建筑面积、窗洞/推拉门扣减、窗帘墙宽、厨卫集成吊顶、入户门和卫生间门归属"],
  },
  {
    title: "固定占位/设计师手填",
    items: ["铝合金封门窗、蹲坑/马桶二选一、淋浴隔断/玻璃淋浴房二选一、砖墙门窗洞过梁"],
  },
  {
    title: "暂不接入",
    items: ["当前默认规则已无待补取数口径；后续新增模板项先进入手填或待补清单。"],
  },
];

type ApiQuantityRow = {
  floor: string;
  space_name: string;
  space_type: string;
  gross_floor_area_m2?: number;
  floor_area_m2: number;
  ceiling_area_m2: number;
  gypsum_flat_ceiling_area_m2?: number;
  edge_ceiling_area_m2?: number;
  edge_ceiling_length_m?: number;
  gypsum_line_ceiling_area_m2?: number;
  gypsum_line_ceiling_length_m?: number;
  no_ceiling_area_m2?: number;
  void_area_m2?: number;
  ceiling_finish_type?: CeilingFinishType;
  wall_measure_length_m: number;
  height_m: number;
  window_width_total_m: number;
  windowsill_length_m: number;
  curtain_wall_width_m: number;
  curtain_wall_width_source?: CurtainWallWidthSource;
  atrium_curtain_width_m?: number;
  atrium_curtain_height_m?: number;
  atrium_curtain_area_m2?: number;
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
  new_wall_unclassified_area_m2?: number;
  new_wall_120_area_m2?: number;
  new_wall_240_area_m2?: number;
  demolition_wall_length_m: number;
  demolition_wall_area_m2: number;
  background_wall_area_m2?: number;
  cast_slab_area_m2?: number;
  entry_door_count?: number;
  interior_door_count: number;
  bathroom_door_count: number;
  sliding_door_area_m2: number;
  sliding_door_casing_length_m: number;
  kitchen_base_cabinet_length_m: number;
  kitchen_wall_cabinet_length_m: number;
  custom_cabinet_area_m2: number;
  toilet_count: number;
  bathroom_vanity_count: number;
  stair_railing_length_m?: number;
  guardrail_length_m?: number;
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
    grossFloorAreaM2: row.gross_floor_area_m2 ?? row.floor_area_m2,
    floorAreaM2: row.floor_area_m2,
    ceilingAreaM2: row.ceiling_area_m2,
    gypsumFlatCeilingAreaM2: row.gypsum_flat_ceiling_area_m2 ?? row.ceiling_area_m2,
    edgeCeilingAreaM2: row.edge_ceiling_area_m2 ?? 0,
    edgeCeilingLengthM: row.edge_ceiling_length_m ?? 0,
    gypsumLineCeilingAreaM2: row.gypsum_line_ceiling_area_m2 ?? 0,
    gypsumLineCeilingLengthM: row.gypsum_line_ceiling_length_m ?? 0,
    noCeilingAreaM2: row.no_ceiling_area_m2 ?? 0,
    voidAreaM2: row.void_area_m2 ?? 0,
    ceilingFinishType: row.ceiling_finish_type ?? defaultCeilingFinishType(row.space_type),
    wallMeasureLengthM: row.wall_measure_length_m,
    heightM: row.height_m,
    windowWidthTotalM: row.window_width_total_m,
    windowsillLengthM: row.windowsill_length_m,
    curtainWallWidthM: row.curtain_wall_width_m,
    curtainWallWidthSource: row.curtain_wall_width_source ?? "not_applicable",
    atriumCurtainWidthM: row.atrium_curtain_width_m ?? 0,
    atriumCurtainHeightM: row.atrium_curtain_height_m ?? 0,
    atriumCurtainAreaM2: row.atrium_curtain_area_m2 ?? 0,
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
    newWallUnclassifiedAreaM2: row.new_wall_unclassified_area_m2 ?? row.new_wall_area_m2 ?? 0,
    newWall120AreaM2: row.new_wall_120_area_m2 ?? 0,
    newWall240AreaM2: row.new_wall_240_area_m2 ?? 0,
    demolitionWallLengthM: row.demolition_wall_length_m ?? 0,
    demolitionWallAreaM2: row.demolition_wall_area_m2 ?? 0,
    backgroundWallAreaM2: row.background_wall_area_m2 ?? 0,
    castSlabAreaM2: row.cast_slab_area_m2 ?? 0,
    entryDoorCount: row.entry_door_count ?? 0,
    interiorDoorCount: row.interior_door_count ?? 0,
    bathroomDoorCount: row.bathroom_door_count ?? 0,
    slidingDoorAreaM2: row.sliding_door_area_m2 ?? 0,
    slidingDoorCasingLengthM: row.sliding_door_casing_length_m ?? 0,
    kitchenBaseCabinetLengthM: row.kitchen_base_cabinet_length_m ?? 0,
    kitchenWallCabinetLengthM: row.kitchen_wall_cabinet_length_m ?? 0,
    customCabinetAreaM2: row.custom_cabinet_area_m2 ?? 0,
    toiletCount: row.toilet_count ?? 0,
    bathroomVanityCount: row.bathroom_vanity_count ?? 0,
    stairRailingLengthM: row.stair_railing_length_m ?? 0,
    guardrailLengthM: row.guardrail_length_m ?? 0,
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
  const [quoteRulesStorageReady, setQuoteRulesStorageReady] = useState(false);
  const [quoteRuleSearch, setQuoteRuleSearch] = useState("");
  const [generatedQuoteRules, setGeneratedQuoteRules] = useState<{ fileName: string; content: string } | null>(null);
  const [collapsedQuoteRuleGroups, setCollapsedQuoteRuleGroups] = useState<string[]>([]);
  const [healthFilter, setHealthFilter] = useState<QuantityHealthFilter>("all");
  const [acceptedHealthCheckKeys, setAcceptedHealthCheckKeys] = useState<string[]>([]);
  const [manualQuoteItemInputs, setManualQuoteItemInputs] = useState<Record<string, string>>({});
  const [bathroomManualChoices, setBathroomManualChoices] = useState<Record<string, BathroomManualChoice>>({});
  const [hydropowerOverride, setHydropowerOverride] = useState<HydropowerEstimate | null>(null);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>("full");
  const [selectedQuotePackageIds, setSelectedQuotePackageIds] = useState<QuotePackageId[]>([]);

  const excludedCount = useMemo(() => rows.filter((row) => row.status === "excluded").length, [rows]);
  const pendingQuoteMetrics = useMemo(() => apartmentPendingQuoteMetrics(), []);
  const curtainReadiness = useMemo(() => curtainQuoteReadiness(rows), [rows]);
  const bathroomRows = useMemo(() => bathroomRowsFromRows(rows), [rows]);
  const aluminumWindowSuggestedArea = useMemo(() => aluminumWindowSuggestedAreaFromRows(rows), [rows]);
  const manualQuoteItemQuantities = useMemo(() => manualQuoteQuantitiesFromInputs(manualQuoteItemInputs), [manualQuoteItemInputs]);
  const hydropowerEstimate = useMemo(
    () => buildHydropowerEstimate(rows, drawing, hydropowerOverride),
    [rows, drawing, hydropowerOverride],
  );
  const manualQuoteEditedCount = Object.keys(manualQuoteItemQuantities).length;
  const filteredQuoteRules = useMemo(() => {
    const keyword = quoteRuleSearch.trim().toLowerCase();
    return quoteRules
      .map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => {
        if (!keyword) {
          return true;
        }
        const searchable = [
          rule.item_name,
          rule.metric,
          rule.unit,
          rule.space_types?.join("、") ?? "全部",
        ].join(" ").toLowerCase();
        return searchable.includes(keyword);
      });
  }, [quoteRules, quoteRuleSearch]);
  const groupedQuoteRules = useMemo(() => {
    const remainingRules = new Set(filteredQuoteRules);
    const grouped = quoteRuleGroups
      .map((group) => {
        const rules = filteredQuoteRules.filter((item) => group.itemNames.has(item.rule.item_name));
        rules.forEach((item) => remainingRules.delete(item));
        return { title: group.title, rules };
      })
      .filter((group) => group.rules.length > 0);
    if (remainingRules.size > 0) {
      grouped.push({ title: "其他规则", rules: [...remainingRules] });
    }
    return grouped;
  }, [filteredQuoteRules]);
  const projectSummaryItems = generatedQuoteMapping ? projectSummaryQuoteItems(generatedQuoteMapping.mapping) : [];
  const integratedCeilingPriceReminderItemsForMapping = generatedQuoteMapping ? integratedCeilingPriceReminderItems(generatedQuoteMapping.mapping) : [];
  const quoteExportRisks = generatedQuoteMapping ? exportQuoteMappingConfirmationMessages(generatedQuoteMapping.mapping) : [];
  const rawHealthChecks = useMemo(
    () => buildQuantityHealthChecks({ rows, summary, quoteMapping: generatedQuoteMapping?.mapping ?? null, hydropower: hydropowerEstimate }),
    [rows, summary, generatedQuoteMapping, hydropowerEstimate],
  );
  const healthChecks = useMemo(() => filterAcceptedHealthChecks(rawHealthChecks, acceptedHealthCheckKeys), [rawHealthChecks, acceptedHealthCheckKeys]);
  const healthSummary = useMemo(() => summarizeQuantityHealthChecks(healthChecks), [healthChecks]);
  const filteredHealthChecks = useMemo(() => filterQuantityHealthChecks(healthChecks, healthFilter), [healthChecks, healthFilter]);

  useEffect(() => {
    try {
      const savedRules = window.localStorage.getItem(QUOTE_RULES_STORAGE_KEY);
      if (!savedRules) {
        return;
      }
      const parsed = JSON.parse(savedRules) as { fileName?: unknown; rules?: unknown; defaultVersion?: unknown };
      if (!Array.isArray(parsed.rules)) {
        throw new Error("saved quote rules are invalid");
      }
      if (shouldResetSavedQuoteRules({ fileName: parsed.fileName, defaultVersion: parsed.defaultVersion, currentVersion: DEFAULT_QUOTE_RULES_STORAGE_VERSION, defaultRuleName: DEFAULT_QUOTE_RULES_NAME })) {
        window.localStorage.removeItem(QUOTE_RULES_STORAGE_KEY);
        return;
      }
      const restoredRules = withDefaultQuoteRuleCoverage(parseQuoteRules(JSON.stringify(parsed.rules)));
      setQuoteRules(restoredRules);
      setQuoteRulesFileName(typeof parsed.fileName === "string" && parsed.fileName.trim() ? parsed.fileName : `${DEFAULT_QUOTE_RULES_NAME}（已编辑）`);
    } catch {
      window.localStorage.removeItem(QUOTE_RULES_STORAGE_KEY);
    } finally {
      setQuoteRulesStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!quoteRulesStorageReady) {
      return;
    }
    window.localStorage.setItem(QUOTE_RULES_STORAGE_KEY, JSON.stringify({ fileName: quoteRulesFileName, rules: quoteRules, defaultVersion: DEFAULT_QUOTE_RULES_STORAGE_VERSION }));
  }, [quoteRulesStorageReady, quoteRules, quoteRulesFileName]);

  useEffect(() => {
    try {
      const savedGroups = window.localStorage.getItem(QUOTE_RULE_GROUPS_STORAGE_KEY);
      if (!savedGroups) {
        return;
      }
      const parsed = JSON.parse(savedGroups);
      if (!Array.isArray(parsed)) {
        throw new Error("saved quote rule groups are invalid");
      }
      const validTitles = new Set(quoteRuleGroups.map((group) => group.title));
      setCollapsedQuoteRuleGroups(parsed.filter((item): item is string => typeof item === "string" && validTitles.has(item)));
    } catch {
      window.localStorage.removeItem(QUOTE_RULE_GROUPS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(QUOTE_RULE_GROUPS_STORAGE_KEY, JSON.stringify(collapsedQuoteRuleGroups));
  }, [collapsedQuoteRuleGroups]);

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
      setHydropowerOverride(null);
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
      setHydropowerOverride(null);
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
      setHydropowerOverride(snapshot.hydropower ?? null);
      setGeneratedTemplate(null);
      setGeneratedHealthFixList(null);
      setGeneratedQuoteMapping(null);
      setGeneratedQuoteRules(null);
      setAcceptedHealthCheckKeys(snapshot.accepted_health_check_keys);
      setManualQuoteItemInputs(manualQuoteInputsFromQuantities(snapshot.excel_manual_item_quantities));
      setBathroomManualChoices(bathroomManualChoicesFromQuantities(snapshot.excel_manual_item_quantities, snapshot.rows));
      setQuoteMode(snapshot.quote_mode);
      setSelectedQuotePackageIds(snapshot.selected_quote_package_ids);
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
    const content = `${JSON.stringify(buildReviewSnapshot({ fileName, calibrationFileName, rows, acceptedHealthCheckKeys, excelManualItemQuantities: manualQuoteItemQuantities, quoteMode, selectedQuotePackageIds, summary, comparison, hydropower: hydropowerEstimate }), null, 2)}\n`;
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
    const baseMapping = buildQuoteMapping(rows, quoteRules, summary ?? undefined, {
      hydropowerSummary: hydropowerEstimate.summary,
      quoteMode,
      selectedQuotePackageIds,
    });
    const quoteHealthChecks = filterAcceptedHealthChecks(buildQuantityHealthChecks({ rows, summary, quoteMapping: baseMapping, hydropower: hydropowerEstimate }), acceptedHealthCheckKeys);
    const quoteHealthSummary = summarizeQuantityHealthChecks(quoteHealthChecks);
    const mapping = buildQuoteMapping(rows, quoteRules, summary ?? undefined, {
      hydropowerSummary: hydropowerEstimate.summary,
      quantityHealthReadiness: quoteHealthSummary,
      quoteMode,
      selectedQuotePackageIds,
    });
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
    const content = buildQuoteExcelHtml(mapping, fileName, {
      manualItems: manualQuoteItemQuantities,
      bathroomChoices: bathroomManualChoices,
      bathroomRows,
    });
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

  function handleDownloadSpaceNamingGuide() {
    const downloadName = spaceNamingGuideFileName(fileName);
    const content = buildSpaceNamingGuideMarkdown();
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(`已生成空间命名规范：${downloadName}`);
  }

  function handleHydropowerConfirm() {
    setHydropowerOverride({ ...hydropowerEstimate, reviewStatus: "confirmed" });
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
  }

  function handleHydropowerPointQuantityChange(id: string, quantity: number) {
    const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : 0;
    setHydropowerOverride({
      ...hydropowerEstimate,
      points: hydropowerEstimate.points.map((point) => (point.id === id ? { ...point, quantity: safeQuantity } : point)),
      reviewStatus: "needs_review",
    });
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
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
      const parsedRules = withDefaultQuoteRuleCoverage(parseQuoteRules(await rulesFile.text()));
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

  function handleChangeQuoteRulePricePart(index: number, part: "material_price" | "auxiliary_price" | "labor_price", value: string) {
    if (!value.trim()) {
      return;
    }
    const price = Number(value);
    try {
      setQuoteRules((current) => updateQuoteRulePricePart(current, index, part, price));
      setQuoteRulesFileName((current) => (current.endsWith("（已编辑）") ? current : `${current}（已编辑）`));
      setGeneratedQuoteMapping(null);
      setGeneratedHealthFixList(null);
      setGeneratedQuoteRules(null);
      setError("");
      setMessage("报价规则单价已更新，并已自动保存到本机；重新导出报价映射后生效");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "报价规则单价更新失败");
      setMessage("");
    }
  }

  function handleResetQuoteRules() {
    const nextRules = defaultQuoteRules();
    setQuoteRules(nextRules);
    setQuoteRulesFileName(DEFAULT_QUOTE_RULES_NAME);
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setGeneratedQuoteRules(null);
    setError("");
    setMessage("已恢复默认报价规则，并已自动保存到本机");
  }

  function handleToggleQuoteRuleGroup(title: string) {
    setCollapsedQuoteRuleGroups((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  }

  function handleCollapseAllQuoteRuleGroups() {
    setCollapsedQuoteRuleGroups(groupedQuoteRules.map((group) => group.title));
  }

  function handleExpandAllQuoteRuleGroups() {
    setCollapsedQuoteRuleGroups([]);
  }

  function handleChangeManualQuoteItem(itemName: string, value: string) {
    setManualQuoteItemInputs((current) => ({ ...current, [itemName]: value }));
    setMessage(value.trim() ? `${itemName} Excel 补项数量已更新` : `${itemName} Excel 补项已恢复默认`);
  }

  function handleUseManualQuoteSuggestion(itemName: string, quantity: number) {
    handleChangeManualQuoteItem(itemName, String(quantity));
    setMessage(`${itemName} 已填入建议数量 ${quantity}`);
  }

  function handleResetManualQuoteItems() {
    setManualQuoteItemInputs({});
    setBathroomManualChoices({});
    setMessage("Excel 可选补项已恢复默认");
  }

  function handleChangeQuoteMode(nextMode: QuoteMode) {
    setQuoteMode(nextMode);
    setGeneratedQuoteMapping(null);
    setMessage(`报价模式已切换为：${QUOTE_MODE_OPTIONS.find((option) => option.value === nextMode)?.label ?? nextMode}`);
  }

  function handleToggleQuotePackage(packageId: QuotePackageId) {
    setSelectedQuotePackageIds((current) =>
      current.includes(packageId) ? current.filter((item) => item !== packageId) : [...current, packageId],
    );
    setGeneratedQuoteMapping(null);
  }

  function handleChangeBathroomManualChoice(row: QuantityRow, rowIndex: number, part: keyof BathroomManualChoice, itemName: NonNullable<BathroomManualChoice[keyof BathroomManualChoice]>) {
    setBathroomManualChoices((current) => {
      const key = bathroomChoiceKey(row, rowIndex);
      const nextChoices = { ...current, [key]: { ...current[key], [part]: itemName } };
      setManualQuoteItemInputs((inputs) => manualQuoteInputsFromBathroomChoices(inputs, nextChoices, bathroomRows));
      return nextChoices;
    });
    setMessage(`${row.spaceName} 已选择 ${itemName}`);
  }

  function handleChangeStatus(spaceName: string, status: ReviewStatus) {
    setRows((current) => updateQuantityRowStatus(current, spaceName, status));
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setMessage(`${spaceName} 状态已更新为 ${statusLabels[status]}`);
  }

  function handleChangeSpaceType(spaceName: string, spaceType: string) {
    setRows((current) => updateQuantityRowSpaceType(current, spaceName, spaceType));
    setComparison(null);
    setGeneratedQuoteMapping(null);
    setGeneratedHealthFixList(null);
    setHydropowerOverride(null);
    setMessage(`${spaceName} 空间类型已调整为 ${spaceType}`);
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
          <button type="button" disabled={isUploading || isComparing} onClick={handleDownloadSpaceNamingGuide}>
            <Download aria-hidden="true" size={18} />
            下载命名规范
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

      <section className="quoteModePanel">
        <div className="templateHeader">
          <div>
            <strong>报价输出模式</strong>
            <span>导出报价映射和 Excel 草稿时生效；报价规则单价仍统一维护。</span>
          </div>
        </div>
        <div className="quoteModeChoices">
          {QUOTE_MODE_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={quoteMode === option.value ? "active" : ""}
              onClick={() => handleChangeQuoteMode(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>
        <div className="quotePackageChoices" aria-disabled={quoteMode !== "hard_plus"}>
          {QUOTE_PACKAGE_DEFINITIONS.map((item) => (
            <label className={quoteMode === "hard_plus" ? "" : "disabled"} key={item.id}>
              <input
                type="checkbox"
                disabled={quoteMode !== "hard_plus"}
                checked={selectedQuotePackageIds.includes(item.id)}
                onChange={() => handleToggleQuotePackage(item.id)}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="quoteRulesPanel">
        <div className="templateHeader">
          <div>
            <strong>报价规则单价</strong>
            <span>{quoteRulesFileName} · 本机自动保存 · 显示 {filteredQuoteRules.length}/{quoteRules.length} 项</span>
          </div>
          <div className="quoteRulesActions">
            <button type="button" onClick={handleExpandAllQuoteRuleGroups}>全部展开</button>
            <button type="button" onClick={handleCollapseAllQuoteRuleGroups}>全部收起</button>
            <button type="button" onClick={handleResetQuoteRules}>恢复默认规则</button>
          </div>
        </div>
        <label className="quoteRuleSearch">
          <span>筛选规则</span>
          <input
            aria-label="筛选报价规则"
            type="search"
            placeholder="按清单项、取数指标、适用空间搜索"
            value={quoteRuleSearch}
            onChange={(event) => setQuoteRuleSearch(event.target.value)}
          />
        </label>
        <div className="quoteRulesTable">
          <table>
            <thead>
              <tr>
                <th>清单项</th>
                <th>取数指标</th>
                <th>适用空间</th>
                <th>单位</th>
                <th>主材</th>
                <th>辅材</th>
                <th>人工</th>
                <th>汇总单价</th>
              </tr>
            </thead>
            <tbody>
              {groupedQuoteRules.length === 0 && (
                <tr>
                  <td className="quoteRuleEmptyState" colSpan={8}>没有匹配的报价规则</td>
                </tr>
              )}
              {groupedQuoteRules.map((group) => (
                <Fragment key={group.title}>
                  <tr className="quoteRuleGroupTitle">
                    <td colSpan={8}>
                      <button type="button" onClick={() => handleToggleQuoteRuleGroup(group.title)}>
                        <span>{collapsedQuoteRuleGroups.includes(group.title) ? "展开" : "收起"}</span>
                        <strong>{group.title}</strong>
                        <span className="quoteRuleGroupCount">{group.rules.length} 项</span>
                      </button>
                    </td>
                  </tr>
                  {!collapsedQuoteRuleGroups.includes(group.title) && group.rules.map(({ rule, index }) => (
                    <tr key={`${rule.item_name}-${rule.metric}-${index}`}>
                      <td>{rule.item_name}</td>
                      <td><code>{rule.metric}</code></td>
                      <td>{rule.space_types?.join("、") ?? "全部"}</td>
                      <td>{rule.unit}</td>
                      <td>
                        <input
                          aria-label={`${rule.item_name} 主材单价`}
                          min="0"
                          step="0.01"
                          type="number"
                          value={rule.material_price ?? rule.unit_price}
                          onChange={(event) => handleChangeQuoteRulePricePart(index, "material_price", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${rule.item_name} 辅材单价`}
                          min="0"
                          step="0.01"
                          type="number"
                          value={rule.auxiliary_price ?? 0}
                          onChange={(event) => handleChangeQuoteRulePricePart(index, "auxiliary_price", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${rule.item_name} 人工单价`}
                          min="0"
                          step="0.01"
                          type="number"
                          value={rule.labor_price ?? 0}
                          onChange={(event) => handleChangeQuoteRulePricePart(index, "labor_price", event.target.value)}
                        />
                      </td>
                      <td>{rule.unit_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="manualQuotePanel">
        <div className="templateHeader">
          <div>
            <strong>Excel 可选补项</strong>
            <span>数量留空时沿用自动识别或默认占位；填写后只影响 Excel 草稿。入户门、阳台推拉门和窗台石由自动识别结果处理。</span>
          </div>
          <div className="quoteRulesActions">
            <button type="button" disabled={manualQuoteEditedCount === 0} onClick={handleResetManualQuoteItems}>恢复默认</button>
          </div>
        </div>
        <div className="manualQuoteGrid">
          {MANUAL_QUOTE_OPTION_ITEMS.map((item) => (
            <label className="manualQuoteItem" key={item.itemName}>
              <span>
                <strong>{item.itemName}</strong>
                <small>{item.hint} · {item.unit}</small>
                {item.itemName === ALUMINUM_WINDOW_ITEM_NAME && <small>建议 {aluminumWindowSuggestedArea.toFixed(2)} {item.unit}</small>}
              </span>
              <input
                aria-label={`${item.itemName} Excel 补项数量`}
                min="0"
                step="0.01"
                type="number"
                placeholder="默认"
                value={manualQuoteItemInputs[item.itemName] ?? ""}
                onChange={(event) => handleChangeManualQuoteItem(item.itemName, event.target.value)}
              />
              {item.itemName === ALUMINUM_WINDOW_ITEM_NAME && (
                <button type="button" disabled={aluminumWindowSuggestedArea <= 0} onClick={() => handleUseManualQuoteSuggestion(item.itemName, aluminumWindowSuggestedArea)}>
                  使用建议
                </button>
              )}
            </label>
          ))}
        </div>
        <div className="manualBathroomChoices">
          {bathroomRows.map((row, rowIndex) => {
            const choiceKey = bathroomChoiceKey(row, rowIndex);
            const choice = bathroomManualChoices[choiceKey] ?? {};
            const selectedFixture = choice.fixture ?? "马桶";
            const selectedShower = choice.shower ?? "淋浴隔断";
            return (
              <div className="manualBathroomChoice" key={choiceKey}>
                <strong>{row.spaceName}</strong>
                <div>
                  <span>洁具</span>
                  {(["马桶", "蹲坑"] as const).map((itemName) => (
                    <button
                      type="button"
                      className={selectedFixture === itemName ? "active" : ""}
                      onClick={() => handleChangeBathroomManualChoice(row, rowIndex, "fixture", itemName)}
                      key={itemName}
                    >
                      {itemName}
                    </button>
                  ))}
                </div>
                <div>
                  <span>淋浴</span>
                  {(["淋浴隔断", "玻璃淋浴房"] as const).map((itemName) => (
                    <button
                      type="button"
                      className={selectedShower === itemName ? "active" : ""}
                      onClick={() => handleChangeBathroomManualChoice(row, rowIndex, "shower", itemName)}
                      key={itemName}
                    >
                      {itemName}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {bathroomRows.length === 0 && <p>当前没有可计价卫生间。</p>}
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
            <div className="quoteIntegrationStatus">
              <strong>报价接入状态清单</strong>
              <div>
                {QUOTE_INTEGRATION_STATUS_GROUPS.map((group) => (
                  <section key={group.title}>
                    <span>{group.title}</span>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
            <div>
              <strong>待补取数口径</strong>
              <span>{pendingQuoteMetrics.length > 0 ? `${pendingQuoteMetrics.length} 项暂不参与金额汇总，后续补齐 metric 后再接入。` : "当前默认规则已无待补取数口径。"}</span>
            </div>
            <div className="curtainReadiness">
              <strong>Excel 可选补项 {MANUAL_QUOTE_OPTION_ITEMS.length} 项</strong>
              <span>
                当前已填写 {manualQuoteEditedCount} 项；这些数量只写入 Excel 草稿，不改变报价映射 JSON 的自动合计。
              </span>
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

      <HydropowerReviewPanel
        estimate={hydropowerEstimate}
        onConfirm={handleHydropowerConfirm}
        onPointQuantityChange={handleHydropowerPointQuantityChange}
      />

      <DrawingReview
        drawing={drawing}
        hydropowerPoints={hydropowerEstimate.points}
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
        <QuantityTable rows={rows} differences={comparison?.differences ?? []} onChangeStatus={handleChangeStatus} onChangeSpaceType={handleChangeSpaceType} onChangeCurtainWallWidth={handleChangeCurtainWallWidth} onChangeCeilingFinishType={handleChangeCeilingFinishType} />
      </section>
    </main>
  );
}

const layers = ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_EXT_WALL", "QUOTE_WALL_TILE", "QUOTE_NEW_WALL", "QUOTE_DEMO_WALL", "QUOTE_CAST_SLAB", "QUOTE_EDGE_CEILING", "QUOTE_BASE_CABINET", "QUOTE_WALL_CABINET", "QUOTE_CUSTOM", "QUOTE_TOILET", "QUOTE_BATHROOM_VANITY", "QUOTE_WINDOW", "QUOTE_DOOR", "QUOTE_FLOOR", "QUOTE_HEIGHT"];

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
