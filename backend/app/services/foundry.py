"""Microsoft Foundry integration for survivor intake."""

from functools import lru_cache

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
    except (AzureError, OpenAIError, ValidationError) as exc:
        raise FoundryResponseError(
            "Foundry request failed"
        ) from exc

    passport = response.output_parsed
    if passport is None:
        raise FoundryResponseError(
            "Foundry returned no structured Recovery Passport"
        )

    # The SDK parser normally returns this exact model. Re-validation keeps the
    # service boundary explicit and protects callers if an SDK adapter changes.
    try:
        return RecoveryPassport.model_validate(passport)
    except ValidationError as exc:
        raise FoundryResponseError(
            "Foundry returned an invalid Recovery Passport"
        ) from exc
