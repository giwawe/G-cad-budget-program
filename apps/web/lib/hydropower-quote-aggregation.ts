import type { HydropowerSummary } from "./types";

export type HydropowerQuoteSummary = {
  strongOutletCount: number;
  switchCount: number;
  lightCount: number;
  downlightSpotlightCount: number;
  equipmentCircuitCount: number;
  weakPointCount: number;
  strongConduitLengthM: number;
  weakConduitLengthM: number;
  strongBoxCount: number;
  weakBoxCount: number;
  distributionBoxCount: number;
  waterSupplyPointCount: number;
  hotWaterPointCount: number;
  drainagePointCount: number;
  waterPipeLengthM: number;
  drainPipeLengthM: number;
};

export function aggregateHydropowerQuoteSummary(summary: HydropowerSummary): HydropowerQuoteSummary {
  return {
    strongOutletCount:
      summary.standardOutletCount +
      summary.sofaChargingOutletCount +
      summary.heatingOutletCount +
      summary.bedEndFanOutletCount +
      summary.kitchenCounterOutletCount +
      summary.smartToiletOutletCount +
      summary.washingMachineOutletCount +
      summary.dryerOutletCount +
      summary.waterPurifierOutletCount,
    switchCount: summary.switchPointCount,
    lightCount: summary.lightPointCount,
    downlightSpotlightCount: 0,
    equipmentCircuitCount: summary.acCircuitCount + summary.highPowerCircuitCount + summary.bathroomHeaterCircuitCount,
    weakPointCount: summary.weakPointCount,
    strongConduitLengthM: round2(summary.strongConduitLengthM),
    weakConduitLengthM: round2(summary.weakConduitLengthM),
    strongBoxCount: 1,
    weakBoxCount: 1,
    distributionBoxCount: 0,
    waterSupplyPointCount: summary.coldWaterPointCount,
    hotWaterPointCount: summary.hotWaterPointCount,
    drainagePointCount: summary.drainPointCount + summary.floorDrainPointCount,
    waterPipeLengthM: round2(summary.waterPipeLengthM),
    drainPipeLengthM: round2(summary.drainPipeLengthM),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
