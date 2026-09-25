from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.resource import ResourceRecommendation
from app.services.search import search_resources


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

    Grounded in an authoritative government resource dataset via
    Azure AI Search. See app/services/search.py for retrieval and
    ranking logic.
    """

    resources = search_resources(
        location=request.location,
        needs=request.needs,
        barriers=request.barriers,
    )

    return ResourceResponse(resources=resources)
