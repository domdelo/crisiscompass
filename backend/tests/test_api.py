from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


MARIA_PASSPORT = {
    "disaster": "flood",
    "location": "Fairfax County, VA",
    "household": {
        "adults": 1,
        "children": 2
    },
    "immediate_needs": [
        "emergency_housing",
        "food",
        "identification_replacement"
    ],
    "barriers": [
        "unsafe_home",
        "lost_identification"
    ],
    "documents": {
        "identification": "missing",
        "proof_of_residence": "unknown",
        "damage_documentation": "unknown",
        "insurance_claim": "unknown"
    },
    "next_best_action": "Find safe housing tonight."
}


def test_root():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["project"] == "CrisisCompass"
    assert data["status"] == "running"
    assert data["version"] == "0.1.0"


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy"
    }


def test_intake(monkeypatch):
    generated_passport = {
        "disaster": "flood",
        "location": None,
        "household": {
            "adults": None,
            "children": 2
        },
        "immediate_needs": [
            "emergency_housing",
            "identification_replacement"
        ],
        "barriers": [
            "unsafe_home",
            "lost_identification"
        ],
        "documents": {
            "identification": "missing",
            "proof_of_residence": "unknown",
            "damage_documentation": "unknown",
            "insurance_claim": "unknown"
        },
        "next_best_action": (
            "Seek emergency housing and assistance with replacing "
            "identification."
        )
    }
    monkeypatch.setattr(
        "app.services.foundry.generate_recovery_passport",
        lambda _message: generated_passport,
    )

    response = client.post(
        "/api/intake",
        json={
            "message": (
                "Our apartment flooded. I have two kids and "
                "we can't stay there tonight. I lost my wallet."
            )
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["disaster"] == "flood"
    assert data["location"] is None
    assert data["household"]["children"] == 2

    assert "emergency_housing" in data["immediate_needs"]
    assert "lost_identification" in data["barriers"]

    assert data["documents"]["identification"] == "missing"

    assert (
        data["next_best_action"]
        == (
            "Seek emergency housing and assistance with replacing "
            "identification."
        )
    )


def test_intake_rejects_empty_message():
    response = client.post(
        "/api/intake",
        json={
            "message": ""
        }
    )

    assert response.status_code == 422


def test_intake_returns_safe_error_when_foundry_is_unavailable(monkeypatch):
    def unavailable(_message):
        from app.services.foundry import FoundryResponseError

        raise FoundryResponseError("provider detail must not be exposed")

    monkeypatch.setattr(
        "app.services.foundry.generate_recovery_passport",
        unavailable,
    )
    response = client.post(
        "/api/intake",
        json={"message": "Our apartment flooded."},
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The intake AI service is temporarily unavailable."
    }


def test_resources():
    response = client.post(
        "/api/resources",
        json={
            "location": "Fairfax County, VA",
            "needs": [
                "emergency_housing",
                "food",
                "identification_replacement"
            ],
            "barriers": [
                "unsafe_home",
                "lost_identification"
            ]
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["resources"]) > 0

    resource = data["resources"][0]

    assert resource["name"] == "Disaster Assistance"
    assert resource["agency"] == (
        "Federal Emergency Management Agency"
    )
    assert resource["eligibility_status"] == "potential_match"
    assert resource["source_url"]


def test_recovery():
    response = client.post(
        "/api/recovery",
        json={
            "passport": MARIA_PASSPORT
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert set(data) == {
        "passport",
        "plan",
        "resources",
        "next_best_action",
    }
    assert data["passport"] == MARIA_PASSPORT
    assert data["resources"] == []
    assert len(data["plan"]) == 3

    assert data["plan"][0]["category"] == "housing"
    assert data["plan"][1]["category"] == "food"
    assert data["plan"][2]["category"] == "documents"
    assert all(step["status"] == "pending" for step in data["plan"])

    assert (
        data["next_best_action"]
        == "Find safe emergency housing."
    )


def test_scam_check():
    response = client.post(
        "/api/scam-check",
        json={
            "message": (
                "FEMA APPROVED: Pay a $75 processing fee "
                "at this link to receive your disaster payment."
            )
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["risk"] == "possible_scam"

    assert "Requests payment" in data["warning_signs"]

    assert data["source_url"]


def test_scam_check_rejects_empty_message():
    response = client.post(
        "/api/scam-check",
        json={
            "message": ""
        }
    )

    assert response.status_code == 422


def test_escalation():
    response = client.post(
        "/api/escalate",
        json={
            "passport": MARIA_PASSPORT,
            "reason": (
                "User requested human assistance because "
                "documentation requirements are unclear."
            ),
            "actions_taken": [
                "Emergency housing resources reviewed",
                "Disaster assistance resources reviewed"
            ]
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["escalated"] is True

    summary = data["handoff_summary"]

    assert summary["disaster"] == "flood"
    assert summary["location"] == "Fairfax County, VA"

    assert (
        summary["household_summary"]
        == "1 adult(s), 2 child(ren)"
    )

    assert "lost_identification" in summary["barriers"]

    assert len(summary["actions_taken"]) == 2

    assert (
        "No SSN" in summary["sensitive_data_collected"]
    )
