import json
import logging

from openai import AzureOpenAI

from app.config import (
    AZURE_AI_FOUNDRY_API_KEY,
    AZURE_AI_FOUNDRY_API_VERSION,
    AZURE_AI_FOUNDRY_DEPLOYMENT,
    AZURE_AI_FOUNDRY_ENDPOINT,
    FOUNDRY_CONFIGURED,
)

logger = logging.getLogger(__name__)

# Keep this vocabulary in sync with app/api/recovery.py's _NEED_STEP_TEMPLATES
# and the frontend's journeyContent.ts -- a need/barrier the model invents
# outside this list won't map to a recovery step or journey content.
_KNOWN_NEEDS = [
    "emergency_housing", "food", "identification_replacement",
    "water", "power", "medical_needs",
]
_KNOWN_BARRIERS = [
    "unsafe_home", "lost_identification", "no_transportation",
    "mobility_limitation",
]

_SYSTEM_PROMPT = f"""You are the intake system for CrisisCompass, a disaster \
assistance navigator. Extract a structured Recovery Passport from a \
survivor's free-text description of their situation.

Rules:
- Only include a need or barrier if the message actually supports it. \
Do not guess or assume.
- immediate_needs must only use values from: {", ".join(_KNOWN_NEEDS)}
- barriers must only use values from: {", ".join(_KNOWN_BARRIERS)}
- location: only set if a real place name is mentioned; otherwise null.
- household.adults / household.children: only set if the message gives a \
count or clearly implies one (e.g. "alone" means 1 adult); otherwise null.
- next_best_action: one short, concrete, immediate sentence (e.g. \
"Find safe housing tonight."). Never a vague statement.
- documents.identification: "missing" only if the message says ID/wallet/\
documents were lost; otherwise "unknown". Leave the other three document \
fields as "unknown" -- this mock doesn't have information about them.
"""

_PASSPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "disaster": {"type": ["string", "null"]},
        "location": {"type": ["string", "null"]},
        "household": {
            "type": "object",
            "properties": {
                "adults": {"type": ["integer", "null"]},
                "children": {"type": ["integer", "null"]},
            },
            "required": ["adults", "children"],
            "additionalProperties": False,
        },
        "immediate_needs": {"type": "array", "items": {"type": "string"}},
        "barriers": {"type": "array", "items": {"type": "string"}},
        "documents": {
            "type": "object",
            "properties": {
                "identification": {"type": "string"},
                "proof_of_residence": {"type": "string"},
                "damage_documentation": {"type": "string"},
                "insurance_claim": {"type": "string"},
            },
            "required": [
                "identification", "proof_of_residence",
                "damage_documentation", "insurance_claim",
            ],
            "additionalProperties": False,
        },
        "next_best_action": {"type": ["string", "null"]},
    },
    "required": [
        "disaster", "location", "household", "immediate_needs",
        "barriers", "documents", "next_best_action",
    ],
    "additionalProperties": False,
}

_client: AzureOpenAI | None = None

if FOUNDRY_CONFIGURED:
    _client = AzureOpenAI(
        azure_endpoint=AZURE_AI_FOUNDRY_ENDPOINT,
        api_key=AZURE_AI_FOUNDRY_API_KEY,
        api_version=AZURE_AI_FOUNDRY_API_VERSION,
    )


def generate_recovery_passport(message: str) -> dict | None:
    """
    Ask the Foundry-hosted model to extract a Recovery Passport from a
    survivor's message. Returns None (instead of raising) on any failure
    -- misconfiguration, network error, bad response -- so callers can
    fall back to the rule-based mock and the demo never hard-fails.
    """

    if _client is None:
        return None

    try:
        response = _client.chat.completions.create(
            model=AZURE_AI_FOUNDRY_DEPLOYMENT,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "recovery_passport",
                    "strict": True,
                    "schema": _PASSPORT_SCHEMA,
                },
            },
        )
        content = response.choices[0].message.content
        return json.loads(content) if content else None
    except Exception:
        logger.exception("Foundry intake call failed; falling back to mock")
        return None
