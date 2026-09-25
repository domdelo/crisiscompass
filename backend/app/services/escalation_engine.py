"""Deterministic human-escalation and handoff-summary logic."""

from dataclasses import dataclass
import re

from app.models.survivor import RecoveryPassport


SENSITIVE_DATA_STATEMENT = (
    "No SSN, bank data, full birthdate, or unnecessary exact address "
    "is included in this handoff."
)

ACCESSIBILITY_BARRIERS = {
    "accessibility_barrier",
    "hearing_accessibility",
    "language_barrier",
    "mobility_accessibility",
    "vision_accessibility",
}

SENSITIVE_PATTERNS = (
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REDACTED SSN]"),
    (
        re.compile(r"\b(?:0?[1-9]|1[0-2])[/.-](?:0?[1-9]|[12]\d|3[01])[/.-](?:19|20)\d{2}\b"),
        "[REDACTED BIRTHDATE]",
    ),
    (re.compile(r"\b\d{8,17}\b"), "[REDACTED ACCOUNT NUMBER]"),
    (
        re.compile(
            r"\b\d{1,6}\s+(?:[A-Za-z0-9.'-]+\s+){0,3}"
            r"(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|"
            r"Drive|Dr|Court|Ct|Way)\b",
            re.IGNORECASE,
        ),
        "[REDACTED ADDRESS]",
    ),
)


@dataclass(frozen=True)
class EscalationDecision:
    reason_for_escalation: str
    location: str | None
    household_summary: str
    immediate_needs: list[str]
    barriers: list[str]
    actions_taken: list[str]
    sensitive_data_collected: str = SENSITIVE_DATA_STATEMENT


def _normalized_set(values: list[str]) -> set[str]:
    return {
        value.strip().lower()
        for value in values
        if value and value.strip()
    }


def _unique_nonempty(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value.strip() for value in values if value.strip()))


def _redact_sensitive_text(value: str) -> str:
    redacted = value
    for pattern, replacement in SENSITIVE_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted


def _general_location(location: str | None) -> str | None:
    if not location:
        return None
    if re.match(r"^\s*\d{1,6}\s+\S+", location):
        return "Exact address withheld for privacy"
    return location.strip()


def _household_summary(passport: RecoveryPassport) -> str:
    household_parts = []
    if passport.household.adults is not None:
        household_parts.append(f"{passport.household.adults} adult(s)")
    if passport.household.children is not None:
        household_parts.append(f"{passport.household.children} child(ren)")
    return (
        ", ".join(household_parts)
        if household_parts
        else "Household details not provided"
    )


def _classify_reason(passport: RecoveryPassport, reason: str) -> str:
    needs = _normalized_set(passport.immediate_needs)
    barriers = _normalized_set(passport.barriers)
    normalized_reason = reason.strip().lower()
    safe_reason = _redact_sensitive_text(reason.strip())

    urgent_medical = (
        "medical_care" in needs
        or "urgent_medical_need" in barriers
        or any(
            phrase in normalized_reason
            for phrase in ("urgent medical", "medical emergency")
        )
    )
    immediate_safety = (
        "immediate_danger" in barriers
        or "unsafe_home" in barriers
        or any(
            phrase in normalized_reason
            for phrase in ("immediate danger", "physical danger", "not safe")
        )
    )

    if urgent_medical:
        prefix = (
            "Urgent medical need. CrisisCompass is not an emergency service; "
            "emergency or local human help takes priority over normal recovery "
            "navigation."
        )
    elif immediate_safety:
        prefix = (
            "Immediate safety concern. CrisisCompass is not an emergency "
            "service; emergency or local human help takes priority over normal "
            "recovery navigation."
        )
    elif barriers & ACCESSIBILITY_BARRIERS:
        prefix = "Accessibility barrier requires human assistance."
    elif any(
        phrase in normalized_reason
        for phrase in (
            "human help",
            "human assistance",
            "speak to a person",
            "caseworker",
            "representative",
        )
    ):
        prefix = "Explicit request for human help."
    elif any(
        phrase in normalized_reason
        for phrase in (
            "eligibility is unclear",
            "unclear eligibility",
            "conflicting eligibility",
            "eligibility conflict",
        )
    ):
        prefix = "Ambiguous or conflicting eligibility information."
    elif (
        "missing_critical_information" in barriers
        or any(
            phrase in normalized_reason
            for phrase in ("missing critical", "critical information missing")
        )
    ):
        prefix = "Missing critical information requires human review."
    elif any(
        phrase in normalized_reason
        for phrase in (
            "appeal",
            "benefit denial",
            "eviction",
            "legal decision",
            "high-impact decision",
        )
    ):
        prefix = "Sensitive or high-impact decision requires human review."
    elif any(
        phrase in normalized_reason
        for phrase in (
            "insufficient evidence",
            "insufficient authoritative evidence",
            "unable to verify",
            "no authoritative source",
        )
    ):
        prefix = "Insufficient authoritative evidence requires human review."
    else:
        prefix = "Human review requested."

    return f"{prefix} Reported reason: {safe_reason}"


def build_escalation_decision(
    passport: RecoveryPassport,
    reason: str,
    actions_taken: list[str],
) -> EscalationDecision:
    """Create a privacy-safe, fact-preserving human handoff."""

    safe_actions = [
        _redact_sensitive_text(action)
        for action in _unique_nonempty(actions_taken)
    ]

    return EscalationDecision(
        reason_for_escalation=_classify_reason(passport, reason),
        location=_general_location(passport.location),
        household_summary=_household_summary(passport),
        immediate_needs=_unique_nonempty(passport.immediate_needs),
        barriers=_unique_nonempty(passport.barriers),
        actions_taken=safe_actions,
    )
