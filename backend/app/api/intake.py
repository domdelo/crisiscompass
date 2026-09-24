from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.survivor import RecoveryPassport


router = APIRouter()


class IntakeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


@router.post("/intake", response_model=RecoveryPassport)
async def intake(request: IntakeRequest):
    """
    Process a survivor's description of their situation.

    This currently returns mocked demo data.
    Microsoft Foundry will replace the mock implementation later.
    """

    return RecoveryPassport(
        disaster="flood",
        location="Fairfax County, VA",
        household={
            "children": 2
        },
        immediate_needs=[
            "emergency_housing",
            "food",
            "identification_replacement"
        ],
        barriers=[
            "unsafe_home",
            "lost_identification"
        ],
        documents={
            "identification": "missing"
        },
        next_best_action="Find safe housing tonight."
    )
