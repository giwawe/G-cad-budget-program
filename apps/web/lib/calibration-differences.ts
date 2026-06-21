import type { CalibrationDifference, QuantityRow } from "./types";

const CURTAIN_CALIBRATION_SOURCES = new Set(["manual_required_l_shape_window", "fallback_longest_wall"]);

export function differenceKey(spaceName: string, field: string): string {
  return `${spaceName}::${field}`;
}

export function indexDifferencesByCell(differences: CalibrationDifference[]): Map<string, CalibrationDifference> {
  return new Map(differences.map((difference) => [differenceKey(difference.space_name, difference.field), difference]));
}

export function curtainWallCalibrationTarget(row: QuantityRow, difference?: CalibrationDifference): number | null {
  if (!difference || difference.field !== "curtain_wall_width_m") {
    return null;
  }
  if (!CURTAIN_CALIBRATION_SOURCES.has(row.curtainWallWidthSource)) {
    return null;
  }
  if (!Number.isFinite(difference.expected) || difference.expected < 0) {
    return null;
  }
  return Math.round(difference.expected * 100) / 100;
}
