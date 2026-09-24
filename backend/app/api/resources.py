from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.resource import ResourceRecommendation


router = APIRouter()


class ResourceRequest(BaseModel):
    location: str
    needs: list[str] = Field(default_factory=list)
    barriers: list[str] = Field(default_factory=list)


class ResourceResponse(BaseModel):
    resources: list[ResourceRecommendation] = Field(
        default_factory=list
    )


@router.post("/resources", response_model=ResourceResponse)
async def get_resources(request: ResourceRequest):
    """
    Find trusted disaster assistance resources.

    This currently returns mocked data.
    Azure AI Search and Microsoft Foundry will replace
    this implementation later.
    """

    return ResourceResponse(
        resources=[
            ResourceRecommendation(
                name="Disaster Assistance",
                agency="Federal Emergency Management Agency",
                reason=(
                    "Your household reported disaster-related "
                    "housing needs."
                ),
                source_title="DisasterAssistance.gov",
                source_url="https://www.disasterassistance.gov/",
                required_information=[
                    "Disaster location",
                    "Description of disaster-related needs"
                ],
                next_action=(
                    "Review available disaster assistance "
                    "and application guidance."
                ),
                eligibility_status="potential_match"
            )
        ]
    )
