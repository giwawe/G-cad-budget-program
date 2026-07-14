from __future__ import annotations

import datetime as dt
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps" / "web" / "public" / "training" / "designer-training-v1.1.pptx"

SLIDE_W = 12_192_000
SLIDE_H = 6_858_000
EMU_PER_INCH = 914_400

FONT = "Microsoft YaHei"
FONT_ALT = "DengXian"

INK = "10242B"
MUTED = "607780"
PAPER = "F5FAF8"
SURFACE = "FFFFFF"
BLUEPRINT = "113D49"
BLUEPRINT_DARK = "0B2C35"
TEAL = "08786C"
CYAN = "5ED0C5"
GOLD = "D6A34D"
CORAL = "D45A4D"
LINE = "CFE0E2"
PALE_TEAL = "E8F6F3"
PALE_GOLD = "FFF6E0"
PALE_CORAL = "FFF0EC"


def emu(value: float) -> int:
    return int(round(value * EMU_PER_INCH))


def xml(text: object) -> str:
    return escape(str(text), {'"': "&quot;"})


def percent_alpha(opacity: float) -> str:
    return f'<a:alpha val="{int(round(opacity * 100000))}"/>'


def color_fill(color: str, opacity: float | None = None) -> str:
    alpha = percent_alpha(opacity) if opacity is not None else ""
    return f'<a:solidFill><a:srgbClr val="{color}">{alpha}</a:srgbClr></a:solidFill>'


@dataclass
class Slide:
    title: str
    theme: str = "light"
    parts: list[str] = field(default_factory=list)
    shape_id: int = 2

    def next_id(self) -> int:
        current = self.shape_id
        self.shape_id += 1
        return current

    def add(self, part: str) -> None:
        self.parts.append(part)


def shape(
    slide: Slide,
    x: float,
    y: float,
    w: float,
    h: float,
    *,
    fill: str | None = SURFACE,
    line: str | None = LINE,
    line_width: int = 9_525,
    preset: str = "rect",
    name: str = "shape",
    opacity: float | None = None,
) -> None:
    sid = slide.next_id()
    fill_xml = "<a:noFill/>" if fill is None else color_fill(fill, opacity)
    line_xml = "<a:ln><a:noFill/></a:ln>" if line is None else f'<a:ln w="{line_width}">{color_fill(line)}</a:ln>'
    slide.add(
        f"""
        <p:sp>
          <p:nvSpPr><p:cNvPr id="{sid}" name="{xml(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
          <p:spPr>
            <a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>
            <a:prstGeom prst="{preset}"><a:avLst/></a:prstGeom>
            {fill_xml}
            {line_xml}
          </p:spPr>
        </p:sp>
        """
    )


def text_body(
    paragraphs: list[str],
    *,
    size: int,
    color: str,
    bold: bool = False,
    align: str = "l",
    line_spacing: int = 112,
) -> str:
    para_xml = []
    bold_attr = ' b="1"' if bold else ""
    for para in paragraphs:
        para_xml.append(
            f"""
            <a:p>
              <a:pPr algn="{align}">
                <a:lnSpc><a:spcPct val="{line_spacing * 1000}"/></a:lnSpc>
              </a:pPr>
              <a:r>
                <a:rPr lang="zh-CN" sz="{size}"{bold_attr}>
                  {color_fill(color)}
                  <a:latin typeface="{FONT}"/>
                  <a:ea typeface="{FONT}"/>
                  <a:cs typeface="{FONT_ALT}"/>
                </a:rPr>
                <a:t>{xml(para)}</a:t>
              </a:r>
            </a:p>
            """
        )
    return "".join(para_xml)


def text_box(
    slide: Slide,
    x: float,
    y: float,
    w: float,
    h: float,
    paragraphs: str | list[str],
    *,
    size: int = 1_800,
    color: str = INK,
    bold: bool = False,
    align: str = "l",
    name: str = "text",
    line_spacing: int = 112,
) -> None:
    sid = slide.next_id()
    ps = [paragraphs] if isinstance(paragraphs, str) else paragraphs
    slide.add(
        f"""
        <p:sp>
          <p:nvSpPr><p:cNvPr id="{sid}" name="{xml(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
          <p:spPr>
            <a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            <a:noFill/>
            <a:ln><a:noFill/></a:ln>
          </p:spPr>
          <p:txBody>
            <a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
            <a:lstStyle/>
            {text_body(ps, size=size, color=color, bold=bold, align=align, line_spacing=line_spacing)}
          </p:txBody>
        </p:sp>
        """
    )


def header(slide: Slide, section: str, index: int) -> None:
    dark = slide.theme == "dark"
    title_color = SURFACE if dark else INK
    muted_color = "B6D4D8" if dark else MUTED
    shape(slide, 0.45, 0.34, 0.78, 0.34, fill=TEAL if not dark else CYAN, line=None, preset="roundRect", name="slide number")
    text_box(slide, 0.58, 0.405, 0.5, 0.18, f"{index:02d}", size=1_100, color=SURFACE if not dark else BLUEPRINT_DARK, bold=True, align="c")
    text_box(slide, 1.34, 0.34, 5.8, 0.28, section, size=1_050, color=muted_color, bold=True)
    text_box(slide, 0.45, 0.76, 8.4, 0.55, slide.title, size=2_650, color=title_color, bold=True)


def blueprint_background(slide: Slide, *, dark: bool = False) -> None:
    fill = BLUEPRINT_DARK if dark else PAPER
    line_color = "1F5965" if dark else "DCEBED"
    shape(slide, 0, 0, 13.333, 7.5, fill=fill, line=None, name="background")
    for x in [i * 0.5 for i in range(1, 27)]:
        shape(slide, x, 0, 0.006, 7.5, fill=line_color, line=None, opacity=0.28 if dark else 0.55, name="grid line")
    for y in [i * 0.5 for i in range(1, 15)]:
        shape(slide, 0, y, 13.333, 0.006, fill=line_color, line=None, opacity=0.28 if dark else 0.55, name="grid line")


def pill(slide: Slide, x: float, y: float, text: str, *, fill: str, color: str = SURFACE, w: float = 1.4) -> None:
    shape(slide, x, y, w, 0.36, fill=fill, line=None, preset="roundRect")
    text_box(slide, x + 0.08, y + 0.075, w - 0.16, 0.14, text, size=1_050, color=color, bold=True, align="c")


def bullet_list(slide: Slide, x: float, y: float, bullets: list[str], *, color: str = INK, size: int = 1_450, gap: float = 0.43) -> None:
    for offset, item in enumerate(bullets):
        cy = y + offset * gap
        shape(slide, x, cy + 0.08, 0.12, 0.12, fill=TEAL, line=None, preset="ellipse")
        text_box(slide, x + 0.24, cy, 5.4, 0.28, item, size=size, color=color)


def card(
    slide: Slide,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    body: list[str] | str,
    *,
    accent: str = TEAL,
    fill: str = SURFACE,
    title_color: str = INK,
    body_color: str = MUTED,
) -> None:
    shape(slide, x, y, w, h, fill=fill, line=LINE, preset="roundRect", line_width=7_620)
    shape(slide, x, y, 0.09, h, fill=accent, line=None)
    text_box(slide, x + 0.28, y + 0.23, w - 0.55, 0.32, title, size=1_450, color=title_color, bold=True)
    ps = body if isinstance(body, list) else [body]
    text_box(slide, x + 0.28, y + 0.7, w - 0.55, h - 0.9, ps, size=1_130, color=body_color, line_spacing=120)


def process_step(slide: Slide, x: float, y: float, title: str, note: str, index: int) -> None:
    shape(slide, x, y, 2.15, 1.05, fill=SURFACE, line=LINE, preset="roundRect", line_width=7_620)
    shape(slide, x + 0.16, y + 0.18, 0.36, 0.36, fill=TEAL, line=None, preset="ellipse")
    text_box(slide, x + 0.25, y + 0.25, 0.18, 0.12, str(index), size=950, color=SURFACE, bold=True, align="c")
    text_box(slide, x + 0.66, y + 0.17, 1.28, 0.26, title, size=1_210, color=INK, bold=True)
    text_box(slide, x + 0.18, y + 0.58, 1.72, 0.28, note, size=930, color=MUTED, align="c")


def floorplan_icon(slide: Slide, x: float, y: float, w: float, h: float, *, ok: bool = True) -> None:
    shape(slide, x, y, w, h, fill="123C49", line="2B7180", line_width=11_430, preset="roundRect")
    room_line = CYAN if ok else CORAL
    shape(slide, x + 0.28, y + 0.32, w * 0.36, h * 0.42, fill="1E5864", line=room_line, line_width=12_000)
    shape(slide, x + w * 0.55, y + 0.28, w * 0.28, h * 0.48, fill="254D55", line=room_line, line_width=12_000)
    shape(slide, x + 0.32, y + h * 0.58, w * 0.5, h * 0.24, fill="213F4A", line=room_line, line_width=12_000)
    if ok:
        shape(slide, x + 0.73, y + 0.72, 0.12, 0.12, fill=GOLD, line=SURFACE, preset="ellipse")
        shape(slide, x + 1.55, y + 0.54, 0.12, 0.12, fill=GOLD, line=SURFACE, preset="ellipse")
    else:
        shape(slide, x + 0.64, y + 0.48, w * 0.34, h * 0.38, fill=None, line=CORAL, line_width=18_000)
        text_box(slide, x + 0.67, y + 0.78, w * 0.5, 0.2, "重叠/混名", size=850, color=PALE_CORAL, bold=True)


def metric_tile(slide: Slide, x: float, y: float, label: str, value: str) -> None:
    shape(slide, x, y, 1.75, 0.82, fill=SURFACE, line=LINE, preset="roundRect", line_width=6_500)
    text_box(slide, x + 0.17, y + 0.17, 1.25, 0.16, label, size=830, color=MUTED)
    text_box(slide, x + 0.17, y + 0.43, 1.35, 0.22, value, size=1_240, color=INK, bold=True)


def make_title_slide() -> Slide:
    slide = Slide("整装预算报价系统", theme="dark")
    blueprint_background(slide, dark=True)
    shape(slide, 0.62, 0.72, 12.1, 6.05, fill="0F3944", line="286672", opacity=0.86, preset="roundRect")
    floorplan_icon(slide, 7.6, 1.15, 3.9, 3.0, ok=True)
    pill(slide, 0.98, 1.06, "设计师培训 v1.1", fill=CYAN, color=BLUEPRINT_DARK, w=1.9)
    text_box(slide, 0.98, 1.58, 6.0, 0.78, "整装预算报价系统", size=3_850, color=SURFACE, bold=True)
    text_box(slide, 1.0, 2.5, 5.7, 0.5, "CAD / DWG / DXF 规范画图与平台快速上手", size=1_600, color="C8E7EA")
    bullet_list(
        slide,
        1.04,
        3.28,
        ["按规范画方案，系统才能自动算量", "上传后先复核，再导出预算", "异常提示按清单修图，减少返工"],
        color="E9F9F7",
        size=1_300,
        gap=0.5,
    )
    text_box(slide, 1.0, 6.07, 4.2, 0.24, "适用对象：设计师、报价员、门店培训负责人", size=1_050, color="9EC8CD")
    return slide


def make_objectives_slide() -> Slide:
    slide = Slide("看完这份 PPT 要会什么")
    blueprint_background(slide)
    header(slide, "培训目标", 2)
    card(slide, 0.75, 1.72, 3.55, 3.65, "会按规范画方案", ["知道哪些图层必须画", "知道空间命名、楼层、门窗和外墙轮廓怎么标", "知道哪些画法会导致算量异常"], accent=TEAL)
    card(slide, 4.88, 1.72, 3.55, 3.65, "会使用平台复核", ["会上传 DXF/DWG", "会看方案完整性、建筑面积、窗洞和空间状态", "会确认方案信息和水电点位"], accent=GOLD)
    card(slide, 9.02, 1.72, 3.55, 3.65, "会导出可核对预算", ["会选择预算模式", "会在预算预览页返回修改", "会下载预算表并交给报价流程"], accent=CYAN)
    text_box(slide, 0.75, 5.85, 11.6, 0.32, "一句话记住：先画对，再上传；先复核，再导出。", size=1_550, color=TEAL, bold=True, align="c")
    return slide


def make_workflow_slide() -> Slide:
    slide = Slide("从一张方案到一份预算的完整流程")
    blueprint_background(slide)
    header(slide, "系统流程", 3)
    steps = [
        ("规范画图", "按图层和命名完成方案"),
        ("方案上传", "DXF 或 DWG 均可上传"),
        ("完整性复核", "看面积、墙线、门窗和图形"),
        ("确认可选项", "铝窗、卫浴等按需加入"),
        ("预算预览", "先看表，再下载"),
    ]
    for idx, (title, note) in enumerate(steps, start=1):
        x = 0.65 + (idx - 1) * 2.48
        process_step(slide, x, 2.0, title, note, idx)
        if idx < len(steps):
            shape(slide, x + 2.18, 2.48, 0.45, 0.06, fill=TEAL, line=None)
            shape(slide, x + 2.58, 2.37, 0.18, 0.28, fill=TEAL, line=None, preset="triangle")
    card(
        slide,
        1.1,
        4.2,
        11.1,
        1.35,
        "培训建议",
        "第一次试用时建议选一套已人工核对过的真实图纸，从上传到预算导出完整走一遍；遇到异常先看修图提示，再回 CAD 修改。",
        accent=TEAL,
        fill=PALE_TEAL,
    )
    return slide


def make_layer_slide() -> Slide:
    slide = Slide("画图规范：这些图层最常用")
    blueprint_background(slide)
    header(slide, "画图规范 1", 4)
    rows = [
        ("QUOTE_ROOM", "空间闭合边界", "决定空间面积和空间归属"),
        ("QUOTE_WALL", "实际可施工墙线", "决定墙面展开、乳胶漆和墙砖"),
        ("QUOTE_EXT_WALL", "建筑外墙轮廓", "决定项目建筑面积"),
        ("QUOTE_WINDOW / QUOTE_DOOR", "窗洞 / 门洞", "决定扣减、门窗和门套数量"),
        ("QUOTE_TEXT / QUOTE_FLOOR", "空间名 / 楼层", "决定空间类型和楼层归属"),
        ("QUOTE_HEIGHT", "窗高、门高等补充标注", "决定窗洞面积和门洞高度"),
    ]
    for i, (layer, meaning, effect) in enumerate(rows):
        y = 1.55 + i * 0.62
        shape(slide, 0.75, y, 11.8, 0.48, fill=SURFACE, line=LINE, preset="roundRect", line_width=5_800)
        text_box(slide, 1.0, y + 0.12, 2.55, 0.15, layer, size=1_000, color=TEAL, bold=True)
        text_box(slide, 3.85, y + 0.12, 2.5, 0.15, meaning, size=1_000, color=INK, bold=True)
        text_box(slide, 6.5, y + 0.12, 4.8, 0.15, effect, size=1_000, color=MUTED)
    text_box(slide, 0.8, 5.68, 11.6, 0.32, "图层名必须尽量使用标准英文图层；系统兼容部分常见错拼，但培训和交付仍以标准图层为准。", size=1_100, color=TEAL, bold=True, align="c")
    return slide


def make_room_boundary_slide() -> Slide:
    slide = Slide("空间边界：闭合、不重叠、不混名")
    blueprint_background(slide)
    header(slide, "画图规范 2", 5)
    text_box(slide, 0.85, 1.55, 5.4, 0.32, "正确示意", size=1_450, color=TEAL, bold=True)
    text_box(slide, 7.0, 1.55, 5.4, 0.32, "错误示意", size=1_450, color=CORAL, bold=True)
    floorplan_icon(slide, 0.9, 2.0, 4.85, 2.85, ok=True)
    floorplan_icon(slide, 7.0, 2.0, 4.85, 2.85, ok=False)
    bullet_list(slide, 0.95, 5.12, ["每个 QUOTE_ROOM 都要闭合", "一个空间只表达一种计价性质", "电梯井、管井、挑空等要单独拆出"], size=1_050)
    bullet_list(slide, 7.05, 5.12, ["不要把电梯井框进楼梯间", "不要写“过道/电梯井”这类混合名称", "空间重叠不会自动扣除内层面积"], color=INK, size=1_050)
    return slide


def make_wall_opening_slide() -> Slide:
    slide = Slide("墙线、开放边和门洞怎么画")
    blueprint_background(slide)
    header(slide, "画图规范 3", 6)
    card(
        slide,
        0.75,
        1.6,
        3.65,
        3.6,
        "QUOTE_WALL",
        ["只画实际可施工墙面", "门洞位置不要画墙线", "墙线长度会影响墙面乳胶漆、墙砖、防水"],
        accent=TEAL,
    )
    card(
        slide,
        4.83,
        1.6,
        3.65,
        3.6,
        "QUOTE_OPENING",
        ["用于开放边、非墙体边界、挑空边", "与 QUOTE_WALL 重叠时会从墙面长度中排除", "适合客餐厅开口、阳台开放边"],
        accent=CYAN,
    )
    card(
        slide,
        8.92,
        1.6,
        3.65,
        3.6,
        "QUOTE_DOOR",
        ["普通门默认不扣墙面", "大洞口会提示设计师确认", "入户门、推拉门、卫生间门会进入对应报价口径"],
        accent=GOLD,
    )
    text_box(slide, 0.8, 5.76, 11.6, 0.3, "记忆点：墙线表示“要做的墙”，门洞表示“这里开了门”，开放边表示“这里不是墙”。", size=1_250, color=TEAL, bold=True, align="c")
    return slide


def make_floor_name_slide() -> Slide:
    slide = Slide("楼层和空间命名：让系统看懂图纸")
    blueprint_background(slide)
    header(slide, "画图规范 4", 7)
    card(slide, 0.7, 1.55, 5.65, 3.9, "推荐命名", ["负二层-车库", "负一层-影音室", "一层-客厅", "二层-主卧", "三层-露台"], accent=TEAL, fill=PALE_TEAL)
    card(slide, 6.98, 1.55, 5.65, 3.9, "不推荐命名", ["过道/电梯井", "客厅/楼梯间", "卫生间+盥洗区", "未命名空间", "同一层多个空间重名且没有区分"], accent=CORAL, fill=PALE_CORAL)
    text_box(slide, 0.85, 5.82, 11.4, 0.3, "多层项目一定要带楼层；一个空间不能同时承担两个不同用途。", size=1_300, color=INK, bold=True, align="c")
    return slide


def make_special_layers_slide() -> Slide:
    slide = Slide("厨卫、吊顶、柜体这些也能自动取数")
    blueprint_background(slide)
    header(slide, "画图规范 5", 8)
    rows = [
        ("QUOTE_WALL_TILE", "任意空间贴砖墙线", "用于墙砖面积"),
        ("QUOTE_EDGE_CEILING", "边吊 / 双眼皮吊顶闭合范围", "用于边吊面积和周长"),
        ("QUOTE_GYPSUM_LINE_CEILING", "石膏线吊顶闭合范围", "用于石膏线吊顶"),
        ("QUOTE_NO_CEILING", "原顶无吊顶范围", "用于扣减轻钢龙骨平顶"),
        ("QUOTE_BASE_CABINET / QUOTE_WALL_CABINET", "厨房地柜 / 吊柜", "用于橱柜延米"),
        ("QUOTE_CUSTOM", "非厨房定制柜体", "用于全屋定制面积"),
    ]
    for i, (layer, meaning, effect) in enumerate(rows):
        x = 0.75 if i % 2 == 0 else 6.75
        y = 1.5 + (i // 2) * 1.38
        card(slide, x, y, 5.55, 1.0, layer, [meaning, effect], accent=TEAL if i % 2 == 0 else GOLD)
    text_box(slide, 0.75, 5.8, 11.7, 0.28, "这些图层不是每张方案都必须画，但画得越规范，预算越少依赖人工补数。", size=1_170, color=MUTED, align="c")
    return slide


def make_preupload_slide() -> Slide:
    slide = Slide("上传前 60 秒自查清单")
    blueprint_background(slide)
    header(slide, "画图交付", 9)
    checks = [
        ("空间", "每个空间是否闭合、互不重叠？"),
        ("楼层", "多层图纸是否写清负二层、一层、二层？"),
        ("命名", "是否避免“过道/电梯井”这类混合名称？"),
        ("墙线", "门洞位置是否没有误画墙线？"),
        ("外墙", "QUOTE_EXT_WALL 是否闭合？"),
        ("门窗", "门窗、窗高是否按规范标注？"),
        ("特殊项", "吊顶、柜体、贴砖墙线是否分图层？"),
        ("保存", "DWG/DXF 文件是否是最新方案？"),
    ]
    for i, (label, note) in enumerate(checks):
        x = 0.75 + (i % 2) * 6.05
        y = 1.55 + (i // 2) * 0.95
        shape(slide, x, y, 5.5, 0.66, fill=SURFACE, line=LINE, preset="roundRect", line_width=6_500)
        shape(slide, x + 0.22, y + 0.18, 0.28, 0.28, fill=TEAL, line=None, preset="ellipse")
        text_box(slide, x + 0.64, y + 0.12, 0.9, 0.18, label, size=1_080, color=INK, bold=True)
        text_box(slide, x + 1.52, y + 0.12, 3.6, 0.18, note, size=1_020, color=MUTED)
    return slide


def make_upload_slide() -> Slide:
    slide = Slide("平台使用：进入首页并上传方案")
    blueprint_background(slide)
    header(slide, "平台操作 1", 10)
    shape(slide, 0.82, 1.55, 11.72, 3.35, fill=SURFACE, line=LINE, preset="roundRect")
    text_box(slide, 1.18, 1.88, 4.8, 0.38, "整装预算报价系统", size=2_150, color=INK, bold=True)
    pill(slide, 1.2, 2.58, "方案上传", fill=TEAL, w=1.55)
    pill(slide, 3.0, 2.58, "完整性复核", fill="EAF2F2", color=INK, w=1.75)
    pill(slide, 5.0, 2.58, "预算导出", fill="EAF2F2", color=INK, w=1.55)
    shape(slide, 8.1, 2.12, 2.3, 0.65, fill=TEAL, line=None, preset="roundRect")
    text_box(slide, 8.45, 2.32, 1.58, 0.18, "方案上传", size=1_100, color=SURFACE, bold=True, align="c")
    shape(slide, 10.62, 2.12, 1.4, 0.65, fill=SURFACE, line=LINE, preset="roundRect")
    text_box(slide, 10.83, 2.32, 0.9, 0.18, "DWG/DXF", size=970, color=TEAL, bold=True, align="c")
    bullet_list(slide, 1.0, 5.2, ["点击“方案上传”", "选择 DWG 或 DXF 文件", "等待系统解析完成，不要重复点击"], size=1_120)
    card(slide, 7.2, 5.05, 5.0, 1.0, "提示", "如果 DWG 转换失败，先让 CAD 另存为 DXF 再上传，或联系管理员检查转换器。", accent=GOLD, fill=PALE_GOLD)
    return slide


def make_review_slide() -> Slide:
    slide = Slide("平台使用：先看方案完整性复核")
    blueprint_background(slide)
    header(slide, "平台操作 2", 11)
    metric_tile(slide, 0.82, 1.55, "空间", "46")
    metric_tile(slide, 2.82, 1.55, "建筑面积", "509.78 m2")
    metric_tile(slide, 4.82, 1.55, "地面面积", "446.26 m2")
    metric_tile(slide, 6.82, 1.55, "墙砖面积", "1008.85 m2")
    metric_tile(slide, 8.82, 1.55, "窗洞面积", "85.28 m2")
    floorplan_icon(slide, 0.85, 2.72, 5.15, 2.75, ok=True)
    bullet_list(
        slide,
        6.65,
        2.78,
        ["建筑面积为 0：检查 QUOTE_EXT_WALL 是否闭合", "空间数量异常：检查是否漏画 QUOTE_ROOM", "某个房间面积不对：检查空间是否重叠或没闭合", "门窗扣减异常：查看门窗标记是否归属到正确空间"],
        size=1_090,
        gap=0.55,
    )
    return slide


def make_optional_slide() -> Slide:
    slide = Slide("平台使用：确认方案报价可选项")
    blueprint_background(slide)
    header(slide, "平台操作 3", 12)
    card(slide, 0.8, 1.52, 11.7, 1.2, "铝合金窗", "设计师可以选择是否加入本次预算，也可以调整面积和单价；总价会自动按面积 × 单价计算。", accent=TEAL, fill=PALE_TEAL)
    shape(slide, 1.05, 3.15, 11.15, 1.45, fill=SURFACE, line=LINE, preset="roundRect")
    text_box(slide, 1.3, 3.42, 1.1, 0.18, "面积", size=1_000, color=MUTED)
    text_box(slide, 1.3, 3.78, 1.35, 0.22, "85.28", size=1_280, color=INK, bold=True)
    text_box(slide, 3.65, 3.42, 1.1, 0.18, "单价", size=1_000, color=MUTED)
    text_box(slide, 3.65, 3.78, 1.6, 0.22, "600 元/M2", size=1_280, color=INK, bold=True)
    text_box(slide, 6.15, 3.42, 1.1, 0.18, "总价", size=1_000, color=MUTED)
    text_box(slide, 6.15, 3.78, 1.7, 0.22, "51168 元", size=1_280, color=TEAL, bold=True)
    pill(slide, 9.05, 3.64, "加入预算", fill=TEAL, w=1.35)
    pill(slide, 10.55, 3.64, "不计入", fill="EAF2F2", color=INK, w=1.05)
    text_box(slide, 0.95, 5.32, 11.2, 0.28, "其他可选项会继续扩展；当前入户门、推拉门、窗台石仍按方案自动识别。", size=1_150, color=MUTED, align="c")
    return slide


def make_hydropower_slide() -> Slide:
    slide = Slide("平台使用：水电点位默认收起，必要时展开修改")
    blueprint_background(slide)
    header(slide, "平台操作 4", 13)
    labels = [("强电插座", "106 位"), ("开关", "47 位"), ("灯位", "52 位"), ("给水点", "21 位"), ("排水点", "21 位"), ("强电线管", "633.69 M")]
    for i, (label, value) in enumerate(labels):
        metric_tile(slide, 0.82 + (i % 3) * 2.25, 1.55 + (i // 3) * 1.05, label, value)
    card(slide, 7.85, 1.55, 4.3, 2.1, "设计师要做什么", ["默认看汇总即可", "数量明显不对时展开空间明细", "修改后点“确定水电点位”"], accent=TEAL)
    card(slide, 1.0, 4.55, 11.2, 1.0, "重要", "水电数量会进入预算导出；如果修改了数量，一定要点确认，避免导出的预算还是旧数据。", accent=GOLD, fill=PALE_GOLD)
    return slide


def make_quantity_slide() -> Slide:
    slide = Slide("平台使用：空间工程量摘要只看关键项")
    blueprint_background(slide)
    header(slide, "平台操作 5", 14)
    for i, (name, area, tile, status) in enumerate(
        [
            ("负二层-车库", "31.36 m2", "74.78 m2", "需确认大洞口"),
            ("负二层-酒窖", "5.44 m2", "26.43 m2", "正常"),
            ("三层-主卧", "15.17 m2", "0.00 m2", "正常"),
        ]
    ):
        y = 1.55 + i * 1.35
        shape(slide, 0.82, y, 11.65, 1.05, fill=SURFACE, line=LINE, preset="roundRect")
        text_box(slide, 1.12, y + 0.2, 2.1, 0.22, name, size=1_190, color=INK, bold=True)
        text_box(slide, 3.55, y + 0.2, 1.5, 0.2, f"地面 {area}", size=1_020, color=MUTED)
        text_box(slide, 5.65, y + 0.2, 1.8, 0.2, f"墙砖 {tile}", size=1_020, color=MUTED)
        fill = PALE_CORAL if "需确认" in status else PALE_TEAL
        badge_color = CORAL if "需确认" in status else TEAL
        shape(slide, 9.65, y + 0.22, 1.8, 0.32, fill=fill, line=None, preset="roundRect")
        text_box(slide, 9.85, y + 0.3, 1.35, 0.1, status, size=850, color=badge_color, bold=True, align="c")
    text_box(slide, 0.95, 5.8, 11.4, 0.3, "空间默认折叠；只有异常空间会展开让设计师确认或修图。", size=1_220, color=TEAL, bold=True, align="c")
    return slide


def make_export_slide() -> Slide:
    slide = Slide("平台使用：预算先预览，再下载")
    blueprint_background(slide)
    header(slide, "平台操作 6", 15)
    shape(slide, 0.78, 1.52, 11.78, 3.35, fill=SURFACE, line=LINE, preset="roundRect")
    text_box(slide, 1.15, 1.82, 2.5, 0.28, "预算预览", size=1_550, color=INK, bold=True)
    for i, col in enumerate(["编号", "项目名称", "单位", "数量", "单价", "总价", "说明"]):
        text_box(slide, 1.05 + i * 1.55, 2.38, 1.2, 0.18, col, size=850, color=TEAL, bold=True, align="c")
    for r in range(3):
        y = 2.75 + r * 0.45
        shape(slide, 1.0, y, 10.9, 0.006, fill=LINE, line=None)
        text_box(slide, 1.05, y + 0.12, 1.2, 0.12, str(r + 1), size=760, color=MUTED, align="c")
        text_box(slide, 2.2, y + 0.12, 1.6, 0.12, ["拆改及拆墙", "墙面乳胶漆", "地面砖铺贴"][r], size=780, color=INK)
    pill(slide, 7.75, 4.25, "返回修改", fill="EAF2F2", color=INK, w=1.35)
    pill(slide, 9.32, 4.25, "下载预算表", fill=TEAL, w=1.55)
    bullet_list(slide, 1.0, 5.25, ["发现数量或单价不对，先返回修改", "确认无误后再下载预算表", "下载后的 Excel 仍可人工微调"], size=1_120)
    return slide


def make_common_issues_slide() -> Slide:
    slide = Slide("常见问题：先按提示定位，再回 CAD 修图")
    blueprint_background(slide)
    header(slide, "排错指南", 16)
    issues = [
        ("建筑面积为 0", "检查 QUOTE_EXT_WALL 是否闭合，外墙轮廓是否画在正确图层。"),
        ("空间命名需拆分", "把“过道/电梯井”拆成两个空间，不要用一个外框圈多个性质。"),
        ("卫生间金额不对", "检查卫生间是否被识别成其他类型，洁具/淋浴选择是否确认。"),
        ("墙面面积不对", "检查 QUOTE_WALL 是否漏画、门洞位置是否误画墙线。"),
        ("DWG 上传失败", "让管理员检查 ODA 转换器，或从 CAD 另存为 DXF 再上传。"),
    ]
    for i, (title, note) in enumerate(issues):
        y = 1.46 + i * 0.82
        card(slide, 0.78, y, 11.75, 0.62, title, note, accent=CORAL if i < 2 else TEAL, fill=SURFACE)
    return slide


def make_final_slide() -> Slide:
    slide = Slide("设计师交付标准")
    blueprint_background(slide, dark=True)
    header(slide, "上线试用要求", 17)
    text_box(slide, 0.95, 1.55, 11.4, 0.45, "每一张能稳定出预算的图纸，都满足这四件事", size=2_100, color=SURFACE, bold=True, align="c")
    card(slide, 0.9, 2.35, 2.8, 2.25, "图层规范", "核心图层齐全，外墙和空间闭合，特殊项分图层。", accent=CYAN, fill="123C49", title_color=SURFACE, body_color="C8E7EA")
    card(slide, 3.95, 2.35, 2.8, 2.25, "命名规范", "楼层清楚，空间用途单一，不混名、不重叠。", accent=GOLD, fill="123C49", title_color=SURFACE, body_color="C8E7EA")
    card(slide, 7.0, 2.35, 2.8, 2.25, "复核完成", "方案信息、水电点位、异常空间都已确认。", accent=TEAL, fill="123C49", title_color=SURFACE, body_color="C8E7EA")
    card(slide, 10.05, 2.35, 2.8, 2.25, "预算预览", "先在平台预览预算，再下载交给后续流程。", accent=CYAN, fill="123C49", title_color=SURFACE, body_color="C8E7EA")
    text_box(slide, 0.95, 5.82, 11.4, 0.34, "最终目标：让设计师少返工，让报价员少补数，让客户报价更快更稳。", size=1_420, color="C8E7EA", bold=True, align="c")
    return slide


def slide_xml(slide: Slide) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {''.join(slide.parts)}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"""


def content_types(slide_count: int) -> str:
    slide_overrides = "\n".join(
        f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(1, slide_count + 1)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  {slide_overrides}
</Types>
"""


def root_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""


def presentation_xml(slide_count: int) -> str:
    slide_ids = "\n".join(f'<p:sldId id="{255 + i}" r:id="rId{i + 1}"/>' for i in range(1, slide_count + 1))
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                saveSubsetFonts="1">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>{slide_ids}</p:sldIdLst>
  <p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle>
    <a:defPPr>
      <a:defRPr lang="zh-CN"><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:defRPr>
    </a:defPPr>
  </p:defaultTextStyle>
</p:presentation>
"""


def presentation_rels(slide_count: int) -> str:
    rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>']
    for i in range(1, slide_count + 1):
        rels.append(
            f'<Relationship Id="rId{i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>'
        )
    rels.append('<Relationship Id="rId100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>')
    rels.append('<Relationship Id="rId101" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>')
    rels.append('<Relationship Id="rId102" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>')
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {' '.join(rels)}
</Relationships>
"""


def slide_master_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle><a:lvl1pPr><a:defRPr sz="3200"><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:defRPr></a:lvl1pPr></p:titleStyle>
    <p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:defRPr></a:lvl1pPr></p:bodyStyle>
    <p:otherStyle><a:lvl1pPr><a:defRPr sz="1600"><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:defRPr></a:lvl1pPr></p:otherStyle>
  </p:txStyles>
</p:sldMaster>
"""


def slide_master_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"""


def slide_layout_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""


def slide_layout_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"""


def theme_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Blueprint Training">
  <a:themeElements>
    <a:clrScheme name="Blueprint">
      <a:dk1><a:srgbClr val="{INK}"/></a:dk1>
      <a:lt1><a:srgbClr val="{SURFACE}"/></a:lt1>
      <a:dk2><a:srgbClr val="{BLUEPRINT}"/></a:dk2>
      <a:lt2><a:srgbClr val="{PAPER}"/></a:lt2>
      <a:accent1><a:srgbClr val="{TEAL}"/></a:accent1>
      <a:accent2><a:srgbClr val="{CYAN}"/></a:accent2>
      <a:accent3><a:srgbClr val="{GOLD}"/></a:accent3>
      <a:accent4><a:srgbClr val="{CORAL}"/></a:accent4>
      <a:accent5><a:srgbClr val="{MUTED}"/></a:accent5>
      <a:accent6><a:srgbClr val="{LINE}"/></a:accent6>
      <a:hlink><a:srgbClr val="0B6E99"/></a:hlink>
      <a:folHlink><a:srgbClr val="6B5B95"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Training Fonts">
      <a:majorFont><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:majorFont>
      <a:minorFont><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Training Format">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>
"""


def core_props() -> str:
    now = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>整装预算报价系统设计师培训 v1.1</dc:title>
  <dc:creator>CAD Budget Program</dc:creator>
  <cp:lastModifiedBy>CAD Budget Program</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>
"""


def app_props(slide_count: int) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
            xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>CAD Budget Program</Application>
  <PresentationFormat>宽屏 16:9</PresentationFormat>
  <Slides>{slide_count}</Slides>
  <Company>整装预算报价系统</Company>
</Properties>
"""


def static_ppt_files() -> dict[str, str]:
    return {
        "ppt/presProps.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>',
        "ppt/viewProps.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:viewPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>',
        "ppt/tableStyles.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>',
    }


def build_slides() -> list[Slide]:
    return [
        make_title_slide(),
        make_objectives_slide(),
        make_workflow_slide(),
        make_layer_slide(),
        make_room_boundary_slide(),
        make_wall_opening_slide(),
        make_floor_name_slide(),
        make_special_layers_slide(),
        make_preupload_slide(),
        make_upload_slide(),
        make_review_slide(),
        make_optional_slide(),
        make_hydropower_slide(),
        make_quantity_slide(),
        make_export_slide(),
        make_common_issues_slide(),
        make_final_slide(),
    ]


def write_pptx(slides: list[Slide], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as pptx:
        pptx.writestr("[Content_Types].xml", content_types(len(slides)))
        pptx.writestr("_rels/.rels", root_rels())
        pptx.writestr("docProps/core.xml", core_props())
        pptx.writestr("docProps/app.xml", app_props(len(slides)))
        pptx.writestr("ppt/presentation.xml", presentation_xml(len(slides)))
        pptx.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(len(slides)))
        pptx.writestr("ppt/slideMasters/slideMaster1.xml", slide_master_xml())
        pptx.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels())
        pptx.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout_xml())
        pptx.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slide_layout_rels())
        pptx.writestr("ppt/theme/theme1.xml", theme_xml())
        for path, content in static_ppt_files().items():
            pptx.writestr(path, content)
        for index, slide in enumerate(slides, start=1):
            pptx.writestr(f"ppt/slides/slide{index}.xml", slide_xml(slide))


def main() -> None:
    slides = build_slides()
    write_pptx(slides, OUTPUT)
    print(f"Wrote {OUTPUT} ({len(slides)} slides)")


if __name__ == "__main__":
    main()
