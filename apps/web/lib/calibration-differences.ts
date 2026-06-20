import type { CalibrationDifference } from "./types";

export function differenceKey(spaceName: string, field: string): string {
  return `${spaceName}::${field}`;
}

export function indexDifferencesByCell(differences: CalibrationDifference[]): Map<string, CalibrationDifference> {
  return new Map(differences.map((difference) => [differenceKey(difference.space_name, difference.field), difference]));
}
