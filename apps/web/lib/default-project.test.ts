import assert from "node:assert/strict";
import { buildQuoteMapping } from "./quote-mapping.ts";
import { DEFAULT_PROJECT_FILE_NAME, defaultProjectRows, defaultProjectSummary } from "./default-project.ts";

assert.equal(DEFAULT_PROJECT_FILE_NAME, "10.dxf");
assert.equal(defaultProjectRows.length, 8);
assert.equal(defaultProjectSummary.space_count, 8);
assert.equal(defaultProjectSummary.building_area_m2, 136.24);
assert.equal(defaultProjectSummary.floor_area_total_m2, 116.62);

assert.deepEqual(defaultProjectRows.map((row) => row.spaceName), ["餐厅", "厨房", "卫生间", "卫生间", "卧室", "主卧", "卧室", "客厅"]);
assert.equal(defaultProjectRows.find((row) => row.spaceName === "厨房")?.ceilingFinishType, "integrated");
assert.equal(defaultProjectRows.filter((row) => row.spaceType === "卫生间").every((row) => row.ceilingFinishType === "integrated"), true);
assert.equal(defaultProjectRows.find((row) => row.spaceName === "客厅")?.anomalies.includes("存在疑似大洞口门，请确认是否扣减墙面"), true);

const mapping = buildQuoteMapping(defaultProjectRows, undefined, defaultProjectSummary);
assert.equal(mapping.summary.space_count, 8);
assert.equal(mapping.summary.building_area_m2, 136.24);
assert.ok(!mapping.items.some((item) => item.item_name === "强电布线" || item.item_name === "弱电布线" || item.item_name === "水路布管"));
assert.ok(mapping.items.some((item) => item.item_name === "厨房卫生间集成吊顶" && item.space_name === "厨房" && item.unit_price === 120));
