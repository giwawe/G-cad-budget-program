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
    item_count: 2,
    total_amount: 8080.28,
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
assert.ok(html.includes("<td>估算合计</td><td>8080.28</td>"));
assert.ok(html.includes("<th>楼层</th><th>空间</th><th>类型</th><th>清单项</th><th>工程量</th><th>单位</th><th>单价</th><th>小计</th>"));
assert.ok(html.includes("<td>厨房卫生间集成吊顶</td><td>4.48</td><td>m2</td><td>260.00</td><td>1164.80</td>"));
assert.ok(html.includes("<td>强电布线 &amp; 水路复核</td>"), "item names should be escaped");
assert.ok(!html.includes("强电布线 & 水路复核</td>"), "raw ampersands should not leak into HTML");
