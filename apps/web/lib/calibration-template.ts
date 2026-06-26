import type { QuantityRow, QuantitySummary } from "./types";

export type CalibrationTemplateRow = {
  space_name: string;
  space_type: string;
  floor_area_m2: number;
  ceiling_finish_type: QuantityRow["ceilingFinishType"];
  wall_measure_length_m: number;
  window_width_total_m: number;
  windowsill_length_m: number;
  curtain_wall_width_m: number;
  curtain_wall_width_source: QuantityRow["curtainWallWidthSource"];
  window_area_m2: number;
  door_width_total_m: number;
  door_deduct_area_m2: number;
  wall_gross_area_m2: number;
  latex_paint_area_m2: number;
  wall_tile_measure_length_m: number;
  wall_tile_area_m2: number;
  floor_tile_piece_count: number;
  electrical_scope_area_m2: number;
  plumbing_scope_area_m2: number;
  new_wall_length_m: number;
  new_wall_area_m2: number;
  demolition_wall_length_m: number;
  demolition_wall_area_m2: number;
  interior_door_count: number;
  bathroom_door_count: number;
  sliding_door_area_m2: number;
  sliding_door_casing_length_m: number;
  kitchen_base_cabinet_length_m: number;
  kitchen_wall_cabinet_length_m: number;
  custom_cabinet_area_m2: number;
  toilet_count: number;
  bathroom_vanity_count: number;
  status: QuantityRow["status"];
  anomalies: string[];
};

export type CalibrationTemplate = CalibrationTemplateRow[] | {
  summary: {
    building_area_m2: number;
  };
  rows: CalibrationTemplateRow[];
};

export function quantityRowsToCalibrationTemplate(rows: QuantityRow[], summary?: QuantitySummary | null): CalibrationTemplate {
  const templateRows = rows.map((row) => ({
    space_name: row.spaceName,
    space_type: row.spaceType,
    floor_area_m2: row.floorAreaM2,
    ceiling_finish_type: row.ceilingFinishType ?? defaultCeilingFinishType(row.spaceType),
    wall_measure_length_m: row.wallMeasureLengthM,
    window_width_total_m: row.windowWidthTotalM,
    windowsill_length_m: row.windowsillLengthM,
    curtain_wall_width_m: row.curtainWallWidthM,
    curtain_wall_width_source: row.curtainWallWidthSource,
    window_area_m2: row.windowAreaM2,
    door_width_total_m: row.doorWidthTotalM,
    door_deduct_area_m2: row.doorDeductAreaM2,
    wall_gross_area_m2: row.wallGrossAreaM2,
    latex_paint_area_m2: row.latexPaintAreaM2,
    wall_tile_measure_length_m: row.wallTileMeasureLengthM,
    wall_tile_area_m2: row.wallTileAreaM2,
    floor_tile_piece_count: row.floorTilePieceCount,
    electrical_scope_area_m2: row.electricalScopeAreaM2,
    plumbing_scope_area_m2: row.plumbingScopeAreaM2,
    new_wall_length_m: row.newWallLengthM,
    new_wall_area_m2: row.newWallAreaM2,
    demolition_wall_length_m: row.demolitionWallLengthM,
    demolition_wall_area_m2: row.demolitionWallAreaM2,
    interior_door_count: row.interiorDoorCount,
    bathroom_door_count: row.bathroomDoorCount,
    sliding_door_area_m2: row.slidingDoorAreaM2,
    sliding_door_casing_length_m: row.slidingDoorCasingLengthM,
    kitchen_base_cabinet_length_m: row.kitchenBaseCabinetLengthM,
    kitchen_wall_cabinet_length_m: row.kitchenWallCabinetLengthM,
    custom_cabinet_area_m2: row.customCabinetAreaM2,
    toilet_count: row.toiletCount,
    bathroom_vanity_count: row.bathroomVanityCount,
    status: row.status,
    anomalies: row.anomalies,
  }));
  if (!summary) {
    return templateRows;
  }
  return {
    summary: {
      building_area_m2: summary.building_area_m2,
    },
    rows: templateRows,
  };
}

function defaultCeilingFinishType(spaceType: string): QuantityRow["ceilingFinishType"] {
  return spaceType === "厨房" || spaceType === "卫生间" ? "integrated" : "gypsum";
}

export function calibrationTemplateFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "calibration-template.json";
  }
  const withoutExtension = trimmed.replace(/\.[^.]+$/, "");
  return `${withoutExtension}.calibration.json`;
}
