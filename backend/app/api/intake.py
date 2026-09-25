from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from app.models.survivor import RecoveryPassport
from app.services import foundry


router = APIRouter()


class IntakeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


@router.post("/intake", response_model=RecoveryPassport)
async def intake(request: IntakeRequest):
    """Process a survivor's description into a Recovery Passport."""

    try:
        return await run_in_threadpool(
            foundry.generate_recovery_passport,
            request.message,
        )
    except (foundry.FoundryConfigurationError, foundry.FoundryResponseError):
        raise HTTPException(
            status_code=503,
            detail="The intake AI service is temporarily unavailable.",
        ) from None
