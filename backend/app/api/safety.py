from fastapi import APIRouter
from pydantic import BaseModel, Field


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

    This currently returns mocked demo data.
    Grounded fraud detection will replace this implementation later.
    """

    return ScamCheckResponse(
        risk="possible_scam",
        warning_signs=[
            "Requests payment",
            "Uses an unverified link",
            "Creates urgency around receiving assistance"
        ],
        recommendation=(
            "Do not send money or sensitive information. "
            "Verify disaster assistance through official government sources."
        ),
        source_title="FEMA Disaster Fraud Guidance",
        source_url="https://www.fema.gov/disaster-fraud"
    )
