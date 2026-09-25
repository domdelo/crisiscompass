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


def test_intake():
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
    assert data["location"] == "Fairfax County, VA"
    assert data["household"]["children"] == 2

    assert "emergency_housing" in data["immediate_needs"]
    assert "lost_identification" in data["barriers"]

    assert data["documents"]["identification"] == "missing"

    assert (
        data["next_best_action"]
        == "Find safe housing tonight."
    )


def test_intake_rejects_empty_message():
    response = client.post(
        "/api/intake",
        json={
            "message": ""
        }
    )

    assert response.status_code == 422


def test_resources():
    """
    Maria's scenario: flooded apartment, two kids, unsafe home,
    lost ID. Verifies the /api/resources contract shape and that
    results are grounded in the authoritative government dataset
    (not asserting exact content, since Azure AI Search ranking
    can shift as the dataset or query text changes).
    """
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
    resources = data["resources"]

    assert len(resources) > 0

    for resource in resources:
        assert resource["name"]
        assert resource["agency"]
        assert resource["reason"]
        assert resource["source_title"]
        assert resource["source_url"].startswith("https://")
        assert isinstance(resource["required_information"], list)
        assert resource["next_action"]
        # Safety rule: never claim confirmed eligibility.
        assert resource["eligibility_status"] == "potential_match"


def test_resources_no_needs_returns_gracefully():
    """
    An empty/no-signal request should not error, even if Azure
    Search returns nothing useful to rank.
    """
    response = client.post(
        "/api/resources",
        json={
            "location": "",
            "needs": [],
            "barriers": []
        }
    )

    assert response.status_code == 200
    assert isinstance(response.json()["resources"], list)


def test_recovery():
    response = client.post(
        "/api/recovery",
        json={
            "passport": MARIA_PASSPORT
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["plan"]) == 5

    assert data["plan"][0]["category"] == "housing"

    assert (
        data["next_best_action"]
        == "Find safe housing tonight."
    )


def test_scam_check():
    """
    Maria's scenario: a message impersonating FEMA that demands an
    upfront payment. Should trigger multiple grounded warning signs
    and a possible_scam risk level.
    """
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
    assert len(data["warning_signs"]) >= 2
    assert any("payment" in w.lower() for w in data["warning_signs"])
    assert data["recommendation"]
    assert data["source_title"]
    assert data["source_url"].startswith("https://")


def test_scam_check_flags_suspicious_link():
    response = client.post(
        "/api/scam-check",
        json={
            "message": (
                "Your disaster relief payment is ready. Click here to "
                "claim it now: http://fema-relief-claims.info/verify"
            )
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["risk"] in ("possible_scam", "suspicious")
    assert any("link" in w.lower() for w in data["warning_signs"])


def test_scam_check_does_not_flag_benign_message():
    """
    Scam Shield should not cry wolf on ordinary disaster-related
    messages that show none of the tracked warning signs.
    """
    response = client.post(
        "/api/scam-check",
        json={
            "message": (
                "Hi, this is a reminder that the Fairfax County "
                "emergency shelter on Main Street is open tonight for "
                "anyone who needs a safe place to stay."
            )
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["risk"] == "no_warning_signs_detected"
    assert data["warning_signs"] == []


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