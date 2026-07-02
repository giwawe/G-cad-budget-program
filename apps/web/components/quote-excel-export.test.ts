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
assert.ok(uploadWorkbenchSource.includes("excelManualItemQuantities: manualQuoteItemQuantities"), "review snapshots should persist manual quote item quantities");
assert.ok(uploadWorkbenchSource.includes("manualQuoteInputsFromQuantities(snapshot.excel_manual_item_quantities)"), "review snapshot import should restore manual quote item inputs");
assert.ok(!uploadWorkbenchSource.includes('{ itemName: "入户门"'), "entry door should be auto quoted instead of shown as a manual Excel option");
assert.ok(uploadWorkbenchSource.includes("bathroomRowsFromRows(rows)"), "manual quote options should use billable bathroom rows");
assert.ok(uploadWorkbenchSource.includes("manualQuoteInputsFromBathroomChoices"), "manual quote options should aggregate per-bathroom choices");
assert.ok(uploadWorkbenchSource.includes("manualBathroomChoices"), "manual quote options should expose per-bathroom choice controls");
assert.ok(uploadWorkbenchSource.includes("application/vnd.ms-excel;charset=utf-8"), "Excel draft download should use an Excel-compatible content type");
