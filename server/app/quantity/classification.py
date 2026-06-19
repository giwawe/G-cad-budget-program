EXCLUDED_SPACE_KEYWORDS = ("电梯井", "设备井", "管井", "风井")

SPACE_TYPE_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("客厅", ("客厅", "起居")),
    ("餐厅", ("餐厅",)),
    ("厨房", ("厨房", "厨")),
    ("卫生间", ("卫生间", "卫浴", "盥洗", "主卫", "外卫")),
    ("阳台", ("阳台",)),
    ("卧室", ("卧室", "主卧", "次卧", "儿童房", "老人房")),
    ("书房", ("书房",)),
    ("楼梯过道", ("楼梯过道",)),
    ("楼梯", ("楼梯",)),
    ("过道", ("过道", "走廊", "玄关")),
    ("露台", ("露台",)),
    ("外墙", ("外墙",)),
)


def is_excluded_space(name: str) -> bool:
    return any(keyword in name for keyword in EXCLUDED_SPACE_KEYWORDS)


def classify_space_type(name: str) -> str:
    for space_type, keywords in SPACE_TYPE_KEYWORDS:
        if any(keyword in name for keyword in keywords):
            return space_type
    return "其他"
