from app.models.survivor import RecoveryPassport
from app.services.recovery_engine import build_recovery_state


def make_passport(**overrides) -> RecoveryPassport:
    return RecoveryPassport.model_validate(overrides)


def test_maria_prioritizes_housing_before_identification():
    passport = make_passport(
        disaster="flood",
        household={"children": 2},
        immediate_needs=[
            "identification_replacement",
            "emergency_housing",
        ],
        barriers=["unsafe_home", "lost_identification"],
        documents={"identification": "missing"},
    )

    state = build_recovery_state(passport)

    assert [step.category for step in state.plan] == [
        "housing",
        "documents",
    ]
    assert state.next_best_action == "Find safe emergency housing."


def test_medical_care_outranks_housing():
    passport = make_passport(
        immediate_needs=["emergency_housing", "medical_care"]
    )

    state = build_recovery_state(passport)

    assert [step.category for step in state.plan] == ["medical", "housing"]
    assert state.next_best_action == "Seek urgent medical care."


def test_lost_identification_barrier_adds_document_step():
    passport = make_passport(barriers=["lost_identification"])

    state = build_recovery_state(passport)

    assert len(state.plan) == 1
    assert state.plan[0].category == "documents"
    assert state.plan[0].action == "Begin identification replacement."


def test_recovery_steps_are_not_duplicated():
    passport = make_passport(
        immediate_needs=[
            "emergency_housing",
            "emergency_housing",
            "identification_replacement",
        ],
        barriers=[
            "unsafe_home",
            "lost_identification",
            "lost_identification",
        ],
    )

    state = build_recovery_state(passport)

    assert len(state.plan) == 2
    assert len({step.action for step in state.plan}) == 2


def test_empty_passport_returns_empty_recovery_state():
    passport = make_passport()

    state = build_recovery_state(passport)

    assert state.passport == passport
    assert state.plan == []
    assert state.resources == []
    assert state.next_best_action is None
