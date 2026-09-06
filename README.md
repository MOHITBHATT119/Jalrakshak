# JalRakshak AI 

## Intelligent Drought & Groundwater Depletion Advisor for Saurashtra

> *"From Water Data to Intelligent Water Action."*

JalRakshak AI  is an agentic AI platform that converts water data into clear, evidence-based recommendations for farmers, communities, and water administrators in the Saurashtra region of Gujarat, India.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Architecture](#solution-architecture)
- [Tech Stack](#tech-stack)
- [Agent Architecture](#agent-architecture)
- [Frontend Pages](#frontend-pages)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [BAT Scripts (Windows)](#bat-scripts-windows)
- [Synthetic Data](#synthetic-data)
- [Security](#security)
- [User Modes](#user-modes)
- [Language Support](#language-support)
- [Demo Mode](#demo-mode)
- [Limitations](#limitations)
- [Future Scope](#future-scope)
- [Trust & Safety](#trust--safety)

---

## Problem Statement

Saurashtra experiences recurring drought conditions and groundwater depletion driven by agricultural over-extraction. Farmers and communities need timely, understandable, and evidence-based guidance on:

- Groundwater depletion trends
- Drought risk and early warning
- Water-efficient crop selection
- Groundwater recharge planning
- Water budget and demand management
- Community-level priority planning

---

## Solution Architecture

```
DATA → ANALYSIS → RISK DETECTION → PREDICTION → RECOMMENDATION → EXPLANATION → ACTION PLAN
```

```
React + TypeScript Frontend  (port 5173)
              ↓
FastAPI Backend — Python  (port 8001)
              ↓
     Agent Orchestrator
              ↓
┌──────────────────────────────────────────────┐
│ Groundwater Agent   │ Drought Agent           │
│ Crop Advisory Agent │ Recharge Agent          │
│ Water Health Agent  │ Water Budget Agent      │
│ Community Priority  │ Scenario / Impact Agent │
│ Action Planner      │ Water Copilot           │
└──────────────────────────────────────────────┘
              ↓
IBM Granite 4 H Small  (ibm/granite-4-h-small)
        via IBM watsonx.ai
              ↓
 Explanation · Recommendation · Action Plan
```

---

## Tech Stack

### IBM Technology

| Component      | Detail                                     |
|----------------|--------------------------------------------|
| AI Model       | IBM Granite 4 H Small (`ibm/granite-4-h-small`) |
| AI Platform    | IBM watsonx.ai                             |
| AI Endpoint    | `https://us-south.ml.cloud.ibm.com`        |
| Project ID     | `42804282-58f3-4a1f-b387-9e415c0c04ae`     |

**IBM Granite is responsible for:**
- Natural language explanations of water conditions
- Conversational Water Copilot interface
- Village water situation reports
- Structured water action plan generation
- Multilingual support (English + Gujarati)
- Agent reasoning and orchestration narrative

**Deterministic Python (no LLM):**
- Groundwater depth trend calculations
- Drought risk scoring
- Water Health Score (0–100, 5-component breakdown)
- Water budget analysis (supply vs. demand)
- Scenario / what-if simulation
- Community priority ranking

### Backend

| Library              | Version   | Purpose                      |
|----------------------|-----------|------------------------------|
| FastAPI              | 0.111.0   | REST API framework           |
| Uvicorn              | 0.30.1    | ASGI server                  |
| Pydantic             | 2.7.1     | Data validation & settings   |
| pydantic-settings    | 2.3.0     | `.env` config loading        |
| python-dotenv        | 1.0.1     | Environment variable loading |
| httpx                | 0.27.0    | Async HTTP (watsonx calls)   |
| pandas               | 2.2.2     | Data analysis                |
| numpy                | 1.26.4    | Numerical calculations       |
| pytest               | 8.2.2     | Test runner                  |
| pytest-asyncio       | 0.23.7    | Async test support           |

### Frontend

| Library          | Version  | Purpose                          |
|------------------|----------|----------------------------------|
| React            | 18.2     | UI framework                     |
| TypeScript       | 5.2      | Type safety                      |
| Vite             | 5.1      | Build tool & dev server          |
| React Router DOM | 6.21     | Client-side routing              |
| Recharts         | 2.10     | Charts (timeseries, radar, pie)  |
| Leaflet          | 1.9      | Interactive village maps         |
| react-leaflet    | 4.2      | React bindings for Leaflet       |
| Axios            | 1.6      | HTTP client                      |
| Framer Motion    | 13.1     | Animations & transitions         |
| lucide-react     | 1.39     | Icon library                     |

---

## Agent Architecture

| Agent | Role |
|---|---|
| **Groundwater Monitoring Agent** | Tracks depth, trend, and severity — `IMPROVING / STABLE / DECLINING / CRITICAL` |
| **Drought Early Warning Agent** | Multi-factor risk scoring — `LOW / MODERATE / HIGH / SEVERE` |
| **Crop Advisory Agent** | Water-efficient crop recommendations with drought-tolerance ratings |
| **Recharge Structure Agent** | Check dams, farm ponds, recharge wells by aquifer type and priority |
| **Water Health Score Agent** | Composite 0–100 score with 5-component breakdown |
| **Water Budget Agent** | Supply vs. demand balance analysis |
| **Community Priority Agent** | Village ranking by water urgency |
| **Scenario / Impact Agent** | Deterministic what-if simulation with parameter sliders |
| **Agent Orchestrator** | Routes requests, aggregates results, stores trace logs |
| **Water Copilot** | IBM Granite-powered conversational interface |
| **Action Planner** | Structured `TODAY / WEEK / MONTH / SEASON` action plan generator |

```
jalrakshak-ai/backend/app/agents/
├── groundwater_agent.py
├── drought_agent.py
├── water_health_agent.py
├── water_budget_agent.py
├── crop_agent.py
├── recharge_agent.py
├── community_agent.py
├── scenario_agent.py
└── orchestrator.py          ← also hosts Copilot, Action Planner, Report Generator
```

---

## Frontend Pages

| Page | File | Description |
|---|---|---|
| Landing | `LandingPage.tsx` | Hero page with feature overview and quick-start |
| Dashboard | `Dashboard.tsx` | Water health overview with summary charts |
| Hydro Atlas | `HydroAtlas.tsx` | Interactive Leaflet village map |
| Groundwater Explorer | `GroundwaterExplorer.tsx` | Depth timeseries with trend analysis |
| Drought Intelligence | `DroughtIntelligence.tsx` | Risk scoring with radar chart |
| Crop Advisor | `CropAdvisor.tsx` | Water-efficient crop recommendation table |
| Recharge Planner | `RechargePlanner.tsx` | Structure recommendations ranked by priority |
| Water Budget | `WaterBudget.tsx` | Supply vs. demand pie / bar charts |
| What-If Simulator | `WhatIfSimulator.tsx` | Interactive sliders + IBM Granite explanation |
| Community Priority | `CommunityPriority.tsx` | Village ranking table |
| Water Copilot | `WaterCopilot.tsx` | IBM Granite conversational AI interface |
| Reports | `Reports.tsx` | AI-generated village water situation reports |
| Data Trust | `DataTrust.tsx` | Data quality, lineage and AI transparency |
| Settings | `Settings.tsx` | Watsonx connection status and configuration |

```
jalrakshak-ai/frontend/src/pages/
├── LandingPage.tsx       ├── Dashboard.tsx
├── HydroAtlas.tsx        ├── GroundwaterExplorer.tsx
├── DroughtIntelligence.tsx  ├── CropAdvisor.tsx
├── RechargePlanner.tsx   ├── WaterBudget.tsx
├── WhatIfSimulator.tsx   ├── CommunityPriority.tsx
├── WaterCopilot.tsx      ├── Reports.tsx
├── DataTrust.tsx         └── Settings.tsx
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.
Interactive docs: **http://localhost:8001/docs**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | System health + Watsonx status |
| `GET`  | `/villages` | List all villages |
| `GET`  | `/villages/{id}` | Village details |
| `GET`  | `/villages/{id}/groundwater` | Groundwater trend analysis |
| `GET`  | `/villages/{id}/rainfall` | Rainfall data series |
| `GET`  | `/villages/{id}/risk` | Drought risk assessment |
| `GET`  | `/villages/{id}/water-health` | Water Health Score (0–100) |
| `GET`  | `/villages/{id}/water-budget` | Supply vs. demand water budget |
| `GET`  | `/villages/{id}/analysis` | Full analysis + agent trace |
| `GET`  | `/community-priority` | Village ranking by water urgency |
| `POST` | `/crop-advice` | Crop recommendations for a village/season |
| `POST` | `/recharge-advice` | Recharge structure recommendations |
| `POST` | `/scenario` | What-if simulation |
| `POST` | `/copilot` | Water Copilot (IBM Granite) |
| `POST` | `/reports` | Generate AI village water report |
| `POST` | `/action-plan` | Generate structured action plan |
| `GET`  | `/agent-trace/{id}` | Retrieve agent execution trace |

---

## Installation

### Prerequisites

- Python **3.10+**
- Node.js **18+** and npm

### Quick Start (Windows)

```bat
REM 1. First-time setup — creates .venv, installs dependencies, generates .env
setup_project.bat

REM 2. Add your IBM Cloud API key
notepad .env

REM 3. Start backend + frontend
start_project.bat
```

### Manual Setup

```bash
# ── Backend ──────────────────────────────────────────
cd jalrakshak-ai
py -m venv .venv
.venv\Scripts\pip install -r backend/requirements.txt

# ── Frontend ─────────────────────────────────────────
cd frontend
npm install
```

---

## Environment Variables

Copy `.env-example` to `.env` and fill in your IBM Cloud API key:

```dotenv
WATSONX_PROJECT_ID=42804282-58f3-4a1f-b387-9e415c0c04ae
WATSONX_API_KEY=<your_ibm_cloud_api_key>
WATSONX_AI_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-4-h-small
DEMO_MODE=false
```

> **Security note:** The API key lives only in `.env`, which is in `.gitignore`. It is never committed to git, never surfaced in frontend JavaScript, and never returned by any API endpoint.

---

## Running Locally

```bash
# Backend  →  http://localhost:8001
start_backend.bat
# OR
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001 --app-dir backend

# Frontend  →  http://localhost:5173
start_frontend.bat
# OR
cd frontend && npm run dev
```

---

## Docker Deployment

A `docker-compose.yml` is included for containerised deployment.

```bash
# Build and start both services
docker-compose up --build

# Backend  →  http://localhost:8001
# Frontend →  http://localhost:3000
```

Services defined in [`docker-compose.yml`](docker-compose.yml):

| Service    | Port | Dockerfile |
|------------|------|------------|
| `backend`  | 8001 | `backend/Dockerfile` |
| `frontend` | 3000 | `frontend/Dockerfile` |

The backend mounts `./data` and reads credentials from `.env` at runtime.

### IBM Cloud Code Engine (manual)

```bash
# Build and push backend image
ibmcloud ce build submit \
  --name jalrakshak-backend \
  --image <registry>/jalrakshak-backend

# Create Code Engine application
ibmcloud ce app create \
  --name jalrakshak-backend \
  --image <registry>/jalrakshak-backend \
  --port 8001 \
  --env-from-secret watsonx-secret
```

---

## Testing

```bash
cd backend
..\\.venv\Scripts\python.exe -m pytest tests/test_api.py -v
```

**33 tests** covering:

- All agents (groundwater, drought, health, budget, crops, recharge, scenario)
- All API endpoints (GET + POST)
- Security — no API key exposure in responses
- Demo mode fallback behaviour
- Invalid village IDs and missing inputs
- Error handling and status codes

---

## BAT Scripts (Windows)

| Script | Purpose |
|---|---|
| `setup_project.bat` | First-time setup: creates `.venv`, installs all dependencies, generates `.env` |
| `start_project.bat` | Launches backend + frontend in separate console windows |
| `start_backend.bat` | Starts FastAPI backend only (`http://localhost:8001`) |
| `start_frontend.bat` | Starts React / Vite frontend only (`http://localhost:5173`) |
| `stop_project.bat` | Stops both running services |
| `health_check.bat` | Runs a PASS/FAIL check on all components |

---

## Demo Mode

When `WATSONX_API_KEY` is absent or watsonx is unreachable, the application automatically enters **DEMO MODE**:

- All deterministic calculations (water health, drought risk, budget, etc.) run normally
- Natural language responses fall back to safe, pre-written text
- A visible `DEMO MODE` banner is displayed throughout the UI
- No claim is made that fallback text was generated by IBM Granite

Force demo mode at any time by setting `DEMO_MODE=true` in `.env`.

---

## Synthetic Data

All data in this application is **synthetic demonstration data**:

- **10 Saurashtra districts:** Rajkot, Junagadh, Amreli, Bhavnagar, Jamnagar, Porbandar, Surendranagar, Morbi, Gir Somnath, Devbhumi Dwarka
- Groundwater depth timeseries: 2019–2024
- Rainfall data with deficit calculations: 2019–2023
- Water demand by sector (agriculture, domestic, industrial)
- Recharge structure inventory per village
- 20 crops with water requirements and drought-tolerance ratings

> **Not official government measurements. Not real hydrogeological surveys.**

---

## Security

| Concern | Mitigation |
|---|---|
| API key storage | `.env` only — listed in `.gitignore`, never committed |
| Frontend exposure | API key is backend-only; never included in JS bundles |
| Logging | API key is never logged or returned in any response |
| Health endpoint | Returns `watsonx_configured: true/false` only |
| CORS | Restricted to `localhost:5173`, `localhost:3000`, `127.0.0.1:5173` |
| Input validation | All request bodies validated via Pydantic models |
| Browser storage | No secrets in HTML, localStorage, or sessionStorage |

---

## User Modes

| Mode | Target User | Features |
|---|---|---|
| **Farmer** | Individual farmers | Simple UI: current water situation, crop tips, next actions |
| **Community** | Gram Panchayat / water committees | Village health score, water budget, priority areas |
| **Administrator** | Water administrators | Regional overview, AI reports, agent trace, full data access |

---

## Language Support

- **English** — default interface language
- **ગુજરાતી (Gujarati)** — navigation labels and key terms
- Gujarati questions are understood and answered in the Water Copilot

---

## Limitations

1. All data is synthetic — not real government or field measurements
2. Water Health Score uses estimated component weights — not a peer-reviewed methodology
3. Scenario simulation uses linear approximations
4. Recharge structure recommendations require field survey and engineering validation before implementation
5. Crop recommendations require local agricultural expert validation
6. IBM Granite responses depend on API availability and model behaviour
7. Drought scoring uses proxy indicators, not official IMD methodology

---

## Future Scope

- Real-time data integration (IMD rainfall API, CGWB groundwater portal)
- Satellite imagery integration for crop health monitoring
- Mobile application for field data collection by farmers
- IoT sensor support for live groundwater level monitoring
- Full Hindi and Gujarati translation across all pages
- Official government API integration for verified measurements
- Historical drought validation against IMD district records
- Carbon footprint tracking for water conservation interventions

---

## Trust & Safety

JalRakshak AI  is a **decision-support tool**, not a replacement for:

- Agricultural experts and extension officers
- Hydrogeologists and groundwater specialists
- Civil and structural engineers
- Government water resource authorities

All outputs carry explicit confidence labels:

> *"AI-assisted recommendation. Local agricultural validation recommended."*

> *"Preliminary AI recommendation. Field survey and engineering validation required."*

---

*Built for IBM Hackathon — JalRakshak AI  — Saurashtra Water Intelligence*
