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

