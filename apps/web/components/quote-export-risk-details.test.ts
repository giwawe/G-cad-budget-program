import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const uploadWorkbenchSource = readFileSync(new URL("./upload-workbench.tsx", import.meta.url), "utf8");

assert.ok(uploadWorkbenchSource.includes("quoteExportRisks"), "quote mapping panel should derive export risk details from generated mapping");
assert.ok(uploadWorkbenchSource.includes("exportQuoteMappingConfirmationMessages(generatedQuoteMapping.mapping)"), "quote mapping panel should reuse export confirmation risk helper");
assert.ok(uploadWorkbenchSource.includes("导出前风险明细"), "quote mapping panel should show export risk details before the user clicks export");
