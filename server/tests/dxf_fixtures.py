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


def build_kitchen_cabinet_dxf() -> bytes:
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    for layer in ["QUOTE_ROOM", "QUOTE_WALL", "QUOTE_CABINET", "QUOTE_TEXT"]:
        doc.layers.add(layer)
    msp.add_lwpolyline([(0, 0), (3600, 0), (3600, 2400), (0, 2400), (0, 0)], dxfattribs={"layer": "QUOTE_ROOM"})
    msp.add_line((0, 0), (3600, 0), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((3600, 0), (3600, 2400), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 2400), (3600, 2400), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((0, 0), (0, 2400), dxfattribs={"layer": "QUOTE_WALL"})
    msp.add_line((300, 300), (3300, 300), dxfattribs={"layer": "QUOTE_CABINET"})
    msp.add_line((3300, 300), (3300, 1600), dxfattribs={"layer": "QUOTE_CABINET"})
    msp.add_line((5000, 0), (6000, 0), dxfattribs={"layer": "QUOTE_CABINET"})
    msp.add_text("一层-厨房", dxfattribs={"layer": "QUOTE_TEXT", "insert": (1800, 1200)})
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
