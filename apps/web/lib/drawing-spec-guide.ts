export function drawingSpecGuideFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "cad-drawing-guide.md";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.cad-drawing-guide.md`;
}

export function buildDrawingSpecGuideMarkdown(): string {
  return [
    "# CAD 画图规范",
    "",
    "## 出图目标",
    "",
    "- 设计师上传的方案图用于自动生成工程量和预算草稿，图层和空间边界必须按统一规范绘制。",
    "- 一个空间只表达一种主要计价性质；空间边界、墙线、门窗、洞口和柜体应分图层表达。",
    "- 同一项目多楼层平铺时，应给每个空间使用清晰楼层前缀，例如 `负二层-车库`、`一层-客厅`、`三层-主卧`。",
    "",
    "## 必画图层",
    "",
    "- `QUOTE_ROOM`：空间闭合边界，用于识别房间和计算地面、顶面面积。",
    "- `QUOTE_WALL`：实际可施工墙面线，门洞和开放边位置不要画墙线。",
    "- `QUOTE_EXT_WALL`：建筑外墙外轮廓闭合线，用于计算项目建筑面积。",
    "- `QUOTE_WINDOW`：窗洞宽度，系统按默认或标注窗高扣减墙面。",
    "- `QUOTE_DOOR`：门洞宽度，系统自动识别室内门、卫生间门、推拉门和入户门。",
    "- `QUOTE_FLOOR`：楼层标记，空间名已带楼层前缀时优先使用空间名前缀。",
    "",
    "## 按需图层",
    "",
    "- `QUOTE_WALL_TILE`：非厨房、非卫生间的局部贴砖墙线。",
    "- `QUOTE_NEW_WALL` / `QUOTE_DEMO_WALL`：新砌墙和拆墙线，可用文字标注高度、厚度。",
    "- `QUOTE_CAST_SLAB`：现浇楼板闭合区域。",
    "- `QUOTE_EDGE_CEILING`、`QUOTE_GYPSUM_LINE_CEILING`、`QUOTE_NO_CEILING`：边吊、石膏线吊顶和原顶无吊顶范围，三者不能重叠。",
    "- `QUOTE_BASE_CABINET`、`QUOTE_WALL_CABINET`、`QUOTE_CUSTOM`：橱柜地柜、吊柜和非厨房定制柜体。",
    "- `QUOTE_TOILET`、`QUOTE_BATHROOM_VANITY`：卫生间洁具点位；不画时卫生间默认各 1 个。",
    "- `QUOTE_OPENING`：开放边或非墙边界；与墙线重叠时会从墙面计量长度中排除。",
    "- `QUOTE_VOID`：楼梯洞、挑空洞口等楼板洞口，每层按实际洞口位置绘制。",
    "- `QUOTE_RAILING`：栏杆、护栏、楼梯扶手线。",
    "",
    "## 空间边界规则",
    "",
    "- `QUOTE_ROOM` 必须闭合，边界之间不要重叠，一个空间不能包含另一个空间。",
    "- 楼梯间、过道、电梯井、管井、挑空等应拆成互不重叠的独立空间或洞口，不要用一个外框全部圈入。",
    "- 厨房、卫生间、阳台、露台、洗衣房等湿区不要和普通干区合并，否则墙砖、防水和乳胶漆规则会混乱。",
    "- 电梯井、管井、设备井、风井等辅助空间单独命名，默认不计价。",
    "",
    "## 复核顺序",
    "",
    "- 上传方案后先看方案完整性复核，确认空间边界、墙线、门窗、洞口和柜体是否漏画。",
    "- 再看空间命名和健康提示，只处理会影响报价的 warning 项。",
    "- 修改 CAD 后重新上传方案，重新导出预算草稿。",
    "",
  ].join("\n");
}
