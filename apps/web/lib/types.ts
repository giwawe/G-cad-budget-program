export type ReviewStatus = "pending_review" | "confirmed" | "needs_fix" | "excluded";
export type CurtainWallWidthSource = "matched_window_wall" | "fallback_longest_wall" | "not_applicable" | "manual_required_l_shape_window" | "manual";

export type QuantityRow = {
  floor: string;
  spaceName: string;
  spaceType: string;
  floorAreaM2: number;
  ceilingAreaM2: number;
  wallMeasureLengthM: number;
  heightM: number;
  windowWidthTotalM: number;
  windowsillLengthM: number;
  curtainWallWidthM: number;
  curtainWallWidthSource: CurtainWallWidthSource;
  windowAreaM2: number;
  doorWidthTotalM: number;
  doorDeductAreaM2: number;
  wallGrossAreaM2: number;
  latexPaintAreaM2: number;
  wallTileMeasureLengthM: number;
  wallTileAreaM2: number;
  newWallLengthM: number;
  newWallAreaM2: number;
  demolitionWallLengthM: number;
  demolitionWallAreaM2: number;
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
  space_names: string[];
};

export type DrawingGeometry = {
  spaces: DrawingSpace[];
  walls: DrawingSegment[];
  measured_walls: DrawingSegment[];
  tile_walls: DrawingSegment[];
  new_walls: DrawingSegment[];
  demolition_walls: DrawingSegment[];
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
  floor_area_total_m2: number;
  wall_measure_length_total_m: number;
  window_area_total_m2: number;
  latex_paint_area_total_m2: number;
};

export type CalibrationDifference = {
  space_name: string;
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
};
