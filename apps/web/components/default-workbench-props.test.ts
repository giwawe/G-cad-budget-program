import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const uploadWorkbenchSource = readFileSync(new URL("./upload-workbench.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

assert.ok(uploadWorkbenchSource.includes("initialFileName = \"样例数据\""), "UploadWorkbench should keep a fallback file name");
assert.ok(uploadWorkbenchSource.includes("initialSummary = null"), "UploadWorkbench should support an initial summary");
assert.ok(uploadWorkbenchSource.includes("useState(initialFileName)"), "default file name should seed workbench state");
assert.ok(uploadWorkbenchSource.includes("useState<QuantitySummary | null>(initialSummary)"), "default summary should seed workbench state");
assert.ok(pageSource.includes("DEFAULT_PROJECT_FILE_NAME"), "home page should use the default project file name");
assert.ok(pageSource.includes("defaultProjectRows"), "home page should use the default project rows");
assert.ok(pageSource.includes("defaultProjectSummary"), "home page should use the default project summary");
