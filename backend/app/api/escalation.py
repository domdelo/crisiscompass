from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.survivor import RecoveryPassport


router = APIRouter()


class EscalationRequest(BaseModel):
    passport: RecoveryPassport
    reason: str
    actions_taken: list[str] = Field(default_factory=list)


class HumanHandoffSummary(BaseModel):
    disaster: str | None = None
    location: str | None = None
    immediate_needs: list[str] = Field(default_factory=list)
    household_summary: str
    barriers: list[str] = Field(default_factory=list)
    actions_taken: list[str] = Field(default_factory=list)
    reason_for_escalation: str
    sensitive_data_collected: str


class EscalationResponse(BaseModel):
    escalated: bool
    handoff_summary: HumanHandoffSummary


@router.post("/escalate", response_model=EscalationResponse)
async def escalate(request: EscalationRequest):
    """
    Escalate a survivor case and generate a human handoff summary.

    This currently creates the summary directly from the
    Recovery Passport. Human-support integration can replace
    or extend this implementation later.
    """

    adults = request.passport.household.adults
    children = request.passport.household.children

    household_parts = []

    if adults is not None:
        household_parts.append(f"{adults} adult(s)")

    if children is not None:
        household_parts.append(f"{children} child(ren)")

    household_summary = (
        ", ".join(household_parts)
        if household_parts
        else "Household details not provided"
    )

    summary = HumanHandoffSummary(
        disaster=request.passport.disaster,
        location=request.passport.location,
        immediate_needs=request.passport.immediate_needs,
        household_summary=household_summary,
        barriers=request.passport.barriers,
        actions_taken=request.actions_taken,
        reason_for_escalation=request.reason,
        sensitive_data_collected=(
            "No SSN, financial information, full birthdate, "
            "or exact address collected."
        )
    )

    return EscalationResponse(
        escalated=True,
        handoff_summary=summary
    )

