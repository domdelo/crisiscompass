"""
Quick manual sanity check against the Azure AI Search index —
not a pytest test, just a way to eyeball retrieval quality.

    python3 scripts/test_search.py
"""
import os

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

load_dotenv()

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
ADMIN_KEY = os.environ["AZURE_SEARCH_ADMIN_KEY"]
INDEX_NAME = os.environ.get("AZURE_SEARCH_INDEX_NAME", "crisiscompass-resources")

client = SearchClient(ENDPOINT, INDEX_NAME, AzureKeyCredential(ADMIN_KEY))

# Maria: apartment flooded, two kids, can't stay tonight, lost her wallet.
query = "emergency housing after a flood, lost identification, two children"

results = client.search(
    search_text=query,
    top=5,
    select=["id", "title", "agency", "category", "needs", "barriers"],
)

print(f"Query: {query!r}\n")
for r in results:
    print(f"[{r['@search.score']:.2f}] {r['id']} — {r['title']} ({r['agency']})")
    print(f"    category={r['category']}  needs={r['needs']}  barriers={r['barriers']}")
