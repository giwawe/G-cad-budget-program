import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quantityTableSource = readFileSync(new URL("./quantity-table.tsx", import.meta.url), "utf8");
const drawingReviewSource = readFileSync(new URL("./drawing-review.tsx", import.meta.url), "utf8");
const uploadWorkbenchSource = readFileSync(new URL("./upload-workbench.tsx", import.meta.url), "utf8");

assert.ok(!quantityTableSource.includes('key={`${row.floor}-${row.spaceName}`}'), "quantity table rows must stay unique when rooms share the same name");
assert.ok(!drawingReviewSource.includes("key={space.name}"), "drawing polygons must stay unique when rooms share the same name");
assert.ok(!uploadWorkbenchSource.includes('key={`${item.space_name}-${item.item_name}`}'), "quote item rows must stay unique when duplicate rooms generate the same item");
assert.ok(!uploadWorkbenchSource.includes("key={spaceName}"), "health-check space links must stay unique when checks mention duplicate names");
assert.ok(!uploadWorkbenchSource.includes('key={`${difference.space_name}-${difference.field}`}'), "calibration difference links must stay unique when duplicate rooms share a name");
