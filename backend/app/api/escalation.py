from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.survivor import RecoveryPassport
from app.services.escalation_engine import build_escalation_decision


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
    """Escalate a survivor case and generate a human handoff summary."""

    decision = build_escalation_decision(
        passport=request.passport,
        reason=request.reason,
        actions_taken=request.actions_taken,
    )
    summary = HumanHandoffSummary(
        disaster=request.passport.disaster,
        location=decision.location,
        immediate_needs=decision.immediate_needs,
        household_summary=decision.household_summary,
        barriers=decision.barriers,
        actions_taken=decision.actions_taken,
        reason_for_escalation=decision.reason_for_escalation,
        sensitive_data_collected=decision.sensitive_data_collected,
    )

    return EscalationResponse(
        escalated=True,
        handoff_summary=summary
    )
