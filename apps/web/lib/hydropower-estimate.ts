import type { DrawingGeometry, HydropowerEstimate, HydropowerSummary, QuantityRow } from "./types";

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

export function summarizeHydropowerEstimate(estimate: HydropowerEstimate): HydropowerSummary {
  return estimate.summary;
}

export function buildHydropowerEstimate(
  _rows: QuantityRow[],
  _drawing: DrawingGeometry | null,
  overrides?: HydropowerEstimate | null,
): HydropowerEstimate {
  if (overrides) {
    return overrides;
  }
  return {
    points: [],
    pipes: [],
    summary: { ...EMPTY_HYDROPOWER_SUMMARY },
    reviewStatus: "auto_estimated",
  };
}
