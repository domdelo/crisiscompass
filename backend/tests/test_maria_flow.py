from fastapi.testclient import TestClient

from app.main import app
from app.models.survivor import RecoveryPassport


client = TestClient(app)


MARIA_MESSAGE = (
    "Our apartment flooded. I have two kids and we can't stay there "
    "tonight. I also lost my wallet."
)

MARIA_PASSPORT = RecoveryPassport(
    disaster="flood",
    location=None,
    household={"adults": None, "children": 2},
    immediate_needs=[
        "emergency_housing",
        "identification_replacement",
    ],
    barriers=["unsafe_home", "lost_identification"],
    documents={"identification": "missing"},
    next_best_action=(
        "Seek emergency housing and assistance with replacing identification."
    ),
)


def test_maria_person_one_flow(monkeypatch):
    monkeypatch.setattr(
        "app.services.foundry.generate_recovery_passport",
        lambda message: MARIA_PASSPORT
        if message == MARIA_MESSAGE
        else None,
    )

    intake_response = client.post(
        "/api/intake",
        json={"message": MARIA_MESSAGE},
    )
    assert intake_response.status_code == 200
    passport = intake_response.json()
    assert RecoveryPassport.model_validate(passport) == MARIA_PASSPORT

    recovery_response = client.post(
        "/api/recovery",
        json={"passport": passport},
    )
    assert recovery_response.status_code == 200
    recovery = recovery_response.json()
    assert [step["category"] for step in recovery["plan"]] == [
        "housing",
        "documents",
    ]
    assert recovery["next_best_action"] == "Find safe emergency housing."

    escalation_response = client.post(
        "/api/escalate",
        json={
            "passport": passport,
            "reason": "Maria requested human help with replacing her ID.",
            "actions_taken": [
                recovery["plan"][0]["action"],
                recovery["plan"][1]["action"],
            ],
        },
    )
    assert escalation_response.status_code == 200
    escalation = escalation_response.json()
    assert escalation["escalated"] is True
    summary = escalation["handoff_summary"]
    assert summary["disaster"] == "flood"
    assert summary["location"] is None
    assert summary["household_summary"] == "2 child(ren)"
    assert summary["immediate_needs"] == passport["immediate_needs"]
    assert summary["barriers"] == passport["barriers"]
    assert summary["actions_taken"] == [
        "Find safe emergency housing.",
        "Begin identification replacement.",
    ]
    assert "No SSN" in summary["sensitive_data_collected"]
