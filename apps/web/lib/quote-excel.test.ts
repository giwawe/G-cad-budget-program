import assert from "node:assert/strict";
import { buildQuoteExcelHtml, MANUAL_QUOTE_DRAFT_ITEMS, quoteExcelFileName } from "./quote-excel.ts";
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
      unit_price: 260,
      amount: 1164.8,
    },
    {
      floor: "一层",
      space_name: "厨房",
      space_type: "厨房",
      item_name: "地面找平",
      quantity: 4.48,
      unit: "m2",
      unit_price: 56,
      amount: 250.88,
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
    total_amount: 8331.16,
  },
  curtain_quote_readiness: {
    ready_count: 1,
    pending_count: 0,
    ready_space_names: ["主卧"],
    pending_space_names: [],
  },
  curtain_quote_candidates: [],
  building_area_quote_readiness: {
    building_area_m2: 88.66,
    required_item_names: ["强电布线"],
    missing_item_names: [],
  },
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
assert.ok(html.includes("<title>A&amp;B 项目清单式报价表</title>"));
assert.ok(html.includes("<th>工程(预) 算表</th>"));
assert.ok(html.includes("<td>名称：A&amp;B 项目</td><td></td><td>装修面积：88.66</td>"));
assert.ok(html.includes("<th>编号</th><th>项目名称</th><th>单位</th><th>数量</th><th>材料费(元)</th><th></th><th>人工费\n(元)</th><th>总价(元)</th><th>材  料  及  工  艺  说  明</th>"));
assert.ok(html.includes("<th></th><th></th><th></th><th></th><th>主材\n单价</th><th>辅材\n单价</th><th></th><th></th><th></th>"));
assert.ok(!html.includes("<h2>空间小计</h2>"));
assert.ok(!html.includes("<h2>人工补项</h2>"));
assert.ok(html.includes("<tr><td>一</td><td>全屋拆改工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>二</td><td>厨房工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>三</td><td>其他工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>四</td><td>水电工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>五</td><td>主材项目</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>六</td><td>全屋定制、衣柜、橱柜、全屋家具</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>七</td><td>室内门</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>八</td><td>集成吊顶、卫浴、全屋开关灯饰</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>九</td><td>其他（窗帘、美缝、窗台石等）</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(!html.includes("<td>过道工程</td>"));
assert.ok(!html.includes("<td>主卧工程</td>"));
assert.ok(!html.includes("<td>次卧工程</td>"));
assert.ok(!html.includes("<td>露台工程</td>"));
assert.ok(html.indexOf("<td>二</td><td>厨房工程</td>") < html.indexOf("<td>地面找平</td>"));
assert.ok(html.indexOf("<td>八</td><td>集成吊顶、卫浴、全屋开关灯饰</td>") < html.indexOf("<td>厨房卫生间集成吊顶</td>"));
assert.ok(html.indexOf("<td>四</td><td>水电工程</td>") < html.indexOf("<td>强电布线 &amp; 水路复核</td>"));
assert.ok(html.includes("<td>厨房卫生间集成吊顶</td><td>m2</td><td>4.48</td><td>260.00</td><td>0.00</td><td>0.00</td><td>1164.80</td>"));
assert.ok(html.includes("<td>地面找平</td><td>m2</td><td>4.48</td><td>0.00</td><td>26.00</td><td>30.00</td><td>250.88</td>"));
assert.ok(html.includes("<td>强电布线 &amp; 水路复核</td><td>M2</td><td>88.66</td><td>78.00</td><td>0.00</td><td>0.00</td><td>6915.48</td>"));
assert.ok(html.includes("<td></td><td>小 计</td><td></td><td></td><td></td><td></td><td></td><td>250.88</td><td></td>"));
assert.ok(html.includes("<td></td><td>小 计</td><td></td><td></td><td></td><td></td><td></td><td>1164.80</td><td></td>"));
assert.ok(html.includes("<td></td><td>小 计</td><td></td><td></td><td></td><td></td><td></td><td>6915.48</td><td></td>"));
assert.ok(!html.includes("<td>轻钢龙骨平顶</td>"), "space sections should not show missing fixed room items");
assert.ok(!html.includes("<td>暗窗帘箱</td><td></td>"), "public curtain section should not contain space-only curtain box placeholders");
assert.ok(html.includes("<tr><td>A</td><td>直接费合计</td><td></td><td></td><td></td><td></td><td></td><td>8331.16</td><td></td></tr>"));
assert.ok(html.includes("<tr><td>B</td><td>工程管理费(D=A* 5%)</td><td></td><td></td><td></td><td></td><td></td><td>416.56</td><td></td></tr>"));
assert.ok(html.includes("<tr><td>C</td><td>税金E=(A+B)* 3%</td><td></td><td></td><td></td><td></td><td></td><td>262.43</td><td></td></tr>"));
assert.ok(html.includes("<tr><td>D</td><td>工程总造价F=(A+B+C)</td><td></td><td></td><td></td><td></td><td></td><td>9010.15</td><td></td></tr>"));
assert.equal(MANUAL_QUOTE_DRAFT_ITEMS.length, 9);
assert.ok(html.includes("<td>砖墙门窗洞过梁</td><td>支</td><td>0</td><td>160.00</td><td>0.00</td><td>40.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>入户门</td><td>樘</td><td>0</td><td>5000.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>阳台推拉门</td><td>M2</td><td>0</td><td>550.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>阳台推拉门双包套</td><td>M</td><td>0</td><td>300.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>铝合金封门窗</td><td>M2</td><td>0</td><td>0.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>蹲坑</td><td>套</td><td>0</td><td>500.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>淋浴隔断</td><td>套</td><td>0</td><td>400.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>玻璃淋浴房</td><td>套</td><td>0</td><td>3500.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(html.includes("<td>窗台石</td><td>套</td><td>1</td><td>3600.00</td><td>0.00</td><td>0.00</td><td>0.00</td>"));
assert.ok(!html.includes("<td>包上/下水管道(单管)</td>"));
assert.ok(!html.includes("<td>砌240厚砖墙</td>"));
assert.ok(!html.includes("<td>窗帘</td><td>项</td><td>1</td>"));
assert.ok(html.includes("<td>强电布线 &amp; 水路复核</td>"), "item names should be escaped");
assert.ok(!html.includes("强电布线 & 水路复核</td>"), "raw ampersands should not leak into HTML");

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
        unit_price: 260,
        amount: 260,
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
      total_amount: mapping.summary.total_amount + 3860,
    },
  },
  "重复项项目",
);

assert.equal(countOccurrences(duplicateHtml, "<td>厨房卫生间集成吊顶</td>"), 1);
assert.ok(duplicateHtml.includes("<td>厨房卫生间集成吊顶</td><td>m2</td><td>5.48</td><td>260.00</td><td>0.00</td><td>0.00</td><td>1424.80</td>"));
assert.equal(countOccurrences(duplicateHtml, "<td>室内门</td><td>樘"), 1);
assert.ok(duplicateHtml.includes("<td>室内门</td><td>樘</td><td>3</td><td>1200.00</td><td>0.00</td><td>0.00</td><td>3600.00</td>"));

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
assert.ok(editedPricePartHtml.includes("<td>地面找平</td><td>m2</td><td>2</td><td>12.00</td><td>8.00</td><td>30.00</td><td>100.00</td>"));

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

function countOccurrences(value: string, pattern: string): number {
  return value.split(pattern).length - 1;
}
