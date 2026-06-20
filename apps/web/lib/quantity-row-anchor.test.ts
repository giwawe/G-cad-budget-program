import assert from "node:assert/strict";
import { quantityRowAnchorId, quantityRowAnchorHref } from "./quantity-row-anchor.ts";

assert.equal(quantityRowAnchorId("厨房"), "quantity-row-%E5%8E%A8%E6%88%BF");
assert.equal(quantityRowAnchorHref("厨房"), "#quantity-row-%E5%8E%A8%E6%88%BF");
assert.equal(quantityRowAnchorId("一层-客厅"), "quantity-row-%E4%B8%80%E5%B1%82-%E5%AE%A2%E5%8E%85");
