import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const uploadWorkbenchSource = readFileSync(new URL("./upload-workbench.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

assert.ok(uploadWorkbenchSource.includes("initialFileName = \"样例数据\""), "UploadWorkbench should keep a fallback file name");
assert.ok(uploadWorkbenchSource.includes("initialSummary = null"), "UploadWorkbench should support an initial summary");
assert.ok(uploadWorkbenchSource.includes("useState(initialFileName)"), "default file name should seed workbench state");
assert.ok(uploadWorkbenchSource.includes("useState<QuantitySummary | null>(initialSummary)"), "default summary should seed workbench state");
assert.ok(!pageSource.includes("default-project"), "home page should not auto-load a bundled default drawing");
assert.ok(pageSource.includes("initialRows={[]}"), "home page should start with an empty workbench");
assert.ok(pageSource.includes("initialSummary={null}"), "home page should not seed a summary before upload");
