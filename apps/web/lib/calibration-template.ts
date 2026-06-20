import type { QuantityRow } from "./types";

export type CalibrationTemplateRow = {
  space_name: string;
  space_type: string;
  floor_area_m2: number;
  wall_measure_length_m: number;
  window_width_total_m: number;
  window_area_m2: number;
  door_width_total_m: number;
  door_deduct_area_m2: number;
  wall_gross_area_m2: number;
  latex_paint_area_m2: number;
  status: QuantityRow["status"];
  anomalies: string[];
};

export function quantityRowsToCalibrationTemplate(rows: QuantityRow[]): CalibrationTemplateRow[] {
  return rows.map((row) => ({
    space_name: row.spaceName,
    space_type: row.spaceType,
    floor_area_m2: row.floorAreaM2,
    wall_measure_length_m: row.wallMeasureLengthM,
    window_width_total_m: row.windowWidthTotalM,
    window_area_m2: row.windowAreaM2,
    door_width_total_m: row.doorWidthTotalM,
    door_deduct_area_m2: row.doorDeductAreaM2,
    wall_gross_area_m2: row.wallGrossAreaM2,
    latex_paint_area_m2: row.latexPaintAreaM2,
    status: row.status,
    anomalies: row.anomalies,
  }));
}

export function calibrationTemplateFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "calibration-template.json";
  }
  const withoutExtension = trimmed.replace(/\.[^.]+$/, "");
  return `${withoutExtension}.calibration.json`;
}
