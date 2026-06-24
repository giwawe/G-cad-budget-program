# AGENTS.md

本文件给后续接手本仓库的编码代理使用。请优先阅读这里，再改代码。

## 项目概览

这是一个面向装修报价员的 CAD/DXF 空间算量验证工具。目标是读取按规范绘制的商品房 DXF，自动生成可校对、可追溯的空间工程量表，并逐步承接校准、差异检查和报价映射。

第一阶段重点不是完整报价系统，而是把 DXF 自动算出的空间面积、墙面计量长度、窗洞扣减、乳胶漆面积等结果校准到稳定可信。

## 技术栈与结构

- 前端：Next.js 15、React 19、TypeScript，位于 `apps/web`。
- 后端：Python FastAPI，DXF 解析依赖 `ezdxf`，位于 `server/app`。
- 测试：后端使用 `pytest`；前端 helper 使用 Node 的 `--experimental-strip-types` 直接跑 TypeScript 测试文件。
- 文档：`docs/` 下保存出图规范、MVP 需求和早期执行计划。

主要目录：

- `server/app/main.py`：FastAPI 入口和 API endpoint。
- `server/app/models.py`：后端 dataclass 模型，包括 `ProjectDefaults`、`SpaceInput`、`QuantityRow`。
- `server/app/dxf/parser.py`：DXF 解析、图层读取、空间/墙线/门窗归属、review drawing 数据生成。
- `server/app/quantity/geometry.py`：面积、长度、点在多边形内等纯几何函数。
- `server/app/quantity/classification.py`：空间类型识别和默认不计价空间识别。
- `server/app/quantity/calculator.py`：确定性算量公式。
- `server/app/quantity/comparison.py`：系统算量与 golden 校准 JSON 的差异对比。
- `apps/web/components/upload-workbench.tsx`：前端主工作台，负责 DXF 上传、校准 JSON 上传、快照导入导出、报价映射导出。
- `apps/web/components/drawing-review.tsx`：SVG 图形校对视图，支持缩放、平移、空间改名、门窗扣减/窗高人工调整。
- `apps/web/components/quantity-table.tsx`：空间工程量校对表。
- `apps/web/lib/calibration-template.ts`：校准模板导出。
- `apps/web/lib/review-snapshot.ts`：校对快照导出与导入解析。
- `apps/web/lib/quote-mapping.ts`：从算量结果生成报价映射 JSON。

## 本地运行

当前约定端口不是常见默认端口，避免冲突：

- Web：`http://127.0.0.1:3010/`
- API：`http://127.0.0.1:8010/`

启动后端：

```powershell
python -m uvicorn server.app.main:app --host 127.0.0.1 --port 8010
```

启动前端：

```powershell
node node_modules\next\dist\bin\next dev apps\web --hostname 127.0.0.1 --port 3010
```

注意：这台机器上曾观察到 `npm`/`npx` 不可用，但仓库已有 `node_modules`，所以常用 `node node_modules\next\dist\bin\next ...` 直接运行 Next。

## 验证命令

后端全量回归：

```powershell
python -m pytest server\tests -v
```

前端构建：

```powershell
node node_modules\next\dist\bin\next build apps\web
```

前端 helper 测试：

```powershell
node --experimental-strip-types apps\web\lib\quote-mapping.test.ts
node --experimental-strip-types apps\web\lib\review-snapshot.test.ts
node --experimental-strip-types apps\web\lib\quantity-row-anchor.test.ts
node --experimental-strip-types apps\web\lib\quantity-row-status.test.ts
node --experimental-strip-types apps\web\lib\calibration-differences.test.ts
node --experimental-strip-types apps\web\lib\calibration-template.test.ts
```

这些 Node 测试会打印 `MODULE_TYPELESS_PACKAGE_JSON` warning，当前可忽略，不要为了消 warning 贸然改 package type。

## API 表面

- `GET /health`：健康检查。
- `GET /api/sample-quantities`：返回样例工程量。
- `POST /api/parse-dxf`：上传 DXF，返回算量行数组。
- `POST /api/parse-dxf-review`：上传 DXF，返回算量行、图形 review 数据和汇总。
- `POST /api/compare-dxf-calibration`：上传 DXF 与校准 JSON，返回系统算量、汇总和差异对比。

`compare-dxf-calibration` 的校准 JSON 可参考 `server/tests/fixtures/test-case.golden.json`，前端也可以导出校准模板。

## 业务规则

DXF 规范见 `docs/cad-quote-drawing-spec-v1.md`。关键图层：

- `QUOTE_ROOM`：空间闭合边界，用于地面/顶面面积和空间归属。
- `QUOTE_WALL`：真实可施工墙面线，用于墙面计量长度。
- `QUOTE_WALL_TILE`：阳台、露台、洗衣房等实际贴砖墙面线，用于标记贴砖墙长。
- `QUOTE_NEW_WALL`：新砌墙中心线或墙体线，用于新砌墙长度和面积。
- `QUOTE_DEMO_WALL`：拆除墙体中心线或墙体线，用于拆墙长度和面积。
- `QUOTE_CABINET`：厨房橱柜地柜/台面延米线，用于橱柜长度。
- `QUOTE_WINDOW`：窗洞宽度标记，默认参与墙面扣减。
- `QUOTE_DOOR`：门洞宽度标记，普通门默认不扣墙面。
- `QUOTE_TEXT`：空间名称文字；`QUOTE_FLOOR`、`QUOTE_HEIGHT` 当前只读取文字，能力仍有限。

核心公式：

```text
地面面积 = QUOTE_ROOM 闭合边界面积
顶面面积 = 地面面积
墙面计量长度 = 与空间关联的 QUOTE_WALL 长度
墙面展开面积 = 墙面计量长度 * 层高
窗洞面积 = 窗宽合计 * 窗高
门洞扣减 = 仅 deduct_from_wall=true 的门洞宽度 * 门高
乳胶漆面积 = 墙面展开面积 - 窗洞面积 - 门洞扣减
新砌墙面积 = 与空间关联的 QUOTE_NEW_WALL 长度合计 * 层高
拆墙面积 = 与空间关联的 QUOTE_DEMO_WALL 长度合计 * 层高
厨房橱柜长度 = 厨房空间内 QUOTE_CABINET 长度合计
```

默认参数：

- 项目层高：`2.8m`
- 默认窗高：`1.5m`
- 默认门高：`2.1m`
- DXF 单位换算：默认 `mm -> m`，`unit_scale_to_m = 0.001`

楼层规则：

- 空间名包含 `-` 时，`-` 前作为楼层，例如 `一层-客厅`。
- 空间名没有楼层前缀时，当前规则默认显示为 `一层`，不要恢复成 `未分层`。

空间分类：

- 关键词分类在 `server/app/quantity/classification.py`。
- 已覆盖：客厅、餐厅、厨房、卫生间、阳台、卧室、书房、衣帽间、储物间、洗衣房、门厅、楼梯过道、楼梯、过道、露台、外墙。
- `电梯井`、`设备井`、`管井`、`风井` 默认识别但不计价，状态为 `excluded`。

门洞规则：

- 普通门默认不扣墙面。
- 室内门报价不要求设计师额外分图层，系统会自动判断门类型：块名或图层名含 `入户`、`进户`、`防盗`、`entry` 判为入户门；含 `推拉`、`移门`、`sliding` 判为推拉门；无关键词且门宽 `>=1.4m` 判为推拉门；剩余普通门判为室内门。
- 只有判为室内门且 `opening_type=normal_door` 的门洞会生成 `interior_door_count`，默认报价规则“室内门”按樘数生成金额。
- 大洞口门可按规则扣减。
- 疑似大洞口会标记 review_required，并在异常里提示人工确认。
- 入户门、推拉门、大洞口和疑似大洞口不计入 `interior_door_count`；跨空间门洞若重复归属，需要在校准 JSON 中人工修正。

墙砖与防水规则：

- 厨房、卫生间自动计算 `wall_tile_area_m2`，墙砖高度固定按 `2.5m`，不使用项目默认层高 `2.8m`。
- 墙砖面积公式：`max(墙面计量长度 * 2.5 - 窗洞面积 - 所有门洞宽度 * 默认门高, 0)`；普通门在墙砖中也扣除。
- 阳台、露台、洗衣房只有画了 `QUOTE_WALL_TILE` 时自动计算墙砖；公式为 `贴砖墙长 * 空间实际层高`，当前不单独扣除未匹配贴砖墙的门窗洞。
- 厨房、卫生间、阳台、露台、洗衣房自动计算 `waterproof_area_m2`。
- 防水面积公式：`地面面积 + 墙面计量长度 * 防水高度`；卫生间防水高度 `1.8m`，其它湿区 `0.3m`。
- 工程量表显示 `wall_tile_measure_length_m`，校准模板也会导出 `wall_tile_measure_length_m` 和 `wall_tile_area_m2`。
- 新砌墙：画在 `QUOTE_NEW_WALL` 的线段会生成 `new_wall_length_m` 和 `new_wall_area_m2`，公式为 `新砌墙长度 * 空间实际层高`；默认报价规则“砌120厚砖墙”按 `new_wall_area_m2` 生成金额。
- 拆墙：画在 `QUOTE_DEMO_WALL` 的线段会生成 `demolition_wall_length_m` 和 `demolition_wall_area_m2`，公式为 `拆墙长度 * 空间实际层高`；默认报价规则“拆改及拆墙”按 `demolition_wall_area_m2` 生成金额。
- 橱柜：画在 `QUOTE_CABINET` 的线段会生成 `kitchen_cabinet_length_m`，仅厨房空间计入；默认报价规则“橱柜”按 `kitchen_cabinet_length_m` 生成金额。
- 窗台石当前自动计算 `windowsill_length_m`，v1 直接等于 `window_width_total_m`，用于窗台石铺贴报价。
- 窗帘和窗帘箱不能按窗洞宽度计量，应按窗户所在墙面的整面墙宽度；厨房、卫生间、过道等空间默认不做窗帘/窗帘箱。
- `curtain_wall_width_m` 是窗帘墙宽候选取数：客厅、卧室、书房有窗时优先按窗洞中心线匹配邻近且平行的 `QUOTE_WALL`，取窗户所在墙面的整面墙宽；匹配不到时回退到该空间最长一段 `QUOTE_WALL`；其它空间为 `0`。L 形/转角窗帘和窗帘箱长度不自动计算，候选值为 `0` 并要求人工确认。`curtain_wall_width_source` 标记来源：`matched_window_wall`、`fallback_longest_wall`、`manual_required_l_shape_window`、`not_applicable` 或前端人工编辑后的 `manual`。前端工程量表可人工校准并随校对快照保存/恢复；只有来源为 `manual` 且长度大于 0 时，暗窗帘箱才进入报价规则和金额汇总。

## 前端已实现能力

主工作台支持：

- 上传 DXF 并调用 `8010` 后端解析。
- 上传校准 JSON 并显示“校准通过”或差异卡片。
- 差异卡片可跳转到对应表格行，差异单元格高亮。
- 导出校准模板 JSON，并在页面显示可复制内容。
- 校准模板包含窗台石长度、窗帘墙宽候选、窗帘墙宽来源、贴砖墙、新砌墙、拆墙、室内门数和橱柜长度指标，便于把人工确认值沉淀进 golden JSON。
- 上传校准 JSON 后，如果窗帘墙宽候选存在差异，且当前来源为 `manual_required_l_shape_window` 或 `fallback_longest_wall`，工程量表会提供“应用校准”按钮，把校准值写回当前行、标记为 `manual`，并清除该单元格的当前差异。
- 导出校对快照 JSON；快照包含来源文件、校准文件、summary、comparison 和 rows。
- 导入校对快照 JSON，恢复表格、状态、summary、comparison 和来源文件名。
- 每行可改 review 状态：待确认、已确认、需修图、不计价。
- SVG 图形 review 可缩放/平移，支持空间改名、门洞扣减切换、窗洞扣减切换、窗高调整。
- 导出报价映射 JSON；默认使用商品房报价表 `整装` 工作表中当前可自动取数的 16 条规则，跳过不计价空间。
- 下载/导入报价规则 JSON；导入后报价映射会使用当前规则重新计算金额。
- 页面会提示商品房整装待补取数口径清单，这些项目暂不参与金额汇总。
- 导出报价映射后会显示窗帘/窗帘箱可报价候选空间数、仍待确认空间数和对应空间名；导出的报价映射 JSON 会附带 `curtain_quote_readiness` 摘要，并把人工确认后的暗窗帘箱写入 `curtain_quote_candidates` 候选清单和 `items` 金额汇总。
- 窗帘墙宽候选列可在工程量表中直接编辑；编辑后会清空已生成的报价映射，避免沿用旧结果。
- 窗帘墙宽候选列会显示候选来源，`回退最长墙` 代表未匹配到窗户所在墙面，需要人工重点确认；`L形窗人工确认` 代表转角窗不能按直线墙宽自动取数。

报价映射默认规则在 `apps/web/lib/quote-mapping.ts`：

- 墙面界面剂处理、墙面批嵌、墙面乳胶漆：按 `latexPaintAreaM2`，仅匹配干区和露台等适用空间。
- 轻钢龙骨平顶、顶面批嵌、顶面乳胶漆：按 `ceilingAreaM2`，仅匹配适用空间。
- 地面找平：按 `floorAreaM2`，仅匹配厨房、卫生间、阳台、露台、洗衣房。
- 地面砖铺贴(750X1500)：按 `floorAreaM2`，当前不限制空间类型。
- 墙面贴瓷砖(600X1200)：按 `wallTileAreaM2`，仅匹配厨房、卫生间。
- 墙地面防漏处理：按 `waterproofAreaM2`，仅匹配厨房、卫生间、阳台、露台、洗衣房。
- 窗台石铺贴：按 `windowsillLengthM`，有窗洞长度时生成。
- 砌120厚砖墙：按 `newWallAreaM2`，画了 `QUOTE_NEW_WALL` 时生成。
- 拆改及拆墙：按 `demolitionWallAreaM2`，画了 `QUOTE_DEMO_WALL` 时生成。
- 室内门：按 `interiorDoorCount`，普通 `QUOTE_DOOR` 门洞生成。
- 橱柜：按 `kitchenCabinetLengthM`，厨房画了 `QUOTE_CABINET` 时生成。
- 窗帘墙宽候选 `curtainWallWidthM` 在工程量表展示，并可在人工确认后导出为 `curtain_quote_candidates` 候选清单；`curtain_wall_width_m` 已属于可导入报价规则 metric，但仅 `curtainWallWidthSource === "manual"` 时生成暗窗帘箱金额。

这些规则只覆盖现有算量口径能稳定承接的自动计价项目，不等于完整整装报价。

报价规则 JSON 是数组格式，字段为：

- `item_name`：清单项名称。
- `metric`：取数指标，当前只允许 `latex_paint_area_m2`、`floor_area_m2`、`ceiling_area_m2`、`wall_tile_area_m2`、`waterproof_area_m2`、`windowsill_length_m`、`new_wall_area_m2`、`demolition_wall_area_m2`、`interior_door_count`、`kitchen_cabinet_length_m`、`curtain_wall_width_m`。
- `unit`：单位。
- `unit_price`：单价，必须是非负数字。
- `space_types`：可选，空间类型白名单；填写后只对这些空间类型生成清单项。

当前商品房报价表已整理出一份可导入规则：`quote-rules-apartment-current.json`。它基于商品房报价表的 `整装` 工作表，只包含当前系统能准确承接的面积类项目；`半包` 工作表不读取、不展示、不保留为规则来源。

商品房整装待补取数口径记录在 `apartmentPendingQuoteMetrics()`，只用于页面展示和后续扩展，不混入可导入规则 JSON，也不参与金额汇总。当前重点包括水电、洁具、定制、主材、套装项等。

## 测试与 fixture

重要 fixture：

- `server/tests/fixtures/test-case.dxf`
- `server/tests/fixtures/test-case-2.dxf`
- `server/tests/fixtures/test-case.golden.json`

重要测试覆盖：

- `test_api_parse_dxf.py`：API 上传、真实 DXF、golden 校准、CORS。
- `test_dxf_parser.py`：真实 DXF 解析、窗/门归组、闭合多段线、MTEXT 清理。
- `test_quantity_calculator.py`：公式、层高优先级、分类、不计价空间、门洞扣减。
- `test_quantity_comparison.py`：校准差异对比。
- `apps/web/lib/*.test.ts`：前端导出、快照、差异索引、报价映射等纯函数。

## 编码与平台注意事项

- 项目包含大量中文文案和中文空间名，读写文件请使用 UTF-8。
- PowerShell 查看文件时建议显式加 `-Encoding utf8`，否则中文可能显示异常。
- 修改文件时使用 `apply_patch`，不要用 shell 重定向或 Python 脚本写文件。
- 搜索优先用 `rg`。
- 不要提交日志、截图、构建产物、临时文件。
- 如果构建后继续本地试用，建议重启 `3010` 前端 dev server，避免旧 chunk 或缓存状态干扰。
- 后端 Python 代码变更后需要重启 `8010`，uvicorn 当前常用命令未带 `--reload`。

## 设计取向

- 后端保持确定性、可测试：DXF 解析和算量公式分层，公式逻辑尽量放在小函数里。
- 前端是工作台，不是营销页：信息密度高，重视表格、状态、差异、可复制 JSON 和可回退快照。
- 人工校准结果应该尽量沉淀为规则或 golden fixture，而不是只停留在一次页面状态里。
- 新功能优先补纯函数测试，再接 UI。
- 避免扩大范围：完整报价模板、Excel 导出、复杂材料库、CAD 插件都不是当前已经完成的能力。

## 最近稳定检查点

已完成并提交过的功能包括：

- DXF 校准对比 API 与 golden 回归。
- 前端校准 JSON 上传与差异高亮。
- 校准模板导出。
- 校对快照导出/导入。
- 每行 review 状态控制。
- 校准差异跳转到表格行。
- 默认楼层与空间分类规则校准。
- 报价映射导出。
- 报价规则模板下载和导入。

继续开发时，先跑 `git status --short`，确认工作区干净或只包含本轮相关改动。
