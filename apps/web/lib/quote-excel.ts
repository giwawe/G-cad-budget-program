import type { QuoteMapping } from "./quote-mapping";

export type ManualQuoteDraftItem = {
  floor: string;
  space_name: string;
  space_type: string;
  item_name: string;
};

type QuoteTemplateSection = {
  code: string;
  title: string;
  itemNames: string[];
};

const TEMPLATE_SECTIONS: QuoteTemplateSection[] = [
  { code: "一", title: "全屋拆改工程（可选）", itemNames: ["拆改及拆墙", "砌120厚砖墙", "砌240厚砖墙", "外墙批嵌", "外墙批嵌以及修补", "材料搬运费"] },
  { code: "二", title: "玄关工程", itemNames: ["轻钢龙骨平顶", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "地台石铺贴", "地面砖铺贴(750X1500)"] },
  { code: "三", title: "卧室工程", itemNames: ["轻钢龙骨平顶", "暗窗帘箱", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "地面砖铺贴(750X1500)", "窗台石铺贴"] },
  { code: "四", title: "过道工程", itemNames: ["轻钢龙骨平顶", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "地面砖铺贴(750X1500)"] },
  { code: "五", title: "卫生间工程", itemNames: ["地面找平", "墙地面防漏处理", "墙面贴瓷砖(600X1200)", "地面砖铺贴(750X1500)", "厨房卫生间集成吊顶"] },
  { code: "六", title: "厨房工程", itemNames: ["地面找平", "墙地面防漏处理", "墙面贴瓷砖(600X1200)", "地面砖铺贴(750X1500)", "厨房卫生间集成吊顶"] },
  { code: "七", title: "餐厅工程", itemNames: ["轻钢龙骨平顶", "暗窗帘箱", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "地面砖铺贴(750X1500)", "窗台石铺贴"] },
  { code: "八", title: "主卧工程", itemNames: ["轻钢龙骨平顶", "暗窗帘箱", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "地面砖铺贴(750X1500)", "窗台石铺贴"] },
  { code: "九", title: "次卧工程", itemNames: ["轻钢龙骨平顶", "暗窗帘箱", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "地面砖铺贴(750X1500)", "窗台石铺贴"] },
  { code: "十", title: "露台工程", itemNames: ["地面找平", "墙地面防漏处理", "顶面批嵌", "顶面乳胶漆", "墙面界面剂处理", "墙面批嵌", "墙面乳胶漆", "墙面贴瓷砖(600X1200)", "地面砖铺贴(750X1500)"] },
  { code: "十一", title: "其他工程", itemNames: ["外墙批嵌以及修补", "砖墙门窗洞过梁", "水泥墙开槽", "打混凝土过梁孔", "厨房、卫生间排污管包隔音棉", "补线、管槽及零星修补", "包上/下水管道(单管)", "垃圾清运费", "材料搬运费", "地面砖现场维护费"] },
  { code: "十二", title: "水电工程", itemNames: ["强电布线", "弱电布线", "水路布管"] },
  { code: "十三", title: "主材项目", itemNames: ["地面瓷砖", "墙面瓷砖", "瓷砖加工费"] },
  { code: "十四", title: "全屋定制、衣柜、橱柜、全屋家具", itemNames: ["全屋定制", "橱柜", "背景墙"] },
  { code: "十五", title: "室内门", itemNames: ["入户门", "室内门", "卫生间门", "厨房推拉门", "厨房推拉门双包套", "阳台推拉门", "阳台推拉门双包套", "铝合金封门窗"] },
  { code: "十六", title: "集成吊顶、卫浴、全屋开关灯饰", itemNames: ["厨房卫生间集成吊顶", "浴室柜", "马桶", "蹲坑", "淋浴隔断", "玻璃淋浴房", "花洒", "卫浴五件套", "全屋插座开关", "全屋灯饰"] },
  { code: "十七", title: "其他（窗帘、美缝、窗台石等）", itemNames: ["美缝", "窗帘", "窗台石", "窗台石铺贴", "全屋保洁"] },
];

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

type QuoteTemplatePrice = {
  material: number;
  auxiliary: number;
  labor: number;
  note: string;
};

const TEMPLATE_PRICES: Record<string, QuoteTemplatePrice> = {
  墙面界面剂处理: { material: 0, auxiliary: 4, labor: 3, note: "立邦界面处理剂" },
  墙面批嵌: { material: 0, auxiliary: 15, labor: 10, note: "二底二面基础腻子找平，含打磨。" },
  墙面乳胶漆: { material: 10, auxiliary: 0, labor: 10, note: "乳胶漆一底两面。" },
  厨房卫生间集成吊顶: { material: 260, auxiliary: 0, labor: 0, note: "厨房、卫生间集成吊顶，设计师可调整单价。" },
  轻钢龙骨平顶: { material: 110, auxiliary: 10, labor: 60, note: "含龙骨及配件，含辅料。" },
  顶面批嵌: { material: 0, auxiliary: 15, labor: 10, note: "二底二面基础腻子找平，含打磨。" },
  顶面乳胶漆: { material: 10, auxiliary: 0, labor: 10, note: "乳胶漆一底两面。" },
  地面找平: { material: 0, auxiliary: 26, labor: 30, note: "水泥砂浆找平，厚度≤50mm。" },
  "地面砖铺贴(750X1500)": { material: 0, auxiliary: 36, labor: 60, note: "主材甲供，辅料为水泥、黄沙。" },
  地面瓷砖: { material: 50, auxiliary: 0, labor: 0, note: "750*1500 瓷砖。" },
  强电布线: { material: 40, auxiliary: 0, labor: 38, note: "强电布线，含插座、开关安装人工费。" },
  水路布管: { material: 17.5, auxiliary: 0, labor: 12, note: "给水、污水废水管及配件辅料。" },
  "墙面贴瓷砖(600X1200)": { material: 0, auxiliary: 40, labor: 60, note: "辅料为水泥、黄沙、瓷砖背胶、胶泥。" },
  墙地面防漏处理: { material: 28, auxiliary: 10.5, labor: 13, note: "墙地面清理，涂刷防水涂料。" },
  窗台石铺贴: { material: 0, auxiliary: 28, labor: 45, note: "主材及磨边业主甲供，辅料为水泥、黄沙。" },
  砌120厚砖墙: { material: 80, auxiliary: 0, labor: 90, note: "水泥、沙、砖、人工辅料。" },
  拆改及拆墙: { material: 0, auxiliary: 0, labor: 60, note: "人工拆除。" },
  室内门: { material: 1200, auxiliary: 0, labor: 0, note: "室内静音门。" },
  卫生间门: { material: 1200, auxiliary: 0, labor: 0, note: "铝合金玻璃门。" },
  厨房推拉门: { material: 550, auxiliary: 0, labor: 0, note: "铝合金推拉门。" },
  厨房推拉门双包套: { material: 300, auxiliary: 0, labor: 0, note: "极窄铝合金双包套。" },
  橱柜: { material: 600, auxiliary: 0, labor: 0, note: "橱柜柜体、柜门、五金、安装及辅料。" },
  全屋定制: { material: 600, auxiliary: 0, labor: 0, note: "全屋定制柜体、柜门、五金、安装及辅料。" },
  马桶: { material: 1500, auxiliary: 0, labor: 0, note: "轻智能马桶。" },
  浴室柜: { material: 1500, auxiliary: 0, labor: 0, note: "岩板一体盆，含龙头及上下水。" },
  全屋灯饰: { material: 15000, auxiliary: 0, labor: 0, note: "主灯、防眩射灯、筒灯。" },
  暗窗帘箱: { material: 65, auxiliary: 0, labor: 45, note: "木工板立架，石膏板饰面。" },
};

export function quoteExcelFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "quote-draft.xls";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.quote-draft.xls`;
}

export function buildQuoteExcelHtml(mapping: QuoteMapping, projectName: string): string {
  const title = `${projectName.trim() || "报价映射"}清单式报价表`;
  const riskRows = quoteExcelRiskRows(mapping);
  const groupedQuoteRows = quoteTemplateRows(mapping);
  const summaryRows = quoteTemplateSummaryRows(mapping, projectName);
  const riskNoteRows = quoteTemplateRiskNoteRows(riskRows);

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
  <table>
    <thead>
      <tr>${summaryRows[0].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
      <tr>${summaryRows[1].map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>
      <tr>${summaryRows[2].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
      <tr>${summaryRows[3].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${groupedQuoteRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
      ${riskNoteRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("\n      ")}
    </tbody>
  </table>
</body>
</html>
`;
}

function quoteTemplateRows(mapping: QuoteMapping): string[][] {
  const remainingItems = new Set(mapping.items);
  const remainingManualItems = new Set(MANUAL_QUOTE_DRAFT_ITEMS);
  const rows: string[][] = [];
  for (const section of TEMPLATE_SECTIONS) {
    const sectionItems = mapping.items
      .filter((item) => remainingItems.has(item) && templateSectionForItem(item.item_name, item.space_type)?.title === section.title)
      .sort((a, b) => templateItemOrder(section, a.item_name) - templateItemOrder(section, b.item_name));
    const manualItems = MANUAL_QUOTE_DRAFT_ITEMS
      .filter((item) => remainingManualItems.has(item) && templateSectionForItem(item.item_name, item.space_type)?.title === section.title)
      .sort((a, b) => templateItemOrder(section, a.item_name) - templateItemOrder(section, b.item_name));
    if (sectionItems.length === 0 && manualItems.length === 0) {
      continue;
    }
    rows.push(sectionHeaderRow(section));
    sectionItems.forEach((item, index) => {
      remainingItems.delete(item);
      rows.push(quoteItemTemplateRow(item, index + 1));
    });
    manualItems.forEach((item, index) => {
      remainingManualItems.delete(item);
      rows.push(manualItemTemplateRow(item, sectionItems.length + index + 1));
    });
    rows.push(sectionSubtotalRow(sectionItems.reduce((sum, item) => sum + item.amount, 0)));
  }

  if (remainingItems.size > 0) {
    const otherSection = { code: "补", title: "未归类自动清单", itemNames: [] };
    rows.push(sectionHeaderRow(otherSection));
    [...remainingItems].forEach((item, index) => rows.push(quoteItemTemplateRow(item, index + 1)));
    rows.push(sectionSubtotalRow([...remainingItems].reduce((sum, item) => sum + item.amount, 0)));
  }

  if (remainingManualItems.size > 0) {
    const otherSection = { code: "补", title: "未归类人工补项", itemNames: [] };
    rows.push(sectionHeaderRow(otherSection));
    [...remainingManualItems].forEach((item, index) => rows.push(manualItemTemplateRow(item, index + 1)));
    rows.push(sectionSubtotalRow(0));
  }

  rows.push(...quoteTemplateTotalRows(mapping.summary.total_amount));
  return rows;
}

function quoteItemTemplateRow(item: QuoteMapping["items"][number], index: number): string[] {
  const price = templatePriceForItem(item.item_name, item.unit_price);
  return [
    String(index),
    item.item_name,
    item.unit,
    formatQuantity(item.quantity),
    formatMoney(price.material),
    formatMoney(price.auxiliary),
    formatMoney(price.labor),
    formatMoney(item.amount),
    price.note,
  ];
}

function manualItemTemplateRow(item: ManualQuoteDraftItem, index: number): string[] {
  return [String(index), item.item_name, "", "", "", "", "", "", ""];
}

function sectionHeaderRow(section: Pick<QuoteTemplateSection, "code" | "title">): string[] {
  return [section.code, section.title, "", "", "", "", "", "", ""];
}

function sectionSubtotalRow(amount: number): string[] {
  return ["", "小 计", "", "", "", "", "", formatMoney(amount), ""];
}

function quoteTemplateSummaryRows(mapping: QuoteMapping, projectName: string): string[][] {
  const now = new Date();
  const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return [
    ["工程(预) 算表", "", "", "", "", "", "", "", ""],
    [`名称：${projectName.trim() || "报价映射"}`, "", `装修面积：${formatQuantity(mapping.summary.building_area_m2)}`, "", "", "", "", `日期：${dateLabel}`, ""],
    ["编号", "项目名称", "单位", "数量", "材料费(元)", "", "人工费\n(元)", "总价(元)", "材  料  及  工  艺  说  明"],
    ["", "", "", "", "主材\n单价", "辅材\n单价", "", "", ""],
  ];
}

function quoteTemplateTotalRows(totalAmount: number): string[][] {
  const managementFee = round2(totalAmount * 0.05);
  const tax = round2((totalAmount + managementFee) * 0.03);
  const projectTotal = round2(totalAmount + managementFee + tax);
  return [
    ["A", "直接费合计", "", "", "", "", "", formatMoney(totalAmount), ""],
    ["B", "工程管理费(D=A* 5%)", "", "", "", "", "", formatMoney(managementFee), ""],
    ["C", "税金E=(A+B)* 3%", "", "", "", "", "", formatMoney(tax), ""],
    ["D", "工程总造价F=(A+B+C)", "", "", "", "", "", formatMoney(projectTotal), ""],
  ];
}

function quoteTemplateRiskNoteRows(riskRows: string[][]): string[][] {
  const relevantRows = riskRows.filter((row) => row[0] !== "健康检查" || row[1] !== "当前无待确认项");
  if (relevantRows.length === 0) {
    return [];
  }
  return [["", "报价风险备注", "", "", "", "", "", "", ""], ...relevantRows.map((row) => ["", row[0], "", "", "", "", "", "", row[1]])];
}

function templateSectionForItem(itemName: string, spaceType: string): QuoteTemplateSection | undefined {
  if (itemName === "厨房卫生间集成吊顶") {
    const preferredTitle = spaceType === "厨房" ? "厨房工程" : spaceType === "卫生间" ? "卫生间工程" : "集成吊顶、卫浴、全屋开关灯饰";
    return TEMPLATE_SECTIONS.find((section) => section.title === preferredTitle);
  }
  if ([
    "轻钢龙骨平顶",
    "顶面批嵌",
    "顶面乳胶漆",
    "墙面界面剂处理",
    "墙面批嵌",
    "墙面乳胶漆",
    "地面找平",
    "墙地面防漏处理",
    "墙面贴瓷砖(600X1200)",
    "地面砖铺贴(750X1500)",
    "暗窗帘箱",
    "窗台石铺贴",
  ].includes(itemName)) {
    const spaceSection = TEMPLATE_SECTIONS.find((section) => section.title === `${spaceType}工程`);
    if (spaceSection?.itemNames.includes(itemName)) {
      return spaceSection;
    }
  }
  return TEMPLATE_SECTIONS.find((section) => section.itemNames.includes(itemName) || section.itemNames.some((templateName) => itemName.includes(templateName)));
}

function templateItemOrder(section: QuoteTemplateSection, itemName: string): number {
  const index = section.itemNames.indexOf(itemName);
  if (index >= 0) {
    return index;
  }
  const partialIndex = section.itemNames.findIndex((templateName) => itemName.includes(templateName));
  return partialIndex >= 0 ? partialIndex : Number.MAX_SAFE_INTEGER;
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

function templatePriceForItem(itemName: string, unitPrice: number): QuoteTemplatePrice {
  return TEMPLATE_PRICES[itemName] ?? { material: unitPrice, auxiliary: 0, labor: 0, note: "" };
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
