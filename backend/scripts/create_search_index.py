"""
Creates (or updates) the Azure AI Search index for CrisisCompass
authoritative government resource documents.

Run manually, once, whenever the index schema changes:
    python3 scripts/create_search_index.py
"""
import os
import sys

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType,
    SemanticConfiguration,
    SemanticPrioritizedFields,
    SemanticField,
    SemanticSearch,
)

load_dotenv()

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
ADMIN_KEY = os.environ["AZURE_SEARCH_ADMIN_KEY"]
INDEX_NAME = os.environ.get("AZURE_SEARCH_INDEX_NAME", "crisiscompass-resources")


def build_index() -> SearchIndex:
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="title", type=SearchFieldDataType.String),
        SearchableField(name="program_name", type=SearchFieldDataType.String),
        SearchableField(name="agency", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="source_url", type=SearchFieldDataType.String),
        SimpleField(
            name="secondary_urls",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
        ),
        SimpleField(name="category", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="jurisdiction", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(
            name="disaster_types",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            filterable=True,
            facetable=True,
        ),
        SimpleField(
            name="needs",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            filterable=True,
            facetable=True,
        ),
        SimpleField(
            name="barriers",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            filterable=True,
            facetable=True,
        ),
        SimpleField(name="priority", type=SearchFieldDataType.Int32, filterable=True, sortable=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SimpleField(
            name="required_information",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
        ),
        SearchableField(name="next_action", type=SearchFieldDataType.String),
        SimpleField(name="last_verified", type=SearchFieldDataType.String),
    ]

    semantic_config = SemanticConfiguration(
        name="crisiscompass-semantic-config",
        prioritized_fields=SemanticPrioritizedFields(
            title_field=SemanticField(field_name="title"),
            content_fields=[SemanticField(field_name="content")],
            keywords_fields=[
                SemanticField(field_name="category"),
                SemanticField(field_name="agency"),
            ],
        ),
    )

    return SearchIndex(
        name=INDEX_NAME,
        fields=fields,
        semantic_search=SemanticSearch(configurations=[semantic_config]),
    )


def main():
    client = SearchIndexClient(ENDPOINT, AzureKeyCredential(ADMIN_KEY))
    index = build_index()

    existing = [i.name for i in client.list_indexes()]
    if INDEX_NAME in existing:
        print(f"Index '{INDEX_NAME}' already exists — updating schema.")
        client.create_or_update_index(index)
    else:
        print(f"Creating index '{INDEX_NAME}'.")
        client.create_index(index)

    print("Done. Current indexes:", [i.name for i in client.list_indexes()])


if __name__ == "__main__":
    try:
        main()
    except KeyError as e:
        print(f"Missing required environment variable: {e}", file=sys.stderr)
        sys.exit(1)
