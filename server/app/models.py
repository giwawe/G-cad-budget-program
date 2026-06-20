from dataclasses import dataclass, field
from enum import Enum


class ReviewStatus(str, Enum):
    pending_review = "pending_review"
    confirmed = "confirmed"
    needs_fix = "needs_fix"
    excluded = "excluded"


@dataclass(frozen=True)
class ProjectDefaults:
    project_height_m: float = 2.8
    default_window_height_m: float = 1.5
    default_door_height_m: float = 2.1
    unit_scale_to_m: float = 0.001


@dataclass(frozen=True)
class OpeningInput:
    width_m: float
    height_m: float | None = None
    deduct_from_wall: bool = False
    review_required: bool = False
    opening_type: str = "normal_door"


@dataclass(frozen=True)
class SpaceInput:
    floor: str = "未分层"
    name: str = ""
    boundary_points_m: list[tuple[float, float]] = field(default_factory=list)
    wall_lengths_m: list[float] = field(default_factory=list)
    windows: list[OpeningInput] = field(default_factory=list)
    doors: list[OpeningInput] = field(default_factory=list)
    height_m: float | None = None
    floor_default_height_m: float | None = None
    anomalies: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class QuantityRow:
    floor: str
    space_name: str
    space_type: str
    floor_area_m2: float
    ceiling_area_m2: float
    wall_measure_length_m: float
    height_m: float
    window_width_total_m: float
    window_area_m2: float
    door_width_total_m: float
    door_deduct_area_m2: float
    wall_gross_area_m2: float
    latex_paint_area_m2: float
    evidence: str
    anomalies: list[str]
    status: ReviewStatus
