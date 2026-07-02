DEFAULT_NUMERIC_FIELDS = [
    "floor_area_m2",
    "wall_measure_length_m",
    "window_width_total_m",
    "windowsill_length_m",
    "curtain_wall_width_m",
    "window_area_m2",
    "door_width_total_m",
    "door_deduct_area_m2",
    "wall_gross_area_m2",
    "latex_paint_area_m2",
    "wall_tile_measure_length_m",
    "wall_tile_area_m2",
    "floor_tile_piece_count",
    "electrical_scope_area_m2",
    "plumbing_scope_area_m2",
    "new_wall_length_m",
    "new_wall_area_m2",
    "demolition_wall_length_m",
    "demolition_wall_area_m2",
    "background_wall_area_m2",
    "entry_door_count",
    "interior_door_count",
    "bathroom_door_count",
    "sliding_door_area_m2",
    "sliding_door_casing_length_m",
    "kitchen_base_cabinet_length_m",
    "kitchen_wall_cabinet_length_m",
    "custom_cabinet_area_m2",
    "toilet_count",
    "bathroom_vanity_count",
]
DEFAULT_SUMMARY_NUMERIC_FIELDS = ["building_area_m2"]


def compare_quantity_payload(
    actual_rows: list[dict],
    actual_summary: dict,
    expected_payload,
    *,
    numeric_fields: list[str] | None = None,
    summary_numeric_fields: list[str] | None = None,
    absolute_tolerance: float = 0.01,
) -> dict:
    expected_rows = expected_payload.get("rows", []) if isinstance(expected_payload, dict) else expected_payload
    expected_summary = expected_payload.get("summary", {}) if isinstance(expected_payload, dict) else {}
    result = compare_quantity_rows(
        actual_rows,
        expected_rows,
        numeric_fields=numeric_fields,
        absolute_tolerance=absolute_tolerance,
    )
    summary_differences = compare_quantity_summary(
        actual_summary,
        expected_summary,
        numeric_fields=summary_numeric_fields,
        absolute_tolerance=absolute_tolerance,
    )
    return {
        **result,
        "passed": result["passed"] and not summary_differences,
        "summary_differences": summary_differences,
    }


def compare_quantity_rows(
    actual_rows: list[dict],
    expected_rows: list[dict],
    *,
    numeric_fields: list[str] | None = None,
    absolute_tolerance: float = 0.01,
) -> dict:
    fields = numeric_fields or DEFAULT_NUMERIC_FIELDS
    actual_by_name = _rows_by_space_name(actual_rows)
    expected_by_name = _rows_by_space_name(expected_rows)
    actual_names = set(actual_by_name)
    expected_names = set(expected_by_name)

    differences = []
    failed_spaces = set()
    for space_name in sorted(actual_names & expected_names):
        actual = actual_by_name[space_name]
        expected = expected_by_name[space_name]
        for field in fields:
            if field not in actual or field not in expected:
                continue
            delta = round(float(actual[field]) - float(expected[field]), 2)
            if abs(delta) <= absolute_tolerance:
                continue
            failed_spaces.add(space_name)
            differences.append(
                {
                    "space_name": space_name,
                    "field": field,
                    "actual": actual[field],
                    "expected": expected[field],
                    "delta": delta,
                    "percent_delta": _percent_delta(float(actual[field]), float(expected[field])),
                }
            )

    missing_spaces = sorted(expected_names - actual_names)
    unexpected_spaces = sorted(actual_names - expected_names)
    return {
        "passed": not differences and not missing_spaces and not unexpected_spaces,
        "matched_count": len(actual_names & expected_names),
        "failed_count": len(failed_spaces),
        "missing_spaces": missing_spaces,
        "unexpected_spaces": unexpected_spaces,
        "differences": differences,
    }


def compare_quantity_summary(
    actual_summary: dict,
    expected_summary: dict,
    *,
    numeric_fields: list[str] | None = None,
    absolute_tolerance: float = 0.01,
) -> list[dict]:
    fields = numeric_fields or DEFAULT_SUMMARY_NUMERIC_FIELDS
    differences = []
    for field in fields:
        if field not in actual_summary or field not in expected_summary:
            continue
        delta = round(float(actual_summary[field]) - float(expected_summary[field]), 2)
        if abs(delta) <= absolute_tolerance:
            continue
        differences.append(
            {
                "field": field,
                "actual": actual_summary[field],
                "expected": expected_summary[field],
                "delta": delta,
                "percent_delta": _percent_delta(float(actual_summary[field]), float(expected_summary[field])),
            }
        )
    return differences


def _rows_by_space_name(rows: list[dict]) -> dict[str, dict]:
    return {str(row["space_name"]): row for row in rows if row.get("space_name")}


def _percent_delta(actual: float, expected: float) -> float:
    if expected == 0:
        return 0 if actual == 0 else 100
    return round((actual - expected) / expected * 100, 2)
