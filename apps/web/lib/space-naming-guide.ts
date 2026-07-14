export type GuideTable = {
  headers: string[];
  rows: string[][];
};

export type GuideSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: GuideTable;
};

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

export const spaceNamingGuideSections: GuideSection[] = [
  {
    title: "基本原则",
    bullets: [
      "一个 `QUOTE_ROOM` 只表达一种主要计价性质。",
      "客厅、楼梯过道、普通过道、电梯井、挑空、露台等应分别命名并分别画边界。",
      "不要使用 `过道/电梯井`、`客厅/电梯井`、`客厅/楼梯过道` 这类混合空间名。",
      "电梯井、设备井、管井、风井默认是不计价空间；楼板洞口、楼梯洞、挑空洞口应使用 `QUOTE_VOID` 表达。",
      "开放边、非墙边界使用 `QUOTE_OPENING` 表达；栏杆、护栏、楼梯扶手统一使用 `QUOTE_RAILING`。",
    ],
  },
  {
    title: "推荐命名",
    bullets: [
      "多楼层空间使用 `楼层-空间名`，例如 `负二层-车库`、`一层-客厅`、`三层-主卧`。",
      "楼层名称统一使用 `负二层`、`负一层`、`一层`、`二层`、`三层`。",
      "同层多个同类空间使用 `卧室一`、`卧室二`、`卫生间一`、`卫生间二`。",
      "茶室、影音室、健身房、麻将房、棋牌室等可按普通干区计价，但名称应保持单一空间性质。",
    ],
  },
  {
    title: "会影响报价的常见错误",
    table: {
      headers: ["错误写法", "为什么会影响报价", "建议做法"],
      rows: [
        ["客厅/楼梯过道", "楼梯踏步、墙顶地项目归属不清。", "拆成客厅和楼梯过道两个空间。"],
        ["过道/电梯井", "会触发命名拆分提醒，洞口和楼梯踏步可能只能按保底规则处理。", "过道单独画；电梯井单独画且默认不计价。"],
        ["厨房+餐厅", "墙砖、防水和乳胶漆规则会混乱。", "厨房和餐厅分别画 `QUOTE_ROOM`。"],
        ["露台/客厅", "露台不应生成室内顶面吊顶和乳胶漆。", "露台和室内空间拆开。"],
      ],
    },
  },
  {
    title: "校对建议",
    bullets: [
      "上传 DXF/DWG 后先查看算量健康检查，优先处理“空间命名需拆分”。",
      "无法自动分类的空间，在工程量表“类型”列手动选择计价类型。",
      "确实不报价的空间，在状态列选择“不计价”。",
      "修改空间类型后导出校对快照，后续导入快照会保留人工分类结果。",
    ],
  },
];

export function spaceNamingGuideFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "space-naming-guide.doc";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.space-naming-guide.doc`;
}

export function buildSpaceNamingGuideWordHtml(): string {
  return buildGuideWordHtml({
    title: "CAD 空间命名规范",
    subtitle: "给设计师快速核对空间命名、楼层前缀、空间拆分和常见错误。",
    sections: spaceNamingGuideSections,
  });
}
