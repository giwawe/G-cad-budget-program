import type {
  DrawingGeometry,
  DrawingPoint,
  DrawingSpace,
  HydropowerEstimate,
  HydropowerPipeEstimate,
  HydropowerPoint,
  HydropowerPointKind,
  HydropowerSource,
  HydropowerSummary,
  QuantityRow,
} from "./types";

type PointAnchor = "center" | "wall" | "door" | "cabinet" | "toilet" | "vanity" | "wet_corner";

type PointSpec = {
  kind: HydropowerPointKind;
  label: string;
  quantity: (row: QuantityRow) => number;
  anchor: PointAnchor;
};

export const EMPTY_HYDROPOWER_SUMMARY: HydropowerSummary = {
  switchPointCount: 0,
  standardOutletCount: 0,
  sofaChargingOutletCount: 0,
  heatingOutletCount: 0,
  bedEndFanOutletCount: 0,
  kitchenCounterOutletCount: 0,
  lightPointCount: 0,
  weakPointCount: 0,
  acCircuitCount: 0,
  highPowerCircuitCount: 0,
  bathroomHeaterCircuitCount: 0,
  smartToiletOutletCount: 0,
  washingMachineOutletCount: 0,
  dryerOutletCount: 0,
  waterPurifierOutletCount: 0,
  coldWaterPointCount: 0,
  hotWaterPointCount: 0,
  drainPointCount: 0,
  floorDrainPointCount: 0,
  strongConduitLengthM: 0,
  weakConduitLengthM: 0,
  waterPipeLengthM: 0,
  drainPipeLengthM: 0,
  lowConfidencePointCount: 0,
};

const RULES_BY_SPACE_TYPE: Record<string, PointSpec[]> = {
  厨房: [
    { kind: "light", label: "厨房照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "厨房开关点位", quantity: () => 1, anchor: "door" },
    { kind: "kitchen_counter_outlet", label: "厨房台面插座", quantity: () => 6, anchor: "cabinet" },
    { kind: "standard_outlet", label: "油烟机插座", quantity: () => 1, anchor: "cabinet" },
    { kind: "standard_outlet", label: "冰箱插座", quantity: () => 1, anchor: "wall" },
    { kind: "water_purifier_outlet", label: "净水机插座", quantity: () => 1, anchor: "cabinet" },
    { kind: "cold_water", label: "厨房水槽冷水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "hot_water", label: "厨房水槽热水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "drain", label: "厨房水槽排水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "cold_water", label: "净水机给水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "high_power_circuit", label: "厨房大功率电器专线", quantity: () => 2, anchor: "cabinet" },
  ],
  卫生间: [
    { kind: "light", label: "卫生间照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "卫生间开关点位", quantity: () => 1, anchor: "door" },
    { kind: "bathroom_heater_circuit", label: "浴霸/暖风机专线", quantity: () => 1, anchor: "center" },
    { kind: "light", label: "镜前灯点位", quantity: () => 1, anchor: "vanity" },
    { kind: "standard_outlet", label: "镜柜/吹风机插座", quantity: () => 1, anchor: "vanity" },
    { kind: "smart_toilet_outlet", label: "智能马桶插座", quantity: () => 1, anchor: "toilet" },
    { kind: "cold_water", label: "马桶给水点", quantity: (row) => Math.max(row.toiletCount, 1), anchor: "toilet" },
    { kind: "cold_water", label: "浴室柜冷水点", quantity: (row) => Math.max(row.bathroomVanityCount, 1), anchor: "vanity" },
    { kind: "hot_water", label: "浴室柜热水点", quantity: (row) => Math.max(row.bathroomVanityCount, 1), anchor: "vanity" },
    { kind: "drain", label: "浴室柜排水点", quantity: (row) => Math.max(row.bathroomVanityCount, 1), anchor: "vanity" },
    { kind: "cold_water", label: "花洒冷水点", quantity: () => 1, anchor: "wet_corner" },
    { kind: "hot_water", label: "花洒热水点", quantity: () => 1, anchor: "wet_corner" },
    { kind: "floor_drain", label: "卫生间地漏", quantity: () => 1, anchor: "wet_corner" },
    { kind: "drain", label: "卫生间排水点", quantity: () => 1, anchor: "wet_corner" },
  ],
  客厅: [
    { kind: "light", label: "客厅照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "客厅开关点位", quantity: () => 2, anchor: "door" },
    { kind: "standard_outlet", label: "客厅普通插座", quantity: () => 6, anchor: "wall" },
    { kind: "sofa_charging_outlet", label: "沙发充电插座", quantity: () => 2, anchor: "wall" },
    { kind: "heating_outlet", label: "沙发中部取暖设备插座", quantity: () => 1, anchor: "wall" },
    { kind: "ac_circuit", label: "客厅空调专线", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "客厅电视点位", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "客厅网络点位", quantity: () => 1, anchor: "wall" },
  ],
  餐厅: [
    { kind: "light", label: "餐厅照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "餐厅开关点位", quantity: () => 1, anchor: "door" },
    { kind: "standard_outlet", label: "餐厅普通插座", quantity: () => 3, anchor: "wall" },
  ],
  卧室: [
    { kind: "light", label: "卧室照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "卧室开关点位", quantity: () => 1, anchor: "door" },
    { kind: "standard_outlet", label: "卧室普通插座", quantity: () => 5, anchor: "wall" },
    { kind: "bed_end_fan_outlet", label: "床尾风扇插座", quantity: () => 1, anchor: "wall" },
    { kind: "ac_circuit", label: "卧室空调专线", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "卧室网络点位", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "卧室电视点位", quantity: () => 1, anchor: "wall" },
  ],
};

const DRY_FUNCTION_SPACE_TYPES = new Set(["书房", "茶室", "娱乐室"]);
const SIMPLE_SPACE_RULES = new Set(["过道", "门厅", "楼梯", "楼梯过道", "衣帽间", "储物间", "露台"]);

export function summarizeHydropowerEstimate(estimate: HydropowerEstimate): HydropowerSummary {
  return estimate.summary;
}

export function buildHydropowerEstimate(
  rows: QuantityRow[],
  drawing: DrawingGeometry | null,
  overrides?: HydropowerEstimate | null,
): HydropowerEstimate {
  if (overrides) {
    return overrides;
  }

  const points = rows.flatMap((row) => pointsForRow(row, drawing));
  const pipes: HydropowerPipeEstimate[] = [];

  return {
    points,
    pipes,
    summary: summarizePointsAndPipes(points, pipes),
    reviewStatus: "auto_estimated",
  };
}

function summarizePointsAndPipes(points: HydropowerPoint[], pipes: HydropowerPipeEstimate[]): HydropowerSummary {
  const count = (kind: HydropowerPointKind) =>
    points.filter((point) => point.kind === kind).reduce((sum, point) => sum + point.quantity, 0);
  const pipeLength = (kind: HydropowerPipeEstimate["kind"]) =>
    round2(pipes.filter((pipe) => pipe.kind === kind).reduce((sum, pipe) => sum + pipe.lengthM, 0));

  return {
    switchPointCount: count("switch"),
    standardOutletCount: count("standard_outlet"),
    sofaChargingOutletCount: count("sofa_charging_outlet"),
    heatingOutletCount: count("heating_outlet"),
    bedEndFanOutletCount: count("bed_end_fan_outlet"),
    kitchenCounterOutletCount: count("kitchen_counter_outlet"),
    lightPointCount: count("light"),
    weakPointCount: count("weak_point"),
    acCircuitCount: count("ac_circuit"),
    highPowerCircuitCount: count("high_power_circuit"),
    bathroomHeaterCircuitCount: count("bathroom_heater_circuit"),
    smartToiletOutletCount: count("smart_toilet_outlet"),
    washingMachineOutletCount: count("washing_machine_outlet"),
    dryerOutletCount: count("dryer_outlet"),
    waterPurifierOutletCount: count("water_purifier_outlet"),
    coldWaterPointCount: count("cold_water"),
    hotWaterPointCount: count("hot_water"),
    drainPointCount: count("drain"),
    floorDrainPointCount: count("floor_drain"),
    strongConduitLengthM: pipeLength("strong_conduit"),
    weakConduitLengthM: pipeLength("weak_conduit"),
    waterPipeLengthM: pipeLength("water_pipe"),
    drainPipeLengthM: pipeLength("drain_pipe"),
    lowConfidencePointCount: points.filter((point) => point.confidence === "low").length,
  };
}

function rulesForSpaceType(spaceType: string): PointSpec[] {
  if (RULES_BY_SPACE_TYPE[spaceType]) {
    return RULES_BY_SPACE_TYPE[spaceType];
  }

  if (DRY_FUNCTION_SPACE_TYPES.has(spaceType)) {
    return RULES_BY_SPACE_TYPE.卧室;
  }

  if (spaceType === "阳台" || spaceType === "洗衣房") {
    return [
      { kind: "light", label: `${spaceType}照明点位`, quantity: () => 1, anchor: "center" },
      { kind: "switch", label: `${spaceType}开关点位`, quantity: () => 1, anchor: "door" },
      { kind: "washing_machine_outlet", label: "洗衣机插座", quantity: () => 1, anchor: "wet_corner" },
      { kind: "dryer_outlet", label: "烘干机插座", quantity: () => 1, anchor: "wet_corner" },
      { kind: "cold_water", label: "洗衣机给水点", quantity: () => 1, anchor: "wet_corner" },
      { kind: "drain", label: "洗衣机排水点", quantity: () => 1, anchor: "wet_corner" },
      { kind: "floor_drain", label: `${spaceType}地漏`, quantity: () => 1, anchor: "wet_corner" },
    ];
  }

  if (SIMPLE_SPACE_RULES.has(spaceType)) {
    return [
      { kind: "light", label: `${spaceType}照明点位`, quantity: () => 1, anchor: "center" },
      { kind: "switch", label: `${spaceType}开关点位`, quantity: () => 1, anchor: "door" },
      { kind: "standard_outlet", label: `${spaceType}备用插座`, quantity: () => (spaceType === "露台" ? 1 : 0), anchor: "wall" },
    ];
  }

  return [
    { kind: "light", label: `${spaceType || "其他"}照明点位`, quantity: () => 1, anchor: "center" },
    { kind: "switch", label: `${spaceType || "其他"}开关点位`, quantity: () => 1, anchor: "door" },
  ];
}

function pointsForRow(row: QuantityRow, drawing: DrawingGeometry | null): HydropowerPoint[] {
  const space = spaceForRow(row, drawing);
  const specs = rulesForSpaceType(row.spaceType);

  return specs.flatMap((spec) => {
    const quantity = Math.max(0, Math.floor(spec.quantity(row)));
    return Array.from({ length: quantity }, (_, index) => buildPoint(row, space, drawing, spec, index, quantity));
  });
}

function buildPoint(
  row: QuantityRow,
  space: DrawingSpace | null,
  drawing: DrawingGeometry | null,
  spec: PointSpec,
  index: number,
  quantity: number,
): HydropowerPoint {
  const anchor = anchorPoint(row, space, drawing, spec, index, quantity);
  return {
    id: `${row.floor}-${row.spaceName}-${spec.kind}-${index + 1}`,
    floor: row.floor,
    spaceName: row.spaceName,
    spaceType: row.spaceType,
    kind: spec.kind,
    label: spec.label,
    quantity: 1,
    point: anchor.point,
    source: anchor.source,
    confidence: anchor.confidence,
    note: anchor.point ? "系统按空间轮廓生成推荐点位" : "缺少空间几何，按数量候选生成",
  };
}

function anchorPoint(
  row: QuantityRow,
  space: DrawingSpace | null,
  drawing: DrawingGeometry | null,
  spec: PointSpec,
  index: number,
  quantity: number,
): { point: DrawingPoint | null; source: HydropowerSource; confidence: "high" | "medium" | "low" } {
  if (!space || space.points.length === 0) {
    return { point: null, source: "fallback_count", confidence: "low" };
  }

  if (spec.anchor === "toilet") {
    const fixturePoint = drawing?.toilets[index];
    if (fixturePoint) {
      return { point: fixturePoint, source: "fixture_point", confidence: "high" };
    }
  }

  if (spec.anchor === "vanity") {
    const fixturePoint = drawing?.bathroom_vanities[index];
    if (fixturePoint) {
      return { point: fixturePoint, source: "fixture_point", confidence: "high" };
    }
  }

  if (spec.anchor === "door") {
    const fixturePoint = midpointOfSegment(drawing?.doors[index] ?? null);
    if (fixturePoint) {
      return { point: fixturePoint, source: "fixture_point", confidence: "high" };
    }
  }

  if (spec.anchor === "cabinet") {
    const fixturePoint =
      midpointOfSegment(drawing?.base_cabinets[index] ?? null) ??
      midpointOfSegment(drawing?.wall_cabinets[index] ?? null) ??
      midpointOfSegment(drawing?.custom_cabinets[index] ?? null);
    if (fixturePoint) {
      return { point: fixturePoint, source: "fixture_point", confidence: "high" };
    }
  }

  const bounds = boundsOf(space.points);
  const point = pointForAnchor(bounds, spec.anchor, index, quantity);

  return {
    point,
    source: "virtual_point",
    confidence: spec.anchor === "center" ? "high" : "medium",
  };
}

function spaceForRow(row: QuantityRow, drawing: DrawingGeometry | null): DrawingSpace | null {
  return drawing?.spaces.find((space) => space.name === row.spaceName) ?? null;
}

function boundsOf(points: DrawingPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y },
  );
}

function pointForAnchor(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  anchor: PointAnchor,
  index: number,
  quantity: number,
): DrawingPoint {
  const centerX = round2((bounds.minX + bounds.maxX) / 2);
  const centerY = round2((bounds.minY + bounds.maxY) / 2);
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const insetX = round2(Math.min(width * 0.18, 0.45));
  const insetY = round2(Math.min(height * 0.18, 0.45));

  switch (anchor) {
    case "center":
      return { x: centerX, y: centerY };
    case "toilet":
      return { x: round2(bounds.maxX - insetX), y: round2(bounds.maxY - insetY) };
    case "vanity":
      return { x: round2(bounds.minX + insetX), y: round2(bounds.minY + insetY) };
    case "wet_corner":
      return { x: round2(bounds.maxX - insetX), y: round2(bounds.minY + insetY) };
    case "door":
      return {
        x: round2(bounds.minX + ((index + 1) * width) / (quantity + 1)),
        y: round2(bounds.minY + insetY),
      };
    case "cabinet":
      return {
        x: round2(bounds.minX + ((index + 1) * width) / (quantity + 1)),
        y: round2(bounds.maxY - insetY),
      };
    case "wall":
    default:
      return {
        x: round2(bounds.minX + ((index + 1) * width) / (quantity + 1)),
        y: round2(index % 2 === 0 ? bounds.minY + insetY : bounds.maxY - insetY),
      };
  }
}

function midpointOfSegment(segment: { start: DrawingPoint; end: DrawingPoint } | null | undefined): DrawingPoint | null {
  if (!segment) {
    return null;
  }

  return {
    x: round2((segment.start.x + segment.end.x) / 2),
    y: round2((segment.start.y + segment.end.y) / 2),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
