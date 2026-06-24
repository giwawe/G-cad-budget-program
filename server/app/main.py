from dataclasses import asdict
import json

from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from server.app.dxf.parser import DrawingGeometry, parse_dxf_review, parse_dxf_spaces
from server.app.models import OpeningInput, ProjectDefaults, SpaceInput
from server.app.quantity.calculator import calculate_quantity_row
from server.app.quantity.comparison import compare_quantity_rows

app = FastAPI(title="CAD Budget Quantity Validation API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3010",
        "http://localhost:3010",
    ],
    allow_origin_regex=r"^http://((localhost)|(127\.0\.0\.1)|(10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(192\.168\.\d{1,3}\.\d{1,3})|(172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})):(3000|3010)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/sample-quantities")
def sample_quantities():
    defaults = ProjectDefaults(project_height_m=2.8, default_window_height_m=1.5)
    spaces = [
        SpaceInput(
            floor="一层",
            name="一层-客厅",
            boundary_points_m=[(0, 0), (6, 0), (6, 5), (0, 5)],
            wall_lengths_m=[6, 5, 4],
            windows=[OpeningInput(width_m=3.2)],
            doors=[OpeningInput(width_m=0.9)],
        ),
        SpaceInput(
            floor="一层",
            name="一层-卫生间",
            boundary_points_m=[(0, 0), (2.4, 0), (2.4, 2.2), (0, 2.2)],
            wall_lengths_m=[2.4, 2.2, 2.4, 2.2],
            windows=[OpeningInput(width_m=0.8, height_m=0.8)],
            doors=[OpeningInput(width_m=0.8)],
        ),
        SpaceInput(
            floor="一层",
            name="一层-电梯井",
            boundary_points_m=[(0, 0), (1.8, 0), (1.8, 1.8), (0, 1.8)],
        ),
    ]
    return [asdict(calculate_quantity_row(space, defaults)) for space in spaces]


@app.post("/api/parse-dxf")
async def parse_dxf(file: UploadFile):
    defaults = ProjectDefaults()
    spaces = parse_dxf_spaces(await file.read(), defaults)
    return [asdict(calculate_quantity_row(space, defaults)) for space in spaces]


@app.post("/api/parse-dxf-review")
async def parse_dxf_review_endpoint(file: UploadFile):
    defaults = ProjectDefaults()
    parsed = parse_dxf_review(await file.read(), defaults)
    rows = [asdict(calculate_quantity_row(space, defaults)) for space in parsed.spaces]
    return {"rows": rows, "drawing": _serialize_drawing(parsed.drawing), "summary": _summarize_rows(rows)}


@app.post("/api/compare-dxf-calibration")
async def compare_dxf_calibration(file: UploadFile, calibration: UploadFile):
    defaults = ProjectDefaults()
    expected_rows = json.loads((await calibration.read()).decode("utf-8"))
    spaces = parse_dxf_spaces(await file.read(), defaults)
    rows = [asdict(calculate_quantity_row(space, defaults)) for space in spaces]
    stable_rows = [_stable_quantity_row(row) for row in rows]
    return {"rows": rows, "summary": _summarize_rows(rows), "comparison": compare_quantity_rows(stable_rows, expected_rows)}


def _serialize_drawing(drawing: DrawingGeometry) -> dict:
    return {
        "spaces": [{"name": space.name, "points": [_point_to_dict(point) for point in space.points]} for space in drawing.spaces],
        "walls": [_segment_to_dict(segment) for segment in drawing.walls],
        "measured_walls": [_segment_to_dict(segment) for segment in drawing.measured_walls],
        "tile_walls": [_segment_to_dict(segment) for segment in drawing.tile_walls],
        "new_walls": [_segment_to_dict(segment) for segment in drawing.new_walls],
        "demolition_walls": [_segment_to_dict(segment) for segment in drawing.demolition_walls],
        "base_cabinets": [_segment_to_dict(segment) for segment in drawing.base_cabinets],
        "wall_cabinets": [_segment_to_dict(segment) for segment in drawing.wall_cabinets],
        "custom_cabinets": [_segment_to_dict(segment) for segment in drawing.custom_cabinets],
        "toilets": [_point_to_dict(point) for point in drawing.toilets],
        "bathroom_vanities": [_point_to_dict(point) for point in drawing.bathroom_vanities],
        "window_openings": [
            {
                "segments": [_segment_to_dict(segment) for segment in window.segments],
                "boundary_points": [_point_to_dict(point) for point in window.boundary_points],
                "width_m": window.width_m,
                "height_m": window.height_m,
                "included_in_wall_deduction": window.included_in_wall_deduction,
                "space_names": window.space_names,
            }
            for window in drawing.window_openings
        ],
        "windows": [_segment_to_dict(segment) for segment in drawing.windows],
        "door_openings": [
            {
                "segment": _segment_to_dict(door.segment),
                "thickness_m": door.thickness_m,
                "width_m": door.width_m,
                "deduct_from_wall": door.deduct_from_wall,
                "review_required": door.review_required,
                "opening_type": door.opening_type,
                "quote_category": door.quote_category,
                "space_names": door.space_names,
            }
            for door in drawing.door_openings
        ],
        "doors": [_segment_to_dict(segment) for segment in drawing.doors],
        "base_segments": [_segment_to_dict(segment) for segment in drawing.base_segments],
        "base_texts": [{"text": item.text, "point": _point_to_dict(item.point)} for item in drawing.base_texts],
        "bbox": drawing.bbox,
    }


def _point_to_dict(point: tuple[float, float]) -> dict[str, float]:
    return {"x": float(point[0]), "y": float(point[1])}


def _segment_to_dict(segment: tuple[tuple[float, float], tuple[float, float]]) -> dict:
    start, end = segment
    return {"start": _point_to_dict(start), "end": _point_to_dict(end)}


def _summarize_rows(rows: list[dict]) -> dict[str, float | int]:
    return {
        "space_count": len(rows),
        "floor_area_total_m2": round(sum(row["floor_area_m2"] for row in rows), 2),
        "wall_measure_length_total_m": round(sum(row["wall_measure_length_m"] for row in rows), 2),
        "window_area_total_m2": round(sum(row["window_area_m2"] for row in rows), 2),
        "latex_paint_area_total_m2": round(sum(row["latex_paint_area_m2"] for row in rows), 2),
    }


def _stable_quantity_row(row: dict) -> dict:
    return {
        "space_name": row["space_name"],
        "space_type": row["space_type"],
        "floor_area_m2": row["floor_area_m2"],
        "wall_measure_length_m": row["wall_measure_length_m"],
        "window_width_total_m": row["window_width_total_m"],
        "windowsill_length_m": row["windowsill_length_m"],
        "curtain_wall_width_m": row["curtain_wall_width_m"],
        "window_area_m2": row["window_area_m2"],
        "door_width_total_m": row["door_width_total_m"],
        "door_deduct_area_m2": row["door_deduct_area_m2"],
        "wall_gross_area_m2": row["wall_gross_area_m2"],
        "latex_paint_area_m2": row["latex_paint_area_m2"],
        "wall_tile_measure_length_m": row["wall_tile_measure_length_m"],
        "wall_tile_area_m2": row["wall_tile_area_m2"],
        "floor_tile_piece_count": row["floor_tile_piece_count"],
        "electrical_scope_area_m2": row["electrical_scope_area_m2"],
        "plumbing_scope_area_m2": row["plumbing_scope_area_m2"],
        "new_wall_length_m": row["new_wall_length_m"],
        "new_wall_area_m2": row["new_wall_area_m2"],
        "demolition_wall_length_m": row["demolition_wall_length_m"],
        "demolition_wall_area_m2": row["demolition_wall_area_m2"],
        "interior_door_count": row["interior_door_count"],
        "bathroom_door_count": row["bathroom_door_count"],
        "sliding_door_area_m2": row["sliding_door_area_m2"],
        "sliding_door_casing_length_m": row["sliding_door_casing_length_m"],
        "kitchen_base_cabinet_length_m": row["kitchen_base_cabinet_length_m"],
        "kitchen_wall_cabinet_length_m": row["kitchen_wall_cabinet_length_m"],
        "custom_cabinet_area_m2": row["custom_cabinet_area_m2"],
        "toilet_count": row["toilet_count"],
        "bathroom_vanity_count": row["bathroom_vanity_count"],
        "status": row["status"],
        "anomalies": row["anomalies"],
    }
