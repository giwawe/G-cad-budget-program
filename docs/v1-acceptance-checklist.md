# V1 可用版本收口清单

更新时间：2026-07-12

本清单用于把当前 CAD 报价工具收口为第一个可试用版本。V1 目标是让设计师基于规范 DXF 完成上传、方案完整性复核、工程量校对、报价抬头填写和 Excel 草稿导出；登录、DWG、后台管理、合同等平台化能力放到后续版本。

## 已完成能力

- DXF 上传解析：支持规范图层下的空间、墙线、门窗、洞口、吊顶、柜体、洁具、外墙轮廓等算量。
- 方案完整性复核：显示关键总量和图形复核图，默认聚焦房间边界、墙线、门窗、吊顶和柜体；洁具、水电推荐点位等高级图层收进“更多图层”。
- 空间工程量校对：支持空间状态、空间类型、窗高、窗洞/门洞扣减、窗帘墙宽等人工复核调整。
- 健康检查：区分 warning 和 info，可导出 CAD 修图清单。
- 报价输出：支持硬装、整装、硬装 + 自选增项三种模式。
- Excel 草稿：已接入报价抬头信息、公共大项分组、直接费 `SUMIF` 合计公式和总价公式。
- 校对快照：支持保存和恢复当前校对状态、报价模式、抬头信息和人工补项数量。

## 真实图纸回归

2026-07-12 已用 5 张真实 DXF 跑通回归：

- `D:/Desktop/别墅一.dxf`
- `D:/Desktop/别墅二.dxf`
- `D:/Desktop/商品房一.dxf`
- `D:/Desktop/商品房二.dxf`
- `D:/Desktop/商品房三.dxf`

输出目录：

```text
D:\Desktop\cad-real-drawing-regression-2026-07-12-v1
```

每张图纸均已生成：

- 硬装 Excel
- 整装 Excel
- 硬装 + 自选增项 Excel
- CAD 修图清单

抽检结论：

- 5 张图纸均能解析并生成报价映射和 Excel。
- 15 份 Excel 均包含地址/日期/设计师/报价员位置、强弱电工程、给排水工程、总价区域和直接费 `SUMIF` 公式。
- 商品房一、商品房二、商品房三、别墅一没有 blocking warning，仅有“水电点位待复核”提醒。
- 别墅二存在 1 项需优先处理 warning：`过道/电梯井`、`客厅/电梯井` 为混合命名，需要 CAD 拆分空间边界或改成规范空间名。

## V1 必须处理

1. 别墅二正式报价前，设计师应先处理混合空间命名：
   - 涉及空间：`过道/电梯井`、`客厅/电梯井`
   - 建议：把可计价空间和电梯井拆成独立 `QUOTE_ROOM`，或用 `QUOTE_VOID` 表达洞口。

2. 导出正式客户报价前，设计师需要确认水电点位：
   - 当前水电点位是系统按空间轮廓、设备位置和默认规则推荐。
   - V1 可以用于报价草稿，但正式报价前应在水电点位复核区确认或调整。

## V1 可接受提醒

- 无真实水电施工图时，强弱电和给排水工程按系统推荐点位估算，属于 V1 可接受提醒。
- 集成吊顶、卫浴、淋浴隔断、背景墙等可保留占位或设计师手填项，Excel 草稿已经提供可调整入口。
- 健康检查中的 info 不阻止导出，但需要设计师在对外报价前看一遍。

## V1 试用反馈

小范围试用期间，问题统一记录到 `docs/v1-trial-feedback.md`。先按“必须修 / 近期优化 / 后续版本”分级，再决定 V1.1 范围，避免把 DWG、登录、后台管理等大功能混入当前可用版本收口。

## 后续版本再做

- DWG 直接上传解析。
- 设计师注册/登录、客户档案、方案版本管理。
- 管理层后台、全局报价规则维护、设计师/客户管理。
- 合同、收款、施工交底等扩展接口。
- 前端整体视觉和交互体验重构。

## 回归命令

启动后端：

```powershell
python -m uvicorn server.app.main:app --host 127.0.0.1 --port 8010
```

运行真实图纸回归：

```powershell
node --experimental-strip-types tools\real-drawing-regression.mjs --date 2026-07-12 --out D:\Desktop\cad-real-drawing-regression-2026-07-12-v1
```

常规验证：

```powershell
node --experimental-strip-types apps\web\lib\quote-excel.test.ts
node --experimental-strip-types apps\web\lib\quote-mapping.test.ts
node --experimental-strip-types apps\web\lib\review-snapshot.test.ts
node --experimental-strip-types apps\web\components\quote-excel-export.test.ts
node node_modules\next\dist\bin\next build apps\web
git diff --check
```
