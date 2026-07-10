import assert from "node:assert/strict";
import { buildQuoteExcelHtml, EXCEL_FIXED_PLACEHOLDER_ITEMS, quoteExcelFileName } from "./quote-excel.ts";
import { defaultProjectRows, defaultProjectSummary } from "./default-project.ts";
import { buildQuoteMapping, defaultQuoteRules } from "./quote-mapping.ts";
import type { QuoteMapping } from "./quote-mapping.ts";

const mapping: QuoteMapping = {
  items: [
    {
      floor: "一层",
      space_name: "厨房",
      space_type: "厨房",
      item_name: "厨房卫生间集成吊顶",
      quantity: 4.48,
      unit: "m2",
      unit_price: 120,
      amount: 537.6,
    },
    {
      floor: "一层",
      space_name: "厨房",
      space_type: "厨房",
      item_name: "地面找平",
      quantity: 4.48,
      unit: "m2",
      unit_price: 45,
      amount: 201.6,
    },
    {
      floor: "全屋",
      space_name: "全屋",
      space_type: "全屋",
      item_name: "强电布线 & 水路复核",
      quantity: 88.66,
      unit: "M2",
      unit_price: 78,
      amount: 6915.48,
    },
  ],
  summary: {
    space_count: 3,
    building_area_m2: 88.66,
    item_count: 3,
    total_amount: 7654.68,
  },
  curtain_quote_readiness: {
    ready_count: 1,
    pending_count: 0,
    ready_space_names: ["主卧"],
    pending_space_names: [],
  },
  curtain_quote_candidates: [],
  atrium_curtain_candidates: [],
  building_area_quote_readiness: {
    building_area_m2: 88.66,
    required_item_names: ["强电布线"],
    missing_item_names: [],
  },
  legacy_hydropower_area_rule_item_names: [],
  quantity_health_readiness: {
    total: 0,
    warning: 0,
    info: 0,
    label: "当前无待确认项",
  },
};

assert.equal(quoteExcelFileName("test-case.dxf"), "test-case.quote-draft.xls");
assert.equal(quoteExcelFileName("样例数据"), "quote-draft.xls");

const html = buildQuoteExcelHtml(mapping, "A&B 项目");

assert.ok(html.startsWith("\uFEFF<html"), "Excel HTML should include UTF-8 BOM for Chinese compatibility");
assert.ok(html.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), "Excel HTML should include Excel namespaces from the print template");
assert.ok(html.includes("@page"), "Excel HTML should include print page setup");
assert.ok(html.includes("<title>A&amp;B 项目清单式报价表</title>"));
assert.ok(html.includes("<tr class=\"quoteTitleRow\"><th colspan=\"9\">工程(预) 算表</th></tr>"), "Excel title row should merge across all quote columns");
assert.ok(html.includes("<td colspan=\"2\">地址名称：A&amp;B 项目</td>"), "Excel draft should use the customer info header from the adjusted template");
assert.ok(html.includes("<td colspan=\"4\">客户：</td>"), "Excel draft should reserve customer information in the header");
assert.ok(html.includes("<td colspan=\"2\">装修面积：88.66</td>"));
assert.ok(html.includes("<th>编号</th><th>项目名称</th><th>单位</th><th>数量</th><th colspan=\"2\">材料费(元)</th><th>人工费\n(元)</th><th>总价(元)</th><th>材  料  及  工  艺  说  明</th>"));
assert.ok(html.includes("<th colspan=\"2\">材料费(元)</th>"), "Excel material fee header should span main and auxiliary material columns");
assert.ok(html.includes("<th></th><th></th><th></th><th></th><th>主材\n单价</th><th>辅材\n单价</th><th></th><th></th><th></th>"));
assert.ok(html.includes('<table width="1040"'), "Excel draft should fit within A4 narrow print margins");
assert.ok(html.includes("font-size: 9pt"), "Excel draft should use a larger body font after shrinking columns");
assert.ok(html.includes('<col width="54"'), "Excel draft should use the A4-printable index column width");
assert.ok(html.includes('<col width="236"'), "Excel draft should give item names an A4-printable width");
assert.ok(html.includes('<col width="270"'), "Excel draft should give process notes an A4-printable width");
assert.ok(html.includes("<tr class=\"quoteTitleRow\">"), "Excel draft should style the title row");
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>一</td><td>全屋拆改工程</td>"), "Excel draft should style section rows");
assert.ok(html.includes("<tr class=\"quoteSubtotalRow\"><td></td><td>小 计</td>"), "Excel draft should style subtotal rows");
assert.ok(html.includes("<tr class=\"quoteTotalRow\"><td>A</td><td>直接费合计</td>"), "Excel draft should style total rows");
assert.ok(html.includes("<tr class=\"quoteFooterNoteRow\"><td colspan=\"9\">编制说明：</td></tr>"), "Excel draft should include the adjusted footer notes");
assert.ok(html.includes("施工以合同与预算为准，口头承诺无效。"));
assert.ok(html.includes("<td colspan=\"2\">客户签名：</td><td colspan=\"5\">设计师：</td><td colspan=\"2\">报价员：</td>"), "Excel draft should include the adjusted signature footer");
assert.ok(!html.includes("<h2>空间小计</h2>"));
assert.ok(!html.includes("<h2>人工补项</h2>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>一</td><td>全屋拆改工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>二</td><td>厨房工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>三</td><td>其他工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>四</td><td>强弱电工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>五</td><td>给排水工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>六</td><td>主材项目</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>七</td><td>全屋定制、衣柜、橱柜、全屋家具</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>八</td><td>室内门</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>九</td><td>集成吊顶、卫浴、全屋开关灯饰</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr class=\"quoteSectionRow\"><td>十</td><td>其他（窗帘、美缝、窗台石等）</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(!html.includes("<td>过道工程</td>"));
assert.ok(!html.includes("<td>主卧工程</td>"));
assert.ok(!html.includes("<td>次卧工程</td>"));
assert.ok(!html.includes("<td>露台工程</td>"));
assert.ok(html.indexOf("<td>二</td><td>厨房工程</td>") < html.indexOf("<td>地面找平</td>"));
assert.ok(html.indexOf("<td>八</td><td>集成吊顶、卫浴、全屋开关灯饰</td>") < html.indexOf("<td>厨房卫生间集成吊顶</td>"));
assert.ok(!html.includes("<td>水电工程</td>"), "Excel draft should promote hydropower subcategories to top-level sections");
assertQuoteRow(html, "厨房卫生间集成吊顶", "m2", "4.48", "120.00", "0.00", "0.00", "537.60");
assertQuoteRow(html, "地面找平", "m2", "4.48", "0.00", "20.00", "25.00", "201.60");
assertQuoteRow(html, "强电布线 & 水路复核", "M2", "88.66", "78.00", "0.00", "0.00", "6915.48");
assertSubtotalAmount(html, "201.60");
assertSubtotalAmount(html, "537.60");
assertSubtotalAmount(html, "6915.48");
assert.ok(!html.includes("<td>轻钢龙骨平顶</td>"), "space sections should not show missing fixed room items");
assert.ok(!html.includes("<td>暗窗帘箱</td><td></td>"), "public curtain section should not contain space-only curtain box placeholders");
assertTotalRow(html, "A", "直接费合计", /=SUMIF\(B5:B\d+,&quot;小 计&quot;,H5:H\d+\)/, "7654.68");
assertTotalRow(html, "B", "工程管理费(D=A* 5%)", /=H\d+\*5%/, "382.73");
assertTotalRow(html, "C", "税金E=(A+B)* 3%", /=\(H\d+\+H\d+\)\*3%/, "241.12");
assertTotalRow(html, "D", "工程总造价F=(A+B+C)", /=SUM\(H\d+:H\d+\)/, "8278.53");
assert.equal(EXCEL_FIXED_PLACEHOLDER_ITEMS.length, 5);
assert.deepEqual(EXCEL_FIXED_PLACEHOLDER_ITEMS.map((item) => item.item_name), [
  "砖墙门窗洞过梁",
  "铝合金封门窗",
  "蹲坑",
  "淋浴隔断",
  "玻璃淋浴房",
]);
assertQuoteRow(html, "砖墙门窗洞过梁", "支", "0", "100.00", "0.00", "20.00", "0.00");
assert.ok(html.includes("占位行不计入小计"), "fixed zero placeholders should explain that they do not affect totals");
assertQuoteRow(html, "铝合金封门窗", "M2", "0", "600.00", "0.00", "0.00", "0.00");
assertQuoteRow(html, "蹲坑", "套", "0", "500.00", "0.00", "0.00", "0.00");
assertQuoteRow(html, "淋浴隔断", "套", "0", "800.00", "0.00", "0.00", "0.00");
assertQuoteRow(html, "玻璃淋浴房", "套", "0", "1200.00", "0.00", "0.00", "0.00");
assert.ok(!html.includes("<td>入户门</td><td>樘</td><td>0</td>"));
assert.ok(!html.includes("<td>阳台推拉门</td><td>M2</td><td>0</td>"));
assert.ok(!html.includes("<td>阳台推拉门双包套</td><td>M</td><td>0</td>"));
assert.ok(!html.includes("<td>窗台石</td><td>套</td>"));
assert.ok(!html.includes("<td>包上/下水管道(单管)</td>"));
assert.ok(!html.includes("<td>砌240厚砖墙</td>"));
assert.ok(!html.includes("<td>窗帘</td><td>项</td><td>1</td>"));
assert.ok(html.includes("<td>强电布线 &amp; 水路复核</td>"), "item names should be escaped");
assert.ok(!html.includes("强电布线 & 水路复核</td>"), "raw ampersands should not leak into HTML");

const hardQuoteHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    quote_mode: "hard",
    selected_quote_package_ids: [],
    items: mapping.items.filter((item) => item.item_name !== "厨房卫生间集成吊顶"),
  },
  "硬装测试",
);
assert.ok(hardQuoteHtml.includes("<td>全屋拆改工程</td>"));
assert.ok(hardQuoteHtml.includes("<td>厨房工程</td>"));
assert.ok(hardQuoteHtml.includes("<td>其他工程</td>"));
assert.ok(hardQuoteHtml.includes("<td>强弱电工程</td>"));
assert.ok(hardQuoteHtml.includes("<td>给排水工程</td>"));
assert.ok(!hardQuoteHtml.includes("<td>主材项目</td>"));
assert.ok(!hardQuoteHtml.includes("<td>全屋定制、衣柜、橱柜、全屋家具</td>"));
assert.ok(!hardQuoteHtml.includes("<td>室内门</td>"));
assert.ok(!hardQuoteHtml.includes("<td>集成吊顶、卫浴、全屋开关灯饰</td>"));
assert.ok(!hardQuoteHtml.includes("<td>其他（窗帘、美缝、窗台石等）</td>"));
assert.ok(!hardQuoteHtml.includes("<td>厨房卫生间集成吊顶</td>"));

const hardPlusTileQuoteHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    quote_mode: "hard_plus",
    selected_quote_package_ids: ["main_materials", "other_finishing"],
    items: [
      ...mapping.items.filter((item) => item.item_name !== "厨房卫生间集成吊顶"),
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "地面瓷砖",
        quantity: 5,
        unit: "片",
        unit_price: 80,
        amount: 400,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "美缝",
        quantity: 12,
        unit: "M2",
        unit_price: 10,
        amount: 120,
      },
    ],
  },
  "半包加瓷砖",
);
assert.ok(hardPlusTileQuoteHtml.includes("<td>主材项目</td>"));
assert.ok(hardPlusTileQuoteHtml.includes("<td>其他（窗帘、美缝、窗台石等）</td>"));
assert.ok(!hardPlusTileQuoteHtml.includes("<td>全屋定制、衣柜、橱柜、全屋家具</td>"));
assert.ok(!hardPlusTileQuoteHtml.includes("<td>室内门</td>"));
assert.ok(!hardPlusTileQuoteHtml.includes("<td>集成吊顶、卫浴、全屋开关灯饰</td>"));
assertTotalRow(hardPlusTileQuoteHtml, "A", "直接费合计", /=SUMIF\(B5:B\d+,&quot;小 计&quot;,H5:H\d+\)/, "7637.08");

const hardPlusSingleTileItemQuoteHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    quote_mode: "hard_plus",
    selected_quote_package_ids: [],
    selected_quote_item_names: ["地面瓷砖"],
    items: [
      ...mapping.items.filter((item) => item.item_name !== "厨房卫生间集成吊顶"),
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "地面瓷砖",
        quantity: 5,
        unit: "片",
        unit_price: 80,
        amount: 400,
      },
    ],
  },
  "半包加单项瓷砖",
);
assert.ok(hardPlusSingleTileItemQuoteHtml.includes("<td>主材项目</td>"));
assert.ok(hardPlusSingleTileItemQuoteHtml.includes("<td>地面瓷砖</td>"));
assert.ok(!hardPlusSingleTileItemQuoteHtml.includes("<td>未归类自动清单</td>"));
assertTotalRow(hardPlusSingleTileItemQuoteHtml, "A", "直接费合计", /=SUMIF\(B5:B\d+,&quot;小 计&quot;,H5:H\d+\)/, "7517.08");

const hardPlusSingleOtherItemQuoteHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    quote_mode: "hard_plus",
    selected_quote_package_ids: [],
    selected_quote_item_names: ["美缝"],
    items: [
      ...mapping.items.filter((item) => item.item_name !== "厨房卫生间集成吊顶"),
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "美缝",
        quantity: 12,
        unit: "M2",
        unit_price: 10,
        amount: 120,
      },
    ],
  },
  "半包加单项美缝",
);
assert.ok(hardPlusSingleOtherItemQuoteHtml.includes("<td>其他（窗帘、美缝、窗台石等）</td>"));
assert.ok(hardPlusSingleOtherItemQuoteHtml.includes("<td>美缝</td>"));
assert.ok(!hardPlusSingleOtherItemQuoteHtml.includes("<td>未归类自动清单</td>"));

const duplicateHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      ...mapping.items,
      {
        floor: "一层",
        space_name: "厨房",
        space_type: "厨房",
        item_name: "厨房卫生间集成吊顶",
        quantity: 1,
        unit: "m2",
        unit_price: 120,
        amount: 120,
      },
      {
        floor: "一层",
        space_name: "主卧",
        space_type: "卧室",
        item_name: "室内门",
        quantity: 1,
        unit: "樘",
        unit_price: 1200,
        amount: 1200,
      },
      {
        floor: "一层",
        space_name: "次卧",
        space_type: "卧室",
        item_name: "室内门",
        quantity: 2,
        unit: "樘",
        unit_price: 1200,
        amount: 2400,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: mapping.summary.item_count + 3,
      total_amount: mapping.summary.total_amount + 3720,
    },
  },
  "重复项项目",
);

assert.equal(countOccurrences(duplicateHtml, "<td>厨房卫生间集成吊顶</td>"), 1);
assertQuoteRow(duplicateHtml, "厨房卫生间集成吊顶", "m2", "5.48", "120.00", "0.00", "0.00", "657.60");
assert.equal(countOccurrences(duplicateHtml, "<td>室内门</td><td>樘"), 1);
assertQuoteRow(duplicateHtml, "室内门", "樘", "3", "1200.00", "0.00", "0.00", "3600.00");

const atriumMergeHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "一层",
        space_name: "挑空一",
        space_type: "挑空",
        item_name: "地面砖铺贴(750X1500)",
        quantity: 12,
        unit: "m2",
        unit_price: 98,
        amount: 1176,
      },
      {
        floor: "一层",
        space_name: "挑空二",
        space_type: "挑空",
        item_name: "地面砖铺贴(750X1500)",
        quantity: 8,
        unit: "m2",
        unit_price: 98,
        amount: 784,
      },
      {
        floor: "二层",
        space_name: "卧室",
        space_type: "卧室",
        item_name: "墙面乳胶漆",
        quantity: 18,
        unit: "m2",
        unit_price: 20,
        amount: 360,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 3,
      total_amount: 2320,
    },
  },
  "挑空合并项目",
);

assert.equal(countOccurrences(atriumMergeHtml, "<td>一层挑空工程</td>"), 1);
assert.ok(!atriumMergeHtml.includes("<td>一层挑空工程一</td>"));
assert.ok(!atriumMergeHtml.includes("<td>一层挑空工程二</td>"));
assert.equal(countOccurrences(atriumMergeHtml, "<td>地面砖铺贴(750X1500)</td>"), 1);
assertQuoteRow(atriumMergeHtml, "地面砖铺贴(750X1500)", "m2", "20", "40.00", "8.00", "50.00", "1960.00");

const castSlabNoteHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "现浇钢筋混凝土楼板",
        quantity: 103.33,
        unit: "m2",
        unit_price: 320,
        amount: 33065.6,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 1,
      total_amount: 33065.6,
    },
  },
  "现浇楼板项目",
);

assert.ok(castSlabNoteHtml.includes("钢筋绑扎、模板支设、混凝土浇筑及养护"));
assert.ok(!castSlabNoteHtml.includes("QUOTE_CAST_SLAB"));
assert.ok(!castSlabNoteHtml.includes("默认单价待核定"));

const slidingDoorHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "一层",
        space_name: "厨房",
        space_type: "厨房",
        item_name: "厨房推拉门",
        quantity: 3.85,
        unit: "m2",
        unit_price: 400,
        amount: 1540,
      },
      {
        floor: "一层",
        space_name: "厨房",
        space_type: "厨房",
        item_name: "厨房推拉门双包套",
        quantity: 6.15,
        unit: "M",
        unit_price: 110,
        amount: 676.5,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 2,
      total_amount: 2216.5,
    },
  },
  "厨房推拉门项目",
);
assert.equal(countOccurrences(slidingDoorHtml, "<td>厨房推拉门</td><td>m2"), 1);
assert.equal(countOccurrences(slidingDoorHtml, "<td>厨房推拉门双包套</td><td>M"), 1);
assertQuoteRow(slidingDoorHtml, "厨房推拉门", "m2", "3.85", "400.00", "0.00", "0.00", "1540.00");
assertQuoteRow(slidingDoorHtml, "厨房推拉门双包套", "M", "6.15", "110.00", "0.00", "0.00", "676.50");
assert.ok(!slidingDoorHtml.includes("<td>厨房推拉门</td><td>m2</td><td>10</td>"));

const hydropowerSectionHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "强电插座",
        quantity: 37,
        unit: "位",
        unit_price: 72,
        material_price: 5,
        auxiliary_price: 12,
        labor_price: 55,
        amount: 2664,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "开关",
        quantity: 9,
        unit: "位",
        unit_price: 68,
        material_price: 5,
        auxiliary_price: 10,
        labor_price: 53,
        amount: 612,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "灯位",
        quantity: 8,
        unit: "位",
        unit_price: 110,
        material_price: 0,
        auxiliary_price: 15,
        labor_price: 95,
        amount: 880,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "设备专线",
        quantity: 8,
        unit: "位",
        unit_price: 180,
        material_price: 65,
        auxiliary_price: 20,
        labor_price: 95,
        amount: 1440,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "弱电点位",
        quantity: 6,
        unit: "位",
        unit_price: 62,
        material_price: 5,
        auxiliary_price: 10,
        labor_price: 47,
        amount: 372,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "强电线管",
        quantity: 86.5,
        unit: "M",
        unit_price: 38,
        material_price: 16,
        auxiliary_price: 5,
        labor_price: 17,
        amount: 3287,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "弱电线管",
        quantity: 49,
        unit: "M",
        unit_price: 30,
        material_price: 12,
        auxiliary_price: 4,
        labor_price: 14,
        amount: 1470,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "强电箱",
        quantity: 1,
        unit: "套",
        unit_price: 850,
        material_price: 450,
        auxiliary_price: 100,
        labor_price: 300,
        amount: 850,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "弱电箱",
        quantity: 1,
        unit: "套",
        unit_price: 450,
        material_price: 220,
        auxiliary_price: 60,
        labor_price: 170,
        amount: 450,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "给水点",
        quantity: 3,
        unit: "位",
        unit_price: 160,
        material_price: 50,
        auxiliary_price: 25,
        labor_price: 85,
        amount: 480,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "热水点",
        quantity: 3,
        unit: "位",
        unit_price: 180,
        material_price: 55,
        auxiliary_price: 30,
        labor_price: 95,
        amount: 540,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "排水点",
        quantity: 8,
        unit: "位",
        unit_price: 200,
        material_price: 60,
        auxiliary_price: 35,
        labor_price: 105,
        amount: 1600,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "排水管",
        quantity: 21,
        unit: "M",
        unit_price: 65,
        material_price: 25,
        auxiliary_price: 12,
        labor_price: 28,
        amount: 1365,
      },
      {
        floor: "全屋",
        space_name: "全屋",
        space_type: "全屋",
        item_name: "给水管",
        quantity: 31.6,
        unit: "M",
        unit_price: 44,
        material_price: 16,
        auxiliary_price: 10,
        labor_price: 18,
        amount: 1390.4,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 14,
      total_amount: 17400.4,
    },
  },
  "水电点位项目",
);
assert.ok(!hydropowerSectionHtml.includes("<td>水电工程</td>"), "Excel draft should no longer render a wrapper hydropower section");
assert.ok(hydropowerSectionHtml.indexOf("<td>强弱电工程</td>") < hydropowerSectionHtml.indexOf("<td>强电插座</td>"));
assert.ok(hydropowerSectionHtml.indexOf("<td>给排水工程</td>") < hydropowerSectionHtml.indexOf("<td>排水点</td>"));
assertQuoteRow(hydropowerSectionHtml, "强电插座", "位", "37", "5.00", "12.00", "55.00", "2664.00");
assertQuoteRow(hydropowerSectionHtml, "开关", "位", "9", "5.00", "10.00", "53.00", "612.00");
assertQuoteRow(hydropowerSectionHtml, "灯位", "位", "8", "0.00", "15.00", "95.00", "880.00");
assertQuoteRow(hydropowerSectionHtml, "设备专线", "位", "8", "65.00", "20.00", "95.00", "1440.00");
assertQuoteRow(hydropowerSectionHtml, "弱电点位", "位", "6", "5.00", "10.00", "47.00", "372.00");
assertQuoteRow(hydropowerSectionHtml, "排水点", "位", "8", "60.00", "35.00", "105.00", "1600.00");
assertQuoteRow(hydropowerSectionHtml, "强电线管", "M", "86.50", "16.00", "5.00", "17.00", "3287.00");
assertQuoteRow(hydropowerSectionHtml, "弱电线管", "M", "49", "12.00", "4.00", "14.00", "1470.00");
assertQuoteRow(hydropowerSectionHtml, "强电箱", "套", "1", "450.00", "100.00", "300.00", "850.00");
assertQuoteRow(hydropowerSectionHtml, "弱电箱", "套", "1", "220.00", "60.00", "170.00", "450.00");
assertQuoteRow(hydropowerSectionHtml, "给水点", "位", "3", "50.00", "25.00", "85.00", "480.00");
assertQuoteRow(hydropowerSectionHtml, "热水点", "位", "3", "55.00", "30.00", "95.00", "540.00");
assertQuoteRow(hydropowerSectionHtml, "给水管", "M", "31.60", "16.00", "10.00", "18.00", "1390.40");
assertQuoteRow(hydropowerSectionHtml, "排水管", "M", "21", "25.00", "12.00", "28.00", "1365.00");
assert.ok(!hydropowerSectionHtml.includes("<td>开关点位</td>"));
assert.ok(!hydropowerSectionHtml.includes("<td>普通插座点位</td>"));
assert.ok(!hydropowerSectionHtml.includes("<td>空调专线</td>"));
assert.ok(!hydropowerSectionHtml.includes("<td>冷水点位</td>"));
assert.ok(!hydropowerSectionHtml.includes("<td>地漏点位</td>"));
assert.ok(!hydropowerSectionHtml.includes("<td>强电布线</td>"));
assert.ok(!hydropowerSectionHtml.includes("<td>水路布管</td>"));
assert.ok(!hydropowerSectionHtml.includes("QUOTE_"));
assert.ok(!hydropowerSectionHtml.includes("默认单价待核定"));
assert.ok(!hydropowerSectionHtml.includes("设计师确认"));

const balconySlidingDoorHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "一层",
        space_name: "阳台",
        space_type: "阳台",
        item_name: "阳台推拉门",
        quantity: 3.96,
        unit: "M2",
        unit_price: 400,
        amount: 1584,
      },
      {
        floor: "一层",
        space_name: "阳台",
        space_type: "阳台",
        item_name: "阳台推拉门双包套",
        quantity: 6.2,
        unit: "M",
        unit_price: 110,
        amount: 682,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 2,
      total_amount: 2266,
    },
  },
  "阳台推拉门项目",
);
assert.equal(countOccurrences(balconySlidingDoorHtml, "<td>阳台推拉门</td><td>M2"), 1);
assert.equal(countOccurrences(balconySlidingDoorHtml, "<td>阳台推拉门双包套</td><td>M"), 1);
assertQuoteRow(balconySlidingDoorHtml, "阳台推拉门", "M2", "3.96", "400.00", "0.00", "0.00", "1584.00");
assertQuoteRow(balconySlidingDoorHtml, "阳台推拉门双包套", "M", "6.20", "110.00", "0.00", "0.00", "682.00");
assert.ok(!balconySlidingDoorHtml.includes("<td>阳台推拉门</td><td>M2</td><td>0</td>"));

const manualDraftHtml = buildQuoteExcelHtml(mapping, "人工补项项目", {
  manualItems: {
    入户门: 1,
    蹲坑: 0,
    马桶: 2,
    淋浴隔断: 2,
    玻璃淋浴房: 0,
    窗台石: 1,
  },
});
assertQuoteRow(manualDraftHtml, "入户门", "樘", "1", "2500.00", "0.00", "0.00", "2500.00");
assertQuoteRow(manualDraftHtml, "马桶", "套", "2", "1500.00", "0.00", "0.00", "3000.00");
assertQuoteRow(manualDraftHtml, "蹲坑", "套", "0", "500.00", "0.00", "0.00", "0.00");
assertQuoteRow(manualDraftHtml, "淋浴隔断", "套", "2", "800.00", "0.00", "0.00", "1600.00");
assertQuoteRow(manualDraftHtml, "玻璃淋浴房", "套", "0", "1200.00", "0.00", "0.00", "0.00");

const editedPricePartHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "一层",
        space_name: "厨房",
        space_type: "厨房",
        item_name: "地面找平",
        quantity: 2,
        unit: "m2",
        unit_price: 50,
        material_price: 12,
        auxiliary_price: 8,
        labor_price: 30,
        amount: 100,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 1,
      total_amount: 100,
    },
  },
  "编辑三段价格项目",
);
assertQuoteRow(editedPricePartHtml, "地面找平", "m2", "2", "12.00", "8.00", "30.00", "100.00");

const riskyHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      ...mapping.items,
      {
        floor: "一层",
        space_name: "卫生间",
        space_type: "卫生间",
        item_name: "厨房卫生间集成吊顶",
        quantity: 3.2,
        unit: "m2",
        unit_price: 0,
        amount: 0,
      },
    ],
    building_area_quote_readiness: {
      building_area_m2: 0,
      required_item_names: ["强电布线", "水路布管"],
      missing_item_names: ["强电布线", "水路布管"],
    },
    quantity_health_readiness: {
      total: 3,
      warning: 1,
      info: 2,
      label: "1 项需优先处理，2 项提醒",
    },
  },
  "风险项目",
);

assert.ok(riskyHtml.includes("<td></td><td>报价风险备注</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>"));
assert.ok(riskyHtml.includes("<td></td><td>健康检查</td><td></td><td></td><td></td><td></td><td></td><td></td><td>1 项需优先处理，2 项提醒</td>"));
assert.ok(riskyHtml.includes("<td></td><td>建筑面积</td><td></td><td></td><td></td><td></td><td></td><td></td><td>强电布线、水路布管 需要 QUOTE_EXT_WALL 建筑面积，当前为 0。</td>"));
assert.ok(riskyHtml.includes("<td></td><td>零单价</td><td></td><td></td><td></td><td></td><td></td><td></td><td>厨房卫生间集成吊顶：卫生间 3.20 m2</td>"));

const defaultProjectMapping = buildQuoteMapping(defaultProjectRows, defaultQuoteRules(), defaultProjectSummary);
const defaultProjectHtml = buildQuoteExcelHtml(defaultProjectMapping, "默认10号图纸");

assert.ok(defaultProjectHtml.includes("<td>四</td><td>卫生间一工程</td>"));
assert.ok(defaultProjectHtml.includes("<td>五</td><td>卫生间二工程</td>"));
assert.ok(defaultProjectHtml.includes("<td>六</td><td>卧室一工程</td>"));
assert.ok(defaultProjectHtml.includes("<td>八</td><td>卧室二工程</td>"));
assert.ok(!defaultProjectHtml.includes("<td>卧室工程</td>"));
assertQuoteRow(defaultProjectHtml, "厨房推拉门", "m2", "3.85", "400.00", "0.00", "0.00", "1540.00");
assertQuoteRow(defaultProjectHtml, "厨房推拉门双包套", "M", "6.15", "110.00", "0.00", "0.00", "676.50");
assertQuoteRow(defaultProjectHtml, "厨房卫生间集成吊顶", "m2", "11.26", "120.00", "0.00", "0.00", "1351.20");
assertQuoteRow(defaultProjectHtml, "窗帘", "M", "36.06", "50.00", "20.00", "0.00", "2524.20");
assertQuoteRow(defaultProjectHtml, "暗窗帘箱", "M", "6.63", "35.00", "10.00", "45.00", "596.70");
assert.ok(!defaultProjectHtml.includes("<td>窗台石</td><td>套</td>"));

const defaultBathroomRows = defaultProjectRows.filter((row) => row.spaceType === "卫生间");
const bathroomInstallHtml = buildQuoteExcelHtml(defaultProjectMapping, "默认10号图纸", {
  bathroomRows: defaultBathroomRows,
  bathroomChoices: {
    [`${defaultBathroomRows[0].floor}::${defaultBathroomRows[0].spaceName}::0`]: { shower: "淋浴隔断" },
  },
});
assert.ok(bathroomInstallHtml.includes("<td>卫生间一工程</td>"));
assertQuoteRow(bathroomInstallHtml, "淋浴隔断安装", "套", "1", "0.00", "0.00", "200.00", "200.00");

const defaultBathroomInstallHtml = buildQuoteExcelHtml(defaultProjectMapping, "默认10号图纸", {
  bathroomRows: defaultBathroomRows,
  bathroomChoices: {},
});
assert.equal(countOccurrences(defaultBathroomInstallHtml, "<td>淋浴隔断安装</td><td>套</td>"), 2);
assertQuoteRow(defaultBathroomInstallHtml, "淋浴隔断安装", "套", "1", "0.00", "0.00", "200.00", "200.00");

const unorderedVillaRows = [
  {
    ...defaultProjectRows[0],
    floor: "二层",
    spaceName: "麻将房",
    spaceType: "娱乐室",
    floorAreaM2: 12,
    ceilingAreaM2: 12,
    latexPaintAreaM2: 30,
    wallTileAreaM2: 0,
    waterproofAreaM2: 0,
  },
  {
    ...defaultProjectRows[0],
    floor: "一层",
    spaceName: "茶室",
    spaceType: "茶室",
    floorAreaM2: 10,
    ceilingAreaM2: 10,
    latexPaintAreaM2: 24,
    wallTileAreaM2: 0,
    waterproofAreaM2: 0,
  },
  {
    ...defaultProjectRows[0],
    floor: "一层",
    spaceName: "楼梯间",
    spaceType: "楼梯",
    floorAreaM2: 8,
    ceilingAreaM2: 6,
    latexPaintAreaM2: 20,
    wallTileAreaM2: 0,
    waterproofAreaM2: 0,
  },
];
const unorderedVillaHtml = buildQuoteExcelHtml(buildQuoteMapping(unorderedVillaRows, defaultQuoteRules(), { building_area_m2: 0 }), "乱序别墅项目");
assert.ok(unorderedVillaHtml.includes("<td>二</td><td>一层茶室工程</td>"));
assert.ok(unorderedVillaHtml.includes("<td>三</td><td>一层楼梯间工程</td>"));
assert.ok(unorderedVillaHtml.includes("<td>四</td><td>二层麻将房工程</td>"));
assert.ok(unorderedVillaHtml.indexOf("<td>一层茶室工程</td>") < unorderedVillaHtml.indexOf("<td>二层麻将房工程</td>"));
assert.ok(unorderedVillaHtml.indexOf("<td>一层楼梯间工程</td>") < unorderedVillaHtml.indexOf("<td>二层麻将房工程</td>"));
assertQuoteRow(unorderedVillaHtml, "墙面乳胶漆", "m2", "20", "10.00", "0.00", "10.00", "400.00");
assertQuoteRow(unorderedVillaHtml, "顶面乳胶漆", "m2", "10", "10.00", "0.00", "10.00", "200.00");
assertQuoteRow(unorderedVillaHtml, "顶面乳胶漆", "m2", "12", "10.00", "0.00", "10.00", "240.00");

const villaLikeHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "一层",
        space_name: "楼梯间",
        space_type: "楼梯",
        item_name: "墙面乳胶漆",
        quantity: 18,
        unit: "m2",
        unit_price: 20,
        amount: 360,
      },
      {
        floor: "一层",
        space_name: "楼梯间",
        space_type: "楼梯",
        item_name: "轻钢龙骨平顶",
        quantity: 6,
        unit: "m2",
        unit_price: 180,
        amount: 1080,
      },
      {
        floor: "一层",
        space_name: "楼梯间",
        space_type: "楼梯",
        item_name: "石膏线吊顶",
        quantity: 5.6,
        unit: "M",
        unit_price: 35,
        amount: 196,
      },
      {
        floor: "一层",
        space_name: "楼梯间",
        space_type: "楼梯",
        item_name: "楼梯踏步铺贴",
        quantity: 15,
        unit: "步",
        unit_price: 125,
        amount: 1875,
      },
      {
        floor: "一层",
        space_name: "卧室一",
        space_type: "卧室",
        item_name: "墙面乳胶漆",
        quantity: 20,
        unit: "m2",
        unit_price: 20,
        amount: 400,
      },
      {
        floor: "一层",
        space_name: "卧室二",
        space_type: "卧室",
        item_name: "墙面乳胶漆",
        quantity: 22,
        unit: "m2",
        unit_price: 20,
        amount: 440,
      },
      {
        floor: "二层",
        space_name: "卫生间",
        space_type: "卫生间",
        item_name: "地面找平",
        quantity: 3,
        unit: "m2",
        unit_price: 45,
        amount: 135,
      },
      {
        floor: "二层",
        space_name: "公卫",
        space_type: "卫生间",
        item_name: "地面找平",
        quantity: 4,
        unit: "m2",
        unit_price: 45,
        amount: 180,
      },
      {
        floor: "二层",
        space_name: "卫生间",
        space_type: "卫生间",
        item_name: "淋浴隔断安装",
        quantity: 2,
        unit: "套",
        unit_price: 200,
        amount: 400,
      },
      {
        floor: "二层",
        space_name: "卧室",
        space_type: "卧室",
        item_name: "窗台石铺贴",
        quantity: 2.4,
        unit: "M",
        unit_price: 45,
        amount: 108,
      },
    ],
    summary: {
      ...mapping.summary,
      item_count: 10,
      total_amount: 5244,
    },
  },
  "别墅口径项目",
);
assert.ok(villaLikeHtml.includes("<td>二</td><td>一层楼梯间工程</td>"));
assertQuoteRow(villaLikeHtml, "楼梯踏步铺贴", "步", "15", "0.00", "45.00", "80.00", "1875.00");
assertQuoteRow(villaLikeHtml, "墙面乳胶漆", "m2", "18", "10.00", "0.00", "10.00", "360.00");
assertQuoteRow(villaLikeHtml, "轻钢龙骨平顶", "m2", "6", "60.00", "30.00", "90.00", "1080.00");
assertQuoteRow(villaLikeHtml, "石膏线吊顶", "M", "5.60", "12.00", "5.00", "18.00", "196.00");
assert.ok(villaLikeHtml.includes("<td>三</td><td>一层卧室工程一</td>"));
assert.ok(villaLikeHtml.includes("<td>四</td><td>一层卧室工程二</td>"));
assert.ok(villaLikeHtml.includes("<td>五</td><td>二层卫生间、盥洗区工程</td>"));
assert.equal(countOccurrences(villaLikeHtml, "<td>二层卫生间、盥洗区工程</td>"), 1);
assertQuoteRow(villaLikeHtml, "地面找平", "m2", "7", "0.00", "20.00", "25.00", "315.00");
assertQuoteRow(villaLikeHtml, "淋浴隔断安装", "套", "2", "0.00", "0.00", "200.00", "400.00");
assert.ok(villaLikeHtml.includes("<td>六</td><td>二层卧室工程</td>"));
assertQuoteRow(villaLikeHtml, "窗台石铺贴", "M", "2.40", "0.00", "20.00", "25.00", "108.00");

const handrailHtml = buildQuoteExcelHtml(
  {
    ...mapping,
    items: [
      {
        floor: "一层",
        space_name: "楼梯间",
        space_type: "楼梯",
        item_name: "楼梯扶手",
        quantity: 4.1,
        unit: "M",
        unit_price: 480,
        amount: 1968,
      },
    ],
    summary: { ...mapping.summary, item_count: 1, total_amount: 1968 },
  },
  "扶手项目",
);
assert.ok(!handrailHtml.includes("<td>一层楼梯间工程</td>"));
assert.ok(handrailHtml.includes("<td>其他（窗帘、美缝、窗台石等）</td>"));
assertQuoteRow(handrailHtml, "楼梯扶手", "M", "4.10", "480.00", "0.00", "0.00", "1968.00");

function countOccurrences(value: string, pattern: string): number {
  return value.split(pattern).length - 1;
}

function assertQuoteRow(html: string, itemName: string, unit: string, quantity: string, material: string, auxiliary: string, labor: string, amount: string): void {
  assert.match(
    html,
    new RegExp(
      [
        `<td>${escapeRegExp(escapeHtmlForTest(itemName))}</td>`,
        `<td>${escapeRegExp(escapeHtmlForTest(unit))}</td>`,
        `<td>${escapeRegExp(quantity)}</td>`,
        `<td>${escapeRegExp(material)}</td>`,
        `<td>${escapeRegExp(auxiliary)}</td>`,
        `<td>${escapeRegExp(labor)}</td>`,
        `<td x:fmla="=D\\d+\\*\\(E\\d+\\+F\\d+\\+G\\d+\\)">${escapeRegExp(amount)}</td>`,
      ].join(""),
    ),
  );
}

function assertSubtotalAmount(html: string, amount: string): void {
  assert.match(
    html,
    new RegExp(`<tr class="quoteSubtotalRow"><td></td><td>小 计</td><td></td><td></td><td></td><td></td><td></td><td x:fmla="=SUM\\(H\\d+:H\\d+\\)">${escapeRegExp(amount)}</td><td></td></tr>`),
  );
}

function assertTotalRow(html: string, code: string, label: string, formula: RegExp, amount: string): void {
  const escapedLabel = escapeRegExp(escapeHtmlForTest(label));
  const match = html.match(new RegExp(`<tr class="quoteTotalRow"><td>${code}</td><td>${escapedLabel}</td><td></td><td></td><td></td><td></td><td></td><td x:fmla="([^"]+)">${escapeRegExp(amount)}</td><td></td></tr>`));
  assert.ok(match, `missing total row ${code}`);
  assert.match(match[1], formula);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtmlForTest(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
