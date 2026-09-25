"""
Loads every JSON document in data/government_sources/ and uploads
it to the Azure AI Search index as a search document.

Run after create_search_index.py, and any time the dataset changes:
    python3 scripts/ingest_documents.py
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

load_dotenv()

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
ADMIN_KEY = os.environ["AZURE_SEARCH_ADMIN_KEY"]
INDEX_NAME = os.environ.get("AZURE_SEARCH_INDEX_NAME", "crisiscompass-resources")

# backend/scripts/ingest_documents.py -> repo root / data / government_sources
DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "government_sources"


def load_documents() -> list[dict]:
    docs = []
    for path in sorted(DATA_DIR.glob("*.json")):
        with open(path) as f:
            doc = json.load(f)
        docs.append(doc)
    return docs


def main():
    if not DATA_DIR.exists():
        print(f"Data directory not found: {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    documents = load_documents()
    if not documents:
        print(f"No JSON documents found in {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    client = SearchClient(ENDPOINT, INDEX_NAME, AzureKeyCredential(ADMIN_KEY))
    result = client.upload_documents(documents=documents)

    succeeded = sum(1 for r in result if r.succeeded)
    failed = [r for r in result if not r.succeeded]

    print(f"Uploaded {succeeded}/{len(documents)} documents.")
    if failed:
        print("Failures:")
        for r in failed:
            print(f"  - {r.key}: {r.error_message}")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyError as e:
        print(f"Missing required environment variable: {e}", file=sys.stderr)
        sys.exit(1)
