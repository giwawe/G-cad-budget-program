import type { QuoteMapping } from "./quote-mapping";
import type { QuantityRow, QuantitySummary, ReviewStatus } from "./types";

export type QuantityHealthSeverity = "warning" | "info";

export type QuantityHealthCheck = {
  id:
    | "space-type-other"
    | "building-area-missing"
    | "curtain-wall-width-pending"
    | "building-area-quote-missing"
    | "bathroom-door-classification"
    | "bedroom-interior-door-duplicate"
    | "kitchen-sliding-door-missing"
    | "kitchen-cabinet-missing"
    | "kitchen-custom-cabinet-overlap"
    | "bathroom-fixture-missing";
  severity: QuantityHealthSeverity;
  title: string;
  detail: string;
  spaceNames?: string[];
};

export type QuantityHealthSummary = {
  total: number;
  warning: number;
  info: number;
  label: string;
};

export type QuantityHealthFilter = "all" | QuantityHealthSeverity;

export function filterQuantityHealthChecks(checks: QuantityHealthCheck[], filter: QuantityHealthFilter): QuantityHealthCheck[] {
  if (filter === "all") {
    return checks;
  }
  return checks.filter((check) => check.severity === filter);
}

export function summarizeQuantityHealthChecks(checks: QuantityHealthCheck[]): QuantityHealthSummary {
  const warning = checks.filter((check) => check.severity === "warning").length;
  const info = checks.filter((check) => check.severity === "info").length;
  return {
    total: checks.length,
    warning,
    info,
    label: formatHealthSummaryLabel(warning, info),
  };
}

export function healthFixListFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "health-fix-list.md";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.health-fix-list.md`;
}

export function buildHealthFixListMarkdown({
  fileName,
  checks,
  rows = [],
  generatedAt = new Date(),
}: {
  fileName: string;
  checks: QuantityHealthCheck[];
  rows?: QuantityRow[];
  generatedAt?: Date;
}): string {
  const summary = summarizeQuantityHealthChecks(checks);
  const warningChecks = checks.filter((check) => check.severity === "warning");
  const infoChecks = checks.filter((check) => check.severity === "info");
  const lines = [
    "# CAD 修图清单",
    "",
    `来源文件：${fileName}`,
    `生成时间：${generatedAt.toISOString()}`,
    `检查结果：${summary.label}`,
    "",
    ...formatHealthSection("需优先处理", warningChecks, rows),
    ...formatHealthSection("提醒", infoChecks, rows),
    ...formatRepairReviewSection(checks),
  ];
  while (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return `${lines.join("\n")}\n`;
}

export function buildQuantityHealthChecks({
  rows,
  summary,
  quoteMapping,
}: {
  rows: QuantityRow[];
  summary?: QuantitySummary | null;
  quoteMapping?: QuoteMapping | null;
}): QuantityHealthCheck[] {
  const checks: QuantityHealthCheck[] = [];
  const billableRows = rows.filter((row) => row.status !== "excluded");
  const otherSpaceNames = uniqueNames(billableRows.filter((row) => row.spaceType === "其他").map((row) => row.spaceName));
  if (otherSpaceNames.length > 0) {
    checks.push({
      id: "space-type-other",
      severity: "warning",
      title: "空间类型待确认",
      detail: `${formatNames(otherSpaceNames)} 被识别为其他，需改名或补充关键词，避免报价项目缺失。`,
      spaceNames: otherSpaceNames,
    });
  }

  const bathroomInteriorDoorNames = uniqueNames(
    billableRows.filter((row) => row.spaceType === "卫生间" && row.interiorDoorCount > 0).map((row) => row.spaceName),
  );
  if (bathroomInteriorDoorNames.length > 0) {
    checks.push({
      id: "bathroom-door-classification",
      severity: "warning",
      title: "卫生间门分类待确认",
      detail: `${formatNames(bathroomInteriorDoorNames)} 出现室内门数量，可能应归为卫生间门，避免室内门重复报价。`,
      spaceNames: bathroomInteriorDoorNames,
    });
  }

  const bedroomDuplicateDoorNames = uniqueNames(
    billableRows.filter((row) => row.spaceType === "卧室" && row.interiorDoorCount > 1).map((row) => row.spaceName),
  );
  if (bedroomDuplicateDoorNames.length > 0) {
    checks.push({
      id: "bedroom-interior-door-duplicate",
      severity: "warning",
      title: "卧室室内门数量待确认",
      detail: `${formatNames(bedroomDuplicateDoorNames)} 室内门数量超过 1，可能和套内卫生间门重复。`,
      spaceNames: bedroomDuplicateDoorNames,
    });
  }

  const kitchenMissingSlidingDoorNames = uniqueNames(
    billableRows
      .filter((row) => row.spaceType === "厨房" && row.doorWidthTotalM >= 1.2 && (row.slidingDoorAreaM2 <= 0 || row.slidingDoorCasingLengthM <= 0))
      .map((row) => row.spaceName),
  );
  if (kitchenMissingSlidingDoorNames.length > 0) {
    checks.push({
      id: "kitchen-sliding-door-missing",
      severity: "info",
      title: "厨房推拉门待确认",
      detail: `${formatNames(kitchenMissingSlidingDoorNames)} 有 1.20m 以上门洞但推拉门面积或门套为 0，请确认是否应生成厨房推拉门报价。`,
      spaceNames: kitchenMissingSlidingDoorNames,
    });
  }

  const kitchenMissingCabinetNames = uniqueNames(
    billableRows
      .filter((row) => row.spaceType === "厨房" && row.kitchenBaseCabinetLengthM <= 0 && row.kitchenWallCabinetLengthM <= 0)
      .map((row) => row.spaceName),
  );
  if (kitchenMissingCabinetNames.length > 0) {
    checks.push({
      id: "kitchen-cabinet-missing",
      severity: "info",
      title: "厨房橱柜待确认",
      detail: `${formatNames(kitchenMissingCabinetNames)} 橱柜地柜和吊柜长度都为 0，如需橱柜报价请检查 QUOTE_BASE_CABINET / QUOTE_WALL_CABINET。`,
      spaceNames: kitchenMissingCabinetNames,
    });
  }

  const kitchenCustomCabinetNames = uniqueNames(
    billableRows.filter((row) => row.spaceType === "厨房" && row.customCabinetAreaM2 > 0).map((row) => row.spaceName),
  );
  if (kitchenCustomCabinetNames.length > 0) {
    checks.push({
      id: "kitchen-custom-cabinet-overlap",
      severity: "warning",
      title: "厨房全屋定制待确认",
      detail: `${formatNames(kitchenCustomCabinetNames)} 厨房空间出现全屋定制面积，可能和橱柜地柜/吊柜重复计价。`,
      spaceNames: kitchenCustomCabinetNames,
    });
  }

  const bathroomMissingFixtureNames = uniqueNames(
    billableRows.filter((row) => row.spaceType === "卫生间" && (row.toiletCount <= 0 || row.bathroomVanityCount <= 0)).map((row) => row.spaceName),
  );
  if (bathroomMissingFixtureNames.length > 0) {
    checks.push({
      id: "bathroom-fixture-missing",
      severity: "info",
      title: "卫生间洁具待确认",
      detail: `${formatNames(bathroomMissingFixtureNames)} 马桶或浴室柜数量为 0，请确认是否应按默认 1 个/1 套或补画点位。`,
      spaceNames: bathroomMissingFixtureNames,
    });
  }

  if ((summary?.building_area_m2 ?? 0) <= 0) {
    checks.push({
      id: "building-area-missing",
      severity: "warning",
      title: "建筑面积未就绪",
      detail: "当前建筑面积为 0，请检查是否绘制了闭合 QUOTE_EXT_WALL 外墙轮廓。",
    });
  }

  const curtainPendingNames = uniqueNames([
    ...(quoteMapping?.curtain_quote_readiness.pending_space_names ?? []),
    ...billableRows
      .filter((row) => row.curtainWallWidthSource === "fallback_longest_wall" || row.curtainWallWidthSource === "manual_required_l_shape_window")
      .map((row) => row.spaceName),
  ]);
  if (curtainPendingNames.length > 0) {
    checks.push({
      id: "curtain-wall-width-pending",
      severity: "warning",
      title: "窗帘/窗帘箱待确认",
      detail: `${formatNames(curtainPendingNames)} 需要人工确认窗帘/窗帘箱延米，确认后暗窗帘箱才进入金额汇总。`,
      spaceNames: curtainPendingNames,
    });
  }

  const missingBuildingAreaItems = quoteMapping?.building_area_quote_readiness.missing_item_names ?? [];
  if (missingBuildingAreaItems.length > 0) {
    checks.push({
      id: "building-area-quote-missing",
      severity: "warning",
      title: "建筑面积报价项未入金额",
      detail: `${formatNames(missingBuildingAreaItems)} 依赖建筑面积，当前未进入金额汇总。`,
    });
  }

  return checks;
}

function uniqueNames(names: string[]): string[] {
  return [...new Set(names.filter((name) => name.trim()))];
}

function formatNames(names: string[]): string {
  return names.join("、");
}

function formatHealthSummaryLabel(warning: number, info: number): string {
  if (warning === 0 && info === 0) {
    return "当前无待确认项";
  }
  const parts: string[] = [];
  if (warning > 0) {
    parts.push(`${warning} 项需优先处理`);
  }
  if (info > 0) {
    parts.push(`${info} 项提醒`);
  }
  return parts.join("，");
}

function formatHealthSection(title: string, checks: QuantityHealthCheck[], rows: QuantityRow[]): string[] {
  if (checks.length === 0) {
    return [];
  }
  return [
    `## ${title}`,
    "",
    ...checks.flatMap((check, index) => [
      `${index + 1}. ${check.title}`,
      `   - 级别：${check.severity}`,
      `   - 涉及空间：${check.spaceNames?.length ? formatNames(check.spaceNames) : "全屋/项目级"}`,
      ...formatStatusLine(check, rows),
      `   - 问题：${check.detail}`,
      `   - 建议：${healthFixSuggestion(check.id)}`,
      "",
    ]),
  ];
}

function formatStatusLine(check: QuantityHealthCheck, rows: QuantityRow[]): string[] {
  if (!check.spaceNames?.length || rows.length === 0) {
    return [];
  }
  const statuses = check.spaceNames.map((spaceName) => `${spaceName}=${reviewStatusLabel(rows.find((row) => row.spaceName === spaceName)?.status)}`);
  return [`   - 当前状态：${statuses.join("、")}`];
}

function formatRepairReviewSection(checks: QuantityHealthCheck[]): string[] {
  if (checks.length === 0) {
    return [];
  }
  return [
    "## 修图后复核",
    "",
    "1. CAD 修图完成后，请重新上传 DXF 并复查算量健康检查。",
    "2. 若仍有 warning，请先处理后再导出正式报价映射。",
    "",
  ];
}

function reviewStatusLabel(status?: ReviewStatus): string {
  switch (status) {
    case "pending_review":
      return "待确认";
    case "confirmed":
      return "已确认";
    case "needs_fix":
      return "需修图";
    case "excluded":
      return "不计价";
    default:
      return "未知";
  }
}

function healthFixSuggestion(id: QuantityHealthCheck["id"]): string {
  switch (id) {
    case "space-type-other":
      return "检查空间名称和 QUOTE_TEXT，必要时改名或补充空间分类关键词。";
    case "building-area-missing":
      return "补画闭合 QUOTE_EXT_WALL 外墙轮廓，确保建筑面积可按外墙闭合多段线读取。";
    case "curtain-wall-width-pending":
      return "确认窗帘/窗帘箱实际延米，L 形或回退最长墙的空间需人工填入校准值。";
    case "building-area-quote-missing":
      return "先补齐 QUOTE_EXT_WALL 建筑面积，再重新导出报价映射。";
    case "bathroom-door-classification":
      return "检查卫生间门洞是否应标记为卫生间门，避免进入室内门报价。";
    case "bedroom-interior-door-duplicate":
      return "核对卧室门洞归属，套内卫生间门应归为卫生间门，不应重复算室内门。";
    case "kitchen-sliding-door-missing":
      return "确认该门洞是开放洞口还是厨房推拉门；如为推拉门，检查门洞宽度或标记。";
    case "kitchen-cabinet-missing":
      return "如需要橱柜报价，在实际地柜/吊柜位置补画对应柜体延米线。";
    case "kitchen-custom-cabinet-overlap":
      return "厨房空间优先使用 QUOTE_BASE_CABINET / QUOTE_WALL_CABINET，避免 QUOTE_CUSTOM 重复计价。";
    case "bathroom-fixture-missing":
      return "确认卫生间是否需要默认马桶/浴室柜；若数量特殊，用 QUOTE_TOILET / QUOTE_BATHROOM_VANITY 点位覆盖。";
  }
}
