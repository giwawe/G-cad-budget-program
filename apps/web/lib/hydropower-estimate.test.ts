import assert from "node:assert/strict";
import { buildHydropowerEstimate, summarizeHydropowerEstimate } from "./hydropower-estimate.ts";
import type { DrawingGeometry, QuantityRow } from "./types.ts";

const emptyDrawing: DrawingGeometry = {
  spaces: [],
  walls: [],
  measured_walls: [],
  opening_edges: [],
  void_boundaries: [],
  railings: [],
  tile_walls: [],
  new_walls: [],
  demolition_walls: [],
  background_walls: [],
  cast_slab_boundaries: [],
  base_cabinets: [],
  wall_cabinets: [],
  base_cabinet_boundaries: [],
  wall_cabinet_boundaries: [],
  custom_cabinets: [],
  exterior_wall_boundaries: [],
  building_area_m2: 0,
  toilets: [],
  bathroom_vanities: [],
  window_openings: [],
  windows: [],
  door_openings: [],
  doors: [],
  base_segments: [],
  base_texts: [],
  bbox: { min_x: 0, min_y: 0, max_x: 0, max_y: 0 },
};

const emptyEstimate = buildHydropowerEstimate([], emptyDrawing);
assert.equal(emptyEstimate.reviewStatus, "auto_estimated");
assert.deepEqual(emptyEstimate.points, []);
assert.deepEqual(emptyEstimate.pipes, []);
assert.deepEqual(summarizeHydropowerEstimate(emptyEstimate), {
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
});

function baseRow(overrides: Partial<QuantityRow>): QuantityRow {
  return {
    floor: "一层",
    spaceName: "一层-客厅",
    spaceType: "客厅",
    grossFloorAreaM2: 20,
    floorAreaM2: 20,
    ceilingAreaM2: 20,
    voidAreaM2: 0,
    wallMeasureLengthM: 18,
    heightM: 2.8,
    windowWidthTotalM: 2,
    windowsillLengthM: 2,
    curtainWallWidthM: 3,
    curtainWallWidthSource: "matched_window_wall",
    windowAreaM2: 3.6,
    doorWidthTotalM: 0.9,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 50.4,
    latexPaintAreaM2: 42,
    wallTileMeasureLengthM: 0,
    wallTileAreaM2: 0,
    floorTilePieceCount: 19,
    electricalScopeAreaM2: 20,
    plumbingScopeAreaM2: 20,
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    interiorDoorCount: 0,
    bathroomDoorCount: 0,
    slidingDoorAreaM2: 0,
    slidingDoorCasingLengthM: 0,
    kitchenBaseCabinetLengthM: 0,
    kitchenWallCabinetLengthM: 0,
    customCabinetAreaM2: 0,
    toiletCount: 0,
    bathroomVanityCount: 0,
    waterproofAreaM2: 0,
    evidence: "",
    anomalies: [],
    status: "pending_review",
    ...overrides,
  };
}

const roomDrawing: DrawingGeometry = {
  ...emptyDrawing,
  spaces: [
    { name: "一层-客厅", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }] },
    { name: "一层-厨房", points: [{ x: 7, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 7, y: 3 }] },
    { name: "一层-卫生间", points: [{ x: 11, y: 0 }, { x: 13, y: 0 }, { x: 13, y: 2.2 }, { x: 11, y: 2.2 }] },
  ],
  base_cabinets: [{ start: { x: 7.2, y: 0.2 }, end: { x: 9.8, y: 0.2 } }],
  toilets: [{ x: 12.4, y: 1.6 }],
  bathroom_vanities: [{ x: 11.3, y: 0.4 }],
  doors: [{ start: { x: 0.2, y: 0 }, end: { x: 1, y: 0 } }],
  door_openings: [],
  bbox: { min_x: 0, min_y: 0, max_x: 13, max_y: 4 },
};

const hydropowerRows = [
  baseRow({ spaceName: "一层-客厅", spaceType: "客厅", floorAreaM2: 24 }),
  baseRow({ spaceName: "一层-厨房", spaceType: "厨房", kitchenBaseCabinetLengthM: 2.6, floorAreaM2: 9 }),
  baseRow({ spaceName: "一层-卫生间", spaceType: "卫生间", toiletCount: 1, bathroomVanityCount: 1, floorAreaM2: 4.4 }),
];

const estimate = buildHydropowerEstimate(hydropowerRows, roomDrawing);
assert.equal(estimate.points.filter((point) => point.kind === "kitchen_counter_outlet").length, 6);
assert.equal(estimate.points.filter((point) => point.kind === "sofa_charging_outlet").length, 2);
assert.equal(estimate.points.filter((point) => point.kind === "heating_outlet").length, 1);
assert.equal(estimate.points.filter((point) => point.kind === "smart_toilet_outlet").length, 1);
assert.equal(estimate.points.filter((point) => point.kind === "cold_water" && point.spaceType === "卫生间").length, 3);
assert.ok(estimate.points.every((point) => point.id.includes(point.spaceName)));
assert.ok(estimate.points.filter((point) => point.source === "virtual_point").length > 0);
assert.ok(estimate.points.filter((point) => point.source === "fixture_point").length > 0);

const villaEstimate = buildHydropowerEstimate(
  [
    baseRow({ floor: "一层", spaceName: "一层-卧室", spaceType: "卧室" }),
    baseRow({ floor: "二层", spaceName: "二层-卧室", spaceType: "卧室" }),
  ],
  {
    ...emptyDrawing,
    spaces: [
      { name: "一层-卧室", points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }] },
      { name: "二层-卧室", points: [{ x: 0, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 8 }, { x: 0, y: 8 }] },
    ],
    bbox: { min_x: 0, min_y: 0, max_x: 4, max_y: 8 },
  },
);
assert.equal(villaEstimate.points.filter((point) => point.kind === "bed_end_fan_outlet").length, 2);
