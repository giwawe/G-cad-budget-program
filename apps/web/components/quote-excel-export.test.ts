import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const uploadWorkbenchSource = readFileSync(new URL("./upload-workbench.tsx", import.meta.url), "utf8");

assert.ok(uploadWorkbenchSource.includes("buildQuoteExcelHtml"), "workbench should build Excel draft content from generated quote mapping");
assert.ok(uploadWorkbenchSource.includes("quoteExcelFileName"), "workbench should use the Excel draft filename helper");
assert.ok(uploadWorkbenchSource.includes("下载 Excel 草稿"), "quote mapping panel should expose an Excel draft download button");
assert.ok(uploadWorkbenchSource.includes("导出 Excel 草稿"), "top toolbar should expose a visible Excel draft export button");
assert.ok(uploadWorkbenchSource.includes("handleDownloadQuoteExcelDraft"), "Excel draft export should be available before the quote mapping panel is shown");
assert.ok(uploadWorkbenchSource.includes("Excel 可选补项"), "quote mapping panel should explain that manual quote items are included in Excel drafts");
assert.ok(uploadWorkbenchSource.includes("manualItems: manualQuoteItemQuantities"), "Excel draft export should apply manual quote item quantities");
assert.ok(uploadWorkbenchSource.includes("application/vnd.ms-excel;charset=utf-8"), "Excel draft download should use an Excel-compatible content type");
