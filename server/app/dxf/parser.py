from dataclasses import dataclass, field
import math
from pathlib import Path
import re
from tempfile import NamedTemporaryFile

import ezdxf

from server.app.models import OpeningInput, ProjectDefaults, SpaceInput
from server.app.quantity.geometry import contains_point, line_length

QUOTE_LAYERS = {
    "QUOTE_ROOM",
    "QUOTE_WALL",
    "QUOTE_OPENING",
    "QUOTE_WINDOW",
    "QUOTE_DOOR",
    "QUOTE_FLOOR",
    "QUOTE_HEIGHT",
    "QUOTE_EXT_WALL",
    "QUOTE_TEXT",
}

Point = tuple[float, float]


@dataclass(frozen=True)
class ParsedDxf:
    rooms: list[object] = field(default_factory=list)
    walls: list[object] = field(default_factory=list)
    openings: list[object] = field(default_factory=list)
    windows: list[object] = field(default_factory=list)
    doors: list[object] = field(default_factory=list)
    floors: list[object] = field(default_factory=list)
    heights: list[object] = field(default_factory=list)
    exterior_walls: list[object] = field(default_factory=list)
    texts: list[object] = field(default_factory=list)
    anomalies: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class DrawingSpace:
    name: str
    points: list[Point]


@dataclass(frozen=True)
class DrawingText:
    text: str
    point: Point


@dataclass(frozen=True)
class DrawingOpening:
    segments: list[tuple[Point, Point]]
    boundary_points: list[Point] = field(default_factory=list)


@dataclass(frozen=True)
class DrawingWindow:
    segments: list[tuple[Point, Point]]
    boundary_points: list[Point]
    width_m: float
    height_m: float
    included_in_wall_deduction: bool
    space_names: list[str]


@dataclass(frozen=True)
class DrawingDoor:
    segment: tuple[Point, Point]
    thickness_m: float
    width_m: float
    deduct_from_wall: bool
    review_required: bool
    opening_type: str
    space_names: list[str]


@dataclass(frozen=True)
class DrawingGeometry:
    spaces: list[DrawingSpace]
    walls: list[tuple[Point, Point]]
    measured_walls: list[tuple[Point, Point]]
    window_openings: list[DrawingWindow]
    windows: list[tuple[Point, Point]]
    door_openings: list[DrawingDoor]
    doors: list[tuple[Point, Point]]
    base_segments: list[tuple[Point, Point]]
    base_texts: list[DrawingText]
    bbox: dict[str, float]


@dataclass(frozen=True)
class ParsedDxfReview:
    spaces: list[SpaceInput]
    drawing: DrawingGeometry


def parse_dxf_layers(_: bytes) -> ParsedDxf:
    raise NotImplementedError("DXF layer extraction will be implemented after standardized sample files exist.")


def parse_dxf_spaces(content: bytes, defaults: ProjectDefaults) -> list[SpaceInput]:
    return parse_dxf_review(content, defaults).spaces


def parse_dxf_review(content: bytes, defaults: ProjectDefaults) -> ParsedDxfReview:
    doc = _read_dxf_bytes(content)
    modelspace = doc.modelspace()

    rooms: list[list[Point]] = []
    walls: list[tuple[Point, Point]] = []
    window_openings: list[DrawingOpening] = []
    windows: list[tuple[Point, Point]] = []
    door_opening_inputs: list[DrawingOpening] = []
    texts: list[tuple[Point, str]] = []
    measured_walls: list[tuple[Point, Point]] = []

    for entity in modelspace:
        layer = entity.dxf.layer
        if layer == "QUOTE_ROOM":
            points = _polyline_points(entity, defaults.unit_scale_to_m)
            if points:
                rooms.append(points)
        elif layer == "QUOTE_WALL":
            walls.extend(_entity_segments(entity, defaults.unit_scale_to_m))
        elif layer == "QUOTE_WINDOW":
            window_segments = _entity_segments(entity, defaults.unit_scale_to_m)
            if window_segments:
                window_openings.append(DrawingOpening(segments=window_segments, boundary_points=_closed_polyline_boundary_points(entity, defaults.unit_scale_to_m)))
                windows.extend(window_segments)
        elif layer == "QUOTE_DOOR":
            door_opening_inputs.extend(_door_openings(entity, defaults.unit_scale_to_m))
        elif layer in {"QUOTE_TEXT", "QUOTE_FLOOR", "QUOTE_HEIGHT"} and entity.dxftype() in {"TEXT", "MTEXT"}:
            text = _text_content(entity)
            point = _text_point(entity, defaults.unit_scale_to_m)
            if text:
                texts.append((point, text))

    spaces: list[SpaceInput] = []
    drawing_spaces: list[DrawingSpace] = []
    grouped_window_opening_inputs = _group_openings(window_openings)
    named_rooms: list[tuple[str, list[Point]]] = []
    for room in rooms:
        name = _name_for_room(room, texts)
        if not name:
            continue
        named_rooms.append((name, room))
        room_walls = [(start, end) for start, end in walls if _segment_in_room(room, start, end)]
        room_windows = [opening for opening in grouped_window_opening_inputs if _opening_associated_with_room(room, *_opening_centerline(opening))]
        curtain_wall_width_candidate_m = _curtain_wall_width_candidate(room_walls, room_windows)
        measured_walls.extend(room_walls)
        drawing_spaces.append(DrawingSpace(name=name, points=room))
        spaces.append(
            SpaceInput(
                floor=_floor_from_name(name),
                name=name,
                boundary_points_m=room,
                wall_lengths_m=[round(line_length(start, end), 2) for start, end in room_walls],
                curtain_wall_width_candidate_m=curtain_wall_width_candidate_m,
                curtain_wall_width_source="matched_window_wall" if curtain_wall_width_candidate_m > 0 else "not_applicable",
                windows=[
                    OpeningInput(width_m=round(_opening_width(opening), 2), height_m=defaults.default_window_height_m)
                    for opening in room_windows
                ],
                doors=[
                    _door_input_for_segment(start, end)
                    for start, end in [opening.segments[0] for opening in door_opening_inputs]
                    if _opening_associated_with_room(room, start, end)
                ],
                anomalies=[],
            )
        )
    grouped_window_openings = [_drawing_window_for_opening(opening, named_rooms, defaults) for opening in grouped_window_opening_inputs]
    door_openings = [_drawing_door_for_opening(opening, named_rooms, walls) for opening in door_opening_inputs]
    doors = [door.segment for door in door_openings]

    initial_bbox = _bbox_for_geometry([space.points for space in drawing_spaces])
    review_bbox = _expanded_bbox(initial_bbox, padding=2.0)
    base_segments, base_texts = _extract_base_drawing(modelspace, defaults.unit_scale_to_m, review_bbox)
    drawing = DrawingGeometry(
        spaces=drawing_spaces,
        walls=walls,
        measured_walls=measured_walls,
        window_openings=grouped_window_openings,
        windows=windows,
        door_openings=door_openings,
        doors=doors,
        base_segments=base_segments,
        base_texts=base_texts,
        bbox=_bbox_for_geometry(
            [
                *[space.points for space in drawing_spaces],
                *[[start, end] for start, end in base_segments],
                *[[start, end] for start, end in windows + doors],
            ]
        ),
    )
    return ParsedDxfReview(spaces=spaces, drawing=drawing)


def _read_dxf_bytes(content: bytes):
    with NamedTemporaryFile(suffix=".dxf", delete=False) as temp_file:
        temp_file.write(content)
        temp_path = Path(temp_file.name)
    try:
        return ezdxf.readfile(temp_path)
    finally:
        temp_path.unlink(missing_ok=True)


def _polyline_points(entity, scale: float) -> list[Point]:
    if entity.dxftype() == "LWPOLYLINE":
        return [_scale_point((point[0], point[1]), scale) for point in entity.get_points("xy")]
    if entity.dxftype() == "POLYLINE":
        return [_scale_point((vertex.dxf.location.x, vertex.dxf.location.y), scale) for vertex in entity.vertices]
    return []


def _closed_polyline_boundary_points(entity, scale: float) -> list[Point]:
    if not _entity_is_closed_polyline(entity):
        return []
    points = _polyline_points(entity, scale)
    if len(points) > 1 and points[0] == points[-1]:
        points = points[:-1]
    return points if len(points) >= 4 else []


def _entity_segments(entity, scale: float) -> list[tuple[Point, Point]]:
    if entity.dxftype() == "LINE":
        return [(_scale_point((entity.dxf.start.x, entity.dxf.start.y), scale), _scale_point((entity.dxf.end.x, entity.dxf.end.y), scale))]
    points = _polyline_points(entity, scale)
    if len(points) < 2:
        return []
    segments = [(points[index], points[index + 1]) for index in range(len(points) - 1)]
    if _entity_is_closed_polyline(entity) and points[0] != points[-1]:
        segments.append((points[-1], points[0]))
    return segments


def _door_openings(entity, scale: float) -> list[DrawingOpening]:
    if entity.dxftype() != "INSERT":
        if _entity_is_closed_polyline(entity):
            opening = _closed_polyline_opening(entity, scale)
            if opening:
                return [opening]
        return [DrawingOpening(segments=[segment]) for segment in _entity_segments(entity, scale)]
    virtual_opening = _door_insert_opening_from_virtual_entities(entity, scale)
    if virtual_opening:
        return [virtual_opening]
    width_m = _door_insert_width_m(entity, scale)
    insert = _scale_point((entity.dxf.insert.x, entity.dxf.insert.y), scale)
    rotation = math.radians(float(getattr(entity.dxf, "rotation", 0) or 0))
    direction = (math.cos(rotation), math.sin(rotation))
    half_width = width_m / 2
    return [
        DrawingOpening(
            segments=[
                (
            (round(insert[0] - direction[0] * half_width, 3), round(insert[1] - direction[1] * half_width, 3)),
            (round(insert[0] + direction[0] * half_width, 3), round(insert[1] + direction[1] * half_width, 3)),
                )
            ]
        )
    ]


def _closed_polyline_opening(entity, scale: float) -> DrawingOpening | None:
    points = _polyline_points(entity, scale)
    unique_points = points[:-1] if len(points) > 1 and points[0] == points[-1] else points
    if len(unique_points) < 4:
        return None
    segments = [(unique_points[index], unique_points[(index + 1) % len(unique_points)]) for index in range(len(unique_points))]
    long_segments = [segment for segment in segments if line_length(segment[0], segment[1]) >= 0.45]
    if len(long_segments) < 2:
        return None
    longest = max(line_length(segment[0], segment[1]) for segment in long_segments)
    matching = [segment for segment in long_segments if abs(line_length(segment[0], segment[1]) - longest) <= 0.03]
    if len(matching) < 2:
        return DrawingOpening(segments=[_oriented_segment(matching[0], _segment_unit_direction(matching[0]))]) if matching else None
    first = _oriented_segment(matching[0], _segment_unit_direction(matching[0]))
    direction = _segment_unit_direction(first)
    oriented = [_oriented_segment(segment, direction) for segment in matching[:2]]
    centerline = (
        (round(sum(segment[0][0] for segment in oriented) / len(oriented), 3), round(sum(segment[0][1] for segment in oriented) / len(oriented), 3)),
        (round(sum(segment[1][0] for segment in oriented) / len(oriented), 3), round(sum(segment[1][1] for segment in oriented) / len(oriented), 3)),
    )
    return DrawingOpening(segments=[centerline, *oriented[:2]])


def _group_openings(openings: list[DrawingOpening]) -> list[DrawingOpening]:
    groups: list[list[DrawingOpening]] = []
    for opening in openings:
        matching_indexes = [index for index, group in enumerate(groups) if any(_opening_bboxes_touch(opening, item) for item in group)]
        if not matching_indexes:
            groups.append([opening])
            continue
        first_index = matching_indexes[0]
        groups[first_index].append(opening)
        for index in reversed(matching_indexes[1:]):
            groups[first_index].extend(groups.pop(index))
    return [
        DrawingOpening(
            segments=[segment for opening in group for segment in opening.segments],
            boundary_points=_largest_boundary([opening.boundary_points for opening in group])
            or _largest_cycle_boundary([segment for opening in group for segment in opening.segments]),
        )
        for group in groups
    ]


def _largest_boundary(boundaries: list[list[Point]]) -> list[Point]:
    candidates = [boundary for boundary in boundaries if len(boundary) >= 4]
    if not candidates:
        return []
    return max(candidates, key=lambda boundary: abs(_polygon_signed_area(boundary)))


def _largest_cycle_boundary(segments: list[tuple[Point, Point]]) -> list[Point]:
    point_by_key: dict[str, Point] = {}
    edges: list[tuple[int, str, str]] = []
    for index, (start, end) in enumerate(segments):
        start_key = _point_key(start)
        end_key = _point_key(end)
        point_by_key[start_key] = start
        point_by_key[end_key] = end
        edges.append((index, start_key, end_key))

    incident: dict[str, list[tuple[int, str, str]]] = {}
    for edge in edges:
        _, start_key, end_key = edge
        incident.setdefault(start_key, []).append(edge)
        incident.setdefault(end_key, []).append(edge)

    cycles: list[list[Point]] = []
    for edge_id, start_key, end_key in edges:
        _find_cycles(end_key, start_key, [start_key, end_key], {edge_id}, incident, point_by_key, cycles)

    return max(cycles, key=lambda boundary: abs(_polygon_signed_area(boundary)), default=[])


def _find_cycles(
    current_key: str,
    start_key: str,
    path_keys: list[str],
    used_edge_ids: set[int],
    incident: dict[str, list[tuple[int, str, str]]],
    point_by_key: dict[str, Point],
    cycles: list[list[Point]],
) -> None:
    if len(path_keys) > 10:
        return
    for edge_id, edge_start_key, edge_end_key in incident.get(current_key, []):
        if edge_id in used_edge_ids:
            continue
        next_key = edge_end_key if edge_start_key == current_key else edge_start_key
        if next_key == start_key and len(path_keys) >= 4:
            cycles.append([point_by_key[key] for key in path_keys])
            continue
        if next_key in path_keys:
            continue
        _find_cycles(next_key, start_key, [*path_keys, next_key], {*used_edge_ids, edge_id}, incident, point_by_key, cycles)


def _point_key(point: Point) -> str:
    return f"{point[0]:.3f},{point[1]:.3f}"


def _opening_bboxes_touch(first: DrawingOpening, second: DrawingOpening, tolerance: float = 0.03) -> bool:
    first_bbox = _segments_bbox(first.segments)
    second_bbox = _segments_bbox(second.segments)
    return not (
        first_bbox["max_x"] + tolerance < second_bbox["min_x"]
        or second_bbox["max_x"] + tolerance < first_bbox["min_x"]
        or first_bbox["max_y"] + tolerance < second_bbox["min_y"]
        or second_bbox["max_y"] + tolerance < first_bbox["min_y"]
    )


def _segments_bbox(segments: list[tuple[Point, Point]]) -> dict[str, float]:
    points = [point for segment in segments for point in segment]
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return {"min_x": min(xs), "min_y": min(ys), "max_x": max(xs), "max_y": max(ys)}


def _polygon_signed_area(points: list[Point]) -> float:
    return sum(
        points[index][0] * points[(index + 1) % len(points)][1] - points[(index + 1) % len(points)][0] * points[index][1]
        for index in range(len(points))
    ) / 2


def _opening_width(opening: DrawingOpening) -> float:
    bbox = _segments_bbox(opening.segments)
    return max(bbox["max_x"] - bbox["min_x"], bbox["max_y"] - bbox["min_y"])


def _opening_centerline(opening: DrawingOpening) -> tuple[Point, Point]:
    bbox = _segments_bbox(opening.segments)
    if bbox["max_x"] - bbox["min_x"] >= bbox["max_y"] - bbox["min_y"]:
        y = round((bbox["min_y"] + bbox["max_y"]) / 2, 3)
        return ((round(bbox["min_x"], 3), y), (round(bbox["max_x"], 3), y))
    x = round((bbox["min_x"] + bbox["max_x"]) / 2, 3)
    return ((x, round(bbox["min_y"], 3)), (x, round(bbox["max_y"], 3)))


def _curtain_wall_width_candidate(room_walls: list[tuple[Point, Point]], window_openings: list[DrawingOpening]) -> float:
    candidates: list[float] = []
    for opening in window_openings:
        window_segment = _opening_centerline(opening)
        matching_walls = [wall for wall in room_walls if _window_matches_wall(window_segment, wall)]
        if matching_walls:
            candidates.append(max(line_length(wall[0], wall[1]) for wall in matching_walls))
    if not candidates:
        return 0
    return round(max(candidates), 2)


def _window_matches_wall(window_segment: tuple[Point, Point], wall: tuple[Point, Point]) -> bool:
    if not _segments_are_parallel(window_segment, wall):
        return False
    if _distance_between_segments(window_segment, wall) > 0.2:
        return False
    return _projection_overlap_length(window_segment, wall) >= 0.05


def _segments_are_parallel(first: tuple[Point, Point], second: tuple[Point, Point]) -> bool:
    first_direction = _segment_unit_direction(first)
    second_direction = _segment_unit_direction(second)
    return abs(first_direction[0] * second_direction[0] + first_direction[1] * second_direction[1]) >= 0.95


def _projection_overlap_length(first: tuple[Point, Point], second: tuple[Point, Point]) -> float:
    direction = _segment_unit_direction(second)
    origin = second[0]
    first_values = [_project_point(point, origin, direction) for point in first]
    second_values = [_project_point(point, origin, direction) for point in second]
    return max(0, min(max(first_values), max(second_values)) - max(min(first_values), min(second_values)))


def _project_point(point: Point, origin: Point, direction: tuple[float, float]) -> float:
    return (point[0] - origin[0]) * direction[0] + (point[1] - origin[1]) * direction[1]


def _door_insert_opening_from_virtual_entities(entity, scale: float) -> DrawingOpening | None:
    insert = _scale_point((entity.dxf.insert.x, entity.dxf.insert.y), scale)
    rotation = math.radians(float(getattr(entity.dxf, "rotation", 0) or 0))
    direction = (math.cos(rotation), math.sin(rotation))
    candidates: list[tuple[float, tuple[Point, Point]]] = []
    try:
        virtual_entities = list(entity.virtual_entities())
    except Exception:
        return None

    for virtual_entity in virtual_entities:
        for segment in _drawable_segments(virtual_entity, scale):
            length = line_length(segment[0], segment[1])
            if not 0.45 <= length <= 2.2:
                continue
            segment_direction = _segment_unit_direction(segment)
            if abs(segment_direction[0] * direction[0] + segment_direction[1] * direction[1]) < 0.9:
                continue
            midpoint = _segment_midpoint(segment)
            if line_length(insert, midpoint) > 2.0:
                continue
            candidates.append((length, _oriented_segment(segment, direction)))

    if not candidates:
        return None
    longest = max(length for length, _ in candidates)
    longest_segments = [segment for length, segment in candidates if abs(length - longest) <= 0.03]
    start = (
        round(sum(segment[0][0] for segment in longest_segments) / len(longest_segments), 3),
        round(sum(segment[0][1] for segment in longest_segments) / len(longest_segments), 3),
    )
    end = (
        round(sum(segment[1][0] for segment in longest_segments) / len(longest_segments), 3),
        round(sum(segment[1][1] for segment in longest_segments) / len(longest_segments), 3),
    )
    return DrawingOpening(segments=[(start, end), *longest_segments])


def _segment_unit_direction(segment: tuple[Point, Point]) -> tuple[float, float]:
    length = line_length(segment[0], segment[1])
    if length == 0:
        return (0, 0)
    return ((segment[1][0] - segment[0][0]) / length, (segment[1][1] - segment[0][1]) / length)


def _segment_midpoint(segment: tuple[Point, Point]) -> Point:
    return ((segment[0][0] + segment[1][0]) / 2, (segment[0][1] + segment[1][1]) / 2)


def _oriented_segment(segment: tuple[Point, Point], direction: tuple[float, float]) -> tuple[Point, Point]:
    segment_direction = _segment_unit_direction(segment)
    if segment_direction[0] * direction[0] + segment_direction[1] * direction[1] < 0:
        return (segment[1], segment[0])
    return segment


def _door_insert_width_m(entity, scale: float) -> float:
    match = re.search(r"yqd_\d+_(\d{3,4})(?:_|$)", entity.dxf.name)
    if match:
        return round(int(match.group(1)) * scale, 3)
    scale_widths = [abs(float(value)) * scale for value in (getattr(entity.dxf, "xscale", 0), getattr(entity.dxf, "yscale", 0))]
    plausible_widths = [value for value in scale_widths if 0.3 <= value <= 3.0]
    if plausible_widths:
        return round(max(plausible_widths), 3)
    return 0.9


def _door_input_for_segment(start: Point, end: Point) -> OpeningInput:
    width_m = round(line_length(start, end), 2)
    opening_type, deduct_from_wall, review_required = _classify_door(width_m)
    return OpeningInput(
        width_m=width_m,
        deduct_from_wall=deduct_from_wall,
        review_required=review_required,
        opening_type=opening_type,
    )


def _drawing_window_for_opening(opening: DrawingOpening, named_rooms: list[tuple[str, list[Point]]], defaults: ProjectDefaults) -> DrawingWindow:
    start, end = _opening_centerline(opening)
    return DrawingWindow(
        segments=opening.segments,
        boundary_points=opening.boundary_points,
        width_m=round(_opening_width(opening), 2),
        height_m=defaults.default_window_height_m,
        included_in_wall_deduction=True,
        space_names=[name for name, room in named_rooms if _opening_associated_with_room(room, start, end)],
    )


def _drawing_door_for_opening(opening: DrawingOpening, named_rooms: list[tuple[str, list[Point]]], walls: list[tuple[Point, Point]]) -> DrawingDoor:
    segment = opening.segments[0]
    width_m = round(line_length(segment[0], segment[1]), 2)
    opening_type, deduct_from_wall, review_required = _classify_door(width_m)
    return DrawingDoor(
        segment=segment,
        thickness_m=_connected_wall_thickness(segment, walls) or _opening_thickness(opening),
        width_m=width_m,
        deduct_from_wall=deduct_from_wall,
        review_required=review_required,
        opening_type=opening_type,
        space_names=[name for name, room in named_rooms if _opening_associated_with_room(room, segment[0], segment[1])],
    )


def _opening_thickness(opening: DrawingOpening) -> float:
    if len(opening.segments) >= 3:
        distances = [_parallel_segment_distance(opening.segments[1], opening.segments[index]) for index in range(2, len(opening.segments))]
        plausible = [distance for distance in distances if 0.04 <= distance <= 0.4]
        if plausible:
            return round(max(plausible), 3)
    bbox = _segments_bbox(opening.segments)
    shorter_side = min(bbox["max_x"] - bbox["min_x"], bbox["max_y"] - bbox["min_y"])
    if 0.04 <= shorter_side <= 0.4:
        return round(shorter_side, 3)
    return 0.12


def _connected_wall_thickness(door_segment: tuple[Point, Point], walls: list[tuple[Point, Point]]) -> float | None:
    door_direction = _segment_unit_direction(door_segment)
    nearby_parallel_walls = [
        wall
        for wall in walls
        if abs(_segment_unit_direction(wall)[0] * door_direction[0] + _segment_unit_direction(wall)[1] * door_direction[1]) >= 0.95
        and _distance_between_segments(door_segment, wall) <= 0.8
    ]
    candidates: list[float] = []
    for first_index, first in enumerate(nearby_parallel_walls):
        first_midpoint = _segment_midpoint(first)
        for second in nearby_parallel_walls[first_index + 1 :]:
            distance = _parallel_segment_distance(first, second)
            if not 0.08 <= distance <= 0.4:
                continue
            if line_length(first_midpoint, _segment_midpoint(second)) > 1.2:
                continue
            candidates.append(distance)
    if not candidates:
        return None
    return round(min(candidates), 3)


def _distance_between_segments(first: tuple[Point, Point], second: tuple[Point, Point]) -> float:
    return min(
        _distance_to_segment(first[0], second[0], second[1]),
        _distance_to_segment(first[1], second[0], second[1]),
        _distance_to_segment(second[0], first[0], first[1]),
        _distance_to_segment(second[1], first[0], first[1]),
    )


def _parallel_segment_distance(first: tuple[Point, Point], second: tuple[Point, Point]) -> float:
    midpoint_first = _segment_midpoint(first)
    midpoint_second = _segment_midpoint(second)
    return line_length(midpoint_first, midpoint_second)


def _classify_door(width_m: float) -> tuple[str, bool, bool]:
    if width_m >= 1.5:
        return ("large_opening", True, False)
    if width_m >= 1.2:
        return ("suspected_large_opening", False, True)
    return ("normal_door", False, False)


def _entity_is_closed_polyline(entity) -> bool:
    return bool(getattr(entity, "closed", False) or getattr(entity, "is_closed", False))


def _extract_base_drawing(modelspace, scale: float, bbox: dict[str, float]) -> tuple[list[tuple[Point, Point]], list[DrawingText]]:
    segments: list[tuple[Point, Point]] = []
    texts: list[DrawingText] = []
    for entity in modelspace:
        if _skip_base_entity(entity):
            continue
        for drawable in _drawable_entities(entity):
            if _skip_base_entity(drawable):
                continue
            for segment in _drawable_segments(drawable, scale):
                if _segment_intersects_bbox(segment, bbox):
                    segments.append(segment)
            if drawable.dxftype() in {"TEXT", "MTEXT"}:
                text = _text_content(drawable)
                point = _text_point(drawable, scale)
                if text and _point_in_bbox(point, bbox):
                    texts.append(DrawingText(text=text, point=point))
    return segments, texts


def _skip_base_entity(entity) -> bool:
    layer = entity.dxf.layer
    return (layer.startswith("QUOTE_") and layer != "QUOTE_TEXT") or layer in {"图框", "SH-尺寸标注"}


def _drawable_entities(entity) -> list:
    if entity.dxftype() != "INSERT":
        return [entity]
    try:
        return list(entity.virtual_entities())
    except Exception:
        return []


def _drawable_segments(entity, scale: float) -> list[tuple[Point, Point]]:
    entity_type = entity.dxftype()
    if entity_type in {"LINE", "LWPOLYLINE", "POLYLINE"}:
        return _entity_segments(entity, scale)
    if entity_type == "CIRCLE":
        return _arc_segments(entity.dxf.center, entity.dxf.radius, 0, 360, scale)
    if entity_type == "ARC":
        return _arc_segments(entity.dxf.center, entity.dxf.radius, entity.dxf.start_angle, entity.dxf.end_angle, scale)
    if entity_type == "ELLIPSE":
        return _ellipse_segments(entity, scale)
    if entity_type == "SPLINE":
        try:
            points = [_scale_point((point.x, point.y), scale) for point in entity.flattening(0.1)]
        except Exception:
            points = []
        return [(points[index], points[index + 1]) for index in range(len(points) - 1)]
    return []


def _arc_segments(center, radius: float, start_angle: float, end_angle: float, scale: float) -> list[tuple[Point, Point]]:
    if end_angle <= start_angle:
        end_angle += 360
    steps = max(8, int((end_angle - start_angle) / 12))
    points: list[Point] = []
    for index in range(steps + 1):
        angle = start_angle + (end_angle - start_angle) * index / steps
        radians = angle * math.pi / 180
        points.append(_scale_point((center.x + radius * math.cos(radians), center.y + radius * math.sin(radians)), scale))
    return [(points[index], points[index + 1]) for index in range(len(points) - 1)]


def _ellipse_segments(entity, scale: float) -> list[tuple[Point, Point]]:
    try:
        points = [_scale_point((point.x, point.y), scale) for point in entity.flattening(0.1)]
    except Exception:
        points = []
    return [(points[index], points[index + 1]) for index in range(len(points) - 1)]


def _scale_point(point: tuple[float, float], scale: float) -> Point:
    return (round(float(point[0]) * scale, 3), round(float(point[1]) * scale, 3))


def _text_content(entity) -> str:
    if entity.dxftype() == "MTEXT":
        return clean_mtext(entity.plain_text())
    return entity.dxf.text.strip()


def clean_mtext(text: str) -> str:
    cleaned = re.sub(r"\{\\[^;{}]*;([^{}]*)\}", r"\1", text)
    return cleaned.replace("\\P", "\n").strip()


def _text_point(entity, scale: float) -> Point:
    insert = entity.dxf.insert
    return _scale_point((insert.x, insert.y), scale)


def _name_for_room(room: list[Point], texts: list[tuple[Point, str]]) -> str:
    candidates = [text for point, text in texts if contains_point(room, point)]
    chinese_names = [_dedupe_name(text) for text in candidates if _contains_cjk(text)]
    chinese_names = [name for index, name in enumerate(chinese_names) if name and name not in chinese_names[:index]]
    if chinese_names:
        return "/".join(chinese_names)
    if candidates:
        return candidates[0]
    return ""


def _floor_from_name(name: str) -> str:
    if "-" in name:
        return name.split("-", 1)[0]
    return "一层"


def _segment_in_room(room: list[Point], start: Point, end: Point) -> bool:
    midpoint = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
    return contains_point(room, midpoint) or _point_on_boundary(room, midpoint)


def _opening_associated_with_room(room: list[Point], start: Point, end: Point) -> bool:
    if _segment_in_room(room, start, end):
        return True
    midpoint = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
    return _distance_to_room_boundary(room, midpoint) <= 0.16


def _distance_to_room_boundary(room: list[Point], point: Point) -> float:
    if len(room) < 2:
        return float("inf")
    closed = [*room, room[0]]
    return min(_distance_to_segment(point, closed[index], closed[index + 1]) for index in range(len(closed) - 1))


def _distance_to_segment(point: Point, start: Point, end: Point) -> float:
    squared_length = (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2
    if squared_length == 0:
        return line_length(point, start)
    ratio = ((point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])) / squared_length
    ratio = min(1, max(0, ratio))
    projection = (start[0] + ratio * (end[0] - start[0]), start[1] + ratio * (end[1] - start[1]))
    return line_length(point, projection)


def _point_on_boundary(room: list[Point], point: Point) -> bool:
    if len(room) < 2:
        return False
    closed = [*room, room[0]]
    return any(_point_on_segment(point, closed[index], closed[index + 1]) for index in range(len(closed) - 1))


def _point_on_segment(point: Point, start: Point, end: Point) -> bool:
    squared_length = (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2
    if squared_length == 0:
        return False
    cross = (point[1] - start[1]) * (end[0] - start[0]) - (point[0] - start[0]) * (end[1] - start[1])
    if abs(cross) > 1e-6:
        return False
    dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])
    return 0 <= dot <= squared_length


def _contains_cjk(text: str) -> bool:
    return any("\u4e00" <= char <= "\u9fff" for char in text)


def _dedupe_name(text: str) -> str:
    return text.strip()


def _bbox_for_geometry(point_groups: list[list[Point]]) -> dict[str, float]:
    points = [point for group in point_groups for point in group]
    if not points:
        return {"min_x": 0, "min_y": 0, "max_x": 1, "max_y": 1}
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return {"min_x": round(min(xs), 3), "min_y": round(min(ys), 3), "max_x": round(max(xs), 3), "max_y": round(max(ys), 3)}


def _expanded_bbox(bbox: dict[str, float], padding: float) -> dict[str, float]:
    return {"min_x": bbox["min_x"] - padding, "min_y": bbox["min_y"] - padding, "max_x": bbox["max_x"] + padding, "max_y": bbox["max_y"] + padding}


def _point_in_bbox(point: Point, bbox: dict[str, float]) -> bool:
    return bbox["min_x"] <= point[0] <= bbox["max_x"] and bbox["min_y"] <= point[1] <= bbox["max_y"]


def _segment_intersects_bbox(segment: tuple[Point, Point], bbox: dict[str, float]) -> bool:
    start, end = segment
    return max(start[0], end[0]) >= bbox["min_x"] and min(start[0], end[0]) <= bbox["max_x"] and max(start[1], end[1]) >= bbox["min_y"] and min(start[1], end[1]) <= bbox["max_y"]
