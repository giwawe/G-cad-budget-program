import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./quantity-table.tsx", import.meta.url), "utf8");
const tableHeaderSource = source.slice(source.indexOf("<thead>"), source.indexOf("</thead>"));

for (const label of ["地砖主材", "强电面积", "水路面积", "新砌墙长", "新砌墙面积", "拆墙长度", "拆墙面积"]) {
  assert.ok(!tableHeaderSource.includes(`<th>${label}</th>`), `${label} should be summarized in quote mapping instead of shown per space`);
}

assert.ok(source.includes("onChangeSpaceType"), "quantity table should expose manual space type correction");
assert.ok(source.includes("QUOTE_SPACE_TYPE_GROUPS.map"), "space type correction should render grouped billing type options");
assert.ok(source.includes("value={row.spaceType}"), "space type select should show the current row space type");
assert.ok(source.includes("普通干区"), "space type correction should expose a dry-area billing group label");
assert.ok(source.includes("湿区"), "space type correction should expose a wet-area billing group label");
assert.ok(source.includes("不计价"), "space type correction should explain excluded spaces can be marked as not quoted");
assert.ok(source.includes("quantityCardsDetails"), "designer-facing quantity review should be a collapsible card summary");
assert.ok(source.includes("确认本空间"), "space cards should expose an explicit confirmation action");
assert.ok(source.includes("setIsSummaryOpen(true)"), "space summary should expand automatically when rows have anomaly prompts");
assert.ok(source.includes("open={isSummaryOpen}"), "space summary should remain user-controllable after it opens");
assert.ok(!source.includes("advancedQuantityDetails"), "full quantity detail table should not be shown in the designer-facing frontend");
assert.ok(!source.includes("查看完整工程量明细"), "full quantity detail table should be reserved for backend/admin workflows");
