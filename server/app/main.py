from dataclasses import asdict

from fastapi import FastAPI

from server.app.models import OpeningInput, ProjectDefaults, SpaceInput
from server.app.quantity.calculator import calculate_quantity_row

app = FastAPI(title="CAD Budget Quantity Validation API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/sample-quantities")
def sample_quantities():
    defaults = ProjectDefaults(project_height_m=2.8, default_window_height_m=1.5)
    spaces = [
        SpaceInput(
            floor="一层",
            name="一层-客厅",
            boundary_points_m=[(0, 0), (6, 0), (6, 5), (0, 5)],
            wall_lengths_m=[6, 5, 4],
            windows=[OpeningInput(width_m=3.2)],
            doors=[OpeningInput(width_m=0.9)],
        ),
        SpaceInput(
            floor="一层",
            name="一层-卫生间",
            boundary_points_m=[(0, 0), (2.4, 0), (2.4, 2.2), (0, 2.2)],
            wall_lengths_m=[2.4, 2.2, 2.4, 2.2],
            windows=[OpeningInput(width_m=0.8, height_m=0.8)],
            doors=[OpeningInput(width_m=0.8)],
        ),
        SpaceInput(
            floor="一层",
            name="一层-电梯井",
            boundary_points_m=[(0, 0), (1.8, 0), (1.8, 1.8), (0, 1.8)],
        ),
    ]
    return [asdict(calculate_quantity_row(space, defaults)) for space in spaces]
