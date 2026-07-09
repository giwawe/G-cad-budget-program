EXCLUDED_SERVICE_SHAFT_KEYWORDS = ("电梯井", "设备井", "管井", "风井")
EXCLUDED_AUXILIARY_BOUNDARY_KEYWORDS = ("楼板洞口", "楼板开洞", "栏杆", "护栏", "开放边", "开口边")

SPACE_TYPE_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("挑空", ("挑空", "中空")),
    ("客厅", ("客厅", "起居")),
    ("餐厅", ("餐厅",)),
    ("厨房", ("厨房", "厨")),
    ("卫生间", ("卫生间", "卫浴", "盥洗", "主卫", "客卫", "公卫", "外卫", "次卫")),
    ("阳台", ("阳台",)),
    ("卧室", ("卧室", "主卧", "次卧", "客卧", "儿童房", "老人房", "客房")),
    ("书房", ("书房",)),
    ("茶室", ("茶室",)),
    ("娱乐室", ("麻将房", "娱乐室", "棋牌室", "影音室", "健身房")),
    ("衣帽间", ("衣帽间",)),
    ("储物间", ("储物间", "储藏间", "储藏室", "储物", "库房")),
    ("洗衣房", ("洗衣房", "洗衣间")),
    ("门厅", ("门厅", "入户")),
    ("楼梯过道", ("楼梯过道",)),
    ("楼梯", ("楼梯",)),
    ("过道", ("过道", "走廊", "玄关")),
    ("露台", ("露台",)),
    ("外墙", ("外墙",)),
)


def is_excluded_space(name: str) -> bool:
    if any(keyword in name for keyword in EXCLUDED_AUXILIARY_BOUNDARY_KEYWORDS):
        return True
    if any(keyword in name for keyword in EXCLUDED_SERVICE_SHAFT_KEYWORDS):
        return classify_space_type(name) == "其他"
    return False


def classify_space_type(name: str) -> str:
    for space_type, keywords in SPACE_TYPE_KEYWORDS:
        if any(keyword in name for keyword in keywords):
            return space_type
    return "其他"
