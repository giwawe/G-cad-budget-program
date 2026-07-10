import assert from "node:assert/strict";

import { shouldResetSavedQuoteRules } from "./quote-rule-storage.ts";

const defaultName = "商品房整装默认规则";

assert.equal(
  shouldResetSavedQuoteRules({ fileName: defaultName, defaultVersion: 3, currentVersion: 4, defaultRuleName: defaultName }),
  true,
);
assert.equal(
  shouldResetSavedQuoteRules({ fileName: `${defaultName}（已编辑）`, defaultVersion: 3, currentVersion: 4, defaultRuleName: defaultName }),
  true,
);
assert.equal(
  shouldResetSavedQuoteRules({ fileName: "别墅一.quote-rules.json", defaultVersion: 3, currentVersion: 4, defaultRuleName: defaultName }),
  false,
);
assert.equal(
  shouldResetSavedQuoteRules({ fileName: `${defaultName}（已编辑）`, defaultVersion: 4, currentVersion: 4, defaultRuleName: defaultName }),
  false,
);
