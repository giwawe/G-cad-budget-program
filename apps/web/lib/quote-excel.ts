import type { QuoteMapping } from "./quote-mapping";

export type ManualQuoteDraftItem = {
  floor: string;
  space_name: string;
  space_type: string;
  item_name: string;
};

export const MANUAL_QUOTE_DRAFT_ITEMS: ManualQuoteDraftItem[] = [
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "砌240厚砖墙" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "外墙批嵌以及修补" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "砖墙门窗洞过梁" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "水泥墙开槽" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "打混凝土过梁孔" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "厨房、卫生间排污管包隔音棉" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "补线、管槽及零星修补" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "包上/下水管道(单管)" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "弱电布线" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "全屋插座开关" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "墙面瓷砖" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "瓷砖加工费" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "入户门" },
  { floor: "一层", space_name: "阳台", space_type: "阳台", item_name: "阳台推拉门" },
  { floor: "一层", space_name: "阳台", space_type: "阳台", item_name: "阳台推拉门双包套" },
  { floor: "一层", space_name: "全屋", space_type: "全屋", item_name: "铝合金封门窗" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "蹲坑" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "淋浴隔断" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "玻璃淋浴房" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "花洒" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "卫浴五件套" },
  { floor: "一层", space_name: "客厅", space_type: "客厅", item_name: "背景墙" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "材料搬运费" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "垃圾清运费" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "地面砖现场维护费" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "美缝" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "全屋保洁" },
];

export function quoteExcelFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "quote-draft.xls";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.quote-draft.xls`;
}

export function buildQuoteExcelHtml(mapping: QuoteMapping, projectName: string): string {
  const title = `${projectName.trim() || "报价映射"}报价草稿`;
  const summaryRows = [
    ["计价空间", String(mapping.summary.space_count)],
    ["建筑面积", formatQuantity(mapping.summary.building_area_m2)],
    ["清单项", String(mapping.summary.item_count)],
    ["估算合计", formatMoney(mapping.summary.total_amount)],
  ];
  const riskRows = quoteExcelRiskRows(mapping);
  const spaceSubtotalRows = quoteExcelSpaceSubtotalRows(mapping);
  const itemRows = mapping.items.map((item) => [
    item.floor,
    item.space_name,
    item.space_type,
    item.item_name,
    formatQuantity(item.quantity),
    item.unit,
    formatMoney(item.unit_price),
    formatMoney(item.amount),
  ]);
  const manualItemRows = MANUAL_QUOTE_DRAFT_ITEMS.map((item) => [item.floor, item.space_name, item.space_type, item.item_name, "", "", "", ""]);

  return `\uFEFF<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; }
    table { border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #999; padding: 6px 8px; }
    th { background: #e8eef8; font-weight: 700; }
    tfoot td { font-weight: 700; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table>
    <tbody>
      ${summaryRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
  </table>
  <h2>风险摘要</h2>
  <table>
    <tbody>
      ${riskRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
  </table>
  <h2>空间小计</h2>
  <table>
    <thead>
      <tr><th>楼层</th><th>空间</th><th>类型</th><th>清单项数</th><th>小计</th></tr>
    </thead>
    <tbody>
      ${spaceSubtotalRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
    <tfoot>
      <tr><td>合计</td><td></td><td></td><td>${escapeHtml(String(mapping.summary.item_count))}</td><td>${escapeHtml(formatMoney(mapping.summary.total_amount))}</td></tr>
    </tfoot>
  </table>
  <table>
    <thead>
      <tr><th>楼层</th><th>空间</th><th>类型</th><th>清单项</th><th>工程量</th><th>单位</th><th>单价</th><th>小计</th></tr>
    </thead>
    <tbody>
      ${itemRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
    <tfoot>
      <tr><td>合计</td><td></td><td></td><td></td><td></td><td></td><td></td><td>${escapeHtml(formatMoney(mapping.summary.total_amount))}</td></tr>
    </tfoot>
  </table>
  <h2>人工补项</h2>
  <table>
    <thead>
      <tr><th>楼层</th><th>空间</th><th>类型</th><th>清单项</th><th>工程量</th><th>单位</th><th>单价</th><th>小计</th></tr>
    </thead>
    <tbody>
      ${manualItemRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
  </table>
</body>
</html>
`;
}

function quoteExcelSpaceSubtotalRows(mapping: QuoteMapping): string[][] {
  const subtotals = new Map<string, { floor: string; spaceName: string; spaceType: string; itemCount: number; amount: number }>();
  for (const item of mapping.items) {
    const key = `${item.floor}\u0000${item.space_name}\u0000${item.space_type}`;
    const subtotal = subtotals.get(key);
    if (subtotal) {
      subtotal.itemCount += 1;
      subtotal.amount = round2(subtotal.amount + item.amount);
      continue;
    }
    subtotals.set(key, {
      floor: item.floor,
      spaceName: item.space_name,
      spaceType: item.space_type,
      itemCount: 1,
      amount: item.amount,
    });
  }
  return [...subtotals.values()].map((subtotal) => [
    subtotal.floor,
    subtotal.spaceName,
    subtotal.spaceType,
    String(subtotal.itemCount),
    formatMoney(subtotal.amount),
  ]);
}

function quoteExcelRiskRows(mapping: QuoteMapping): string[][] {
  const rows: string[][] = [["健康检查", mapping.quantity_health_readiness.label]];
  if (mapping.building_area_quote_readiness.missing_item_names.length > 0) {
    rows.push([
      "建筑面积",
      `${mapping.building_area_quote_readiness.missing_item_names.join("、")} 需要 QUOTE_EXT_WALL 建筑面积，当前为 0。`,
    ]);
  }

  const zeroPriceItems = mapping.items.filter((item) => item.quantity > 0 && item.unit_price <= 0);
  if (zeroPriceItems.length > 0) {
    rows.push([
      "零单价",
      zeroPriceItems
        .map((item) => `${item.item_name}：${item.space_name} ${formatMoney(item.quantity)} ${item.unit}`)
        .join("；"),
    ]);
  }
  return rows;
}

function formatQuantity(value: number): string {
  return round2(value).toFixed(2).replace(/\.00$/, "");
}

function formatMoney(value: number): string {
  return round2(value).toFixed(2);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
