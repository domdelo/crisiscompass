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


class RaisingResponses:
    def __init__(self, exception):
        self.exception = exception

    def parse(self, **_kwargs):
        raise self.exception


class MalformedResponses:
    def parse(self, **_kwargs):
        return SimpleNamespace()


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


@pytest.mark.parametrize(
    "invalid_passport",
    [
        {**VALID_PASSPORT, "household": {"children": -1}},
        {**VALID_PASSPORT, "unexpected": "not part of the contract"},
    ],
)
def test_generate_recovery_passport_rejects_invalid_structure(
    monkeypatch,
    invalid_passport,
):
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(invalid_passport)),
    )

    with pytest.raises(foundry.FoundryResponseError):
        foundry.generate_recovery_passport("Our apartment flooded.")


def test_generate_recovery_passport_revalidates_model_instances(monkeypatch):
    invalid_passport = RecoveryPassport.model_construct(
        disaster="flood",
        household={"adults": -1, "children": 2},
    )
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(invalid_passport)),
    )

    with pytest.raises(foundry.FoundryResponseError):
        foundry.generate_recovery_passport("Our apartment flooded.")


def test_generate_recovery_passport_handles_malformed_response(monkeypatch):
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(MalformedResponses()),
    )

    with pytest.raises(foundry.FoundryResponseError):
        foundry.generate_recovery_passport("Our apartment flooded.")


def test_generate_recovery_passport_handles_timeout(monkeypatch):
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(
            RaisingResponses(TimeoutError("provider timed out"))
        ),
    )

    with pytest.raises(foundry.FoundryResponseError) as error:
        foundry.generate_recovery_passport("Our apartment flooded.")

    assert "provider timed out" not in str(error.value)


def test_output_guardrails_remove_unsupported_location_and_adult_count(
    monkeypatch,
):
    output = RecoveryPassport.model_validate(
        {
            **VALID_PASSPORT,
            "location": "Fairfax County, VA",
            "household": {"adults": 1, "children": 2},
        }
    )
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(output)),
    )

    passport = foundry.generate_recovery_passport(
        "Our apartment flooded. I have two kids."
    )

    assert passport.location is None
    assert passport.household.adults is None
    assert passport.household.children == 2


def test_output_guardrails_reject_confirmed_eligibility_claim(monkeypatch):
    output = RecoveryPassport.model_validate(
        {
            **VALID_PASSPORT,
            "next_best_action": "You are approved for assistance.",
        }
    )
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(output)),
    )

    with pytest.raises(foundry.FoundryResponseError):
        foundry.generate_recovery_passport("Our apartment flooded.")


def test_output_guardrails_prioritize_urgent_human_help(monkeypatch):
    output = RecoveryPassport.model_validate(
        {
            **VALID_PASSPORT,
            "immediate_needs": ["medical_care"],
            "next_best_action": "Review recovery resources.",
        }
    )
    monkeypatch.setattr(
        foundry,
        "_get_project_client",
        lambda: FakeProjectClient(FakeResponses(output)),
    )

    passport = foundry.generate_recovery_passport(
        "I need urgent medical care."
    )

    assert passport.next_best_action == foundry.EMERGENCY_NEXT_ACTION
