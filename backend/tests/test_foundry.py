from types import SimpleNamespace

import pytest

from app.models.survivor import RecoveryPassport
from app.services import foundry


VALID_PASSPORT = {
    "disaster": "flood",
    "location": None,
    "household": {"adults": None, "children": 2},
    "immediate_needs": [
        "emergency_housing",
        "identification_replacement",
    ],
    "barriers": ["unsafe_home", "lost_identification"],
    "documents": {
        "identification": "missing",
        "proof_of_residence": "unknown",
        "damage_documentation": "unknown",
        "insurance_claim": "unknown",
    },
    "next_best_action": (
        "Seek emergency housing and assistance with replacing identification."
    ),
}


class FakeResponses:
    def __init__(self, output_parsed):
        self.output_parsed = output_parsed
        self.request = None

    def parse(self, **kwargs):
        self.request = kwargs
        return SimpleNamespace(output_parsed=self.output_parsed)


class FakeProjectClient:
    def __init__(self, responses):
        self.openai_client = SimpleNamespace(responses=responses)

    def get_openai_client(self):
        return self.openai_client


def test_generate_recovery_passport_uses_structured_output(monkeypatch):
    responses = FakeResponses(RecoveryPassport.model_validate(VALID_PASSPORT))
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(responses),
    )

    result = foundry.generate_recovery_passport("Our apartment flooded.")

    assert result == RecoveryPassport.model_validate(VALID_PASSPORT)
    assert responses.request["text_format"] is RecoveryPassport
    assert responses.request["model"] == foundry.FOUNDRY_MODEL_DEPLOYMENT
    assert responses.request["input"] == "Our apartment flooded."


def test_generate_recovery_passport_rejects_missing_output(monkeypatch):
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(None)),
    )

    with pytest.raises(foundry.FoundryResponseError):
        foundry.generate_recovery_passport("Our apartment flooded.")


def test_generate_recovery_passport_revalidates_output(monkeypatch):
    invalid_passport = {**VALID_PASSPORT, "household": {"children": "many"}}
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(invalid_passport)),
    )

    with pytest.raises(foundry.FoundryResponseError):
        foundry.generate_recovery_passport("Our apartment flooded.")
