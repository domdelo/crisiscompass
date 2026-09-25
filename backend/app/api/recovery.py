from fastapi import APIRouter
from pydantic import BaseModel

from app.models.recovery import RecoveryState, RecoveryStep
from app.models.survivor import RecoveryPassport


router = APIRouter()


class RecoveryRequest(BaseModel):
    passport: RecoveryPassport


# Maps a passport's immediate_needs entries onto step templates.
# Steps not tied to an immediate need (insurance, financial_assistance)
# are relevant to nearly every survivor, so they're always appended.
_NEED_STEP_TEMPLATES: dict[str, RecoveryStep] = {
    "emergency_housing": RecoveryStep(
        category="housing",
        action="Find safe housing tonight.",
        status="pending"
    ),
    "food": RecoveryStep(
        category="food",
        action="Locate emergency food assistance.",
        status="pending"
    ),
    "identification_replacement": RecoveryStep(
        category="documents",
        action="Begin identification replacement.",
        status="pending"
    ),
    "water": RecoveryStep(
        category="water",
        action="Locate emergency drinking water.",
        status="pending"
    ),
    "power": RecoveryStep(
        category="power",
        action="Find information on power restoration.",
        status="pending"
    ),
    "medical_needs": RecoveryStep(
        category="medical",
        action="Access emergency medical care or medication refills.",
        status="pending"
    ),
}

_ALWAYS_INCLUDED_STEPS: list[RecoveryStep] = [
    RecoveryStep(
        category="insurance",
        action="Contact insurance provider.",
        status="pending"
    ),
    RecoveryStep(
        category="financial_assistance",
        action="Review available disaster assistance.",
        status="pending"
    ),
]

@router.post("/recovery", response_model=RecoveryState)
async def build_recovery_plan(request: RecoveryRequest):
    """
    Build a prioritized recovery plan from a Recovery Passport.

    This is a rule-based mock: it maps the passport's immediate needs
    onto known step templates rather than reasoning about the
    situation. The recovery engine will replace this implementation
    later.
    """

    passport = request.passport

    plan = [
        _NEED_STEP_TEMPLATES[need].model_copy()
        for need in passport.immediate_needs
        if need in _NEED_STEP_TEMPLATES
    ]

    plan.extend(step.model_copy() for step in _ALWAYS_INCLUDED_STEPS)

    next_best_action = passport.next_best_action or plan[0].action

    return RecoveryState(
        passport=passport,
        plan=plan,
        resources=[],
        next_best_action=next_best_action
    )
