import json
from pathlib import Path

from fastapi.testclient import TestClient

from server.app.main import app
from server.app.quantity.geometry import line_length
from server.tests.dxf_fixtures import build_ext_wall_area_dxf, build_simple_quote_dxf


def test_parse_dxf_upload_returns_quantity_rows():
    client = TestClient(app)

    response = client.post("/api/parse-dxf", files={"file": ("quote.dxf", build_simple_quote_dxf(), "application/dxf")})

    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 1
    assert rows[0]["space_name"] == "一层-客厅"
    assert rows[0]["floor_area_m2"] == 30
    assert rows[0]["wall_measure_length_m"] == 15
    assert rows[0]["window_area_m2"] == 4.8
    assert rows[0]["door_width_total_m"] == 0.9
    assert rows[0]["latex_paint_area_m2"] == 37.2


def test_parse_real_dxf_upload_fixture_returns_rows():
    client = TestClient(app)
    fixture = Path(__file__).parent / "fixtures" / "test-case.dxf"

    response = client.post("/api/parse-dxf", files={"file": ("test-case.dxf", fixture.read_bytes(), "application/dxf")})

    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 9
    assert "厨房" in [row["space_name"] for row in rows]


def test_parse_real_dxf_upload_matches_calibrated_golden_fixture():
    client = TestClient(app)
    fixture = Path(__file__).parent / "fixtures" / "test-case.dxf"
    golden = Path(__file__).parent / "fixtures" / "test-case.golden.json"

    response = client.post("/api/parse-dxf", files={"file": ("test-case.dxf", fixture.read_bytes(), "application/dxf")})

    assert response.status_code == 200
    assert _stable_quantity_rows(response.json()) == json.loads(golden.read_text(encoding="utf-8"))


def test_compare_dxf_calibration_upload_returns_no_differences_for_golden_fixture():
    client = TestClient(app)
    fixture = Path(__file__).parent / "fixtures" / "test-case.dxf"
    golden = Path(__file__).parent / "fixtures" / "test-case.golden.json"

    response = client.post(
        "/api/compare-dxf-calibration",
        files={
            "file": ("test-case.dxf", fixture.read_bytes(), "application/dxf"),
            "calibration": ("test-case.golden.json", golden.read_bytes(), "application/json"),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["space_count"] == 9
    assert payload["comparison"]["passed"] is True
    assert payload["comparison"]["matched_count"] == 9
    assert payload["comparison"]["failed_count"] == 0
    assert payload["comparison"]["differences"] == []


def test_lan_frontend_origin_is_allowed_for_dxf_upload():
    client = TestClient(app)

    response = client.options(
        "/api/parse-dxf",
        headers={"Origin": "http://192.168.2.37:3010", "Access-Control-Request-Method": "POST"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://192.168.2.37:3010"


def _stable_quantity_rows(rows: list[dict]) -> list[dict]:
    return [
        {
            "space_name": row["space_name"],
            "space_type": row["space_type"],
            "floor_area_m2": row["floor_area_m2"],
            "wall_measure_length_m": row["wall_measure_length_m"],
            "window_width_total_m": row["window_width_total_m"],
            "window_area_m2": row["window_area_m2"],
            "door_width_total_m": row["door_width_total_m"],
            "door_deduct_area_m2": row["door_deduct_area_m2"],
            "wall_gross_area_m2": row["wall_gross_area_m2"],
            "latex_paint_area_m2": row["latex_paint_area_m2"],
            "status": row["status"],
            "anomalies": row["anomalies"],
        }
        for row in rows
    ]


def test_parse_real_dxf_review_payload_includes_drawing_summary_and_measured_walls():
    client = TestClient(app)
    fixture = Path(__file__).parent / "fixtures" / "test-case.dxf"

    response = client.post("/api/parse-dxf-review", files={"file": ("test-case.dxf", fixture.read_bytes(), "application/dxf")})

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["rows"]) == 9
    assert payload["summary"]["space_count"] == 9
    assert payload["drawing"]["bbox"]["max_x"] > payload["drawing"]["bbox"]["min_x"]
    assert len(payload["drawing"]["spaces"]) == 9
    assert len(payload["drawing"]["base_segments"]) > 200
    assert "客厅" in [space["name"] for space in payload["drawing"]["spaces"]]

    assert payload["drawing"]["window_openings"]
    first_window = payload["drawing"]["window_openings"][0]
    assert first_window["width_m"] > 0
    assert first_window["height_m"] == 1.5
    assert first_window["included_in_wall_deduction"] is True
    assert first_window["space_names"]

    measured_walls = payload["drawing"]["measured_walls"]
    measured_length = round(
        sum(round(line_length((segment["start"]["x"], segment["start"]["y"]), (segment["end"]["x"], segment["end"]["y"])), 2) for segment in measured_walls),
        2,
    )
    assert len(measured_walls) > 0
    assert measured_length == payload["summary"]["wall_measure_length_total_m"]


def test_parse_dxf_review_summary_includes_building_area_from_quote_ext_wall():
    client = TestClient(app)

    response = client.post("/api/parse-dxf-review", files={"file": ("ext-wall.dxf", build_ext_wall_area_dxf(), "application/dxf")})

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["building_area_m2"] == 20
    assert payload["drawing"]["building_area_m2"] == 20
    assert payload["drawing"]["exterior_wall_boundaries"] == [
        [
            {"x": -1.0, "y": -1.0},
            {"x": 4.0, "y": -1.0},
            {"x": 4.0, "y": 3.0},
            {"x": -1.0, "y": 3.0},
        ]
    ]


def test_compare_dxf_calibration_reports_building_area_summary_difference():
    client = TestClient(app)
    calibration_payload = {
        "summary": {"building_area_m2": 18},
        "rows": [
            {
                "space_name": "一层-客厅",
                "space_type": "客厅",
                "floor_area_m2": 6,
                "wall_measure_length_m": 3,
                "window_width_total_m": 0,
                "window_area_m2": 0,
                "door_width_total_m": 0,
                "door_deduct_area_m2": 0,
                "wall_gross_area_m2": 8.4,
                "latex_paint_area_m2": 8.4,
                "status": "pending_review",
                "anomalies": [],
            }
        ],
    }

    response = client.post(
        "/api/compare-dxf-calibration",
        files={
            "file": ("ext-wall.dxf", build_ext_wall_area_dxf(), "application/dxf"),
            "calibration": ("ext-wall.calibration.json", json.dumps(calibration_payload).encode("utf-8"), "application/json"),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["building_area_m2"] == 20
    assert payload["comparison"]["passed"] is False
    assert payload["comparison"]["summary_differences"] == [
        {
            "field": "building_area_m2",
            "actual": 20,
            "expected": 18,
            "delta": 2.0,
            "percent_delta": 11.11,
        }
    ]
