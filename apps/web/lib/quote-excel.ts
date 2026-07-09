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
  "双眼皮/边吊吊顶",
  "石膏线吊顶",
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

const ONE_ITEM_PLACEHOLDER_NAMES = new Set<string>();
const EXCEL_PLACEHOLDER_ITEM_NAMES = new Set<string>();
const HYDROPOWER_STRONG_WEAK_ITEM_NAMES = ["强电插座", "开关", "灯位", "筒灯/射灯", "设备专线", "弱电点位", "强电线管", "弱电线管", "强电箱", "弱电箱", "分配电箱"];
const HYDROPOWER_PLUMBING_ITEM_NAMES = ["给水点", "热水点", "排水点", "给水管", "排水管"];

const FIXED_TEMPLATE_SECTIONS: QuoteTemplateSectionDefinition[] = [
  { title: "全屋拆改工程", itemNames: ["拆改及拆墙", "砌砖墙", "砌120厚砖墙", "砌240厚砖墙", "现浇钢筋混凝土楼板", "外墙批嵌以及修补"] },
  {
    title: "其他工程",
    itemNames: ["砖墙门窗洞过梁", "水泥墙开槽", "打混凝土过梁孔", "厨房、卫生间排污管包隔音棉", "补线、管槽及零星修补", "垃圾清运费", "材料搬运费", "墙地面砖现场保护"],
  },
  { title: "强弱电工程", itemNames: HYDROPOWER_STRONG_WEAK_ITEM_NAMES },
  { title: "给排水工程", itemNames: HYDROPOWER_PLUMBING_ITEM_NAMES },
  { title: "主材项目", itemNames: ["地面瓷砖", "墙面瓷砖", "瓷砖加工费"] },
  { title: "全屋定制、衣柜、橱柜、全屋家具", itemNames: ["全屋定制", "橱柜", "背景墙"] },
  { title: "室内门", itemNames: ["入户门", "室内门", "卫生间门", "厨房推拉门", "厨房推拉门双包套", "阳台推拉门", "阳台推拉门双包套", "铝合金封门窗"] },
  { title: "集成吊顶、卫浴、全屋开关灯饰", itemNames: ["厨房卫生间集成吊顶", "浴室柜", "马桶", "蹲坑", "淋浴隔断", "玻璃淋浴房", "花洒", "卫浴五件套", "全屋插座开关", "全屋灯饰"] },
  { title: "其他（窗帘、美缝、窗台石等）", itemNames: ["美缝", "窗帘", "窗台石", "楼梯扶手", "栏杆/护栏", "全屋保洁"] },
];
const TEMPLATE_ITEM_NAME_SET = new Set([...ROOM_SECTION_ITEM_NAMES, ...FIXED_TEMPLATE_SECTIONS.flatMap((section) => section.itemNames)]);

export const EXCEL_FIXED_PLACEHOLDER_ITEMS: ManualQuoteDraftItem[] = [
  { floor: "全屋", space_name: "全屋", space_type: "全屋", item_name: "砖墙门窗洞过梁" },
  { floor: "一层", space_name: "全屋", space_type: "全屋", item_name: "铝合金封门窗" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "蹲坑" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "淋浴隔断" },
  { floor: "一层", space_name: "卫生间", space_type: "卫生间", item_name: "玻璃淋浴房" },
];
EXCEL_FIXED_PLACEHOLDER_ITEMS.forEach((item) => EXCEL_PLACEHOLDER_ITEM_NAMES.add(item.item_name));

type QuoteTemplatePrice = {
  material: number;
  auxiliary: number;
  labor: number;
  note: string;
};

const TEMPLATE_PRICES: Record<string, QuoteTemplatePrice> = {
  墙面界面剂处理: { material: 0, auxiliary: 4, labor: 3, note: "立邦界面处理剂，墙面基层封闭处理。" },
  墙面批嵌: { material: 0, auxiliary: 15, labor: 10, note: "三遍基础腻子找平，立邦腻子粉，含打磨。" },
  墙面乳胶漆: { material: 10, auxiliary: 0, labor: 10, note: "乳胶漆一底两面，立邦金装五合一或同档产品。" },
  厨房卫生间集成吊顶: { material: 120, auxiliary: 0, labor: 0, note: "铝扣板或集成吊顶模块，含龙骨、收边条及安装。" },
  轻钢龙骨平顶: { material: 60, auxiliary: 30, labor: 90, note: "兔宝宝双面防潮石膏板，轻钢龙骨基层，含龙骨配件、辅料及灯槽制作。" },
  "双眼皮/边吊吊顶": { material: 35, auxiliary: 15, labor: 30, note: "兔宝宝双面防潮石膏板，轻钢龙骨或木工板基层，含辅材、收口及灯槽制作。" },
  石膏线吊顶: { material: 12, auxiliary: 5, labor: 18, note: "成品石膏线条或同档线条，含基层处理、粘贴固定及收口。" },
  顶面批嵌: { material: 0, auxiliary: 15, labor: 10, note: "三遍基础腻子找平，立邦腻子粉，含打磨。" },
  顶面乳胶漆: { material: 10, auxiliary: 0, labor: 10, note: "乳胶漆一底两面，立邦金装五合一或同档产品。" },
  地面找平: { material: 0, auxiliary: 25, labor: 30, note: "32.5R普通水泥砂浆找平，厚度不大于50mm。" },
  "地面砖铺贴(750X1500)": { material: 40, auxiliary: 8, labor: 50, note: "主材甲供，辅料为32.5R普通水泥、黄沙，普通标准铺贴。" },
  地面瓷砖: { material: 80, auxiliary: 0, labor: 0, note: "750*1500 地面瓷砖主材，品牌、花色按选样确认。" },
  墙面瓷砖: { material: 55, auxiliary: 0, labor: 0, note: "600*1200 墙面瓷砖主材，品牌、花色按选样确认。" },
  瓷砖加工费: { material: 6, auxiliary: 0, labor: 0, note: "瓷砖切割、倒角、磨边等现场加工费用。" },
  美缝: { material: 0, auxiliary: 10, labor: 0, note: "瓷砖缝隙清理后填缝美缝，含美缝材料及施工。" },
  强电插座: { material: 5, auxiliary: 12, labor: 55, note: "不含面板；含底盒、开槽、穿线。" },
  开关: { material: 5, auxiliary: 10, labor: 53, note: "不含面板；含底盒、开槽、穿线。" },
  灯位: { material: 0, auxiliary: 15, labor: 95, note: "灯具由业主自购；含灯线预留和接线。" },
  "筒灯/射灯": { material: 0, auxiliary: 15, labor: 80, note: "灯具由业主自购，含灯线预留、开孔及接线安装。" },
  设备专线: { material: 65, auxiliary: 20, labor: 95, note: "空调及设备专线，含专线、漏保和独立回路。" },
  弱电点位: { material: 5, auxiliary: 10, labor: 47, note: "不含弱电面板；含底盒和穿线。" },
  强电线管: { material: 16, auxiliary: 5, labor: 17, note: "含线管、2.5mm2线、开槽和封槽。" },
  弱电线管: { material: 12, auxiliary: 4, labor: 14, note: "含线管、网线或电视线。" },
  强电箱: { material: 450, auxiliary: 100, labor: 300, note: "含配电箱箱体、空开、漏保及接线安装。" },
  弱电箱: { material: 220, auxiliary: 60, labor: 170, note: "含弱电箱箱体、模块及接线安装。" },
  分配电箱: { material: 0, auxiliary: 0, labor: 0, note: "含分配电箱箱体、空开、漏保及接线安装。" },
  给水点: { material: 50, auxiliary: 25, labor: 85, note: "含PPR管、阀门和接头。" },
  热水点: { material: 55, auxiliary: 30, labor: 95, note: "含PPR热水管和保温管。" },
  排水点: { material: 60, auxiliary: 35, labor: 105, note: "含PVC管、存水弯和地漏。" },
  给水管: { material: 22, auxiliary: 10, labor: 23, note: "含PPR管、管件和热熔。" },
  排水管: { material: 25, auxiliary: 12, labor: 28, note: "含PVC管、弯头和胶水。" },
  材料搬运费: { material: 0, auxiliary: 3, labor: 12, note: "施工材料现场搬运及楼层转运，特殊吊装另计。" },
  垃圾清运费: { material: 0, auxiliary: 0, labor: 12, note: "施工垃圾搬运至物业指定堆放点，外运车费另计。" },
  墙地面砖现场保护: { material: 0, auxiliary: 6, labor: 15, note: "墙地面砖成品保护。" },
  "墙面贴瓷砖(600X1200)": { material: 40, auxiliary: 8, labor: 50, note: "辅料为32.5R普通水泥、黄沙、雨虹瓷砖背胶及胶泥。" },
  墙地面防漏处理: { material: 35, auxiliary: 7, labor: 18, note: "墙地面清理，雨虹防水涂料多遍涂刷，卫生间墙面防水高度按规范施工。" },
  窗台石铺贴: { material: 0, auxiliary: 20, labor: 25, note: "窗台石主材及磨边，辅料为32.5R普通水泥、黄沙，不足一米按一米计算。" },
  淋浴隔断安装: { material: 0, auxiliary: 0, labor: 200, note: "淋浴隔断或玻璃淋浴房安装人工。" },
  楼梯踏步铺贴: { material: 0, auxiliary: 45, labor: 80, note: "楼梯踏步砖或石材铺贴，含基础辅材及人工。" },
  砌砖墙: { material: 45, auxiliary: 25, labor: 80, note: "32.5R普通水泥、沙、砖及人工辅料，墙体砌筑拉结处理。" },
  砌120厚砖墙: { material: 45, auxiliary: 25, labor: 80, note: "32.5R普通水泥、沙、砖及人工辅料，120厚砖墙砌筑。" },
  砌240厚砖墙: { material: 80, auxiliary: 30, labor: 120, note: "32.5R普通水泥、沙、砖及人工辅料，240厚砖墙砌筑并挂钢丝网。" },
  现浇钢筋混凝土楼板: { material: 145, auxiliary: 55, labor: 120, note: "42.5R普通水泥，10mm螺纹钢双层双向，钢筋绑扎、模板支设、混凝土浇筑及养护。" },
  拆改及拆墙: { material: 0, auxiliary: 10, labor: 60, note: "人工拆除。" },
  外墙批嵌以及修补: { material: 20, auxiliary: 15, labor: 35, note: "外墙基层修补、批嵌找平，含辅材及人工。" },
  砖墙门窗洞过梁: { material: 100, auxiliary: 0, labor: 20, note: "砖墙门窗洞口过梁制作安装，含基础材料及人工。" },
  水泥墙开槽: { material: 0, auxiliary: 4, labor: 8, note: "水泥墙面开槽，含开槽、清理及基础修补。" },
  打混凝土过梁孔: { material: 0, auxiliary: 0, labor: 35, note: "混凝土过梁钻孔，含定位、开孔及清理。" },
  "厨房、卫生间排污管包隔音棉": { material: 0, auxiliary: 35, labor: 15, note: "排污管包覆隔音棉，含扎带固定及收口处理。" },
  "补线、管槽及零星修补": { material: 0, auxiliary: 2.5, labor: 3, note: "线槽、管槽及零星墙地面修补，含基础辅材及人工。" },
  入户门: { material: 2500, auxiliary: 0, labor: 0, note: "入户防盗门供货及安装，含门锁、五金及基础调试。" },
  室内门: { material: 1200, auxiliary: 0, labor: 0, note: "室内静音门。" },
  卫生间门: { material: 900, auxiliary: 0, labor: 0, note: "铝合金玻璃门。" },
  厨房推拉门: { material: 400, auxiliary: 0, labor: 0, note: "铝合金推拉门。" },
  厨房推拉门双包套: { material: 110, auxiliary: 0, labor: 0, note: "极窄铝合金双包套。" },
  阳台推拉门: { material: 400, auxiliary: 0, labor: 0, note: "铝合金推拉门供货及安装，含基础五金。" },
  阳台推拉门双包套: { material: 110, auxiliary: 0, labor: 0, note: "极窄铝合金双包套，含收边及安装。" },
  铝合金封门窗: { material: 600, auxiliary: 0, labor: 0, note: "铝合金门窗封装，含型材、玻璃、五金及安装。" },
  橱柜: { material: 699, auxiliary: 0, labor: 0, note: "橱柜柜体、柜门、五金、安装及辅料。" },
  全屋定制: { material: 699, auxiliary: 0, labor: 0, note: "全屋定制柜体、柜门、五金、安装及辅料。" },
  背景墙: { material: 280, auxiliary: 0, labor: 0, note: "木饰面外石材或玻璃部分需按实际补差。" },
  马桶: { material: 1500, auxiliary: 0, labor: 0, note: "轻智能马桶。" },
  蹲坑: { material: 500, auxiliary: 0, labor: 0, note: "陶瓷蹲便器供货及安装，含基础连接件。" },
  浴室柜: { material: 1800, auxiliary: 0, labor: 0, note: "岩板一体盆，含龙头及上下水。" },
  淋浴隔断: { material: 800, auxiliary: 0, labor: 0, note: "钢化玻璃淋浴隔断，含五金配件及安装。" },
  玻璃淋浴房: { material: 1200, auxiliary: 0, labor: 0, note: "钢化玻璃淋浴房，含五金配件、防水收口及安装。" },
  花洒: { material: 900, auxiliary: 0, labor: 0, note: "花洒（九牧、法恩莎）。" },
  卫浴五件套: { material: 280, auxiliary: 0, labor: 0, note: "马桶刷、毛巾架、纸巾盒等。" },
  全屋插座开关: { material: 20, auxiliary: 0, labor: 0, note: "开关插座面板及基础安装，品牌、系列按选样确认。" },
  全屋灯饰: { material: 0, auxiliary: 0, labor: 0, note: "全屋灯具供货及安装，品牌、型号按选样确认。" },
  窗帘: { material: 50, auxiliary: 20, labor: 0, note: "窗帘布艺、轨道及基础辅材，材质和花色按选样确认。" },
  窗台石: { material: 65, auxiliary: 0, labor: 0, note: "窗台石主材供货，含磨边，材质和花色按选样确认。" },
  全屋保洁: { material: 0, auxiliary: 0, labor: 0, note: "完工基础保洁，含施工垃圾清扫及表面清洁。" },
  暗窗帘箱: { material: 35, auxiliary: 10, labor: 45, note: "木工板立架，石膏板饰面。" },
  楼梯扶手: { material: 480, auxiliary: 0, labor: 0, note: "楼梯扶手供货及安装，含立柱、连接件、收口及基础调试。" },
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
    .quoteSectionRow td, .quoteSubsectionRow td { font-weight: 700; height: 14.75pt; }
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
      ${quoteTemplateBodyHtmlRows(groupedQuoteRows)}
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

function quoteTemplateBodyHtmlRows(rows: string[][]): string {
  const subtotalRows: number[] = [];
  let currentSectionStartRow = 0;
  let directTotalRow = 0;
  let managementFeeRow = 0;
  let taxRow = 0;

  return rows.map((row, index) => {
    const excelRow = excelRowNumber(index);
    const className = quoteTemplateRowClass(row);
    let amountFormula = "";
    if (className === "quoteSectionRow") {
      currentSectionStartRow = excelRow + 1;
    } else if (isQuoteItemRow(row)) {
      amountFormula = `=D${excelRow}*(E${excelRow}+F${excelRow}+G${excelRow})`;
    } else if (className === "quoteSubtotalRow") {
      amountFormula = currentSectionStartRow > 0 && currentSectionStartRow <= excelRow - 1
        ? `=SUM(H${currentSectionStartRow}:H${excelRow - 1})`
        : "=0";
      subtotalRows.push(excelRow);
      currentSectionStartRow = 0;
    } else if (className === "quoteTotalRow") {
      if (row[0] === "A") {
        amountFormula = subtotalRows.length > 0 ? `=SUM(${subtotalRows.map((rowNumber) => `H${rowNumber}`).join(",")})` : "=0";
        directTotalRow = excelRow;
      } else if (row[0] === "B") {
        amountFormula = directTotalRow > 0 ? `=H${directTotalRow}*5%` : "=0";
        managementFeeRow = excelRow;
      } else if (row[0] === "C") {
        amountFormula = directTotalRow > 0 && managementFeeRow > 0 ? `=(H${directTotalRow}+H${managementFeeRow})*3%` : "=0";
        taxRow = excelRow;
      } else if (row[0] === "D") {
        amountFormula = directTotalRow > 0 && taxRow > 0 ? `=SUM(H${directTotalRow}:H${taxRow})` : "=0";
      }
    }
    return quoteTemplateHtmlRow(row, amountFormula ? { 7: amountFormula } : undefined);
  }).join("\n      ");
}

function quoteTemplateHtmlRow(row: string[], formulas?: Partial<Record<number, string>>): string {
  const className = quoteTemplateRowClass(row);
  return `<tr${className ? ` class="${className}"` : ""}>${row.map((cell, index) => quoteTemplateHtmlCell(cell, formulas?.[index])).join("")}</tr>`;
}

function quoteTemplateHtmlCell(cell: string, formula?: string): string {
  return `<td${formula ? ` x:fmla="${escapeHtml(formula)}"` : ""}>${escapeHtml(cell)}</td>`;
}

function excelRowNumber(bodyRowIndex: number): number {
  return bodyRowIndex + 5;
}

function isQuoteItemRow(row: string[]): boolean {
  return /^\d+$/.test(row[0]) && row[1] !== "";
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
  if (!row[0] && row[1] && row.slice(2).every((cell) => cell === "")) {
    return "quoteSubsectionRow";
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
  let currentSubsection = "";
  for (const templateItemName of section.itemNames) {
    const matchingItems = sectionItems.filter((item) => itemMatchesTemplate(item.item_name, templateItemName));
    const manualQuantity = manualQuantityForItem(templateItemName, options);
    const subsection = hydropowerSubsectionForItem(section, templateItemName);
    if (subsection && subsection !== currentSubsection && hydropowerSubsectionHasRows(subsection, sectionItems, options)) {
      rows.push(subsectionHeaderRow(subsection));
      currentSubsection = subsection;
    }
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
  if (["蹲坑", "马桶", "淋浴隔断", "玻璃淋浴房"].includes(itemName)) {
    return "套";
  }
  if (["砖墙门窗洞过梁"].includes(itemName)) {
    return "支";
  }
  if (itemName.includes("门") && !itemName.includes("推拉门") && !itemName.includes("封门窗")) {
    return "樘";
  }
  if (["砌砖墙", "砌120厚砖墙", "砌240厚砖墙", "现浇钢筋混凝土楼板", "外墙批嵌以及修补", "水泥墙开槽", "补线、管槽及零星修补", "铝合金封门窗"].includes(itemName)) {
    return "M2";
  }
  if (["阳台推拉门双包套", "窗帘", "窗台石铺贴", "窗台石"].includes(itemName)) {
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

function subsectionHeaderRow(title: string): string[] {
  return ["", title, "", "", "", "", "", "", ""];
}

function hydropowerSubsectionForItem(section: QuoteTemplateSection, itemName: string): string {
  return "";
}

function hydropowerSubsectionHasRows(subsection: string, sectionItems: QuoteMapping["items"], options: QuoteExcelOptions): boolean {
  const itemNames = subsection === "强弱电工程" ? HYDROPOWER_STRONG_WEAK_ITEM_NAMES : HYDROPOWER_PLUMBING_ITEM_NAMES;
  return itemNames.some((itemName) => manualQuantityForItem(itemName, options) !== undefined || sectionItems.some((item) => itemMatchesTemplate(item.item_name, itemName)));
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
  if (item.space_type === "挑空") {
    return multiFloorProject
      ? { key: `${item.floor}::挑空`, title: `${sectionFloorPrefix(item.floor)}挑空工程` }
      : { key: "挑空", title: "挑空工程" };
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
