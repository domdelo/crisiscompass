from pydantic import BaseModel, Field

from app.models.resource import ResourceRecommendation
from app.models.survivor import RecoveryPassport


class RecoveryStep(BaseModel):
    category: str
    action: str
    status: str = "pending"


class RecoveryState(BaseModel):
    passport: RecoveryPassport

    plan: list[RecoveryStep] = Field(default_factory=list)

    resources: list[ResourceRecommendation] = Field(
        default_factory=list
    )

    next_best_action: str | None = None
