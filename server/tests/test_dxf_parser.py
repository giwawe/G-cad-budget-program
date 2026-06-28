from pathlib import Path

from server.app.dxf import parser
from server.app.models import ProjectDefaults
from server.tests.dxf_fixtures import (
    build_balcony_wall_tile_dxf,
    build_background_wall_dxf,
    build_bedroom_bathroom_door_dxf,
    build_bathroom_fixture_dxf,
    build_closed_custom_cabinet_dxf,
    build_closed_window_polyline_dxf,
    build_closed_door_polyline_dxf,
    build_custom_cabinet_dxf,
    build_deep_rectangular_window_dxf,
    build_demolition_wall_dxf,
    build_ext_wall_area_dxf,
    build_ext_wall_area_repeated_endpoint_dxf,
    build_auto_door_type_dxf,
    build_insert_door_dxf,
    build_kitchen_cabinet_dxf,
    build_kitchen_cabinet_outline_dxf,
    build_l_shaped_window_dxf,
    build_new_wall_dxf,
    build_simple_quote_dxf,
    build_window_on_short_wall_dxf,
    build_window_height_marker_dxf,
    build_new_wall_height_marker_dxf,
    build_two_room_quote_dxf_with_duplicate_close_point,
)


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


def test_real_second_fixture_groups_window_entities_into_physical_windows():
    fixture = Path(__file__).parent / "fixtures" / "test-case-2.dxf"

    review = parser.parse_dxf_review(fixture.read_bytes(), ProjectDefaults())

    assert len(review.drawing.window_openings) == 8
    assert len(review.drawing.windows) == 45
    assert all(window.width_m > 0 for window in review.drawing.window_openings)
    assert {window.height_m for window in review.drawing.window_openings} == {1.8}
    assert all(window.included_in_wall_deduction for window in review.drawing.window_openings)
    assert all(window.space_names for window in review.drawing.window_openings)
    assert all(len(window.boundary_points) >= 4 for window in review.drawing.window_openings)


def test_duplicate_close_point_does_not_assign_wall_to_every_room():
    spaces = parser.parse_dxf_spaces(build_two_room_quote_dxf_with_duplicate_close_point(), ProjectDefaults())

    assert len(spaces) == 2
    assert [round(sum(space.wall_lengths_m), 2) for space in spaces] == [5.0, 0]


def test_closed_quote_window_polyline_keeps_closing_segment_in_review_drawing():
    review = parser.parse_dxf_review(build_closed_window_polyline_dxf(), ProjectDefaults())

    assert review.spaces[0].floor == "一层"
    assert len(review.drawing.window_openings) == 1
    assert len(review.drawing.windows) == 4
    assert review.drawing.window_openings[0].width_m == 2.0
    assert review.drawing.window_openings[0].height_m == 1.8
    assert review.drawing.window_openings[0].included_in_wall_deduction is True
    assert review.drawing.window_openings[0].boundary_points == [(1.0, 0.0), (3.0, 0.0), (3.0, 0.24), (1.0, 0.24)]


def test_deep_rectangular_window_uses_long_side_as_width_not_perimeter():
    review = parser.parse_dxf_review(build_deep_rectangular_window_dxf(), ProjectDefaults())

    assert review.spaces[0].windows[0].width_m == 2.0
    assert review.drawing.window_openings[0].width_m == 2.0


def test_curtain_wall_width_candidate_uses_window_wall_not_longest_wall():
    review = parser.parse_dxf_review(build_window_on_short_wall_dxf(), ProjectDefaults())

    assert review.spaces[0].wall_lengths_m == [6.0, 3.0, 6.0, 3.0]
    assert review.spaces[0].curtain_wall_width_candidate_m == 3.0
    assert review.spaces[0].curtain_wall_width_source == "matched_window_wall"


def test_quote_window_height_marker_overrides_default_height():
    review = parser.parse_dxf_review(build_window_height_marker_dxf(), ProjectDefaults())

    assert review.spaces[0].windows[0].height_m == 1.5
    assert review.drawing.window_openings[0].height_m == 1.5


def test_l_shaped_window_uses_l_shape_length_for_curtain_wall_width():
    review = parser.parse_dxf_review(build_l_shaped_window_dxf(), ProjectDefaults())

    assert review.spaces[0].windows[0].width_m == 3.4
    assert review.drawing.window_openings[0].width_m == 3.4
    assert review.spaces[0].curtain_wall_width_candidate_m == 3.4
    assert review.spaces[0].curtain_wall_width_source == "matched_l_shape_window"
    assert review.spaces[0].anomalies == []


def test_quote_ext_wall_closed_polyline_calculates_building_area():
    review = parser.parse_dxf_review(build_ext_wall_area_dxf(), ProjectDefaults())

    assert review.drawing.building_area_m2 == 20
    assert review.drawing.exterior_wall_boundaries == [[(-1.0, -1.0), (4.0, -1.0), (4.0, 3.0), (-1.0, 3.0)]]


def test_quote_ext_wall_repeated_endpoint_polyline_calculates_building_area():
    review = parser.parse_dxf_review(build_ext_wall_area_repeated_endpoint_dxf(), ProjectDefaults())

    assert review.drawing.building_area_m2 == 20
    assert review.drawing.exterior_wall_boundaries == [[(-1.0, -1.0), (4.0, -1.0), (4.0, 3.0), (-1.0, 3.0)]]


def test_quote_wall_tile_segments_are_assigned_to_space():
    review = parser.parse_dxf_review(build_balcony_wall_tile_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-阳台"
    assert review.spaces[0].wall_tile_lengths_m == [3.0, 2.0]
    assert review.drawing.tile_walls == [((0.0, 0.0), (3.0, 0.0)), ((3.0, 0.0), (3.0, 2.0))]


def test_quote_new_wall_segments_are_assigned_to_space():
    review = parser.parse_dxf_review(build_new_wall_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-客厅"
    assert review.spaces[0].new_wall_lengths_m == [2.4, 1.6]
    assert review.drawing.new_walls == [((2.0, 0.5), (2.0, 2.9)), ((3.2, 0.5), (4.8, 0.5))]


def test_quote_new_wall_height_and_thickness_markers_are_assigned_to_segment():
    review = parser.parse_dxf_review(build_new_wall_height_marker_dxf(), ProjectDefaults())

    assert review.spaces[0].new_wall_lengths_m == [2.4]
    assert review.spaces[0].new_wall_heights_m == [1.2]
    assert review.spaces[0].new_wall_thicknesses_m == [0.24]


def test_quote_demo_wall_segments_are_assigned_to_space():
    review = parser.parse_dxf_review(build_demolition_wall_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-客厅"
    assert review.spaces[0].demolition_wall_lengths_m == [2.4, 1.6]
    assert review.drawing.demolition_walls == [((2.0, 0.5), (2.0, 2.9)), ((3.2, 0.5), (4.8, 0.5))]


def test_quote_background_wall_segments_are_assigned_to_space():
    review = parser.parse_dxf_review(build_background_wall_dxf(), ProjectDefaults())

    assert review.spaces[0].background_wall_lengths_m == [3.2]
    assert review.spaces[0].background_wall_heights_m == [2.6]
    assert review.drawing.background_walls == [((1.0, 3.5), (4.2, 3.5))]


def test_quote_cabinet_segments_are_assigned_to_kitchen_space():
    review = parser.parse_dxf_review(build_kitchen_cabinet_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-厨房"
    assert review.spaces[0].base_cabinet_lengths_m == [3.0, 1.3]
    assert review.spaces[0].wall_cabinet_lengths_m == [3.0]
    assert review.drawing.base_cabinets == [((0.3, 0.3), (3.3, 0.3)), ((3.3, 0.3), (3.3, 1.6))]
    assert review.drawing.wall_cabinets == [((0.3, 0.3), (3.3, 0.3))]


def test_quote_kitchen_cabinet_outlines_use_projection_length_not_perimeter():
    review = parser.parse_dxf_review(build_kitchen_cabinet_outline_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-厨房"
    assert review.spaces[0].base_cabinet_lengths_m == [4.4]
    assert review.spaces[0].wall_cabinet_lengths_m == [1.2]
    assert review.drawing.base_cabinets == []
    assert review.drawing.wall_cabinets == []
    assert review.drawing.base_cabinet_boundaries == [[(0.3, 0.3), (3.3, 0.3), (3.3, 0.9), (0.9, 0.9), (0.9, 2.3), (0.3, 2.3)]]
    assert review.drawing.wall_cabinet_boundaries == [[(3.6, 0.3), (4.8, 0.3), (4.8, 0.65), (3.6, 0.65)]]


def test_quote_custom_cabinet_segments_are_assigned_to_space():
    review = parser.parse_dxf_review(build_custom_cabinet_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-主卧"
    assert review.spaces[0].custom_cabinet_lengths_m == [3.0, 2.0]
    assert review.spaces[0].custom_cabinet_heights_m == [None, 0.8]
    assert review.drawing.custom_cabinets == [((0.3, 0.3), (3.3, 0.3)), ((0.3, 0.8), (2.3, 0.8))]


def test_closed_quote_custom_cabinet_uses_projection_length_not_perimeter():
    review = parser.parse_dxf_review(build_closed_custom_cabinet_dxf(), ProjectDefaults())

    assert review.spaces[0].custom_cabinet_lengths_m == [3.0]
    assert review.drawing.custom_cabinets == [((3.3, 0.9), (0.3, 0.9))]


def test_quote_bathroom_fixture_points_are_assigned_to_bathroom_space():
    review = parser.parse_dxf_review(build_bathroom_fixture_dxf(), ProjectDefaults())

    assert review.spaces[0].name == "一层-卫生间"
    assert review.spaces[0].toilet_count == 1
    assert review.spaces[0].bathroom_vanity_count == 2
    assert review.drawing.toilets == [(0.7, 0.7)]
    assert review.drawing.bathroom_vanities == [(1.8, 0.7), (1.8, 1.5)]


def test_quote_door_insert_is_recognized_as_one_door_opening():
    review = parser.parse_dxf_review(build_insert_door_dxf(), ProjectDefaults())

    assert len(review.drawing.doors) == 1
    assert [door.width_m for door in review.spaces[0].doors] == [0.9]
    assert review.spaces[0].doors[0].quote_category == "interior_door"
    assert review.spaces[0].doors[0].opening_type == "normal_door"
    assert review.drawing.doors[0] == ((2.05, 0.065), (2.95, 0.065))
    assert review.drawing.door_openings[0].thickness_m == 0.13


def test_auto_door_type_distinguishes_interior_entry_and_sliding_doors():
    review = parser.parse_dxf_review(build_auto_door_type_dxf(), ProjectDefaults())

    assert [door.quote_category for door in review.spaces[0].doors] == ["interior_door", "interior_door", "entry_door", "sliding_door", "sliding_door"]
    assert review.spaces[0].doors[1].opening_type == "normal_door"
    assert review.spaces[0].doors[3].opening_type == "suspected_large_opening"
    assert review.spaces[0].doors[4].width_m == 1.5


def test_bedroom_bathroom_shared_door_is_bathroom_door():
    review = parser.parse_dxf_review(build_bedroom_bathroom_door_dxf(), ProjectDefaults())

    spaces_by_name = {space.name: space for space in review.spaces}

    assert spaces_by_name["一层-主卧"].doors[0].quote_category == "bathroom_door"
    assert spaces_by_name["一层-公卫"].doors[0].quote_category == "bathroom_door"
    assert review.drawing.door_openings[0].quote_category == "bathroom_door"


def test_closed_quote_door_polyline_is_normalized_to_one_centerline():
    review = parser.parse_dxf_review(build_closed_door_polyline_dxf(), ProjectDefaults())

    assert len(review.drawing.doors) == 1
    assert review.drawing.doors[0] == ((1.0, 0.06), (1.9, 0.06))
    assert review.drawing.door_openings[0].thickness_m == 0.12
    assert [door.width_m for door in review.spaces[0].doors] == [0.9]


def test_mtext_format_codes_are_removed():
    assert parser.clean_mtext(r"{\fSimSun|b0|i0|c134|p2;厨房}") == "厨房"
