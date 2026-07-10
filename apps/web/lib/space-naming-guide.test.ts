import assert from "node:assert/strict";

import { buildSpaceNamingGuideMarkdown, spaceNamingGuideFileName } from "./space-naming-guide.ts";

const guide = buildSpaceNamingGuideMarkdown();

assert.equal(spaceNamingGuideFileName("别墅二.dxf"), "别墅二.space-naming-guide.md");
assert.equal(spaceNamingGuideFileName("样例数据"), "space-naming-guide.md");
assert.ok(guide.includes("一个 `QUOTE_ROOM` 只表达一种主要计价性质"));
assert.ok(guide.includes("不要使用 `过道/电梯井`"));
assert.ok(guide.includes("无法自动分类的空间，在工程量表“类型”列手动选择计价类型"));
