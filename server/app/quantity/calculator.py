import math

from server.app.models import ProjectDefaults, QuantityRow, ReviewStatus, SpaceInput
from server.app.quantity.classification import classify_space_type, is_excluded_space
from server.app.quantity.geometry import polygon_area

FULL_WALL_TILE_SPACE_TYPES = {"厨房", "卫生间"}
WATERPROOF_SPACE_TYPES = {"厨房", "卫生间", "阳台", "露台", "洗衣房"}
SLIDING_DOOR_QUOTE_SPACE_TYPES = {"厨房", "阳台", "露台"}
CURTAIN_CANDIDATE_SPACE_TYPES = {"客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室"}
KITCHEN_CABINET_SPACE_TYPES = {"厨房"}
BATHROOM_FIXTURE_SPACE_TYPES = {"卫生间"}
INTERIOR_DOOR_COUNT_SPACE_TYPES = {"厨房", "卫生间", "卧室", "书房", "茶室", "娱乐室", "衣帽间", "储物间", "洗衣房"}
WALL_TILE_HEIGHT_M = 2.5
KITCHEN_WALL_TILE_WINDOW_DEDUCTION_THRESHOLD_M2 = 3.0
SLIDING_DOOR_DEFAULT_HEIGHT_M = 2.2
CUSTOM_CABINET_DEFAULT_HEIGHT_M = 2.6
CUSTOM_CABINET_LOW_HEIGHT_THRESHOLD_M = 1.0
FLOOR_TILE_WIDTH_M = 0.75
FLOOR_TILE_LENGTH_M = 1.5
FLOOR_TILE_LOSS_RATE = 1.05
WATERPROOF_HEIGHT_BY_SPACE_TYPE = {
    "卫生间": 1.8,
    "厨房": 0.3,
    "阳台": 0.3,
    "露台": 0.3,
    "洗衣房": 0.3,
}


def resolve_height(defaults: ProjectDefaults, space: SpaceInput) -> float:
    return space.height_m or space.floor_default_height_m or defaults.project_height_m


def calculate_quantity_row(space: SpaceInput, defaults: ProjectDefaults) -> QuantityRow:
    space_type = classify_space_type(space.name)
    height_m = resolve_height(defaults, space)
    gross_floor_area_m2 = round(polygon_area(space.boundary_points_m), 2)
    floor_area_m2 = round(max(gross_floor_area_m2 - space.floor_void_area_m2, 0), 2)
    ceiling_area_m2 = round(max(gross_floor_area_m2 - space.ceiling_void_area_m2, 0), 2)
    wall_measure_length_m = round(sum(space.wall_lengths_m), 2)

    window_width_total_m = round(sum(window.width_m for window in space.windows), 2)
    windowsill_length_m = window_width_total_m
    curtain_wall_width_m, curtain_wall_width_source = calculate_curtain_wall_width_m(
        space_type,
        space.wall_lengths_m,
        space.windows,
        space.curtain_wall_width_candidate_m,
        space.curtain_wall_width_source,
    )
    window_area_m2 = round(
        sum(window.width_m * (window.height_m or defaults.default_window_height_m) for window in space.windows),
        2,
    )
    door_width_total_m = round(sum(door.width_m for door in space.doors), 2)
    door_deduct_area_m2 = round(
        sum(door.width_m * (door.height_m or defaults.default_door_height_m) for door in space.doors if door.deduct_from_wall),
        2,
    )
    door_area_for_wall_tile_m2 = calculate_wall_tile_door_deduct_area_m2(space_type, space.doors)
    wall_gross_area_m2 = round(wall_measure_length_m * height_m, 2)
    wall_tile_measure_length_m = calculate_wall_tile_measure_length_m(space_type, wall_measure_length_m, space.wall_tile_lengths_m)
    wall_tile_area_m2 = calculate_wall_tile_area_m2(
        space_type,
        wall_measure_length_m,
        wall_tile_measure_length_m,
        height_m,
        window_area_m2,
        door_area_for_wall_tile_m2,
    )
    latex_paint_base_area_m2 = round((wall_measure_length_m + door_width_total_m) * height_m, 2)
    latex_paint_area_m2 = calculate_latex_paint_area_m2(
        space_type,
        latex_paint_base_area_m2,
        window_area_m2,
        door_deduct_area_m2,
        wall_tile_area_m2,
    )
    floor_tile_piece_count = calculate_floor_tile_piece_count(floor_area_m2)
    electrical_scope_area_m2 = floor_area_m2
    plumbing_scope_area_m2 = floor_area_m2
    new_wall_length_m = round(sum(space.new_wall_lengths_m), 2)
    new_wall_area_m2 = calculate_segment_area_m2(space.new_wall_lengths_m, space.new_wall_heights_m, height_m)
    new_wall_unclassified_area_m2, new_wall_120_area_m2, new_wall_240_area_m2 = calculate_new_wall_quote_areas_m2(
        space.new_wall_lengths_m,
        space.new_wall_heights_m,
        space.new_wall_thicknesses_m,
        height_m,
    )
    demolition_wall_length_m = round(sum(space.demolition_wall_lengths_m), 2)
    demolition_wall_area_m2 = calculate_demolition_wall_area_m2(demolition_wall_length_m, height_m)
    background_wall_area_m2 = calculate_segment_area_m2(space.background_wall_lengths_m, space.background_wall_heights_m, height_m)
    cast_slab_area_m2 = round(sum(space.cast_slab_areas_m2), 2)
    edge_ceiling_area_m2 = round(sum(space.edge_ceiling_areas_m2), 2)
    edge_ceiling_length_m = round(sum(space.edge_ceiling_lengths_m), 2)
    gypsum_flat_ceiling_area_m2 = round(max(ceiling_area_m2 - edge_ceiling_area_m2, 0), 2)
    entry_door_count = calculate_entry_door_count(space.doors)
    interior_door_count = calculate_interior_door_count(space_type, space.doors)
    bathroom_door_count = calculate_bathroom_door_count(space_type, space.doors)
    sliding_door_area_m2 = calculate_sliding_door_area_m2(space_type, space.doors, defaults.default_door_height_m)
    sliding_door_casing_length_m = calculate_sliding_door_casing_length_m(space_type, space.doors, defaults.default_door_height_m)
    kitchen_base_cabinet_length_m = calculate_kitchen_cabinet_length_m(space_type, space.base_cabinet_lengths_m)
    kitchen_wall_cabinet_length_m = calculate_kitchen_cabinet_length_m(space_type, space.wall_cabinet_lengths_m)
    custom_cabinet_area_m2 = calculate_custom_cabinet_area_m2(
        space_type,
        space.custom_cabinet_lengths_m,
        space.custom_cabinet_heights_m,
    )
    toilet_count = calculate_bathroom_fixture_count(space_type, space.toilet_count)
    bathroom_vanity_count = calculate_bathroom_fixture_count(space_type, space.bathroom_vanity_count)
    waterproof_area_m2 = calculate_waterproof_area_m2(space_type, floor_area_m2, wall_measure_length_m, height_m)
    stair_railing_length_m = calculate_stair_railing_length_m(space.stair_railing_lengths_m, height_m)
    guardrail_length_m = round(sum(space.guardrail_lengths_m), 2)
    atrium_curtain_width_m = round(space.atrium_curtain_width_m, 2) if space_type == "挑空" else 0
    atrium_curtain_height_m = round(space.atrium_curtain_height_m, 2) if space_type == "挑空" else 0
    atrium_curtain_area_m2 = round(atrium_curtain_width_m * atrium_curtain_height_m, 2)

    anomalies = list(space.anomalies)
    if len(space.boundary_points_m) < 3:
        anomalies.append("空间边界点不足，无法计算面积")
    if not space.name.strip():
        anomalies.append("空间没有名称")
    if wall_measure_length_m == 0 and not is_excluded_space(space.name):
        anomalies.append("没有关联到 QUOTE_WALL 墙线")
    if any(door.review_required for door in space.doors):
        anomalies.append("存在疑似大洞口门，请确认是否扣减墙面")

    if is_excluded_space(space.name):
        status = ReviewStatus.excluded
    elif any("无法" in item or "没有名称" in item for item in anomalies):
        status = ReviewStatus.needs_fix
    else:
        status = ReviewStatus.pending_review

    evidence = (
        f"墙面展开面积 {wall_measure_length_m}m * {height_m}m = {wall_gross_area_m2}m2；"
        f"墙面乳胶漆基数 {wall_measure_length_m}m + 门洞 {door_width_total_m}m = {latex_paint_base_area_m2}m2；"
        f"{latex_paint_evidence(space_type, latex_paint_base_area_m2, window_area_m2, door_deduct_area_m2, wall_tile_area_m2, latex_paint_area_m2)}"
    )

    return QuantityRow(
        floor=space.floor,
        space_name=space.name,
        space_type=space_type,
        gross_floor_area_m2=gross_floor_area_m2,
        floor_area_m2=floor_area_m2,
        ceiling_area_m2=ceiling_area_m2,
        void_area_m2=round(space.void_area_m2, 2),
        wall_measure_length_m=wall_measure_length_m,
        height_m=height_m,
        window_width_total_m=window_width_total_m,
        windowsill_length_m=windowsill_length_m,
        curtain_wall_width_m=curtain_wall_width_m,
        curtain_wall_width_source=curtain_wall_width_source,
        atrium_curtain_width_m=atrium_curtain_width_m,
        atrium_curtain_height_m=atrium_curtain_height_m,
        atrium_curtain_area_m2=atrium_curtain_area_m2,
        window_area_m2=window_area_m2,
        door_width_total_m=door_width_total_m,
        door_deduct_area_m2=door_deduct_area_m2,
        wall_gross_area_m2=wall_gross_area_m2,
        latex_paint_area_m2=latex_paint_area_m2,
        wall_tile_measure_length_m=wall_tile_measure_length_m,
        wall_tile_area_m2=wall_tile_area_m2,
        floor_tile_piece_count=floor_tile_piece_count,
        electrical_scope_area_m2=electrical_scope_area_m2,
        plumbing_scope_area_m2=plumbing_scope_area_m2,
        new_wall_length_m=new_wall_length_m,
        new_wall_area_m2=new_wall_area_m2,
        new_wall_unclassified_area_m2=new_wall_unclassified_area_m2,
        new_wall_120_area_m2=new_wall_120_area_m2,
        new_wall_240_area_m2=new_wall_240_area_m2,
        demolition_wall_length_m=demolition_wall_length_m,
        demolition_wall_area_m2=demolition_wall_area_m2,
        background_wall_area_m2=background_wall_area_m2,
        cast_slab_area_m2=cast_slab_area_m2,
        edge_ceiling_area_m2=edge_ceiling_area_m2,
        edge_ceiling_length_m=edge_ceiling_length_m,
        gypsum_flat_ceiling_area_m2=gypsum_flat_ceiling_area_m2,
        entry_door_count=entry_door_count,
        interior_door_count=interior_door_count,
        bathroom_door_count=bathroom_door_count,
        sliding_door_area_m2=sliding_door_area_m2,
        sliding_door_casing_length_m=sliding_door_casing_length_m,
        kitchen_base_cabinet_length_m=kitchen_base_cabinet_length_m,
        kitchen_wall_cabinet_length_m=kitchen_wall_cabinet_length_m,
        custom_cabinet_area_m2=custom_cabinet_area_m2,
        toilet_count=toilet_count,
        bathroom_vanity_count=bathroom_vanity_count,
        stair_railing_length_m=stair_railing_length_m,
        guardrail_length_m=guardrail_length_m,
        waterproof_area_m2=waterproof_area_m2,
        evidence=evidence,
        anomalies=anomalies,
        status=status,
    )


def calculate_wall_tile_measure_length_m(space_type: str, wall_measure_length_m: float, wall_tile_lengths_m: list[float]) -> float:
    if space_type in FULL_WALL_TILE_SPACE_TYPES:
        return wall_measure_length_m
    if wall_tile_lengths_m:
        return round(sum(wall_tile_lengths_m), 2)
    return 0


def calculate_wall_tile_area_m2(
    space_type: str,
    wall_measure_length_m: float,
    wall_tile_measure_length_m: float,
    height_m: float,
    window_area_m2: float,
    door_area_m2: float,
) -> float:
    if space_type == "厨房":
        window_deduction_m2 = window_area_m2 if window_area_m2 > KITCHEN_WALL_TILE_WINDOW_DEDUCTION_THRESHOLD_M2 else 0
        return round(max(wall_measure_length_m * WALL_TILE_HEIGHT_M - window_deduction_m2 - door_area_m2, 0), 2)
    if space_type == "卫生间":
        return round(max(wall_measure_length_m * WALL_TILE_HEIGHT_M - window_area_m2, 0), 2)
    if wall_tile_measure_length_m > 0:
        return round(max(wall_tile_measure_length_m * height_m, 0), 2)
    return 0


def calculate_wall_tile_door_deduct_area_m2(space_type: str, doors: list) -> float:
    if space_type != "厨房":
        return 0
    return round(sum(door.width_m * (door.height_m or SLIDING_DOOR_DEFAULT_HEIGHT_M) for door in doors if door.quote_category == "sliding_door"), 2)


def calculate_latex_paint_area_m2(
    space_type: str,
    latex_paint_base_area_m2: float,
    window_area_m2: float,
    door_deduct_area_m2: float,
    wall_tile_area_m2: float,
) -> float:
    if space_type in FULL_WALL_TILE_SPACE_TYPES and wall_tile_area_m2 > 0:
        return 0
    return round(max(latex_paint_base_area_m2 - window_area_m2 - door_deduct_area_m2 - wall_tile_area_m2, 0), 2)


def latex_paint_evidence(
    space_type: str,
    latex_paint_base_area_m2: float,
    window_area_m2: float,
    door_deduct_area_m2: float,
    wall_tile_area_m2: float,
    latex_paint_area_m2: float,
) -> str:
    if space_type in FULL_WALL_TILE_SPACE_TYPES and wall_tile_area_m2 > 0:
        return f"厨房/卫生间墙面默认贴砖 {wall_tile_area_m2}m2，墙面乳胶漆面积计 0m2。"
    return (
        f"墙面乳胶漆面积 {latex_paint_base_area_m2}m2 - 窗洞 {window_area_m2}m2 "
        f"- 已选门洞扣减 {door_deduct_area_m2}m2 - 贴砖墙面 {wall_tile_area_m2}m2 = {latex_paint_area_m2}m2。"
    )


def calculate_floor_tile_piece_count(floor_area_m2: float) -> int:
    if floor_area_m2 <= 0:
        return 0
    return math.ceil(floor_area_m2 * FLOOR_TILE_LOSS_RATE / (FLOOR_TILE_WIDTH_M * FLOOR_TILE_LENGTH_M))


def calculate_stair_railing_length_m(plan_lengths_m: list[float], height_m: float) -> float:
    return round(sum(math.sqrt(length_m * length_m + height_m * height_m) for length_m in plan_lengths_m), 2)


def calculate_new_wall_area_m2(new_wall_length_m: float, height_m: float) -> float:
    return round(max(new_wall_length_m * height_m, 0), 2)


def calculate_segment_area_m2(lengths_m: list[float], heights_m: list[float | None], default_height_m: float) -> float:
    area = 0.0
    for index, length_m in enumerate(lengths_m):
        height_m = heights_m[index] if index < len(heights_m) and heights_m[index] is not None else default_height_m
        area += length_m * height_m
    return round(max(area, 0), 2)


def calculate_new_wall_quote_areas_m2(lengths_m: list[float], heights_m: list[float | None], thicknesses_m: list[float | None], default_height_m: float) -> tuple[float, float, float]:
    unclassified_area = 0.0
    area_120 = 0.0
    area_240 = 0.0
    for index, length_m in enumerate(lengths_m):
        height_m = heights_m[index] if index < len(heights_m) and heights_m[index] is not None else default_height_m
        thickness_m = thicknesses_m[index] if index < len(thicknesses_m) else None
        area = length_m * height_m
        if thickness_m is None:
            unclassified_area += area
        elif thickness_m <= 0.13:
            area_120 += area
        else:
            area_240 += area
    return round(max(unclassified_area, 0), 2), round(max(area_120, 0), 2), round(max(area_240, 0), 2)


def calculate_demolition_wall_area_m2(demolition_wall_length_m: float, height_m: float) -> float:
    return round(max(demolition_wall_length_m * height_m, 0), 2)


def calculate_interior_door_count(space_type: str, doors: list) -> int:
    if space_type not in INTERIOR_DOOR_COUNT_SPACE_TYPES:
        return 0
    return sum(1 for door in doors if door.opening_type == "normal_door" and door.quote_category == "interior_door")


def calculate_bathroom_door_count(space_type: str, doors: list) -> int:
    if space_type != "卫生间":
        return 0
    return sum(1 for door in doors if door.opening_type == "normal_door" and door.quote_category == "bathroom_door")


def calculate_entry_door_count(doors: list) -> int:
    return sum(1 for door in doors if door.opening_type == "normal_door" and door.quote_category == "entry_door")


def calculate_sliding_door_area_m2(space_type: str, doors: list, default_door_height_m: float) -> float:
    if space_type not in SLIDING_DOOR_QUOTE_SPACE_TYPES:
        return 0
    return round(sum(door.width_m * (door.height_m or SLIDING_DOOR_DEFAULT_HEIGHT_M) for door in doors if door.quote_category == "sliding_door"), 2)


def calculate_sliding_door_casing_length_m(space_type: str, doors: list, default_door_height_m: float) -> float:
    if space_type not in SLIDING_DOOR_QUOTE_SPACE_TYPES:
        return 0
    return round(sum(door.width_m + 2 * (door.height_m or SLIDING_DOOR_DEFAULT_HEIGHT_M) for door in doors if door.quote_category == "sliding_door"), 2)


def calculate_kitchen_cabinet_length_m(space_type: str, cabinet_lengths_m: list[float]) -> float:
    if space_type not in KITCHEN_CABINET_SPACE_TYPES:
        return 0
    return round(sum(cabinet_lengths_m), 2)


def calculate_custom_cabinet_area_m2(space_type: str, cabinet_lengths_m: list[float], cabinet_heights_m: list[float | None]) -> float:
    if space_type in KITCHEN_CABINET_SPACE_TYPES:
        return 0
    quantity = 0.0
    for index, cabinet_length_m in enumerate(cabinet_lengths_m):
        cabinet_height_m = cabinet_heights_m[index] if index < len(cabinet_heights_m) else None
        if cabinet_height_m is not None and cabinet_height_m < CUSTOM_CABINET_LOW_HEIGHT_THRESHOLD_M:
            quantity += cabinet_length_m
        else:
            quantity += cabinet_length_m * (cabinet_height_m or CUSTOM_CABINET_DEFAULT_HEIGHT_M)
    return round(max(quantity, 0), 2)


def calculate_bathroom_fixture_count(space_type: str, count: int) -> int:
    if space_type not in BATHROOM_FIXTURE_SPACE_TYPES:
        return 0
    return max(int(count), 0) or 1


def calculate_curtain_wall_width_m(
    space_type: str,
    wall_lengths_m: list[float],
    windows: list,
    candidate_m: float = 0,
    candidate_source: str = "not_applicable",
) -> tuple[float, str]:
    if space_type not in CURTAIN_CANDIDATE_SPACE_TYPES or not windows or not wall_lengths_m:
        return (0, "not_applicable")
    if candidate_m > 0:
        return (round(candidate_m, 2), candidate_source if candidate_source != "not_applicable" else "matched_window_wall")
    return (round(max(wall_lengths_m), 2), "fallback_longest_wall")


def calculate_waterproof_area_m2(space_type: str, floor_area_m2: float, wall_measure_length_m: float, height_m: float) -> float:
    if space_type not in WATERPROOF_SPACE_TYPES:
        return 0
    waterproof_height_m = min(WATERPROOF_HEIGHT_BY_SPACE_TYPE[space_type], height_m)
    return round(floor_area_m2 + wall_measure_length_m * waterproof_height_m, 2)
