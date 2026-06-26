import type { QuoteMapping } from "./quote-mapping";

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

  return `\uFEFF<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; }
    table { border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #999; padding: 6px 8px; }
    th { background: #e8eef8; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table>
    <tbody>
      ${summaryRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
  </table>
  <table>
    <thead>
      <tr><th>楼层</th><th>空间</th><th>类型</th><th>清单项</th><th>工程量</th><th>单位</th><th>单价</th><th>小计</th></tr>
    </thead>
    <tbody>
      ${itemRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
  </table>
</body>
</html>
`;
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
