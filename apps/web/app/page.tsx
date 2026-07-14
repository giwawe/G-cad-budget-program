"use client";

import { useEffect, useState } from "react";
import { UploadWorkbench } from "@/components/upload-workbench";

export default function Home() {
  const [entered, setEntered] = useState(false);
  return entered ? <UploadWorkbench initialRows={[]} initialSummary={null} /> : <HomeGateway onEnter={() => setEntered(true)} />;
}

function HomeGateway({ onEnter }: { onEnter: () => void }) {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="homeGateway">
      <section className="gatewayHero" aria-label="整装预算报价系统首页">
        <div className="gatewayBlueprint" aria-hidden="true">
          <span className="gatewayWall wallA" />
          <span className="gatewayWall wallB" />
          <span className="gatewayWall wallC" />
          <span className="gatewayWall wallD" />
          <span className="gatewayRoom roomA" />
          <span className="gatewayRoom roomB" />
          <span className="gatewayRoom roomC" />
          <span className="gatewayLight lightA" />
          <span className="gatewayLight lightB" />
          <span className="gatewayNode nodeA" />
          <span className="gatewayNode nodeB" />
          <span className="gatewayNode nodeC" />
        </div>
        <div className="gatewayContent">
          <p>CAD / DWG / DXF 方案预算工作台</p>
          <h1>整装预算报价系统</h1>
          <div className="gatewaySignal" aria-hidden="true">
            <span>读取空间</span>
            <span>复核算量</span>
            <span>生成预算</span>
          </div>
          <button className="gatewayEnterButton" type="button" disabled={!introDone} onClick={onEnter}>
            {introDone ? "进入预算工作台" : "方案光线生成中"}
          </button>
        </div>
      </section>
    </main>
  );
}
