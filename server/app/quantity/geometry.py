from math import hypot


Point = tuple[float, float]


def close_polygon(points: list[Point]) -> list[Point]:
    if not points:
        return []
    if points[0] == points[-1]:
        return points
    return [*points, points[0]]


def polygon_area(points: list[Point]) -> float:
    closed = close_polygon(points)
    if len(closed) < 4:
        return 0.0

    area = 0.0
    for index in range(len(closed) - 1):
        x1, y1 = closed[index]
        x2, y2 = closed[index + 1]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2


def polyline_length(points: list[Point], closed: bool = False) -> float:
    if len(points) < 2:
        return 0.0
    measured = close_polygon(points) if closed else points
    return sum(line_length(measured[index], measured[index + 1]) for index in range(len(measured) - 1))


def line_length(start: Point, end: Point) -> float:
    return hypot(end[0] - start[0], end[1] - start[1])


def contains_point(polygon: list[Point], point: Point) -> bool:
    closed = close_polygon(polygon)
    if len(closed) < 4:
        return False

    x, y = point
    inside = False
    for index in range(len(closed) - 1):
        x1, y1 = closed[index]
        x2, y2 = closed[index + 1]
        crosses = (y1 > y) != (y2 > y)
        if crosses:
            x_at_y = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < x_at_y:
                inside = not inside
    return inside

