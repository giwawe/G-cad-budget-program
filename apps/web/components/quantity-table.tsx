import { AlertTriangle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";
import { curtainWallCalibrationTarget, differenceKey, indexDifferencesByCell } from "@/lib/calibration-differences";
import { quantityRowAnchorId } from "@/lib/quantity-row-anchor";
import type { CalibrationDifference, CurtainWallWidthSource, QuantityRow, ReviewStatus } from "@/lib/types";

const statusLabels: Record<ReviewStatus, string> = {
  pending_review: "待确认",
  confirmed: "已确认",
  needs_fix: "需修图",
  excluded: "不计价",
};

const statusIcons: Record<ReviewStatus, React.ReactNode> = {
  pending_review: <CircleDashed aria-hidden="true" size={16} />,
  confirmed: <CheckCircle2 aria-hidden="true" size={16} />,
  needs_fix: <AlertTriangle aria-hidden="true" size={16} />,
  excluded: <MinusCircle aria-hidden="true" size={16} />,
};

const curtainWallSourceLabels: Record<CurtainWallWidthSource, string> = {
  matched_window_wall: "窗所在墙",
  matched_l_shape_window: "L形窗自动",
  fallback_longest_wall: "回退最长墙",
  not_applicable: "不适用",
  manual_required_l_shape_window: "L形窗人工确认",
  manual: "人工校准",
};

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

export function QuantityTable({
  rows,
  differences = [],
  onChangeStatus,
  onChangeCurtainWallWidth,
}: {
  rows: QuantityRow[];
  differences?: CalibrationDifference[];
  onChangeStatus?: (spaceName: string, status: ReviewStatus) => void;
  onChangeCurtainWallWidth?: (spaceName: string, widthM: number, source?: "manual" | "calibration") => void;
}) {
  const differencesByCell = indexDifferencesByCell(differences);

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>楼层</th>
            <th>空间</th>
            <th>类型</th>
            <th>地面面积</th>
            <th>墙线长度</th>
            <th>层高</th>
            <th>窗台石长度</th>
            <th>窗帘墙宽候选</th>
            <th>窗洞面积</th>
            <th>门洞扣减</th>
            <th>室内门数</th>
            <th>卫生间门</th>
            <th>推拉门面积</th>
            <th>推拉门门套</th>
            <th>乳胶漆面积</th>
            <th>贴砖墙长</th>
            <th>墙砖面积</th>
            <th>橱柜地柜</th>
            <th>橱柜吊柜</th>
            <th>全屋定制</th>
            <th>马桶</th>
            <th>浴室柜</th>
            <th>防水面积</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const floorAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "floor_area_m2"));
            const wallLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "wall_measure_length_m"));
            const windowsillDifference = differencesByCell.get(differenceKey(row.spaceName, "windowsill_length_m"));
            const curtainWallDifference = differencesByCell.get(differenceKey(row.spaceName, "curtain_wall_width_m"));
            const curtainWallCalibrationValue = curtainWallCalibrationTarget(row, curtainWallDifference);
            const windowAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "window_area_m2"));
            const doorDeductDifference = differencesByCell.get(differenceKey(row.spaceName, "door_deduct_area_m2"));
            const interiorDoorCountDifference = differencesByCell.get(differenceKey(row.spaceName, "interior_door_count"));
            const bathroomDoorCountDifference = differencesByCell.get(differenceKey(row.spaceName, "bathroom_door_count"));
            const slidingDoorAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "sliding_door_area_m2"));
            const slidingDoorCasingLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "sliding_door_casing_length_m"));
            const latexPaintDifference = differencesByCell.get(differenceKey(row.spaceName, "latex_paint_area_m2"));
            const wallTileLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "wall_tile_measure_length_m"));
            const wallTileDifference = differencesByCell.get(differenceKey(row.spaceName, "wall_tile_area_m2"));
            const kitchenBaseCabinetLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "kitchen_base_cabinet_length_m"));
            const kitchenWallCabinetLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "kitchen_wall_cabinet_length_m"));
            const customCabinetAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "custom_cabinet_area_m2"));
            const toiletCountDifference = differencesByCell.get(differenceKey(row.spaceName, "toilet_count"));
            const bathroomVanityCountDifference = differencesByCell.get(differenceKey(row.spaceName, "bathroom_vanity_count"));
            const waterproofDifference = differencesByCell.get(differenceKey(row.spaceName, "waterproof_area_m2"));
            return (
            <tr id={quantityRowAnchorId(row.spaceName)} key={`${row.floor}-${row.spaceName}-${index}`} className={differences.some((difference) => difference.space_name === row.spaceName) ? "quantityDiffRow" : undefined}>
              <td>{row.floor}</td>
              <td>
                <strong>{row.spaceName}</strong>
                <span>{row.evidence}</span>
              </td>
              <td>{row.spaceType}</td>
              <td className={differenceClass(floorAreaDifference)}>
                {row.floorAreaM2.toFixed(2)} m2
                <DifferenceValue difference={floorAreaDifference} />
              </td>
              <td className={differenceClass(wallLengthDifference)}>
                {row.wallMeasureLengthM.toFixed(2)} m
                <DifferenceValue difference={wallLengthDifference} />
              </td>
              <td>{row.heightM.toFixed(2)} m</td>
              <td className={differenceClass(windowsillDifference)}>
                {row.windowsillLengthM.toFixed(2)} m
                <DifferenceValue difference={windowsillDifference} />
              </td>
              <td className={differenceClass(curtainWallDifference)}>
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
                  `${row.curtainWallWidthM.toFixed(2)} m`
                )}
                <small className={`curtainWallSource ${row.curtainWallWidthSource}`}>{curtainWallSourceLabels[row.curtainWallWidthSource]}</small>
                {row.curtainWallWidthSource === "manual_required_l_shape_window" && <small className="curtainWallHelp">请填实际窗帘/窗帘箱延米</small>}
                {onChangeCurtainWallWidth && curtainWallCalibrationValue !== null && (
                  <button className="inlineApplyButton" type="button" onClick={() => onChangeCurtainWallWidth(row.spaceName, curtainWallCalibrationValue, "calibration")}>
                    应用校准 {curtainWallCalibrationValue.toFixed(2)} m
                  </button>
                )}
                <DifferenceValue difference={curtainWallDifference} />
              </td>
              <td className={differenceClass(windowAreaDifference)}>
                {row.windowAreaM2.toFixed(2)} m2
                <DifferenceValue difference={windowAreaDifference} />
              </td>
              <td className={differenceClass(doorDeductDifference)}>
                {row.doorDeductAreaM2.toFixed(2)} m2
                <DifferenceValue difference={doorDeductDifference} />
              </td>
              <td className={differenceClass(interiorDoorCountDifference)}>
                {row.interiorDoorCount} 樘
                <DifferenceValue difference={interiorDoorCountDifference} />
              </td>
              <td className={differenceClass(bathroomDoorCountDifference)}>
                {row.bathroomDoorCount} 樘
                <DifferenceValue difference={bathroomDoorCountDifference} />
              </td>
              <td className={differenceClass(slidingDoorAreaDifference)}>
                {row.slidingDoorAreaM2.toFixed(2)} m2
                <DifferenceValue difference={slidingDoorAreaDifference} />
              </td>
              <td className={differenceClass(slidingDoorCasingLengthDifference)}>
                {row.slidingDoorCasingLengthM.toFixed(2)} m
                <DifferenceValue difference={slidingDoorCasingLengthDifference} />
              </td>
              <td className={differenceClass(latexPaintDifference)}>
                {row.latexPaintAreaM2.toFixed(2)} m2
                <DifferenceValue difference={latexPaintDifference} />
              </td>
              <td className={differenceClass(wallTileLengthDifference)}>
                {row.wallTileMeasureLengthM.toFixed(2)} m
                <DifferenceValue difference={wallTileLengthDifference} />
              </td>
              <td className={differenceClass(wallTileDifference)}>
                {row.wallTileAreaM2.toFixed(2)} m2
                <DifferenceValue difference={wallTileDifference} />
              </td>
              <td className={differenceClass(kitchenBaseCabinetLengthDifference)}>
                {row.kitchenBaseCabinetLengthM.toFixed(2)} m
                <DifferenceValue difference={kitchenBaseCabinetLengthDifference} />
              </td>
              <td className={differenceClass(kitchenWallCabinetLengthDifference)}>
                {row.kitchenWallCabinetLengthM.toFixed(2)} m
                <DifferenceValue difference={kitchenWallCabinetLengthDifference} />
              </td>
              <td className={differenceClass(customCabinetAreaDifference)}>
                {row.customCabinetAreaM2.toFixed(2)} m2
                <DifferenceValue difference={customCabinetAreaDifference} />
              </td>
              <td className={differenceClass(toiletCountDifference)}>
                {row.toiletCount} 个
                <DifferenceValue difference={toiletCountDifference} />
              </td>
              <td className={differenceClass(bathroomVanityCountDifference)}>
                {row.bathroomVanityCount} 套
                <DifferenceValue difference={bathroomVanityCountDifference} />
              </td>
              <td className={differenceClass(waterproofDifference)}>
                {row.waterproofAreaM2.toFixed(2)} m2
                <DifferenceValue difference={waterproofDifference} />
              </td>
              <td>
                <div className={`status ${row.status}`}>
                  {statusIcons[row.status]}
                  {statusLabels[row.status]}
                </div>
                {onChangeStatus && (
                  <select
                    aria-label={`${row.spaceName} 状态`}
                    className="statusSelect"
                    value={row.status}
                    onChange={(event) => onChangeStatus(row.spaceName, event.target.value as ReviewStatus)}
                  >
                    <option value="pending_review">待确认</option>
                    <option value="confirmed">已确认</option>
                    <option value="needs_fix">需修图</option>
                    <option value="excluded">不计价</option>
                  </select>
                )}
                {row.anomalies.length > 0 && <small>{row.anomalies.join("；")}</small>}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
