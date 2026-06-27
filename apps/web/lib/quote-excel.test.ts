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
assert.ok(html.includes("<title>A&amp;B 项目报价草稿</title>"));
assert.ok(html.includes("<td>建筑面积</td><td>88.66</td>"));
assert.ok(html.includes("<td>估算合计</td><td>8331.16</td>"));
assert.ok(html.includes("<h2>空间小计</h2>"));
assert.ok(html.includes("<th>楼层</th><th>空间</th><th>类型</th><th>清单项数</th><th>小计</th>"));
assert.ok(html.includes("<td>一层</td><td>厨房</td><td>厨房</td><td>2</td><td>1415.68</td>"));
assert.ok(html.includes("<td>全屋</td><td>全屋</td><td>全屋</td><td>1</td><td>6915.48</td>"));
assert.ok(html.includes("<td>合计</td><td></td><td></td><td>3</td><td>8331.16</td>"));
assert.ok(html.indexOf("<h2>空间小计</h2>") < html.indexOf("<h2>清单式报价表</h2>"));
assert.ok(html.includes("<th>编号</th><th>项目名称</th><th>单位</th><th>数量</th><th>主材单价</th><th>辅材单价</th><th>人工费</th><th>总价</th><th>材料及工艺说明</th>"));
assert.ok(html.includes("<tr><td>六</td><td>厨房工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.includes("<tr><td>十二</td><td>水电工程</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"));
assert.ok(html.indexOf("<td>六</td><td>厨房工程</td>") < html.indexOf("<td>厨房卫生间集成吊顶</td>"));
assert.ok(html.indexOf("<td>十二</td><td>水电工程</td>") < html.indexOf("<td>强电布线 &amp; 水路复核</td>"));
assert.ok(html.includes("<td>厨房卫生间集成吊顶</td><td>m2</td><td>4.48</td><td>260.00</td><td>0.00</td><td>0.00</td><td>1164.80</td>"));
assert.ok(html.includes("<td>地面找平</td><td>m2</td><td>4.48</td><td>0.00</td><td>26.00</td><td>30.00</td><td>250.88</td>"));
assert.ok(html.includes("<td>强电布线 &amp; 水路复核</td><td>M2</td><td>88.66</td><td>78.00</td><td>0.00</td><td>0.00</td><td>6915.48</td>"));
assert.ok(html.includes("<td></td><td>小 计</td><td></td><td></td><td></td><td></td><td></td><td>1415.68</td><td></td>"));
assert.ok(html.includes("<td></td><td>小 计</td><td></td><td></td><td></td><td></td><td></td><td>6915.48</td><td></td>"));
assert.ok(html.includes("<tr><td>A</td><td>直接费合计</td><td></td><td></td><td></td><td></td><td></td><td>8331.16</td><td></td></tr>"));
assert.ok(html.includes("<h2>人工补项</h2>"), "Excel draft should include manual quote items from the marked source sheet");
assert.equal(MANUAL_QUOTE_DRAFT_ITEMS.length, 27);
assert.ok(html.indexOf("<h2>人工补项</h2>") < html.indexOf("<td>一</td><td>全屋拆改工程（可选）</td>"));
assert.ok(html.indexOf("<td>一</td><td>全屋拆改工程（可选）</td>") < html.indexOf("<td>砌240厚砖墙</td>"));
assert.ok(html.indexOf("<td>十七</td><td>其他（窗帘、美缝、窗台石等）</td>") < html.indexOf("<td>全屋保洁</td>"));
assert.ok(!html.includes("<td>卫生间门</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>"));
assert.ok(!html.includes("<td>厨房推拉门双包套</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>"));
assert.ok(html.indexOf("<h2>人工补项</h2>") > html.indexOf("<td>A</td><td>直接费合计</td>"));
assert.ok(html.includes("<td>强电布线 &amp; 水路复核</td>"), "item names should be escaped");
assert.ok(!html.includes("强电布线 & 水路复核</td>"), "raw ampersands should not leak into HTML");

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

assert.ok(riskyHtml.includes("<h2>风险摘要</h2>"));
assert.ok(riskyHtml.includes("<td>健康检查</td><td>1 项需优先处理，2 项提醒</td>"));
assert.ok(riskyHtml.includes("<td>建筑面积</td><td>强电布线、水路布管 需要 QUOTE_EXT_WALL 建筑面积，当前为 0。</td>"));
assert.ok(riskyHtml.includes("<td>零单价</td><td>厨房卫生间集成吊顶：卫生间 3.20 m2</td>"));
