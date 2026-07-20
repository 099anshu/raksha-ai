# RAKSHA AI — Digital Public Safety Intelligence Platform

A working prototype for **ET AI Hackathon 2.0 — Problem Statement 6**. Five AI modules,
each in its own folder so your team can work in parallel without stepping on each other.

**What actually works right now, out of the box, once you add an API key:**
- **SENTINEL** — paste a call transcript/SMS → get a real threat score + red flags (Claude reasoning)
- **NETRA** — upload a currency photo → get a real security-feature analysis (Claude vision)
- **KAVACH** — a real working multilingual safety chatbot (Claude)
- **JAAL** — fraud network graph explorer, running on realistic seeded demo data
- **DRISHTI** — geospatial incident dashboard, running on realistic seeded demo data

JAAL and DRISHTI are demo-data-backed rather than live-database-backed — see
"Stretch goals" below for why, and how to upgrade them if you have time left.

---

## 0. Read this first — what to say if judges ask "is this real AI?"

Yes. SENTINEL, NETRA, and KAVACH make live calls to Google's Gemini API to do real
reasoning/vision — not hardcoded if/else rules. JAAL and DRISHTI use realistic seeded data
standing in for what would be a live Neo4j graph database and live Mapbox feed in
production — this is a completely standard and expected hackathon practice (your own
implementation plan's Section 20.2 "Demo Data Preparation" calls for exactly this). Be
upfront about it if asked; judges respect honesty about scope far more than they penalize it.

---

## 1. One-time computer setup (do this once, on each teammate's laptop)

You said you don't know how to code — that's fine, you won't be writing code by hand.
You just need three programs installed:

1. **Git** — https://git-scm.com/downloads (lets you download/sync the project from GitHub)
2. **Node.js (LTS version)** — https://nodejs.org (runs the website/frontend)
3. **Python 3.11+** — https://www.python.org/downloads (runs the AI backend)
4. **VS Code** (optional but recommended) — https://code.visualstudio.com (a code editor with a built-in terminal)

To check they installed correctly, open a terminal (on Windows: "Command Prompt" or
"PowerShell"; on Mac: "Terminal") and type each of these, pressing Enter after each:
```
git --version
node --version
python3 --version
```
Each should print a version number, not an error.

---

## 2. Get this code into your team's GitHub repo

Your teammate already created: `https://github.com/Jason3105/ET-AI-Hack.git`

**If you're the one who has this project folder right now:**
```bash
# 1. Clone your team's empty/existing repo somewhere
git clone https://github.com/Jason3105/ET-AI-Hack.git
cd ET-AI-Hack

# 2. Copy everything from this raksha-ai/ folder into that repo folder
#    (drag-and-drop in Finder/Explorer is fine, or:)
cp -r /path/to/raksha-ai/* .
cp -r /path/to/raksha-ai/.github .
cp /path/to/raksha-ai/.gitignore .

# 3. Push it up
git add .
git commit -m "Initial RAKSHA AI scaffold — 5 modules, frontend + backend"
git push origin main
```

**Everyone else on the team**, once it's pushed:
```bash
git clone https://github.com/Jason3105/ET-AI-Hack.git
cd ET-AI-Hack
```

---

## 3. Get a free Gemini API key (this powers SENTINEL, NETRA, KAVACH)

We use Google's Gemini API instead of a paid one — it has a genuine ongoing free tier
(no credit card, no expiring trial credits), and supports both text and image analysis.

1. Go to https://aistudio.google.com/apikey and sign in with any Google account
2. Click "Create API key"
3. Copy the key — you'll paste it in step 4 below.

The free tier has daily rate limits (plenty for building + demoing), no cost, and no card
required. Keep this key secret — never commit it to GitHub (the `.gitignore` already
prevents this).

---

## 4. Run it on your own laptop

**Backend (do this first, in one terminal):**
```bash
cd backend
python3 -m venv venv              # creates an isolated Python environment
source venv/bin/activate          # Mac/Linux. On Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # make your own copy of the settings file
# now open .env in any text editor and paste your Gemini key after GEMINI_API_KEY=

uvicorn app.main:app --reload --port 8000
```
Leave this terminal running. Open http://localhost:8000 in a browser — you should see
`{"service":"RAKSHA AI","status":"ok",...}`. That means the backend is alive.

**Frontend (open a SECOND terminal, keep the backend one running):**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # defaults already point at localhost:8000, no edits needed
npm run dev
```
Open http://localhost:3000 — this is your actual website. Click through SENTINEL, NETRA,
KAVACH and try them — those three will genuinely call Claude and give you real answers.

---

## 5. How to split the work across your team (5 people = 5 owners)

Each module is self-contained — one backend route file + one frontend page. A teammate can
own a module end-to-end without touching anyone else's files:

| Module | Backend file | Frontend page | What to improve for the demo |
|---|---|---|---|
| SENTINEL | `backend/app/routes/sentinel.py` | `frontend/app/sentinel/page.tsx` | Add 2-3 pre-written scam transcripts as one-click demo buttons |
| NETRA | `backend/app/routes/netra.py` | `frontend/app/netra/page.tsx` | Gather 5 real + 5 fake note sample photos for a reliable live demo |
| JAAL | `backend/app/routes/jaal.py` | `frontend/app/jaal/page.tsx` | Make the seeded graph tell a specific story (e.g. name nodes after a scenario) |
| DRISHTI | `backend/app/routes/drishti.py` | `frontend/app/drishti/page.tsx` | Get a free Mapbox token and swap the table for a real map (see file docstring) |
| KAVACH | `backend/app/routes/kavach.py` | `frontend/app/kavach/page.tsx` | Add a language selector; test Hindi/regional-language conversations |

Everyone works on their own branch to avoid conflicts:
```bash
git checkout -b feature/sentinel-demo-scenarios   # replace with your module name
# ...make changes...
git add .
git commit -m "Add 3 pre-built scam scenarios to SENTINEL"
git push origin feature/sentinel-demo-scenarios
# then open a Pull Request on GitHub into `develop` or `main`
```

The shared/architecture files (don't touch unless everyone agrees):
- `backend/app/main.py` — wires all 5 routers together
- `backend/app/services/ai.py` — the shared Claude API wrapper everyone's routes use
- `frontend/lib/api.ts` — the shared API client every page uses
- `frontend/components/NavBar.tsx`, `frontend/app/layout.tsx` — shared UI shell

---

## 6. Deploying it live (so judges can open a real URL, not just localhost)

**Frontend → Vercel (free):**
1. Go to https://vercel.com, sign in with GitHub
2. "Add New Project" → import `ET-AI-Hack` → set **Root Directory** to `frontend`
3. Add environment variable `NEXT_PUBLIC_API_BASE_URL` = your backend's Railway URL (step below)
4. Deploy — you'll get a URL like `raksha-ai.vercel.app`

**Backend → Railway (free tier, ~$5 credit) or Render:**
1. Go to https://railway.app, sign in with GitHub
2. "New Project" → "Deploy from GitHub repo" → select `ET-AI-Hack` → set **Root Directory** to `backend`
3. Add environment variable `GEMINI_API_KEY` = your key, and `FRONTEND_ORIGIN` = your Vercel URL
4. Railway auto-detects the Dockerfile and deploys — you'll get a URL like `raksha-backend.up.railway.app`
5. Go back to Vercel and update `NEXT_PUBLIC_API_BASE_URL` to that Railway URL, redeploy

Do this deployment step early (Day 1-2), not the night before — most hackathon demo-day
disasters are deployment surprises, not code bugs.

---

## 7. Stretch goals (only if core 5 modules are solid and you have time left)

In priority order — each is optional, the prototype fully works without them:
1. **Real DRISHTI map** — free Mapbox token, swap the table view for `react-map-gl`
2. **Real JAAL graph DB** — free Neo4j AuraDB tier, replace the seeded generator with real queries
3. **BRAHMA orchestrator** — a `/api/brahma/escalate` endpoint that calls SENTINEL then JAAL then DRISHTI
   in sequence to show cross-module intelligence fusion live (Section 5.4 "Scenario 1" in your plan)
4. **SMS alerts** — Authkey.io or Twilio free trial, wire into `kavach.py`'s `/sms/alert` endpoint
5. Everything else in the original plan (blockchain evidence, federated learning, GNN training,
   custom-trained CV models) — **skip these**. They need weeks, not days, and won't move the
   judging score as much as a rock-solid, bug-free demo of the 5 core modules will.

---

## 8. If something breaks

- **Backend won't start / "GEMINI_API_KEY not set"** → you forgot step 4's `.env` file, or
  didn't paste the key in
- **"404 NOT_FOUND ... model is no longer available"** → Google renamed/retired the model ID.
  Run this to see what your key can actually use, then update `GEMINI_MODEL` in `backend/.env`:
  ```bash
  cd backend
  source venv/bin/activate
  python scripts/list_models.py
  ```
- **Frontend loads but shows network errors** → make sure the backend terminal is still running,
  and `frontend/.env.local` points at the right URL
- **"command not found: python3" on Windows** → try `python` instead of `python3`
- Anything else: paste the exact error message into Claude (in a new chat, or ask your
  teammate running Claude Code) — it can diagnose almost any error message instantly.
