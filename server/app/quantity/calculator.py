from server.app.models import ProjectDefaults, QuantityRow, ReviewStatus, SpaceInput
from server.app.quantity.classification import classify_space_type, is_excluded_space
from server.app.quantity.geometry import polygon_area

FULL_WALL_TILE_SPACE_TYPES = {"厨房", "卫生间"}
MARKED_WALL_TILE_SPACE_TYPES = {"阳台", "露台", "洗衣房"}
WATERPROOF_SPACE_TYPES = {"厨房", "卫生间", "阳台", "露台", "洗衣房"}
CURTAIN_CANDIDATE_SPACE_TYPES = {"客厅", "卧室", "书房"}
WALL_TILE_HEIGHT_M = 2.5
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
    floor_area_m2 = round(polygon_area(space.boundary_points_m), 2)
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
    door_area_for_wall_tile_m2 = round(sum(door.width_m * (door.height_m or defaults.default_door_height_m) for door in space.doors), 2)
    wall_gross_area_m2 = round(wall_measure_length_m * height_m, 2)
    latex_paint_area_m2 = round(max(wall_gross_area_m2 - window_area_m2 - door_deduct_area_m2, 0), 2)
    wall_tile_measure_length_m = calculate_wall_tile_measure_length_m(space_type, wall_measure_length_m, space.wall_tile_lengths_m)
    wall_tile_area_m2 = calculate_wall_tile_area_m2(
        space_type,
        wall_measure_length_m,
        wall_tile_measure_length_m,
        height_m,
        window_area_m2,
        door_area_for_wall_tile_m2,
    )
    new_wall_length_m = round(sum(space.new_wall_lengths_m), 2)
    new_wall_area_m2 = calculate_new_wall_area_m2(new_wall_length_m, height_m)
    waterproof_area_m2 = calculate_waterproof_area_m2(space_type, floor_area_m2, wall_measure_length_m, height_m)

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
        f"乳胶漆面积 {wall_gross_area_m2}m2 - 窗洞 {window_area_m2}m2 - 门洞 {door_deduct_area_m2}m2 = {latex_paint_area_m2}m2；"
        "普通房门门洞默认不扣减，大洞口门按规则扣减。"
    )

    return QuantityRow(
        floor=space.floor,
        space_name=space.name,
        space_type=space_type,
        floor_area_m2=floor_area_m2,
        ceiling_area_m2=floor_area_m2,
        wall_measure_length_m=wall_measure_length_m,
        height_m=height_m,
        window_width_total_m=window_width_total_m,
        windowsill_length_m=windowsill_length_m,
        curtain_wall_width_m=curtain_wall_width_m,
        curtain_wall_width_source=curtain_wall_width_source,
        window_area_m2=window_area_m2,
        door_width_total_m=door_width_total_m,
        door_deduct_area_m2=door_deduct_area_m2,
        wall_gross_area_m2=wall_gross_area_m2,
        latex_paint_area_m2=latex_paint_area_m2,
        wall_tile_measure_length_m=wall_tile_measure_length_m,
        wall_tile_area_m2=wall_tile_area_m2,
        new_wall_length_m=new_wall_length_m,
        new_wall_area_m2=new_wall_area_m2,
        waterproof_area_m2=waterproof_area_m2,
        evidence=evidence,
        anomalies=anomalies,
        status=status,
    )


def calculate_wall_tile_measure_length_m(space_type: str, wall_measure_length_m: float, wall_tile_lengths_m: list[float]) -> float:
    if space_type in FULL_WALL_TILE_SPACE_TYPES:
        return wall_measure_length_m
    if space_type in MARKED_WALL_TILE_SPACE_TYPES:
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
    if space_type in FULL_WALL_TILE_SPACE_TYPES:
        return round(max(wall_measure_length_m * WALL_TILE_HEIGHT_M - window_area_m2 - door_area_m2, 0), 2)
    if space_type in MARKED_WALL_TILE_SPACE_TYPES and wall_tile_measure_length_m > 0:
        return round(max(wall_tile_measure_length_m * height_m, 0), 2)
    return 0


def calculate_new_wall_area_m2(new_wall_length_m: float, height_m: float) -> float:
    return round(max(new_wall_length_m * height_m, 0), 2)


def calculate_curtain_wall_width_m(
    space_type: str,
    wall_lengths_m: list[float],
    windows: list,
    candidate_m: float = 0,
    candidate_source: str = "not_applicable",
) -> tuple[float, str]:
    if candidate_source == "manual_required_l_shape_window":
        return (0, "manual_required_l_shape_window")
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
