import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const uploadWorkbenchSource = readFileSync(new URL("./upload-workbench.tsx", import.meta.url), "utf8");

assert.ok(uploadWorkbenchSource.includes("buildQuoteExcelHtml"), "workbench should build Excel draft content from generated quote mapping");
assert.ok(uploadWorkbenchSource.includes("quoteExcelFileName"), "workbench should use the Excel draft filename helper");
assert.ok(uploadWorkbenchSource.includes("下载 Excel 草稿"), "quote mapping panel should expose an Excel draft download button");
assert.ok(uploadWorkbenchSource.includes("application/vnd.ms-excel;charset=utf-8"), "Excel draft download should use an Excel-compatible content type");
