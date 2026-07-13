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
- `apps/web/lib/default-project.ts`：测试/开发用 10.dxf 稳定样例数据；首页不再自动加载该样例，默认空白等待上传。

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
Push-Location apps\web
node ..\..\node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 3010
Pop-Location
```

注意：这台机器上曾观察到 `npm`/`npx` 不可用，但仓库已有 `node_modules`，所以常用 `node ..\..\node_modules\next\dist\bin\next ...` 直接运行 Next。前端 dev server 建议从 `apps\web` 目录启动；如果在仓库根目录执行 `next dev apps\web`，在刚跑过 `next build apps\web` 后曾出现页面 HTML 为 200 但 `/_next/static/css/app/layout.css` 和部分 JS chunk 为 404，表现为前端样式丢失。

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

## GitHub 推送注意

本机 PowerShell/Git 直连 GitHub 经常失败，浏览器可访问通常是因为走了系统代理 `127.0.0.1:7888`。本仓库已在 `.git/config` 配置本地代理：

```powershell
git config --local http.proxy http://127.0.0.1:7888
git config --local https.proxy http://127.0.0.1:7888
```

如果普通 `git push origin main` 或 `gh auth git-credential` 静默失败，先清理残留 Git 进程，再用 GitHub CLI token 生成一次性 Basic Authorization header 推送；不要把 token 写入配置文件：

```powershell
Get-Process git,git-remote-https -ErrorAction SilentlyContinue | Stop-Process
$token = gh auth token
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("giwawe:$token"))
$header = "AUTHORIZATION: Basic $basic"
git -c credential.helper= -c http.extraHeader="$header" push origin main
```

推送前后用下面命令核对远端：

```powershell
git ls-remote origin refs/heads/main
gh api repos/giwawe/G-cad-budget-program/git/ref/heads/main --jq '.object.sha'
```

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
- `QUOTE_CAST_SLAB`：现浇钢筋混凝土楼板闭合区域，推荐 HATCH 色块，也兼容闭合多段线，用于计算现浇楼板面积。
- `QUOTE_EDGE_CEILING`：边吊/双眼皮吊顶的单一闭合范围，推荐闭合多段线或 HATCH 色块；按闭合范围面积扣减轻钢龙骨平顶面积，并按闭合范围周长生成边吊计价长度。设计师不允许画内外两圈或环形带状边吊。
- `QUOTE_GYPSUM_LINE_CEILING`：石膏线吊顶的单一闭合范围，推荐闭合多段线或 HATCH 色块；按闭合范围面积扣减轻钢龙骨平顶面积，并按闭合范围周长生成石膏线吊顶计价长度。
- `QUOTE_NO_CEILING`：原顶无吊顶范围，推荐闭合多段线或 HATCH 色块；只扣减轻钢龙骨平顶面积，不影响顶面批嵌和顶面乳胶漆。`QUOTE_EDGE_CEILING`、`QUOTE_GYPSUM_LINE_CEILING` 和 `QUOTE_NO_CEILING` 不能相互重叠，重叠会提示修图，避免重复计价。
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
建筑面积 = 包含可计价房间的所有闭合 QUOTE_EXT_WALL 轮廓面积合计 - 轮廓内 QUOTE_VOID 洞口面积；closed 标记或首尾点重合都视为闭合，没有闭合外墙轮廓时为 0
地面面积 = QUOTE_ROOM 闭合边界面积 - 地面洞口扣减
顶面面积 = QUOTE_ROOM 闭合边界面积 - 顶面洞口扣减
洞口扣减 = QUOTE_VOID 按楼层关系扣减；同位置跨多层时最底层只扣顶面、最高层只扣地面、中间层地面顶面都扣；单层或无法识别楼层时地面顶面都扣；多层同名楼梯间按楼层序号分组，底层未直接画到洞口时会沿用上一层楼梯洞口扣顶面，顶层保留顶面不扣洞口
边吊/双眼皮吊顶面积 = QUOTE_EDGE_CEILING 单一闭合范围面积
边吊/双眼皮吊顶计价长度 = QUOTE_EDGE_CEILING 单一闭合范围周长
石膏线吊顶面积 = QUOTE_GYPSUM_LINE_CEILING 单一闭合范围面积
石膏线吊顶计价长度 = QUOTE_GYPSUM_LINE_CEILING 单一闭合范围周长
原顶无吊顶面积 = QUOTE_NO_CEILING 单一闭合范围面积
轻钢龙骨平顶面积 = max(顶面面积 - 边吊/双眼皮吊顶面积 - 石膏线吊顶面积 - 原顶无吊顶面积, 0)
挑空窗帘候选 = 挑空空间窗户所在墙面候选宽度 * 同一 QUOTE_VOID 跨越楼层数量 * 默认层高；只进复核候选，不混入普通窗帘金额
楼梯扶手长度 = 楼梯/楼梯过道内 QUOTE_RAILING 线段按 sqrt(平面长度^2 + 层高^2) 换算；其它空间 QUOTE_RAILING 生成栏杆/护栏平面长度
墙面计量长度 = 与空间关联的 QUOTE_WALL 长度
墙面展开面积 = 墙面计量长度 * 层高
窗洞面积 = 窗宽合计 * 窗高；普通窗宽取线段长度或窗框长边，L 形/转角窗宽取两条非平行有效窗边合计；窗洞邻近文字支持 HEIGHT/H/窗高 标识，没有时默认窗高 1.8m
门洞扣减 = 仅 deduct_from_wall=true 的门洞宽度 * 门高
墙面乳胶漆面积 = (墙面计量长度 + 门洞宽度合计) * 层高 - 窗洞面积 - 门洞扣减 - 贴砖墙面面积；厨房、卫生间默认墙面贴砖时墙面乳胶漆为 0；`QUOTE_WALL` 墙线统计仍只按实际可施工墙面线，门洞长度只在墙面乳胶漆面积公式中临时补回
新砌墙面积 = 与空间关联的 QUOTE_NEW_WALL 逐段长度 * 标注高度；邻近文字支持 HEIGHT/H 和 THICKNESS/厚度 标识，没有高度时默认空间层高；标注厚度约 120mm 时进入“砌120厚砖墙”，标注厚度约 240mm 或其它非 120 厚度时进入“砌240厚砖墙”，没有厚度时进入通用“砌砖墙”
拆墙面积 = 与空间关联的 QUOTE_DEMO_WALL 长度合计 * 层高
现浇钢筋混凝土楼板面积 = 与空间关联的 QUOTE_CAST_SLAB 闭合面积合计
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
- 空间命名建议使用“楼层-空间名”，例如 `负二层-车库`、`一层-客厅`、`三层-主卧`；同一个 `QUOTE_ROOM` 只能表达一种主要计价性质，客厅、楼梯过道、普通过道、电梯井、挑空、露台等不要合并成一个空间名。不要写 `过道/电梯井`、`客厅/电梯井`、`过道/楼梯间` 这类混合名称，应拆成可计价空间和单独不计价电梯井/管井/挑空等辅助空间，或用 `QUOTE_VOID`、`QUOTE_OPENING` 等辅助图层表达；系统会对混合命名给出健康检查提醒。
- `QUOTE_ROOM` 空间边界必须互不重叠，一个空间不能包含另一个空间；楼梯间或过道不能用外框把电梯井、管井、挑空等辅助区域圈进去。系统不会把内层 `QUOTE_ROOM` 自动从外层空间面积里扣掉，应按实际可计价区域绕开辅助空间，或拆成多个不重叠的闭合空间。

空间分类：

- 关键词分类在 `server/app/quantity/classification.py`。空间类型优先按报价计价口径归类，避免同一计价规则拆成过多类型；无法自动分类的可计价空间可在工程量表手动选择计价空间类型，确实不报价的空间用状态标为“不计价”。
- 已覆盖：客厅、餐厅、厨房、卫生间、阳台、卧室、书房、茶室、娱乐室、挑空、衣帽间、储物间、洗衣房、门厅、楼梯过道、楼梯、过道、露台、外墙。常用别名包含：客卧/主卧/次卧/客房/保姆房 -> 卧室，公卫/客卫/主卫/次卫 -> 卫生间，麻将房/麻将室/棋牌室/影音室/健身房/电竞房/游戏房/多功能房/休闲区 -> 娱乐室，会客厅/家庭厅 -> 客厅，设备间/酒窖/车库 -> 储物间，前院/后院/下沉庭院 -> 露台。
- 独立的 `电梯井`、`设备井`、`管井`、`风井` 以及 `楼板洞口`、`楼板开洞`、`栏杆`、`护栏`、`开放边`、`开口边` 默认识别但不计价，状态为 `excluded`。如果空间名同时包含可计价空间和井道关键词，例如 `客厅/电梯井`，则按可计价空间处理并提示命名需拆分，不因包含 `电梯井` 而整行排除。楼梯、楼梯过道、露台、挑空仍按可计价空间处理，其中挑空有洞口扣减和挑空窗帘复核候选。

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
- 水电默认计价不再按建筑面积直接取数。系统根据空间类型、空间轮廓、门窗、柜体、洁具和楼层信息生成带坐标的水电推荐点位，并按推荐点位估算强电线管、弱电线管、给水管和排水管长度；最终报价表不再额外包一层“水电工程”，而是输出两个公共大项“强弱电工程”和“给排水工程”。强弱电工程包含强电插座、开关、灯位、筒灯/射灯、设备专线、弱电点位、强电线管、弱电线管、强电箱、弱电箱、分配电箱；给排水工程包含给水点、热水点、排水点、给水管、排水管。细分点位来源仍保留在水电复核面板和校对快照中，`electrical_scope_area_m2` 和 `plumbing_scope_area_m2` 仅保留为旧校准字段或自定义规则备用。
- 全屋灯饰：`lighting_package_count` 是项目级套餐 metric，只要报价映射存在至少一个可计价空间，就生成 1 套“全屋灯饰”；默认价格为 0，由设计师输入。
- 全屋插座开关：`switch_socket_package_count` 是项目级套餐 metric，报价表仍显示 1 套；该项保留为项目级套餐，不再按建筑面积折算，不把开关插座点位数量显示在表格中。
- 花洒、卫浴五件套：默认按 `bathroom_count` 对每个可计价卫生间生成 1 套候选，不复用 `toilet_count`，避免和马桶/蹲坑选择绑定。
- 工程量表显示 `wall_tile_measure_length_m`，校准模板也会导出 `wall_tile_measure_length_m` 和 `wall_tile_area_m2`。
- 工程量表默认不按空间显示地砖主材片数、水电推荐点位和管线长度、新砌墙和拆墙字段；地砖、新砌墙、拆墙等仍保留在校准模板与报价映射中，水电推荐点位和管线长度保存在校对快照的 `hydropower` 字段，并按水电复核结果生成报价金额或长度结果。
- 新砌墙：画在 `QUOTE_NEW_WALL` 的线段会生成 `new_wall_length_m` 和 `new_wall_area_m2`，公式为 `新砌墙逐段长度 * 标注高度`；同图层邻近文字可补 `HEIGHT=1200`、`H=1.2m`、`THICKNESS=240`、`厚度240` 等标识，没有高度时按空间实际层高。报价口径会进一步拆成 `new_wall_unclassified_area_m2`、`new_wall_120_area_m2`、`new_wall_240_area_m2`：未标厚进入通用“砌砖墙”，120mm 进入“砌120厚砖墙”，240mm 或其它非 120 厚度进入“砌240厚砖墙”。
- 拆墙：画在 `QUOTE_DEMO_WALL` 的线段会生成 `demolition_wall_length_m` 和 `demolition_wall_area_m2`，公式为 `拆墙长度 * 空间实际层高`；默认报价规则“拆改及拆墙”按全屋 `demolition_wall_area_m2` 汇总生成金额，不按空间拆行。
- 现浇钢筋混凝土楼板：画在 `QUOTE_CAST_SLAB` 的闭合 HATCH 或闭合多段线会生成 `cast_slab_area_m2`，按所在空间归属面积并在报价规则中全屋汇总为“现浇钢筋混凝土楼板”，默认单价为 0，供报价员核定。
- 橱柜：地柜画在 `QUOTE_BASE_CABINET`，吊柜画在 `QUOTE_WALL_CABINET`，分别生成 `kitchen_base_cabinet_length_m` 和 `kitchen_wall_cabinet_length_m`，仅厨房空间计入；默认报价规则“橱柜地柜”和“橱柜吊柜”分别按对应 metric 生成金额。地柜和吊柜在 CAD 中可能重叠，必须分图层，不能用单一橱柜线混算。普通延米线按线长累计；闭合或近似闭合柜体轮廓按 `轮廓面积 ÷ 柜体深度` 换算投影延米，不按周长累计；单独短深度/收口线默认不计入延米。
- 全屋定制：非厨房柜体画在 `QUOTE_CUSTOM`，默认生成 `custom_cabinet_area_m2`，公式为 `常规柜投影长度 * 2.6m`；如果 `QUOTE_CUSTOM` 是闭合柜体轮廓，按最长边取一次投影长度，不把轮廓周长累加。同图层邻近文字可标注柜高，如 `HEIGHT=800`、`H=800`、`高度800` 或 `H=0.8m`，也可保留 `TYPE=衣柜` 这类类型标识供后续分类扩展；高度低于 1m 的低柜按长度米取值，并入同一个 `custom_cabinet_area_m2` 数量，不单独生成低柜字段或报价项；厨房空间默认为 0，避免和橱柜地柜/吊柜重复计费。
- 背景墙：可选画在 `QUOTE_BACKGROUND_WALL`，按背景墙线长 * 标注高度生成 `background_wall_area_m2`，未标注高度时按空间层高；不画时为 0。默认报价规则“背景墙”按全屋汇总生成金额；如果没有自动工程量，Excel 草稿仍保留背景墙空行供设计师补填。
- 洁具：卫生间默认生成 `toilet_count=1` 和 `bathroom_vanity_count=1`，用于“马桶”和“浴室柜”报价；如果画了 `QUOTE_TOILET` 或 `QUOTE_BATHROOM_VANITY` 点位，则按点位数覆盖默认数量。
- 建筑面积：`building_area_m2` 从 `QUOTE_EXT_WALL` 闭合多段线读取，closed 标记或首尾点重合都视为闭合；当前合计包含可计价房间的所有闭合外墙轮廓面积，并扣除对应 `QUOTE_VOID` 楼梯/挑空等洞口面积，写入 API summary、图形校对页和报价映射 summary；它不是每个 `QUOTE_ROOM` 面积的简单求和，暂不混入空间工程量行。
- 顶面吊顶：`ceiling_area_m2` 仍作为顶面批嵌和顶面乳胶漆基数；画了 `QUOTE_EDGE_CEILING`、`QUOTE_GYPSUM_LINE_CEILING`、`QUOTE_NO_CEILING` 后，系统生成 `edge_ceiling_area_m2`、`edge_ceiling_length_m`、`gypsum_line_ceiling_area_m2`、`gypsum_line_ceiling_length_m`、`no_ceiling_area_m2` 和 `gypsum_flat_ceiling_area_m2 = max(ceiling_area_m2 - edge_ceiling_area_m2 - gypsum_line_ceiling_area_m2 - no_ceiling_area_m2, 0)`。默认报价规则“轻钢龙骨平顶”使用 `gypsum_flat_ceiling_area_m2`，“双眼皮/边吊吊顶”使用 `edge_ceiling_length_m`，默认 80/M（主材 35、辅材 15、人工 30），“石膏线吊顶”使用 `gypsum_line_ceiling_length_m`，默认 35/M（主材 12、辅材 5、人工 18）；厨房、卫生间只有切换为石膏板吊顶时才进入这些石膏板/边吊/石膏线规则。
- 窗台石当前仍自动计算 `windowsill_length_m` 作为校准字段；报价草稿中公共大项“窗台石”按窗户实际长度自动生成材料项，默认主材单价 65/M；空间工程中另按窗户长度自动生成“窗台石铺贴”安装项，厨房、卫生间因瓷砖上墙不生成窗台石和窗台石铺贴，二者不冲突。
- 窗帘和窗帘箱不能按窗洞宽度计量，应按窗户所在墙面的整面墙宽度；厨房、卫生间、过道等空间默认不做窗帘/窗帘箱。
- `curtain_wall_width_m` 是窗帘墙宽候选取数：客厅、餐厅、卧室、书房有窗时优先识别 L 形窗并按两条非平行长窗边合计；非 L 形窗按窗洞中心线匹配邻近且平行的 `QUOTE_WALL`，取窗户所在墙面的整面墙宽；匹配不到时回退到空间最长一段 `QUOTE_WALL`；其它空间为 `0`。异形窗户按现有窗户长度口径直接计算窗帘候选。`curtain_wall_width_source` 标记来源：`matched_l_shape_window`、`matched_window_wall`、`fallback_longest_wall`、`manual_required_l_shape_window`、`not_applicable` 或前端人工编辑后的 `manual`。前端工程量表可人工校准并随校对快照保存/恢复；来源为 `manual`、`matched_window_wall`、`matched_l_shape_window` 或 `fallback_longest_wall` 且长度大于 0 时，暗窗帘箱直接进入报价规则和金额汇总，不再作为待确认风险。
- 挑空空间不进入普通窗帘/暗窗帘箱金额汇总；如果挑空空间有窗帘候选，报价映射会附带 `atrium_curtain_candidates`，宽度沿用窗户所在墙面候选，高度按同一 `QUOTE_VOID` 跨越楼层数量 * 默认层高汇总，并提示非常规尺寸需设计师复核。
- `QUOTE_OPENING` 与 `QUOTE_WALL` 重叠时会从墙面计量长度中排除；适合开放边界、非墙体边界、挑空边等。
- `QUOTE_RAILING` 在楼梯/楼梯过道空间中生成 `stair_railing_length_m`，按层高换算斜长；在其它空间中生成 `guardrail_length_m`，按平面长度计。楼梯或楼梯过道空间会按 `floor(层高 / 0.17m)` 取向下奇数生成 `stair_tread_count`，用于“楼梯踏步铺贴”；如果旧图纸把楼梯洞混入 `过道/电梯井` 等可计价空间名，报价映射会按洞口保底生成楼梯踏步并通过健康检查提示命名需拆分。默认报价规则包含“楼梯扶手”“楼梯踏步铺贴”和“栏杆/护栏”，方便后续在规则表里改价。

## 前端已实现能力

主工作台支持：

- 上传 DXF 并调用 `8010` 后端解析。
- 上传校准 JSON 并显示“校准通过”或差异卡片。
- 差异卡片可跳转到对应表格行，差异单元格高亮。
- 导出校准模板 JSON，并在页面显示可复制内容；新模板为 `{ summary, rows }` 对象格式，`summary.building_area_m2` 用于校准项目级建筑面积，旧版纯数组行格式仍兼容上传。
- 校准模板包含原始地面面积、地面/顶面洞口后面积、洞口面积、窗台石长度、窗帘墙宽候选、窗帘墙宽来源、挑空窗帘候选、楼梯扶手/栏杆长度、贴砖墙、地砖主材片数、水电施工面积、新砌墙、拆墙、入户门数、室内门数、橱柜地柜长度、橱柜吊柜长度、全屋定制面积、马桶数和浴室柜数指标，便于把人工确认值沉淀进 golden JSON。
- 上传校准 JSON 后，空间行差异和项目级 summary 差异都会显示；如果窗帘墙宽候选存在差异，且当前来源为 `manual_required_l_shape_window` 或 `fallback_longest_wall`，工程量表会提供“应用校准”按钮，把校准值写回当前行、标记为 `manual`，并清除该单元格的当前差异。
- 导出校对快照 JSON；快照包含来源文件、校准文件、summary、comparison、rows、已接受健康检查、方案报价可选项数量和本次手动单价。
- 导入校对快照 JSON，恢复表格、状态、summary、comparison、来源文件名、已接受健康检查、方案报价可选项数量和本次手动单价。
- 每行可改 review 状态：待确认、已确认、需修图、不计价。
- SVG 图形 review 可缩放/平移，支持空间改名、门洞扣减切换、窗洞扣减切换、窗高调整。
- 图形 review 和汇总卡会显示 `QUOTE_EXT_WALL` 外墙轮廓与 `building_area_m2` 建筑面积，便于核对项目级建筑面积。
- 页面会显示“算量健康检查”面板，集中提示可计价空间被识别为“其他”、建筑面积为 0、卫生间门/厨房/阳台/露台推拉门分类异常、入户门疑似重复、厨卫窗洞归属异常、厨房橱柜/全屋定制/卫生间洁具异常、水电推荐点位或管线长度缺少坐标或低置信度、自定义报价规则中集成吊顶单价为 0、旧水电面积报价规则仍在使用，以及依赖建筑面积的报价项未进入金额汇总等问题。卧室套房存在多个室内门属于正常场景，不再作为健康检查提醒。检查项分 `warning` 和 `info`：高概率影响报价的空间/建筑面积/门窗归属、旧水电面积报价规则问题为 warning；厨房/阳台/露台推拉门未生成、橱柜缺失、洁具缺失、水电推荐点位待复核、集成吊顶待补价这类可能需要报价员确认的问题为 info；面板标题会汇总显示需优先处理项和提醒项数量，列表可按“全部 / 需优先处理 / 提醒”筛选，并可导出 Markdown 格式的 CAD 修图清单；涉及具体空间的检查项可一键把对应空间标记为“需修图”或“已确认”。检查项也可“接受此项”，被接受后不再进入当前健康提示、修图清单和报价风险摘要；校对快照会保存这些接受状态，导入后恢复。修图清单会带出涉及空间的当前状态，并提示修图后重新上传 DXF 复核健康检查。筛选只影响面板展示，不影响未接受检查项的修图清单和报价映射健康检查摘要。
- 工程量表不再展示地砖主材片数、强电备用面积、水路备用面积、新砌墙和拆墙等全屋汇总项，避免设计师在每个空间行重复校对；这些字段仍进入校准模板和报价映射。
- 空间工程量前台默认是可折叠摘要卡片，按楼层从低到高展示：负二层、负一层、一层、二层、三层，同楼层保持解析顺序；有异常提示时自动展开，设计师可在卡片中确认空间、标记需修图/不计价、修正计价类型、切换厨卫顶面类型和校准窗帘墙宽。完整明细表不再放在设计师前台，后续如需要应放后台/管理端。
- 空间工程量摘要支持手动修正空间类型；改类型后会清空旧报价映射、水电估算和校准差异，后续导出报价映射、Excel 草稿和校对快照都会使用修正后的空间类型。厨房、卫生间切换会同步恢复默认集成吊顶口径，其它空间默认石膏板顶面口径。
- 顶部工具栏可下载空间命名规范 Markdown，给设计师说明一个 `QUOTE_ROOM` 只表达一种主要计价性质，避免 `过道/电梯井`、`客厅/楼梯过道` 这类混合命名导致报价口径不稳定。
- 导出报价映射 JSON；报价规则单价统一维护，导出时可选择“硬装（半包）”“整装（全包）”或“硬装 + 自选增项包”。硬装模式只输出施工和基础硬装项；整装模式输出全部已接入项目；自选增项包按 Excel 报价表公共大项组织，可叠加“主材项目”“全屋定制、衣柜、橱柜、全屋家具”“室内门”“集成吊顶、卫浴、全屋开关灯饰”“其他（窗帘、美缝、窗台石等）”等大项，也可只选择大项下的部分小项。当前选择会同时影响报价映射 JSON 和 Excel 草稿，并写入校对快照；导入快照后恢复。导出时仍有 `warning` 健康检查项、自定义报价规则导致的零单价或建筑面积缺失时，页面会弹出草稿报价确认，确认后仍可继续导出。
- 顶部工具栏可直接导出 Excel 报价草稿 `.xls`，按钮会显示当前预算模式（如“预算导出：硬装（半包）”），也可在报价映射生成后从报价面板再次下载；当前用 Excel 兼容 HTML 表格输出接近真实模板的单张“清单式报价表”，格式以用户调整后的 `10.quote-draft (1).xls` 为准，包含 Excel 命名空间、打印页边距、A4 窄边距打印列宽、9pt 表格字体、合并整行的“工程(预)算表”标题行、地址名称/客户/装修面积/日期信息行、真实模板两层表头，以及“编号 / 项目名称 / 单位 / 数量 / 主材单价 / 辅材单价 / 人工费 / 总价 / 材料及工艺说明”列；“材料费(元)”表头会横跨主材和辅材两列，并写入标题行、章节行、小计行和总计行样式。Excel 草稿第一项固定为全屋拆改工程，随后输出空间类章节，最后按固定顺序输出其他工程、强弱电工程、给排水工程、主材项目、全屋定制/橱柜/衣柜/全屋家具、室内门、集成吊顶/卫浴/全屋开关灯饰、其他（窗帘、美缝、窗台石等）；厨房卫生间集成吊顶属于“集成吊顶、卫浴、全屋开关灯饰”公共大项，并在该大项内合并数量和金额。商品房单楼层空间类章节按“空间名称 + 工程”命名，多个同名空间显示为“卧室一工程”“卧室二工程”；别墅、复式等多楼层项目按“楼层 + 空间名称 + 工程”命名，并按负二层、负一层、一层、二层等楼层顺序输出，同层保持解析顺序；同层重名空间显示为“一层卧室工程一”“一层卧室工程二”，卫生间按楼层汇总为“一层卫生间、盥洗区工程”。固定公共大项中的同名自动项会合并数量和金额，缺少自动数据来源的项目默认不显示；明确需要设计师选择或补量的项目以 0 数量占位并带出模板三段单价，备注会提示占位行不计入小计。空间类章节只显示该空间实际产生的自动项，同名项在本空间内合并，缺失项不显示。暗窗帘箱、窗台石铺贴、楼梯踏步铺贴、淋浴隔断安装属于空间类项目；公共大项里的窗帘按窗帘箱长度合计 * 2 的展开长度自动生成，窗台石按窗户实际长度自动生成。工作台的“方案报价可选项”面板只保留导出前需要人工选择或覆盖的少量项：铝合金封门窗，以及按每个可计价卫生间单独选择马桶/蹲坑、淋浴隔断/玻璃淋浴房；淋浴隔断或玻璃淋浴房选中后会在对应卫生间章节生成“淋浴隔断安装”。铝合金封门窗会按当前可计价空间窗洞面积合计展示建议数量和可编辑本次单价，默认不计价，只有点击“加入建议面积”或手动填写后才写入 Excel 草稿；单价空着时沿用报价规则，手动填写后只影响本次预算导出和校对快照，不改全局报价规则。砖墙门窗洞过梁不自动取数；入户门、阳台推拉门/双包套、窗台石不在该面板确认数量，分别由门洞分类、阳台/露台推拉门归属和窗户长度自动取数。这些录入只影响 Excel 草稿行、小计和总计，不写回报价映射 JSON。每个清单小项的总价使用 `数量 * (主材单价 + 辅材单价 + 人工费)` Excel 公式；每个章节“小计”、直接费合计、工程管理费、税金和工程总造价也使用 Excel 公式，便于报价员打开草稿后人工调整数量或单价并自动重算。表尾固定输出编制说明 15 条和客户/设计师/报价员签名栏。风险摘要仅作为表尾备注，方便报价员直接打开、补价和流转。
- Excel 草稿的“材料及工艺说明”列必须使用客户可读的材料和施工工艺说明，不写 `QUOTE_*` 图层名、默认单价、待核定、设计师确认等内部系统话术。
- 下载/导入报价规则 JSON；导入后报价映射会使用当前规则重新计算金额。
- 工作台会展示当前报价规则单价表，报价员可按真实模板分别编辑主材单价、辅材单价和人工单价；页面会自动汇总为 `unit_price`。报价规则面板按墙顶地/湿区、全屋拆改/其他工程、水电/项目服务、门窗/定制、洁具/灯饰、窗帘/收口分组，分组可展开/收起，也可一键全部展开/收起；折叠状态保存到浏览器本机存储。规则表支持按清单项、取数指标、单位和适用空间筛选，方便在较长规则表中快速改价。编辑后会清空已生成的报价映射和规则 JSON 预览，并自动保存到浏览器本机存储，刷新页面后恢复；重新导出报价映射或 Excel 草稿后使用新的三段价格和汇总单价。报价规则面板可一键恢复默认规则。
- `tools/export_quote_rule_check_xlsx.py` 可从 `quote-rules-apartment-current.json` 导出桌面 `报价规则单价核对表.xlsx`；`tools/sync_quote_rule_prices_from_xlsx.py` 可把核对表里的主材/辅材/人工同步回默认规则 JSON 和 `apps/web/lib/quote-mapping.ts`。同步后需提高 `DEFAULT_QUOTE_RULES_STORAGE_VERSION`，避免浏览器继续使用旧本机缓存。
- `tools/real-drawing-regression.mjs` 可批量回归桌面 5 张真实 DXF，复用后端解析、前端水电估算、报价映射和 Excel 模板，输出三种报价模式 Excel、`real-drawing-regression-report.md` 和每张图纸的修图清单。运行命令：`node --experimental-strip-types tools\real-drawing-regression.mjs`；详细参数见 `docs/real-drawing-regression.md`。
- 首页默认空白，不自动加载任何示例方案；`apps/web/lib/default-project.ts` 仅保留为测试和开发夹具，源 DXF 保存在 `server/tests/fixtures/10.dxf`。
- 页面会提示商品房整装待补取数口径清单，这些项目暂不参与金额汇总。
- 导出报价映射后会显示窗帘/窗帘箱可报价候选空间数；导出的报价映射 JSON 会附带 `curtain_quote_readiness` 摘要，并把自动候选或人工校准后的暗窗帘箱写入 `curtain_quote_candidates` 候选清单和 `items` 金额汇总。挑空空间另附 `atrium_curtain_candidates` 复核候选，不混入普通窗帘金额。
- 导出报价映射 JSON 会附带 `building_area_quote_readiness` 摘要；如果报价规则中存在 `building_area_m2` 项目但当前建筑面积为 0，页面会提示这些项目未进入金额汇总。
- 导出报价映射 JSON 会附带 `quantity_health_readiness` 摘要，记录当前未接受健康检查的 warning/info 数量和提示文案，便于报价文件流转时保留风险状态。
- 报价映射面板会提前展示导出前风险明细，复用导出确认里的 warning、零单价和水电推荐点位缺失提示，避免报价员等到点击导出时才看到风险原因。
- 报价映射面板如果发现“厨房卫生间集成吊顶”已有工程量但 `unit_price <= 0`，会额外显示集成吊顶单价待补提醒，提示报价员在报价规则 JSON 中补 `unit_price`；如果实际做石膏板吊顶，则回到工程量表切换顶面类型。该提醒不阻断导出。
- 报价映射面板会单独展示“全屋汇总项”，把地砖主材、砌墙、拆墙、全屋灯饰等 `space_name="全屋"` 的清单集中列出，避免这些项目从空间工程量表隐藏后不直观。
- 报价映射面板会提示 Excel 草稿的“方案报价可选项”数量填写情况；这些项目用于报价员补填或按卫生间二选一，不写入报价映射 `items`，也不影响 `summary.total_amount`。Excel 草稿会按固定公共大项输出这些人工项或同名模板项；已自动接入的项目会用自动数量和金额替代占位行，设计师在面板中填写数量或选择卫生间配置时会覆盖 Excel 草稿中的同名行数量并计入 Excel 小计和总计。
- 报价映射面板会显示“报价接入状态清单”，按“已自动取数 / 自动取数，需复核 / 固定占位或设计师手填 / 暂不接入”四类说明当前报价项能力边界；该清单只解释当前导出能力，不改变报价映射金额。
- 窗帘墙宽候选列可在工程量表中直接编辑；编辑后会清空已生成的报价映射，避免沿用旧结果。
- 窗帘墙宽候选列会显示候选来源，`L形窗自动` 代表已按 L 形窗两条非平行长窗边合计，`回退最长墙` 代表未匹配到窗户所在墙面时自动取空间最长墙；`旧版L形窗` 仅兼容旧快照来源，报价员仍可在表格中人工校准。

报价映射默认规则在 `apps/web/lib/quote-mapping.ts`：

- 墙面界面剂处理、墙面批嵌、墙面乳胶漆：按 `latexPaintAreaM2`，仅匹配干区、楼梯、挑空和露台等适用空间；茶室、娱乐室、楼梯、挑空按普通干区接入，其中挑空仍不混入普通窗帘/暗窗帘箱金额。
- 厨房、卫生间顶面类型是可校对选项：默认 `ceilingFinishType=integrated`，按“厨房卫生间集成吊顶”候选项输出，默认单价为 120，可在报价规则单价表中修改；人工切换为 `gypsum` 后，按 `ceilingAreaM2` 进入轻钢龙骨平顶、顶面批嵌、顶面乳胶漆。其它干区默认按石膏板/普通顶面处理；露台默认视为露天空间，不生成顶面吊顶、顶面批嵌和顶面乳胶漆，即使旧本机报价规则仍把露台写入顶面规则，映射时也会硬性排除露台顶面项。
- 地面找平：按 `floorAreaM2`，仅匹配厨房、卫生间、阳台、露台、洗衣房。
- 地面砖铺贴(750X1500)：按 `floorAreaM2`，当前不限制空间类型。
- 地面瓷砖：按 `floorTilePieceCount` 全屋汇总，当前不限制空间类型；片数由地面面积按 750X1500、5% 损耗向上取整。
- 墙面瓷砖：按 `wall_tile_piece_count` 全屋汇总，片数由墙面贴砖面积按 600X1200、5% 损耗向上取整。
- 瓷砖加工费和美缝：按项目级 `tile_area_m2` 全屋汇总；`tile_area_m2 = 可计价空间地面铺砖面积 + 墙面贴砖面积`。瓷砖加工费当前按贴砖面积挂钩生成候选。
- 水电推荐点位：复核面板保留开关点位、各类插座、灯位、弱电点位、空调/设备专线、冷热水、排水和地漏等细分来源；报价规则默认使用汇总 metric 进入最终报价：`hydropower_strong_outlet_count` 汇总强电插座，`hydropower_switch_count` 汇总开关，`hydropower_light_count` 汇总灯位，`hydropower_downlight_spotlight_count` 预留筒灯/射灯，`hydropower_equipment_circuit_count` 汇总空调和设备专线，`hydropower_weak_point_count` 汇总弱电点位，`hydropower_water_supply_point_count`、`hydropower_hot_water_point_count`、`hydropower_drainage_point_count` 分别汇总给水点、热水点和排水点；强电线管、弱电线管、给水管、排水管按对应长度 metric 进入报价。灯带、回水管、户外给水和户外排水当前不列入默认报价。
- 材料搬运费、垃圾清运费、墙地面现场保护：默认按项目级 `building_area_m2` 生成“全屋”清单项。
- 全屋灯饰：按项目级 `lightingPackageCount=1`，有可计价空间时生成 1 套，不随空间重复；默认价格为 0。
- 全屋插座开关：按项目级 `switchSocketPackageCount=1`，有可计价空间时生成 1 套；该项保留为项目级套餐，不再按建筑面积折算，不随空间重复。
- 全屋保洁：按项目级 `cleaningPackageCount=1`，有可计价空间时生成 1 套，不随空间重复；默认价格为 0。
- 建筑面积：按项目级 `building_area_m2`，从当前 summary 取值生成“全屋”清单项；默认规则不配置具体项目，报价员可在报价规则 JSON 中添加管理费、成品保护、综合服务费等按建筑面积计价的项目。
- 墙面贴瓷砖(600X1200)：按 `wallTileAreaM2`，厨房、卫生间默认全墙计算；其它空间只要画了 `QUOTE_WALL_TILE` 且墙砖面积大于 0 就进入报价。
- 墙地面防漏处理：按 `waterproofAreaM2`，仅匹配厨房、卫生间、阳台、露台、洗衣房。
- 窗台石：公共大项“窗台石”按 `windowsillLengthM` 自动生成材料项，默认主材单价 65/M；空间工程中“窗台石铺贴”按 `windowsillLengthM` 自动生成安装项，厨房、卫生间不生成窗台石和窗台石铺贴。
- 砌砖墙：画了 `QUOTE_NEW_WALL` 时生成；未标厚的 `newWallUnclassifiedAreaM2` 全屋汇总为“砌砖墙”，标 120mm 的 `newWall120AreaM2` 汇总为“砌120厚砖墙”，标 240mm 或其它非 120 厚度的 `newWall240AreaM2` 汇总为“砌240厚砖墙”。
- 现浇钢筋混凝土楼板：画了 `QUOTE_CAST_SLAB` 时生成；闭合区域面积汇总为“现浇钢筋混凝土楼板”，默认单价为 0。
- 水泥墙开槽、补线/管槽及零星修补：按 `building_area_m2` 全屋汇总生成。
- 打混凝土过梁孔：按 `building_area_m2 * 10%` 生成。
- 厨房、卫生间排污管包隔音棉：按厨房和卫生间数量合计 `* 1.5 * 层高` 生成。
- 窗帘：按可报价窗帘箱长度合计 * 2 计算展开长度，汇总为公共大项“窗帘”，默认主材 50、辅材 20、人工 0。
- 拆改及拆墙：按 `demolitionWallAreaM2` 全屋汇总，画了 `QUOTE_DEMO_WALL` 时生成。
- 背景墙：按 `backgroundWallAreaM2` 全屋汇总，画了 `QUOTE_BACKGROUND_WALL` 时生成；未画时 Excel 草稿保留空行。
- 室内门：按 `interiorDoorCount`，普通 `QUOTE_DOOR` 门洞生成。
- 入户门、卫生间门、推拉门面积、推拉门门套长度已进入工程量表、校准模板和默认报价规则；默认规则会按空间类型分别生成“入户门”“卫生间门”“厨房推拉门”“厨房推拉门双包套”“阳台推拉门”“阳台推拉门双包套”，单价按当前核定默认规则分别为 2500、900、400、110。
- 橱柜：默认报价规则按项目级 `kitchen_cabinet_length_m = kitchenBaseCabinetLengthM + kitchenWallCabinetLengthM` 汇总为一条“橱柜”，用于匹配真实模板；工程量表和校准模板仍保留地柜、吊柜两个原始指标，方便分别校对。
- 全屋定制：按 `customCabinetAreaM2`，非厨房空间画了 `QUOTE_CUSTOM` 时生成；高度低于 1m 的低柜按长度米并入同一数量。
- 马桶：按 `toiletCount`，卫生间默认 1 个，点位覆盖时按 `QUOTE_TOILET` 数量生成。
- 浴室柜：按 `bathroomVanityCount`，卫生间默认 1 套，点位覆盖时按 `QUOTE_BATHROOM_VANITY` 数量生成。
- 花洒、卫浴五件套：按 `bathroom_count`，每个可计价卫生间默认 1 套，报价员可在 Excel 草稿中调整数量或删除。
- 淋浴隔断安装：方案报价可选项中每个卫生间默认按淋浴隔断生成并计入草稿；如果设计师改选玻璃淋浴房，安装数量仍按对应卫生间或楼层卫生间汇总。
- 楼梯扶手：按 `stairRailingLengthM` 生成，默认主材单价 480；Excel 草稿归入公共大项“其他（窗帘、美缝、窗台石等）”。
- 楼梯踏步铺贴：楼梯/楼梯过道按 `stair_tread_count = floor(层高 / 0.17m)` 再向下取奇数生成，单位为步。
- 窗帘墙宽候选 `curtainWallWidthM` 在工程量表展示，自动候选和人工校准值都会导出为 `curtain_quote_candidates` 候选清单；`curtain_wall_width_m` 已属于可导入报价规则 metric，来源为 `manual`、`matched_window_wall`、`matched_l_shape_window` 或 `fallback_longest_wall` 且长度大于 0 时生成暗窗帘箱金额；茶室、娱乐室按普通干区进入窗帘候选。

这些规则只覆盖现有算量口径能稳定承接的自动计价项目，不等于完整整装报价。

报价规则 JSON 是数组格式，字段为：

- `item_name`：清单项名称。
- `metric`：取数指标，当前只允许 `building_area_m2`、`building_area_tenth_count`、`manual_count`、`tile_area_m2`、`curtain_box_length_m`、`cleaning_package_count`、`kitchen_bathroom_pipe_insulation_length_m`、`latex_paint_area_m2`、`floor_area_m2`、`floor_tile_piece_count`、`wall_tile_piece_count`、`electrical_scope_area_m2`、`plumbing_scope_area_m2`、`lighting_package_count`、`switch_socket_package_count`、`ceiling_area_m2`、`gypsum_flat_ceiling_area_m2`、`edge_ceiling_length_m`、`gypsum_line_ceiling_length_m`、`wall_tile_area_m2`、`waterproof_area_m2`、`windowsill_length_m`、`new_wall_area_m2`、`new_wall_unclassified_area_m2`、`new_wall_120_area_m2`、`new_wall_240_area_m2`、`demolition_wall_area_m2`、`background_wall_area_m2`、`cast_slab_area_m2`、`entry_door_count`、`interior_door_count`、`bathroom_door_count`、`sliding_door_area_m2`、`sliding_door_casing_length_m`、`stair_railing_length_m`、`guardrail_length_m`、`stair_tread_count`、`kitchen_cabinet_length_m`、`kitchen_base_cabinet_length_m`、`kitchen_wall_cabinet_length_m`、`custom_cabinet_area_m2`、`toilet_count`、`bathroom_vanity_count`、`bathroom_count`、`curtain_wall_width_m`。另外，水电报价汇总 metric 包括 `hydropower_strong_outlet_count`、`hydropower_switch_count`、`hydropower_light_count`、`hydropower_downlight_spotlight_count`、`hydropower_equipment_circuit_count`、`hydropower_strong_box_count`、`hydropower_weak_box_count`、`hydropower_distribution_box_count`、`hydropower_water_supply_point_count`、`hydropower_drainage_point_count`；水电细分来源 metric 仍兼容 `hydropower_switch_point_count`、`hydropower_standard_outlet_count`、`hydropower_sofa_charging_outlet_count`、`hydropower_heating_outlet_count`、`hydropower_bed_end_fan_outlet_count`、`hydropower_kitchen_counter_outlet_count`、`hydropower_light_point_count`、`hydropower_weak_point_count`、`hydropower_ac_circuit_count`、`hydropower_high_power_circuit_count`、`hydropower_bathroom_heater_circuit_count`、`hydropower_smart_toilet_outlet_count`、`hydropower_washing_machine_outlet_count`、`hydropower_dryer_outlet_count`、`hydropower_water_purifier_outlet_count`、`hydropower_cold_water_point_count`、`hydropower_hot_water_point_count`、`hydropower_drain_point_count`、`hydropower_floor_drain_point_count`、`hydropower_strong_conduit_length_m`、`hydropower_weak_conduit_length_m`、`hydropower_water_pipe_length_m`、`hydropower_drain_pipe_length_m`。
- `unit`：单位。
- `unit_price`：汇总单价，必须是非负数字；默认规则中等于主材、辅材、人工三段单价合计。
- `material_price` / `auxiliary_price` / `labor_price`：可选三段单价，用于报价规则面板编辑和真实 Excel 模板展示；`unit_price` 仍作为三段单价合计，并用于报价映射金额计算。
- `space_types`：可选，空间类型白名单；填写后只对这些空间类型生成清单项。
- `scope` / `package_id`：可选，用于半包/全包导出过滤。缺省或 `scope="hard"` 视为硬装基础项；`scope="addon"` 的项目只在整装模式，或“硬装 + 自选增项包”且选中对应 `package_id` 时输出。

当前商品房报价表已整理出一份可导入规则：`quote-rules-apartment-current.json`。它包含当前系统能准确承接的项目，并通过 `scope` / `package_id` 区分硬装基础项和整装增项；不再维护单独的半包规则文件。

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
- 如果构建后继续本地试用，建议按上面的 `apps\web` 目录启动方式重启 `3010` 前端 dev server，避免旧 chunk 或缓存状态干扰。
- 后端 Python 代码变更后需要重启 `8010`，uvicorn 当前常用命令未带 `--reload`。

## 设计取向

- 后端保持确定性、可测试：DXF 解析和算量公式分层，公式逻辑尽量放在小函数里。
- 前端是工作台，不是营销页：信息密度高，重视表格、状态、差异、可复制 JSON 和可回退快照。
- 人工校准结果应该尽量沉淀为规则或 golden fixture，而不是只停留在一次页面状态里。
- 新功能优先补纯函数测试，再接 UI。
- 避免扩大范围：完整报价模板、复杂材料库、CAD 插件都不是当前已经完成的能力；当前 Excel 能力只是基于报价映射的草稿清单下载。

## 最近稳定检查点

2026-07-13 稳定标签：

- `v1.0.1-real-drawing-quote-stable`：真实图纸报价导出稳定版。
- 关键修复提交：`b9b08b6 fix: filter bathroom rows for shower install export`。
- 真实图纸回归输出：`D:\Desktop\cad-real-drawing-regression-2026-07-13-v1.0.1`。
- 5 张真实 DXF 均解析并导出三种 Excel；健康检查仅剩“水电点位待复核”提醒。
- 别墅二卫生间、盥洗区工程已与人工导出表核对：负二层不生成卫生间分组，其它楼层淋浴隔断安装数量和金额一致。
- V1.1 前端试用版已把设计师主流程收敛为“方案上传 / 方案完整性复核 / 方案报价可选项 / 水电点位复核 / 空间工程量摘要 / 预算导出”；校准 JSON、快照、报价映射 JSON 和报价规则维护默认收进“后台/校准工具”。

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
