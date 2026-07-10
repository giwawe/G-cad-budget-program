# Hydropower Auto Estimate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace default water/electric pricing by building automatic, reviewable hydropower point candidates with virtual coordinates, pipe/conduit estimates, quote mapping metrics, Excel output, and snapshot persistence.

**Architecture:** Keep the first implementation in frontend pure functions so the rules can iterate quickly without changing the FastAPI contract. `apps/web/lib/hydropower-estimate.ts` will generate virtual points from `QuantityRow[]` and `DrawingGeometry`, estimate pipe/conduit lengths, and summarize quote metrics. Existing quote mapping, snapshot, health, drawing review, and workbench components will consume this result.

**Tech Stack:** Next.js 15, React 19, TypeScript with Node `--experimental-strip-types` tests, existing SVG drawing review, existing quote mapping and Excel HTML exporters.

## Global Constraints

- Do not add required CAD water/electric layers in the first version.
- Use system-recommended virtual point coordinates as the main path.
- Clearly mark generated points and pipe lengths as system estimates, not CAD-measured construction drawings.
- Preserve user/manual edits in the dirty worktree; do not revert unrelated changes.
- Use `apply_patch` for file edits.
- Read and write Chinese text as UTF-8.
- Do not use batch delete commands.
- Existing ports remain web `http://127.0.0.1:3010/` and API `http://127.0.0.1:8010/`.

---

## File Structure

- Create `apps/web/lib/hydropower-estimate.ts`: hydropower types, default point rules, virtual point placement helpers, pipe/conduit estimator, and summary builder.
- Create `apps/web/lib/hydropower-estimate.test.ts`: pure function tests for apartments, villas, kitchens, bathrooms, coordinate placement, fallback mode, and pipe length changes.
- Modify `apps/web/lib/types.ts`: add hydropower point, pipe, summary, and review status types used by workbench, snapshot, drawing review, and quote mapping.
- Modify `apps/web/lib/quote-mapping.ts`: add hydropower quote metrics, accept hydropower summary in `buildQuoteMapping`, replace default area-based water/electric rules.
- Modify `apps/web/lib/quote-mapping.test.ts`: cover new water/electric metrics and legacy imported area rules warning behavior.
- Modify `apps/web/lib/quote-excel.ts`: classify new water/electric item names into the existing “水电工程” section and update default notes.
- Modify `apps/web/lib/quote-excel.test.ts`: assert new water/electric rows appear in the Excel HTML under “水电工程”.
- Modify `apps/web/lib/review-snapshot.ts`: save and restore hydropower review data.
- Modify `apps/web/lib/review-snapshot.test.ts`: assert hydropower data round-trips and legacy snapshots default cleanly.
- Modify `apps/web/lib/quantity-health.ts`: add hydropower review and legacy area-pricing checks.
- Modify `apps/web/lib/quantity-health.test.ts`: cover unconfirmed estimate info, no-coordinate warning, and area-pricing warning.
- Modify `apps/web/components/drawing-review.tsx`: render hydropower recommended points as a toggleable SVG layer.
- Modify `apps/web/components/upload-workbench.tsx`: compute hydropower estimate from rows and drawing, hold edited/reviewed hydropower state, pass it to quote mapping and Excel, show a review panel.
- Create `apps/web/components/hydropower-review-panel.tsx`: compact review UI grouped by floor and space with quantity inputs and project summary.
- Create `apps/web/components/hydropower-review-panel.test.tsx` only if the current project already supports component rendering tests; otherwise keep review behavior covered through pure helper tests and quote/export tests.
- Modify `quote-rules-apartment-current.json`: replace default `强电布线`, `弱电布线`, `水路布管` area metrics with new point/pipe metrics.
- Modify `docs/cad-quote-drawing-spec-v1.md` and `AGENTS.md`: document virtual point estimating and the fact that pipe lengths are not CAD-measured.
- Regenerate `docs/cad-quote-drawing-spec-v1.docx` from the updated Markdown using the existing document-generation approach already used in this repo.

---

### Task 1: Hydropower Types And Summary Skeleton

**Files:**
- Modify: `apps/web/lib/types.ts`
- Create: `apps/web/lib/hydropower-estimate.ts`
- Create: `apps/web/lib/hydropower-estimate.test.ts`

**Interfaces:**
- Consumes: `QuantityRow`, `DrawingGeometry`, `DrawingPoint`.
- Produces:
  - `HydropowerPoint`
  - `HydropowerPipeEstimate`
  - `HydropowerEstimate`
  - `buildHydropowerEstimate(rows: QuantityRow[], drawing: DrawingGeometry | null, overrides?: HydropowerEstimate | null): HydropowerEstimate`
  - `summarizeHydropowerEstimate(estimate: HydropowerEstimate): HydropowerSummary`

- [ ] **Step 1: Add failing type and empty-input tests**

Create `apps/web/lib/hydropower-estimate.test.ts` with:

```ts
import assert from "node:assert/strict";
import { buildHydropowerEstimate, summarizeHydropowerEstimate } from "./hydropower-estimate";
import type { DrawingGeometry, QuantityRow } from "./types";

const emptyDrawing: DrawingGeometry = {
  spaces: [],
  walls: [],
  measured_walls: [],
  opening_edges: [],
  void_boundaries: [],
  railings: [],
  tile_walls: [],
  new_walls: [],
  demolition_walls: [],
  background_walls: [],
  cast_slab_boundaries: [],
  base_cabinets: [],
  wall_cabinets: [],
  base_cabinet_boundaries: [],
  wall_cabinet_boundaries: [],
  custom_cabinets: [],
  exterior_wall_boundaries: [],
  building_area_m2: 0,
  toilets: [],
  bathroom_vanities: [],
  window_openings: [],
  windows: [],
  door_openings: [],
  doors: [],
  base_segments: [],
  base_texts: [],
  bbox: { min_x: 0, min_y: 0, max_x: 0, max_y: 0 },
};

const emptyEstimate = buildHydropowerEstimate([], emptyDrawing);
assert.equal(emptyEstimate.reviewStatus, "auto_estimated");
assert.deepEqual(emptyEstimate.points, []);
assert.deepEqual(emptyEstimate.pipes, []);
assert.deepEqual(summarizeHydropowerEstimate(emptyEstimate), {
  switchPointCount: 0,
  standardOutletCount: 0,
  sofaChargingOutletCount: 0,
  heatingOutletCount: 0,
  bedEndFanOutletCount: 0,
  kitchenCounterOutletCount: 0,
  lightPointCount: 0,
  weakPointCount: 0,
  acCircuitCount: 0,
  highPowerCircuitCount: 0,
  bathroomHeaterCircuitCount: 0,
  smartToiletOutletCount: 0,
  washingMachineOutletCount: 0,
  dryerOutletCount: 0,
  waterPurifierOutletCount: 0,
  coldWaterPointCount: 0,
  hotWaterPointCount: 0,
  drainPointCount: 0,
  floorDrainPointCount: 0,
  strongConduitLengthM: 0,
  weakConduitLengthM: 0,
  waterPipeLengthM: 0,
  drainPipeLengthM: 0,
  lowConfidencePointCount: 0,
});
```

- [ ] **Step 2: Run the failing test**

Run: `node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts`

Expected: FAIL because `apps/web/lib/hydropower-estimate.ts` does not exist.

- [ ] **Step 3: Add hydropower types**

Add to `apps/web/lib/types.ts`:

```ts
export type HydropowerPointKind =
  | "switch"
  | "standard_outlet"
  | "sofa_charging_outlet"
  | "heating_outlet"
  | "bed_end_fan_outlet"
  | "kitchen_counter_outlet"
  | "light"
  | "weak_point"
  | "ac_circuit"
  | "high_power_circuit"
  | "bathroom_heater_circuit"
  | "smart_toilet_outlet"
  | "washing_machine_outlet"
  | "dryer_outlet"
  | "water_purifier_outlet"
  | "cold_water"
  | "hot_water"
  | "drain"
  | "floor_drain";

export type HydropowerPipeKind = "strong_conduit" | "weak_conduit" | "water_pipe" | "drain_pipe";
export type HydropowerReviewStatus = "auto_estimated" | "confirmed" | "needs_review";
export type HydropowerSource = "virtual_point" | "fixture_point" | "fallback_count";

export type HydropowerPoint = {
  id: string;
  floor: string;
  spaceName: string;
  spaceType: string;
  kind: HydropowerPointKind;
  label: string;
  quantity: number;
  point: DrawingPoint | null;
  source: HydropowerSource;
  confidence: "high" | "medium" | "low";
  note: string;
};

export type HydropowerPipeEstimate = {
  id: string;
  floor: string;
  spaceName: string;
  spaceType: string;
  kind: HydropowerPipeKind;
  label: string;
  lengthM: number;
  source: "virtual_point_distance" | "fallback_count_factor";
  confidence: "high" | "medium" | "low";
  note: string;
};

export type HydropowerSummary = {
  switchPointCount: number;
  standardOutletCount: number;
  sofaChargingOutletCount: number;
  heatingOutletCount: number;
  bedEndFanOutletCount: number;
  kitchenCounterOutletCount: number;
  lightPointCount: number;
  weakPointCount: number;
  acCircuitCount: number;
  highPowerCircuitCount: number;
  bathroomHeaterCircuitCount: number;
  smartToiletOutletCount: number;
  washingMachineOutletCount: number;
  dryerOutletCount: number;
  waterPurifierOutletCount: number;
  coldWaterPointCount: number;
  hotWaterPointCount: number;
  drainPointCount: number;
  floorDrainPointCount: number;
  strongConduitLengthM: number;
  weakConduitLengthM: number;
  waterPipeLengthM: number;
  drainPipeLengthM: number;
  lowConfidencePointCount: number;
};

export type HydropowerEstimate = {
  points: HydropowerPoint[];
  pipes: HydropowerPipeEstimate[];
  summary: HydropowerSummary;
  reviewStatus: HydropowerReviewStatus;
};
```

- [ ] **Step 4: Implement empty estimate and summary**

Create `apps/web/lib/hydropower-estimate.ts`:

```ts
import type { DrawingGeometry, HydropowerEstimate, HydropowerSummary, QuantityRow } from "./types";

export const EMPTY_HYDROPOWER_SUMMARY: HydropowerSummary = {
  switchPointCount: 0,
  standardOutletCount: 0,
  sofaChargingOutletCount: 0,
  heatingOutletCount: 0,
  bedEndFanOutletCount: 0,
  kitchenCounterOutletCount: 0,
  lightPointCount: 0,
  weakPointCount: 0,
  acCircuitCount: 0,
  highPowerCircuitCount: 0,
  bathroomHeaterCircuitCount: 0,
  smartToiletOutletCount: 0,
  washingMachineOutletCount: 0,
  dryerOutletCount: 0,
  waterPurifierOutletCount: 0,
  coldWaterPointCount: 0,
  hotWaterPointCount: 0,
  drainPointCount: 0,
  floorDrainPointCount: 0,
  strongConduitLengthM: 0,
  weakConduitLengthM: 0,
  waterPipeLengthM: 0,
  drainPipeLengthM: 0,
  lowConfidencePointCount: 0,
};

export function summarizeHydropowerEstimate(estimate: HydropowerEstimate): HydropowerSummary {
  return estimate.summary;
}

export function buildHydropowerEstimate(
  _rows: QuantityRow[],
  _drawing: DrawingGeometry | null,
  overrides?: HydropowerEstimate | null,
): HydropowerEstimate {
  if (overrides) {
    return overrides;
  }
  return {
    points: [],
    pipes: [],
    summary: { ...EMPTY_HYDROPOWER_SUMMARY },
    reviewStatus: "auto_estimated",
  };
}
```

- [ ] **Step 5: Run the test**

Run: `node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps\web\lib\types.ts apps\web\lib\hydropower-estimate.ts apps\web\lib\hydropower-estimate.test.ts
git commit -m "feat: add hydropower estimate types"
```

---

### Task 2: Virtual Point Generation Rules

**Files:**
- Modify: `apps/web/lib/hydropower-estimate.ts`
- Modify: `apps/web/lib/hydropower-estimate.test.ts`

**Interfaces:**
- Consumes: `buildHydropowerEstimate(rows, drawing, overrides)`.
- Produces: populated `HydropowerEstimate.points` with stable ids, labels, quantities, coordinates, sources, and confidence.

- [ ] **Step 1: Add apartment and villa point tests**

Append to `apps/web/lib/hydropower-estimate.test.ts`:

```ts
function baseRow(overrides: Partial<QuantityRow>): QuantityRow {
  return {
    floor: "一层",
    spaceName: "一层-客厅",
    spaceType: "客厅",
    grossFloorAreaM2: 20,
    floorAreaM2: 20,
    ceilingAreaM2: 20,
    voidAreaM2: 0,
    wallMeasureLengthM: 18,
    heightM: 2.8,
    windowWidthTotalM: 2,
    windowsillLengthM: 2,
    curtainWallWidthM: 3,
    curtainWallWidthSource: "matched_window_wall",
    windowAreaM2: 3.6,
    doorWidthTotalM: 0.9,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 50.4,
    latexPaintAreaM2: 42,
    wallTileMeasureLengthM: 0,
    wallTileAreaM2: 0,
    floorTilePieceCount: 19,
    electricalScopeAreaM2: 20,
    plumbingScopeAreaM2: 20,
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    interiorDoorCount: 0,
    bathroomDoorCount: 0,
    slidingDoorAreaM2: 0,
    slidingDoorCasingLengthM: 0,
    kitchenBaseCabinetLengthM: 0,
    kitchenWallCabinetLengthM: 0,
    customCabinetAreaM2: 0,
    toiletCount: 0,
    bathroomVanityCount: 0,
    waterproofAreaM2: 0,
    evidence: "",
    anomalies: [],
    status: "pending_review",
    ...overrides,
  };
}

const roomDrawing: DrawingGeometry = {
  ...emptyDrawing,
  spaces: [
    { name: "一层-客厅", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }] },
    { name: "一层-厨房", points: [{ x: 7, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 7, y: 3 }] },
    { name: "一层-卫生间", points: [{ x: 11, y: 0 }, { x: 13, y: 0 }, { x: 13, y: 2.2 }, { x: 11, y: 2.2 }] },
  ],
  base_cabinets: [{ start: { x: 7.2, y: 0.2 }, end: { x: 9.8, y: 0.2 } }],
  toilets: [{ x: 12.4, y: 1.6 }],
  bathroom_vanities: [{ x: 11.3, y: 0.4 }],
  doors: [{ start: { x: 0.2, y: 0 }, end: { x: 1, y: 0 } }],
  door_openings: [],
  bbox: { min_x: 0, min_y: 0, max_x: 13, max_y: 4 },
};

const hydropowerRows = [
  baseRow({ spaceName: "一层-客厅", spaceType: "客厅", floorAreaM2: 24 }),
  baseRow({ spaceName: "一层-厨房", spaceType: "厨房", kitchenBaseCabinetLengthM: 2.6, floorAreaM2: 9 }),
  baseRow({ spaceName: "一层-卫生间", spaceType: "卫生间", toiletCount: 1, bathroomVanityCount: 1, floorAreaM2: 4.4 }),
];

const estimate = buildHydropowerEstimate(hydropowerRows, roomDrawing);
assert.equal(estimate.points.filter((point) => point.kind === "kitchen_counter_outlet").length, 6);
assert.equal(estimate.points.filter((point) => point.kind === "sofa_charging_outlet").length, 2);
assert.equal(estimate.points.filter((point) => point.kind === "heating_outlet").length, 1);
assert.equal(estimate.points.filter((point) => point.kind === "smart_toilet_outlet").length, 1);
assert.equal(estimate.points.filter((point) => point.kind === "cold_water" && point.spaceType === "卫生间").length, 3);
assert.ok(estimate.points.every((point) => point.id.includes(point.spaceName)));
assert.ok(estimate.points.filter((point) => point.source === "virtual_point").length > 0);
assert.ok(estimate.points.filter((point) => point.source === "fixture_point").length > 0);

const villaEstimate = buildHydropowerEstimate([
  baseRow({ floor: "一层", spaceName: "一层-卧室", spaceType: "卧室" }),
  baseRow({ floor: "二层", spaceName: "二层-卧室", spaceType: "卧室" }),
], {
  ...emptyDrawing,
  spaces: [
    { name: "一层-卧室", points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }] },
    { name: "二层-卧室", points: [{ x: 0, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 8 }, { x: 0, y: 8 }] },
  ],
  bbox: { min_x: 0, min_y: 0, max_x: 4, max_y: 8 },
});
assert.equal(villaEstimate.points.filter((point) => point.kind === "bed_end_fan_outlet").length, 2);
```

- [ ] **Step 2: Run the failing test**

Run: `node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts`

Expected: FAIL because point generation is not implemented.

- [ ] **Step 3: Implement point rule table and helpers**

Add to `apps/web/lib/hydropower-estimate.ts` below the empty summary:

```ts
import type {
  DrawingGeometry,
  DrawingPoint,
  DrawingSpace,
  HydropowerPoint,
  HydropowerPointKind,
  HydropowerSource,
  QuantityRow,
} from "./types";

type PointSpec = {
  kind: HydropowerPointKind;
  label: string;
  quantity: (row: QuantityRow) => number;
  anchor: "center" | "wall" | "door" | "cabinet" | "toilet" | "vanity" | "wet_corner";
};

const RULES_BY_SPACE_TYPE: Record<string, PointSpec[]> = {
  厨房: [
    { kind: "light", label: "厨房照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "厨房开关点位", quantity: () => 1, anchor: "door" },
    { kind: "kitchen_counter_outlet", label: "厨房台面插座", quantity: () => 6, anchor: "cabinet" },
    { kind: "standard_outlet", label: "油烟机插座", quantity: () => 1, anchor: "cabinet" },
    { kind: "standard_outlet", label: "冰箱插座", quantity: () => 1, anchor: "wall" },
    { kind: "water_purifier_outlet", label: "净水机插座", quantity: () => 1, anchor: "cabinet" },
    { kind: "cold_water", label: "厨房水槽冷水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "hot_water", label: "厨房水槽热水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "drain", label: "厨房水槽排水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "cold_water", label: "净水机给水点", quantity: () => 1, anchor: "cabinet" },
    { kind: "high_power_circuit", label: "厨房大功率电器专线", quantity: () => 2, anchor: "cabinet" },
  ],
  卫生间: [
    { kind: "light", label: "卫生间照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "卫生间开关点位", quantity: () => 1, anchor: "door" },
    { kind: "bathroom_heater_circuit", label: "浴霸/暖风机专线", quantity: () => 1, anchor: "center" },
    { kind: "light", label: "镜前灯点位", quantity: () => 1, anchor: "vanity" },
    { kind: "standard_outlet", label: "镜柜/吹风机插座", quantity: () => 1, anchor: "vanity" },
    { kind: "smart_toilet_outlet", label: "智能马桶插座", quantity: () => 1, anchor: "toilet" },
    { kind: "cold_water", label: "马桶给水点", quantity: (row) => Math.max(row.toiletCount, 1), anchor: "toilet" },
    { kind: "cold_water", label: "浴室柜冷水点", quantity: (row) => Math.max(row.bathroomVanityCount, 1), anchor: "vanity" },
    { kind: "hot_water", label: "浴室柜热水点", quantity: (row) => Math.max(row.bathroomVanityCount, 1), anchor: "vanity" },
    { kind: "drain", label: "浴室柜排水点", quantity: (row) => Math.max(row.bathroomVanityCount, 1), anchor: "vanity" },
    { kind: "cold_water", label: "花洒冷水点", quantity: () => 1, anchor: "wet_corner" },
    { kind: "hot_water", label: "花洒热水点", quantity: () => 1, anchor: "wet_corner" },
    { kind: "floor_drain", label: "卫生间地漏", quantity: () => 1, anchor: "wet_corner" },
    { kind: "drain", label: "卫生间排水点", quantity: () => 1, anchor: "wet_corner" },
  ],
  客厅: [
    { kind: "light", label: "客厅照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "客厅开关点位", quantity: () => 2, anchor: "door" },
    { kind: "standard_outlet", label: "客厅普通插座", quantity: () => 6, anchor: "wall" },
    { kind: "sofa_charging_outlet", label: "沙发充电插座", quantity: () => 2, anchor: "wall" },
    { kind: "heating_outlet", label: "沙发中部取暖设备插座", quantity: () => 1, anchor: "wall" },
    { kind: "ac_circuit", label: "客厅空调专线", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "客厅电视点位", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "客厅网络点位", quantity: () => 1, anchor: "wall" },
  ],
  餐厅: [
    { kind: "light", label: "餐厅照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "餐厅开关点位", quantity: () => 1, anchor: "door" },
    { kind: "standard_outlet", label: "餐厅普通插座", quantity: () => 3, anchor: "wall" },
  ],
  卧室: [
    { kind: "light", label: "卧室照明点位", quantity: () => 1, anchor: "center" },
    { kind: "switch", label: "卧室开关点位", quantity: () => 1, anchor: "door" },
    { kind: "standard_outlet", label: "卧室普通插座", quantity: () => 5, anchor: "wall" },
    { kind: "bed_end_fan_outlet", label: "床尾风扇插座", quantity: () => 1, anchor: "wall" },
    { kind: "ac_circuit", label: "卧室空调专线", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "卧室网络点位", quantity: () => 1, anchor: "wall" },
    { kind: "weak_point", label: "卧室电视点位", quantity: () => 1, anchor: "wall" },
  ],
};
const DRY_FUNCTION_SPACE_TYPES = new Set(["书房", "茶室", "娱乐室"]);
const SIMPLE_SPACE_RULES = new Set(["过道", "门厅", "楼梯", "楼梯过道", "衣帽间", "储物间", "露台"]);
```

- [ ] **Step 4: Implement geometry placement**

Continue in `apps/web/lib/hydropower-estimate.ts`:

```ts
function rulesForSpaceType(spaceType: string): PointSpec[] {
  if (RULES_BY_SPACE_TYPE[spaceType]) return RULES_BY_SPACE_TYPE[spaceType];
  if (DRY_FUNCTION_SPACE_TYPES.has(spaceType)) return RULES_BY_SPACE_TYPE["卧室"];
  if (spaceType === "阳台" || spaceType === "洗衣房") {
    return [
      { kind: "light", label: `${spaceType}照明点位`, quantity: () => 1, anchor: "center" },
      { kind: "switch", label: `${spaceType}开关点位`, quantity: () => 1, anchor: "door" },
      { kind: "washing_machine_outlet", label: "洗衣机插座", quantity: () => 1, anchor: "wet_corner" },
      { kind: "dryer_outlet", label: "烘干机插座", quantity: () => 1, anchor: "wet_corner" },
      { kind: "cold_water", label: "洗衣机给水点", quantity: () => 1, anchor: "wet_corner" },
      { kind: "drain", label: "洗衣机排水点", quantity: () => 1, anchor: "wet_corner" },
      { kind: "floor_drain", label: `${spaceType}地漏`, quantity: () => 1, anchor: "wet_corner" },
    ];
  }
  if (SIMPLE_SPACE_RULES.has(spaceType)) {
    return [
      { kind: "light", label: `${spaceType}照明点位`, quantity: () => 1, anchor: "center" },
      { kind: "switch", label: `${spaceType}开关点位`, quantity: () => 1, anchor: "door" },
      { kind: "standard_outlet", label: `${spaceType}备用插座`, quantity: () => (spaceType === "露台" ? 1 : 0), anchor: "wall" },
    ];
  }
  return [
    { kind: "light", label: `${spaceType || "其他"}照明点位`, quantity: () => 1, anchor: "center" },
    { kind: "switch", label: `${spaceType || "其他"}开关点位`, quantity: () => 1, anchor: "door" },
  ];
}

function centerOf(points: DrawingPoint[]): DrawingPoint | null {
  if (points.length === 0) return null;
  return {
    x: round2(points.reduce((sum, point) => sum + point.x, 0) / points.length),
    y: round2(points.reduce((sum, point) => sum + point.y, 0) / points.length),
  };
}

function spaceForRow(row: QuantityRow, drawing: DrawingGeometry | null): DrawingSpace | null {
  return drawing?.spaces.find((space) => space.name === row.spaceName) ?? null;
}

function anchorPoint(row: QuantityRow, space: DrawingSpace | null, drawing: DrawingGeometry | null, spec: PointSpec, offset: number): { point: DrawingPoint | null; source: HydropowerSource; confidence: "high" | "medium" | "low" } {
  const center = space ? centerOf(space.points) : null;
  if (!center) return { point: null, source: "fallback_count", confidence: "low" };
  if (spec.anchor === "toilet" && drawing?.toilets[offset]) return { point: drawing.toilets[offset], source: "fixture_point", confidence: "high" };
  if (spec.anchor === "vanity" && drawing?.bathroom_vanities[offset]) return { point: drawing.bathroom_vanities[offset], source: "fixture_point", confidence: "high" };
  const angle = (Math.PI * 2 * offset) / Math.max(spec.quantity(row), 1);
  const radius = spec.anchor === "center" ? 0 : 0.45;
  return {
    point: { x: round2(center.x + Math.cos(angle) * radius), y: round2(center.y + Math.sin(angle) * radius) },
    source: "virtual_point",
    confidence: spec.anchor === "center" ? "high" : "medium",
  };
}

function pointsForRow(row: QuantityRow, drawing: DrawingGeometry | null): HydropowerPoint[] {
  const space = spaceForRow(row, drawing);
  return rulesForSpaceType(row.spaceType).flatMap((spec) => {
    const quantity = spec.quantity(row);
    return Array.from({ length: quantity }, (_, index) => {
      const anchor = anchorPoint(row, space, drawing, spec, index);
      return {
        id: `${row.floor}-${row.spaceName}-${spec.kind}-${index + 1}`,
        floor: row.floor,
        spaceName: row.spaceName,
        spaceType: row.spaceType,
        kind: spec.kind,
        label: spec.label,
        quantity: 1,
        point: anchor.point,
        source: anchor.source,
        confidence: anchor.confidence,
        note: anchor.point ? "系统按空间轮廓生成推荐点位" : "缺少空间几何，按数量候选生成",
      };
    });
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
```

- [ ] **Step 5: Wire point generation into `buildHydropowerEstimate`**

Replace the non-override return body in `buildHydropowerEstimate`:

```ts
const points = _rows.flatMap((row) => pointsForRow(row, _drawing));
const estimate: HydropowerEstimate = {
  points,
  pipes: [],
  summary: summarizePointsAndPipes(points, []),
  reviewStatus: "auto_estimated",
};
return estimate;
```

Add:

```ts
function summarizePointsAndPipes(points: HydropowerPoint[], pipes: HydropowerPipeEstimate[]): HydropowerSummary {
  const count = (kind: HydropowerPointKind) => points.filter((point) => point.kind === kind).reduce((sum, point) => sum + point.quantity, 0);
  const pipeLength = (kind: HydropowerPipeEstimate["kind"]) => round2(pipes.filter((pipe) => pipe.kind === kind).reduce((sum, pipe) => sum + pipe.lengthM, 0));
  return {
    switchPointCount: count("switch"),
    standardOutletCount: count("standard_outlet"),
    sofaChargingOutletCount: count("sofa_charging_outlet"),
    heatingOutletCount: count("heating_outlet"),
    bedEndFanOutletCount: count("bed_end_fan_outlet"),
    kitchenCounterOutletCount: count("kitchen_counter_outlet"),
    lightPointCount: count("light"),
    weakPointCount: count("weak_point"),
    acCircuitCount: count("ac_circuit"),
    highPowerCircuitCount: count("high_power_circuit"),
    bathroomHeaterCircuitCount: count("bathroom_heater_circuit"),
    smartToiletOutletCount: count("smart_toilet_outlet"),
    washingMachineOutletCount: count("washing_machine_outlet"),
    dryerOutletCount: count("dryer_outlet"),
    waterPurifierOutletCount: count("water_purifier_outlet"),
    coldWaterPointCount: count("cold_water"),
    hotWaterPointCount: count("hot_water"),
    drainPointCount: count("drain"),
    floorDrainPointCount: count("floor_drain"),
    strongConduitLengthM: pipeLength("strong_conduit"),
    weakConduitLengthM: pipeLength("weak_conduit"),
    waterPipeLengthM: pipeLength("water_pipe"),
    drainPipeLengthM: pipeLength("drain_pipe"),
    lowConfidencePointCount: points.filter((point) => point.confidence === "low").length,
  };
}
```

- [ ] **Step 6: Run the test**

Run: `node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps\web\lib\hydropower-estimate.ts apps\web\lib\hydropower-estimate.test.ts
git commit -m "feat: generate hydropower virtual points"
```

---

### Task 3: Pipe And Conduit Estimation

**Files:**
- Modify: `apps/web/lib/hydropower-estimate.ts`
- Modify: `apps/web/lib/hydropower-estimate.test.ts`

**Interfaces:**
- Consumes: generated `HydropowerPoint[]`.
- Produces: populated `HydropowerPipeEstimate[]` and non-zero pipe/conduit summary metrics.

- [ ] **Step 1: Add pipe estimate tests**

Append:

```ts
const pipeEstimate = buildHydropowerEstimate(hydropowerRows, roomDrawing);
assert.ok(pipeEstimate.summary.strongConduitLengthM > 0);
assert.ok(pipeEstimate.summary.weakConduitLengthM > 0);
assert.ok(pipeEstimate.summary.waterPipeLengthM > 0);
assert.ok(pipeEstimate.summary.drainPipeLengthM > 0);
assert.ok(pipeEstimate.pipes.some((pipe) => pipe.source === "virtual_point_distance"));

const fallbackPipeEstimate = buildHydropowerEstimate([baseRow({ spaceName: "无图形卧室", spaceType: "卧室" })], emptyDrawing);
assert.ok(fallbackPipeEstimate.summary.strongConduitLengthM > 0);
assert.ok(fallbackPipeEstimate.summary.lowConfidencePointCount > 0);
assert.ok(fallbackPipeEstimate.pipes.some((pipe) => pipe.source === "fallback_count_factor"));
```

- [ ] **Step 2: Run the failing test**

Run: `node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts`

Expected: FAIL because pipes are still empty.

- [ ] **Step 3: Implement pipe classification and distance helpers**

Add:

```ts
const STRONG_POINT_KINDS = new Set<HydropowerPointKind>([
  "switch",
  "standard_outlet",
  "sofa_charging_outlet",
  "heating_outlet",
  "bed_end_fan_outlet",
  "kitchen_counter_outlet",
  "light",
  "ac_circuit",
  "high_power_circuit",
  "bathroom_heater_circuit",
  "smart_toilet_outlet",
  "washing_machine_outlet",
  "dryer_outlet",
  "water_purifier_outlet",
]);
const WEAK_POINT_KINDS = new Set<HydropowerPointKind>(["weak_point"]);
const WATER_POINT_KINDS = new Set<HydropowerPointKind>(["cold_water", "hot_water"]);
const DRAIN_POINT_KINDS = new Set<HydropowerPointKind>(["drain", "floor_drain"]);

function distanceFromRoomCenter(point: HydropowerPoint, drawing: DrawingGeometry | null): number {
  const space = drawing?.spaces.find((entry) => entry.name === point.spaceName);
  const center = space ? centerOf(space.points) : null;
  if (!point.point || !center) {
    return 2.5;
  }
  return round2(Math.hypot(point.point.x - center.x, point.point.y - center.y) * 1.15 + 1.2);
}

function estimatePipes(points: HydropowerPoint[], drawing: DrawingGeometry | null): HydropowerPipeEstimate[] {
  const groups = new Map<string, HydropowerPoint[]>();
  for (const point of points) {
    groups.set(point.id, [point]);
  }
  return points.flatMap((point) => {
    const source = point.point ? "virtual_point_distance" : "fallback_count_factor";
    const confidence = point.point ? point.confidence : "low";
    const baseLength = source === "virtual_point_distance" ? distanceFromRoomCenter(point, drawing) : fallbackLengthForPoint(point);
    if (STRONG_POINT_KINDS.has(point.kind)) {
      return [pipeForPoint(point, "strong_conduit", "强电线管", baseLength, source, confidence)];
    }
    if (WEAK_POINT_KINDS.has(point.kind)) {
      return [pipeForPoint(point, "weak_conduit", "弱电线管", baseLength, source, confidence)];
    }
    if (WATER_POINT_KINDS.has(point.kind)) {
      return [pipeForPoint(point, "water_pipe", "给水管", baseLength, source, confidence)];
    }
    if (DRAIN_POINT_KINDS.has(point.kind)) {
      return [pipeForPoint(point, "drain_pipe", "排水管", baseLength, source, confidence)];
    }
    return [];
  });
}

function fallbackLengthForPoint(point: HydropowerPoint): number {
  if (WATER_POINT_KINDS.has(point.kind)) return 1.8;
  if (DRAIN_POINT_KINDS.has(point.kind)) return 1.2;
  if (point.kind === "ac_circuit" || point.kind === "high_power_circuit" || point.kind === "bathroom_heater_circuit") return 6;
  return 2.5;
}

function pipeForPoint(
  point: HydropowerPoint,
  kind: HydropowerPipeEstimate["kind"],
  label: string,
  lengthM: number,
  source: HydropowerPipeEstimate["source"],
  confidence: HydropowerPipeEstimate["confidence"],
): HydropowerPipeEstimate {
  return {
    id: `${point.id}-${kind}`,
    floor: point.floor,
    spaceName: point.spaceName,
    spaceType: point.spaceType,
    kind,
    label,
    lengthM: round2(lengthM),
    source,
    confidence,
    note: source === "virtual_point_distance" ? "按推荐点位到空间中心/墙边干线估算" : "缺少点位坐标，按数量系数估算",
  };
}
```

- [ ] **Step 4: Wire pipe estimation**

In `buildHydropowerEstimate`, after `const points = ...`:

```ts
const pipes = estimatePipes(points, _drawing);
const estimate: HydropowerEstimate = {
  points,
  pipes,
  summary: summarizePointsAndPipes(points, pipes),
  reviewStatus: "auto_estimated",
};
return estimate;
```

- [ ] **Step 5: Run the test**

Run: `node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps\web\lib\hydropower-estimate.ts apps\web\lib\hydropower-estimate.test.ts
git commit -m "feat: estimate hydropower pipe lengths"
```

---

### Task 4: Quote Metrics And Excel Output

**Files:**
- Modify: `apps/web/lib/quote-mapping.ts`
- Modify: `apps/web/lib/quote-mapping.test.ts`
- Modify: `apps/web/lib/quote-excel.ts`
- Modify: `apps/web/lib/quote-excel.test.ts`
- Modify: `quote-rules-apartment-current.json`

**Interfaces:**
- Consumes: `HydropowerSummary` from `buildHydropowerEstimate`.
- Produces: quote metrics for water/electric items and Excel rows in “水电工程”.

- [ ] **Step 1: Add quote mapping tests for hydropower metrics**

In `apps/web/lib/quote-mapping.test.ts`, add:

```ts
const hydropowerSummary = {
  switchPointCount: 4,
  standardOutletCount: 20,
  sofaChargingOutletCount: 2,
  heatingOutletCount: 1,
  bedEndFanOutletCount: 3,
  kitchenCounterOutletCount: 6,
  lightPointCount: 8,
  weakPointCount: 6,
  acCircuitCount: 4,
  highPowerCircuitCount: 2,
  bathroomHeaterCircuitCount: 2,
  smartToiletOutletCount: 2,
  washingMachineOutletCount: 1,
  dryerOutletCount: 1,
  waterPurifierOutletCount: 1,
  coldWaterPointCount: 8,
  hotWaterPointCount: 5,
  drainPointCount: 5,
  floorDrainPointCount: 3,
  strongConduitLengthM: 86.5,
  weakConduitLengthM: 22.4,
  waterPipeLengthM: 31.6,
  drainPipeLengthM: 17.2,
  lowConfidencePointCount: 0,
};
const hydropowerMapping = buildQuoteMapping(rows, defaultQuoteRules(), { building_area_m2: 88.66 }, { hydropowerSummary });
assert.ok(hydropowerMapping.items.some((item) => item.item_name === "普通插座点位" && item.quantity === 20));
assert.ok(hydropowerMapping.items.some((item) => item.item_name === "强电线管" && item.quantity === 86.5));
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "强电布线"), false);
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "水路布管"), false);
```

- [ ] **Step 2: Run failing quote test**

Run: `node --experimental-strip-types apps\web\lib\quote-mapping.test.ts`

Expected: FAIL because `hydropowerSummary` option and metrics do not exist.

- [ ] **Step 3: Add new `QuoteMetric` values and default rules**

In `apps/web/lib/quote-mapping.ts`, extend `QuoteMetric` and `ProjectQuoteMetric` with:

```ts
  | "hydropower_switch_point_count"
  | "hydropower_standard_outlet_count"
  | "hydropower_sofa_charging_outlet_count"
  | "hydropower_heating_outlet_count"
  | "hydropower_bed_end_fan_outlet_count"
  | "hydropower_kitchen_counter_outlet_count"
  | "hydropower_light_point_count"
  | "hydropower_weak_point_count"
  | "hydropower_ac_circuit_count"
  | "hydropower_high_power_circuit_count"
  | "hydropower_bathroom_heater_circuit_count"
  | "hydropower_smart_toilet_outlet_count"
  | "hydropower_washing_machine_outlet_count"
  | "hydropower_dryer_outlet_count"
  | "hydropower_water_purifier_outlet_count"
  | "hydropower_cold_water_point_count"
  | "hydropower_hot_water_point_count"
  | "hydropower_drain_point_count"
  | "hydropower_floor_drain_point_count"
  | "hydropower_strong_conduit_length_m"
  | "hydropower_weak_conduit_length_m"
  | "hydropower_water_pipe_length_m"
  | "hydropower_drain_pipe_length_m"
```

Replace default rules for `强电布线`, `弱电布线`, and `水路布管` with:

```ts
  quoteRule("开关点位", "hydropower_switch_point_count", "个", 0, 0, 35),
  quoteRule("普通插座点位", "hydropower_standard_outlet_count", "个", 0, 0, 45),
  quoteRule("沙发充电插座", "hydropower_sofa_charging_outlet_count", "个", 0, 0, 45),
  quoteRule("取暖设备插座", "hydropower_heating_outlet_count", "个", 0, 0, 45),
  quoteRule("床尾风扇插座", "hydropower_bed_end_fan_outlet_count", "个", 0, 0, 45),
  quoteRule("厨房台面插座", "hydropower_kitchen_counter_outlet_count", "个", 0, 0, 45),
  quoteRule("灯位点位", "hydropower_light_point_count", "个", 0, 0, 35),
  quoteRule("弱电点位", "hydropower_weak_point_count", "个", 0, 0, 45),
  quoteRule("空调专线", "hydropower_ac_circuit_count", "路", 0, 0, 120),
  quoteRule("大功率电器专线", "hydropower_high_power_circuit_count", "路", 0, 0, 120),
  quoteRule("浴霸/暖风机专线", "hydropower_bathroom_heater_circuit_count", "路", 0, 0, 120),
  quoteRule("智能马桶插座", "hydropower_smart_toilet_outlet_count", "个", 0, 0, 45),
  quoteRule("洗衣机插座", "hydropower_washing_machine_outlet_count", "个", 0, 0, 45),
  quoteRule("烘干机插座", "hydropower_dryer_outlet_count", "个", 0, 0, 45),
  quoteRule("净水机插座", "hydropower_water_purifier_outlet_count", "个", 0, 0, 45),
  quoteRule("冷水点位", "hydropower_cold_water_point_count", "个", 0, 0, 65),
  quoteRule("热水点位", "hydropower_hot_water_point_count", "个", 0, 0, 65),
  quoteRule("排水点位", "hydropower_drain_point_count", "个", 0, 0, 65),
  quoteRule("地漏点位", "hydropower_floor_drain_point_count", "个", 0, 0, 65),
  quoteRule("强电线管", "hydropower_strong_conduit_length_m", "M", 8, 2, 10),
  quoteRule("弱电线管", "hydropower_weak_conduit_length_m", "M", 6, 2, 8),
  quoteRule("给水管", "hydropower_water_pipe_length_m", "M", 10, 4, 12),
  quoteRule("排水管", "hydropower_drain_pipe_length_m", "M", 12, 4, 14),
```

- [ ] **Step 4: Accept hydropower summary in `buildQuoteMapping`**

Import `HydropowerSummary` and change the options type to include:

```ts
hydropowerSummary?: HydropowerSummary;
```

Add a map in project metric handling:

```ts
const hydropowerMetrics: Partial<Record<QuoteMetric, number>> = {
  hydropower_switch_point_count: options?.hydropowerSummary?.switchPointCount ?? 0,
  hydropower_standard_outlet_count: options?.hydropowerSummary?.standardOutletCount ?? 0,
  hydropower_sofa_charging_outlet_count: options?.hydropowerSummary?.sofaChargingOutletCount ?? 0,
  hydropower_heating_outlet_count: options?.hydropowerSummary?.heatingOutletCount ?? 0,
  hydropower_bed_end_fan_outlet_count: options?.hydropowerSummary?.bedEndFanOutletCount ?? 0,
  hydropower_kitchen_counter_outlet_count: options?.hydropowerSummary?.kitchenCounterOutletCount ?? 0,
  hydropower_light_point_count: options?.hydropowerSummary?.lightPointCount ?? 0,
  hydropower_weak_point_count: options?.hydropowerSummary?.weakPointCount ?? 0,
  hydropower_ac_circuit_count: options?.hydropowerSummary?.acCircuitCount ?? 0,
  hydropower_high_power_circuit_count: options?.hydropowerSummary?.highPowerCircuitCount ?? 0,
  hydropower_bathroom_heater_circuit_count: options?.hydropowerSummary?.bathroomHeaterCircuitCount ?? 0,
  hydropower_smart_toilet_outlet_count: options?.hydropowerSummary?.smartToiletOutletCount ?? 0,
  hydropower_washing_machine_outlet_count: options?.hydropowerSummary?.washingMachineOutletCount ?? 0,
  hydropower_dryer_outlet_count: options?.hydropowerSummary?.dryerOutletCount ?? 0,
  hydropower_water_purifier_outlet_count: options?.hydropowerSummary?.waterPurifierOutletCount ?? 0,
  hydropower_cold_water_point_count: options?.hydropowerSummary?.coldWaterPointCount ?? 0,
  hydropower_hot_water_point_count: options?.hydropowerSummary?.hotWaterPointCount ?? 0,
  hydropower_drain_point_count: options?.hydropowerSummary?.drainPointCount ?? 0,
  hydropower_floor_drain_point_count: options?.hydropowerSummary?.floorDrainPointCount ?? 0,
  hydropower_strong_conduit_length_m: options?.hydropowerSummary?.strongConduitLengthM ?? 0,
  hydropower_weak_conduit_length_m: options?.hydropowerSummary?.weakConduitLengthM ?? 0,
  hydropower_water_pipe_length_m: options?.hydropowerSummary?.waterPipeLengthM ?? 0,
  hydropower_drain_pipe_length_m: options?.hydropowerSummary?.drainPipeLengthM ?? 0,
};
```

- [ ] **Step 5: Update Excel grouping and JSON rules**

In `apps/web/lib/quote-excel.ts`, replace the “水电工程” item list with the new water/electric item names.

In `quote-rules-apartment-current.json`, replace the three area-based items with the new item list and metrics from Step 3.

- [ ] **Step 6: Run quote and Excel tests**

Run:

```powershell
node --experimental-strip-types apps\web\lib\quote-mapping.test.ts
node --experimental-strip-types apps\web\lib\quote-excel.test.ts
```

Expected: PASS after updating expected item counts and snapshots in tests.

- [ ] **Step 7: Commit**

```powershell
git add apps\web\lib\quote-mapping.ts apps\web\lib\quote-mapping.test.ts apps\web\lib\quote-excel.ts apps\web\lib\quote-excel.test.ts quote-rules-apartment-current.json
git commit -m "feat: map hydropower point metrics to quote"
```

---

### Task 5: Snapshot Persistence And Health Checks

**Files:**
- Modify: `apps/web/lib/review-snapshot.ts`
- Modify: `apps/web/lib/review-snapshot.test.ts`
- Modify: `apps/web/lib/quantity-health.ts`
- Modify: `apps/web/lib/quantity-health.test.ts`

**Interfaces:**
- Consumes: `HydropowerEstimate`.
- Produces: snapshots that restore hydropower state and health checks that flag unconfirmed or low-confidence estimates.

- [ ] **Step 1: Add snapshot round-trip test**

In `apps/web/lib/review-snapshot.test.ts`, add a snapshot containing:

```ts
hydropower: {
  reviewStatus: "confirmed",
  points: [{
    id: "一层-客厅-sofa_charging_outlet-1",
    floor: "一层",
    spaceName: "一层-客厅",
    spaceType: "客厅",
    kind: "sofa_charging_outlet",
    label: "沙发充电插座",
    quantity: 1,
    point: { x: 1.2, y: 3.4 },
    source: "virtual_point",
    confidence: "medium",
    note: "系统按空间轮廓生成推荐点位",
  }],
  pipes: [],
  summary: { ...EMPTY_HYDROPOWER_SUMMARY, sofaChargingOutletCount: 1 },
}
```

Assert `parseReviewSnapshot(...).hydropower?.reviewStatus === "confirmed"`.

- [ ] **Step 2: Run failing snapshot test**

Run: `node --experimental-strip-types apps\web\lib\review-snapshot.test.ts`

Expected: FAIL because snapshot schema ignores `hydropower`.

- [ ] **Step 3: Add hydropower to snapshot schema**

In `apps/web/lib/review-snapshot.ts`, import `HydropowerEstimate`, add it to the snapshot type, include it in `buildReviewSnapshot`, and parse it with a defensive fallback:

```ts
hydropower: isHydropowerEstimate(raw.hydropower) ? raw.hydropower : undefined,
```

Implement `isHydropowerEstimate` by checking `points` and `pipes` are arrays, `summary` is an object, and `reviewStatus` is one of `auto_estimated`, `confirmed`, `needs_review`.

- [ ] **Step 4: Add health tests**

In `apps/web/lib/quantity-health.test.ts`, add:

```ts
const hydropowerInfo = buildQuantityHealthChecks({
  rows: [baseRow],
  summary: { ...summary, building_area_m2: 88.66 },
  hydropower: { points: [], pipes: [], summary: EMPTY_HYDROPOWER_SUMMARY, reviewStatus: "auto_estimated" },
});
assert.ok(hydropowerInfo.some((check) => check.message.includes("水电点位为系统推荐估算")));

const hydropowerWarning = buildQuantityHealthChecks({
  rows: [baseRow],
  summary: { ...summary, building_area_m2: 88.66 },
  hydropower: { points: [], pipes: [], summary: { ...EMPTY_HYDROPOWER_SUMMARY, lowConfidencePointCount: 3 }, reviewStatus: "auto_estimated" },
});
assert.ok(hydropowerWarning.some((check) => check.message.includes("水电点位缺少坐标")));
```

- [ ] **Step 5: Implement health checks**

In `apps/web/lib/quantity-health.ts`, extend the input type with `hydropower?: HydropowerEstimate`, then add:

```ts
if (input.hydropower?.reviewStatus === "auto_estimated") {
  checks.push({
    id: "hydropower-auto-estimated",
    severity: "info",
    message: "水电点位为系统推荐估算，导出客户报价前建议复核。",
    spaceNames: [],
  });
}
if ((input.hydropower?.summary.lowConfidencePointCount ?? 0) > 0) {
  checks.push({
    id: "hydropower-low-confidence",
    severity: "warning",
    message: "部分水电点位缺少坐标，管线只能按数量系数估算，请检查空间轮廓或复核点位。",
    spaceNames: [],
  });
}
```

- [ ] **Step 6: Run snapshot and health tests**

Run:

```powershell
node --experimental-strip-types apps\web\lib\review-snapshot.test.ts
node --experimental-strip-types apps\web\lib\quantity-health.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps\web\lib\review-snapshot.ts apps\web\lib\review-snapshot.test.ts apps\web\lib\quantity-health.ts apps\web\lib\quantity-health.test.ts
git commit -m "feat: persist and check hydropower estimates"
```

---

### Task 6: Workbench Review Panel And Drawing Layer

**Files:**
- Create: `apps/web/components/hydropower-review-panel.tsx`
- Modify: `apps/web/components/upload-workbench.tsx`
- Modify: `apps/web/components/drawing-review.tsx`
- Modify: `apps/web/components/quote-excel-export.test.ts`

**Interfaces:**
- Consumes: `HydropowerEstimate`, `buildHydropowerEstimate`, `DrawingGeometry`.
- Produces: visible review panel, drawing overlay, and quote/export flow using hydropower summary.

- [ ] **Step 1: Create the review panel component**

Create `apps/web/components/hydropower-review-panel.tsx`:

```tsx
import type { HydropowerEstimate, HydropowerPointKind } from "@/lib/types";

type Props = {
  estimate: HydropowerEstimate | null;
  onConfirm: () => void;
  onPointQuantityChange: (id: string, quantity: number) => void;
};

const KIND_LABELS: Record<HydropowerPointKind, string> = {
  switch: "开关点位",
  standard_outlet: "普通插座",
  sofa_charging_outlet: "沙发充电插座",
  heating_outlet: "取暖设备插座",
  bed_end_fan_outlet: "床尾风扇插座",
  kitchen_counter_outlet: "厨房台面插座",
  light: "灯位",
  weak_point: "弱电点位",
  ac_circuit: "空调专线",
  high_power_circuit: "大功率电器专线",
  bathroom_heater_circuit: "浴霸/暖风机专线",
  smart_toilet_outlet: "智能马桶插座",
  washing_machine_outlet: "洗衣机插座",
  dryer_outlet: "烘干机插座",
  water_purifier_outlet: "净水机插座",
  cold_water: "冷水点",
  hot_water: "热水点",
  drain: "排水点",
  floor_drain: "地漏",
};

export function HydropowerReviewPanel({ estimate, onConfirm, onPointQuantityChange }: Props) {
  if (!estimate) return null;
  const grouped = Map.groupBy(estimate.points, (point) => `${point.floor}｜${point.spaceName}`);
  return (
    <section className="hydropowerReviewPanel">
      <div className="sectionHeader">
        <div>
          <h2>水电点位复核</h2>
          <p>系统按空间和图形轮廓生成推荐点位，管线为按图估算。</p>
        </div>
        <button type="button" onClick={onConfirm}>确认水电点位</button>
      </div>
      <div className="hydropowerSummary">
        <span>强电线管 {estimate.summary.strongConduitLengthM} M</span>
        <span>弱电线管 {estimate.summary.weakConduitLengthM} M</span>
        <span>给水管 {estimate.summary.waterPipeLengthM} M</span>
        <span>排水管 {estimate.summary.drainPipeLengthM} M</span>
      </div>
      {[...grouped.entries()].map(([group, points]) => (
        <details key={group} open>
          <summary>{group} · {points.length} 个推荐点位</summary>
          <div className="hydropowerPointGrid">
            {points.map((point) => (
              <label key={point.id}>
                <span>{KIND_LABELS[point.kind] ?? point.label}</span>
                <input type="number" min="0" step="1" value={point.quantity} onChange={(event) => onPointQuantityChange(point.id, Number(event.target.value))} />
              </label>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Wire hydropower state in workbench**

In `apps/web/components/upload-workbench.tsx`:

```ts
import { buildHydropowerEstimate } from "@/lib/hydropower-estimate";
import { HydropowerReviewPanel } from "@/components/hydropower-review-panel";
import type { HydropowerEstimate } from "@/lib/types";
```

Add state:

```ts
const [hydropowerOverride, setHydropowerOverride] = useState<HydropowerEstimate | null>(null);
const hydropowerEstimate = useMemo(
  () => buildHydropowerEstimate(rows, drawing, hydropowerOverride),
  [rows, drawing, hydropowerOverride],
);
```

Add handlers:

```ts
function handleHydropowerConfirm() {
  setHydropowerOverride({ ...hydropowerEstimate, reviewStatus: "confirmed" });
}

function handleHydropowerPointQuantityChange(id: string, quantity: number) {
  const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : 0;
  setHydropowerOverride({
    ...hydropowerEstimate,
    points: hydropowerEstimate.points.map((point) => point.id === id ? { ...point, quantity: safeQuantity } : point),
    reviewStatus: "needs_review",
  });
}
```

Pass `hydropowerSummary` to `buildQuoteMapping` and Excel export options:

```ts
buildQuoteMapping(rows, quoteRules, summary, { hydropowerSummary: hydropowerEstimate.summary, acceptedHealthCheckKeys })
```

Render:

```tsx
<HydropowerReviewPanel
  estimate={hydropowerEstimate}
  onConfirm={handleHydropowerConfirm}
  onPointQuantityChange={handleHydropowerPointQuantityChange}
/>
```

- [ ] **Step 3: Add drawing overlay props and rendering**

In `apps/web/components/drawing-review.tsx`, add props:

```ts
hydropowerPoints?: HydropowerPoint[];
```

Add a layer toggle:

```tsx
const [showHydropowerPoints, setShowHydropowerPoints] = useState(true);
<label className="drawingLayerToggle"><input type="checkbox" checked={showHydropowerPoints} onChange={(event) => setShowHydropowerPoints(event.target.checked)} />水电点位 {hydropowerPoints?.length ?? 0}</label>
```

Render circles:

```tsx
{showHydropowerPoints && hydropowerPoints?.filter((point) => point.point).map((point) => (
  <g key={point.id} className={`svgHydropowerPoint ${point.confidence}`}>
    <circle cx={point.point!.x} cy={point.point!.y} r="0.08" />
    <title>{point.label} · {point.spaceName}</title>
  </g>
))}
```

Pass `hydropowerPoints={hydropowerEstimate.points}` from `upload-workbench.tsx`.

- [ ] **Step 4: Persist hydropower in snapshot calls**

In snapshot export call:

```ts
buildReviewSnapshot({ rows, summary, comparison, sourceFileName, calibrationFileName, acceptedHealthCheckKeys, manualQuoteQuantities, hydropower: hydropowerEstimate })
```

In snapshot import success path:

```ts
setHydropowerOverride(parsed.hydropower ?? null);
```

- [ ] **Step 5: Run frontend helper tests**

Run:

```powershell
node --experimental-strip-types apps\web\components\quote-excel-export.test.ts
node --experimental-strip-types apps\web\lib\quote-mapping.test.ts
node --experimental-strip-types apps\web\lib\review-snapshot.test.ts
node --experimental-strip-types apps\web\lib\quantity-health.test.ts
```

Expected: PASS after adjusting helper expectations.

- [ ] **Step 6: Commit**

```powershell
git add apps\web\components\hydropower-review-panel.tsx apps\web\components\upload-workbench.tsx apps\web\components\drawing-review.tsx apps\web\components\quote-excel-export.test.ts
git commit -m "feat: review hydropower virtual points"
```

---

### Task 7: Documentation, Full Verification, And Manual QA

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/cad-quote-drawing-spec-v1.md`
- Modify: `docs/cad-quote-drawing-spec-v1.docx`
- Modify tests only if item counts changed due new default rules.

**Interfaces:**
- Consumes: completed hydropower feature.
- Produces: updated project guidance and verified build.

- [ ] **Step 1: Update docs**

In `AGENTS.md` and `docs/cad-quote-drawing-spec-v1.md`, replace area-based water/electric wording with:

```text
水电报价默认不再按建筑面积直接计价。系统根据空间类型、空间轮廓、门窗、柜体、洁具和楼层信息生成带坐标的水电推荐点位，并基于推荐点位估算强电线管、弱电线管、给水管和排水管延米。该估算用于客户报价草稿，属于系统推荐估算，不等于 CAD 水电施工图实测；报价员可在水电点位复核面板确认或调整数量。
```

- [ ] **Step 2: Regenerate docx**

Use the same Python `python-docx` flow already used for this repository's spec document. If the previous script is not checked in, use a short one-off Python command only for document generation, not source editing, and verify `docs/cad-quote-drawing-spec-v1.docx` changes.

- [ ] **Step 3: Run full backend and frontend verification**

Run:

```powershell
python -m pytest server\tests -q
node --experimental-strip-types apps\web\lib\hydropower-estimate.test.ts
node --experimental-strip-types apps\web\lib\quote-mapping.test.ts
node --experimental-strip-types apps\web\lib\review-snapshot.test.ts
node --experimental-strip-types apps\web\lib\quantity-health.test.ts
node --experimental-strip-types apps\web\lib\quote-excel.test.ts
node --experimental-strip-types apps\web\components\quote-excel-export.test.ts
node node_modules\next\dist\bin\next build apps\web
git diff --check
```

Expected:

- Backend: all tests pass.
- Node helper tests: pass; existing `MODULE_TYPELESS_PACKAGE_JSON` warning is acceptable.
- Next build: succeeds.
- `git diff --check`: no output.

- [ ] **Step 4: Manual local QA**

Start services:

```powershell
python -m uvicorn server.app.main:app --host 127.0.0.1 --port 8010
node node_modules\next\dist\bin\next dev apps\web --hostname 127.0.0.1 --port 3010
```

Verify in browser:

- 首页默认项目加载。
- 水电点位复核面板 appears.
- 客厅 has sofa charging and heating outlet candidates.
- 卧室 has bed-end fan outlet candidate.
- 厨房 has 6 counter outlets.
- Drawing review shows the water/electric point toggle and visible points.
- Exported Excel has water/electric item rows instead of `强电布线`, `弱电布线`, `水路布管` area rows.

- [ ] **Step 5: Commit**

```powershell
git add AGENTS.md docs\cad-quote-drawing-spec-v1.md docs\cad-quote-drawing-spec-v1.docx
git commit -m "docs: document hydropower virtual estimate"
```

---

## Self-Review

- Spec coverage: Tasks cover virtual point generation, three precision layers through source/confidence, pipe estimation from coordinates with fallback, villa multi-space accumulation, quote mapping, Excel output, review UI, drawing overlay, snapshot persistence, health warnings, and documentation.
- Placeholder scan: The plan contains no unfinished placeholder markers; each task has concrete files, commands, and expected outcomes.
- Type consistency: `HydropowerPoint`, `HydropowerPipeEstimate`, `HydropowerSummary`, and `HydropowerEstimate` are defined in Task 1 and consumed consistently by later tasks.
