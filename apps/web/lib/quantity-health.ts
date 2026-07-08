import type { QuoteMapping } from "./quote-mapping";
import type { HydropowerEstimate, QuantityRow, QuantitySummary, ReviewStatus } from "./types";

export type QuantityHealthSeverity = "warning" | "info";

export type QuantityHealthCheck = {
  id:
    | "space-type-other"
    | "building-area-missing"
    | "building-area-quote-missing"
    | "bathroom-door-classification"
    | "kitchen-sliding-door-missing"
    | "balcony-sliding-door-missing"
    | "entry-door-duplicate"
    | "wet-room-window-attribution"
    | "kitchen-cabinet-missing"
    | "kitchen-custom-cabinet-overlap"
    | "bathroom-fixture-missing"
    | "legacy-hydropower-area-rule"
    | "integrated-ceiling-price-missing"
    | "hydropower-auto-estimated"
    | "hydropower-low-confidence";
  severity: QuantityHealthSeverity;
  title: string;
  detail: string;
  message?: string;
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

export function healthCheckKey(check: QuantityHealthCheck): string {
  return `${check.id}:${check.spaceNames?.length ? check.spaceNames.join("|") : "project"}`;
}

export function filterAcceptedHealthChecks(checks: QuantityHealthCheck[], acceptedKeys: string[]): QuantityHealthCheck[] {
  const accepted = new Set(acceptedKeys);
  return checks.filter((check) => !accepted.has(healthCheckKey(check)));
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
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return `${lines.join("\n")}\n`;
}

export function buildQuantityHealthChecks({
  rows,
  summary,
  quoteMapping,
  hydropower,
}: {
  rows: QuantityRow[];
  summary?: QuantitySummary | null;
  quoteMapping?: QuoteMapping | null;
  hydropower?: HydropowerEstimate;
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

  const balconyMissingSlidingDoorNames = uniqueNames(
    billableRows
      .filter(
        (row) =>
          (row.spaceType === "阳台" || row.spaceType === "露台") &&
          row.doorWidthTotalM >= 1.2 &&
          (row.slidingDoorAreaM2 <= 0 || row.slidingDoorCasingLengthM <= 0),
      )
      .map((row) => row.spaceName),
  );
  if (balconyMissingSlidingDoorNames.length > 0) {
    checks.push({
      id: "balcony-sliding-door-missing",
      severity: "info",
      title: "阳台/露台推拉门待确认",
      detail: `${formatNames(balconyMissingSlidingDoorNames)} 有 1.20m 以上门洞但推拉门面积或双包套为 0，请确认门洞是否应归为阳台推拉门。`,
      spaceNames: balconyMissingSlidingDoorNames,
    });
  }

  const entryDoorTotal = billableRows.reduce((sum, row) => sum + (row.entryDoorCount ?? 0), 0);
  if (entryDoorTotal > 1) {
    const entryDoorNames = uniqueNames(billableRows.filter((row) => (row.entryDoorCount ?? 0) > 0).map((row) => row.spaceName));
    checks.push({
      id: "entry-door-duplicate",
      severity: "warning",
      title: "入户门数量待确认",
      detail: `当前识别到 ${entryDoorTotal} 樘入户门，常规商品房通常只有 1 樘，请确认是否存在跨空间重复归属。`,
      spaceNames: entryDoorNames,
    });
  }

  const wetRoomWindowNames = uniqueNames(
    billableRows
      .filter((row) => (row.spaceType === "厨房" || row.spaceType === "卫生间") && row.windowWidthTotalM > 0 && row.windowAreaM2 <= 0)
      .map((row) => row.spaceName),
  );
  if (wetRoomWindowNames.length > 0) {
    checks.push({
      id: "wet-room-window-attribution",
      severity: "warning",
      title: "厨卫窗洞归属待确认",
      detail: `${formatNames(wetRoomWindowNames)} 有窗宽但窗洞面积为 0，可能影响墙砖扣减和墙面工程量。`,
      spaceNames: wetRoomWindowNames,
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
      detail: `${formatNames(bathroomMissingFixtureNames)} 马桶或浴室柜数量为 0，请确认是否按默认 1 套或补绘点位。`,
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

  const missingBuildingAreaItems = quoteMapping?.building_area_quote_readiness.missing_item_names ?? [];
  if (missingBuildingAreaItems.length > 0) {
    checks.push({
      id: "building-area-quote-missing",
      severity: "warning",
      title: "建筑面积报价项未入金额",
      detail: `${formatNames(missingBuildingAreaItems)} 依赖建筑面积，但当前未进入金额汇总。`,
    });
  }

  const legacyHydropowerAreaRuleItemNames = quoteMapping?.legacy_hydropower_area_rule_item_names ?? [];
  if (legacyHydropowerAreaRuleItemNames.length > 0) {
    checks.push({
      id: "legacy-hydropower-area-rule",
      severity: "warning",
      title: "水电旧面积报价规则待替换",
      detail: `${formatNames(legacyHydropowerAreaRuleItemNames)} 仍按旧的水电施工面积取数，请改用水电点位和管线长度规则后再导出正式报价。`,
    });
  }

  const zeroPriceIntegratedCeilingNames = uniqueNames(
    (quoteMapping?.items ?? [])
      .filter((item) => item.item_name === "厨房卫生间集成吊顶" && item.quantity > 0 && item.unit_price <= 0)
      .map((item) => item.space_name),
  );
  if (zeroPriceIntegratedCeilingNames.length > 0) {
    checks.push({
      id: "integrated-ceiling-price-missing",
      severity: "info",
      title: "集成吊顶单价待补",
      detail: `${formatNames(zeroPriceIntegratedCeilingNames)} 已生成集成吊顶工程量，但当前单价为 0，请在报价规则中补充单价后再导出正式报价。`,
      spaceNames: zeroPriceIntegratedCeilingNames,
    });
  }

  if (hydropower?.reviewStatus === "auto_estimated") {
    checks.push({
      id: "hydropower-auto-estimated",
      severity: "info",
      title: "水电点位待复核",
      detail: "水电点位为系统推算，导出客户报价前建议复核。",
      spaceNames: [],
    });
  }

  if ((hydropower?.summary.lowConfidencePointCount ?? 0) > 0) {
    checks.push({
      id: "hydropower-low-confidence",
      severity: "warning",
      title: "水电点位待确认",
      detail: "部分水电点位缺少坐标，管线只能按数量系数估算，请检查空间轮廓或复核点位。",
      spaceNames: [],
    });
  }

  return checks.map(attachHealthMessage);
}

function uniqueNames(names: string[]): string[] {
  return [...new Set(names.filter((name) => name.trim()))];
}

function attachHealthMessage(check: QuantityHealthCheck): QuantityHealthCheck {
  return {
    ...check,
    message: check.detail,
  };
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
    case "building-area-quote-missing":
      return "先补齐 QUOTE_EXT_WALL 建筑面积，再重新导出报价映射。";
    case "bathroom-door-classification":
      return "检查卫生间门洞是否应标记为卫生间门，避免计入室内门。";
    case "kitchen-sliding-door-missing":
      return "确认门洞是否应生成厨房推拉门，必要时检查门洞宽度和归属。";
    case "balcony-sliding-door-missing":
      return "确认门洞是否通往阳台或露台，必要时检查门洞归属和推拉门识别。";
    case "entry-door-duplicate":
      return "核对入户门图层、块名或空间归属，避免同一入户门在多个空间重复报价。";
    case "wet-room-window-attribution":
      return "检查厨卫窗洞是否正确归属到空间，并确认窗高标识或默认窗高是否生效。";
    case "kitchen-cabinet-missing":
      return "如果需要橱柜报价，请在实际地柜、吊柜位置补绘对应柜体延米线。";
    case "kitchen-custom-cabinet-overlap":
      return "厨房空间优先使用 QUOTE_BASE_CABINET / QUOTE_WALL_CABINET，避免 QUOTE_CUSTOM 重复计价。";
    case "bathroom-fixture-missing":
      return "确认卫生间是否需要默认马桶/浴室柜；若数量特殊，请用点位覆盖。";
    case "legacy-hydropower-area-rule":
      return "删除旧的 electrical_scope_area_m2 / plumbing_scope_area_m2 水电规则，改用 hydropower_* 点位和管线长度规则。";
    case "integrated-ceiling-price-missing":
      return "在报价规则 JSON 中为“厨房卫生间集成吊顶”补充真实单价；若实际做石膏板吊顶，请切换顶面类型。";
    case "hydropower-auto-estimated":
      return "复核系统推算的水电点位，确认是否需要人工调整或补充点位坐标。";
    case "hydropower-low-confidence":
      return "检查缺少坐标的水电点位，必要时补画空间轮廓或重新校准点位。";
  }
}
