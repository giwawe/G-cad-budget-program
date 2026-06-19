import { AlertTriangle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";
import type { QuantityRow, ReviewStatus } from "@/lib/types";

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

export function QuantityTable({ rows }: { rows: QuantityRow[] }) {
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
            <th>乳胶漆面积</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.floor}-${row.spaceName}`}>
              <td>{row.floor}</td>
              <td>
                <strong>{row.spaceName}</strong>
                <span>{row.evidence}</span>
              </td>
              <td>{row.spaceType}</td>
              <td>{row.floorAreaM2.toFixed(2)} m2</td>
              <td>{row.wallMeasureLengthM.toFixed(2)} m</td>
              <td>{row.heightM.toFixed(2)} m</td>
              <td>{row.windowAreaM2.toFixed(2)} m2</td>
              <td>{row.latexPaintAreaM2.toFixed(2)} m2</td>
              <td>
                <div className={`status ${row.status}`}>
                  {statusIcons[row.status]}
                  {statusLabels[row.status]}
                </div>
                {row.anomalies.length > 0 && <small>{row.anomalies.join("；")}</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
