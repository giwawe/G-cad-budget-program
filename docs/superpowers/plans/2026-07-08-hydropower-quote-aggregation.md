# Hydropower Quote Aggregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch water/electric quote output from fine-grained point rules to customer-facing aggregate water/electric categories.

**Architecture:** Keep `hydropower-estimate.ts` as the fine-grained source of truth. Add a small aggregation helper that converts `HydropowerSummary` into aggregate quote metrics, then make `quote-mapping.ts`, `quote-excel.ts`, and the quote rule JSON use those aggregate metrics. Keep `HydropowerReviewPanel` on fine-grained points so designers can still review sources.

**Tech Stack:** Next.js 15, React 19, TypeScript helper tests via `node --experimental-strip-types`.

## Global Constraints

- Do not batch delete files or directories.
- Use `apply_patch` for source edits.
- Final Excel quote table outputs water/electric aggregate rows only, not room-level water/electric details.
- Hydropower review panel keeps fine-grained point sources.
- Strong electric section is named `强弱电工程`.
- `筒灯/射灯` is one item; default quantity 0 until manually supported.
- No `灯带`, no separate `空调专线`, no `回水管`, no outdoor water/drain items.

---

### Task 1: Aggregate Hydropower Metrics

**Files:**
- Create: `apps/web/lib/hydropower-quote-aggregation.ts`
- Test: `apps/web/lib/hydropower-quote-aggregation.test.ts`

**Interfaces:**
- Consumes: `HydropowerSummary` from `apps/web/lib/types.ts`.
- Produces: `aggregateHydropowerQuoteSummary(summary: HydropowerSummary): HydropowerQuoteSummary`.

- [ ] Write failing tests for strong outlet, equipment circuit, drain point, and pipe aggregation.
- [ ] Implement the helper with exact aggregate field names.
- [ ] Run: `node --experimental-strip-types apps\web\lib\hydropower-quote-aggregation.test.ts`.

### Task 2: Quote Mapping Uses Aggregate Metrics

**Files:**
- Modify: `apps/web/lib/quote-mapping.ts`
- Modify: `apps/web/lib/quote-mapping.test.ts`
- Modify: `quote-rules-apartment-current.json`

**Interfaces:**
- Consumes: `aggregateHydropowerQuoteSummary`.
- Produces default quote rules for `强电插座`, `开关`, `灯位`, `筒灯/射灯`, `设备专线`, `弱电点位`, `强电线管`, `弱电线管`, `强电箱`, `弱电箱`, `分配电箱`, `给水点`, `热水点`, `排水点`, `给水管`, `排水管`.

- [ ] Write failing tests that old fine-grained hydropower item names are absent from `defaultQuoteRules()`.
- [ ] Write failing tests that quote mapping outputs aggregate rows with reference prices.
- [ ] Add aggregate metrics to `QuoteMetric`.
- [ ] Replace fine-grained default hydropower rules with aggregate rules.
- [ ] Map aggregate metrics from `hydropowerSummary` in project metrics.
- [ ] Update JSON default rules to match `defaultQuoteRules()`.
- [ ] Run: `node --experimental-strip-types apps\web\lib\quote-mapping.test.ts`.

### Task 3: Excel Output Uses Aggregate Water/Electric Rows

**Files:**
- Modify: `apps/web/lib/quote-excel.ts`
- Modify: `apps/web/lib/quote-excel.test.ts`

**Interfaces:**
- Consumes: aggregate quote mapping items.
- Produces: Excel `水电工程` rows grouped under aggregate item names only.

- [ ] Write failing tests that Excel includes `强电插座`, `设备专线`, `排水点` and excludes old fine-grained hydropower item names.
- [ ] Rename Excel internal section label to `强弱电工程` in notes/order where shown.
- [ ] Update `TEMPLATE_PRICES` and `FIXED_TEMPLATE_SECTIONS` hydropower item list.
- [ ] Run: `node --experimental-strip-types apps\web\lib\quote-excel.test.ts`.

### Task 4: Review Panel Summary Shows Aggregate Totals

**Files:**
- Modify: `apps/web/components/hydropower-review-panel.tsx`
- Test: `apps/web/components/quote-excel-export.test.ts`

**Interfaces:**
- Consumes: `aggregateHydropowerQuoteSummary`.
- Produces: project-level aggregate cards while keeping fine-grained point rows.

- [ ] Add lightweight source test assertions for aggregate labels and fine-grained grouping.
- [ ] Show aggregate summary cards for strong outlet, switch, light, equipment circuit, water/drain points, and pipes.
- [ ] Keep fine-grained per-space details unchanged.
- [ ] Run: `node --experimental-strip-types apps\web\components\quote-excel-export.test.ts`.

### Task 5: Verification And Commit

**Files:**
- Modify docs only if behavior wording in `AGENTS.md` or `docs/cad-quote-drawing-spec-v1.md` is stale.

- [ ] Run hydropower, quote mapping, Excel, export tests.
- [ ] Run `node node_modules\next\dist\bin\next build apps\web`.
- [ ] Run `git diff --check`.
- [ ] Commit implementation.
