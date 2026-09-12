# JalRakshak AI

### Intelligent Drought & Groundwater Depletion Advisor for Saurashtra

> **From Water Data to Intelligent Water Action.**

JalRakshak AI is an **Agentic AI decision-support platform** that
converts groundwater, rainfall, agricultural and water-demand data into
clear, evidence-based recommendations for farmers, communities and water
administrators in Saurashtra, Gujarat, India.

------------------------------------------------------------------------

## Problem Statement

Saurashtra experiences recurring drought conditions and groundwater
depletion driven by agricultural over-extraction.

Farmers and communities need timely and understandable guidance on: -
Groundwater depletion trends - Drought risk and early warning -
Water-efficient crop selection - Groundwater recharge planning -
Seasonal water budgeting - Community-level water priorities

------------------------------------------------------------------------

## Solution

``` text
DATA
  ↓
ANALYSIS
  ↓
RISK DETECTION
  ↓
PREDICTION
  ↓
RECOMMENDATION
  ↓
EXPLANATION
  ↓
ACTION PLAN
```

The platform combines deterministic data analysis with specialized AI
agents and IBM Granite to provide explainable and actionable
water-management insights.

------------------------------------------------------------------------

## Key Features

### Water Intelligence

-   Groundwater level and trend analysis
-   Drought risk assessment
-   Water Health Score (0--100)
-   Seasonal water budgeting
-   Water deficit and surplus analysis
-   Rainfall and groundwater insights

### Agriculture

-   Water-efficient crop recommendations
-   Crop water-demand comparison
-   Drought-tolerance analysis
-   Water-saving farming practices
-   Crop switching guidance

### Recharge and Conservation

-   AI-assisted recharge planning
-   Check dam recommendations
-   Farm pond recommendations
-   Recharge well and recharge pit recommendations
-   Percolation tank and contour trench options
-   Intervention priority and impact analysis

### Decision Support

-   What-If Simulator
-   Community priority ranking
-   Smart water-risk alerts
-   Action plan generation
-   AI Water Copilot
-   Agent execution trace
-   AI-generated water reports
-   PDF report generation

------------------------------------------------------------------------

## Architecture

``` text
React + TypeScript Frontend
            ↓
Python + FastAPI Backend
            ↓
     Agent Orchestrator
            ↓
 ┌───────────────────────────────┐
 │ Groundwater Agent             │
 │ Drought Agent                 │
 │ Crop Advisory Agent           │
 │ Recharge Agent                │
 │ Water Health Agent            │
 │ Water Budget Agent            │
 │ Community Priority Agent      │
 │ Scenario / Impact Agent       │
 │ Action Planner                │
 │ Water Copilot                 │
 └───────────────────────────────┘
            ↓
    IBM Granite 4 H Small
            ↓
      IBM watsonx.ai
            ↓
Explanation • Recommendation • Action Plan
```

------------------------------------------------------------------------

## Agent Architecture

  -----------------------------------------------------------------------
  Agent                               Responsibility
  ----------------------------------- -----------------------------------
  **Groundwater Monitoring Agent**    Tracks groundwater depth, trend and
                                      severity

  **Drought Early Warning Agent**     Calculates multi-factor drought
                                      risk

  **Crop Advisory Agent**             Recommends water-efficient and
                                      drought-tolerant crops

  **Recharge Structure Agent**        Recommends suitable recharge
                                      interventions

  **Water Health Agent**              Calculates the composite Water
                                      Health Score

  **Water Budget Agent**              Analyzes supply versus demand

  **Community Priority Agent**        Ranks villages by water urgency

  **Scenario / Impact Agent**         Runs deterministic what-if
                                      simulations

  **Agent Orchestrator**              Routes requests and combines agent
                                      outputs

  **Water Copilot**                   Provides conversational AI
                                      assistance

  **Action Planner**                  Generates structured actions
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Technology Stack

### IBM Technology

-   **IBM Granite 4 H Small** --- `ibm/granite-4-h-small`
-   **IBM watsonx.ai** --- AI model integration
-   **IBM Cloud** --- deployment and infrastructure

### Backend

-   Python
-   FastAPI
-   Uvicorn
-   Pydantic
-   pydantic-settings
-   python-dotenv
-   HTTPX
-   Pandas
-   NumPy

### Frontend

-   React
-   TypeScript
-   Vite
-   React Router DOM
-   Recharts
-   Leaflet
-   React Leaflet
-   Axios
-   Framer Motion
-   Lucide React

### Database

-   **SQLite** --- stores structured village, groundwater, rainfall,
    crop, recharge and water-demand data.

------------------------------------------------------------------------

## Frontend Pages

  Page                   Purpose
  ---------------------- ---------------------------------------
  Landing                Product introduction
  Dashboard              Water health overview
  Hydro Atlas            Interactive village map
  Groundwater Explorer   Groundwater trend analysis
  Drought Intelligence   Drought risk analysis
  Crop Advisor           Water-efficient crop recommendations
  Recharge Planner       Recharge intervention recommendations
  Water Budget           Supply and demand analysis
  What-If Simulator      Scenario and impact simulation
  Community Priority     Village priority ranking
  Water Copilot          IBM Granite conversational assistant
  Reports                AI-generated water reports
  Data Trust             Data quality and transparency
  Settings               Application configuration

------------------------------------------------------------------------

## Backend APIs

All APIs are prefixed with:

``` text
/api/v1
```

Local API documentation:

``` text
http://localhost:8001/docs
```

  Method   Endpoint                        Description
  -------- ------------------------------- ----------------------------------
  GET      `/health`                       System health and Watsonx status
  GET      `/villages`                     List villages
  GET      `/villages/{id}`                Village details
  GET      `/villages/{id}/groundwater`    Groundwater trend
  GET      `/villages/{id}/rainfall`       Rainfall series
  GET      `/villages/{id}/risk`           Drought risk
  GET      `/villages/{id}/water-health`   Water Health Score
  GET      `/villages/{id}/water-budget`   Water budget
  GET      `/villages/{id}/analysis`       Full analysis and agent trace
  GET      `/community-priority`           Village priority ranking
  POST     `/crop-advice`                  Crop recommendations
  POST     `/recharge-advice`              Recharge recommendations
  POST     `/scenario`                     What-if simulation
  POST     `/copilot`                      IBM Granite Water Copilot
  POST     `/reports`                      Generate water report
  POST     `/action-plan`                  Generate action plan
  GET      `/agent-trace/{id}`             Agent execution trace

------------------------------------------------------------------------

## Project Structure

``` text
jalrakshak-ai/
│
├── backend/
├── frontend/
├── data/
│
├── .env-example
├── .gitignore
├── docker-compose.yml
├── fly.toml
├── render.yaml
├── README.md
├── START.md
├── PRESENTATION_OVERVIEW.md
└── EXECUTION_PLAN.md
```

------------------------------------------------------------------------

## Installation & Quick Start

Please refer to **[START.md](START.md)** for detailed step-by-step startup instructions for both backend and frontend.

### Prerequisites

-   Python 3.10+
-   Node.js 18+
-   npm

### Quick Start Summary

1. **Setup `.env`**:
   ```bash
   cp .env-example .env
   ```

2. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn main:app --port 8001 --reload
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Applications**:
   - Frontend: `http://localhost:5173`
   - Admin Login: `http://localhost:5173/admin/login` (`admin` / `admin@123`)
   - Backend API Docs: `http://localhost:8001/docs`

------------------------------------------------------------------------

## Docker Deployment

The project includes `docker-compose.yml`.

``` bash
docker-compose up --build
```

Expected services:

``` text
Backend  → 8001
Frontend → 3000
```

For cloud deployment, configure IBM watsonx credentials as secure
environment variables or secrets.

------------------------------------------------------------------------

## AI and Data Processing

### IBM Granite

IBM Granite 4 H Small is used for: - Natural-language explanations -
Water Copilot responses - Recommendations - Action-plan generation -
Village water reports - Multilingual responses

### Deterministic Analytics

Critical numerical calculations are performed by application code:

-   Groundwater trend
-   Drought risk score
-   Water Health Score
-   Water budget
-   Scenario simulation
-   Community priority ranking

This keeps critical calculations consistent and avoids relying on an LLM
for arithmetic.

------------------------------------------------------------------------

## AI Response Structure

Important recommendations follow:

``` text
WHAT
WHY
DATA USED
CONFIDENCE
NEXT ACTION
LIMITATIONS
```

------------------------------------------------------------------------

## User Modes

  -----------------------------------------------------------------------
  Mode                    Target User             Purpose
  ----------------------- ----------------------- -----------------------
  **Farmer**              Individual farmers      Water situation, crop
                                                  advice and next actions

  **Community**           Gram Panchayat / water  Village health, budget
                          committees              and priority planning

  **Administrator**       Water administrators    Regional intelligence,
                                                  alerts and decision
                                                  support
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Language Support

-   English
-   Gujarati

The application supports Gujarati navigation, key terminology and Water
Copilot interaction.

------------------------------------------------------------------------

## Demo Mode

When IBM watsonx is unavailable, the application can operate in Demo
Mode.

Demo Mode provides: - Deterministic water calculations - Safe fallback
responses - Visible Demo Mode indication - No false claim that fallback
text was generated by IBM Granite

Enable manually:

``` dotenv
DEMO_MODE=true
```

------------------------------------------------------------------------

## Testing

``` bash
cd backend
..\.venv\Scripts\python.exe -m pytest tests/test_api.py -v
```

Tests cover: - Agent functionality - API endpoints - Input validation -
Error handling - Demo mode - Security checks

------------------------------------------------------------------------

## Data and Limitations

The current application uses **synthetic demonstration data** for the
prototype, including village, groundwater, rainfall, crop, water-demand
and recharge information.

> **Important:** Synthetic demonstration values are not official
> government measurements and are not a replacement for field surveys or
> verified hydrogeological data.

### Limitations

1.  Demonstration data is synthetic.
2.  Water Health Score uses prototype-defined component weights.
3.  Scenario simulation uses simplified assumptions.
4.  Recharge recommendations require engineering and field validation.
5.  Crop recommendations require agricultural expert validation.
6.  AI output depends on model and API availability.
7.  Drought scoring is a prototype decision-support indicator and is not
    an official IMD methodology.

------------------------------------------------------------------------

## Future Scope

-   Real-time IMD rainfall integration
-   Official CGWB groundwater data integration
-   Satellite imagery for crop-health monitoring
-   IoT sensors for groundwater and soil-moisture monitoring
-   Mobile application for field data collection
-   Full Gujarati and Hindi voice interaction
-   Verified government API integration
-   Advanced GIS and recharge-site planning
-   Expansion to other drought-prone regions

------------------------------------------------------------------------

## Security

-   API keys are stored in `.env`
-   `.env` is excluded through `.gitignore`
-   Secrets are not exposed to the frontend
-   API keys are not returned through application endpoints
-   Request data is validated
-   Cloud deployment should use secure secret/environment-variable
    configuration

**Never upload your real API key to GitHub.**

------------------------------------------------------------------------

## Trust and Safety

JalRakshak AI is a **decision-support system**, not a replacement for
professional expertise.

Recommendations should be reviewed by: - Agricultural experts -
Hydrogeologists - Groundwater specialists - Civil/structural engineers -
Government water-resource authorities

> **AI-assisted recommendation. Local agricultural validation
> recommended.**

> **Preliminary AI recommendation. Field survey and engineering
> validation required.**

------------------------------------------------------------------------

## Project Information

**Project:** JalRakshak AI\
**Domain:** Drought & Water Management\
**Region:** Saurashtra, Gujarat, India\
**AI:** IBM Granite 4 H Small\
**AI Platform:** IBM watsonx.ai\
**Cloud:** IBM Cloud\
**Architecture:** Agentic AI / Multi-Agent System\
**Backend:** Python + FastAPI\
**Frontend:** React + TypeScript\
**Database:** SQLite

------------------------------------------------------------------------
