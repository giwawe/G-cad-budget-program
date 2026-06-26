import assert from "node:assert/strict";
import { buildQuoteExcelHtml, quoteExcelFileName } from "./quote-excel.ts";
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
assert.ok(html.indexOf("<h2>空间小计</h2>") < html.indexOf("<th>楼层</th><th>空间</th><th>类型</th><th>清单项</th>"));
assert.ok(html.includes("<th>楼层</th><th>空间</th><th>类型</th><th>清单项</th><th>工程量</th><th>单位</th><th>单价</th><th>小计</th>"));
assert.ok(html.includes("<td>厨房卫生间集成吊顶</td><td>4.48</td><td>m2</td><td>260.00</td><td>1164.80</td>"));
assert.ok(html.includes("<td>合计</td><td></td><td></td><td></td><td></td><td></td><td></td><td>8331.16</td>"));
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
