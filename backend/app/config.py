import os
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv

load_dotenv()


def _base_endpoint(url: str) -> str:
    """
    AzureOpenAI wants the bare resource host (e.g.
    https://your-resource.services.ai.azure.com/), not the Foundry
    project path (.../api/projects/<name>) copied from the portal.
    """
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, "", "", ""))


_raw_endpoint = os.environ.get("AZURE_AI_FOUNDRY_ENDPOINT", "")

AZURE_AI_FOUNDRY_ENDPOINT = _base_endpoint(_raw_endpoint) if _raw_endpoint else ""
AZURE_AI_FOUNDRY_API_KEY = os.environ.get("AZURE_AI_FOUNDRY_API_KEY", "")
AZURE_AI_FOUNDRY_DEPLOYMENT = os.environ.get(
    "AZURE_AI_FOUNDRY_DEPLOYMENT", "gpt-4o-mini"
)
# Check the deployment's "View code" sample in the Foundry portal for the
# exact api-version it expects -- this default may not match your resource.
AZURE_AI_FOUNDRY_API_VERSION = os.environ.get(
    "AZURE_AI_FOUNDRY_API_VERSION", "2024-10-21"
)

FOUNDRY_CONFIGURED = bool(
    AZURE_AI_FOUNDRY_ENDPOINT and AZURE_AI_FOUNDRY_API_KEY
    and AZURE_AI_FOUNDRY_API_KEY != "PASTE_YOUR_API_KEY_HERE"
)
