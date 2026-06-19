from server.app.models import ProjectDefaults, QuantityRow, ReviewStatus, SpaceInput
from server.app.quantity.classification import classify_space_type, is_excluded_space
from server.app.quantity.geometry import polygon_area


def resolve_height(defaults: ProjectDefaults, space: SpaceInput) -> float:
    return space.height_m or space.floor_default_height_m or defaults.project_height_m


def calculate_quantity_row(space: SpaceInput, defaults: ProjectDefaults) -> QuantityRow:
    space_type = classify_space_type(space.name)
    height_m = resolve_height(defaults, space)
    floor_area_m2 = round(polygon_area(space.boundary_points_m), 2)
    wall_measure_length_m = round(sum(space.wall_lengths_m), 2)

    window_width_total_m = round(sum(window.width_m for window in space.windows), 2)
    window_area_m2 = round(
        sum(window.width_m * (window.height_m or defaults.default_window_height_m) for window in space.windows),
        2,
    )
    door_width_total_m = round(sum(door.width_m for door in space.doors), 2)
    wall_gross_area_m2 = round(wall_measure_length_m * height_m, 2)
    latex_paint_area_m2 = round(max(wall_gross_area_m2 - window_area_m2, 0), 2)

    anomalies = list(space.anomalies)
    if len(space.boundary_points_m) < 3:
        anomalies.append("空间边界点不足，无法计算面积")
    if not space.name.strip():
        anomalies.append("空间没有名称")
    if wall_measure_length_m == 0 and not is_excluded_space(space.name):
        anomalies.append("没有关联到 QUOTE_WALL 墙线")

    if is_excluded_space(space.name):
        status = ReviewStatus.excluded
    elif any("无法" in item or "没有名称" in item for item in anomalies):
        status = ReviewStatus.needs_fix
    else:
        status = ReviewStatus.pending_review

    evidence = (
        f"墙面展开面积 {wall_measure_length_m}m * {height_m}m = {wall_gross_area_m2}m2；"
        f"乳胶漆面积 {wall_gross_area_m2}m2 - 窗洞 {window_area_m2}m2 = {latex_paint_area_m2}m2；"
        "门洞默认不扣减。"
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
        window_area_m2=window_area_m2,
        door_width_total_m=door_width_total_m,
        wall_gross_area_m2=wall_gross_area_m2,
        latex_paint_area_m2=latex_paint_area_m2,
        evidence=evidence,
        anomalies=anomalies,
        status=status,
    )
