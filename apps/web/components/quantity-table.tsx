import { AlertTriangle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";
import { differenceKey, indexDifferencesByCell } from "@/lib/calibration-differences";
import type { CalibrationDifference, QuantityRow, ReviewStatus } from "@/lib/types";

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
}: {
  rows: QuantityRow[];
  differences?: CalibrationDifference[];
  onChangeStatus?: (spaceName: string, status: ReviewStatus) => void;
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
            <th>窗洞面积</th>
            <th>门洞扣减</th>
            <th>乳胶漆面积</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const floorAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "floor_area_m2"));
            const wallLengthDifference = differencesByCell.get(differenceKey(row.spaceName, "wall_measure_length_m"));
            const windowAreaDifference = differencesByCell.get(differenceKey(row.spaceName, "window_area_m2"));
            const doorDeductDifference = differencesByCell.get(differenceKey(row.spaceName, "door_deduct_area_m2"));
            const latexPaintDifference = differencesByCell.get(differenceKey(row.spaceName, "latex_paint_area_m2"));
            return (
            <tr key={`${row.floor}-${row.spaceName}`} className={differences.some((difference) => difference.space_name === row.spaceName) ? "quantityDiffRow" : undefined}>
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
              <td className={differenceClass(windowAreaDifference)}>
                {row.windowAreaM2.toFixed(2)} m2
                <DifferenceValue difference={windowAreaDifference} />
              </td>
              <td className={differenceClass(doorDeductDifference)}>
                {row.doorDeductAreaM2.toFixed(2)} m2
                <DifferenceValue difference={doorDeductDifference} />
              </td>
              <td className={differenceClass(latexPaintDifference)}>
                {row.latexPaintAreaM2.toFixed(2)} m2
                <DifferenceValue difference={latexPaintDifference} />
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
