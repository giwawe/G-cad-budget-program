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
    default_window_height_m: float = 1.8
    default_door_height_m: float = 2.1
    unit_scale_to_m: float = 0.001


@dataclass(frozen=True)
class OpeningInput:
    width_m: float
    height_m: float | None = None
    deduct_from_wall: bool = False
    review_required: bool = False
    opening_type: str = "normal_door"
    quote_category: str | None = None


@dataclass(frozen=True)
class SpaceInput:
    floor: str = "未分层"
    name: str = ""
    boundary_points_m: list[tuple[float, float]] = field(default_factory=list)
    wall_lengths_m: list[float] = field(default_factory=list)
    wall_tile_lengths_m: list[float] = field(default_factory=list)
    floor_void_area_m2: float = 0
    ceiling_void_area_m2: float = 0
    void_area_m2: float = 0
    new_wall_lengths_m: list[float] = field(default_factory=list)
    new_wall_heights_m: list[float | None] = field(default_factory=list)
    new_wall_thicknesses_m: list[float | None] = field(default_factory=list)
    demolition_wall_lengths_m: list[float] = field(default_factory=list)
    background_wall_lengths_m: list[float] = field(default_factory=list)
    background_wall_heights_m: list[float | None] = field(default_factory=list)
    cast_slab_areas_m2: list[float] = field(default_factory=list)
    edge_ceiling_areas_m2: list[float] = field(default_factory=list)
    edge_ceiling_lengths_m: list[float] = field(default_factory=list)
    gypsum_line_ceiling_areas_m2: list[float] = field(default_factory=list)
    gypsum_line_ceiling_lengths_m: list[float] = field(default_factory=list)
    no_ceiling_areas_m2: list[float] = field(default_factory=list)
    base_cabinet_lengths_m: list[float] = field(default_factory=list)
    wall_cabinet_lengths_m: list[float] = field(default_factory=list)
    custom_cabinet_lengths_m: list[float] = field(default_factory=list)
    custom_cabinet_heights_m: list[float | None] = field(default_factory=list)
    toilet_count: int = 0
    bathroom_vanity_count: int = 0
    curtain_wall_width_candidate_m: float = 0
    curtain_wall_width_source: str = "not_applicable"
    atrium_curtain_width_m: float = 0
    atrium_curtain_height_m: float = 0
    stair_railing_lengths_m: list[float] = field(default_factory=list)
    guardrail_lengths_m: list[float] = field(default_factory=list)
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
    gross_floor_area_m2: float
    floor_area_m2: float
    ceiling_area_m2: float
    void_area_m2: float
    wall_measure_length_m: float
    height_m: float
    window_width_total_m: float
    windowsill_length_m: float
    curtain_wall_width_m: float
    curtain_wall_width_source: str
    atrium_curtain_width_m: float
    atrium_curtain_height_m: float
    atrium_curtain_area_m2: float
    window_area_m2: float
    door_width_total_m: float
    door_deduct_area_m2: float
    wall_gross_area_m2: float
    latex_paint_area_m2: float
    wall_tile_measure_length_m: float
    wall_tile_area_m2: float
    floor_tile_piece_count: int
    electrical_scope_area_m2: float
    plumbing_scope_area_m2: float
    new_wall_length_m: float
    new_wall_area_m2: float
    new_wall_unclassified_area_m2: float
    new_wall_120_area_m2: float
    new_wall_240_area_m2: float
    demolition_wall_length_m: float
    demolition_wall_area_m2: float
    background_wall_area_m2: float
    cast_slab_area_m2: float
    edge_ceiling_area_m2: float
    edge_ceiling_length_m: float
    gypsum_line_ceiling_area_m2: float
    gypsum_line_ceiling_length_m: float
    no_ceiling_area_m2: float
    gypsum_flat_ceiling_area_m2: float
    entry_door_count: int
    interior_door_count: int
    bathroom_door_count: int
    sliding_door_area_m2: float
    sliding_door_casing_length_m: float
    kitchen_base_cabinet_length_m: float
    kitchen_wall_cabinet_length_m: float
    custom_cabinet_area_m2: float
    toilet_count: int
    bathroom_vanity_count: int
    stair_railing_length_m: float
    guardrail_length_m: float
    waterproof_area_m2: float
    evidence: str
    anomalies: list[str]
    status: ReviewStatus
