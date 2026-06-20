from server.app.quantity.comparison import compare_quantity_rows


def test_compare_quantity_rows_reports_numeric_differences_by_space_name():
    actual_rows = [
        {
            "space_name": "厨房",
            "floor_area_m2": 4.48,
            "wall_measure_length_m": 9.12,
            "window_area_m2": 0,
            "latex_paint_area_m2": 25.54,
        }
    ]
    expected_rows = [
        {
            "space_name": "厨房",
            "floor_area_m2": 4.5,
            "wall_measure_length_m": 9.12,
            "window_area_m2": 0,
            "latex_paint_area_m2": 25.1,
        }
    ]

    result = compare_quantity_rows(actual_rows, expected_rows, absolute_tolerance=0.01)

    assert result["passed"] is False
    assert result["matched_count"] == 1
    assert result["failed_count"] == 1
    assert result["missing_spaces"] == []
    assert result["unexpected_spaces"] == []
    assert result["differences"] == [
        {
            "space_name": "厨房",
            "field": "floor_area_m2",
            "actual": 4.48,
            "expected": 4.5,
            "delta": -0.02,
            "percent_delta": -0.44,
        },
        {
            "space_name": "厨房",
            "field": "latex_paint_area_m2",
            "actual": 25.54,
            "expected": 25.1,
            "delta": 0.44,
            "percent_delta": 1.75,
        },
    ]


def test_compare_quantity_rows_passes_within_tolerance_and_flags_missing_spaces():
    actual_rows = [{"space_name": "客厅", "floor_area_m2": 36.52}]
    expected_rows = [{"space_name": "客厅", "floor_area_m2": 36.53}, {"space_name": "阳台", "floor_area_m2": 8.05}]

    result = compare_quantity_rows(actual_rows, expected_rows, absolute_tolerance=0.02)

    assert result["passed"] is False
    assert result["matched_count"] == 1
    assert result["failed_count"] == 0
    assert result["missing_spaces"] == ["阳台"]
    assert result["unexpected_spaces"] == []
    assert result["differences"] == []
