from server.app.models import OpeningInput, ProjectDefaults, ReviewStatus, SpaceInput
from server.app.quantity.calculator import calculate_quantity_row, resolve_height
from server.app.quantity.classification import classify_space_type, is_excluded_space
from server.app.quantity.geometry import contains_point, polygon_area, polyline_length


def test_polygon_area_and_closed_length():
    points = [(0, 0), (4, 0), (4, 3), (0, 3)]

    assert polygon_area(points) == 12
    assert polyline_length(points, closed=True) == 14
    assert contains_point(points, (2, 2)) is True
    assert contains_point(points, (5, 2)) is False


def test_latex_area_adds_door_width_back_before_optional_deduction():
    defaults = ProjectDefaults(project_height_m=2.8, default_window_height_m=1.5, default_door_height_m=2.1)
    space = SpaceInput(
        floor="一层",
        name="一层-餐厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 5), (0, 5)],
        wall_lengths_m=[6, 5, 4],
        windows=[OpeningInput(width_m=3.2)],
        doors=[OpeningInput(width_m=0.9)],
    )

    row = calculate_quantity_row(space, defaults)

    assert row.floor_area_m2 == 30
    assert row.floor_tile_piece_count == 28
    assert row.electrical_scope_area_m2 == 30
    assert row.plumbing_scope_area_m2 == 30
    assert row.wall_measure_length_m == 15
    assert row.wall_gross_area_m2 == 42
    assert row.window_area_m2 == 4.8
    assert row.door_width_total_m == 0.9
    assert row.latex_paint_area_m2 == 39.72
    assert row.windowsill_length_m == 3.2
    assert row.wall_tile_area_m2 == 0
    assert row.waterproof_area_m2 == 0
    assert row.status == ReviewStatus.pending_review
    assert "乳胶漆基数 15m + 门洞 0.9m" in row.evidence
    assert "已选门洞扣减 0m2" in row.evidence


def test_floor_tile_piece_count_uses_750x1500_tile_with_5_percent_loss_and_ceiling():
    space = SpaceInput(
        floor="一层",
        name="一层-客厅",
        boundary_points_m=[(0, 0), (4.48, 0), (4.48, 1), (0, 1)],
        wall_lengths_m=[4.48, 1, 4.48, 1],
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.floor_area_m2 == 4.48
    assert row.floor_tile_piece_count == 5


def test_kitchen_wall_tile_uses_default_tile_height_and_deducts_all_openings():
    defaults = ProjectDefaults(project_height_m=2.8, default_window_height_m=1.5, default_door_height_m=2.1)
    space = SpaceInput(
        floor="一层",
        name="一层-厨房",
        boundary_points_m=[(0, 0), (2.8, 0), (2.8, 1.6), (0, 1.6)],
        wall_lengths_m=[2.8, 1.6, 2.8, 1.92],
        windows=[OpeningInput(width_m=0.8, height_m=1.0)],
        doors=[OpeningInput(width_m=1.0)],
    )

    row = calculate_quantity_row(space, defaults)

    assert row.wall_measure_length_m == 9.12
    assert row.wall_tile_area_m2 == 19.9
    assert row.waterproof_area_m2 == 7.22


def test_bathroom_wall_tile_uses_default_tile_height_and_waterproof_uses_1_8m():
    defaults = ProjectDefaults(project_height_m=2.8, default_window_height_m=1.5, default_door_height_m=2.1)
    space = SpaceInput(
        floor="一层",
        name="一层-卫生间",
        boundary_points_m=[(0, 0), (2.4, 0), (2.4, 2.2), (0, 2.2)],
        wall_lengths_m=[2.4, 2.2, 2.4, 2.2],
        windows=[OpeningInput(width_m=0.8, height_m=0.8)],
        doors=[OpeningInput(width_m=0.8)],
    )

    row = calculate_quantity_row(space, defaults)

    assert row.wall_tile_area_m2 == 20.68
    assert row.waterproof_area_m2 == 21.84


def test_balcony_has_waterproof_but_no_automatic_wall_tile():
    space = SpaceInput(
        floor="一层",
        name="一层-阳台",
        boundary_points_m=[(0, 0), (3, 0), (3, 2), (0, 2)],
        wall_lengths_m=[3, 2, 3, 2],
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.wall_tile_area_m2 == 0
    assert row.waterproof_area_m2 == 9


def test_balcony_wall_tile_uses_marked_tile_wall_lengths_and_actual_height():
    space = SpaceInput(
        floor="一层",
        name="一层-阳台",
        boundary_points_m=[(0, 0), (3, 0), (3, 2), (0, 2)],
        wall_lengths_m=[3, 2, 3, 2],
        wall_tile_lengths_m=[3, 2],
        height_m=2.8,
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.wall_tile_measure_length_m == 5
    assert row.wall_tile_area_m2 == 14
    assert row.waterproof_area_m2 == 9


def test_kitchen_wall_tile_ignores_marked_tile_wall_lengths_and_uses_default_tile_height():
    space = SpaceInput(
        floor="一层",
        name="一层-厨房",
        boundary_points_m=[(0, 0), (3, 0), (3, 2), (0, 2)],
        wall_lengths_m=[3, 2, 3, 2],
        wall_tile_lengths_m=[3],
        height_m=2.8,
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.wall_tile_measure_length_m == 10
    assert row.wall_tile_area_m2 == 25


def test_new_wall_area_uses_marked_new_wall_lengths_and_actual_height():
    space = SpaceInput(
        floor="一层",
        name="一层-客厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 4), (0, 4)],
        wall_lengths_m=[6, 4, 6, 4],
        new_wall_lengths_m=[2.4, 1.6],
        height_m=2.8,
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.new_wall_length_m == 4
    assert row.new_wall_area_m2 == 11.2


def test_demolition_wall_area_uses_marked_demolition_wall_lengths_and_actual_height():
    space = SpaceInput(
        floor="一层",
        name="一层-客厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 4), (0, 4)],
        wall_lengths_m=[6, 4, 6, 4],
        demolition_wall_lengths_m=[2.4, 1.6],
        height_m=2.8,
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.demolition_wall_length_m == 4
    assert row.demolition_wall_area_m2 == 11.2


def test_kitchen_cabinet_lengths_separate_base_and_wall_cabinets_only_for_kitchen():
    defaults = ProjectDefaults()
    kitchen = SpaceInput(
        floor="一层",
        name="一层-厨房",
        boundary_points_m=[(0, 0), (3.6, 0), (3.6, 2.4), (0, 2.4)],
        wall_lengths_m=[3.6, 2.4, 3.6, 2.4],
        base_cabinet_lengths_m=[3.0, 1.3],
        wall_cabinet_lengths_m=[3.0],
    )
    bedroom = SpaceInput(
        floor="一层",
        name="一层-卧室",
        boundary_points_m=[(0, 0), (3.6, 0), (3.6, 2.4), (0, 2.4)],
        wall_lengths_m=[3.6, 2.4, 3.6, 2.4],
        base_cabinet_lengths_m=[2.0],
        wall_cabinet_lengths_m=[1.0],
    )

    kitchen_row = calculate_quantity_row(kitchen, defaults)
    bedroom_row = calculate_quantity_row(bedroom, defaults)

    assert kitchen_row.kitchen_base_cabinet_length_m == 4.3
    assert kitchen_row.kitchen_wall_cabinet_length_m == 3.0
    assert bedroom_row.kitchen_base_cabinet_length_m == 0
    assert bedroom_row.kitchen_wall_cabinet_length_m == 0


def test_custom_cabinet_quantities_use_default_height_and_low_cabinet_length_outside_kitchen():
    defaults = ProjectDefaults()
    bedroom = SpaceInput(
        floor="一层",
        name="一层-卧室",
        boundary_points_m=[(0, 0), (3.6, 0), (3.6, 3.0), (0, 3.0)],
        wall_lengths_m=[3.6, 3.0, 3.6, 3.0],
        custom_cabinet_lengths_m=[3.0, 2.0],
        custom_cabinet_heights_m=[None, 0.8],
    )
    kitchen = SpaceInput(
        floor="一层",
        name="一层-厨房",
        boundary_points_m=[(0, 0), (3.6, 0), (3.6, 3.0), (0, 3.0)],
        wall_lengths_m=[3.6, 3.0, 3.6, 3.0],
        custom_cabinet_lengths_m=[3.0, 2.0],
        custom_cabinet_heights_m=[None, 0.8],
    )

    bedroom_row = calculate_quantity_row(bedroom, defaults)
    kitchen_row = calculate_quantity_row(kitchen, defaults)

    assert bedroom_row.custom_cabinet_area_m2 == 9.8
    assert kitchen_row.custom_cabinet_area_m2 == 0


def test_bathroom_fixture_counts_default_to_one_per_bathroom_and_allow_explicit_counts():
    defaults = ProjectDefaults()
    bathroom = SpaceInput(
        floor="一层",
        name="一层-卫生间",
        boundary_points_m=[(0, 0), (2.6, 0), (2.6, 2.2), (0, 2.2)],
        wall_lengths_m=[2.6, 2.2, 2.6, 2.2],
    )
    bathroom_with_points = SpaceInput(
        floor="一层",
        name="一层-卫生间",
        boundary_points_m=[(0, 0), (2.6, 0), (2.6, 2.2), (0, 2.2)],
        wall_lengths_m=[2.6, 2.2, 2.6, 2.2],
        toilet_count=1,
        bathroom_vanity_count=2,
    )
    bedroom = SpaceInput(
        floor="一层",
        name="一层-卧室",
        boundary_points_m=[(0, 0), (2.6, 0), (2.6, 2.2), (0, 2.2)],
        wall_lengths_m=[2.6, 2.2, 2.6, 2.2],
        toilet_count=1,
        bathroom_vanity_count=1,
    )

    bathroom_row = calculate_quantity_row(bathroom, defaults)
    bathroom_with_points_row = calculate_quantity_row(bathroom_with_points, defaults)
    bedroom_row = calculate_quantity_row(bedroom, defaults)

    assert bathroom_row.toilet_count == 1
    assert bathroom_row.bathroom_vanity_count == 1
    assert bathroom_with_points_row.toilet_count == 1
    assert bathroom_with_points_row.bathroom_vanity_count == 2
    assert bedroom_row.toilet_count == 0
    assert bedroom_row.bathroom_vanity_count == 0


def test_curtain_wall_width_uses_longest_wall_for_supported_windowed_spaces():
    space = SpaceInput(
        floor="一层",
        name="一层-主卧",
        boundary_points_m=[(0, 0), (4.2, 0), (4.2, 3.4), (0, 3.4)],
        wall_lengths_m=[4.2, 3.4, 4.2, 3.4],
        windows=[OpeningInput(width_m=1.6)],
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.curtain_wall_width_m == 4.2
    assert row.curtain_wall_width_source == "fallback_longest_wall"


def test_curtain_wall_width_prefers_window_wall_candidate():
    space = SpaceInput(
        floor="一层",
        name="一层-主卧",
        boundary_points_m=[(0, 0), (6, 0), (6, 3), (0, 3)],
        wall_lengths_m=[6, 3, 6, 3],
        windows=[OpeningInput(width_m=1.2)],
        curtain_wall_width_candidate_m=3,
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.curtain_wall_width_m == 3
    assert row.curtain_wall_width_source == "matched_window_wall"


def test_l_shaped_window_curtain_wall_width_uses_l_shape_candidate():
    space = SpaceInput(
        floor="一层",
        name="一层-餐厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 4), (0, 4)],
        wall_lengths_m=[6, 4, 6, 4],
        curtain_wall_width_candidate_m=3.4,
        curtain_wall_width_source="matched_l_shape_window",
        windows=[OpeningInput(width_m=1.8)],
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.curtain_wall_width_m == 3.4
    assert row.curtain_wall_width_source == "matched_l_shape_window"
    assert row.anomalies == []


def test_curtain_wall_width_is_zero_for_kitchen_bathroom_and_corridor():
    defaults = ProjectDefaults()
    for name in ["一层-厨房", "一层-卫生间", "一层-过道"]:
        row = calculate_quantity_row(
            SpaceInput(
                floor="一层",
                name=name,
                boundary_points_m=[(0, 0), (3, 0), (3, 2), (0, 2)],
                wall_lengths_m=[3, 2, 3, 2],
                windows=[OpeningInput(width_m=1.2)],
            ),
            defaults,
        )

        assert row.curtain_wall_width_m == 0
        assert row.curtain_wall_width_source == "not_applicable"


def test_large_door_opening_adds_door_width_back_and_deducts_selected_opening_area():
    defaults = ProjectDefaults(project_height_m=2.8, default_window_height_m=1.5, default_door_height_m=2.1)
    space = SpaceInput(
        name="客厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 5), (0, 5)],
        wall_lengths_m=[6, 5, 4],
        doors=[OpeningInput(width_m=1.8, deduct_from_wall=True, opening_type="large_opening")],
    )

    row = calculate_quantity_row(space, defaults)

    assert row.door_deduct_area_m2 == 3.78
    assert row.latex_paint_area_m2 == 43.26
    assert "已选门洞扣减 3.78m2" in row.evidence


def test_suspected_large_door_opening_requires_review_without_default_deduction():
    space = SpaceInput(
        name="客厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 5), (0, 5)],
        wall_lengths_m=[6, 5, 4],
        doors=[OpeningInput(width_m=1.3, review_required=True, opening_type="suspected_large_opening")],
    )

    row = calculate_quantity_row(space, ProjectDefaults())

    assert row.door_deduct_area_m2 == 0
    assert any("疑似大洞口" in anomaly for anomaly in row.anomalies)


def test_interior_door_count_only_counts_normal_doors():
    living_room = SpaceInput(
        name="客厅",
        boundary_points_m=[(0, 0), (6, 0), (6, 5), (0, 5)],
        wall_lengths_m=[6, 5, 4],
        doors=[
            OpeningInput(width_m=0.9, opening_type="normal_door"),
            OpeningInput(width_m=0.9, opening_type="normal_door", quote_category="interior_door"),
            OpeningInput(width_m=0.9, opening_type="normal_door", quote_category="entry_door"),
            OpeningInput(width_m=1.1, opening_type="normal_door", quote_category="sliding_door"),
            OpeningInput(width_m=1.3, review_required=True, opening_type="suspected_large_opening"),
        ],
    )
    bedroom = SpaceInput(
        name="客卧",
        boundary_points_m=[(0, 0), (3, 0), (3, 3), (0, 3)],
        wall_lengths_m=[3, 3, 3, 3],
        doors=[
            OpeningInput(width_m=0.9, opening_type="normal_door", quote_category="interior_door"),
            OpeningInput(width_m=0.8, opening_type="normal_door", quote_category="bathroom_door"),
        ],
    )
    bathroom = SpaceInput(
        name="公卫",
        boundary_points_m=[(0, 0), (2, 0), (2, 2), (0, 2)],
        wall_lengths_m=[2, 2, 2, 2],
        doors=[OpeningInput(width_m=0.8, opening_type="normal_door", quote_category="bathroom_door")],
    )

    living_room_row = calculate_quantity_row(living_room, ProjectDefaults())
    bedroom_row = calculate_quantity_row(bedroom, ProjectDefaults())
    bathroom_row = calculate_quantity_row(bathroom, ProjectDefaults())

    assert living_room_row.interior_door_count == 0
    assert bedroom_row.interior_door_count == 1
    assert bedroom_row.bathroom_door_count == 0
    assert bathroom_row.interior_door_count == 0
    assert bathroom_row.bathroom_door_count == 1


def test_kitchen_sliding_door_area_and_casing_length_use_default_door_height():
    kitchen = SpaceInput(
        name="厨房",
        boundary_points_m=[(0, 0), (3, 0), (3, 3), (0, 3)],
        wall_lengths_m=[3, 3, 3, 3],
        doors=[OpeningInput(width_m=1.6, opening_type="normal_door", quote_category="sliding_door")],
    )

    row = calculate_quantity_row(kitchen, ProjectDefaults())

    assert row.sliding_door_area_m2 == 3.36
    assert row.sliding_door_casing_length_m == 5.8


def test_height_priority_space_then_floor_then_project():
    defaults = ProjectDefaults(project_height_m=2.8)

    assert resolve_height(defaults, SpaceInput(name="卧室", boundary_points_m=[], height_m=3.0)) == 3.0
    assert resolve_height(defaults, SpaceInput(name="卧室", boundary_points_m=[], floor_default_height_m=2.9)) == 2.9
    assert resolve_height(defaults, SpaceInput(name="卧室", boundary_points_m=[])) == 2.8


def test_classification_and_excluded_spaces():
    assert classify_space_type("一层-主卧") == "卧室"
    assert classify_space_type("一层-客卧") == "卧室"
    assert classify_space_type("一层-公卫") == "卫生间"
    assert classify_space_type("二层-楼梯过道") == "楼梯过道"
    assert classify_space_type("衣帽间") == "衣帽间"
    assert classify_space_type("储藏室") == "储物间"
    assert classify_space_type("洗衣房") == "洗衣房"
    assert classify_space_type("入户门厅") == "门厅"
    assert is_excluded_space("一层-电梯井") is True

    row = calculate_quantity_row(
        SpaceInput(name="一层-电梯井", boundary_points_m=[(0, 0), (1, 0), (1, 1), (0, 1)]),
        ProjectDefaults(),
    )

    assert row.status == ReviewStatus.excluded
