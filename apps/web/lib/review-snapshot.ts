import type { CalibrationComparison, QuantityRow, QuantitySummary } from "./types";

export type ReviewSnapshot = {
  exported_at: string;
  source_file: string;
  calibration_file: string | null;
  summary: QuantitySummary | null;
  comparison: CalibrationComparison | null;
  rows: QuantityRow[];
};

export function buildReviewSnapshot({
  fileName,
  calibrationFileName,
  rows,
  summary,
  comparison,
}: {
  fileName: string;
  calibrationFileName: string;
  rows: QuantityRow[];
  summary: QuantitySummary | null;
  comparison: CalibrationComparison | null;
}): ReviewSnapshot {
  return {
    exported_at: new Date().toISOString(),
    source_file: fileName,
    calibration_file: calibrationFileName || null,
    summary,
    comparison,
    rows,
  };
}

export function reviewSnapshotFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "review-snapshot.json";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.review-snapshot.json`;
}

export function parseReviewSnapshot(content: string): ReviewSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("快照 JSON 格式无效");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("快照 JSON 格式无效");
  }
  const snapshot = parsed as Partial<ReviewSnapshot>;
  if (typeof snapshot.source_file !== "string" || !snapshot.source_file.trim()) {
    throw new Error("快照缺少 source_file");
  }
  if (!Array.isArray(snapshot.rows)) {
    throw new Error("快照缺少 rows");
  }
  return {
    exported_at: typeof snapshot.exported_at === "string" ? snapshot.exported_at : "",
    source_file: snapshot.source_file,
    calibration_file: typeof snapshot.calibration_file === "string" ? snapshot.calibration_file : null,
    summary: snapshot.summary ?? null,
    comparison: snapshot.comparison ?? null,
    rows: snapshot.rows.map(normalizeSnapshotRow),
  };
}

function normalizeSnapshotRow(row: QuantityRow): QuantityRow {
  return {
    ...row,
    windowsillLengthM: typeof row.windowsillLengthM === "number" ? row.windowsillLengthM : row.windowWidthTotalM,
    curtainWallWidthM: typeof row.curtainWallWidthM === "number" ? row.curtainWallWidthM : 0,
    curtainWallWidthSource: row.curtainWallWidthSource ?? "not_applicable",
    wallTileMeasureLengthM: typeof row.wallTileMeasureLengthM === "number" ? row.wallTileMeasureLengthM : 0,
    wallTileAreaM2: typeof row.wallTileAreaM2 === "number" ? row.wallTileAreaM2 : 0,
    newWallLengthM: typeof row.newWallLengthM === "number" ? row.newWallLengthM : 0,
    newWallAreaM2: typeof row.newWallAreaM2 === "number" ? row.newWallAreaM2 : 0,
    demolitionWallLengthM: typeof row.demolitionWallLengthM === "number" ? row.demolitionWallLengthM : 0,
    demolitionWallAreaM2: typeof row.demolitionWallAreaM2 === "number" ? row.demolitionWallAreaM2 : 0,
    interiorDoorCount: typeof row.interiorDoorCount === "number" ? row.interiorDoorCount : 0,
    kitchenCabinetLengthM: typeof row.kitchenCabinetLengthM === "number" ? row.kitchenCabinetLengthM : 0,
    waterproofAreaM2: typeof row.waterproofAreaM2 === "number" ? row.waterproofAreaM2 : 0,
  };
}
