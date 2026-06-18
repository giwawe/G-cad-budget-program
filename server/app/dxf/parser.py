from dataclasses import dataclass, field


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


def parse_dxf_layers(_: bytes) -> ParsedDxf:
    raise NotImplementedError("DXF layer extraction will be implemented after standardized sample files exist.")

