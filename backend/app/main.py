from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.intake import router as intake_router
from app.api.resources import router as resources_router
from app.api.recovery import router as recovery_router
from app.api.safety import router as safety_router
from app.api.escalation import router as escalation_router


app = FastAPI(
    title="CrisisCompass API",
    description=(
        "Backend API for the CrisisCompass disaster assistance navigator."
    ),
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "project": "CrisisCompass",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }


app.include_router(
    intake_router,
    prefix="/api",
    tags=["Intake"]
)

app.include_router(
    resources_router,
    prefix="/api",
    tags=["Resources"]
)

app.include_router(
    recovery_router,
    prefix="/api",
    tags=["Recovery"]
)

app.include_router(
    safety_router,
    prefix="/api",
    tags=["Safety"]
)

app.include_router(
    escalation_router,
    prefix="/api",
    tags=["Escalation"]
)