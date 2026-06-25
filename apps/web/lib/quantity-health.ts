import type { QuoteMapping } from "./quote-mapping";
import type { QuantityRow, QuantitySummary } from "./types";

export type QuantityHealthSeverity = "warning" | "info";

export type QuantityHealthCheck = {
  id:
    | "space-type-other"
    | "building-area-missing"
    | "curtain-wall-width-pending"
    | "building-area-quote-missing"
    | "bathroom-door-classification"
    | "bedroom-interior-door-duplicate"
    | "kitchen-sliding-door-missing";
  severity: QuantityHealthSeverity;
  title: string;
  detail: string;
  spaceNames?: string[];
};

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
      severity: "warning",
      title: "厨房推拉门待确认",
      detail: `${formatNames(kitchenMissingSlidingDoorNames)} 有 1.20m 以上门洞但推拉门面积或门套为 0，请确认是否应生成厨房推拉门报价。`,
      spaceNames: kitchenMissingSlidingDoorNames,
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
