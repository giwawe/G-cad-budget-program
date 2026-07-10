from io import StringIO

import ezdxf


def _save_doc(doc) -> bytes:
    stream = StringIO()
    doc.write(stream)
    return stream.getvalue().encode("utf-8")


def build_simple_quote_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WINDOW", "QUOTE_DOOR", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 5000), (0, 5000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 0), (6000, 5000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 5000), (4000, 5000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((1000, 0), (4200, 0), dxfattribs={"layer": "QUOTE_WINDOW"})
    msp.add_line((5000, 0), (5900, 0), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 2500)})
    return _save_doc(doc)


def build_misspelled_quote_layer_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUQTE_ROOM", "QUQTE_WALL", "QUQTE_WINDOM", "QUOTE_WINDOM", "QUQTE_DOOR", "QUQTE_TEXT", "QUQTE_EXT_WALL", "OUOTE_HEIGHT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 5000), (0, 5000), (0, 0)], dxfattribs={"layer": "QUQTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUQTE_WALL"})
    msp.add_line((6000, 0), (6000, 5000), dxfattribs={"layer": "QUQTE_WALL"})
    msp.add_line((0, 5000), (4000, 5000), dxfattribs={"layer": "QUQTE_WALL"})
    msp.add_line((1000, 0), (4200, 0), dxfattribs={"layer": "QUQTE_WINDOM"})
    msp.add_line((4500, 0), (5500, 0), dxfattribs={"layer": "QUOTE_WINDOM"})
    msp.add_text("HEIGHT=1500", dxfattribs={"layer": "OUOTE_HEIGHT", "insert": (2600, 200)})
    msp.add_line((5000, 0), (5900, 0), dxfattribs={"layer": "QUQTE_DOOR"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUQTE_TEXT", "insert": (3000, 2500)})
    exterior = msp.add_lwpolyline([(-1000, -1000), (7000, -1000), (7000, 6000), (-1000, 6000)], dxfattribs={"layer": "QUQTE_EXT_WALL"})
    exterior.closed = True
    return _save_doc(doc)


def build_void_opening_railing_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_TEXT", "QUOTE_VOID", "QUOTE_OPENING", "QUOTE_RAILING"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (4000, 0), (4000, 3000), (0, 3000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (4000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((4000, 0), (4000, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((4000, 3000), (0, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 3000), (0, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((4000, 0), (4000, 3000), dxfattribs={"layer": "QUOTE_OPENING"})
    void = msp.add_hatch(color=4, dxfattribs={"layer": "QUOTE_VOID"})
    void.paths.add_polyline_path([(500, 500), (3500, 500), (3500, 2500), (500, 2500)], is_closed=True)
    msp.add_line((500, 500), (3500, 500), dxfattribs={"layer": "QUOTE_RAILING"})
    msp.add_text("一层-楼梯间", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2000, 1500)})
    return _save_doc(doc)


def build_edge_ceiling_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_TEXT", "QUOTE_EDGE_CEILING"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((5000, 0), (5000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((5000, 4000), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (0, 0), dxfattribs={"layer": "QUOTE_WALL"})
    edge_ceiling = msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 1000), (0, 1000)], dxfattribs={"layer": "QUOTE_EDGE_CEILING"})
    edge_ceiling.closed = True
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_no_ceiling_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_TEXT", "QUOTE_GYPSUM_LINE_CEILING", "QUOTE_NO_CEILING"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((5000, 0), (5000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((5000, 4000), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (0, 0), dxfattribs={"layer": "QUOTE_WALL"})
    no_ceiling = msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000)], dxfattribs={"layer": "QUOTE_NO_CEILING"})
    no_ceiling.closed = True
    gypsum_line = msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 1000), (0, 1000)], dxfattribs={"layer": "QUOTE_GYPSUM_LINE_CEILING"})
    gypsum_line.closed = True
    msp.add_text("一层-车库", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_floor_marker_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_TEXT", "QUOTE_FLOOR"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3000, 0), (3000, 2500), (0, 2500), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_text("储藏间", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, 1200)})
    msp.add_text("负1楼", dxfattribs={"layer": "QUOTE_FLOOR", "insert": (3500, 0)})
    msp.add_lwpolyline([(0, -5000), (3000, -5000), (3000, -2500), (0, -2500), (0, -5000)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_text("客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, -3800)})
    msp.add_text("1楼", dxfattribs={"layer": "QUOTE_FLOOR", "insert": (3500, -5000)})
    return _save_doc(doc)


def build_floor_marker_below_room_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_TEXT", "QUOTE_FLOOR"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, -1500), (3000, -1500), (3000, -500), (0, -500), (0, -1500)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_text("储藏间", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, -1000)})
    msp.add_text("负2楼", dxfattribs={"layer": "QUOTE_FLOOR", "insert": (3500, -3000)})
    msp.add_lwpolyline([(0, -5700), (3000, -5700), (3000, -4700), (0, -4700), (0, -5700)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_text("麻将房", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, -5200)})
    msp.add_text("负1楼", dxfattribs={"layer": "QUOTE_FLOOR", "insert": (3500, -8000)})
    return _save_doc(doc)


def build_closed_window_polyline_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WINDOW", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    window = msp.add_lwpolyline([(1000, 0), (3000, 0), (3000, 240), (1000, 240)], dxfattribs={"layer": "QUOTE_WINDOW"})
    window.closed = True
    msp.add_text("客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_deep_rectangular_window_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WINDOW", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    window = msp.add_lwpolyline([(1000, 0), (3000, 0), (3000, 800), (1000, 800)], dxfattribs={"layer": "QUOTE_WINDOW"})
    window.closed = True
    msp.add_text("客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_window_on_short_wall_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WINDOW", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 3000), (0, 3000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 0), (6000, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 3000), (6000, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 900), (6000, 2100), dxfattribs={"layer": "QUOTE_WINDOW"})
    msp.add_text("一层-主卧", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 1500)})
    return _save_doc(doc)


def build_window_height_marker_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WINDOW", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((1000, 0), (3000, 0), dxfattribs={"layer": "QUOTE_WINDOW"})
    msp.add_text("HEIGHT=1500", dxfattribs={"layer": "QUOTE_WINDOW", "insert": (2000, 180)})
    msp.add_text("客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_l_shaped_window_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WINDOW", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 0), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((4200, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WINDOW"})
    msp.add_line((6000, 0), (6000, 1600), dxfattribs={"layer": "QUOTE_WINDOW"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 2000)})
    return _save_doc(doc)


def build_ext_wall_area_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_EXT_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3000, 0), (3000, 2000), (0, 2000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, 1000)})
    exterior = msp.add_lwpolyline([(-1000, -1000), (4000, -1000), (4000, 3000), (-1000, 3000)], dxfattribs={"layer": "QUOTE_EXT_WALL"})
    exterior.closed = True
    smaller_exterior = msp.add_lwpolyline([(6000, 0), (7000, 0), (7000, 1000), (6000, 1000)], dxfattribs={"layer": "QUOTE_EXT_WALL"})
    smaller_exterior.closed = True
    return _save_doc(doc)


def build_ext_wall_area_repeated_endpoint_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_EXT_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3000, 0), (3000, 2000), (0, 2000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, 1000)})
    msp.add_lwpolyline([(-1000, -1000), (4000, -1000), (4000, 3000), (-1000, 3000), (-1000, -1000)], dxfattribs={"layer": "QUOTE_EXT_WALL"})
    return _save_doc(doc)


def build_balcony_wall_tile_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_WALL_TILE", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3000, 0), (3000, 2000), (0, 2000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3000, 0), (3000, 2000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 2000), (3000, 2000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 2000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (3000, 0), dxfattribs={"layer": "QUOTE_WALL_TILE"})
    msp.add_line((3000, 0), (3000, 2000), dxfattribs={"layer": "QUOTE_WALL_TILE"})
    msp.add_line((5000, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL_TILE"})
    msp.add_text("一层-阳台", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, 1000)})
    return _save_doc(doc)


def build_new_wall_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_NEW_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 0), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((2000, 500), (2000, 2900), dxfattribs={"layer": "QUOTE_NEW_WALL"})
    msp.add_line((3200, 500), (4800, 500), dxfattribs={"layer": "QUOTE_NEW_WALL"})
    msp.add_line((8000, 0), (9000, 0), dxfattribs={"layer": "QUOTE_NEW_WALL"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 2000)})
    return _save_doc(doc)


def build_new_wall_height_marker_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_NEW_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((2000, 500), (2000, 2900), dxfattribs={"layer": "QUOTE_NEW_WALL"})
    msp.add_text("HEIGHT=1200 THICKNESS=240", dxfattribs={"layer": "QUOTE_NEW_WALL", "insert": (2150, 1700)})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 2000)})
    return _save_doc(doc)


def build_demolition_wall_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_DEMO_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 0), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((2000, 500), (2000, 2900), dxfattribs={"layer": "QUOTE_DEMO_WALL"})
    msp.add_line((3200, 500), (4800, 500), dxfattribs={"layer": "QUOTE_DEMO_WALL"})
    msp.add_line((8000, 0), (9000, 0), dxfattribs={"layer": "QUOTE_DEMO_WALL"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 2000)})
    return _save_doc(doc)


def build_background_wall_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_BACKGROUND_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((1000, 3500), (4200, 3500), dxfattribs={"layer": "QUOTE_BACKGROUND_WALL"})
    msp.add_text("H=2600", dxfattribs={"layer": "QUOTE_BACKGROUND_WALL", "insert": (2600, 3350)})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_kitchen_cabinet_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_BASE_CABINET", "QUOTE_WALL_CABINET", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3600, 0), (3600, 2400), (0, 2400), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3600, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3600, 0), (3600, 2400), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 2400), (3600, 2400), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 2400), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((300, 300), (3300, 300), dxfattribs={"layer": "QUOTE_BASE_CABINET"})
    msp.add_line((3300, 300), (3300, 1600), dxfattribs={"layer": "QUOTE_BASE_CABINET"})
    msp.add_line((300, 300), (3300, 300), dxfattribs={"layer": "QUOTE_WALL_CABINET"})
    msp.add_line((5000, 0), (6000, 0), dxfattribs={"layer": "QUOTE_BASE_CABINET"})
    msp.add_line((5000, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL_CABINET"})
    msp.add_text("一层-厨房", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1800, 1200)})
    return _save_doc(doc)


def build_kitchen_cabinet_outline_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_BASE_CABINET", "QUOTE_WALL_CABINET", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((5000, 0), (5000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (5000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    base = msp.add_lwpolyline(
        [(300, 300), (3300, 300), (3300, 900), (900, 900), (900, 2300), (300, 2300)],
        dxfattribs={"layer": "QUOTE_BASE_CABINET"},
    )
    base.closed = True
    wall = msp.add_lwpolyline(
        [(3600, 300), (4800, 300), (4800, 650), (3600, 650), (3600, 300)],
        dxfattribs={"layer": "QUOTE_WALL_CABINET"},
    )
    wall.closed = False
    msp.add_line((3300, 300), (3300, 650), dxfattribs={"layer": "QUOTE_BASE_CABINET"})
    msp.add_line((3600, 650), (3950, 650), dxfattribs={"layer": "QUOTE_WALL_CABINET"})
    msp.add_text("一层-厨房", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_custom_cabinet_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_CUSTOM", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3600, 0), (3600, 3000), (0, 3000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3600, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3600, 0), (3600, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 3000), (3600, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((300, 300), (3300, 300), dxfattribs={"layer": "QUOTE_CUSTOM"})
    msp.add_line((300, 800), (2300, 800), dxfattribs={"layer": "QUOTE_CUSTOM"})
    msp.add_text("H=800", dxfattribs={"layer": "QUOTE_CUSTOM", "insert": (1300, 950)})
    msp.add_line((5000, 0), (6000, 0), dxfattribs={"layer": "QUOTE_CUSTOM"})
    msp.add_text("一层-主卧", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1800, 1500)})
    return _save_doc(doc)


def build_closed_custom_cabinet_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_CUSTOM", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (4200, 0), (4200, 3000), (0, 3000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    custom = msp.add_lwpolyline([(300, 300), (3300, 300), (3300, 900), (300, 900)], dxfattribs={"layer": "QUOTE_CUSTOM"})
    custom.closed = True
    msp.add_text("一层-主卧", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2100, 1500)})
    return _save_doc(doc)


def build_bathroom_fixture_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_TOILET", "QUOTE_BATHROOM_VANITY", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    toilet_block = doc.blocks.new(name="toilet_model")
    toilet_block.add_circle((0, 0), 200)
    vanity_block = doc.blocks.new(name="vanity_model")
    vanity_block.add_lwpolyline([(-300, -200), (300, -200), (300, 200), (-300, 200), (-300, -200)])
    msp.add_lwpolyline([(0, 0), (2600, 0), (2600, 2200), (0, 2200), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (2600, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((2600, 0), (2600, 2200), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 2200), (2600, 2200), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 2200), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_blockref("toilet_model", (700, 700), dxfattribs={"layer": "QUOTE_TOILET"})
    msp.add_point((1800, 700), dxfattribs={"layer": "QUOTE_BATHROOM_VANITY"})
    msp.add_blockref("vanity_model", (1800, 1500), dxfattribs={"layer": "QUOTE_BATHROOM_VANITY"})
    msp.add_blockref("toilet_model", (5000, 700), dxfattribs={"layer": "QUOTE_TOILET"})
    msp.add_text("一层-卫生间", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1300, 1100)})
    return _save_doc(doc)


def build_insert_door_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_DOOR", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    block = doc.blocks.new(name="door_model")
    block.add_line((-450, 0), (450, 0))
    block.add_line((-450, 130), (450, 130))
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_blockref("door_model", (2500, 0), dxfattribs={"layer": "QUOTE_DOOR", "rotation": 0})
    msp.add_text("客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_closed_door_polyline_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_DOOR", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (5000, 0), (5000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    door = msp.add_lwpolyline([(1000, 0), (1900, 0), (1900, 120), (1000, 120)], dxfattribs={"layer": "QUOTE_DOOR"})
    door.closed = True
    msp.add_text("客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (2500, 2000)})
    return _save_doc(doc)


def build_auto_door_type_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_DOOR", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    interior_block = doc.blocks.new(name="interior_door_model")
    interior_block.add_line((-450, 0), (450, 0))
    entry_block = doc.blocks.new(name="入户门_model")
    entry_block.add_line((-450, 0), (450, 0))
    sliding_block = doc.blocks.new(name="推拉门_model")
    sliding_block.add_line((-600, 0), (600, 0))
    msp.add_lwpolyline([(0, 0), (6000, 0), (6000, 4000), (0, 4000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (6000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((6000, 0), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 4000), (6000, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 4000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((500, 0), (1400, 0), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_blockref("interior_door_model", (2250, 0), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_blockref("入户门_model", (3550, 0), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_blockref("推拉门_model", (5000, 0), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_line((1000, 4000), (2500, 4000), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_text("一层-客厅", dxfattribs={"layer": "QUOTE_TEXT", "insert": (3000, 2000)})
    return _save_doc(doc)


def build_bedroom_bathroom_door_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_DOOR", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3000, 0), (3000, 3000), (0, 3000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_lwpolyline([(3000, 0), (5000, 0), (5000, 2200), (3000, 2200), (3000, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3000, 0), (3000, 3000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3000, 0), (5000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((5000, 0), (5000, 2200), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3000, 900), (3000, 1700), dxfattribs={"layer": "QUOTE_DOOR"})
    msp.add_text("一层-主卧", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, 1500)})
    msp.add_text("一层-公卫", dxfattribs={"layer": "QUOTE_TEXT", "insert": (4000, 1000)})
    return _save_doc(doc)


def build_two_room_quote_dxf_with_duplicate_close_point() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3000, 0), (3000, 2000), (0, 2000), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_lwpolyline([(5000, 0), (8000, 0), (8000, 2000), (5000, 2000), (5000, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3000, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3000, 0), (3000, 2000), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_text("房间A", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1500, 1000)})
    msp.add_text("房间B", dxfattribs={"layer": "QUOTE_TEXT", "insert": (6500, 1000)})
    return _save_doc(doc)
