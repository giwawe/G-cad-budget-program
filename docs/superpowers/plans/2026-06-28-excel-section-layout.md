# Excel Section Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make exported Excel drafts follow the real quote template structure: fixed public sections plus dynamic room sections, with every section subtotaled and template totals preserved.

**Architecture:** Keep the change inside `apps/web/lib/quote-excel.ts`. Use fixed public section definitions for whole-house/template categories and generate room sections from actual quote mapping space names. Keep manual draft rows as zero/blank rows when there is no automatic quote item.

**Tech Stack:** TypeScript helper functions, existing quote mapping model, Node `--experimental-strip-types` tests.

---

### Task 1: Section Model

**Files:**
- Modify: `apps/web/lib/quote-excel.ts`
- Test: `apps/web/lib/quote-excel.test.ts`

- [ ] Split template sections into fixed public sections and room item ordering.
- [ ] Generate room sections from `mapping.items` and manual rows with `space_name !== "全屋"`.
- [ ] Route space construction items to `${space_name}工程`; route whole-house, material, door, fixture, curtain, and manual template items to fixed public sections.

### Task 2: Blank Rows And Totals

**Files:**
- Modify: `apps/web/lib/quote-excel.ts`
- Test: `apps/web/lib/quote-excel.test.ts`

- [ ] Keep all fixed public sections even if their automatic item list is empty.
- [ ] Keep manual draft rows with blank quantity and prices unless an automatic item with the same name already exists.
- [ ] Keep one subtotal after every section and preserve direct fee, management fee, tax, and project total rows.

### Task 3: Verification

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/cad-quote-drawing-spec-v1.md`

- [ ] Document the Excel section rule.
- [ ] Run `node --experimental-strip-types apps\web\lib\quote-excel.test.ts`.
- [ ] Run `node node_modules\next\dist\bin\next build apps\web`.
- [ ] Run `git diff --check`.
