DEFAULT_NUMERIC_FIELDS = [
    "floor_area_m2",
    "wall_measure_length_m",
    "window_width_total_m",
    "windowsill_length_m",
    "window_area_m2",
    "door_width_total_m",
    "door_deduct_area_m2",
    "wall_gross_area_m2",
    "latex_paint_area_m2",
]


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


def _rows_by_space_name(rows: list[dict]) -> dict[str, dict]:
    return {str(row["space_name"]): row for row in rows if row.get("space_name")}


def _percent_delta(actual: float, expected: float) -> float:
    if expected == 0:
        return 0 if actual == 0 else 100
    return round((actual - expected) / expected * 100, 2)
