from fastapi import APIRouter
from pydantic import BaseModel

from app.models.recovery import RecoveryState
from app.models.survivor import RecoveryPassport
from app.services.recovery_engine import build_recovery_state


router = APIRouter()


class RecoveryRequest(BaseModel):
    passport: RecoveryPassport


@router.post("/recovery", response_model=RecoveryState)
async def build_recovery_plan(request: RecoveryRequest):
    """Build a prioritized recovery plan from a Recovery Passport."""

    return build_recovery_state(request.passport)
