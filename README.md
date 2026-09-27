# ReleaseGuard

**AI-assisted release readiness — powered by IBM Bob 2.0**

ReleaseGuard analyses a code diff and produces a structured Release-Readiness Report with a Go/No-Go verdict, risk level, and ordered remediation actions. Built for the IBM Bob 2.0 Hackathon.

---

## Quick Demo

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev
# → http://localhost:3001

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

1. Open **http://localhost:5173**
2. Select **change-001** from the left panel
3. Click **Run ReleaseGuard Analysis**
4. Observe the six-stage analysis workflow presented by the dashboard
5. View the **NO-GO / CRITICAL** verdict
6. Inspect the four analysis tabs: **Risks · Impact · Tests · Dependencies**
7. Review the 6 ordered remediation actions
8. Read the generated release notes

Expected: Decision **NO-GO**, Risk Level **CRITICAL** — payment error handler removed.

---

## The Problem

Before releasing a software change, developers must manually:

- Read a diff and understand what changed
- Identify which components and services are affected
- Audit test coverage for changed paths
- Check whether dependencies were upgraded or changed
- Assess risk: breaking changes, removed error handlers, security exposure
- Write release notes and list pre-release actions

This process is time-consuming and inconsistent, and under deadline pressure some review steps may be skipped, increasing the risk of regressions.

---



## The ReleaseGuard Workflow

```
Developer provides: repo path + diff
        │
        ▼
[Backend — POST /api/analyze]
Parse diff → build structured context JSON
        │
        ▼
[IBM Bob 2.0 — Release-Readiness Skill]
Dispatch four specialist subagents in parallel:
Impact · Test · Dependency · Risk
        │
        ▼
[Synthesis — main Bob session]
Release verdict + remediation actions + release notes
        │
        ▼
[Report JSON]
backend/reports/report-change-001.json
        │
        ▼
[Frontend — React Dashboard]
Loads and presents the report

```

IBM Bob is the core analysis engine, not merely a coding assistant.
The Release-Readiness Skill defines the full pipeline. Four specialist subagents run in parallel.
The Synthesis step runs in the main Bob session after all results are collected.

---

## The Role of IBM Bob

| Bob capability | How ReleaseGuard uses it |
|---|---|
| **Plan mode** | Workflow coordination, schema design, Skill review |
| **Agent mode** | Code generation, live analysis runs, report writing |
| **Subagents (parallel)** | Four independent analysts run concurrently |
| **Bob Skill** | Encodes the full analysis workflow as a reusable `.bob/skills/release-readiness/SKILL.md` |
| **Code Review** | Review of `diffParser.ts`, `contextBuilder.ts`, Skill prompts, generated reports |

---

## Architecture

```
releaseguard/
├── AGENTS.md                          ← Bob project context
├── releaseguard-plan.md               ← Full architecture plan
│
├── .bob/skills/release-readiness/     ← Bob Skill (analysis pipeline)
├── demo-project/                      ← Synthetic app used as analysis target
├── backend/                           ← Node.js + Express + TypeScript
└── frontend/                          ← React + TypeScript (Vite)
```

See [`releaseguard-plan.md`](releaseguard-plan.md) for the complete architecture and implementation sequence.

---

## Repository Structure

| Path | Purpose |
|---|---|
| `AGENTS.md` | Bob project context — read at the start of every Bob session |
| `releaseguard-plan.md` | Full architecture, schemas, and implementation sequence |
| `.bob/skills/release-readiness/SKILL.md` | Bob Skill — encodes the analysis workflow |
| `backend/src/types/report.ts` | Canonical report TypeScript types (source of truth) |
| `backend/src/services/diffParser.ts` | Unified diff → structured per-file chunks |
| `backend/src/services/contextBuilder.ts` | Assembles context JSON for the Bob Skill |
| `demo-project/changes/change-001.diff` | Pre-baked demo diff (fixed — do not modify) |
| `backend/context/` | Generated context JSON files (produced by POST /api/analyze) |
| `backend/reports/` | Generated report JSON artifacts (produced by the Bob Skill) |
| `docs/demo-script.md` | Step-by-step 2–3 minute hackathon demo script |

---

## Running the Backend

```bash
cd backend
npm install
npm run dev
```

The backend starts on `http://localhost:3001`.

**Health check:**
```bash
curl http://localhost:3001/api/health
# → {"status":"ok","service":"releaseguard-backend"}
```

**Trigger analysis:**
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"changeId": "change-001"}'
# → {"success":true,"changeId":"change-001","contextPath":"context/change-001.json"}
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` with API requests proxied to the backend at port 3001.

---

## Running the Analysis

After the backend is running and the context file has been built:

1. Open IBM Bob in Agent mode

2. Activate the `release-readiness` Skill with `/release-readiness`.
3. Bob reads `backend/context/change-001.json`, dispatches four subagents in parallel, synthesises findings, and writes the report to `backend/reports/report-change-001.json`
4. The frontend reads the report via `GET /api/report/change-001` and renders the tabbed view

---
 
## Demo Scenario

The demo uses a synthetic application (`demo-project/`) called "ShopFlow API". The pre-baked diff (`change-001.diff`) introduces:

- An **API response change** in `UserService.getUser()`, adding `lastLoginAt` and `orderCount`

- A **removed error handler** in `PaymentService.processPayment()` (unhandled rejection risk)

- A **dependency version bump** (`zod` 3.21.4 → 3.22.4)

- A **test coverage gap** around the modified `getUser()` and `processPayment()` paths

Expected verdict: **NO-GO** — Risk level: **CRITICAL**

---

## Running the Dashboard (End-to-End Demo)

1. Start the backend:
   ```bash
   cd backend && npm run dev
   ```
2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```
3. Open **http://localhost:5173** in a browser.
4. Select **change-001** from the left panel.
5. Click **Run ReleaseGuard Analysis**.
6. The dashboard calls `POST /api/analyze` (builds context), then `GET /api/report/change-001` (loads report).
7. Review the **NO-GO / CRITICAL** verdict, four analysis tabs, remediation checklist, and release notes.

---

## Status

| Component | Status |
|---|---|
| Project foundation | ✅ Complete |
| Demo project + diff | ✅ Complete |
| Backend (diffParser, contextBuilder, routes) | ✅ Complete |
| Bob Skill (release-readiness) | ✅ Complete |
| Analysis pipeline (4 parallel subagents) | ✅ Complete |
| Generated report (change-001) | ✅ Complete |
| Frontend dashboard | ✅ Complete |
| End-to-end demo | ✅ Complete |
