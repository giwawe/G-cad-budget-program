from pathlib import Path

from server.app.dxf import parser
from server.app.models import ProjectDefaults
from server.tests.dxf_fixtures import build_closed_window_polyline_dxf, build_simple_quote_dxf, build_two_room_quote_dxf_with_duplicate_close_point


def test_parse_standard_quote_dxf_into_space_input():
    spaces = parser.parse_dxf_spaces(build_simple_quote_dxf(), ProjectDefaults())

    assert len(spaces) == 1
    space = spaces[0]
    assert space.name == "一层-客厅"
    assert space.floor == "一层"
    assert space.boundary_points_m == [(0.0, 0.0), (6.0, 0.0), (6.0, 5.0), (0.0, 5.0), (0.0, 0.0)]
    assert space.wall_lengths_m == [6.0, 5.0, 4.0]
    assert [window.width_m for window in space.windows] == [3.2]
    assert [door.width_m for door in space.doors] == [0.9]
    assert space.anomalies == []


def test_parse_real_gbk_quote_dxf_from_fixture():
    fixture = Path(__file__).parent / "fixtures" / "test-case.dxf"

    spaces = parser.parse_dxf_spaces(fixture.read_bytes(), ProjectDefaults())

    assert len(spaces) == 9
    names = [space.name for space in spaces]
    assert "厨房" in names
    assert "主卫" in names
    assert "阳台" in names
    assert "客厅" in names
    assert all(space.name for space in spaces)


def test_duplicate_close_point_does_not_assign_wall_to_every_room():
    spaces = parser.parse_dxf_spaces(build_two_room_quote_dxf_with_duplicate_close_point(), ProjectDefaults())

    assert len(spaces) == 2
    assert [round(sum(space.wall_lengths_m), 2) for space in spaces] == [5.0, 0]


def test_closed_quote_window_polyline_keeps_closing_segment_in_review_drawing():
    review = parser.parse_dxf_review(build_closed_window_polyline_dxf(), ProjectDefaults())

    assert len(review.drawing.windows) == 4


def test_mtext_format_codes_are_removed():
    assert parser.clean_mtext(r"{\fSimSun|b0|i0|c134|p2;厨房}") == "厨房"
