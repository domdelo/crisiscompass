from pydantic import BaseModel, Field


class ResourceRecommendation(BaseModel):
    name: str
    agency: str

    reason: str

    source_title: str
    source_url: str

    required_information: list[str] = Field(default_factory=list)

    next_action: str

    eligibility_status: str = "potential_match"