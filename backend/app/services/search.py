"""
Resource retrieval service.

Queries the Azure AI Search index of authoritative government
disaster-assistance documents and converts the results into the
shared ResourceRecommendation contract.

This module intentionally contains all search/ranking/mapping logic
so that backend/app/api/resources.py can stay a thin route.
"""
import logging
import os
from functools import lru_cache

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
from azure.search.documents import SearchClient

from app.models.resource import ResourceRecommendation

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_TOP_K = 5

# A resource below this score is treated as not relevant enough to
# surface to a survivor, rather than dumping every partial match.
MIN_RELEVANCE_SCORE = 1.0


@lru_cache
def _get_client() -> SearchClient | None:
    """
    Builds (and caches) the Azure AI Search client.

    Returns None if the required environment variables aren't set,
    so callers can fail gracefully instead of crashing the API.
    """
    endpoint = os.environ.get("AZURE_SEARCH_ENDPOINT")
    admin_key = os.environ.get("AZURE_SEARCH_ADMIN_KEY")
    index_name = os.environ.get("AZURE_SEARCH_INDEX_NAME", "crisiscompass-resources")

    if not endpoint or not admin_key:
        logger.warning(
            "AZURE_SEARCH_ENDPOINT / AZURE_SEARCH_ADMIN_KEY not configured; "
            "resource search will return no results."
        )
        return None

    return SearchClient(endpoint, index_name, AzureKeyCredential(admin_key))


def _humanize(tokens: list[str]) -> list[str]:
    """'emergency_housing' -> 'emergency housing'"""
    return [t.replace("_", " ") for t in tokens]


def _build_query_text(location: str, needs: list[str], barriers: list[str]) -> str:
    parts = _humanize(needs) + _humanize(barriers)
    if location:
        parts.append(location)
    return " ".join(parts) if parts else "disaster assistance"


def _build_reason(doc: dict, needs: set[str], barriers: set[str]) -> str:
    matched_needs = sorted(set(doc.get("needs") or []) & needs)
    matched_barriers = sorted(set(doc.get("barriers") or []) & barriers)

    if not matched_needs and not matched_barriers:
        return (
            "This resource may be relevant to your disaster recovery "
            "situation based on the information you provided."
        )

    pieces = []
    if matched_needs:
        pieces.append(f"needs you reported ({', '.join(_humanize(matched_needs))})")
    if matched_barriers:
        pieces.append(f"barriers you're facing ({', '.join(_humanize(matched_barriers))})")

    return f"This resource may be relevant based on {' and '.join(pieces)}."


def _to_recommendation(doc: dict, needs: set[str], barriers: set[str]) -> ResourceRecommendation:
    return ResourceRecommendation(
        name=doc.get("program_name") or doc.get("title", "Disaster Assistance Program"),
        agency=doc.get("agency", "Unknown agency"),
        reason=_build_reason(doc, needs, barriers),
        source_title=doc.get("title", doc.get("source_url", "Official government source")),
        source_url=doc.get("source_url", ""),
        required_information=doc.get("required_information") or [],
        next_action=doc.get("next_action", "Review this resource for more information."),
        eligibility_status="potential_match",
    )


def search_resources(
    location: str,
    needs: list[str],
    barriers: list[str],
    top_k: int = DEFAULT_TOP_K,
) -> list[ResourceRecommendation]:
    """
    Retrieves grounded resource recommendations for a survivor.

    Never raises: on any Azure Search failure (misconfiguration,
    outage, throttling) this logs the error and returns an empty
    list so /api/resources can still respond gracefully.
    """
    client = _get_client()
    if client is None:
        return []

    query_text = _build_query_text(location, needs, barriers)
    needs_set = set(needs or [])
    barriers_set = set(barriers or [])

    try:
        results = client.search(
            search_text=query_text,
            top=top_k,
            select=[
                "id",
                "title",
                "program_name",
                "agency",
                "source_url",
                "category",
                "needs",
                "barriers",
                "required_information",
                "next_action",
            ],
        )

        recommendations = []
        for doc in results:
            score = doc.get("@search.score", 0.0)
            if score < MIN_RELEVANCE_SCORE:
                continue
            recommendations.append(_to_recommendation(doc, needs_set, barriers_set))

        return recommendations

    except AzureError as e:
        logger.error("Azure AI Search request failed: %s", e)
        return []
    except Exception as e:  # noqa: BLE001 - last-resort safety net for a demo
        logger.exception("Unexpected error during resource search: %s", e)
        return []
