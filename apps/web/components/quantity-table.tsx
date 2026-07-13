import { AlertTriangle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";
import { curtainWallCalibrationTarget, differenceKey, indexDifferencesByCell } from "@/lib/calibration-differences";
import { compareFloors } from "@/lib/floor-sort";
import { quantityRowAnchorId } from "@/lib/quantity-row-anchor";
import type { CalibrationDifference, CeilingFinishType, CurtainWallWidthSource, QuantityRow, ReviewStatus } from "@/lib/types";

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
  manual_required_l_shape_window: "旧版L形窗",
  manual: "人工校准",
};

const ceilingFinishLabels: Record<CeilingFinishType, string> = {
  integrated: "集成吊顶",
  gypsum: "石膏板吊顶",
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

  return (
    <div className="quantityReviewShell">
      <div className="quantityCardGrid">
        {displayRows.map(({ row, index }) => {
          const spaceTypeOptions = QUOTE_SPACE_TYPE_OPTIONS.includes(row.spaceType) ? QUOTE_SPACE_TYPE_OPTIONS : [row.spaceType, ...QUOTE_SPACE_TYPE_OPTIONS];
          return (
            <article className={`quantitySpaceCard ${row.status}`} id={quantityRowAnchorId(row.spaceName)} key={`${row.floor}-${row.spaceName}-${index}`}>
              <div className="quantitySpaceHeader">
                <span>{row.floor}</span>
                <strong>{row.spaceName}</strong>
                <div className={`status ${row.status}`}>
                  {statusIcons[row.status]}
                  {statusLabels[row.status]}
                </div>
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
                {onChangeStatus && (
                  <label>
                    <span>状态</span>
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
                  </label>
                )}
              </div>
              <div className="quantityMetricGrid">
                <div><span>地面</span><strong>{row.floorAreaM2.toFixed(2)} m2</strong></div>
                <div><span>墙线</span><strong>{row.wallMeasureLengthM.toFixed(2)} m</strong></div>
                <div><span>窗洞</span><strong>{row.windowAreaM2.toFixed(2)} m2</strong></div>
                <div><span>乳胶漆</span><strong>{row.latexPaintAreaM2.toFixed(2)} m2</strong></div>
                <div><span>防水</span><strong>{row.waterproofAreaM2.toFixed(2)} m2</strong></div>
                <div><span>窗帘墙宽</span><strong>{row.curtainWallWidthM.toFixed(2)} m</strong></div>
              </div>
              {OPTIONAL_CEILING_FINISH_SPACE_TYPES.has(row.spaceType) && onChangeCeilingFinishType && (
                <label className="quantityCeilingControl">
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
              {row.anomalies.length > 0 && <small className="quantityAnomalies">{row.anomalies.join("；")}</small>}
              <details className="quantityEvidence">
                <summary>计算依据</summary>
                <p>{row.evidence}</p>
              </details>
            </article>
          );
        })}
      </div>
      <details className="advancedQuantityDetails">
        <summary>查看完整工程量明细</summary>
        <div className="tableWrap">
          <table>
        <thead>
          <tr>
            <th>楼层</th>
            <th>空间</th>
            <th>类型</th>
            <th>地面面积</th>
            <th>顶面类型</th>
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
            <th>墙面乳胶漆</th>
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
          {displayRows.map(({ row, index }) => {
            const spaceTypeOptions = QUOTE_SPACE_TYPE_OPTIONS.includes(row.spaceType) ? QUOTE_SPACE_TYPE_OPTIONS : [row.spaceType, ...QUOTE_SPACE_TYPE_OPTIONS];
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
            <tr key={`${row.floor}-${row.spaceName}-${index}`} className={differences.some((difference) => difference.space_name === row.spaceName) ? "quantityDiffRow" : undefined}>
              <td>{row.floor}</td>
              <td>
                <strong>{row.spaceName}</strong>
                <span>{row.evidence}</span>
              </td>
              <td>
                {onChangeSpaceType ? (
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
                ) : (
                  row.spaceType
                )}
                {onChangeSpaceType && <small>无法自动分类时按计价口径选择；不报价的空间在状态列选“不计价”。</small>}
              </td>
              <td className={differenceClass(floorAreaDifference)}>
                {row.floorAreaM2.toFixed(2)} m2
                <DifferenceValue difference={floorAreaDifference} />
              </td>
              <td>
                {onChangeCeilingFinishType && OPTIONAL_CEILING_FINISH_SPACE_TYPES.has(row.spaceType) ? (
                  <select
                    aria-label={`${row.spaceName} 顶面类型`}
                    className="statusSelect"
                    value={row.ceilingFinishType ?? "integrated"}
                    onChange={(event) => onChangeCeilingFinishType(row.spaceName, event.target.value as CeilingFinishType)}
                  >
                    <option value="integrated">集成吊顶</option>
                    <option value="gypsum">石膏板吊顶</option>
                  </select>
                ) : (
                  ceilingFinishLabels[row.ceilingFinishType ?? "gypsum"]
                )}
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
                {row.curtainWallWidthSource === "manual_required_l_shape_window" && <small className="curtainWallHelp">旧快照来源，可按窗长或手工校准</small>}
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
      </details>
    </div>
  );
}
