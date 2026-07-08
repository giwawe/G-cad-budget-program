export type ReviewStatus = "pending_review" | "confirmed" | "needs_fix" | "excluded";
export type CurtainWallWidthSource = "matched_window_wall" | "matched_l_shape_window" | "fallback_longest_wall" | "not_applicable" | "manual_required_l_shape_window" | "manual";
export type CeilingFinishType = "integrated" | "gypsum";

export type QuantityRow = {
  floor: string;
  spaceName: string;
  spaceType: string;
  grossFloorAreaM2?: number;
  floorAreaM2: number;
  ceilingAreaM2: number;
  gypsumFlatCeilingAreaM2?: number;
  edgeCeilingAreaM2?: number;
  edgeCeilingLengthM?: number;
  voidAreaM2?: number;
  ceilingFinishType?: CeilingFinishType;
  wallMeasureLengthM: number;
  heightM: number;
  windowWidthTotalM: number;
  windowsillLengthM: number;
  curtainWallWidthM: number;
  curtainWallWidthSource: CurtainWallWidthSource;
  atriumCurtainWidthM?: number;
  atriumCurtainHeightM?: number;
  atriumCurtainAreaM2?: number;
  windowAreaM2: number;
  doorWidthTotalM: number;
  doorDeductAreaM2: number;
  wallGrossAreaM2: number;
  latexPaintAreaM2: number;
  wallTileMeasureLengthM: number;
  wallTileAreaM2: number;
  floorTilePieceCount: number;
  electricalScopeAreaM2: number;
  plumbingScopeAreaM2: number;
  newWallLengthM: number;
  newWallAreaM2: number;
  newWallUnclassifiedAreaM2?: number;
  newWall120AreaM2?: number;
  newWall240AreaM2?: number;
  demolitionWallLengthM: number;
  demolitionWallAreaM2: number;
  backgroundWallAreaM2?: number;
  castSlabAreaM2?: number;
  entryDoorCount?: number;
  interiorDoorCount: number;
  bathroomDoorCount: number;
  slidingDoorAreaM2: number;
  slidingDoorCasingLengthM: number;
  kitchenBaseCabinetLengthM: number;
  kitchenWallCabinetLengthM: number;
  customCabinetAreaM2: number;
  toiletCount: number;
  bathroomVanityCount: number;
  stairRailingLengthM?: number;
  guardrailLengthM?: number;
  waterproofAreaM2: number;
  evidence: string;
  anomalies: string[];
  status: ReviewStatus;
};

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingSegment = {
  start: DrawingPoint;
  end: DrawingPoint;
};

export type DrawingSpace = {
  name: string;
  points: DrawingPoint[];
};

export type DrawingText = {
  text: string;
  point: DrawingPoint;
};

export type DrawingOpening = {
  segments: DrawingSegment[];
};

export type DrawingWindow = {
  segments: DrawingSegment[];
  boundary_points: DrawingPoint[];
  width_m: number;
  height_m: number;
  included_in_wall_deduction: boolean;
  space_names: string[];
};

export type DrawingDoor = {
  segment: DrawingSegment;
  thickness_m: number;
  width_m: number;
  deduct_from_wall: boolean;
  review_required: boolean;
  opening_type: string;
  quote_category?: string | null;
  space_names: string[];
};

export type DrawingGeometry = {
  spaces: DrawingSpace[];
  walls: DrawingSegment[];
  measured_walls: DrawingSegment[];
  opening_edges?: DrawingSegment[];
  void_boundaries?: DrawingPoint[][];
  edge_ceiling_boundaries?: DrawingPoint[][];
  railings?: DrawingSegment[];
  tile_walls: DrawingSegment[];
  new_walls: DrawingSegment[];
  demolition_walls: DrawingSegment[];
  background_walls?: DrawingSegment[];
  cast_slab_boundaries?: DrawingPoint[][];
  base_cabinets: DrawingSegment[];
  wall_cabinets: DrawingSegment[];
  base_cabinet_boundaries?: DrawingPoint[][];
  wall_cabinet_boundaries?: DrawingPoint[][];
  custom_cabinets: DrawingSegment[];
  exterior_wall_boundaries: DrawingPoint[][];
  building_area_m2: number;
  toilets: DrawingPoint[];
  bathroom_vanities: DrawingPoint[];
  window_openings: DrawingWindow[];
  windows: DrawingSegment[];
  door_openings: DrawingDoor[];
  doors: DrawingSegment[];
  base_segments: DrawingSegment[];
  base_texts: DrawingText[];
  bbox: {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
  };
};

export type QuantitySummary = {
  space_count: number;
  building_area_m2: number;
  floor_area_total_m2: number;
  wall_measure_length_total_m: number;
  window_area_total_m2: number;
  latex_paint_area_total_m2: number;
};

export type HydropowerPointKind =
  | "switch"
  | "standard_outlet"
  | "sofa_charging_outlet"
  | "heating_outlet"
  | "bed_end_fan_outlet"
  | "kitchen_counter_outlet"
  | "light"
  | "weak_point"
  | "ac_circuit"
  | "high_power_circuit"
  | "bathroom_heater_circuit"
  | "smart_toilet_outlet"
  | "washing_machine_outlet"
  | "dryer_outlet"
  | "water_purifier_outlet"
  | "cold_water"
  | "hot_water"
  | "drain"
  | "floor_drain";

export type HydropowerPipeKind = "strong_conduit" | "weak_conduit" | "water_pipe" | "drain_pipe";
export type HydropowerReviewStatus = "auto_estimated" | "confirmed" | "needs_review";
export type HydropowerSource = "virtual_point" | "fixture_point" | "fallback_count";

export type HydropowerPoint = {
  id: string;
  floor: string;
  spaceName: string;
  spaceType: string;
  kind: HydropowerPointKind;
  label: string;
  quantity: number;
  point: DrawingPoint | null;
  source: HydropowerSource;
  confidence: "high" | "medium" | "low";
  note: string;
};

export type HydropowerPipeEstimate = {
  id: string;
  floor: string;
  spaceName: string;
  spaceType: string;
  kind: HydropowerPipeKind;
  label: string;
  lengthM: number;
  source: "virtual_point_distance" | "fallback_count_factor";
  confidence: "high" | "medium" | "low";
  note: string;
};

export type HydropowerSummary = {
  switchPointCount: number;
  standardOutletCount: number;
  sofaChargingOutletCount: number;
  heatingOutletCount: number;
  bedEndFanOutletCount: number;
  kitchenCounterOutletCount: number;
  lightPointCount: number;
  weakPointCount: number;
  acCircuitCount: number;
  highPowerCircuitCount: number;
  bathroomHeaterCircuitCount: number;
  smartToiletOutletCount: number;
  washingMachineOutletCount: number;
  dryerOutletCount: number;
  waterPurifierOutletCount: number;
  coldWaterPointCount: number;
  hotWaterPointCount: number;
  drainPointCount: number;
  floorDrainPointCount: number;
  strongConduitLengthM: number;
  weakConduitLengthM: number;
  waterPipeLengthM: number;
  drainPipeLengthM: number;
  lowConfidencePointCount: number;
};

export type HydropowerEstimate = {
  points: HydropowerPoint[];
  pipes: HydropowerPipeEstimate[];
  summary: HydropowerSummary;
  reviewStatus: HydropowerReviewStatus;
};

export type CalibrationDifference = {
  space_name: string;
  field: string;
  actual: number;
  expected: number;
  delta: number;
  percent_delta: number;
};

export type CalibrationSummaryDifference = {
  field: string;
  actual: number;
  expected: number;
  delta: number;
  percent_delta: number;
};

export type CalibrationComparison = {
  passed: boolean;
  matched_count: number;
  failed_count: number;
  missing_spaces: string[];
  unexpected_spaces: string[];
  differences: CalibrationDifference[];
  summary_differences?: CalibrationSummaryDifference[];
};
