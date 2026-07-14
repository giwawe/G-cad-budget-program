import assert from "node:assert/strict";

import { buildSpaceNamingGuideWordHtml, spaceNamingGuideFileName, spaceNamingGuideSections } from "./space-naming-guide.ts";

const guide = buildSpaceNamingGuideWordHtml();

assert.equal(spaceNamingGuideFileName("别墅二.dxf"), "别墅二.space-naming-guide.doc");
assert.equal(spaceNamingGuideFileName("样例数据"), "space-naming-guide.doc");
assert.ok(guide.includes("<html"), "guide should be Word-compatible HTML");
assert.ok(guide.includes("mso-"), "guide should include Word-friendly styles");
assert.ok(guide.includes("一个 <code>QUOTE_ROOM</code> 只表达一种主要计价性质"));
assert.ok(guide.includes("不要使用 <code>过道/电梯井</code>"));
assert.ok(guide.includes("无法自动分类的空间，在工程量表“类型”列手动选择计价类型"));
assert.ok(spaceNamingGuideSections.length >= 4, "browser page should be able to render multiple guide sections");
