# CrisisCompass

**Your next step when everything changes.**

CrisisCompass is an AI-powered disaster assistance navigator built for the Microsoft Innovation Studio Hackathon. It helps disaster survivors turn a stressful, unstructured situation into a clear recovery path with trusted government resources, a prioritized next action, scam warnings, and human escalation when needed.

## Problem

After a hurricane, flood, wildfire, or other emergency, survivors often have to navigate fragmented government websites, forms, eligibility rules, documentation requirements, and overloaded support channels.

This becomes even harder when someone:

- cannot safely stay in their home
- has lost identification
- has limited connectivity
- needs urgent housing, food, or medical help
- is unsure which programs may apply
- encounters disaster-related scams
- needs help from a human representative

Traditional FAQs and phone menus force survivors to figure out the process themselves.

CrisisCompass is designed to answer a more useful question:

**What should I do next?**

## Solution

CrisisCompass converts a survivor's natural-language description into a structured **Recovery Passport**, builds a prioritized recovery plan, retrieves trusted assistance resources, and determines a single **Next Best Action**.

The experience is designed around a guided recovery journey rather than a generic chatbot.

Core flow:

```text
Survivor Story
      ↓
Recovery Passport
      ↓
Next Best Action
      ↓
Recovery Journey
      ↓
Trusted Government Resources
      ↓
Scam Shield / Human Escalation
````

## Key Features

### Recovery Passport

Microsoft Foundry converts the survivor's natural-language description into a validated structured profile containing:

* disaster type
* general location when provided
* household information
* immediate needs
* recovery barriers
* document status
* next best action

CrisisCompass minimizes sensitive data collection and does not require unnecessary information such as Social Security numbers, financial account details, or full birth dates.

### Next Best Action

The Recovery Engine prioritizes immediate safety and essential needs before longer-term recovery tasks.

For example:

```text
Emergency housing
→ food / water / medical needs
→ transportation
→ identification replacement
→ utilities
→ financial assistance
→ longer-term documentation and recovery
```

The highest-priority pending step becomes the survivor's **Next Best Action**.

### Trusted Resource Discovery

CrisisCompass uses **Azure AI Search** to retrieve disaster assistance information from authoritative government sources.

Resource recommendations include:

* program or resource name
* responsible agency
* why the resource may be relevant
* official source
* information or documents that may be needed
* recommended next action
* eligibility status

CrisisCompass does not claim that a survivor definitely qualifies for a program unless eligibility is actually confirmed.

Instead, the system uses wording such as:

**Potential match**

or:

**This resource may be relevant based on the information provided.**

### Scam Shield

Scam Shield analyzes suspicious disaster-related messages for warning signs such as:

* requests for payment
* suspicious links
* government impersonation
* artificial urgency
* requests for sensitive information
* guaranteed disaster-assistance claims

The feature provides explainable warnings and points users toward authoritative verification guidance.

### Human Escalation

CrisisCompass can escalate situations involving:

* urgent safety or medical concerns
* ambiguous or conflicting information
* accessibility barriers
* high-impact decisions
* missing critical information
* explicit requests for human help
* insufficient authoritative evidence

When escalation is needed, the system creates a privacy-conscious **Human Handoff Summary** so the survivor does not have to start over.

## Demo Scenario

The primary demo follows a fictional survivor named Maria.

Maria enters:

> Our apartment flooded. I have two kids and we can't stay there tonight. I also lost my wallet.

CrisisCompass identifies:

```text
Disaster:
Flood

Household:
2 children

Immediate Needs:
Emergency housing
Identification replacement

Barriers:
Unsafe home
Lost identification
```

The system prioritizes:

**Find safe housing first.**

Maria can then:

1. view her Recovery Passport
2. see her Next Best Action
3. follow her Recovery Journey
4. review trusted assistance resources
5. verify suspicious disaster messages with Scam Shield
6. request human assistance
7. receive a structured Human Handoff Summary

## Architecture

```text
                    ┌──────────────────────┐
                    │      Survivor        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Next.js Frontend   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Microsoft       │  │ Recovery Engine │  │ Azure AI Search │
│ Foundry         │  │                 │  │                 │
│                 │  │ Priority Rules  │  │ Government Data │
│ Intake AI       │  │ Next Best Action│  │ Resource Search │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   Recovery State     │
                   │ + Trusted Resources │
                   └──────────┬───────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
       ┌─────────────────┐        ┌─────────────────┐
       │   Scam Shield   │        │ Human Escalation│
       └─────────────────┘        └─────────────────┘
```

## Microsoft Technology

CrisisCompass uses Microsoft technologies as core parts of the solution.

### Microsoft Foundry

Microsoft Foundry powers the survivor-intake intelligence.

It converts an unstructured disaster description into a validated Recovery Passport while enforcing rules around:

* privacy
* unsupported inference
* structured output
* emergency safety
* eligibility claims
* sensitive information

Model deployment:

```text
gpt-4.1-mini
```

### Azure AI Search

Azure AI Search provides the retrieval layer for trusted disaster assistance resources.

The demo index:

```text
crisiscompass-resources
```

contains authoritative disaster-related documents used to support resource recommendations.

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* ESLint

### Backend

* Python
* FastAPI
* Pydantic
* pytest

### Microsoft / Azure

* Microsoft Foundry
* Azure AI Projects SDK
* Azure Identity
* Azure AI Search

## API

The backend exposes:

```text
POST /api/intake
POST /api/recovery
POST /api/resources
POST /api/scam-check
POST /api/escalate

GET /health
```

### Intake

```text
POST /api/intake
```

Converts a survivor story into a Recovery Passport.

### Recovery

```text
POST /api/recovery
```

Creates the prioritized recovery journey and Next Best Action.

### Resources

```text
POST /api/resources
```

Retrieves trusted disaster assistance resources.

### Scam Check

```text
POST /api/scam-check
```

Analyzes suspicious disaster-related messages.

### Escalation

```text
POST /api/escalate
```

Generates a structured Human Handoff Summary.

## Safety and Privacy

CrisisCompass is designed to minimize unnecessary sensitive-data collection.

The system avoids requesting or storing:

* Social Security numbers
* bank account information
* credit card information
* full birth dates
* unnecessary exact addresses

Additional safeguards include:

* strict Recovery Passport validation
* rejection of unexpected fields
* rejection of negative household counts
* protection against unsupported location inference
* protection against unsupported household inference
* protection against confirmed eligibility claims
* generic safe errors when Foundry is unavailable
* emergency-priority behavior for urgent medical or safety situations

CrisisCompass is not a replacement for emergency services.

## Local Development

### Clone the repository

```bash
git clone https://github.com/domdelo/crisiscompass.git
cd crisiscompass
```

## Backend Setup

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

python -m pip install -r requirements.txt
```

Create:

```text
backend/.env
```

with:

```env
FOUNDRY_PROJECT_ENDPOINT=<your-foundry-project-endpoint>
FOUNDRY_MODEL_DEPLOYMENT=gpt-4.1-mini

AZURE_SEARCH_ENDPOINT=<your-search-endpoint>
AZURE_SEARCH_ADMIN_KEY=<your-search-key>
AZURE_SEARCH_INDEX_NAME=crisiscompass-resources
```

Do not commit `.env`.

For local Microsoft Foundry authentication:

```bash
az login
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to:

```text
http://localhost:3000
```

The frontend proxies backend API traffic to:

```text
http://127.0.0.1:8000
```

unless `BACKEND_URL` is configured differently.

## Testing

Backend:

```bash
cd backend
python -m pytest -v
```

Current backend result:

```text
42 passed
```

The standard automated test suite does not require live Azure credentials.

A separate opt-in live Azure AI Search validation script is available under:

```text
backend/scripts/test_search.py
```

Frontend validation:

```bash
cd frontend

npm run build
npx tsc --noEmit
npm run lint
```

The production frontend build currently passes successfully.

## Project Validation

The integrated application has been tested end-to-end with the Maria demo flow:

```text
Intake
→ Recovery Passport
→ Next Best Action
→ Recovery Journey
→ Trusted Resources
→ Scam Shield
→ Human Escalation
```

Backend:

```text
42 / 42 tests passing
```

Frontend:

```text
Production build passing
TypeScript passing
ESLint passing
```

## Team Workstreams

### Dom Deloatch — AI Engine

* Microsoft Foundry integration
* survivor intake
* Recovery Passport
* Recovery Engine
* Next Best Action
* human escalation
* safety and privacy guardrails

### Jordan Dimatulac— Resource Engine

* authoritative government dataset
* Azure AI Search
* trusted resource retrieval
* source grounding
* Scam Shield

### Scott Ewart — Frontend

* Next.js experience
* API integration
* Recovery Passport UI
* Recovery Journey
* trusted resource cards
* Scam Shield UI
* human escalation UI
* responsive and accessible experience

## Hackathon Scope

CrisisCompass is intentionally a focused hackathon MVP.

It does not attempt to provide:

* nationwide real-time shelter availability
* direct FEMA application submission
* real 911 integration
* every disaster-assistance program
* full offline capability
* complex production authentication

The goal is to demonstrate a polished, realistic recovery-navigation experience built around trusted information and a clear Next Best Action.

## Future Improvements

Potential future work includes:

* multilingual interaction
* text-to-speech and voice input
* broader state/local resource coverage
* document understanding
* persistent recovery progress
* personalized follow-up questions
* semantic search tuning
* managed identity for Azure AI Search
* expanded scam-detection coverage
* additional accessibility features
* production deployment and authentication

## License

Built for the Microsoft Innovation Studio Hackathon.

```

A couple of things I’d do after you paste it:
- replace the repo URL if your actual GitHub URL is different
- add your team member names if required
- optionally add screenshots near the top
- optionally add the hackathon challenge name directly under the title

If you want, I can do the **architecture diagram next**, and then we can turn that into the PowerPoint.
```
