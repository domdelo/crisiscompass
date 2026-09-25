"""Deterministic recovery-plan generation from a Recovery Passport."""

from dataclasses import dataclass

from app.models.recovery import RecoveryState, RecoveryStep
from app.models.survivor import RecoveryPassport


@dataclass(frozen=True)
class StepDefinition:
    category: str
    action: str


# Dictionary order is the recovery priority order. Documentation and insurance
# work intentionally follow immediate safety and basic-needs actions.
STEP_DEFINITIONS = {
    "medical_care": StepDefinition(
        category="medical",
        action="Seek urgent medical care.",
    ),
    "emergency_housing": StepDefinition(
        category="housing",
        action="Find safe emergency housing.",
    ),
    "water": StepDefinition(
        category="water",
        action="Locate safe drinking water.",
    ),
    "food": StepDefinition(
        category="food",
        action="Locate emergency food assistance.",
    ),
    "transportation": StepDefinition(
        category="transportation",
        action="Arrange emergency transportation.",
    ),
    "identification_replacement": StepDefinition(
        category="documents",
        action="Begin identification replacement.",
    ),
    "utilities": StepDefinition(
        category="utilities",
        action="Request emergency utility assistance.",
    ),
    "financial_assistance": StepDefinition(
        category="financial_assistance",
        action="Review available disaster assistance.",
    ),
    "proof_of_residence": StepDefinition(
        category="documents",
        action="Obtain replacement proof of residence.",
    ),
    "damage_documentation": StepDefinition(
        category="documents",
        action="Document disaster-related damage.",
    ),
    "insurance_claim": StepDefinition(
        category="insurance",
        action="Begin or follow up on an insurance claim.",
    ),
}


BARRIER_REQUIREMENTS = {
    "urgent_medical_need": "medical_care",
    "unsafe_home": "emergency_housing",
    "no_safe_water": "water",
    "food_insecurity": "food",
    "no_transportation": "transportation",
    "lost_identification": "identification_replacement",
    "utility_outage": "utilities",
}


def _normalize_labels(labels: list[str]) -> set[str]:
    return {
        label.strip().lower()
        for label in labels
        if label and label.strip()
    }


def build_recovery_state(passport: RecoveryPassport) -> RecoveryState:
    """Build a prioritized, deduplicated recovery state for a survivor."""

    required_steps = _normalize_labels(passport.immediate_needs)
    barriers = _normalize_labels(passport.barriers)

    for barrier, step_key in BARRIER_REQUIREMENTS.items():
        if barrier in barriers:
            required_steps.add(step_key)

    plan = [
        RecoveryStep(
            category=definition.category,
            action=definition.action,
            status="pending",
        )
        for step_key, definition in STEP_DEFINITIONS.items()
        if step_key in required_steps
    ]

    next_best_action = plan[0].action if plan else None

    return RecoveryState(
        passport=passport,
        plan=plan,
        resources=[],
        next_best_action=next_best_action,
    )
