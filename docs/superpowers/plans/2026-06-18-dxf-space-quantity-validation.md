# DXF Space Quantity Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial monorepo skeleton and deterministic quantity-calculation core for the DXF space quantity validation tool.

**Architecture:** The repository uses a Next.js frontend and Python FastAPI backend. The backend exposes health and future parse endpoints, while quantity calculation is isolated in small Python modules with unit tests. The frontend starts as an operational upload-and-review shell centered on the quantity table.

**Tech Stack:** Next.js, TypeScript, Python, FastAPI, Pydantic, pytest, optional ezdxf for later DXF parsing.

---

## File Structure

- `package.json`: root scripts for web development.
- `apps/web/package.json`: web app dependencies.
- `apps/web/app/page.tsx`: first screen for project defaults, DXF upload placeholder, and sample review table.
- `apps/web/app/layout.tsx`: app metadata and global layout shell.
- `apps/web/app/globals.css`: restrained operational UI styling.
- `apps/web/components/quantity-table.tsx`: reusable quantity review table.
- `apps/web/lib/types.ts`: frontend quantity row types.
- `server/requirements.txt`: backend runtime and test dependencies.
- `server/app/main.py`: FastAPI app with health and sample quantity endpoint.
- `server/app/models.py`: Pydantic models for project defaults and quantity rows.
- `server/app/quantity/geometry.py`: deterministic geometry helpers.
- `server/app/quantity/classification.py`: space type and excluded-space classification.
- `server/app/quantity/calculator.py`: quantity formula implementation.
- `server/app/dxf/parser.py`: parser boundary for future ezdxf implementation.
- `server/tests/test_quantity_calculator.py`: formula and classification tests.

## Tasks

### Task 1: Repository Documentation

**Files:**
- Create: `docs/cad-quote-drawing-spec-v1.md`
- Create: `docs/mvp-requirements.md`
- Create: `docs/superpowers/specs/2026-06-18-dxf-space-quantity-validation-design.md`
- Create: `docs/superpowers/plans/2026-06-18-dxf-space-quantity-validation.md`

- [x] **Step 1: Save the CAD drawing standard**

Write the standardized quote layers, measurement rules, height priority, and anomaly policy.

- [x] **Step 2: Save the MVP requirements**

Write the user workflow, inputs, outputs, first-space scope, non-goals, and success metrics.

- [x] **Step 3: Save the design and implementation plan**

Record architecture and task breakdown before creating code.

### Task 2: Backend Quantity Core

**Files:**
- Create: `server/requirements.txt`
- Create: `server/app/__init__.py`
- Create: `server/app/main.py`
- Create: `server/app/models.py`
- Create: `server/app/quantity/__init__.py`
- Create: `server/app/quantity/geometry.py`
- Create: `server/app/quantity/classification.py`
- Create: `server/app/quantity/calculator.py`
- Create: `server/app/dxf/__init__.py`
- Create: `server/app/dxf/parser.py`
- Create: `server/tests/test_quantity_calculator.py`

- [ ] **Step 1: Write tests for quantity formulas**

Create tests that prove window area is deducted, door area is not deducted, excluded shaft spaces are detected, and height priority is deterministic.

- [ ] **Step 2: Implement geometry helpers**

Implement polygon area, polyline length, point-in-polygon, and line length helpers using plain Python.

- [ ] **Step 3: Implement classification and calculator modules**

Implement space type detection and quantity row calculation using normalized inputs.

- [ ] **Step 4: Add FastAPI endpoints**

Add `GET /health` and `GET /api/sample-quantities` so the web shell can render realistic rows before DXF parsing is wired.

- [ ] **Step 5: Run backend tests**

Run: `python -m pytest server/tests -v`

Expected: all tests pass.

### Task 3: Frontend Skeleton

**Files:**
- Create: `package.json`
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/components/quantity-table.tsx`
- Create: `apps/web/lib/types.ts`

- [ ] **Step 1: Create Next.js app shell**

Create a TypeScript app using the App Router with root scripts from the monorepo.

- [ ] **Step 2: Build the operational first screen**

Show project defaults, upload placeholder, recognized layer list, and a quantity review table.

- [ ] **Step 3: Keep UI focused on validation**

Avoid quote editing and final Excel export in the first screen. The primary action is reviewing DXF quantity accuracy.

### Task 4: Verification

**Files:**
- Modify as needed based on test output.

- [ ] **Step 1: Run backend tests**

Run: `python -m pytest server/tests -v`

Expected: all tests pass.

- [ ] **Step 2: Check git status**

Run: `git status --short`

Expected: only intentional project files are changed.

- [ ] **Step 3: Commit scaffold**

Run: `git add . && git commit -m "feat: scaffold dxf quantity validation project"`

Expected: commit succeeds.

