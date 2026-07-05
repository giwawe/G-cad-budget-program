import type { QuoteMapping } from "./quote-mapping";
import type { BathroomManualChoice } from "./manual-quote-options";
import type { QuantityRow } from "./types";

export type ManualQuoteDraftItem = {
  floor: string;
  space_name: string;
  space_type: string;
  item_name: string;
};

export type QuoteExcelManualItemQuantities = Partial<Record<string, number>>;

export type QuoteExcelOptions = {
  manualItems?: QuoteExcelManualItemQuantities;
  bathroomChoices?: Record<string, BathroomManualChoice>;
  bathroomRows?: QuantityRow[];
};

type QuoteTemplateSection = {
  code: string;
  title: string;
  itemNames: string[];
};

type QuoteTemplateSectionDefinition = Omit<QuoteTemplateSection, "code">;
type RoomSectionGroup = {
  key: string;
  title: string;
  items: QuoteMapping["items"];
};
type OrderedRoomSectionGroup = RoomSectionGroup & { order: number };

const ROOM_SECTION_ITEM_NAMES = [
  "轻钢龙骨平顶",
  "暗窗帘箱",
  "顶面批嵌",
  "顶面乳胶漆",
  "墙面界面剂处理",
  "墙面批嵌",
  "墙面乳胶漆",
  "地面找平",
  "墙地面防漏处理",
  "墙面贴瓷砖(600X1200)",
  "地面砖铺贴(750X1500)",
  "窗台石铺贴",
  "淋浴隔断安装",
  "楼梯踏步铺贴",
];

const ONE_ITEM_PLACEHOLDER_NAMES = new Set(["窗台石"]);
const EXCEL_PLACEHOLDER_ITEM_NAMES = new Set<string>();

const FIXED_TEMPLATE_SECTIONS: QuoteTemplateSectionDefinition[] = [
  { title: "全屋拆改工程", itemNames: ["拆改及拆墙", "砌砖墙", "砌120厚砖墙", "砌240厚砖墙", "外墙批嵌以及修补"] },
  {
    title: "其他工程",
    itemNames: ["砖墙门窗洞过梁", "水泥墙开槽", "打混凝土过梁孔", "厨房、卫生间排污管包隔音棉", "补线、管槽及零星修补", "垃圾清运费", "材料搬运费", "地面砖现场维护费"],
  },
  { title: "水电工程", itemNames: ["强电布线", "弱电布线", "水路布管"] },
  { title: "主材项目", itemNames: ["地面瓷砖", "墙面瓷砖", "瓷砖加工费"] },
  { title: "全屋定制、衣柜、橱柜、全屋家具", itemNames: ["全屋定制", "橱柜", "背景墙"] },
  { title: "室内门", itemNames: ["入户门", "室内门", "卫生间门", "厨房推拉门", "厨房推拉门双包套", "阳台推拉门", "阳台推拉门双包套", "铝合金封门窗"] },
  { title: "集成吊顶、卫浴、全屋开关灯饰", itemNames: ["厨房卫生间集成吊顶", "浴室柜", "马桶", "蹲坑", "淋浴隔断", "玻璃淋浴房", "花洒", "卫浴五件套", "全屋插座开关", "全屋灯饰"] },
  { title: "其他（窗帘、美缝、窗台石等）", itemNames: ["美缝", "窗帘", "窗台石", "楼梯扶手", "栏杆/护栏", "全屋保洁"] },
];
const TEMPLATE_ITEM_NAME_SET = new Set([...ROOM_SECTION_ITEM_NAMES, ...FIXED_TEMPLATE_SECTIONS.flatMap((section) => section.itemNames)]);

export const EXCEL_FIXED_PLACEHOLDER_ITEMS: ManualQuoteDraftItem[] = [
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "砖墙门窗洞过梁" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "入户门" },
  { floor: "一层", space_name: "阳台", space_type: "阳台", item_name: "阳台推拉门" },
  { floor: "一层", space_name: "阳台", space_type: "阳台", item_name: "阳台推拉门双包套" },
  { floor: "一层", space_name: "全屋", space_type: "全屋", item_name: "铝合金封门窗" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "蹲坑" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "淋浴隔断" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "玻璃淋浴房" },
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "窗台石" },
];
EXCEL_FIXED_PLACEHOLDER_ITEMS.forEach((item) => EXCEL_PLACEHOLDER_ITEM_NAMES.add(item.item_name));

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
  墙面瓷砖: { material: 30, auxiliary: 0, labor: 0, note: "600*1200 瓷砖，按墙面贴砖面积和 5% 损耗换算片数。" },
  瓷砖加工费: { material: 20, auxiliary: 0, labor: 0, note: "按当前贴砖面积生成候选，报价员可按实际加工米数调整。" },
  美缝: { material: 0, auxiliary: 12, labor: 0, note: "按当前地面铺砖面积与墙面贴砖面积生成候选。" },
  强电布线: { material: 40, auxiliary: 0, labor: 38, note: "强电布线，含插座、开关安装人工费。" },
  弱电布线: { material: 15, auxiliary: 0, labor: 10, note: "弱电布线，按建筑面积生成候选。" },
  水路布管: { material: 17.5, auxiliary: 0, labor: 12, note: "给水、污水废水管及配件辅料。" },
  材料搬运费: { material: 0, auxiliary: 0, labor: 8, note: "按建筑面积计，设计师可按是否含吊机调整单价。" },
  垃圾清运费: { material: 0, auxiliary: 0, labor: 10, note: "按建筑面积计，外运车费另计。" },
  地面砖现场维护费: { material: 0, auxiliary: 3, labor: 5, note: "地面砖成品保护。" },
  "墙面贴瓷砖(600X1200)": { material: 0, auxiliary: 40, labor: 60, note: "辅料为水泥、黄沙、瓷砖背胶、胶泥。" },
  墙地面防漏处理: { material: 28, auxiliary: 10.5, labor: 13, note: "墙地面清理，涂刷防水涂料。" },
  窗台石铺贴: { material: 0, auxiliary: 28, labor: 45, note: "主材及磨边业主甲供，辅料为水泥、黄沙。" },
  淋浴隔断安装: { material: 0, auxiliary: 0, labor: 200, note: "淋浴隔断或玻璃淋浴房安装人工。" },
  楼梯踏步铺贴: { material: 0, auxiliary: 45, labor: 80, note: "主材及磨边，按楼梯踏步数计。" },
  砌砖墙: { material: 100, auxiliary: 0, labor: 120, note: "未标注墙厚时按 240 厚砌墙口径输出，设计师可调整。" },
  砌120厚砖墙: { material: 80, auxiliary: 0, labor: 90, note: "水泥、沙、砖、人工辅料。" },
  砌240厚砖墙: { material: 100, auxiliary: 0, labor: 120, note: "水泥、沙、砖、人工辅料。" },
  拆改及拆墙: { material: 0, auxiliary: 0, labor: 60, note: "人工拆除。" },
  外墙批嵌以及修补: { material: 0, auxiliary: 30, labor: 50, note: "有对应图层时按规则输出；无图层不显示。" },
  砖墙门窗洞过梁: { material: 160, auxiliary: 0, labor: 40, note: "设计师按现场数量填写。" },
  水泥墙开槽: { material: 0, auxiliary: 3, labor: 6, note: "按建筑面积生成候选。" },
  打混凝土过梁孔: { material: 0, auxiliary: 0, labor: 50, note: "按建筑面积 10% 生成候选。" },
  "厨房、卫生间排污管包隔音棉": { material: 0, auxiliary: 20, labor: 15, note: "厨房和卫生间数量合计 * 1.5 * 层高。" },
  "补线、管槽及零星修补": { material: 0, auxiliary: 2.5, labor: 3, note: "按建筑面积生成候选。" },
  入户门: { material: 5000, auxiliary: 0, labor: 0, note: "设计师确认是否计入。" },
  室内门: { material: 1200, auxiliary: 0, labor: 0, note: "室内静音门。" },
  卫生间门: { material: 1200, auxiliary: 0, labor: 0, note: "铝合金玻璃门。" },
  厨房推拉门: { material: 550, auxiliary: 0, labor: 0, note: "铝合金推拉门。" },
  厨房推拉门双包套: { material: 300, auxiliary: 0, labor: 0, note: "极窄铝合金双包套。" },
  阳台推拉门: { material: 550, auxiliary: 0, labor: 0, note: "设计师确认是否计入。" },
  阳台推拉门双包套: { material: 300, auxiliary: 0, labor: 0, note: "设计师确认是否计入。" },
  铝合金封门窗: { material: 0, auxiliary: 0, labor: 0, note: "按窗户实际面积预留，设计师选择是否报价。" },
  橱柜: { material: 600, auxiliary: 0, labor: 0, note: "橱柜柜体、柜门、五金、安装及辅料。" },
  全屋定制: { material: 600, auxiliary: 0, labor: 0, note: "全屋定制柜体、柜门、五金、安装及辅料。" },
  背景墙: { material: 280, auxiliary: 0, labor: 0, note: "木饰面外石材或玻璃部分需按实际补差。" },
  马桶: { material: 1500, auxiliary: 0, labor: 0, note: "轻智能马桶。" },
  蹲坑: { material: 500, auxiliary: 0, labor: 0, note: "与马桶二选一，设计师确认。" },
  浴室柜: { material: 1500, auxiliary: 0, labor: 0, note: "岩板一体盆，含龙头及上下水。" },
  淋浴隔断: { material: 400, auxiliary: 0, labor: 0, note: "与玻璃淋浴房二选一，设计师确认。" },
  玻璃淋浴房: { material: 3500, auxiliary: 0, labor: 0, note: "与淋浴隔断二选一，设计师确认。" },
  花洒: { material: 800, auxiliary: 0, labor: 0, note: "花洒（九牧、法恩莎）。" },
  卫浴五件套: { material: 280, auxiliary: 0, labor: 0, note: "马桶刷、毛巾架、纸巾盒等。" },
  全屋插座开关: { material: 6000, auxiliary: 0, labor: 0, note: "全屋插座开关，默认 1 套。" },
  全屋灯饰: { material: 15000, auxiliary: 0, labor: 0, note: "主灯、防眩射灯、筒灯。" },
  窗帘: { material: 60, auxiliary: 0, labor: 0, note: "按窗帘箱长度 * 2 计算展开长度，主材单价 60。" },
  窗台石: { material: 3600, auxiliary: 0, labor: 0, note: "按套预留，设计师确认价格。" },
  全屋保洁: { material: 4500, auxiliary: 0, labor: 0, note: "最后全屋开荒保洁，默认 1 套。" },
  暗窗帘箱: { material: 65, auxiliary: 0, labor: 45, note: "木工板立架，石膏板饰面。" },
  楼梯扶手: { material: 470, auxiliary: 0, labor: 0, note: "楼梯扶手，按模板主材单价。" },
};

const QUOTE_EXCEL_FOOTER_NOTES = [
  "编制说明：",
  "1、本报价不含其他管理处所增加任何费用，如果管理处所增此费用业主承担；",
  "2、施工中如有项目需增补或有设计变更，工作量及价格由甲乙双方协商认定，签字为准并进入工程总造价。",
  "3、甲方变更认可后即须交齐增补款项，不缴款者乙方有权停工，由此引起的工期延误不属乙方责任。",
  "4、所有款项甲方应缴给乙方财务（开据公司盖章票据），如因款项不是支付乙方财务产生的损失不属乙方责任。",
  "5、甲方自购材料运费自理。",
  "6、物业押金及物业管理费由甲方承担。",
  "7、本报价单不含装修期间所产生的水电费。",
  "8、施工以合同与预算为准，口头承诺无效。",
  "9、上述材料若因市场缺货,按同等档次产品品牌，若选择超过材料名单价值的材料应按市场价格补差额。",
  "10、工程竣工验收合格后，乙方向甲方办理移交及发放保修卡。不按约缴款者视甲方自动放弃保修权益，乙方并将依法追缴。",
  "11、如未办理竣工验收即入住（或更换装修钥匙）视为验收合格。",
  "12、本预算未经签字确认前，请勿带走， 否则，必须交付本报价总额3％的预算费，合同签订后计入工程款；",
  "13、本报介未含： 室内所有广告画面及字体、活动家具、音响及功放、空调、电器、室内所有监控线路铺设及设备安装；",
  "14、施工监理员按本预算进行施工，预算没有的项目不在施工范围内；",
  "15、本报价一式两份，双方各执一份， 同具法律效力。",
];

export function quoteExcelFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "quote-draft.xls";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.quote-draft.xls`;
}

export function buildQuoteExcelHtml(mapping: QuoteMapping, projectName: string, options: QuoteExcelOptions = {}): string {
  const title = `${projectName.trim() || "报价映射"}清单式报价表`;
  const riskRows = quoteExcelRiskRows(mapping);
  const groupedQuoteRows = quoteTemplateRows(mapping, options);
  const summaryRows = quoteTemplateSummaryRows(mapping, projectName);
  const riskNoteRows = quoteTemplateRiskNoteRows(riskRows);

  return `\uFEFF<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="ProgId" content="Excel.Sheet" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 0.63in 0.20in 0.24in 0.28in; mso-header-margin: 0.50in; mso-footer-margin: 0.50in; }
    body { font-family: "宋体", "Microsoft YaHei", Arial, sans-serif; }
    table { border-collapse: collapse; margin-bottom: 16px; table-layout: fixed; width: 520pt; }
    col { mso-width-source: userset; }
    th, td { border: 1px solid #999; padding: 3px 4px; vertical-align: middle; white-space: normal; font-size: 9pt; }
    th { font-weight: 700; text-align: center; }
    td:nth-child(1), td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6), td:nth-child(7), td:nth-child(8) { text-align: center; }
    td:nth-child(9) { text-align: left; }
    .quoteTitleRow th { font-size: 14pt; font-weight: 700; height: 23pt; }
    .quoteMetaRow td { height: 14pt; }
    .quoteHeaderRow th { height: 28.75pt; }
    .quoteSubHeaderRow th { height: 20.75pt; }
    .quoteSectionRow td { font-weight: 700; height: 14.75pt; }
    .quoteItemRow td, .quoteSubtotalRow td, .quoteTotalRow td { height: 14.75pt; }
    .quoteSubtotalRow td, .quoteTotalRow td { font-weight: 700; }
    .quoteRiskRow td { color: #8a4b00; }
    .quoteFooterNoteRow td, .quoteSignatureRow td { border: .5pt solid #000000; font-size: 9pt; text-align: left; height: 15pt; }
  </style>
</head>
<body>
  <table width="1040" border="0" cellpadding="0" cellspacing="0" style="width:520pt;border-collapse:collapse;table-layout:fixed;">
    <colgroup>
      <col width="54" style="mso-width-source:userset;mso-width-alt:1316;" />
      <col width="236" style="mso-width-source:userset;mso-width-alt:5755;" />
      <col width="62" style="mso-width-source:userset;mso-width-alt:1511;" />
      <col width="70" style="mso-width-source:userset;mso-width-alt:1706;" />
      <col width="70" style="mso-width-source:userset;mso-width-alt:1706;" />
      <col width="70" style="mso-width-source:userset;mso-width-alt:1706;" />
      <col width="70" style="mso-width-source:userset;mso-width-alt:1706;" />
      <col width="94" style="mso-width-source:userset;mso-width-alt:2291;" />
      <col width="270" style="mso-width-source:userset;mso-width-alt:6584;" />
    </colgroup>
    <thead>
      <tr class="quoteTitleRow"><th colspan="9">${escapeHtml(summaryRows[0][0])}</th></tr>
      ${quoteTemplateMetaHtmlRow(mapping, projectName)}
      <tr class="quoteHeaderRow"><th>${escapeHtml(summaryRows[2][0])}</th><th>${escapeHtml(summaryRows[2][1])}</th><th>${escapeHtml(summaryRows[2][2])}</th><th>${escapeHtml(summaryRows[2][3])}</th><th colspan="2">${escapeHtml(summaryRows[2][4])}</th><th>${escapeHtml(summaryRows[2][6])}</th><th>${escapeHtml(summaryRows[2][7])}</th><th>${escapeHtml(summaryRows[2][8])}</th></tr>
      <tr class="quoteSubHeaderRow">${summaryRows[3].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${groupedQuoteRows.map((row) => quoteTemplateHtmlRow(row)).join("\n      ")}
      ${riskNoteRows.map((row) => quoteTemplateHtmlRow(row)).join("\n      ")}
      ${quoteTemplateFooterHtmlRows()}
    </tbody>
  </table>
</body>
</html>
`;
}

function quoteTemplateMetaHtmlRow(mapping: QuoteMapping, projectName: string): string {
  const now = new Date();
  const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `<tr class="quoteMetaRow"><td colspan="2">地址名称：${escapeHtml(projectName.trim() || "报价映射")}</td><td colspan="4">客户：</td><td colspan="2">装修面积：${escapeHtml(formatQuantity(mapping.summary.building_area_m2))}</td><td>日期：${escapeHtml(dateLabel)}</td></tr>`;
}

function quoteTemplateHtmlRow(row: string[]): string {
  const className = quoteTemplateRowClass(row);
  return `<tr${className ? ` class="${className}"` : ""}>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`;
}

function quoteTemplateFooterHtmlRows(): string {
  const noteRows = QUOTE_EXCEL_FOOTER_NOTES.map((note) => `<tr class="quoteFooterNoteRow"><td colspan="9">${escapeHtml(note)}</td></tr>`);
  return [
    ...noteRows,
    `<tr class="quoteSignatureRow"><td colspan="2">客户签名：</td><td colspan="5">设计师：</td><td colspan="2">报价员：</td></tr>`,
  ].join("\n      ");
}

function quoteTemplateRowClass(row: string[]): string {
  if (row[1] === "小 计") {
    return "quoteSubtotalRow";
  }
  if (["A", "B", "C", "D"].includes(row[0])) {
    return "quoteTotalRow";
  }
  if (row[1] === "报价风险备注" || ["健康检查", "建筑面积", "零单价"].includes(row[1])) {
    return "quoteRiskRow";
  }
  if (row[0] && row.slice(2).every((cell) => cell === "")) {
    return "quoteSectionRow";
  }
  return "";
}

function quoteTemplateRows(mapping: QuoteMapping, options: QuoteExcelOptions): string[][] {
  const remainingItems = new Set(mapping.items);
  const rows: string[][] = [];
  let sectionIndex = 1;
  let directTotal = 0;
  const multiFloorProject = isMultiFloorProject(mapping.items, options.bathroomRows);

  const firstFixedSection = templateSectionWithCode(FIXED_TEMPLATE_SECTIONS[0], sectionIndex++);
  const firstFixedSectionRows = quoteTemplateSectionRows(firstFixedSection, fixedSectionItems(mapping.items, remainingItems, firstFixedSection), remainingItems, true, options);
  rows.push(...firstFixedSectionRows.rows);
  directTotal += firstFixedSectionRows.subtotal;

  for (const group of dynamicRoomSectionGroups(mapping.items, remainingItems, options, multiFloorProject)) {
    const roomSection = templateSectionWithCode({ title: group.title, itemNames: ROOM_SECTION_ITEM_NAMES }, sectionIndex++);
    const roomRows = quoteTemplateSectionRows(roomSection, group.items, remainingItems, false, options);
    rows.push(...roomRows.rows);
    directTotal += roomRows.subtotal;
  }

  for (const sectionDefinition of FIXED_TEMPLATE_SECTIONS.slice(1)) {
    const section = templateSectionWithCode(sectionDefinition, sectionIndex++);
    const sectionRows = quoteTemplateSectionRows(section, fixedSectionItems(mapping.items, remainingItems, section), remainingItems, true, options);
    rows.push(...sectionRows.rows);
    directTotal += sectionRows.subtotal;
  }

  if (remainingItems.size > 0) {
    const otherSection = { code: "补", title: "未归类自动清单", itemNames: [] };
    rows.push(sectionHeaderRow(otherSection));
    [...remainingItems].forEach((item, index) => rows.push(quoteItemTemplateRow(item, index + 1)));
    const remainingSubtotal = [...remainingItems].reduce((sum, item) => sum + item.amount, 0);
    rows.push(sectionSubtotalRow(remainingSubtotal));
    directTotal += remainingSubtotal;
  }

  rows.push(...quoteTemplateTotalRows(directTotal));
  return rows;
}

function quoteTemplateSectionRows(
  section: QuoteTemplateSection,
  sectionItems: QuoteMapping["items"],
  remainingItems: Set<QuoteMapping["items"][number]>,
  includeZeroRows: boolean,
  options: QuoteExcelOptions,
): { rows: string[][]; subtotal: number } {
  const rows: string[][] = [sectionHeaderRow(section)];
  let rowIndex = 1;
  let subtotal = 0;
  for (const templateItemName of section.itemNames) {
    const matchingItems = sectionItems.filter((item) => itemMatchesTemplate(item.item_name, templateItemName));
    const manualQuantity = manualQuantityForItem(templateItemName, options);
    if (manualQuantity !== undefined) {
      for (const matchedItem of matchingItems) {
        remainingItems.delete(matchedItem);
      }
      const item = manualQuoteItem(templateItemName, manualQuantity);
      subtotal += item.amount;
      rows.push(quoteItemTemplateRow(item, rowIndex++));
      continue;
    }
    if (matchingItems.length === 0) {
      if (includeZeroRows && shouldRenderZeroPlaceholder(templateItemName)) {
        rows.push(zeroItemTemplateRow(templateItemName, rowIndex++));
      }
      continue;
    }
    const item = aggregateQuoteItems(matchingItems, templateItemName);
    for (const matchedItem of matchingItems) {
      remainingItems.delete(matchedItem);
    }
    subtotal += item.amount;
    rows.push(quoteItemTemplateRow(item, rowIndex++));
  }

  const extraItems = aggregateQuoteItemsByName(sectionItems.filter((item) => remainingItems.has(item)));
  for (const item of extraItems) {
    sectionItems.filter((sectionItem) => sectionItem.item_name === item.item_name).forEach((sectionItem) => remainingItems.delete(sectionItem));
    subtotal += item.amount;
    rows.push(quoteItemTemplateRow(item, rowIndex++));
  }
  rows.push(sectionSubtotalRow(subtotal));
  return { rows, subtotal };
}

function quoteItemTemplateRow(item: QuoteMapping["items"][number], index: number): string[] {
  const price = templatePriceForItem(item);
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

function aggregateQuoteItems(items: QuoteMapping["items"], itemName: string): QuoteMapping["items"][number] {
  const firstItem = items[0];
  const quantity = round2(items.reduce((sum, item) => sum + item.quantity, 0));
  const amount = round2(items.reduce((sum, item) => sum + item.amount, 0));
  const mergedItemName = items.every((item) => item.item_name === firstItem.item_name) ? firstItem.item_name : itemName;
  const material_price = round2(items.reduce((sum, item) => sum + (item.material_price ?? templatePriceForItem(item).material) * item.quantity, 0) / Math.max(quantity, 1));
  const auxiliary_price = round2(items.reduce((sum, item) => sum + (item.auxiliary_price ?? templatePriceForItem(item).auxiliary) * item.quantity, 0) / Math.max(quantity, 1));
  const labor_price = round2(items.reduce((sum, item) => sum + (item.labor_price ?? templatePriceForItem(item).labor) * item.quantity, 0) / Math.max(quantity, 1));
  return {
    ...firstItem,
    item_name: mergedItemName,
    quantity,
    unit_price: round2(material_price + auxiliary_price + labor_price),
    material_price,
    auxiliary_price,
    labor_price,
    amount,
  };
}

function aggregateQuoteItemsByName(items: QuoteMapping["items"]): QuoteMapping["items"] {
  const groups = new Map<string, QuoteMapping["items"]>();
  for (const item of items) {
    groups.set(item.item_name, [...(groups.get(item.item_name) ?? []), item]);
  }
  return [...groups.entries()].map(([itemName, groupItems]) => aggregateQuoteItems(groupItems, itemName));
}

function zeroItemTemplateRow(itemName: string, index: number): string[] {
  const price = TEMPLATE_PRICES[itemName] ?? { material: 0, auxiliary: 0, labor: 0, note: "" };
  const note = price.note ? `${price.note}；占位行不计入小计。` : "占位行不计入小计。";
  if (ONE_ITEM_PLACEHOLDER_NAMES.has(itemName)) {
    return [String(index), itemName, templateUnitForItem(itemName), "1", formatMoney(price.material), formatMoney(price.auxiliary), formatMoney(price.labor), "0.00", note];
  }
  return [String(index), itemName, templateUnitForItem(itemName), "0", formatMoney(price.material), formatMoney(price.auxiliary), formatMoney(price.labor), "0.00", note];
}

function manualQuoteItem(itemName: string, quantity: number): QuoteMapping["items"][number] {
  const price = TEMPLATE_PRICES[itemName] ?? { material: 0, auxiliary: 0, labor: 0, note: "" };
  const unitPrice = round2(price.material + price.auxiliary + price.labor);
  return {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: itemName,
    quantity,
    unit: templateUnitForItem(itemName),
    unit_price: unitPrice,
    material_price: price.material,
    auxiliary_price: price.auxiliary,
    labor_price: price.labor,
    amount: round2(quantity * unitPrice),
  };
}

function manualQuantityForItem(itemName: string, options: QuoteExcelOptions): number | undefined {
  const value = options.manualItems?.[itemName];
  if (value === undefined) {
    return undefined;
  }
  return round2(Math.max(Number.isFinite(value) ? value : 0, 0));
}

function shouldRenderZeroPlaceholder(itemName: string): boolean {
  return EXCEL_PLACEHOLDER_ITEM_NAMES.has(itemName);
}

function templateUnitForItem(itemName: string): string {
  if (itemName === "楼梯踏步铺贴") {
    return "步";
  }
  if (["蹲坑", "马桶", "淋浴隔断", "玻璃淋浴房", "窗台石"].includes(itemName)) {
    return "套";
  }
  if (["砖墙门窗洞过梁"].includes(itemName)) {
    return "支";
  }
  if (itemName.includes("门") && !itemName.includes("推拉门") && !itemName.includes("封门窗")) {
    return "樘";
  }
  if (["砌砖墙", "砌120厚砖墙", "砌240厚砖墙", "外墙批嵌以及修补", "水泥墙开槽", "补线、管槽及零星修补", "铝合金封门窗"].includes(itemName)) {
    return "M2";
  }
  if (["阳台推拉门双包套", "窗帘", "窗台石铺贴"].includes(itemName)) {
    return "M";
  }
  if (["阳台推拉门"].includes(itemName)) {
    return "M2";
  }
  return "";
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

function templateSectionWithCode(section: QuoteTemplateSectionDefinition, index: number): QuoteTemplateSection {
  return { ...section, code: chineseSectionCode(index) };
}

function dynamicRoomSectionGroups(items: QuoteMapping["items"], remainingItems: Set<QuoteMapping["items"][number]>, options: QuoteExcelOptions, multiFloorProject: boolean): RoomSectionGroup[] {
  const groups: OrderedRoomSectionGroup[] = [];
  const groupedItems = new Map<string, QuoteMapping["items"]>();
  const groupTitles = new Map<string, string>();
  for (const item of items) {
    if (item.space_name === "全屋" || !isRoomSectionItem(item.item_name)) {
      continue;
    }
    const group = roomSectionGroupForItem(item, multiFloorProject);
    groupedItems.set(group.key, [...(groupedItems.get(group.key) ?? []), item]);
    groupTitles.set(group.key, group.title);
  }
  for (const item of bathroomInstallationItemsFromOptions(options, multiFloorProject)) {
    const group = roomSectionGroupForItem(item, multiFloorProject);
    groupedItems.set(group.key, [...(groupedItems.get(group.key) ?? []), item]);
    groupTitles.set(group.key, group.title);
  }
  [...groupedItems.entries()].forEach(([key, groupItems], index) => {
    groups.push({
      key,
      title: groupTitles.get(key) ?? key,
      items: groupItems.filter((item) => !items.includes(item) || remainingItems.has(item)),
      order: index,
    });
  });
  return groups
    .filter((group) => group.items.length > 0)
    .sort((left, right) => roomSectionGroupSortValue(left) - roomSectionGroupSortValue(right) || left.order - right.order)
    .map(({ order, ...group }) => group);
}

function roomSectionGroupSortValue(group: OrderedRoomSectionGroup): number {
  return floorSortValue(group.items[0]?.floor ?? "");
}

function floorSortValue(floor: string): number {
  const normalized = floor.trim();
  const negativeChineseMatch = normalized.match(/^负([一二三四五六七八九十\d]+)[层楼]?$/);
  if (negativeChineseMatch) {
    return -chineseFloorNumber(negativeChineseMatch[1]);
  }
  const chineseMatch = normalized.match(/^([一二三四五六七八九十\d]+)[层楼]?$/);
  if (chineseMatch) {
    return chineseFloorNumber(chineseMatch[1]);
  }
  const basementMatch = normalized.match(/^(?:B|b|负)(\d+)$/);
  if (basementMatch) {
    return -Number(basementMatch[1]);
  }
  const numberMatch = normalized.match(/^(-?\d+)/);
  if (numberMatch) {
    return Number(numberMatch[1]);
  }
  return Number.MAX_SAFE_INTEGER;
}

function chineseFloorNumber(value: string): number {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const numerals: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (value === "十") {
    return 10;
  }
  if (value.startsWith("十")) {
    return 10 + (numerals[value.slice(1)] ?? 0);
  }
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (numerals[tens] ?? 0) * 10 + (ones ? numerals[ones] ?? 0 : 0);
  }
  return numerals[value] ?? Number.MAX_SAFE_INTEGER;
}

function roomSectionGroupForItem(item: QuoteMapping["items"][number], multiFloorProject: boolean): Pick<RoomSectionGroup, "key" | "title"> {
  if (multiFloorProject && item.space_type === "卫生间") {
    return { key: bathroomSectionKey(item.floor), title: bathroomSectionTitle(item.floor) };
  }
  if (!multiFloorProject) {
    return { key: item.space_name, title: `${item.space_name}工程` };
  }
  return {
    key: `${item.floor}::${item.space_name}`,
    title: standardRoomSectionTitle(item.floor, item.space_name),
  };
}

function bathroomSectionKey(floor: string): string {
  return `${floor}::卫生间、盥洗区`;
}

function bathroomSectionTitle(floor: string): string {
  return `${sectionFloorPrefix(floor)}卫生间、盥洗区工程`;
}

function standardRoomSectionTitle(floor: string, spaceName: string): string {
  const match = spaceName.match(/^(.+?)([一二三四五六七八九十]+)$/);
  if (match) {
    return `${sectionFloorPrefix(floor)}${match[1]}工程${match[2]}`;
  }
  return `${sectionFloorPrefix(floor)}${spaceName}工程`;
}

function sectionFloorPrefix(floor: string): string {
  return floor && floor !== "全屋" ? floor : "";
}

function bathroomInstallationItemsFromOptions(options: QuoteExcelOptions, multiFloorProject: boolean): QuoteMapping["items"] {
  const bathroomRows = options.bathroomRows ?? [];
  const bathroomChoices = options.bathroomChoices ?? {};
  const items: QuoteMapping["items"] = [];
  const quantityByFloor = new Map<string, { floor: string; quantity: number }>();
  const displayNames = displayBathroomNamesByRow(bathroomRows);
  bathroomRows.forEach((row, index) => {
    const choice = bathroomChoices[`${row.floor}::${row.spaceName}::${index}`] ?? { shower: "淋浴隔断" };
    if (choice?.shower === "淋浴隔断" || choice?.shower === "玻璃淋浴房") {
      if (multiFloorProject) {
        const current = quantityByFloor.get(row.floor) ?? { floor: row.floor, quantity: 0 };
        quantityByFloor.set(row.floor, { ...current, quantity: current.quantity + 1 });
      } else {
        items.push(bathroomInstallationItem(row.floor, displayNames.get(row) ?? row.spaceName, 1));
      }
    }
  });
  return [...items, ...[...quantityByFloor.values()].map((entry) => bathroomInstallationItem(entry.floor, "卫生间、盥洗区", entry.quantity))];
}

function bathroomInstallationItem(floor: string, spaceName: string, quantity: number): QuoteMapping["items"][number] {
  const price = TEMPLATE_PRICES["淋浴隔断安装"];
  const unitPrice = round2(price.material + price.auxiliary + price.labor);
  return {
    floor,
    space_name: spaceName,
    space_type: "卫生间",
    item_name: "淋浴隔断安装",
    quantity,
    unit: "套",
    unit_price: unitPrice,
    material_price: price.material,
    auxiliary_price: price.auxiliary,
    labor_price: price.labor,
    amount: round2(quantity * unitPrice),
  };
}

function displayBathroomNamesByRow(rows: QuantityRow[]): Map<QuantityRow, string> {
  const totalByName = new Map<string, number>();
  rows.forEach((row) => totalByName.set(row.spaceName, (totalByName.get(row.spaceName) ?? 0) + 1));
  const seenByName = new Map<string, number>();
  return new Map(rows.map((row) => {
    const total = totalByName.get(row.spaceName) ?? 0;
    if (total <= 1) {
      return [row, row.spaceName] as const;
    }
    const nextIndex = (seenByName.get(row.spaceName) ?? 0) + 1;
    seenByName.set(row.spaceName, nextIndex);
    return [row, `${row.spaceName}${chineseSectionCode(nextIndex)}`] as const;
  }));
}

function isMultiFloorProject(items: QuoteMapping["items"], bathroomRows: QuantityRow[] = []): boolean {
  const floors = new Set<string>();
  items.filter((item) => item.floor && item.floor !== "全屋").forEach((item) => floors.add(item.floor));
  bathroomRows.filter((row) => row.floor && row.floor !== "全屋").forEach((row) => floors.add(row.floor));
  return floors.size > 1;
}

function fixedSectionItems(items: QuoteMapping["items"], remainingItems: Set<QuoteMapping["items"][number]>, section: QuoteTemplateSection): QuoteMapping["items"] {
  return items.filter((item) => remainingItems.has(item) && section.itemNames.some((templateItemName) => itemMatchesTemplate(item.item_name, templateItemName)));
}

function isRoomSectionItem(itemName: string): boolean {
  return ROOM_SECTION_ITEM_NAMES.some((templateItemName) => itemMatchesTemplate(itemName, templateItemName));
}

function itemMatchesTemplate(itemName: string, templateItemName: string): boolean {
  if (itemName === templateItemName) {
    return true;
  }
  if (TEMPLATE_ITEM_NAME_SET.has(itemName)) {
    return false;
  }
  return itemName.includes(templateItemName);
}

function chineseSectionCode(index: number): string {
  const numerals = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (index <= 10) {
    return index === 10 ? "十" : numerals[index];
  }
  if (index < 20) {
    return `十${numerals[index - 10]}`;
  }
  const tens = Math.floor(index / 10);
  const ones = index % 10;
  return `${numerals[tens]}十${ones === 0 ? "" : numerals[ones]}`;
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

function templatePriceForItem(item: QuoteMapping["items"][number]): QuoteTemplatePrice {
  if (item.material_price !== undefined || item.auxiliary_price !== undefined || item.labor_price !== undefined) {
    return {
      material: item.material_price ?? 0,
      auxiliary: item.auxiliary_price ?? 0,
      labor: item.labor_price ?? 0,
      note: TEMPLATE_PRICES[item.item_name]?.note ?? "",
    };
  }
  return TEMPLATE_PRICES[item.item_name] ?? { material: item.unit_price, auxiliary: 0, labor: 0, note: "" };
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
