import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_DXF_FILES = [
  "D:/Desktop/别墅一.dxf",
  "D:/Desktop/别墅二.dxf",
  "D:/Desktop/商品房一.dxf",
  "D:/Desktop/商品房二.dxf",
  "D:/Desktop/商品房三.dxf",
];

const QUOTE_MODE_EXPORTS = [
  { mode: "hard", suffix: "硬装", selectedQuotePackageIds: [] },
  { mode: "full", suffix: "整装", selectedQuotePackageIds: [] },
  {
    mode: "hard_plus",
    suffix: "硬装加自选增项",
    selectedQuotePackageIds: ["main_materials", "custom_cabinet", "doors_windows", "fixtures_lighting", "other_finishing"],
  },
];

const DEFAULT_INTEGRATED_CEILING_SPACE_TYPES = new Set(["厨房", "卫生间"]);
const KEY_QUOTE_ITEMS = [
  "强电插座",
  "开关",
  "灯位",
  "给水点",
  "热水点",
  "排水点",
  "强电线管",
  "给水管",
  "淋浴隔断",
  "玻璃淋浴房",
  "淋浴隔断安装",
  "厨房卫生间集成吊顶",
  "楼梯踏步铺贴",
  "楼梯扶手",
];

const cwd = process.cwd();
const { buildHydropowerEstimate } = await import(pathToFileURL(path.join(cwd, "apps/web/lib/hydropower-estimate.ts")).href);
const { bathroomRowsFromRows } = await import(pathToFileURL(path.join(cwd, "apps/web/lib/manual-quote-options.ts")).href);
const { buildQuantityHealthChecks, summarizeQuantityHealthChecks, buildHealthFixListMarkdown } = await import(pathToFileURL(path.join(cwd, "apps/web/lib/quantity-health.ts")).href);
const { buildQuoteExcelHtml, quoteExcelFileName } = await import(pathToFileURL(path.join(cwd, "apps/web/lib/quote-excel.ts")).href);
const { buildQuoteMapping, defaultQuoteRules } = await import(pathToFileURL(path.join(cwd, "apps/web/lib/quote-mapping.ts")).href);

const options = parseArgs(process.argv.slice(2));
const outputDir = await resolveOutputDir(options.outDir, options.dateLabel);
const projectInfoByFile = await readProjectInfo(options.projectInfoPath);
const report = [
  "# 真实图纸回归报告",
  "",
  `生成时间：${new Date().toISOString()}`,
  `后端地址：${options.apiBaseUrl}`,
  `输出目录：${outputDir}`,
  "",
  "## 检查范围",
  "",
  "- 真实图纸解析和三种报价模式 Excel 导出",
  "- 空间分类边界：其他空间、混合命名、不计价空间、健康检查",
  "- 洞口/吊顶/楼梯稳定性：门窗、吊顶边界、洞口、楼梯踏步与扶手",
  "- 报价抬头信息：地址、客户、设计师、报价员、报价日期进入 Excel",
  "",
];

for (const filePath of options.dxfFiles) {
  const fileName = path.basename(filePath);
  const projectName = fileName.replace(/\.dxf$/i, "");
  const payload = await parseDxfReview(options.apiBaseUrl, filePath);
  const rows = payload.rows.map(toQuantityRow);
  const hydropower = buildHydropowerEstimate(rows, payload.drawing);
  const fullMapping = buildQuoteMapping(rows, defaultQuoteRules(), payload.summary, {
    hydropowerSummary: hydropower.summary,
    quoteMode: "full",
  });
  const checks = buildQuantityHealthChecks({ rows, summary: payload.summary, quoteMapping: fullMapping, hydropower });
  const healthSummary = summarizeQuantityHealthChecks(checks);
  const projectInfo = resolveProjectInfo(projectInfoByFile, fileName, projectName, options.dateLabel, payload.summary?.building_area_m2 ?? fullMapping.summary.building_area_m2);

  report.push(`## ${projectName}`, "");
  report.push(...formatDrawingSummary(rows, payload.summary, hydropower.summary, healthSummary));
  report.push(...formatSpaceClassification(rows, checks));
  report.push(...formatGeometryStability(rows, payload.drawing, fullMapping));
  report.push(...formatQuoteItemSummary(fullMapping));

  const fixList = buildHealthFixListMarkdown({ fileName, checks, rows });
  const fixListName = `${safeFilePart(projectName)}.cad-health-fix-list.md`;
  await fs.writeFile(path.join(outputDir, fixListName), fixList, "utf8");
  report.push(`- 修图清单：${fixListName}`, "");

  for (const exportOption of QUOTE_MODE_EXPORTS) {
    const mapping = buildQuoteMapping(rows, defaultQuoteRules(), payload.summary, {
      hydropowerSummary: hydropower.summary,
      quoteMode: exportOption.mode,
      selectedQuotePackageIds: exportOption.selectedQuotePackageIds,
      selectedQuoteItemNames: [],
    });
    const html = buildQuoteExcelHtml(mapping, fileName, {
      bathroomRows: bathroomRowsFromRows(rows),
      projectInfo,
    });
    const outputName = safeFilePart(`${projectName}-${exportOption.suffix}-${quoteExcelFileName(fileName)}`);
    await fs.writeFile(path.join(outputDir, outputName), html, "utf8");
    report.push(`- Excel：${outputName}（${exportOption.suffix}，${formatMoney(mapping.summary.total_amount)} 元）`);
  }
  report.push("");
}

await fs.writeFile(path.join(outputDir, "real-drawing-regression-report.md"), `${report.join("\n")}\n`, "utf8");
console.log(outputDir);

function parseArgs(args) {
  const parsed = {
    apiBaseUrl: "http://127.0.0.1:8010",
    dateLabel: new Date().toISOString().slice(0, 10),
    dxfFiles: [...DEFAULT_DXF_FILES],
    outDir: "",
    projectInfoPath: "",
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--api-base-url") {
      parsed.apiBaseUrl = requireValue(args, (index += 1), arg).replace(/\/$/, "");
    } else if (arg === "--date") {
      parsed.dateLabel = requireValue(args, (index += 1), arg);
    } else if (arg === "--out") {
      parsed.outDir = requireValue(args, (index += 1), arg);
    } else if (arg === "--project-info") {
      parsed.projectInfoPath = requireValue(args, (index += 1), arg);
    } else if (arg === "--dxf") {
      parsed.dxfFiles = requireValue(args, (index += 1), arg).split(";").map((item) => item.trim()).filter(Boolean);
    } else if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }
  return parsed;
}

function requireValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} 缺少参数值`);
  }
  return value;
}

function printHelpAndExit() {
  console.log(`Usage: node --experimental-strip-types tools/real-drawing-regression.mjs [options]

Options:
  --api-base-url <url>       后端地址，默认 http://127.0.0.1:8010
  --date <YYYY-MM-DD>        报价日期，默认今天
  --out <dir>                输出目录，默认桌面 cad-real-drawing-regression-<date>
  --project-info <json>      客户/项目抬头信息 JSON，可包含 default 和按 DXF 文件名覆盖
  --dxf "a.dxf;b.dxf"        使用分号分隔的 DXF 文件列表
`);
  process.exit(0);
}

async function resolveOutputDir(outDir, dateLabel) {
  if (outDir) {
    await fs.mkdir(outDir, { recursive: true });
    return outDir;
  }
  let candidate = path.join("D:/Desktop", `cad-real-drawing-regression-${dateLabel}`);
  for (let index = 2; ; index += 1) {
    try {
      await fs.mkdir(candidate, { recursive: false });
      return candidate;
    } catch (error) {
      if (error?.code !== "EEXIST") {
        throw error;
      }
      candidate = path.join("D:/Desktop", `cad-real-drawing-regression-${dateLabel}-${index}`);
    }
  }
}

async function readProjectInfo(projectInfoPath) {
  if (!projectInfoPath) {
    return {};
  }
  const content = await fs.readFile(projectInfoPath, "utf8");
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--project-info 必须是 JSON 对象");
  }
  return parsed;
}

async function parseDxfReview(apiBaseUrl, filePath) {
  const bytes = await fs.readFile(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: "application/dxf" }), path.basename(filePath));
  const response = await fetch(`${apiBaseUrl}/api/parse-dxf-review`, { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error(`${filePath} DXF 解析失败：HTTP ${response.status}`);
  }
  return response.json();
}

function resolveProjectInfo(projectInfoByFile, fileName, projectName, dateLabel, decorationAreaM2) {
  const defaults = sanitizeProjectInfo(projectInfoByFile.default);
  const specific = sanitizeProjectInfo(projectInfoByFile[fileName] ?? projectInfoByFile[projectName]);
  return {
    addressName: specific.addressName ?? defaults.addressName ?? projectName,
    customerName: specific.customerName ?? defaults.customerName ?? "",
    designerName: specific.designerName ?? defaults.designerName ?? "",
    estimatorName: specific.estimatorName ?? defaults.estimatorName ?? "",
    quoteDate: specific.quoteDate ?? defaults.quoteDate ?? dateLabel,
    decorationAreaM2,
  };
}

function sanitizeProjectInfo(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return {
    addressName: sanitizeString(value.addressName),
    customerName: sanitizeString(value.customerName),
    designerName: sanitizeString(value.designerName),
    estimatorName: sanitizeString(value.estimatorName),
    quoteDate: sanitizeString(value.quoteDate),
  };
}

function sanitizeString(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toQuantityRow(row) {
  return {
    floor: row.floor,
    spaceName: row.space_name,
    spaceType: row.space_type,
    grossFloorAreaM2: row.gross_floor_area_m2 ?? row.floor_area_m2,
    floorAreaM2: row.floor_area_m2,
    ceilingAreaM2: row.ceiling_area_m2,
    gypsumFlatCeilingAreaM2: row.gypsum_flat_ceiling_area_m2 ?? row.ceiling_area_m2,
    edgeCeilingAreaM2: row.edge_ceiling_area_m2 ?? 0,
    edgeCeilingLengthM: row.edge_ceiling_length_m ?? 0,
    gypsumLineCeilingAreaM2: row.gypsum_line_ceiling_area_m2 ?? 0,
    gypsumLineCeilingLengthM: row.gypsum_line_ceiling_length_m ?? 0,
    noCeilingAreaM2: row.no_ceiling_area_m2 ?? 0,
    voidAreaM2: row.void_area_m2 ?? 0,
    ceilingFinishType: row.ceiling_finish_type ?? defaultCeilingFinishType(row.space_type),
    wallMeasureLengthM: row.wall_measure_length_m,
    heightM: row.height_m,
    windowWidthTotalM: row.window_width_total_m,
    windowsillLengthM: row.windowsill_length_m,
    curtainWallWidthM: row.curtain_wall_width_m,
    curtainWallWidthSource: row.curtain_wall_width_source ?? "not_applicable",
    atriumCurtainWidthM: row.atrium_curtain_width_m ?? 0,
    atriumCurtainHeightM: row.atrium_curtain_height_m ?? 0,
    atriumCurtainAreaM2: row.atrium_curtain_area_m2 ?? 0,
    windowAreaM2: row.window_area_m2,
    doorWidthTotalM: row.door_width_total_m,
    doorDeductAreaM2: row.door_deduct_area_m2,
    wallGrossAreaM2: row.wall_gross_area_m2,
    latexPaintAreaM2: row.latex_paint_area_m2,
    wallTileMeasureLengthM: row.wall_tile_measure_length_m ?? 0,
    wallTileAreaM2: row.wall_tile_area_m2,
    floorTilePieceCount: row.floor_tile_piece_count ?? 0,
    electricalScopeAreaM2: row.electrical_scope_area_m2 ?? 0,
    plumbingScopeAreaM2: row.plumbing_scope_area_m2 ?? 0,
    newWallLengthM: row.new_wall_length_m ?? 0,
    newWallAreaM2: row.new_wall_area_m2 ?? 0,
    newWallUnclassifiedAreaM2: row.new_wall_unclassified_area_m2 ?? row.new_wall_area_m2 ?? 0,
    newWall120AreaM2: row.new_wall_120_area_m2 ?? 0,
    newWall240AreaM2: row.new_wall_240_area_m2 ?? 0,
    demolitionWallLengthM: row.demolition_wall_length_m ?? 0,
    demolitionWallAreaM2: row.demolition_wall_area_m2 ?? 0,
    backgroundWallAreaM2: row.background_wall_area_m2 ?? 0,
    castSlabAreaM2: row.cast_slab_area_m2 ?? 0,
    entryDoorCount: row.entry_door_count ?? 0,
    interiorDoorCount: row.interior_door_count ?? 0,
    bathroomDoorCount: row.bathroom_door_count ?? 0,
    slidingDoorAreaM2: row.sliding_door_area_m2 ?? 0,
    slidingDoorCasingLengthM: row.sliding_door_casing_length_m ?? 0,
    kitchenBaseCabinetLengthM: row.kitchen_base_cabinet_length_m ?? 0,
    kitchenWallCabinetLengthM: row.kitchen_wall_cabinet_length_m ?? 0,
    customCabinetAreaM2: row.custom_cabinet_area_m2 ?? 0,
    toiletCount: row.toilet_count ?? 0,
    bathroomVanityCount: row.bathroom_vanity_count ?? 0,
    stairRailingLengthM: row.stair_railing_length_m ?? 0,
    guardrailLengthM: row.guardrail_length_m ?? 0,
    waterproofAreaM2: row.waterproof_area_m2,
    evidence: row.evidence,
    anomalies: row.anomalies,
    status: row.status,
  };
}

function defaultCeilingFinishType(spaceType) {
  return DEFAULT_INTEGRATED_CEILING_SPACE_TYPES.has(spaceType) ? "integrated" : "gypsum";
}

function formatDrawingSummary(rows, summary, hydropowerSummary, healthSummary) {
  return [
    "### 总览",
    "",
    `- 空间数：${rows.length}`,
    `- 建筑面积：${formatQuantity(summary?.building_area_m2 ?? 0)} m2`,
    `- 地面面积合计：${formatQuantity(summary?.floor_area_total_m2 ?? 0)} m2`,
    `- 墙面计量长度：${formatQuantity(summary?.wall_measure_length_total_m ?? 0)} m`,
    `- 健康检查：${healthSummary.label}`,
    `- 水电点位：强电插座 ${hydropowerSummary.standardOutletCount}，开关 ${hydropowerSummary.switchPointCount}，灯位 ${hydropowerSummary.lightPointCount}，给水点 ${hydropowerSummary.coldWaterPointCount}，热水点 ${hydropowerSummary.hotWaterPointCount}，排水点 ${hydropowerSummary.drainPointCount}`,
    "",
  ];
}

function formatSpaceClassification(rows, checks) {
  const typeCounts = countBy(rows, (row) => row.spaceType);
  const statusCounts = countBy(rows, (row) => row.status);
  const otherSpaces = rows.filter((row) => row.spaceType === "其他").map((row) => row.spaceName);
  const mixedChecks = checks.filter((check) => check.id === "space-naming-mixed-use" || check.id === "space-type-other");
  return [
    "### 空间分类边界",
    "",
    `- 空间类型分布：${formatCounts(typeCounts)}`,
    `- 状态分布：${formatCounts(statusCounts)}`,
    `- 其他空间：${otherSpaces.length ? otherSpaces.join("、") : "无"}`,
    ...mixedChecks.map((check) => `- ${check.severity === "warning" ? "需处理" : "提醒"}：${check.title}；${check.detail}`),
    "",
  ];
}

function formatGeometryStability(rows, drawing, mapping) {
  const doorOpenings = drawing?.door_openings ?? [];
  const windowOpenings = drawing?.window_openings ?? [];
  const reviewDoorCount = doorOpenings.filter((door) => door.review_required).length;
  const slidingDoorCount = rows.reduce((sum, row) => sum + (row.slidingDoorAreaM2 > 0 ? 1 : 0), 0);
  const stairTreadCount = quoteItemQuantity(mapping, "楼梯踏步铺贴");
  return [
    "### 洞口 / 吊顶 / 楼梯稳定性",
    "",
    `- 门洞：${doorOpenings.length} 个；需人工确认大洞口：${reviewDoorCount} 个；入户门 ${sumRows(rows, "entryDoorCount")} 樘；室内门 ${sumRows(rows, "interiorDoorCount")} 樘；卫生间门 ${sumRows(rows, "bathroomDoorCount")} 樘；推拉门归属空间 ${slidingDoorCount} 个`,
    `- 窗洞：${windowOpenings.length} 个；窗洞扣减面积合计 ${formatQuantity(sumRows(rows, "windowAreaM2"))} m2；窗台石长度 ${formatQuantity(sumRows(rows, "windowsillLengthM"))} m`,
    `- 吊顶：边吊面积 ${formatQuantity(sumRows(rows, "edgeCeilingAreaM2"))} m2 / 长度 ${formatQuantity(sumRows(rows, "edgeCeilingLengthM"))} m；石膏线面积 ${formatQuantity(sumRows(rows, "gypsumLineCeilingAreaM2"))} m2 / 长度 ${formatQuantity(sumRows(rows, "gypsumLineCeilingLengthM"))} m；原顶无吊顶 ${formatQuantity(sumRows(rows, "noCeilingAreaM2"))} m2`,
    `- 洞口：楼板洞口面积 ${formatQuantity(sumRows(rows, "voidAreaM2"))} m2；挑空窗帘候选 ${formatQuantity(sumRows(rows, "atriumCurtainAreaM2"))} m2`,
    `- 楼梯：扶手 ${formatQuantity(sumRows(rows, "stairRailingLengthM"))} m；栏杆/护栏 ${formatQuantity(sumRows(rows, "guardrailLengthM"))} m；踏步候选 ${formatQuantity(stairTreadCount)} 步`,
    "",
  ];
}

function formatQuoteItemSummary(mapping) {
  const lines = ["### 报价关键项", ""];
  for (const itemName of KEY_QUOTE_ITEMS) {
    const quantity = quoteItemQuantity(mapping, itemName);
    if (quantity > 0) {
      const unit = mapping.items.find((item) => item.item_name === itemName)?.unit ?? "";
      lines.push(`- ${itemName}：${formatQuantity(quantity)} ${unit}`);
    }
  }
  if (lines.length === 2) {
    lines.push("- 暂无关键报价项。");
  }
  lines.push("");
  return lines;
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row) || "空";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatCounts(counts) {
  return Array.from(counts.entries()).map(([key, count]) => `${key} ${count}`).join("，") || "无";
}

function sumRows(rows, field) {
  return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}

function quoteItemQuantity(mapping, itemName) {
  return mapping.items.filter((item) => item.item_name === itemName).reduce((sum, item) => sum + item.quantity, 0);
}

function safeFilePart(value) {
  return value.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "").trim();
}

function formatQuantity(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100) / 100}` : "0";
}

function formatMoney(value) {
  return Number.isFinite(value) ? (Math.round(value * 100) / 100).toFixed(2) : "0.00";
}
