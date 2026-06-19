from pathlib import Path

from fastapi.testclient import TestClient

from server.app.main import app
from server.app.quantity.geometry import line_length
from server.tests.dxf_fixtures import build_simple_quote_dxf


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


def test_lan_frontend_origin_is_allowed_for_dxf_upload():
    client = TestClient(app)

    response = client.options(
        "/api/parse-dxf",
        headers={"Origin": "http://192.168.2.37:3010", "Access-Control-Request-Method": "POST"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://192.168.2.37:3010"


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

    measured_walls = payload["drawing"]["measured_walls"]
    measured_length = round(
        sum(round(line_length((segment["start"]["x"], segment["start"]["y"]), (segment["end"]["x"], segment["end"]["y"])), 2) for segment in measured_walls),
        2,
    )
    assert len(measured_walls) > 0
    assert measured_length == payload["summary"]["wall_measure_length_total_m"]
