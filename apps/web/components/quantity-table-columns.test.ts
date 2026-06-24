import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./quantity-table.tsx", import.meta.url), "utf8");
const tableHeaderSource = source.slice(source.indexOf("<thead>"), source.indexOf("</thead>"));

for (const label of ["地砖主材", "强电面积", "水路面积", "新砌墙长", "新砌墙面积", "拆墙长度", "拆墙面积"]) {
  assert.ok(!tableHeaderSource.includes(`<th>${label}</th>`), `${label} should be summarized in quote mapping instead of shown per space`);
}
