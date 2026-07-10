# 真实图纸回归导出

`tools/real-drawing-regression.mjs` 用于把已确认的真实 DXF 图纸变成可重复回归检查。它会调用本地后端解析 DXF，复用前端水电估算、报价映射和 Excel 模板，生成三种报价模式的 Excel 以及 Markdown 报告。

## 默认输入

脚本默认读取桌面 5 张真实图纸：

- `D:/Desktop/别墅一.dxf`
- `D:/Desktop/别墅二.dxf`
- `D:/Desktop/商品房一.dxf`
- `D:/Desktop/商品房二.dxf`
- `D:/Desktop/商品房三.dxf`

运行前需确保后端 `http://127.0.0.1:8010/health` 正常。

## 命令

```powershell
node --experimental-strip-types tools\real-drawing-regression.mjs
```

常用参数：

```powershell
node --experimental-strip-types tools\real-drawing-regression.mjs `
  --api-base-url http://127.0.0.1:8010 `
  --date 2026-07-10 `
  --out D:\Desktop\cad-real-drawing-regression-2026-07-10
```

如果只回归部分图纸：

```powershell
node --experimental-strip-types tools\real-drawing-regression.mjs --dxf "D:/Desktop/别墅二.dxf;D:/Desktop/商品房一.dxf"
```

## 客户/项目抬头信息

可用 JSON 文件传入客户、设计师、报价员和报价日期。`default` 会作为全局默认值，文件名或不带扩展名的项目名可覆盖单张图纸。

```json
{
  "default": {
    "customerName": "张三",
    "designerName": "李设计",
    "estimatorName": "王报价",
    "quoteDate": "2026-07-10"
  },
  "别墅二.dxf": {
    "addressName": "别墅二",
    "customerName": "李四"
  }
}
```

运行：

```powershell
node --experimental-strip-types tools\real-drawing-regression.mjs --project-info D:\Desktop\quote-project-info.json
```

## 输出内容

输出目录包含：

- `*-硬装-*.xls`
- `*-整装-*.xls`
- `*-硬装加自选增项-*.xls`
- `real-drawing-regression-report.md`
- 每张图纸一份 `*.cad-health-fix-list.md`

`real-drawing-regression-report.md` 会集中列出：

- 总览：空间数、建筑面积、墙面长度、水电点位和健康检查摘要。
- 空间分类边界：空间类型分布、状态分布、其他空间、混合命名提醒。
- 洞口/吊顶/楼梯稳定性：门窗、洞口扣减、吊顶边界、楼梯踏步和扶手。
- 报价关键项：强弱电、给排水、淋浴隔断、集成吊顶、楼梯等关键清单数量。

这份报告用于快速判断后续规则调整是否影响已确认的真实图纸导出结果；Excel 文件用于人工打开复核打印样式和公式联动。
