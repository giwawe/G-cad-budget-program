import type { GuideSection } from "./space-naming-guide";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineGuideHtml(value: string): string {
  return escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderSection(section: GuideSection): string {
  const paragraphs = (section.paragraphs ?? []).map((item) => `<p>${inlineGuideHtml(item)}</p>`).join("");
  const bullets = section.bullets?.length ? `<ul>${section.bullets.map((item) => `<li>${inlineGuideHtml(item)}</li>`).join("")}</ul>` : "";
  const table = section.table
    ? `<table><thead><tr>${section.table.headers.map((header) => `<th>${inlineGuideHtml(header)}</th>`).join("")}</tr></thead><tbody>${section.table.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${inlineGuideHtml(cell)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`
    : "";
  return `<section><h2>${inlineGuideHtml(section.title)}</h2>${paragraphs}${bullets}${table}</section>`;
}

function buildGuideWordHtml({ title, subtitle, sections }: { title: string; subtitle: string; sections: GuideSection[] }): string {
  return `\ufeff<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${inlineGuideHtml(title)}</title>
  <style>
    @page WordSection1 { size: 21cm 29.7cm; margin: 1.6cm 1.45cm; mso-header-margin: .5in; mso-footer-margin: .5in; }
    body { color: #10242b; font-family: "Microsoft YaHei", DengXian, Arial, sans-serif; font-size: 11pt; line-height: 1.62; }
    .WordSection1 { page: WordSection1; }
    h1 { color: #08786c; font-size: 24pt; margin: 0 0 8pt; mso-outline-level: 1; }
    h2 { border-bottom: 1pt solid #cfe0e2; color: #10242b; font-size: 15pt; margin: 18pt 0 8pt; padding-bottom: 4pt; mso-outline-level: 2; }
    p { margin: 0 0 8pt; }
    .subtitle { color: #607780; font-size: 11pt; margin-bottom: 16pt; }
    ul { margin: 0 0 10pt 20pt; padding: 0; }
    li { margin: 0 0 5pt; }
    code { background: #e8f6f3; border: 1pt solid #cfe0e2; color: #08786c; font-family: Consolas, "Microsoft YaHei", monospace; padding: 1pt 3pt; }
    table { border-collapse: collapse; margin: 8pt 0 12pt; width: 100%; mso-border-alt: solid #cfe0e2 .5pt; }
    th { background: #e8f6f3; color: #10242b; font-weight: 700; }
    th, td { border: 1pt solid #cfe0e2; padding: 6pt 7pt; text-align: left; vertical-align: top; }
    .cover { background: #f5faf8; border: 1pt solid #cfe0e2; margin-bottom: 14pt; padding: 16pt; }
  </style>
</head>
<body>
  <div class="WordSection1">
    <div class="cover">
      <h1>${inlineGuideHtml(title)}</h1>
      <p class="subtitle">${inlineGuideHtml(subtitle)}</p>
    </div>
    ${sections.map(renderSection).join("")}
  </div>
</body>
</html>`;
}

export const drawingSpecGuideSections: GuideSection[] = [
  {
    title: "出图目标",
    bullets: [
      "设计师上传的方案图用于自动生成工程量和预算草稿，图层和空间边界必须按统一规范绘制。",
      "一个空间只表达一种主要计价性质；空间边界、墙线、门窗、洞口和柜体应分图层表达。",
      "同一项目多楼层平铺时，应给每个空间使用清晰楼层前缀，例如 `负二层-车库`、`一层-客厅`、`三层-主卧`。",
    ],
  },
  {
    title: "必画图层",
    table: {
      headers: ["图层", "用途", "设计师要注意"],
      rows: [
        ["`QUOTE_ROOM`", "空间闭合边界，用于识别房间和计算地面、顶面面积。", "必须闭合，空间之间不要重叠。"],
        ["`QUOTE_WALL`", "实际可施工墙面线。", "门洞和开放边位置不要画墙线。"],
        ["`QUOTE_EXT_WALL`", "建筑外墙外轮廓闭合线。", "用于计算项目建筑面积，必须闭合。"],
        ["`QUOTE_WINDOW`", "窗洞宽度。", "系统按默认或标注窗高扣减墙面。"],
        ["`QUOTE_DOOR`", "门洞宽度。", "系统自动识别室内门、卫生间门、推拉门和入户门。"],
        ["`QUOTE_FLOOR`", "楼层标记。", "空间名已带楼层前缀时优先使用空间名前缀。"],
      ],
    },
  },
  {
    title: "按需图层",
    table: {
      headers: ["图层", "用途"],
      rows: [
        ["`QUOTE_WALL_TILE`", "非厨房、非卫生间的局部贴砖墙线。"],
        ["`QUOTE_NEW_WALL` / `QUOTE_DEMO_WALL`", "新砌墙和拆墙线，可用文字标注高度、厚度。"],
        ["`QUOTE_CAST_SLAB`", "现浇楼板闭合区域。"],
        ["`QUOTE_EDGE_CEILING` / `QUOTE_GYPSUM_LINE_CEILING` / `QUOTE_NO_CEILING`", "边吊、石膏线吊顶和原顶无吊顶范围，三者不能重叠。"],
        ["`QUOTE_BASE_CABINET` / `QUOTE_WALL_CABINET` / `QUOTE_CUSTOM`", "橱柜地柜、吊柜和非厨房定制柜体。"],
        ["`QUOTE_TOILET` / `QUOTE_BATHROOM_VANITY`", "卫生间洁具点位；不画时卫生间默认各 1 个。"],
        ["`QUOTE_OPENING`", "开放边或非墙边界；与墙线重叠时会从墙面计量长度中排除。"],
        ["`QUOTE_VOID`", "楼梯洞、挑空洞口等楼板洞口，每层按实际洞口位置绘制。"],
        ["`QUOTE_RAILING`", "栏杆、护栏、楼梯扶手线。"],
      ],
    },
  },
  {
    title: "空间边界规则",
    bullets: [
      "`QUOTE_ROOM` 必须闭合，边界之间不要重叠，一个空间不能包含另一个空间。",
      "楼梯间、过道、电梯井、管井、挑空等应拆成互不重叠的独立空间或洞口，不要用一个外框全部圈入。",
      "厨房、卫生间、阳台、露台、洗衣房等湿区不要和普通干区合并，否则墙砖、防水和乳胶漆规则会混乱。",
      "电梯井、管井、设备井、风井等辅助空间单独命名，默认不计价。",
    ],
  },
  {
    title: "复核顺序",
    bullets: [
      "上传方案后先看方案完整性复核，确认空间边界、墙线、门窗、洞口和柜体是否漏画。",
      "再看空间命名和健康提示，只处理会影响报价的 warning 项。",
      "修改 CAD 后重新上传方案，重新打开预算预览并下载预算表。",
    ],
  },
];

export function drawingSpecGuideFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "cad-drawing-guide.doc";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.cad-drawing-guide.doc`;
}

export function buildDrawingSpecGuideWordHtml(): string {
  return buildGuideWordHtml({
    title: "CAD 画图规范",
    subtitle: "用于设计师按统一图层、空间边界和楼层命名绘制可自动算量的 CAD 方案。",
    sections: drawingSpecGuideSections,
  });
}
