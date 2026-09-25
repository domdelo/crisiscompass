"""Microsoft Foundry integration for survivor intake."""

from functools import lru_cache
import json
import re

from azure.ai.projects import AIProjectClient
from azure.core.exceptions import AzureError
from azure.identity import DefaultAzureCredential
from openai import OpenAIError
from pydantic import ValidationError

from app.config import FOUNDRY_MODEL_DEPLOYMENT, FOUNDRY_PROJECT_ENDPOINT
from app.models.survivor import RecoveryPassport


SYSTEM_INSTRUCTIONS = """
You convert a survivor's disaster description into a Recovery Passport.

Extract only facts stated or strongly implied by the survivor. Do not invent a
location, household count, document status, eligibility, or completed action.
Use null for unknown scalar values, empty lists when no list items are known,
and "unknown" for unknown document statuses. Use short snake_case labels for
immediate_needs and barriers. The next_best_action must be one practical,
immediate, safety-first step. Do not request or reproduce highly sensitive
personal data such as Social Security, bank account, or full identification
numbers. Do not promise aid, eligibility, approval, or legal outcomes.

Location must be null unless the survivor explicitly states a location. Do not
infer a city, county, state, or region from the disaster. First-person words
such as "I", "me", or "my" do not establish an adult household count; leave
adults null unless the survivor explicitly describes the number of adults.
Never state or imply confirmed government eligibility, approval, or guaranteed
assistance.

If the survivor reports immediate physical danger or an urgent medical need,
the next_best_action must prioritize contacting emergency services or urgent
local human help and clarify that CrisisCompass is not an emergency service.

Normalize equivalent situations consistently:
- If the survivor cannot safely remain in their home tonight, include
  "emergency_housing" in immediate_needs and "unsafe_home" in barriers.
- A lost wallet implies likely lost identification: put only
  "identification_replacement" in immediate_needs, put
  "lost_identification" in barriers, and set identification to "missing"
  unless the survivor explicitly says their ID is elsewhere. Never put
  "lost_identification" in immediate_needs.
- Never infer food, clothing, medical, transportation, or financial needs only
  from the disaster type; include them only when the survivor mentions them.
""".strip()


class FoundryConfigurationError(RuntimeError):
    """Raised when the Foundry integration is not configured."""


class FoundryResponseError(RuntimeError):
    """Raised when Foundry does not return a usable structured response."""


SENSITIVE_OUTPUT_PATTERNS = (
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    re.compile(r"\b\d{8,17}\b"),
)

ELIGIBILITY_CLAIMS = (
    "you are eligible",
    "you qualify",
    "you are approved",
    "approved for assistance",
    "guaranteed assistance",
)

EMERGENCY_NEXT_ACTION = (
    "Contact emergency services or urgent local human help now. "
    "CrisisCompass is not an emergency service."
)

ADULT_COUNT_CUES = re.compile(
    r"\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+adults?\b"
    r"|\b(?:spouse|partner|husband|wife)\b"
    r"|\b(?:live|living) alone\b"
    r"|\bonly adult\b",
    re.IGNORECASE,
)

GENERIC_LOCATION_WORDS = {
    "city",
    "county",
    "state",
    "united",
    "states",
    "usa",
}


@lru_cache
def _get_project_client() -> AIProjectClient:
    if not FOUNDRY_PROJECT_ENDPOINT:
        raise FoundryConfigurationError(
            "FOUNDRY_PROJECT_ENDPOINT is not configured"
        )

    return AIProjectClient(
        endpoint=FOUNDRY_PROJECT_ENDPOINT,
        credential=DefaultAzureCredential(),
    )


def _location_is_supported(location: str, message: str) -> bool:
    location_words = re.findall(r"[a-z]+", location.lower())
    specific_words = [
        word
        for word in location_words
        if len(word) > 2 and word not in GENERIC_LOCATION_WORDS
    ]
    message_words = set(re.findall(r"[a-z]+", message.lower()))
    return bool(specific_words) and all(
        word in message_words for word in specific_words
    )


def _apply_output_guardrails(
    passport: RecoveryPassport,
    message: str,
) -> RecoveryPassport:
    serialized = passport.model_dump_json()
    if any(pattern.search(serialized) for pattern in SENSITIVE_OUTPUT_PATTERNS):
        raise FoundryResponseError("Foundry returned sensitive data")

    next_action = (passport.next_best_action or "").lower()
    if any(claim in next_action for claim in ELIGIBILITY_CLAIMS):
        raise FoundryResponseError("Foundry returned an unsupported claim")

    updates = {}
    if passport.location and not _location_is_supported(
        passport.location,
        message,
    ):
        updates["location"] = None

    if (
        passport.household.adults is not None
        and not ADULT_COUNT_CUES.search(message)
    ):
        updates["household"] = passport.household.model_copy(
            update={"adults": None}
        )

    normalized_needs = {
        need.strip().lower() for need in passport.immediate_needs
    }
    normalized_barriers = {
        barrier.strip().lower() for barrier in passport.barriers
    }
    if (
        "medical_care" in normalized_needs
        or "urgent_medical_need" in normalized_barriers
        or "immediate_danger" in normalized_barriers
    ):
        updates["next_best_action"] = EMERGENCY_NEXT_ACTION

    return passport.model_copy(update=updates) if updates else passport


def generate_recovery_passport(message: str) -> RecoveryPassport:
    """Generate and validate a Recovery Passport from survivor-provided text."""

    if not FOUNDRY_MODEL_DEPLOYMENT:
        raise FoundryConfigurationError(
            "FOUNDRY_MODEL_DEPLOYMENT is not configured"
        )

    try:
        openai_client = _get_project_client().get_openai_client()
        response = openai_client.responses.parse(
            model=FOUNDRY_MODEL_DEPLOYMENT,
            instructions=SYSTEM_INSTRUCTIONS,
            input=message,
            text_format=RecoveryPassport,
            temperature=0,
        )
    except (
        AzureError,
        OpenAIError,
        ValidationError,
        json.JSONDecodeError,
        TimeoutError,
    ) as exc:
        raise FoundryResponseError(
            "Foundry request failed"
        ) from exc

    passport = getattr(response, "output_parsed", None)
    if passport is None:
        raise FoundryResponseError(
            "Foundry returned no structured Recovery Passport"
        )

    # The SDK parser normally returns this exact model. Re-validation keeps the
    # service boundary explicit and protects callers if an SDK adapter changes.
    try:
        validated_passport = RecoveryPassport.model_validate(passport)
    except ValidationError as exc:
        raise FoundryResponseError(
            "Foundry returned an invalid Recovery Passport"
        ) from exc

    return _apply_output_guardrails(validated_passport, message)
