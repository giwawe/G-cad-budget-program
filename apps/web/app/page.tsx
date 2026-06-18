import { FileUp, Layers3, Ruler, Settings2 } from "lucide-react";
import { QuantityTable } from "@/components/quantity-table";
import type { QuantityRow } from "@/lib/types";

const sampleRows: QuantityRow[] = [
  {
    floor: "一层",
    spaceName: "一层-客厅",
    spaceType: "客厅",
    floorAreaM2: 30,
    ceilingAreaM2: 30,
    wallMeasureLengthM: 15,
    heightM: 2.8,
    windowWidthTotalM: 3.2,
    windowAreaM2: 4.8,
    doorWidthTotalM: 0.9,
    wallGrossAreaM2: 42,
    latexPaintAreaM2: 37.2,
    evidence: "15m * 2.8m - 窗洞 4.8m2；门洞默认不扣减。",
    anomalies: [],
    status: "pending_review",
  },
  {
    floor: "一层",
    spaceName: "一层-卫生间",
    spaceType: "卫生间",
    floorAreaM2: 5.28,
    ceilingAreaM2: 5.28,
    wallMeasureLengthM: 9.2,
    heightM: 2.8,
    windowWidthTotalM: 0.8,
    windowAreaM2: 0.64,
    doorWidthTotalM: 0.8,
    wallGrossAreaM2: 25.76,
    latexPaintAreaM2: 25.12,
    evidence: "9.2m * 2.8m - 窗洞 0.64m2；门洞默认不扣减。",
    anomalies: [],
    status: "pending_review",
  },
  {
    floor: "一层",
    spaceName: "一层-电梯井",
    spaceType: "其他",
    floorAreaM2: 3.24,
    ceilingAreaM2: 3.24,
    wallMeasureLengthM: 0,
    heightM: 2.8,
    windowWidthTotalM: 0,
    windowAreaM2: 0,
    doorWidthTotalM: 0,
    wallGrossAreaM2: 0,
    latexPaintAreaM2: 0,
    evidence: "电梯井默认识别但不计价。",
    anomalies: [],
    status: "excluded",
  },
];

const layers = [
  "QUOTE_ROOM",
  "QUOTE_WALL",
  "QUOTE_OPENING",
  "QUOTE_WINDOW",
  "QUOTE_DOOR",
  "QUOTE_FLOOR",
  "QUOTE_HEIGHT",
  "QUOTE_EXT_WALL",
];

export default function Home() {
  return (
    <main>
      <section className="topbar">
        <div>
          <p>DXF 空间算量验证工具</p>
          <h1>CAD 工程量校对工作台</h1>
        </div>
        <button type="button">
          <FileUp aria-hidden="true" size={18} />
          上传 DXF
        </button>
      </section>

      <section className="summaryGrid">
        <div className="panel">
          <div className="panelTitle">
            <Settings2 aria-hidden="true" size={18} />
            项目默认参数
          </div>
          <div className="fieldGrid">
            <label>
              项目名称
              <input defaultValue="商品房算量验证" />
            </label>
            <label>
              默认层高
              <input defaultValue="2.80 m" />
            </label>
            <label>
              默认窗高
              <input defaultValue="1.50 m" />
            </label>
            <label>
              默认门高
              <input defaultValue="2.10 m" />
            </label>
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">
            <Layers3 aria-hidden="true" size={18} />
            识别图层
          </div>
          <div className="layerList">
            {layers.map((layer) => (
              <code key={layer}>{layer}</code>
            ))}
          </div>
        </div>

        <div className="panel metricPanel">
          <div className="panelTitle">
            <Ruler aria-hidden="true" size={18} />
            当前样例
          </div>
          <strong>3</strong>
          <span>个空间，其中 1 个默认不计价</span>
        </div>
      </section>

      <section className="reviewSection">
        <div className="sectionHeader">
          <div>
            <h2>空间工程量校对表</h2>
            <p>第一期重点验证 DXF 自动算出的空间面积、墙面计量长度、窗洞扣减和计算依据。</p>
          </div>
        </div>
        <QuantityTable rows={sampleRows} />
      </section>
    </main>
  );
}

