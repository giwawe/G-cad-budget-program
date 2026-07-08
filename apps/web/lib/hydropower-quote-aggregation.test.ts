import assert from "node:assert/strict";

import { aggregateHydropowerQuoteSummary } from "./hydropower-quote-aggregation.ts";
import type { HydropowerSummary } from "./types.ts";

const summary: HydropowerSummary = {
  switchPointCount: 9,
  standardOutletCount: 10,
  sofaChargingOutletCount: 2,
  heatingOutletCount: 1,
  bedEndFanOutletCount: 3,
  kitchenCounterOutletCount: 6,
  lightPointCount: 8,
  weakPointCount: 6,
  acCircuitCount: 4,
  highPowerCircuitCount: 2,
  bathroomHeaterCircuitCount: 2,
  smartToiletOutletCount: 2,
  washingMachineOutletCount: 1,
  dryerOutletCount: 1,
  waterPurifierOutletCount: 1,
  coldWaterPointCount: 3,
  hotWaterPointCount: 3,
  drainPointCount: 5,
  floorDrainPointCount: 2,
  strongConduitLengthM: 162.345,
  weakConduitLengthM: 49.124,
  waterPipeLengthM: 28.456,
  drainPipeLengthM: 21.111,
  lowConfidencePointCount: 0,
};

assert.deepEqual(aggregateHydropowerQuoteSummary(summary), {
  strongOutletCount: 27,
  switchCount: 9,
  lightCount: 8,
  downlightSpotlightCount: 0,
  equipmentCircuitCount: 8,
  weakPointCount: 6,
  strongConduitLengthM: 162.35,
  weakConduitLengthM: 49.12,
  strongBoxCount: 1,
  weakBoxCount: 1,
  distributionBoxCount: 0,
  waterSupplyPointCount: 3,
  hotWaterPointCount: 3,
  drainagePointCount: 7,
  waterPipeLengthM: 28.46,
  drainPipeLengthM: 21.11,
});

assert.equal(aggregateHydropowerQuoteSummary({ ...summary, standardOutletCount: 0, kitchenCounterOutletCount: 0 }).strongOutletCount, 11);
