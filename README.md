# CAD Budget Program G

DXF 空间算量准确性验证工具。

第一期目标是读取按规范绘制的 DXF，生成可校对的空间工程量依据表。当前项目骨架先实现确定性的算量核心和前端工作台壳，后续接入真实 DXF 解析。

## 当前范围

- 商品房空间算量验证。
- 支持规范图层：`QUOTE_ROOM`、`QUOTE_WALL`、`QUOTE_OPENING`、`QUOTE_WINDOW`、`QUOTE_DOOR`、`QUOTE_FLOOR`、`QUOTE_HEIGHT`、`QUOTE_EXT_WALL`。
- 核心公式：地面面积、墙面计量长度、窗洞扣减、乳胶漆面积。
- 电梯井、设备井、管井默认识别但不计价。

## 后端

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r server\requirements.txt
.\.venv\Scripts\python.exe -m pytest server\tests -v
.\.venv\Scripts\python.exe -m uvicorn server.app.main:app --reload --host 127.0.0.1 --port 8000
```

健康检查：

```text
GET http://127.0.0.1:8000/health
```

样例工程量：

```text
GET http://127.0.0.1:8000/api/sample-quantities
```

## 前端

本机需要完整 Node.js/npm 环境。

```powershell
npm install
npm run dev:web
```

当前这台机器的 `E:\Program Files\nodejs` 目录只有 `node.exe`，没有 `npm.cmd`，因此本次尚未执行前端安装和构建验证。

## 文档

- `docs/cad-quote-drawing-spec-v1.md`
- `docs/mvp-requirements.md`
- `docs/superpowers/specs/2026-06-18-dxf-space-quantity-validation-design.md`
- `docs/superpowers/plans/2026-06-18-dxf-space-quantity-validation.md`

