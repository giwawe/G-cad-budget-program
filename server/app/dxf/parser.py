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
class DrawingGeometry:
    spaces: list[DrawingSpace]
    walls: list[tuple[Point, Point]]
    measured_walls: list[tuple[Point, Point]]
    windows: list[tuple[Point, Point]]
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
    windows: list[tuple[Point, Point]] = []
    doors: list[tuple[Point, Point]] = []
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
            windows.extend(_entity_segments(entity, defaults.unit_scale_to_m))
        elif layer == "QUOTE_DOOR":
            doors.extend(_door_segments(entity, defaults.unit_scale_to_m))
        elif layer in {"QUOTE_TEXT", "QUOTE_FLOOR", "QUOTE_HEIGHT"} and entity.dxftype() in {"TEXT", "MTEXT"}:
            text = _text_content(entity)
            point = _text_point(entity, defaults.unit_scale_to_m)
            if text:
                texts.append((point, text))

    spaces: list[SpaceInput] = []
    drawing_spaces: list[DrawingSpace] = []
    for room in rooms:
        name = _name_for_room(room, texts)
        if not name:
            continue
        room_walls = [(start, end) for start, end in walls if _segment_in_room(room, start, end)]
        measured_walls.extend(room_walls)
        drawing_spaces.append(DrawingSpace(name=name, points=room))
        spaces.append(
            SpaceInput(
                floor=_floor_from_name(name),
                name=name,
                boundary_points_m=room,
                wall_lengths_m=[round(line_length(start, end), 2) for start, end in room_walls],
                windows=[OpeningInput(width_m=round(line_length(start, end), 2)) for start, end in windows if _segment_in_room(room, start, end)],
                doors=[OpeningInput(width_m=round(line_length(start, end), 2)) for start, end in doors if _segment_in_room(room, start, end)],
                anomalies=[],
            )
        )

    initial_bbox = _bbox_for_geometry([space.points for space in drawing_spaces])
    review_bbox = _expanded_bbox(initial_bbox, padding=2.0)
    base_segments, base_texts = _extract_base_drawing(modelspace, defaults.unit_scale_to_m, review_bbox)
    drawing = DrawingGeometry(
        spaces=drawing_spaces,
        walls=walls,
        measured_walls=measured_walls,
        windows=windows,
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


def _door_segments(entity, scale: float) -> list[tuple[Point, Point]]:
    if entity.dxftype() != "INSERT":
        return _entity_segments(entity, scale)
    virtual_centerline = _door_insert_centerline_from_virtual_entities(entity, scale)
    if virtual_centerline:
        return [virtual_centerline]
    width_m = _door_insert_width_m(entity, scale)
    insert = _scale_point((entity.dxf.insert.x, entity.dxf.insert.y), scale)
    rotation = math.radians(float(getattr(entity.dxf, "rotation", 0) or 0))
    direction = (math.cos(rotation), math.sin(rotation))
    half_width = width_m / 2
    return [
        (
            (round(insert[0] - direction[0] * half_width, 3), round(insert[1] - direction[1] * half_width, 3)),
            (round(insert[0] + direction[0] * half_width, 3), round(insert[1] + direction[1] * half_width, 3)),
        )
    ]


def _door_insert_centerline_from_virtual_entities(entity, scale: float) -> tuple[Point, Point] | None:
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
    return (start, end)


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
    return "未分层"


def _segment_in_room(room: list[Point], start: Point, end: Point) -> bool:
    midpoint = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2)
    return contains_point(room, midpoint) or _point_on_boundary(room, midpoint)


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
