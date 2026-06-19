export type ReviewStatus = "pending_review" | "confirmed" | "needs_fix" | "excluded";

export type QuantityRow = {
  floor: string;
  spaceName: string;
  spaceType: string;
  floorAreaM2: number;
  ceilingAreaM2: number;
  wallMeasureLengthM: number;
  heightM: number;
  windowWidthTotalM: number;
  windowAreaM2: number;
  doorWidthTotalM: number;
  wallGrossAreaM2: number;
  latexPaintAreaM2: number;
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

export type DrawingGeometry = {
  spaces: DrawingSpace[];
  walls: DrawingSegment[];
  measured_walls: DrawingSegment[];
  windows: DrawingSegment[];
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
