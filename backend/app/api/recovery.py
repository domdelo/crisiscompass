from fastapi import APIRouter
from pydantic import BaseModel

from app.models.recovery import RecoveryState, RecoveryStep
from app.models.survivor import RecoveryPassport


router = APIRouter()


class RecoveryRequest(BaseModel):
    passport: RecoveryPassport


@router.post("/recovery", response_model=RecoveryState)
async def build_recovery_plan(request: RecoveryRequest):
    """
    Build a prioritized recovery plan from a Recovery Passport.

    This currently returns mocked recovery steps.
    The recovery engine will replace this implementation later.
    """

    plan = [
        RecoveryStep(
            category="housing",
            action="Find safe housing tonight.",
            status="pending"
        ),
        RecoveryStep(
            category="food",
            action="Locate emergency food assistance.",
            status="pending"
        ),
        RecoveryStep(
            category="documents",
            action="Begin identification replacement.",
            status="pending"
        ),
        RecoveryStep(
            category="insurance",
            action="Contact insurance provider.",
            status="pending"
        ),
        RecoveryStep(
            category="financial_assistance",
            action="Review available disaster assistance.",
            status="pending"
        )
    ]

    return RecoveryState(
        passport=request.passport,
        plan=plan,
        resources=[],
        next_best_action="Find safe housing tonight."
    )
