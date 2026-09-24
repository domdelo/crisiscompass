from pydantic import BaseModel, Field


class Household(BaseModel):
    adults: int | None = None
    children: int | None = None


class Documents(BaseModel):
    identification: str = "unknown"
    proof_of_residence: str = "unknown"
    damage_documentation: str = "unknown"
    insurance_claim: str = "unknown"


class RecoveryPassport(BaseModel):
    disaster: str | None = None
    location: str | None = None

    household: Household = Field(default_factory=Household)

    immediate_needs: list[str] = Field(default_factory=list)
    barriers: list[str] = Field(default_factory=list)

    documents: Documents = Field(default_factory=Documents)

    next_best_action: str | None = None