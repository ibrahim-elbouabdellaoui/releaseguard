# ReleaseGuard — Architecture & Implementation Plan

## Top-Level Overview

**Goal:** Build a demonstrable AI-assisted release-readiness workflow tool for the IBM Bob 2.0 Hackathon.

**Scope:** A working prototype that takes a Git repository and a set of code changes (diff or commit range), runs parallel AI-powered analyses through IBM Bob 2.0, and produces a structured Release-Readiness Report with a go/no-go recommendation and remediation actions.

**Approach:** React + TypeScript frontend → Node.js/Express backend → IBM Bob 2.0 orchestration layer (Plan mode, Agent mode, parallel subagents, a reusable Skill) → Markdown/JSON report artifacts. A synthetic demo project supplies deterministic, judge-friendly input.

**Not a production system.** This is a 48-hour hackathon prototype optimised for demonstration clarity over production robustness.

---

## 1. The Exact Developer Problem

Before releasing a software change, developers must manually:
- Read a diff and understand what changed and why
- Identify which components, services, or APIs are affected
- Audit which tests cover the changed code and which do not
- Inspect whether any third-party or internal dependency was upgraded or changed
- Assess risk surface: breaking changes, data migration, security exposure
- Decide whether the change is actually safe to ship
- Write release notes and list any required pre/post-release actions

This process is slow, inconsistent, error-prone, and skipped under deadline pressure — leading to regressions, incidents, and rework.

---

## 2. Target User

A software developer or tech lead who is about to merge or release a branch and wants rapid, structured confidence that the change is safe to ship.

---

## 3. End-to-End ReleaseGuard Workflow

```
Developer provides: repo path + diff/commit range
          │
          ▼
    [Ingestion Layer]
    Extract diff, file list, commit messages, test inventory
          │
          ▼
    [Bob Plan Mode — Workflow Coordinator]
    Reads context, activates Release-Readiness Skill,
    dispatches parallel analysis subagents
          │
    ┌─────┴──────────────────────────┐
    │              │                 │                  │
    ▼              ▼                 ▼                  ▼
[Impact       [Test           [Dependency        [Risk
 Analyst]      Analyst]        Analyst]           Analyst]
 Bob Agent     Bob Agent       Bob Agent          Bob Agent
 subagent      subagent        subagent           subagent
    │              │                 │                  │
    └─────┬────────┴─────────────────┘──────────────────┘
          │
          ▼
    [Synthesis Agent — Bob Agent mode]
    Reads all four analysis reports, produces:
      - Go / No-Go decision
      - Risk score (Low / Medium / High / Critical)
      - Remediation actions (ordered, actionable)
      - Release notes draft
          │
          ▼
    [Release-Readiness Report]
    Structured JSON + rendered Markdown, stored as artifact
          │
          ▼
    [Frontend UI]
    Displays report sections, diff viewer, remediation checklist
```

---

## 4. MVP Scope

The following capabilities must work end-to-end for the demo:

- Accept a pre-configured diff from the demo project (no live Git clone required for demo)
- Run the full 4-analyst + synthesis pipeline via Bob
- Produce a Release-Readiness Report (JSON + Markdown)
- Render the report in a React UI with tabbed sections
- Show a Go/No-Go badge, risk score, and remediation checklist
- Demonstrate parallel subagent execution (even if Bob serialises internally)
- Show the Release-Readiness Skill being invoked

---

## 5. Explicitly Excluded Features

- Real-time Git clone or live repository integration
- Authentication or multi-user sessions
- Persistent database or historical report storage
- CI/CD pipeline integration (webhooks, GitHub Actions)
- Support for non-JavaScript/TypeScript demo projects
- Automated test execution
- External dependency vulnerability scanning (SCA)
- Production deployment or containerisation

---

## 6. Recommended Repository Structure

```
releaseguard/
├── README.md
├── releaseguard-plan.md          ← this file
├── AGENTS.md                     ← Bob project-level rules
│
├── demo-project/                 ← synthetic app used as analysis target
│   ├── README.md
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── changes/
│       ├── change-001.diff       ← pre-baked diff for demo
│       └── change-001-meta.json  ← commit message, author, date
│
├── backend/                      ← Node.js + Express
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── analyze.ts        ← POST /api/analyze endpoint
│   │   ├── services/
│   │   │   ├── diffParser.ts     ← parse diff into structured context
│   │   │   ├── contextBuilder.ts ← build Bob prompt context
│   │   │   └── reportStore.ts    ← write/read JSON artifacts
│   │   └── types/
│   │       └── report.ts         ← Report TypeScript types
│   ├── reports/                  ← generated JSON artifacts
│   └── package.json
│
├── frontend/                     ← React + TypeScript (Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AnalysisPanel.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   ├── ReadinessVerdict.tsx
│   │   │   ├── RemediationChecklist.tsx
│   │   │   └── ReleaseNotes.tsx
│   │   ├── pages/
│   │   │   └── ReportPage.tsx
│   │   └── types/
│   │       └── report.ts         ← shared report types (copy or symlink)
│   └── package.json
│
└── .bob/
    └── skills/
        └── release-readiness.md  ← Bob Skill definition
```

---

## 7. Frontend Responsibilities

- Single-page React app with a fixed report layout
- Accepts a report JSON (fetched from backend or imported directly from `/reports/`)
- Renders:
  - **Header:** change title, author, date, Go/No-Go badge, risk level
  - **Change Summary tab:** high-level description, changed files list
  - **Impact Analysis tab:** affected components, blast radius, breaking changes
  - **Test Analysis tab:** covered tests, missing coverage, test gaps table
  - **Dependency Analysis tab:** changed dependencies, compatibility notes
  - **Risk Analysis tab:** risk items, severity, likelihood
  - **Remediation tab:** ordered checklist of required actions before release
  - **Release Notes tab:** draft release notes (Markdown rendered)
- Simple diff viewer (syntax-highlighted, read-only)
- No user-editable fields required for demo
- Styling: clean, professional (Tailwind CSS or simple CSS modules)

The frontend does **not** invoke Bob directly. It consumes pre-generated report JSON.

---

## 8. Backend Responsibilities

The backend is deliberately thin:

- `POST /api/analyze` — receives a change identifier, reads the corresponding diff + metadata from `demo-project/changes/`, builds a structured context object, and writes it to a file for Bob to consume.
- `GET /api/report/:id` — serves the generated JSON report artifact from `backend/reports/`.
- `GET /api/changes` — lists available demo changes.
- Does **not** call Bob directly. Bob is run as a separate interactive process during the demo.
- Diff parser: splits unified diff into per-file chunks with added/removed line counts.
- Context builder: assembles the diff, test inventory, dependency manifest, and commit metadata into a single JSON context file that Bob's Skill prompts can reference via `@context`.

The backend is **not** responsible for orchestrating Bob. Bob orchestration happens in Bob's own session using the Skill + subagents pattern.

---

## 9. Demo-Project Responsibilities

The synthetic demo project must be realistic enough to produce interesting analysis output. It must contain:

- A small but credible Node.js/TypeScript application (3–5 modules: API handler, service layer, utility functions)
- A `package.json` with real but minimal dependencies (e.g., express, axios, a validation library)
- A `tests/` directory with partial test coverage (deliberately leaving some paths untested — to make the test gap analysis interesting)
- A pre-baked diff (`change-001.diff`) that:
  - Modifies a service function in a way that affects an API response contract (good for impact analysis)
  - Upgrades one dependency (good for dependency analysis)
  - Has no test covering the changed code path (good for test gap analysis)
  - Introduces one mild risk (e.g., removes an error handler) (good for risk analysis)
- A `change-001-meta.json` with commit message, author, timestamp, and PR description

This gives each of the four analyst subagents something substantive to find, making the demo compelling.

---

## 10. Release-Readiness Report Structure

The report is a single JSON file (`reports/report-<id>.json`) with this shape:

```json
{
  "id": "change-001",
  "generatedAt": "<ISO timestamp>",
  "change": {
    "title": "...",
    "author": "...",
    "date": "...",
    "description": "...",
    "filesChanged": ["..."],
    "linesAdded": 0,
    "linesRemoved": 0
  },
  "verdict": {
    "decision": "NO-GO | GO-WITH-ACTIONS | GO",
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "summary": "..."
  },
  "analyses": {
    "impact": {
      "affectedComponents": ["..."],
      "blastRadius": "...",
      "breakingChanges": ["..."],
      "notes": "..."
    },
    "tests": {
      "coveredPaths": ["..."],
      "uncoveredPaths": ["..."],
      "gapSummary": "...",
      "recommendation": "..."
    },
    "dependencies": {
      "changed": ["..."],
      "regressionRisk": "...",
      "notes": "..."
    },
    "risks": [
      {
        "description": "...",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "likelihood": "LOW | MEDIUM | HIGH",
        "mitigationSuggestion": "..."
      }
    ]
  },
  "remediationActions": [
    {
      "priority": 1,
      "action": "...",
      "rationale": "..."
    }
  ],
  "releaseNotes": "... Markdown string ..."
}
```

---

## 11. The Release-Readiness Skill

**File:** `.bob/skills/release-readiness.md`

**Purpose:** A reusable, invocable Bob Skill that encodes the full ReleaseGuard analysis workflow. When activated, it instructs Bob on how to systematically orchestrate the release-readiness pipeline.

**Design principles:**
- The Skill provides structured, step-by-step instructions that Bob follows each time it runs a release-readiness analysis
- It defines the four analyst roles with explicit scope boundaries
- It defines the synthesis step with explicit output schema
- It references the JSON context file produced by the backend
- It avoids repeating instructions that Bob already knows (no generic prompting)

**Skill content outline:**

```
---
name: release-readiness
description: >
  Orchestrates a full release-readiness analysis for a code change.
  Dispatches four specialist subagents in parallel, then synthesises
  their findings into a structured Release-Readiness Report.
---

## When to activate
When the user wants to assess whether a code change is ready for release.

## Prerequisites
A context file at backend/context/<change-id>.json must exist (produced by POST /api/analyze).

## Workflow

### Step 1 — Load context
Read backend/context/<change-id>.json. Extract: diff, test inventory, dependency manifest, commit metadata.

### Step 2 — Dispatch parallel analyst subagents
Spawn four independent subagents. Each receives the full context file and a scoped instruction set:

**Impact Analyst**
- Identify all source files touched by the diff
- For each changed file, identify callers/consumers in the codebase
- Flag any API contract changes (function signatures, return types, exported interfaces)
- Identify which components or services depend on changed modules
- Output: analyses.impact section of the report schema

**Test Analyst**
- Read tests/ directory; map test files to source modules
- For each changed source path, determine whether a test covers the changed logic
- Identify uncovered changed paths
- Assess whether existing tests are likely to catch the introduced change
- Output: analyses.tests section

**Dependency Analyst**
- Compare package.json before/after in the diff
- Identify added, removed, or version-bumped dependencies
- Note whether any bumped dependency has known breaking changes in its changelog
- Flag transitive risk if a core dependency changed
- Output: analyses.dependencies section

**Risk Analyst**
- Scan the diff for: removed error handlers, hardcoded values, commented-out security checks, TODOs, data mutations without validation, missing null checks
- Assess each risk item for severity and likelihood
- Output: analyses.risks array

### Step 3 — Synthesis (main agent, after all subagents complete)
- Read all four analysis outputs
- Determine verdict: GO / GO-WITH-ACTIONS / NO-GO using this rubric:
  - CRITICAL risk → NO-GO
  - HIGH risk with no mitigation + test gaps → NO-GO
  - Any HIGH risk or test gaps → GO-WITH-ACTIONS
  - LOW/MEDIUM risk, full coverage → GO
- Write ordered remediationActions (highest severity first)
- Draft releaseNotes in Markdown
- Write complete report JSON to backend/reports/report-<id>.json

### Step 4 — Confirm
Report the verdict and risk level to the user. List the top 3 remediation actions.
```

---

## 12. Work Delegated to Subagents

Each of the four analyst roles runs as an independent Bob subagent:

| Subagent | Scope | Input | Output |
|---|---|---|---|
| Impact Analyst | Changed files + cross-references | diff, full source tree | `analyses.impact` |
| Test Analyst | Test coverage mapping | diff, tests/ directory | `analyses.tests` |
| Dependency Analyst | package.json delta | diff (package.json section) | `analyses.dependencies` |
| Risk Analyst | Code smell / safety scan | diff | `analyses.risks` |
| Synthesis Agent | Decision + report assembly | all 4 analysis outputs | full report JSON |

The Synthesis Agent is **not** a subagent — it runs in the main Bob agent session after subagents complete, so it has access to accumulated context.

---

## 13. Analyses That Run in Parallel

The four analyst subagents are **fully independent** and can run in parallel:

- Impact Analyst reads: diff + source tree
- Test Analyst reads: diff + tests directory
- Dependency Analyst reads: diff only (package.json section)
- Risk Analyst reads: diff only

None of them depend on each other's output. Bob's `spawn_subagent` calls for all four can be issued in the same turn.

**Synthesis is sequential** — it runs only after all four subagents have returned results.

---

## 14. What Stays in the Main Bob Agent

- Activating the Release-Readiness Skill
- Reading and validating the context file
- Issuing all four `spawn_subagent` calls in parallel
- Waiting for subagent results
- Running the Synthesis step (verdict + remediation + release notes)
- Writing the final JSON report file
- Reporting the top-level verdict to the user

The main agent acts as the **workflow coordinator** and **synthesis engine**. It does not do deep code analysis itself — that is delegated.

---

## 15. Where Plan Mode Should Be Used

| Use case | Why Plan mode |
|---|---|
| Designing the context file schema before backend is built | Prevents rework; schema is shared contract between backend and Bob Skill |
| Designing the Release-Readiness Report JSON schema | All components depend on this shape; must be agreed before coding begins |
| Planning the demo-project's change-001 scenario | The diff must deliberately produce interesting output for all 4 analysts; needs upfront design |
| Reviewing the Release-Readiness Skill content | The Skill is a specification document; Plan mode is appropriate for reviewing and refining it |

---

## 16. Where Agent Mode Should Be Used

| Use case | Why Agent mode |
|---|---|
| Scaffolding the demo-project (src/, tests/, package.json) | Code generation with file writes |
| Implementing backend diff parser and context builder | Code with file system operations |
| Implementing the Express routes | Code with file writes |
| Implementing frontend React components | Code with file writes |
| Writing the final release-readiness.md Skill file | File creation with precise format requirements |
| Running the actual ReleaseGuard analysis on change-001 | Live orchestration with subagent spawning and report writing |

---

## 17. Where Bob Code Review Should Be Used

| Target | What to review |
|---|---|
| `diffParser.ts` | Correctness of unified diff parsing; edge cases |
| `contextBuilder.ts` | Completeness of context object — does it include everything the Skill needs? |
| `release-readiness.md` Skill | Prompt quality, role scope boundaries, output schema alignment |
| `report.ts` types | TypeScript type correctness and completeness vs. the JSON schema |
| The generated report JSON | Does the Synthesis Agent's output conform to the schema? Are verdicts justified? |

Code review is **high-value Bob use** here — reviewing the Skill and the generated report catches prompt engineering issues before the demo.

---

## 18. How AGENTS.md Helps

**File:** `AGENTS.md` at the repository root.

Purpose: Gives Bob persistent, project-level context so every session starts with correct assumptions. This avoids re-explaining the project in every conversation.

Recommended content:

```markdown
# ReleaseGuard — Project Context for Bob

## What this project is
ReleaseGuard is an AI-assisted release-readiness workflow tool.
It analyses a code diff and produces a structured Release-Readiness Report.

## Tech stack
- Frontend: React + TypeScript (Vite), in frontend/
- Backend: Node.js + Express + TypeScript, in backend/
- Demo project: synthetic Node.js app, in demo-project/
- Bob Skill: .bob/skills/release-readiness.md

## Key files
- releaseguard-plan.md — full architecture and implementation plan
- backend/src/types/report.ts — canonical report schema (source of truth)
- demo-project/changes/change-001.diff — the primary demo scenario
- backend/context/change-001.json — context file consumed by the Skill

## Bob operating rules
- Always read releaseguard-plan.md before starting any new task
- The report JSON schema in report.ts is the source of truth — do not deviate
- The Release-Readiness Skill must be activated before running any analysis
- Do not modify demo-project/changes/ — these are fixed demo inputs
- Keep backend routes thin — no business logic in route handlers
- Frontend consumes report JSON only — it does not call Bob
```

AGENTS.md saves BobCoins by eliminating context re-establishment at the start of each session.

---

## 19. Tasks to Do Manually (BobCoin Conservation)

These tasks do not benefit from Bob and should be done by hand:

| Task | Reason to do manually |
|---|---|
| `npm init` / `npm install` for frontend and backend | Trivial; no intellectual content |
| Vite scaffold (`npm create vite`) | One command; no analysis needed |
| Tailwind CSS or CSS module setup | Config file copy; no intelligence needed |
| Basic Express boilerplate (`app.ts`, `index.ts`) | Standard 15-line setup |
| TypeScript config (`tsconfig.json`) | Copy standard config; no project-specific logic |
| `package.json` scripts (dev, build, start) | Copy-paste; no analysis needed |
| Git commits and branching | No Bob value |
| Running `npm run dev` to verify server starts | Shell command; no Bob value |
| Creating folder structure | `mkdir` commands; no Bob value |
| Writing `.gitignore` | Standard template |
| Copying report types between frontend and backend | Simple file copy |

**Estimated BobCoin savings:** ~8–10 coins preserved by avoiding trivial tasks.

---

## 20. Recommended Sequence of Implementation Tasks

Tasks are ordered by dependency. Bob tasks are marked [BOB]. Manual tasks are marked [MANUAL].

### Phase 0 — Foundation (Manual)
1. [MANUAL] Create folder structure: `backend/src/`, `frontend/src/`, `demo-project/src/`, `demo-project/tests/`, `backend/reports/`, `backend/context/`, `.bob/skills/`
2. [MANUAL] Initialise `backend/package.json` with dependencies: express, typescript, ts-node, @types/express, @types/node
3. [MANUAL] Initialise `frontend/package.json` via Vite: `npm create vite@latest frontend -- --template react-ts`
4. [MANUAL] Write standard `tsconfig.json` for backend
5. [MANUAL] Write `AGENTS.md`

### Phase 1 — Schema Design (Bob — Plan mode)
6. [BOB] Design and finalise the context file JSON schema (`backend/context/<id>.json`)
7. [BOB] Review and finalise the report JSON schema (`backend/src/types/report.ts`)

### Phase 2 — Demo Project (Bob — Agent mode)
8. [BOB] Scaffold demo-project source (3–4 modules, tests, package.json)
9. [BOB] Write `change-001.diff` — a realistic diff that triggers all four analysts
10. [BOB] Write `change-001-meta.json`

### Phase 3 — Backend (Mix)
11. [MANUAL] Write Express boilerplate (`index.ts`, basic app setup)
12. [BOB] Implement `diffParser.ts`
13. [BOB] Implement `contextBuilder.ts`
14. [MANUAL] Write thin route handlers in `routes/analyze.ts` and `routes/report.ts`
15. [BOB] Code review `diffParser.ts` and `contextBuilder.ts`

### Phase 4 — Bob Skill (Bob — Plan then Agent mode)
16. [BOB] Write `.bob/skills/release-readiness.md` Skill file
17. [BOB] Review Skill for prompt quality and schema alignment

### Phase 5 — Run the Analysis (Bob — Agent mode, live demo run)
18. [BOB] Invoke the Release-Readiness Skill on `change-001`
19. [BOB] Review generated report JSON for schema conformance and decision quality

### Phase 6 — Frontend (Mix)
20. [MANUAL] Scaffold App.tsx, router, basic layout
21. [BOB] Implement `ReadinessVerdict.tsx` and `RemediationChecklist.tsx` components
22. [BOB] Implement `AnalysisPanel.tsx` tabbed display
23. [MANUAL] Wire API calls (`GET /api/report/:id`) and loading states
24. [MANUAL] Basic styling (Tailwind or CSS modules)

### Phase 7 — Integration & Polish (Mix)
25. [MANUAL] End-to-end smoke test: POST /api/analyze → Bob Skill → report JSON → frontend render
26. [BOB] Code review of frontend report rendering components
27. [MANUAL] Fix any rendering or type issues found
28. [MANUAL] Prepare demo script and screen layout

---

## 21. 48-Hour Execution Plan

### Hours 0–4: Foundation + Schemas
- Create folder structure (manual)
- Initialise packages (manual)
- Bob Plan mode: finalise context file schema and report JSON schema
- Write AGENTS.md (manual)

### Hours 4–8: Demo Project
- Bob Agent mode: scaffold demo-project source, tests, diff, metadata
- Review diff for coverage across all 4 analysis dimensions
- Verify demo project looks realistic

### Hours 8–14: Backend Core
- Manual: Express boilerplate
- Bob Agent mode: diffParser + contextBuilder
- Bob Code Review: both services
- Manual: route handlers

### Hours 14–18: Bob Skill
- Bob Plan mode: review Skill structure and prompt design
- Bob Agent mode: write release-readiness.md Skill
- Bob Code Review: Skill file
- Manual: place Skill file in .bob/skills/

### Hours 18–24: First Full Analysis Run
- Trigger the full pipeline on change-001
- Bob Agent mode: run Skill, spawn subagents, produce report
- Review report JSON — adjust Skill prompts if needed (one iteration)

### Hours 24–32: Frontend
- Manual: Vite scaffold, App.tsx, routing, API calls, styling
- Bob Agent mode: Verdict + Remediation + Analysis panel components
- Bob Code Review: rendering components

### Hours 32–38: Integration
- Wire frontend to backend
- Smoke test end-to-end
- Fix any type mismatches or rendering issues (manual)

### Hours 38–44: Polish & Rehearsal
- Refine report quality if needed (one more Skill run)
- Prepare 3-minute demo script
- Test demo flow end-to-end

### Hours 44–48: Buffer / Presentation Prep
- Slide deck or judge briefing notes
- Final smoke test
- Backup: have report JSON pre-loaded in case of live failure

---

## 22. Final 3-Minute Demo Scenario

**Framing (30s):** "Before ReleaseGuard, a developer had to manually read a diff, check test coverage, inspect dependency changes, and assess risk. That takes 30–60 minutes and is often skipped under deadline pressure."

**Step 1 — Trigger analysis (20s):** Show the change-001.diff in the UI or terminal. Click "Analyse Change" button. Backend receives the diff, builds context file.

**Step 2 — Bob orchestration (40s):** Switch to Bob session. Show the Release-Readiness Skill being activated. Show four subagent calls being dispatched in parallel. Narrate: "Bob is simultaneously running an Impact Analyst, Test Analyst, Dependency Analyst, and Risk Analyst — each focused on its specific question."

**Step 3 — Synthesis (20s):** Show the Synthesis step: "Bob is now reading all four analysis outputs and making the go/no-go decision."

**Step 4 — Report in UI (40s):** Switch to browser. Show the rendered report:
- **NO-GO badge** and HIGH risk level
- Click through Impact tab: "This change modifies the UserService response contract — 3 downstream consumers affected"
- Click through Test tab: "No test covers the modified getUser() path"
- Click through Risk tab: "Error handler removed from payment callback"
- Click Remediation tab: "3 actions required before release"

**Step 5 — Release Notes (10s):** Show the auto-generated Markdown release notes.

**Closing (20s):** "In under 2 minutes, ReleaseGuard surfaced a missing test, a broken error handler, and 3 affected consumers — work that would take a developer 45 minutes manually, if they did it at all. This is Bob 2.0 doing purposeful work."

---

## 23. Measurable Improvement Over Manual Workflow

| Dimension | Manual | ReleaseGuard |
|---|---|---|
| Time to complete release assessment | 30–60 minutes | 2–3 minutes |
| Consistency | Depends on developer experience | Same checklist every time |
| Test gap detection | Requires manual diff + test mapping | Automatic, explicit |
| Dependency risk identification | Usually skipped | Explicit, every run |
| Risk item discovery | Ad hoc | Structured scan |
| Release notes | Written from scratch | Auto-generated draft |
| Audit trail | None | Versioned JSON artifact |
| Missed risks | Common under deadline pressure | Systematically surfaced |

**Quantifiable claim for judges:** The demo shows 5 distinct issues found in under 2 minutes. A developer manually reviewing the same diff would require at minimum 30 minutes to produce equivalent coverage — and would likely miss the dependency regression risk entirely.

---

## Sub-Tasks

### Sub-Task 1 — Foundation & Schema Design
**Intent:** Establish the repository structure, package scaffolding, AGENTS.md, and the two shared data contracts (context schema + report schema) that everything else depends on.
**Expected Outcomes:** Folder structure exists; AGENTS.md written; `backend/src/types/report.ts` typed and reviewed; context JSON schema documented.
**Todo List:**
- [ ] Create all directory structure manually
- [ ] Initialise backend and frontend packages manually
- [ ] Write AGENTS.md
- [ ] Bob Plan mode: finalise context file schema
- [ ] Bob Agent mode: write `backend/src/types/report.ts`
- [ ] Bob Code Review: report types
**Relevant Context:** Section 6 (repo structure), Section 10 (report schema), Section 18 (AGENTS.md)
**Status:** [ ] pending

---

### Sub-Task 2 — Demo Project
**Intent:** Create a synthetic but realistic Node.js/TypeScript application with deliberate gaps that make all four analyst roles produce interesting findings.
**Expected Outcomes:** `demo-project/src/` has 3–4 modules; `demo-project/tests/` has partial coverage; `change-001.diff` is a realistic unified diff that: changes an API contract, upgrades a dependency, has a test gap, and introduces a mild risk.
**Todo List:**
- [ ] Bob Agent mode: scaffold demo-project source and tests
- [ ] Bob Agent mode: write change-001.diff and change-001-meta.json
- [ ] Review diff manually — confirm each analyst has something to find
**Relevant Context:** Section 9 (demo project responsibilities), Section 22 (demo scenario)
**Status:** [ ] pending

---

### Sub-Task 3 — Backend Services
**Intent:** Implement the thin backend layer that parses diffs and builds the context file for Bob.
**Expected Outcomes:** `POST /api/analyze` writes a context JSON file; `GET /api/report/:id` serves the report; `diffParser.ts` and `contextBuilder.ts` are tested and code-reviewed.
**Todo List:**
- [ ] Manual: Express boilerplate (index.ts, app setup)
- [ ] Bob Agent mode: implement diffParser.ts
- [ ] Bob Agent mode: implement contextBuilder.ts
- [ ] Manual: write thin route handlers
- [ ] Bob Code Review: diffParser.ts and contextBuilder.ts
**Relevant Context:** Section 8 (backend responsibilities), Section 6 (repo structure)
**Status:** [ ] pending

---

### Sub-Task 4 — Release-Readiness Skill
**Intent:** Write the Bob Skill that encodes the full analysis workflow, analyst role instructions, synthesis rubric, and output schema reference.
**Expected Outcomes:** `.bob/skills/release-readiness.md` exists; Skill can be activated in a Bob session; Skill prompts are reviewed for quality and schema alignment.
**Todo List:**
- [ ] Bob Plan mode: review Skill structure and role scope definitions
- [ ] Bob Agent mode: write release-readiness.md Skill file
- [ ] Bob Code Review: Skill file (prompt quality, schema alignment)
**Relevant Context:** Section 11 (Skill design), Section 12 (subagents), Section 13 (parallelism)
**Status:** [ ] pending

---

### Sub-Task 5 — First Full Analysis Run
**Intent:** Run the complete ReleaseGuard pipeline on change-001 for the first time. Produce the report JSON. Validate quality.
**Expected Outcomes:** `backend/reports/report-change-001.json` exists and conforms to schema; verdict is NO-GO or GO-WITH-ACTIONS with justified reasoning; all four analysis sections are populated.
**Todo List:**
- [ ] Ensure backend context file exists for change-001
- [ ] Bob Agent mode: activate Skill, dispatch subagents, run synthesis
- [ ] Bob Code Review: validate report JSON against schema and decision quality
- [ ] If output quality insufficient: adjust Skill prompts (one iteration)
**Relevant Context:** Section 11, Section 12, Section 13, Section 14
**Status:** [ ] pending

---

### Sub-Task 6 — Frontend
**Intent:** Build the React UI that renders the release-readiness report in a clear, demo-friendly layout.
**Expected Outcomes:** Report renders correctly with all tabs; Go/No-Go badge visible; Remediation checklist interactive; Release notes rendered as Markdown.
**Todo List:**
- [ ] Manual: Vite scaffold, App.tsx, basic layout, routing
- [ ] Bob Agent mode: ReadinessVerdict.tsx and RemediationChecklist.tsx
- [ ] Bob Agent mode: AnalysisPanel.tsx tabbed display
- [ ] Manual: API wiring (GET /api/report/:id), loading states, basic styling
- [ ] Bob Code Review: rendering components
**Relevant Context:** Section 7 (frontend responsibilities), Section 10 (report schema)
**Status:** [ ] pending

---

### Sub-Task 7 — Integration & Demo Prep
**Intent:** Connect all layers end-to-end, validate the full flow, and prepare the demo script.
**Expected Outcomes:** Clicking "Analyse" in the frontend triggers the backend, Bob produces the report, frontend renders it. Demo script is rehearsed and works reliably.
**Todo List:**
- [ ] Manual: end-to-end smoke test
- [ ] Manual: fix any type mismatches or integration issues
- [ ] Manual: prepare demo script per Section 22
- [ ] Manual: test demo flow 3x end-to-end
- [ ] Manual: prepare backup (pre-loaded report JSON)
**Relevant Context:** Section 22 (demo scenario), Section 23 (measurable improvement)
**Status:** [ ] pending
