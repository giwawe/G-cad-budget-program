"use client";

import { aggregateHydropowerQuoteSummary } from "@/lib/hydropower-quote-aggregation";
import type { HydropowerEstimate, HydropowerPoint, HydropowerPointKind } from "@/lib/types";

type Props = {
  estimate: HydropowerEstimate | null;
  onConfirm: () => void;
  onPointQuantityChange: (id: string, quantity: number) => void;
};

const KIND_LABELS: Record<HydropowerPointKind, string> = {
  switch: "开关点位",
  standard_outlet: "普通插座点位",
  sofa_charging_outlet: "沙发充电插座",
  heating_outlet: "取暖设备插座",
  bed_end_fan_outlet: "床尾风扇插座",
  kitchen_counter_outlet: "厨房台面插座",
  light: "灯位点位",
  weak_point: "弱电点位",
  ac_circuit: "空调专线",
  high_power_circuit: "大功率电器专线",
  bathroom_heater_circuit: "浴霸/暖风机专线",
  smart_toilet_outlet: "智能马桶插座",
  washing_machine_outlet: "洗衣机插座",
  dryer_outlet: "烘干机插座",
  water_purifier_outlet: "净水机插座",
  cold_water: "冷水点位",
  hot_water: "热水点位",
  drain: "排水点位",
  floor_drain: "地漏",
};

function groupPointsBySpace(points: HydropowerPoint[]) {
  const grouped = new Map<string, HydropowerPoint[]>();
  for (const point of points) {
    const key = `${point.floor}｜${point.spaceName}`;
    const current = grouped.get(key);
    if (current) {
      current.push(point);
      continue;
    }
    grouped.set(key, [point]);
  }
  return [...grouped.entries()];
}

function groupPointsBySpaceType(points: HydropowerPoint[]) {
  const grouped = new Map<string, { pointCount: number; spaces: Set<string> }>();
  for (const point of points) {
    const key = point.spaceType || "其他";
    const current = grouped.get(key) ?? { pointCount: 0, spaces: new Set<string>() };
    current.pointCount += Math.max(point.quantity, 0);
    current.spaces.add(`${point.floor}｜${point.spaceName}`);
    grouped.set(key, current);
  }
  return [...grouped.entries()].map(([spaceType, summary]) => ({
    spaceType,
    pointCount: summary.pointCount,
    spaceCount: summary.spaces.size,
  }));
}

function formatPipeLength(length: number) {
  return `${length.toFixed(2)} M`;
}

function formatCount(count: number) {
  return `${count.toFixed(0)} 位`;
}

export function HydropowerReviewPanel({ estimate, onConfirm, onPointQuantityChange }: Props) {
  if (!estimate) {
    return null;
  }

  const quoteSummary = aggregateHydropowerQuoteSummary(estimate.summary);
  const groupedPoints = groupPointsBySpace(estimate.points);
  const groupedSpaceTypes = groupPointsBySpaceType(estimate.points);
  const reviewStatusLabel =
    estimate.reviewStatus === "confirmed"
      ? "已确定"
      : estimate.reviewStatus === "needs_review"
        ? "已修改，待确认"
        : "";
  const confirmLabel = estimate.reviewStatus === "needs_review" ? "确认修改" : "确定水电点位";

  return (
    <section className="reviewSection hydropowerReviewPanel">
      <div className="sectionHeader">
        <div>
          <h2>水电点位复核</h2>
          <p>汇总数量会带入预算导出；各空间点位明细默认收起，需要调整时展开修改。</p>
        </div>
        <div className="hydropowerConfirmActions">
          {reviewStatusLabel && <strong>{reviewStatusLabel}</strong>}
          <button type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>

      <div className="summaryCards">
        <div><span>强电插座</span><strong>{formatCount(quoteSummary.strongOutletCount)}</strong></div>
        <div><span>开关</span><strong>{formatCount(quoteSummary.switchCount)}</strong></div>
        <div><span>灯位</span><strong>{formatCount(quoteSummary.lightCount)}</strong></div>
        <div><span>设备专线</span><strong>{formatCount(quoteSummary.equipmentCircuitCount)}</strong></div>
        <div><span>弱电点位</span><strong>{formatCount(quoteSummary.weakPointCount)}</strong></div>
        <div><span>给水点</span><strong>{formatCount(quoteSummary.waterSupplyPointCount)}</strong></div>
        <div><span>热水点</span><strong>{formatCount(quoteSummary.hotWaterPointCount)}</strong></div>
        <div><span>排水点</span><strong>{formatCount(quoteSummary.drainagePointCount)}</strong></div>
        <div><span>强电线管</span><strong>{formatPipeLength(estimate.summary.strongConduitLengthM)}</strong></div>
        <div><span>弱电线管</span><strong>{formatPipeLength(estimate.summary.weakConduitLengthM)}</strong></div>
        <div><span>给水管</span><strong>{formatPipeLength(estimate.summary.waterPipeLengthM)}</strong></div>
        <div><span>排水管</span><strong>{formatPipeLength(estimate.summary.drainPipeLengthM)}</strong></div>
        <div><span>低置信点位</span><strong>{estimate.summary.lowConfidencePointCount}</strong></div>
      </div>

      <div className="hydropowerCategoryGrid" aria-label="水电点位空间类别摘要">
        {groupedSpaceTypes.map((group) => (
          <div className="hydropowerCategoryCard" key={group.spaceType}>
            <strong>{group.spaceType}</strong>
            <span>{group.spaceCount} 个空间</span>
            <em>{group.pointCount.toFixed(0)} 个点位</em>
          </div>
        ))}
      </div>

      <details className="hydropowerAdvancedDetails">
        <summary>查看各空间点位明细</summary>
        <div className="healthList">
          {groupedPoints.map(([group, points]) => (
            <details className="healthCard info hydropowerSpaceDetails" key={group}>
              <summary>
                <strong>{group}</strong>
                <span>{points.length} 个推荐点位</span>
              </summary>
              <div className="hydropowerPointGrid">
                {points.map((point) => (
                  <label className="hydropowerPointItem" key={point.id}>
                    <span>
                      <strong>{KIND_LABELS[point.kind] ?? point.label}</strong>
                      <small>{point.note}</small>
                    </span>
                    <input
                      aria-label={`${point.spaceName} ${point.label} 数量`}
                      min="0"
                      step="1"
                      type="number"
                      value={point.quantity}
                      onChange={(event) => onPointQuantityChange(point.id, Number(event.target.value))}
                    />
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
      </details>
    </section>
  );
}
