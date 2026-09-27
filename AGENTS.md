# ReleaseGuard — Project Context for IBM Bob

> **Read this file at the start of every Bob session.**
> It is the single source of project truth and replaces the need to re-explain the project.

---

## What ReleaseGuard Is

ReleaseGuard is an AI-assisted release-readiness workflow tool built for the IBM Bob 2.0 Hackathon.

It accepts a code diff from a demo project, orchestrates a parallel multi-analyst pipeline through IBM Bob 2.0, and produces a structured Release-Readiness Report with a Go/No-Go verdict, risk score, and ordered remediation actions.

**IBM Bob is not just a coding assistant here — Bob is the core analysis engine.**
Bob Plan mode coordinates the workflow. Bob subagents run the four specialist analyses in parallel. Bob Agent mode synthesises findings into the final report.

---

## Target User

A software developer or tech lead who is about to merge or release a branch and wants rapid, structured confidence that the change is safe to ship.

---

## Core ReleaseGuard Workflow

```
Developer provides: repo path + diff/commit range
      │
      ▼
[Backend — POST /api/analyze]
Extract diff, build context JSON → backend/context/<id>.json
      │
      ▼
[Bob — Activate Release-Readiness Skill]
Reads context file, dispatches parallel subagents
      │
  ┌───┴──────────────────────────────┐
  │          │           │           │
  ▼          ▼           ▼           ▼
Impact    Test       Dependency   Risk
Analyst   Analyst    Analyst      Analyst
(subagent)(subagent) (subagent)   (subagent)
  │          │           │           │
  └───┬──────┴───────────┴───────────┘
      │
      ▼
[Synthesis Agent — main Bob session]
Verdict + Remediation + Release Notes → backend/reports/report-<id>.json
      │
      ▼
[Frontend — React UI]
Renders tabbed report: verdict badge, risk score, remediation checklist
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, CSS Modules |
| Backend | Node.js + Express + TypeScript |
| Bob Skill | `.bob/skills/release-readiness.md` |
| Report format | JSON + Markdown |
| Demo project | Synthetic Node.js/TypeScript application |

No database. No authentication. No Docker. No cloud infrastructure.

---

## Repository Structure

```
releaseguard/
├── AGENTS.md                         ← this file (Bob project context)
├── README.md
├── releaseguard-plan.md              ← full architecture (source of truth)
│
├── .bob/
│   └── skills/
│       └── release-readiness.md     ← Bob Skill (analysis orchestration)
│
├── demo-project/                    ← synthetic app used as analysis target
│   ├── src/
│   │   ├── api/                     ← route handlers
│   │   ├── services/                ← business logic
│   │   └── utils/                   ← shared utilities
│   ├── tests/                       ← partial test coverage (deliberately incomplete)
│   ├── changes/
│   │   ├── change-001.diff          ← pre-baked diff for demo
│   │   └── change-001-meta.json     ← commit metadata
│   └── package.json
│
├── backend/                         ← Node.js + Express
│   ├── src/
│   │   ├── index.ts                 ← server entry point
│   │   ├── routes/
│   │   │   ├── analyze.ts           ← POST /api/analyze, GET /api/changes
│   │   │   └── report.ts            ← GET /api/report/:id
│   │   ├── services/
│   │   │   ├── diffParser.ts        ← parse unified diff into structured chunks
│   │   │   └── contextBuilder.ts    ← assemble context JSON for Bob
│   │   └── types/
│   │       └── report.ts            ← canonical TypeScript types (source of truth)
│   ├── context/                     ← generated context JSON files
│   ├── reports/                     ← generated report JSON artifacts
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                        ← React + TypeScript (Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── AnalysisPanel.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   ├── ReadinessVerdict.tsx
│   │   │   ├── RemediationChecklist.tsx
│   │   │   └── ReleaseNotes.tsx
│   │   ├── pages/
│   │   │   └── ReportPage.tsx
│   │   ├── services/
│   │   │   └── api.ts               ← API client (fetch wrappers)
│   │   └── types/
│   │       └── report.ts            ← copy of backend report types
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                            ← additional documentation
└── bob_sessions/                    ← Bob session notes and outputs
```

---

## Coding Conventions

- Use TypeScript everywhere. No `.js` files in `src/`.
- No `any` types. Use `unknown` and narrow appropriately.
- Prefer explicit return types on all exported functions.
- Use `const` by default; `let` only when reassignment is necessary.
- File names: `camelCase.ts` for modules, `PascalCase.tsx` for React components.
- No barrel (`index.ts`) re-exports unless the directory has 3+ exports.

---

## TypeScript Conventions

- `strict: true` in all `tsconfig.json` files.
- Interfaces for object shapes shared between layers. Types for unions and aliases.
- Enums are forbidden — use string literal unions instead (e.g., `"GO" | "NO-GO"`).
- Never use `as` casting unless interfacing with an untyped external boundary.
- The canonical report types live in `backend/src/types/report.ts`. The frontend copy at `frontend/src/types/report.ts` must stay in sync.

---

## React Conventions

- Functional components only. No class components.
- Props typed with an explicit `interface Props` or inline destructured type.
- No prop drilling beyond 2 levels — pass data via component composition.
- CSS Modules for all component styles (e.g., `Component.module.css`).
- No inline styles except for truly dynamic values.
- The frontend does **not** call Bob directly. It consumes report JSON served by the backend.

---

## Node.js / Express Conventions

- Route handlers must be thin: validate input, call a service, return response.
- No business logic in route handlers.
- Services in `backend/src/services/` perform all real work.
- Use `async/await` throughout. No raw Promise chains.
- All errors passed to `next(err)` for centralised error handling.

---

## API Conventions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check — returns `{ status: "ok" }` |
| `GET` | `/api/changes` | Lists available demo changes |
| `POST` | `/api/analyze` | Parses diff, writes context JSON |
| `GET` | `/api/report/:id` | Serves generated report JSON |

All responses are JSON. HTTP status codes follow REST conventions.
Error responses: `{ error: string, details?: string }`.

---

## Error Handling

- Backend: centralised error middleware in `src/index.ts`.
- Frontend: error state per async call; display a simple error message rather than crashing.
- Never swallow errors silently.

---

## Testing Expectations

- This is a hackathon prototype. Unit tests are not required for every file.
- The demo project's `tests/` directory exists to give Bob's Test Analyst something to analyse — it is **not** a real test suite.
- If writing a test, use the project's existing test framework.

---

## Security Expectations

- No authentication is implemented or required.
- No user-supplied data is executed or eval'd.
- Report JSON is read from `backend/reports/` by filename — validate the `id` parameter is alphanumeric to prevent path traversal.

---

## Synthetic / Demo Data Only

- `demo-project/` contains entirely synthetic, fictional code. No real company data.
- `demo-project/changes/change-001.diff` is a pre-baked, static diff. Do **not** modify it once written — it is the fixed demo input.
- `backend/context/` and `backend/reports/` contain generated files. They may be regenerated freely.

---

## IBM Bob Usage Rules

- **Always read `releaseguard-plan.md` before starting any new implementation task.**
- Activate the `release-readiness` Skill before running any release analysis.
- Use Plan mode for schema design and Skill review.
- Use Agent mode for code generation and live analysis runs.
- Use Code Review for `diffParser.ts`, `contextBuilder.ts`, Skill prompts, and generated report JSON.

---

## Bob Skills Rules

- The Release-Readiness Skill at `.bob/skills/release-readiness.md` is the analysis workflow specification.
- Do not modify the Skill during an analysis run. Only modify it between runs.
- The Skill defines the four analyst roles and synthesis rubric. Follow them exactly.

---

## Subagent Usage Rules

- The four analyst subagents (Impact, Test, Dependency, Risk) must be dispatched in parallel — all four `spawn_subagent` calls in the same turn.
- Subagents receive: the full context JSON + their scoped instruction set.
- Subagents output only their assigned `analyses.*` section of the report schema.
- The Synthesis step runs in the **main agent session**, not a subagent.
- Do not spawn subagents for tasks that can be done with 1–2 direct tool calls.

---

## Parallel Analysis Rules

- All four analyst subagents are fully independent and must run concurrently.
- Do not serialise the analyst subagents — that defeats the demonstration value.
- Synthesis is always sequential after all four subagent results are received.

---

## BobCoins Conservation Rules

- Budget: ~40 BobCoins for the entire hackathon.
- Do not repeat analysis that has already been done in the session.
- Do not spawn subagents for trivial tasks (file reads, simple edits).
- Do not ask Bob to do things that are faster done manually (npm install, mkdir, etc.).
- Prefer targeted edits over full-file rewrites.
- Avoid cosmetic refactors that do not affect functionality.

---

## Key Files — Always Treat as Project Context

| File | Role |
|---|---|
| `releaseguard-plan.md` | Full architecture and implementation sequence |
| `AGENTS.md` | This file — Bob project context |
| `backend/src/types/report.ts` | Canonical report schema — source of truth |
| `.bob/skills/release-readiness.md` | Bob Skill — analysis workflow |
| `demo-project/changes/change-001.diff` | Fixed demo input — do not modify |
| `backend/context/change-001.json` | Generated context consumed by the Skill |
| `backend/reports/report-change-001.json` | Generated report artifact |
