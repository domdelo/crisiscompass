from pydantic import BaseModel, ConfigDict, Field


class Household(BaseModel):
    model_config = ConfigDict(extra="forbid", revalidate_instances="always")

    adults: int | None = Field(default=None, ge=0)
    children: int | None = Field(default=None, ge=0)


class Documents(BaseModel):
    model_config = ConfigDict(extra="forbid", revalidate_instances="always")

    identification: str = "unknown"
    proof_of_residence: str = "unknown"
    damage_documentation: str = "unknown"
    insurance_claim: str = "unknown"


class RecoveryPassport(BaseModel):
    model_config = ConfigDict(extra="forbid", revalidate_instances="always")

    disaster: str | None = None
    location: str | None = None

    household: Household = Field(default_factory=Household)

    immediate_needs: list[str] = Field(default_factory=list)
    barriers: list[str] = Field(default_factory=list)

    documents: Documents = Field(default_factory=Documents)

    next_best_action: str | None = None
