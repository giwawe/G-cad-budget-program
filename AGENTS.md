# AGENTS.md

本文件给后续接手本仓库的编码代理使用。请优先阅读这里，再改代码。

## 项目概览

这是一个面向装修报价员的 CAD/DXF 空间算量验证工具。目标是读取按规范绘制的商品房 DXF，自动生成可校对、可追溯的空间工程量表，并逐步承接校准、差异检查和报价映射。

第一阶段重点不是完整报价系统，而是把 DXF 自动算出的空间面积、墙面计量长度、窗洞扣减、墙面乳胶漆面积等结果校准到稳定可信。

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
- `apps/web/lib/quote-excel.ts`：从报价映射生成可用 Excel 打开的报价草稿 `.xls` HTML。
- `apps/web/lib/default-project.ts`：首页默认方案，当前来自 `server/tests/fixtures/10.dxf` 的稳定解析结果。

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
node --experimental-strip-types apps\web\lib\quantity-health.test.ts
node --experimental-strip-types apps\web\components\quantity-table-columns.test.ts
node --experimental-strip-types apps\web\components\quote-export-risk-details.test.ts
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
- `QUOTE_WALL_TILE`：任意空间的实际贴砖墙面线，用于标记贴砖墙长；厨房、卫生间仍按默认全墙贴砖规则。
- `QUOTE_NEW_WALL`：新砌墙中心线或墙体线，用于新砌墙长度和面积。
- `QUOTE_DEMO_WALL`：拆除墙体中心线或墙体线，用于拆墙长度和面积。
- `QUOTE_BACKGROUND_WALL`：可选背景墙线，用于背景墙面积；不画时背景墙默认为 0，Excel 草稿保留空行让设计师补填。
- `QUOTE_BASE_CABINET`：厨房地柜/台面延米线，用于橱柜地柜长度。
- `QUOTE_WALL_CABINET`：厨房吊柜延米线，用于橱柜吊柜长度。
- `QUOTE_CUSTOM`：非厨房全屋定制柜体投影延米线，用于全屋定制面积；同图层邻近文字可标注 `H=800` 这类柜高；若画成闭合柜体轮廓，系统取最长边作为投影长度，不取周长。
- `QUOTE_EXT_WALL`：建筑外墙外轮廓闭合多段线，用于计算项目级建筑面积；支持 CAD closed 标记，也支持首尾点重合的多段线。
- `QUOTE_TOILET`：可选马桶点位；不画时卫生间默认按 1 个马桶计。
- `QUOTE_BATHROOM_VANITY`：可选浴室柜点位；不画时卫生间默认按 1 套浴室柜计。
- `QUOTE_WINDOW`：窗洞宽度标记，默认参与墙面扣减。
- `QUOTE_DOOR`：门洞宽度标记，普通门默认不扣墙面。
- `QUOTE_TEXT`：空间名称文字；`QUOTE_FLOOR` 可用 `负2楼`、`负1楼`、`1楼`、`2楼` 或 `负二层`、`一层` 等文字给多楼层平铺图纸分层；`QUOTE_HEIGHT`/常见错拼 `OUOTE_HEIGHT` 中邻近窗洞的 `HEIGHT/H/窗高` 标识可作为窗高。
- `QUOTE_OPENING`：开放边界或非墙体边界；与 `QUOTE_WALL` 重叠时从墙面计量长度中排除。
- `QUOTE_VOID`：挑空区域或楼板洞口；推荐用闭合 HATCH 色块，也兼容闭合多段线；每层按实际洞口位置绘制。
- `QUOTE_RAILING`：栏杆、护栏、楼梯扶手线；所在空间为楼梯/楼梯过道时按楼梯扶手换算斜长，其它空间按栏杆/护栏平面长度。
- 图层名兼容常见错拼：`QUQTE_*` 会按对应 `QUOTE_*` 读取，`QUQTE_WINDOM` 和 `QUOTE_WINDOM` 会按 `QUOTE_WINDOW` 读取；规范出图仍应使用标准 `QUOTE_*` 名称。

核心公式：

```text
建筑面积 = 最大闭合 QUOTE_EXT_WALL 多段线面积；closed 标记或首尾点重合都视为闭合，没有闭合外墙轮廓时为 0
地面面积 = QUOTE_ROOM 闭合边界面积 - 地面洞口扣减
顶面面积 = QUOTE_ROOM 闭合边界面积 - 顶面洞口扣减
洞口扣减 = QUOTE_VOID 按楼层关系扣减；同位置跨多层时底层只扣顶面、顶层只扣地面、中间层地面顶面都扣；单层或无法识别楼层时地面顶面都扣
挑空窗帘候选 = 挑空空间窗户所在墙面候选宽度 * 同一 QUOTE_VOID 跨越楼层数量 * 默认层高；只进复核候选，不混入普通窗帘金额
楼梯扶手长度 = 楼梯/楼梯过道内 QUOTE_RAILING 线段按 sqrt(平面长度^2 + 层高^2) 换算；其它空间 QUOTE_RAILING 生成栏杆/护栏平面长度
墙面计量长度 = 与空间关联的 QUOTE_WALL 长度
墙面展开面积 = 墙面计量长度 * 层高
窗洞面积 = 窗宽合计 * 窗高；普通窗宽取线段长度或窗框长边，L 形/转角窗宽取两条非平行有效窗边合计；窗洞邻近文字支持 HEIGHT/H/窗高 标识，没有时默认窗高 1.8m
门洞扣减 = 仅 deduct_from_wall=true 的门洞宽度 * 门高
墙面乳胶漆面积 = (墙面计量长度 + 门洞宽度合计) * 层高 - 窗洞面积 - 门洞扣减 - 贴砖墙面面积；厨房、卫生间默认墙面贴砖时墙面乳胶漆为 0；`QUOTE_WALL` 墙线统计仍只按实际可施工墙面线，门洞长度只在墙面乳胶漆面积公式中临时补回
新砌墙面积 = 与空间关联的 QUOTE_NEW_WALL 逐段长度 * 标注高度；邻近文字支持 HEIGHT/H 和 THICKNESS/厚度 标识，没有高度时默认空间层高；标注厚度约 120mm 时进入“砌120厚砖墙”，标注厚度约 240mm 或其它非 120 厚度时进入“砌240厚砖墙”，没有厚度时进入通用“砌砖墙”
拆墙面积 = 与空间关联的 QUOTE_DEMO_WALL 长度合计 * 层高
厨房地柜长度 = 厨房空间内 QUOTE_BASE_CABINET 延米线长度合计；若画成柜体轮廓，按轮廓面积 ÷ 柜体深度换算投影延米，不按周长累计
厨房吊柜长度 = 厨房空间内 QUOTE_WALL_CABINET 延米线长度合计；若画成柜体轮廓，按轮廓面积 ÷ 柜体深度换算投影延米，不按周长累计
全屋定制面积 = 非厨房空间内 QUOTE_CUSTOM 常规柜投影长度 * 2.6m + 高度低于 1m 的低柜长度；闭合柜体轮廓取最长边，不取周长；邻近文字支持 HEIGHT/H/高度 和 TYPE 标识，当前自动金额主要使用高度，类型留作后续分类扩展
背景墙面积 = 可选 QUOTE_BACKGROUND_WALL 长度 * 标注高度；不画时为 0，Excel 草稿保留背景墙空行
马桶数量 = 卫生间默认 1 个；画了 QUOTE_TOILET 点位时按点位数
浴室柜数量 = 卫生间默认 1 套；画了 QUOTE_BATHROOM_VANITY 点位时按点位数
```

默认参数：

- 项目层高：`2.8m`
- 默认窗高：`1.8m`
- 默认门高：`2.1m`
- DXF 单位换算：默认 `mm -> m`，`unit_scale_to_m = 0.001`

楼层规则：

- 空间名包含 `-` 时，`-` 前作为楼层，例如 `一层-客厅`。
- 空间名没有楼层前缀但图纸有 `QUOTE_FLOOR` 标记时，系统按空间下方最近的楼层标记归属楼层；如果空间名已带楼层前缀，则优先使用空间名前缀；没有 `QUOTE_FLOOR` 时默认显示为 `一层`，不要恢复成 `未分层`。
- 多楼层项目建议明确使用 `负二层`、`负一层`、`一层`、`二层` 等楼层前缀；`QUOTE_VOID` 的跨层扣减和挑空窗帘高度会依赖这些楼层序号。

空间分类：

- 关键词分类在 `server/app/quantity/classification.py`。
- 已覆盖：客厅、餐厅、厨房、卫生间、阳台、卧室、书房、茶室、娱乐室、挑空、衣帽间、储物间、洗衣房、门厅、楼梯过道、楼梯、过道、露台、外墙。常用别名包含：客卧/主卧/次卧/客房 -> 卧室，公卫/客卫/主卫/次卫 -> 卫生间，麻将房/棋牌室/影音室/健身房 -> 娱乐室。
- `电梯井`、`设备井`、`管井`、`风井`、`楼板洞口`、`楼板开洞`、`栏杆`、`护栏`、`开放边`、`开口边` 默认识别但不计价，状态为 `excluded`。楼梯、楼梯过道、露台、挑空仍按可计价空间处理，其中挑空有洞口扣减和挑空窗帘复核候选。

门洞规则：

- `QUOTE_WALL` 墙线应只画实际可施工墙面，门洞位置不画墙线；墙线统计规则不把门洞长度计入 `wall_measure_length_m`。计算墙面乳胶漆面积时，系统会临时把门洞宽度补回墙面基数，再扣除窗洞、`deduct_from_wall=true` 的门洞扣减面积和贴砖墙面面积；厨房、卫生间默认墙面贴砖时墙面乳胶漆为 0。图形校对页点击门洞会同步调整墙面乳胶漆面积。
- 室内门报价不要求设计师额外分图层，系统会自动判断门类型：块名或图层名含 `入户`、`进户`、`防盗`、`entry` 判为入户门；含 `推拉`、`移门`、`sliding` 判为推拉门；无关键词且门宽 `>=1.4m` 判为推拉门；剩余普通门判为室内门。
- 只有判为室内门且 `opening_type=normal_door` 的门洞会生成 `interior_door_count`，且只在厨房、卧室、书房、衣帽间、储物间、洗衣房等房间侧计数；客厅、餐厅、过道、门厅等公共空间不承接室内门数量，避免同一门洞在客厅和房间重复报价。通往卫生间的门自动归为 `bathroom_door`，在卫生间侧生成 `bathroom_door_count`，不计入室内门。默认报价规则“室内门”按樘数生成金额。
- 大洞口门可按规则扣减。
- 疑似大洞口会标记 review_required，并在异常里提示人工确认。
- 入户门、推拉门、大洞口和疑似大洞口不计入 `interior_door_count`；其中入户门按 `entry_door_count` 单独进入报价规则，跨空间门洞若重复归属，需要在校准 JSON 中人工修正。
- 推拉门：厨房、阳台、露台空间中 `quote_category=sliding_door` 的门洞生成 `sliding_door_area_m2 = 门宽 * 门高` 和 `sliding_door_casing_length_m = 门宽 + 2 * 门高`；未标注门高时推拉门默认按 `2.2m`，可通过校准模板修正。报价映射按空间类型命名：厨房生成“厨房推拉门/厨房推拉门双包套”，阳台和露台生成“阳台推拉门/阳台推拉门双包套”。

墙砖与防水规则：

- 厨房、卫生间自动计算 `wall_tile_area_m2`，墙砖高度固定按 `2.5m`，不使用项目默认层高 `2.8m`。
- 墙砖面积公式：厨房为 `max(墙面计量长度 * 2.5 - 大窗洞扣减 - 推拉门洞扣减, 0)`，单个厨房当前按窗洞总面积判断，窗洞面积不超过 `3m2` 时默认不扣减，超过 `3m2` 时扣减窗洞面积；厨房推拉门洞按门宽 * 推拉门高扣减。卫生间为 `max(墙面计量长度 * 2.5 - 窗洞面积, 0)`，默认不扣减门洞。
- 除厨房、卫生间外，任意空间只要画了 `QUOTE_WALL_TILE` 就自动计算墙砖；公式为 `贴砖墙长 * 空间实际层高`，当前不单独扣除未匹配贴砖墙的门窗洞。
- 厨房、卫生间、阳台、露台、洗衣房自动计算 `waterproof_area_m2`。
- 防水面积公式：`地面面积 + 墙面计量长度 * 防水高度`；卫生间防水高度 `1.8m`，其它湿区 `0.3m`。
- 地面瓷砖：`floor_tile_piece_count = ceil(地面面积 * 1.05 / (0.75 * 1.5))`，按 750X1500 规格、5% 损耗、向上取整；默认报价规则“地面瓷砖”按全屋片数汇总生成金额，不按空间拆行。
- 墙面瓷砖：`wall_tile_piece_count = ceil(墙面贴砖面积 * 1.05 / (0.6 * 1.2))`，按 600X1200 规格、5% 损耗、向上取整；默认报价规则“墙面瓷砖”按全屋片数汇总生成金额，不按空间拆行。
- 瓷砖加工费和美缝：默认按项目级 `tile_area_m2` 生成“全屋”清单项；`tile_area_m2 = 可计价空间地面铺砖面积 + 墙面贴砖面积`。瓷砖加工费当前按用户确认口径挂钩贴砖面积生成候选，报价员可按实际加工米数调整。
- 水电默认 scope：`electrical_scope_area_m2` 和 `plumbing_scope_area_m2` 当前仍保留为空间级备用字段，默认等于空间地面面积；商品房整装默认报价规则中的“强电布线”“水路布管”已改用项目级 `building_area_m2` 按建筑面积生成金额，不按空间拆行。点位、回路、特殊水路范围仍可通过校准 JSON 或后续图层细化。
- 全屋灯饰：`lighting_package_count` 是项目级套餐 metric，只要报价映射存在至少一个可计价空间，就生成 1 套“全屋灯饰”；该项目不按空间重复计费。
- 全屋插座开关：`switch_socket_package_count` 是项目级套餐 metric，只要报价映射存在至少一个可计价空间，就生成 1 套“全屋插座开关”；该项目不按空间重复计费。
- 花洒、卫浴五件套：默认按 `bathroom_count` 对每个可计价卫生间生成 1 套候选，不复用 `toilet_count`，避免和马桶/蹲坑选择绑定。
- 工程量表显示 `wall_tile_measure_length_m`，校准模板也会导出 `wall_tile_measure_length_m` 和 `wall_tile_area_m2`。
- 工程量表默认不按空间显示地砖主材片数、强电备用面积、水路备用面积、新砌墙和拆墙字段；这些字段仍保留在校准模板与报价映射中，按全屋汇总生成金额。
- 新砌墙：画在 `QUOTE_NEW_WALL` 的线段会生成 `new_wall_length_m` 和 `new_wall_area_m2`，公式为 `新砌墙逐段长度 * 标注高度`；同图层邻近文字可补 `HEIGHT=1200`、`H=1.2m`、`THICKNESS=240`、`厚度240` 等标识，没有高度时按空间实际层高。报价口径会进一步拆成 `new_wall_unclassified_area_m2`、`new_wall_120_area_m2`、`new_wall_240_area_m2`：未标厚进入通用“砌砖墙”，120mm 进入“砌120厚砖墙”，240mm 或其它非 120 厚度进入“砌240厚砖墙”。
- 拆墙：画在 `QUOTE_DEMO_WALL` 的线段会生成 `demolition_wall_length_m` 和 `demolition_wall_area_m2`，公式为 `拆墙长度 * 空间实际层高`；默认报价规则“拆改及拆墙”按全屋 `demolition_wall_area_m2` 汇总生成金额，不按空间拆行。
- 橱柜：地柜画在 `QUOTE_BASE_CABINET`，吊柜画在 `QUOTE_WALL_CABINET`，分别生成 `kitchen_base_cabinet_length_m` 和 `kitchen_wall_cabinet_length_m`，仅厨房空间计入；默认报价规则“橱柜地柜”和“橱柜吊柜”分别按对应 metric 生成金额。地柜和吊柜在 CAD 中可能重叠，必须分图层，不能用单一橱柜线混算。普通延米线按线长累计；闭合或近似闭合柜体轮廓按 `轮廓面积 ÷ 柜体深度` 换算投影延米，不按周长累计；单独短深度/收口线默认不计入延米。
- 全屋定制：非厨房柜体画在 `QUOTE_CUSTOM`，默认生成 `custom_cabinet_area_m2`，公式为 `常规柜投影长度 * 2.6m`；如果 `QUOTE_CUSTOM` 是闭合柜体轮廓，按最长边取一次投影长度，不把轮廓周长累加。同图层邻近文字可标注柜高，如 `HEIGHT=800`、`H=800`、`高度800` 或 `H=0.8m`，也可保留 `TYPE=衣柜` 这类类型标识供后续分类扩展；高度低于 1m 的低柜按长度米取值，并入同一个 `custom_cabinet_area_m2` 数量，不单独生成低柜字段或报价项；厨房空间默认为 0，避免和橱柜地柜/吊柜重复计费。
- 背景墙：可选画在 `QUOTE_BACKGROUND_WALL`，按背景墙线长 * 标注高度生成 `background_wall_area_m2`，未标注高度时按空间层高；不画时为 0。默认报价规则“背景墙”按全屋汇总生成金额；如果没有自动工程量，Excel 草稿仍保留背景墙空行供设计师补填。
- 洁具：卫生间默认生成 `toilet_count=1` 和 `bathroom_vanity_count=1`，用于“马桶”和“浴室柜”报价；如果画了 `QUOTE_TOILET` 或 `QUOTE_BATHROOM_VANITY` 点位，则按点位数覆盖默认数量。
- 建筑面积：`building_area_m2` 从 `QUOTE_EXT_WALL` 闭合多段线读取，closed 标记或首尾点重合都视为闭合；当前取面积最大的闭合外墙轮廓，写入 API summary、图形校对页和报价映射 summary；它不是每个 `QUOTE_ROOM` 面积的简单求和，暂不混入空间工程量行。
- 窗台石当前仍自动计算 `windowsill_length_m` 作为校准字段；报价草稿改按公共大项“窗台石”套项占位，单价来自真实模板，设计师确认是否报价。
- 窗帘和窗帘箱不能按窗洞宽度计量，应按窗户所在墙面的整面墙宽度；厨房、卫生间、过道等空间默认不做窗帘/窗帘箱。
- `curtain_wall_width_m` 是窗帘墙宽候选取数：客厅、餐厅、卧室、书房有窗时优先识别 L 形窗并按两条非平行长窗边合计；非 L 形窗按窗洞中心线匹配邻近且平行的 `QUOTE_WALL`，取窗户所在墙面的整面墙宽；匹配不到时回退到空间最长一段 `QUOTE_WALL`；其它空间为 `0`。异形窗户按现有窗户长度口径直接计算窗帘候选。`curtain_wall_width_source` 标记来源：`matched_l_shape_window`、`matched_window_wall`、`fallback_longest_wall`、`manual_required_l_shape_window`、`not_applicable` 或前端人工编辑后的 `manual`。前端工程量表可人工校准并随校对快照保存/恢复；来源为 `manual`、`matched_window_wall`、`matched_l_shape_window` 或 `fallback_longest_wall` 且长度大于 0 时，暗窗帘箱直接进入报价规则和金额汇总，不再作为待确认风险。
- 挑空空间不进入普通窗帘/暗窗帘箱金额汇总；如果挑空空间有窗帘候选，报价映射会附带 `atrium_curtain_candidates`，宽度沿用窗户所在墙面候选，高度按同一 `QUOTE_VOID` 跨越楼层数量 * 默认层高汇总，并提示非常规尺寸需设计师复核。
- `QUOTE_OPENING` 与 `QUOTE_WALL` 重叠时会从墙面计量长度中排除；适合开放边界、非墙体边界、挑空边等。
- `QUOTE_RAILING` 在楼梯/楼梯过道空间中生成 `stair_railing_length_m`，按层高换算斜长；在其它空间中生成 `guardrail_length_m`，按平面长度计。默认报价规则包含“楼梯扶手”和“栏杆/护栏”占位单价，方便后续在规则表里改价。

## 前端已实现能力

主工作台支持：

- 上传 DXF 并调用 `8010` 后端解析。
- 上传校准 JSON 并显示“校准通过”或差异卡片。
- 差异卡片可跳转到对应表格行，差异单元格高亮。
- 导出校准模板 JSON，并在页面显示可复制内容；新模板为 `{ summary, rows }` 对象格式，`summary.building_area_m2` 用于校准项目级建筑面积，旧版纯数组行格式仍兼容上传。
- 校准模板包含原始地面面积、地面/顶面洞口后面积、洞口面积、窗台石长度、窗帘墙宽候选、窗帘墙宽来源、挑空窗帘候选、楼梯扶手/栏杆长度、贴砖墙、地砖主材片数、水电施工面积、新砌墙、拆墙、入户门数、室内门数、橱柜地柜长度、橱柜吊柜长度、全屋定制面积、马桶数和浴室柜数指标，便于把人工确认值沉淀进 golden JSON。
- 上传校准 JSON 后，空间行差异和项目级 summary 差异都会显示；如果窗帘墙宽候选存在差异，且当前来源为 `manual_required_l_shape_window` 或 `fallback_longest_wall`，工程量表会提供“应用校准”按钮，把校准值写回当前行、标记为 `manual`，并清除该单元格的当前差异。
- 导出校对快照 JSON；快照包含来源文件、校准文件、summary、comparison、rows、已接受健康检查和 Excel 可选补项数量。
- 导入校对快照 JSON，恢复表格、状态、summary、comparison、来源文件名、已接受健康检查和 Excel 可选补项数量。
- 每行可改 review 状态：待确认、已确认、需修图、不计价。
- SVG 图形 review 可缩放/平移，支持空间改名、门洞扣减切换、窗洞扣减切换、窗高调整。
- 图形 review 和汇总卡会显示 `QUOTE_EXT_WALL` 外墙轮廓与 `building_area_m2` 建筑面积，便于核对项目级建筑面积。
- 页面会显示“算量健康检查”面板，集中提示可计价空间被识别为“其他”、建筑面积为 0、卫生间门/室内门/厨房/阳台/露台推拉门分类异常、入户门疑似重复、厨卫窗洞归属异常、厨房橱柜/全屋定制/卫生间洁具异常、自定义报价规则中集成吊顶单价为 0，以及依赖建筑面积的报价项未进入金额汇总等问题。检查项分 `warning` 和 `info`：高概率影响报价的空间/建筑面积/门窗归属问题为 warning；厨房/阳台/露台推拉门未生成、橱柜缺失、洁具缺失、集成吊顶待补价这类可能需要报价员确认的问题为 info；面板标题会汇总显示需优先处理项和提醒项数量，列表可按“全部 / 需优先处理 / 提醒”筛选，并可导出 Markdown 格式的 CAD 修图清单；涉及具体空间的检查项可一键把对应空间标记为“需修图”或“已确认”。检查项也可“接受此项”，被接受后不再进入当前健康提示、修图清单和报价风险摘要；校对快照会保存这些接受状态，导入后恢复。修图清单会带出涉及空间的当前状态，并提示修图后重新上传 DXF 复核健康检查。筛选只影响面板展示，不影响未接受检查项的修图清单和报价映射健康检查摘要。
- 工程量表不再展示地砖主材片数、强电备用面积、水路备用面积、新砌墙和拆墙等全屋汇总项，避免设计师在每个空间行重复校对；这些字段仍进入校准模板和报价映射。
- 导出报价映射 JSON；默认使用商品房报价表 `整装` 工作表中当前可自动取数的 27 条规则，跳过不计价空间；如果导出时仍有 `warning` 健康检查项、自定义报价规则导致的零单价或建筑面积缺失，页面会弹出草稿报价确认，确认后仍可继续导出。
- 顶部工具栏可直接导出 Excel 报价草稿 `.xls`，也可在报价映射生成后从报价面板再次下载；当前用 Excel 兼容 HTML 表格输出接近真实模板的单张“清单式报价表”，格式以用户调整后的 `10.quote-draft (1).xls` 为准，包含 Excel 命名空间、打印页边距、A4 窄边距打印列宽、9pt 表格字体、合并整行的“工程(预)算表”标题行、地址名称/客户/装修面积/日期信息行、真实模板两层表头，以及“编号 / 项目名称 / 单位 / 数量 / 主材单价 / 辅材单价 / 人工费 / 总价 / 材料及工艺说明”列；“材料费(元)”表头会横跨主材和辅材两列，并写入标题行、章节行、小计行和总计行样式。Excel 草稿固定保留公共大项：全屋拆改工程、其他工程、水电工程、主材项目、全屋定制/橱柜/衣柜/全屋家具、室内门、集成吊顶/卫浴/全屋开关灯饰、其他（窗帘、美缝、窗台石等）；厨房卫生间集成吊顶属于“集成吊顶、卫浴、全屋开关灯饰”公共大项，并在该大项内合并数量和金额。空间类章节按当前方案空间动态生成，命名为“空间名称 + 工程”；如果多个空间同名，会按出现顺序显示为“卧室一工程”“卧室二工程”等，不合并成一个章节。固定公共大项中的同名自动项会合并数量和金额，缺少自动数据来源的项目默认不显示；明确需要设计师选择或补量的项目以 0 数量占位并带出模板三段单价，备注会提示占位行不计入小计。空间类章节只显示该空间实际产生的自动项，同名项在本空间内合并，缺失项不显示。暗窗帘箱属于空间类项目；公共大项里的窗帘按窗帘箱长度合计 * 2 的展开长度自动生成，窗台石按 1 套占位。工作台的“Excel 可选补项”面板只保留导出前需要人工选择或覆盖的少量项：铝合金封门窗，以及按每个可计价卫生间单独选择马桶/蹲坑、淋浴隔断/玻璃淋浴房；铝合金封门窗会按当前可计价空间窗洞面积合计展示建议数量，但默认不计价，只有点击“使用建议”或手动填写后才写入 Excel 草稿。砖墙门窗洞过梁、入户门、阳台推拉门/双包套、窗台石不在该面板确认数量，其中入户门由现有门洞分类自动取数，阳台推拉门/双包套由现有推拉门识别和阳台/露台空间归属自动取数，没有对应门洞时默认为 0。这些录入只影响 Excel 草稿行、小计和总计，不写回报价映射 JSON。每个章节都会输出“小计”，末尾输出“直接费合计”、工程管理费、税金和工程总造价；表尾固定输出编制说明 15 条和客户/设计师/报价员签名栏。风险摘要仅作为表尾备注，方便报价员直接打开、补价和流转。
- 下载/导入报价规则 JSON；导入后报价映射会使用当前规则重新计算金额。
- 工作台会展示当前报价规则单价表，报价员可按真实模板分别编辑主材单价、辅材单价和人工单价；页面会自动汇总为 `unit_price`。报价规则面板按墙顶地/湿区、全屋拆改/其他工程、水电/项目服务、门窗/定制、洁具/灯饰、窗帘/收口分组，分组可展开/收起，也可一键全部展开/收起；折叠状态保存到浏览器本机存储。规则表支持按清单项、取数指标、单位和适用空间筛选，方便在较长规则表中快速改价。编辑后会清空已生成的报价映射和规则 JSON 预览，并自动保存到浏览器本机存储，刷新页面后恢复；重新导出报价映射或 Excel 草稿后使用新的三段价格和汇总单价。报价规则面板可一键恢复默认规则。
- 首页默认打开 `10.dxf` 方案，包含 8 个空间和 `summary.building_area_m2 = 136.24`，用于替代旧的三空间硬编码样例；默认数据维护在 `apps/web/lib/default-project.ts`，源 DXF 保存在 `server/tests/fixtures/10.dxf`。
- 页面会提示商品房整装待补取数口径清单，这些项目暂不参与金额汇总。
- 导出报价映射后会显示窗帘/窗帘箱可报价候选空间数；导出的报价映射 JSON 会附带 `curtain_quote_readiness` 摘要，并把自动候选或人工校准后的暗窗帘箱写入 `curtain_quote_candidates` 候选清单和 `items` 金额汇总。挑空空间另附 `atrium_curtain_candidates` 复核候选，不混入普通窗帘金额。
- 导出报价映射 JSON 会附带 `building_area_quote_readiness` 摘要；如果报价规则中存在 `building_area_m2` 项目但当前建筑面积为 0，页面会提示这些项目未进入金额汇总。
- 导出报价映射 JSON 会附带 `quantity_health_readiness` 摘要，记录当前未接受健康检查的 warning/info 数量和提示文案，便于报价文件流转时保留风险状态。
- 报价映射面板会提前展示导出前风险明细，复用导出确认里的 warning、零单价和建筑面积缺失提示，避免报价员等到点击导出时才看到风险原因。
- 报价映射面板如果发现“厨房卫生间集成吊顶”已有工程量但 `unit_price <= 0`，会额外显示集成吊顶单价待补提醒，提示报价员在报价规则 JSON 中补 `unit_price`；如果实际做石膏板吊顶，则回到工程量表切换顶面类型。该提醒不阻断导出。
- 报价映射面板会单独展示“全屋汇总项”，把地砖主材、强电布线、水路布管、砌墙、拆墙、全屋灯饰等 `space_name="全屋"` 的清单集中列出，避免这些项目从空间工程量表隐藏后不直观。
- 报价映射面板会提示 Excel 草稿的“Excel 可选补项”数量填写情况；这些项目用于报价员补填或按卫生间二选一，不写入报价映射 `items`，也不影响 `summary.total_amount`。Excel 草稿会按固定公共大项输出这些人工项或同名模板项；已自动接入的项目会用自动数量和金额替代占位行，设计师在面板中填写数量或选择卫生间配置时会覆盖 Excel 草稿中的同名行数量并计入 Excel 小计和总计。
- 报价映射面板会显示“报价接入状态清单”，按“已自动取数 / 自动取数，需复核 / 固定占位或设计师手填 / 暂不接入”四类说明当前报价项能力边界；该清单只解释当前导出能力，不改变报价映射金额。
- 窗帘墙宽候选列可在工程量表中直接编辑；编辑后会清空已生成的报价映射，避免沿用旧结果。
- 窗帘墙宽候选列会显示候选来源，`L形窗自动` 代表已按 L 形窗两条非平行长窗边合计，`回退最长墙` 代表未匹配到窗户所在墙面时自动取空间最长墙；`旧版L形窗` 仅兼容旧快照来源，报价员仍可在表格中人工校准。

报价映射默认规则在 `apps/web/lib/quote-mapping.ts`：

- 墙面界面剂处理、墙面批嵌、墙面乳胶漆：按 `latexPaintAreaM2`，仅匹配干区和露台等适用空间；茶室、娱乐室按普通干区接入。
- 厨房、卫生间顶面类型是可校对选项：默认 `ceilingFinishType=integrated`，按“厨房卫生间集成吊顶”候选项输出，默认单价为 260，可在报价规则单价表中修改；人工切换为 `gypsum` 后，按 `ceilingAreaM2` 进入轻钢龙骨平顶、顶面批嵌、顶面乳胶漆。其它干区默认按石膏板/普通顶面处理。
- 地面找平：按 `floorAreaM2`，仅匹配厨房、卫生间、阳台、露台、洗衣房。
- 地面砖铺贴(750X1500)：按 `floorAreaM2`，当前不限制空间类型。
- 地面瓷砖：按 `floorTilePieceCount` 全屋汇总，当前不限制空间类型；片数由地面面积按 750X1500、5% 损耗向上取整。
- 墙面瓷砖：按 `wall_tile_piece_count` 全屋汇总，片数由墙面贴砖面积按 600X1200、5% 损耗向上取整。
- 瓷砖加工费和美缝：按项目级 `tile_area_m2` 全屋汇总；`tile_area_m2 = 可计价空间地面铺砖面积 + 墙面贴砖面积`。瓷砖加工费当前按贴砖面积挂钩生成候选。
- 强电布线：默认按项目级 `building_area_m2` 生成“全屋”清单项；`electrical_scope_area_m2` 仍可通过自定义规则使用。
- 弱电布线：默认按项目级 `building_area_m2` 生成“全屋”清单项。
- 水路布管：默认按项目级 `building_area_m2` 生成“全屋”清单项；`plumbing_scope_area_m2` 仍可通过自定义规则使用。
- 材料搬运费、垃圾清运费、地面砖现场维护费：默认按项目级 `building_area_m2` 生成“全屋”清单项。
- 全屋灯饰：按项目级 `lightingPackageCount=1`，有可计价空间时生成 1 套，不随空间重复。
- 全屋插座开关：按项目级 `switchSocketPackageCount=1`，有可计价空间时生成 1 套，不随空间重复。
- 全屋保洁：按项目级 `cleaningPackageCount=1`，有可计价空间时生成 1 套，不随空间重复。
- 建筑面积：按项目级 `building_area_m2`，从当前 summary 取值生成“全屋”清单项；默认规则不配置具体项目，报价员可在报价规则 JSON 中添加管理费、成品保护、综合服务费等按建筑面积计价的项目。
- 墙面贴瓷砖(600X1200)：按 `wallTileAreaM2`，厨房、卫生间默认全墙计算；其它空间只要画了 `QUOTE_WALL_TILE` 且墙砖面积大于 0 就进入报价。
- 墙地面防漏处理：按 `waterproofAreaM2`，仅匹配厨房、卫生间、阳台、露台、洗衣房。
- 窗台石：Excel 草稿按公共大项“窗台石”套项占位，价格由设计师确认；`windowsillLengthM` 仍保留为校准字段。
- 砌砖墙：画了 `QUOTE_NEW_WALL` 时生成；未标厚的 `newWallUnclassifiedAreaM2` 全屋汇总为“砌砖墙”，标 120mm 的 `newWall120AreaM2` 汇总为“砌120厚砖墙”，标 240mm 或其它非 120 厚度的 `newWall240AreaM2` 汇总为“砌240厚砖墙”。
- 水泥墙开槽、补线/管槽及零星修补：按 `building_area_m2` 全屋汇总生成。
- 打混凝土过梁孔：按 `building_area_m2 * 10%` 生成。
- 厨房、卫生间排污管包隔音棉：按厨房和卫生间数量合计 `* 1.5 * 层高` 生成。
- 窗帘：按可报价窗帘箱长度合计 * 2 计算展开长度，汇总为公共大项“窗帘”，主材单价默认 60，辅材和人工为 0。
- 拆改及拆墙：按 `demolitionWallAreaM2` 全屋汇总，画了 `QUOTE_DEMO_WALL` 时生成。
- 背景墙：按 `backgroundWallAreaM2` 全屋汇总，画了 `QUOTE_BACKGROUND_WALL` 时生成；未画时 Excel 草稿保留空行。
- 室内门：按 `interiorDoorCount`，普通 `QUOTE_DOOR` 门洞生成。
- 入户门、卫生间门、推拉门面积、推拉门门套长度已进入工程量表、校准模板和默认报价规则；默认规则会按空间类型分别生成“入户门”“卫生间门”“厨房推拉门”“厨房推拉门双包套”“阳台推拉门”“阳台推拉门双包套”，单价按真实模板分别为 5000、1200、550、300。
- 橱柜：默认报价规则按项目级 `kitchen_cabinet_length_m = kitchenBaseCabinetLengthM + kitchenWallCabinetLengthM` 汇总为一条“橱柜”，用于匹配真实模板；工程量表和校准模板仍保留地柜、吊柜两个原始指标，方便分别校对。
- 全屋定制：按 `customCabinetAreaM2`，非厨房空间画了 `QUOTE_CUSTOM` 时生成；高度低于 1m 的低柜按长度米并入同一数量。
- 马桶：按 `toiletCount`，卫生间默认 1 个，点位覆盖时按 `QUOTE_TOILET` 数量生成。
- 浴室柜：按 `bathroomVanityCount`，卫生间默认 1 套，点位覆盖时按 `QUOTE_BATHROOM_VANITY` 数量生成。
- 花洒、卫浴五件套：按 `bathroom_count`，每个可计价卫生间默认 1 套，报价员可在 Excel 草稿中调整数量或删除。
- 窗帘墙宽候选 `curtainWallWidthM` 在工程量表展示，自动候选和人工校准值都会导出为 `curtain_quote_candidates` 候选清单；`curtain_wall_width_m` 已属于可导入报价规则 metric，来源为 `manual`、`matched_window_wall`、`matched_l_shape_window` 或 `fallback_longest_wall` 且长度大于 0 时生成暗窗帘箱金额；茶室、娱乐室按普通干区进入窗帘候选。

这些规则只覆盖现有算量口径能稳定承接的自动计价项目，不等于完整整装报价。

报价规则 JSON 是数组格式，字段为：

- `item_name`：清单项名称。
- `metric`：取数指标，当前只允许 `building_area_m2`、`building_area_tenth_count`、`manual_count`、`tile_area_m2`、`curtain_box_length_m`、`cleaning_package_count`、`kitchen_bathroom_pipe_insulation_length_m`、`latex_paint_area_m2`、`floor_area_m2`、`floor_tile_piece_count`、`wall_tile_piece_count`、`electrical_scope_area_m2`、`plumbing_scope_area_m2`、`lighting_package_count`、`switch_socket_package_count`、`ceiling_area_m2`、`wall_tile_area_m2`、`waterproof_area_m2`、`windowsill_length_m`、`new_wall_area_m2`、`new_wall_unclassified_area_m2`、`new_wall_120_area_m2`、`new_wall_240_area_m2`、`demolition_wall_area_m2`、`background_wall_area_m2`、`entry_door_count`、`interior_door_count`、`bathroom_door_count`、`sliding_door_area_m2`、`sliding_door_casing_length_m`、`kitchen_cabinet_length_m`、`kitchen_base_cabinet_length_m`、`kitchen_wall_cabinet_length_m`、`custom_cabinet_area_m2`、`toilet_count`、`bathroom_vanity_count`、`bathroom_count`、`curtain_wall_width_m`。
- `unit`：单位。
- `unit_price`：汇总单价，必须是非负数字；默认规则中等于主材、辅材、人工三段单价合计。
- `material_price` / `auxiliary_price` / `labor_price`：可选三段单价，用于报价规则面板编辑和真实 Excel 模板展示；`unit_price` 仍作为三段单价合计，并用于报价映射金额计算。
- `space_types`：可选，空间类型白名单；填写后只对这些空间类型生成清单项。

当前商品房报价表已整理出一份可导入规则：`quote-rules-apartment-current.json`。它基于商品房报价表的 `整装` 工作表，只包含当前系统能准确承接的面积类项目；`半包` 工作表不读取、不展示、不保留为规则来源。

商品房整装待补取数口径记录在 `apartmentPendingQuoteMetrics()`，只用于页面展示和后续扩展，不混入可导入规则 JSON，也不参与金额汇总。当前已无待补项目；后续扩展重点转为提升各 metric 的精度和可校准性。

## 测试与 fixture

重要 fixture：

- `server/tests/fixtures/test-case.dxf`
- `server/tests/fixtures/test-case-2.dxf`
- `server/tests/fixtures/10.dxf`
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
- 避免扩大范围：完整报价模板、复杂材料库、CAD 插件都不是当前已经完成的能力；当前 Excel 能力只是基于报价映射的草稿清单下载。

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
