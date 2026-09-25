from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.scam_engine import analyze_message


router = APIRouter()


class ScamCheckRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


class ScamCheckResponse(BaseModel):
    risk: str
    warning_signs: list[str] = Field(default_factory=list)
    recommendation: str
    source_title: str
    source_url: str


@router.post("/scam-check", response_model=ScamCheckResponse)
async def scam_check(request: ScamCheckRequest):
    """
    Analyze a suspicious disaster-related message.

    Grounded in FTC/FEMA fraud guidance via
    app/services/scam_engine.py. Explainable rule-based detection,
    not a black-box classifier.
    """

    result = analyze_message(request.message)
    return ScamCheckResponse(**result)
