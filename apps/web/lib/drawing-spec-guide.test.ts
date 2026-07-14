import assert from "node:assert/strict";

import { buildDrawingSpecGuideWordHtml, drawingSpecGuideFileName, drawingSpecGuideSections } from "./drawing-spec-guide.ts";

const guide = buildDrawingSpecGuideWordHtml();

assert.equal(drawingSpecGuideFileName("别墅二.dwg"), "别墅二.cad-drawing-guide.doc");
assert.equal(drawingSpecGuideFileName("样例数据"), "cad-drawing-guide.doc");
assert.ok(guide.includes("<html"), "guide should be Word-compatible HTML");
assert.ok(guide.includes("mso-"), "guide should include Word-friendly styles");
assert.ok(guide.includes("<code>QUOTE_ROOM</code>"), "guide should show CAD layers as readable code labels");
assert.ok(guide.includes("门洞和开放边位置不要画墙线"));
assert.ok(drawingSpecGuideSections.length >= 5, "browser page should be able to render multiple guide sections");
