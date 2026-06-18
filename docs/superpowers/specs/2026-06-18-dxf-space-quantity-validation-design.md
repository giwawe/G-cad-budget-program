# DXF Space Quantity Validation Design

## Summary

Build a web-based DXF space quantity validation tool for renovation estimators. The first version focuses on reading standardized DXF layers, calculating per-space quantities, surfacing calculation evidence, and letting estimators review accuracy before the product expands into full quote generation.

## Users And Workflow

The primary user is a renovation company estimator. Designers add lightweight quote-assist layers to CAD, export DXF, and upload it to the web system. The estimator reviews a space quantity table, checks anomalies, adjusts defaults such as height, and compares system output against manual measurement.

## Standardized CAD Input

The MVP assumes standardized layers:

- `QUOTE_ROOM` for closed room boundaries.
- `QUOTE_WALL` for real wall or constructible wall geometry.
- `QUOTE_OPENING` for open or non-wall boundaries.
- `QUOTE_WINDOW` for window width markers.
- `QUOTE_DOOR` for door width markers.
- `QUOTE_FLOOR` for floor markers.
- `QUOTE_HEIGHT` for optional space-level height.
- `QUOTE_EXT_WALL` for future exterior wall measurement.

`QUOTE_ROOM` is never used directly as wall construction length. Wall quantities use `QUOTE_WALL`, which prevents open living/dining boundaries from inflating wall-area quantities.

## Architecture

Use a monorepo with a Next.js frontend and a Python FastAPI backend. The backend owns DXF parsing, geometric matching, calculation rules, and API responses. The frontend owns upload, project defaults, the quantity review table, and status display.

DXF parsing is isolated behind a service boundary so test fixtures can exercise calculation logic without requiring real CAD files in every test.

## Backend Components

- `server/app/main.py`: FastAPI application and health endpoint.
- `server/app/models.py`: Pydantic response and domain models.
- `server/app/quantity/calculator.py`: deterministic quantity formulas.
- `server/app/quantity/geometry.py`: polygon area, length, and containment helpers.
- `server/app/quantity/classification.py`: space type and exclusion classification.
- `server/app/dxf/parser.py`: DXF layer extraction, initially implemented as an interface and testable adapter.
- `server/tests/`: unit tests for formulas and classification.

## Frontend Components

- `apps/web/app/page.tsx`: first screen for upload and review workflow.
- `apps/web/components/quantity-table.tsx`: quantity review table.
- `apps/web/lib/types.ts`: API-facing TypeScript types.

The first UI is intentionally operational rather than marketing-like: project defaults at the top, parsed results below, and anomalies visible in the table.

## Quantity Rules

Core rules:

```text
floor_area = area(QUOTE_ROOM)
ceiling_area = floor_area
wall_measure_length = sum(associated QUOTE_WALL lengths)
wall_gross_area = wall_measure_length * height
window_area = sum(window_width * window_height)
latex_paint_area = wall_gross_area - window_area
doors are recorded but not deducted by default
```

Height priority:

```text
space QUOTE_HEIGHT > floor default height > project default height
```

Door/window height priority:

```text
entity height annotation > space-type default > project default
```

## Error Handling

The parser must report anomalies instead of silently producing trusted numbers:

- room boundary is not closed
- room has no name
- text is not inside a room
- wall cannot be associated with a room
- window cannot be associated with a room
- overlapping room boundaries
- unit scale is missing or suspicious

Rows with blocking geometry issues should be marked `needs_fix`; rows that calculate but need estimator review should be marked `pending_review`.

## Testing

Unit tests cover:

- polygon area and perimeter helpers
- wall-area formulas with window deduction and no door deduction
- height priority rules
- space type classification, including excluded shafts
- sample quantity-row calculation from normalized geometry

Integration tests will later cover real DXF fixtures once the first standardized files exist.

## First Milestone

The first milestone is a working repository with:

- product and CAD standard docs
- backend quantity model and deterministic calculators
- frontend review-table skeleton
- project scripts for development and tests

