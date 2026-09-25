from app.models.survivor import RecoveryPassport
from app.services.escalation_engine import build_escalation_decision


def make_passport(**overrides) -> RecoveryPassport:
    return RecoveryPassport.model_validate(overrides)


def test_explicit_human_help_request_is_classified():
    decision = build_escalation_decision(
        passport=make_passport(),
        reason="I want to speak to a person about my options.",
        actions_taken=[],
    )

    assert decision.reason_for_escalation.startswith(
        "Explicit request for human help."
    )


def test_urgent_medical_need_prioritizes_emergency_help():
    decision = build_escalation_decision(
        passport=make_passport(immediate_needs=["medical_care"]),
        reason="Medical support is needed.",
        actions_taken=[],
    )

    assert decision.reason_for_escalation.startswith("Urgent medical need.")
    assert "not an emergency service" in decision.reason_for_escalation
    assert "local human help takes priority" in decision.reason_for_escalation


def test_immediate_safety_concern_prioritizes_emergency_help():
    decision = build_escalation_decision(
        passport=make_passport(barriers=["immediate_danger"]),
        reason="The survivor reports immediate danger.",
        actions_taken=[],
    )

    assert decision.reason_for_escalation.startswith(
        "Immediate safety concern."
    )
    assert "not an emergency service" in decision.reason_for_escalation


def test_accessibility_barrier_is_classified():
    decision = build_escalation_decision(
        passport=make_passport(barriers=["mobility_accessibility"]),
        reason="Help is needed to complete the next step.",
        actions_taken=[],
    )

    assert decision.reason_for_escalation.startswith(
        "Accessibility barrier requires human assistance."
    )


def test_handoff_carries_household_needs_barriers_and_actions():
    passport = make_passport(
        household={"adults": 1, "children": 2},
        immediate_needs=["emergency_housing", "food"],
        barriers=["unsafe_home", "lost_identification"],
    )

    decision = build_escalation_decision(
        passport=passport,
        reason="Human assistance requested.",
        actions_taken=["Housing resources reviewed"],
    )

    assert decision.household_summary == "1 adult(s), 2 child(ren)"
    assert decision.immediate_needs == ["emergency_housing", "food"]
    assert decision.barriers == ["unsafe_home", "lost_identification"]
    assert decision.actions_taken == ["Housing resources reviewed"]


def test_handoff_redacts_sensitive_data_and_exact_address():
    passport = make_passport(location="123 Main Street, Fairfax, VA")

    decision = build_escalation_decision(
        passport=passport,
        reason="SSN 123-45-6789 was mistakenly supplied.",
        actions_taken=[
            "Recorded birthdate 01/02/1990",
            "Bank account 123456789 was supplied",
            "A visit was considered at 123 Main Street",
        ],
    )

    handoff_text = " ".join(
        [decision.reason_for_escalation, *decision.actions_taken]
    )
    assert "123-45-6789" not in handoff_text
    assert "01/02/1990" not in handoff_text
    assert "123456789" not in handoff_text
    assert "123 Main Street" not in handoff_text
    assert decision.location == "Exact address withheld for privacy"
    assert "No SSN" in decision.sensitive_data_collected
    assert "bank data" in decision.sensitive_data_collected


def test_handoff_does_not_add_unsupported_case_facts():
    decision = build_escalation_decision(
        passport=make_passport(disaster="flood"),
        reason="Please review this case.",
        actions_taken=[],
    )

    assert decision.location is None
    assert decision.household_summary == "Household details not provided"
    assert decision.immediate_needs == []
    assert decision.barriers == []
    assert decision.actions_taken == []
