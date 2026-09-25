import re

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.survivor import RecoveryPassport


router = APIRouter()


class IntakeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


_DISASTER_KEYWORDS: dict[str, list[str]] = {
    "flood": ["flood", "flooded", "flooding"],
    "fire": ["fire", "wildfire", "burned", "burning"],
    "hurricane": ["hurricane"],
    "tornado": ["tornado"],
    "earthquake": ["earthquake"],
    "storm": ["storm", "storms"],
}

_NUMBER_WORDS: dict[str, int] = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}

# Matches "in <Capitalized Place>[, XX]" e.g. "in Fairfax County, VA".
# Deliberately simple -- real place extraction belongs to the AI engine.
_LOCATION_PATTERN = re.compile(
    r"\bin ([A-Z][\w.]*(?:\s[A-Z][\w.]*)*(?:,\s*[A-Z]{2})?)"
)

_CHILDREN_PATTERN = re.compile(
    r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+"
    r"(?:kids?|children)"
)


def _detect_disaster(lowered_message: str) -> str | None:
    for disaster, keywords in _DISASTER_KEYWORDS.items():
        if any(keyword in lowered_message for keyword in keywords):
            return disaster
    return None


def _detect_location(message: str) -> str | None:
    match = _LOCATION_PATTERN.search(message)
    return match.group(1).strip() if match else None


def _detect_household(lowered_message: str) -> dict[str, int]:
    household: dict[str, int] = {}

    if "kid" in lowered_message or "child" in lowered_message:
        match = _CHILDREN_PATTERN.search(lowered_message)
        if match:
            value = match.group(1)
            household["children"] = (
                int(value) if value.isdigit() else _NUMBER_WORDS[value]
            )
        else:
            household["children"] = 1

    if "alone" in lowered_message or "by myself" in lowered_message:
        household["adults"] = 1

    return household


def _detect_needs_and_barriers(
    lowered_message: str
) -> tuple[list[str], list[str]]:
    needs: list[str] = []
    barriers: list[str] = []

    if any(phrase in lowered_message for phrase in [
        "can't stay", "cant stay", "unsafe", "flooded", "destroyed",
        "burned down", "no home", "homeless"
    ]):
        needs.append("emergency_housing")
        barriers.append("unsafe_home")

    if any(phrase in lowered_message for phrase in [
        "food", "hungry", "starving"
    ]):
        needs.append("food")

    if any(phrase in lowered_message for phrase in [
        "wallet", "identification", "my id", "license",
        "documents", "passport"
    ]):
        needs.append("identification_replacement")
        barriers.append("lost_identification")

    if any(phrase in lowered_message for phrase in [
        "water", "clean water", "drinking water"
    ]):
        needs.append("water")

    if any(phrase in lowered_message for phrase in [
        "power", "electricity", "no lights"
    ]):
        needs.append("power")

    if any(phrase in lowered_message for phrase in [
        "medication", "medicine", "prescription", "insulin"
    ]):
        needs.append("medical_needs")

    if any(phrase in lowered_message for phrase in [
        "no car", "no transportation", "no ride"
    ]):
        barriers.append("no_transportation")

    if any(phrase in lowered_message for phrase in [
        "disabled", "disability", "wheelchair", "mobility"
    ]):
        barriers.append("mobility_limitation")

    return needs, barriers


def _next_best_action(needs: list[str]) -> str:
    if "emergency_housing" in needs:
        return "Find safe housing tonight."
    if "medical_needs" in needs:
        return "Access emergency medical care."
    if "water" in needs:
        return "Locate emergency drinking water."
    if "food" in needs:
        return "Locate emergency food assistance."
    if "identification_replacement" in needs:
        return "Begin identification replacement."
    return "Talk to a specialist about your next step."


@router.post("/intake", response_model=RecoveryPassport)
async def intake(request: IntakeRequest):
    """
    Process a survivor's description of their situation.

    This is a lightweight rule-based mock (keyword matching), not the
    real Microsoft Foundry intake intelligence -- it exists so the
    frontend demo reflects what a survivor actually typed. The AI
    engine will replace this implementation later.
    """

    message = request.message
    lowered = message.lower()

    needs, barriers = _detect_needs_and_barriers(lowered)

    return RecoveryPassport(
        disaster=_detect_disaster(lowered),
        location=_detect_location(message),
        household=_detect_household(lowered),
        immediate_needs=needs,
        barriers=barriers,
        documents={
            "identification": (
                "missing" if "lost_identification" in barriers
                else "unknown"
            )
        },
        next_best_action=_next_best_action(needs)
    )
