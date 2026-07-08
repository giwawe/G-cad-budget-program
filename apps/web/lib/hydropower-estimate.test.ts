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
