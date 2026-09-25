import os

from dotenv import load_dotenv


load_dotenv()


FOUNDRY_PROJECT_ENDPOINT = os.getenv("FOUNDRY_PROJECT_ENDPOINT", "")
FOUNDRY_MODEL_DEPLOYMENT = os.getenv(
    "FOUNDRY_MODEL_DEPLOYMENT",
    "gpt-4.1-mini"
)
