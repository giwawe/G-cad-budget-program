"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { curtainWallCalibrationTarget, differenceKey, indexDifferencesByCell } from "@/lib/calibration-differences";
import { compareFloors } from "@/lib/floor-sort";
import { quantityRowAnchorId } from "@/lib/quantity-row-anchor";
import type { CalibrationDifference, CeilingFinishType, CurtainWallWidthSource, QuantityRow, ReviewStatus } from "@/lib/types";

const statusLabels: Record<ReviewStatus, string> = {
  pending_review: "",
  confirmed: "已确认",
  needs_fix: "需修图",
  excluded: "不计价",
};

const statusIcons: Partial<Record<ReviewStatus, ReactNode>> = {
  confirmed: <CheckCircle2 aria-hidden="true" size={16} />,
  needs_fix: <AlertTriangle aria-hidden="true" size={16} />,
  excluded: <MinusCircle aria-hidden="true" size={16} />,
};

const curtainWallSourceLabels: Record<CurtainWallWidthSource, string> = {
  matched_window_wall: "窗所在墙",
  matched_l_shape_window: "L形窗自动",
  fallback_longest_wall: "回退最长墙",
  not_applicable: "不适用",
  manual_required_l_shape_window: "旧版L形窗",
  manual: "人工校准",
};

const OPTIONAL_CEILING_FINISH_SPACE_TYPES = new Set(["厨房", "卫生间"]);
const QUOTE_SPACE_TYPE_GROUPS = [
  { label: "普通干区", options: ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "挑空"] },
  { label: "湿区", options: ["厨房", "卫生间", "阳台", "露台", "洗衣房"] },
  { label: "楼梯/交通", options: ["楼梯", "楼梯过道"] },
  { label: "收纳/其他", options: ["衣帽间", "储物间", "外墙", "其他"] },
];
const QUOTE_SPACE_TYPE_OPTIONS = QUOTE_SPACE_TYPE_GROUPS.flatMap((group) => group.options);

function DifferenceValue({ difference }: { difference?: CalibrationDifference }) {
  if (!difference) {
    return null;
  }
  return (
    <small className="differenceValue">
      校准 {difference.expected}，差值 {difference.delta > 0 ? "+" : ""}
      {difference.delta} ({difference.percent_delta}%)
    </small>
  );
}

function differenceClass(difference?: CalibrationDifference) {
  return difference ? "quantityDiffCell" : undefined;
}

function QuantityStatusBadge({ status }: { status: ReviewStatus }) {
  if (status === "pending_review") {
    return null;
  }
  return (
    <div className={`status ${status}`}>
      {statusIcons[status]}
      {statusLabels[status]}
    </div>
  );
}

function QuantityMetric({
  label,
  value,
  unit,
  difference,
}: {
  label: string;
  value: number;
  unit: string;
  difference?: CalibrationDifference;
}) {
  return (
    <div className={differenceClass(difference)}>
      <span>{label}</span>
      <strong>{value.toFixed(2)} {unit}</strong>
      <DifferenceValue difference={difference} />
    </div>
  );
}

export function QuantityTable({
  rows,
  differences = [],
  onChangeStatus,
  onChangeSpaceType,
  onChangeCurtainWallWidth,
  onChangeCeilingFinishType,
}: {
  rows: QuantityRow[];
  differences?: CalibrationDifference[];
  onChangeStatus?: (spaceName: string, status: ReviewStatus) => void;
  onChangeSpaceType?: (spaceName: string, spaceType: string) => void;
  onChangeCurtainWallWidth?: (spaceName: string, widthM: number, source?: "manual" | "calibration") => void;
  onChangeCeilingFinishType?: (spaceName: string, finishType: CeilingFinishType) => void;
}) {
  const differencesByCell = indexDifferencesByCell(differences);
  const displayRows = rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => compareFloors(left.row.floor, right.row.floor) || left.index - right.index);
  const anomalyCount = displayRows.filter(({ row }) => row.anomalies.length > 0).length;
  const [isSummaryOpen, setIsSummaryOpen] = useState(() => anomalyCount > 0);

  useEffect(() => {
    if (anomalyCount > 0) {
      setIsSummaryOpen(true);
    }
  }, [anomalyCount]);

  return (
    <div className="quantityReviewShell">
      <details className="quantityCardsDetails" open={isSummaryOpen} onToggle={(event) => setIsSummaryOpen(event.currentTarget.open)}>
        <summary>
          <strong>{anomalyCount > 0 ? `${anomalyCount} 个空间需要确认` : `查看空间工程量摘要（${displayRows.length} 个空间）`}</strong>
          <span>设计师可修改计价类型、顶面口径和窗帘墙宽，核对后确认空间。</span>
        </summary>
        <div className="quantityCardGrid">
          {displayRows.map(({ row, index }) => {
            const spaceTypeOptions = QUOTE_SPACE_TYPE_OPTIONS.includes(row.spaceType) ? QUOTE_SPACE_TYPE_OPTIONS : [row.spaceType, ...QUOTE_SPACE_TYPE_OPTIONS];
            const floorAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "floor_area_m2"));
            const wallLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "wall_measure_length_m"));
            const curtainWallDifference = differencesByCell.get(differenceKey(row.spaceName, "curtain_wall_width_m"));
            const curtainWallCalibrationValue = curtainWallCalibrationTarget(row, curtainWallDifference);
            const windowAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "window_area_m2"));
            const latexPaintDifference = differencesByCell.get(differenceKey(row.spaceName, "latex_paint_area_m2"));
            const waterproofDifference = differencesByCell.get(differenceKey(row.spaceName, "waterproof_area_m2"));
            return (
              <article className={`quantitySpaceCard ${row.status}`} id={quantityRowAnchorId(row.spaceName)} key={`${row.floor}-${row.spaceName}-${index}`}>
                <div className="quantitySpaceHeader">
                  <span>{row.floor}</span>
                  <strong>{row.spaceName}</strong>
                  <QuantityStatusBadge status={row.status} />
                </div>
                <div className="quantitySpaceControls">
                  {onChangeSpaceType ? (
                    <label>
                      <span>计价类型</span>
                      <select
                        aria-label={`${row.spaceName} 空间类型`}
                        className="statusSelect"
                        value={row.spaceType}
                        onChange={(event) => onChangeSpaceType(row.spaceName, event.target.value)}
                      >
                        {spaceTypeOptions.filter((spaceType) => !QUOTE_SPACE_TYPE_OPTIONS.includes(spaceType)).map((spaceType) => (
                          <option key={spaceType} value={spaceType}>
                            {spaceType}
                          </option>
                        ))}
                        {QUOTE_SPACE_TYPE_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.options.map((spaceType) => (
                              <option key={spaceType} value={spaceType}>
                                {spaceType}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span>{row.spaceType}</span>
                  )}
                  {OPTIONAL_CEILING_FINISH_SPACE_TYPES.has(row.spaceType) && onChangeCeilingFinishType && (
                    <label>
                      <span>顶面类型</span>
                      <select
                        aria-label={`${row.spaceName} 顶面类型`}
                        className="statusSelect"
                        value={row.ceilingFinishType ?? "integrated"}
                        onChange={(event) => onChangeCeilingFinishType(row.spaceName, event.target.value as CeilingFinishType)}
                      >
                        <option value="integrated">集成吊顶</option>
                        <option value="gypsum">石膏板吊顶</option>
                      </select>
                    </label>
                  )}
                </div>
                <div className="quantityMetricGrid">
                  <QuantityMetric label="地面" value={row.floorAreaM2} unit="m2" difference={floorAreaDifference} />
                  <QuantityMetric label="墙线" value={row.wallMeasureLengthM} unit="m" difference={wallLengthDifference} />
                  <QuantityMetric label="窗洞" value={row.windowAreaM2} unit="m2" difference={windowAreaDifference} />
                  <QuantityMetric label="乳胶漆" value={row.latexPaintAreaM2} unit="m2" difference={latexPaintDifference} />
                  <QuantityMetric label="防水" value={row.waterproofAreaM2} unit="m2" difference={waterproofDifference} />
                  <div className={differenceClass(curtainWallDifference)}>
                    <span>窗帘墙宽</span>
                    {onChangeCurtainWallWidth ? (
                      <label className="inlineNumberField">
                        <input
                          aria-label={`${row.spaceName} 窗帘墙宽候选`}
                          min="0"
                          step="0.01"
                          type="number"
                          value={row.curtainWallWidthM}
                          onChange={(event) => onChangeCurtainWallWidth(row.spaceName, Number(event.target.value))}
                        />
                        <span>m</span>
                      </label>
                    ) : (
                      <strong>{row.curtainWallWidthM.toFixed(2)} m</strong>
                    )}
                    <small className={`curtainWallSource ${row.curtainWallWidthSource}`}>{curtainWallSourceLabels[row.curtainWallWidthSource]}</small>
                    {onChangeCurtainWallWidth && curtainWallCalibrationValue !== null && (
                      <button className="inlineApplyButton" type="button" onClick={() => onChangeCurtainWallWidth(row.spaceName, curtainWallCalibrationValue, "calibration")}>
                        应用校准 {curtainWallCalibrationValue.toFixed(2)} m
                      </button>
                    )}
                    <DifferenceValue difference={curtainWallDifference} />
                  </div>
                </div>
                {row.anomalies.length > 0 && <small className="quantityAnomalies">{row.anomalies.join("；")}</small>}
                {onChangeStatus && (
                  <div className="quantityCardActions">
                    {row.status !== "confirmed" && <button type="button" onClick={() => onChangeStatus(row.spaceName, "confirmed")}>确认本空间</button>}
                    {row.status !== "needs_fix" && <button type="button" onClick={() => onChangeStatus(row.spaceName, "needs_fix")}>需修图</button>}
                    {row.status !== "excluded" && <button type="button" onClick={() => onChangeStatus(row.spaceName, "excluded")}>不计价</button>}
                  </div>
                )}
                <details className="quantityEvidence" open={row.anomalies.length > 0}>
                  <summary>计算依据</summary>
                  <p>{row.evidence}</p>
                </details>
              </article>
            );
          })}
        </div>
      </details>
    </div>
  );
}
