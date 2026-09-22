# JalRakshak AI — 5-Minute Admin Panel Demo Script

> Presenter running order with one-line talking points. Keep claims calibrated: rainfall rows tagged **live** are pulled live from IMD's mausam feed; groundwater rows are **estimated** CGWB/IMD district baselines mapped to villages. Do not call them "live government data" unless you have just run the sync and the gauges show live rows.

## Prerequisite (run before presenting)
1. Backend up: `uvicorn main:app --port 8001` (from `backend/`).
2. Frontend up: `npm run dev` (from `frontend/`).
3. Optional live sync for the "one-click sync" proof — log in as admin, open **Data Sources**, click the IMD rainfall sync. Live rainfall rows appear only while the mausam feed is reachable.

---

| # | Step | Talking point (≤10s each) |
|---|------|---------------------------|
| 1 | **Login** (`/admin/login`) | Split-screen login; on-screen demo creds **admin / admin@123**; bcrypt + rate-limited. |
| 2 | **Dashboard** | KPIs + village risk grid; DEMO badge only if WatsonX keys absent (they are present). |
| 3 | **Sidebar tour** | 7 sections · 22 routes; theme + EN/ગુ toggles; responsive collapse. |
| 4 | **Agent Trace → Run** | "8 deterministic agents execute with a live timeline of intermediate values — not a black box." |
| 5 | **Data Sources** | "One-click sync" → IMD rainfall rows after sync are tagged **live** (from mausam.imd.gov.in) while CGWB groundwater rows are tagged **estimated** (district baselines). Provenance follows every row. |
| 6 | **Data Sources → auth** | Clear token in DevTools → click any admin page → instant bounce to login; calling ingest without a token returns `403 Administrator privileges required`. |
| 7 | **Users** | Suspend a farmer → backend 403 on Farmer/Community Portal login. |
| 8 | **Reports page (Main portal)** | Generate a village report → **Download PDF** produces a real multi-page PDF (title, subtitle, footer disclaimer, page numbers), not a `.txt`. |
| 9 | **Approvals / Alerts** | Human-in-the-loop governance layer for AI recommendations. |
| 10 | **Logout** | Refresh token revoked server-side; sessionStorage cleared. |

---

## Wording guardrails
- Use **"calibrated from CGWB/IMD district baselines"** for report/plan provenance unless a live sync has just run and gauges show `live` rows.
- Only the **rainfall** feed can legitimately show `live` — call it "live IMD rainfall" or just "the current month's real district rainfall".
- Groundwater/CGWB data is always **estimated** (baseline assessments) — say "estimated", never "live".
- The main report download is now a **real PDF** — you may call it a "PDF report".