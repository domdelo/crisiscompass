# CrisisCompass Frontend

Next.js (App Router, TypeScript, Tailwind v4) frontend for CrisisCompass — *your next step when everything changes.*

## Run it

The frontend talks to the FastAPI backend in `../backend` (default `http://localhost:8000`).

```bash
# terminal 1 — backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

To point at a different backend, set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` (gitignored). The backend must allow the frontend's origin via CORS.

## Scripts

| Command         | What it does               |
| --------------- | -------------------------- |
| `npm run dev`   | Dev server with hot reload |
| `npm run build` | Production build + type-check |
| `npm run lint`  | ESLint                     |

## Pages

- `/` — intake ("Tell us what happened"), then the recovery plan: Recovery Passport, Next Best Action, Recovery Journey, Trusted Resources, Scam Shield, and human help.
- `/guide?step=<category>` — guided questions for each Recovery Journey step, ending with tips and resources based on the answers and the Recovery Passport.

## Where things live

| Path                     | Purpose |
| ------------------------ | ------- |
| `lib/types.ts`           | TypeScript mirrors of the backend's Pydantic models — keep in sync with the API contracts |
| `lib/api.ts`             | Typed client for all backend endpoints |
| `lib/session.ts`         | Saves the plan and progress in `sessionStorage` (cleared when the tab closes) |
| `lib/guideContent.ts`    | Guide questions and result logic per step |
| `lib/journeyContent.ts`  | Short guidance and links shown in the Recovery Journey |
| `lib/resourceLinks.ts`   | Every external resource link, defined once |
| `components/`            | UI components |

## Notes

- Progress is kept in `sessionStorage`, not `localStorage`, so a survivor's situation doesn't linger on a shared or borrowed device after the tab closes. "Start over" on the plan page clears it.
- Resource links were last checked on 2026-09-25. They're general guidance, not eligibility decisions — resource cards say "Potential match", never "You qualify".
- The app never asks for SSNs, bank details, full birth dates, or exact addresses.
