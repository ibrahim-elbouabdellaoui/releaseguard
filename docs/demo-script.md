# ReleaseGuard — Demo Script

**IBM Bob 2.0 Hackathon · 2–3 minute live demo**

---

## Setup (before presenting)

```bash
# Terminal 1 — backend
cd backend && npm run dev
# Confirm: "ReleaseGuard backend listening on port 3001"

# Terminal 2 — frontend
cd frontend && npm run dev
# Confirm: "Local: http://localhost:5173/"
```

Open **http://localhost:5173** in a browser and confirm the dashboard loads.

---

## Step 1 — Introduce the problem (30 s)

> "Before merging a branch, developers need to answer five questions:
> Which components are affected? Is test coverage adequate? Were any dependencies changed?
> Are there safety or reliability risks? And is this safe to ship?
>
> This takes 30–60 minutes of manual review — if it happens at all.
> Under deadline pressure, some review steps may be skipped, increasing the risk of regressions.
>
> ReleaseGuard structures and accelerates that review using IBM Bob 2.0 as the AI analysis engine.

---

## Step 2 — Select change-001 (20 s)

> "We have a synthetic application called ShopFlow API — a Node.js e-commerce backend.
> A developer submitted a pull request: ticket SHOP-1042, branch `feature/enrich-user-profile`.
>
> The stated goal was to enrich the user profile response with additional metrics.
> But there are hidden problems in the diff that a quick code review would likely miss."

In the browser:
1. The left panel shows **change-001 — Enrich user profile response + bump zod dependency**.
2. Click the change to see the commit metadata (author, branch, description).

---

## Step 3 — Run ReleaseGuard (20 s)

> "The dashboard presents the ReleaseGuard analysis workflow."

1. Click **Run ReleaseGuard Analysis**.

2. The dashboard presents six workflow stages:
   - Parsing diff
   - Building context
   - Impact analysis
   - Test coverage analysis
   - Dependency analysis
   - Risk analysis

3. The report loads automatically.

> "Behind the scenes, the backend parses the diff into structured chunks and builds the analysis context.

> IBM Bob 2.0 runs the custom Release-Readiness Skill, which dispatches four specialist subagents in parallel: Impact, Test, Dependency, and Risk.

> The main Bob session then synthesises their findings into the structured release-readiness report displayed by this dashboard."

---

## Step 4 — Show the NO-GO / CRITICAL verdict (20 s)

> "The verdict: **NO-GO. Risk level: CRITICAL.**"

Point to the verdict badge at the top of the report.

> "The critical issue: a `try/catch` error handler was **removed** from `PaymentService.processPayment()`.

> A payment gateway failure can now propagate as an unhandled Promise rejection, which may terminate the process depending on the runtime's unhandled-rejection handling.
> This creates a critical production reliability risk."

---

## Step 5 — Walk through the four analysis dimensions (40 s)

Click through the four tabs:

**Risks tab** (start here):
> "Six risks identified and ranked. One CRITICAL, two HIGH, two MEDIUM, one LOW.
> Each has a description, severity, likelihood, and a concrete mitigation suggestion."

**Impact tab**:

> "Five components are involved: the three changed files plus two additional impacted components identified during impact analysis.

> `src/api/users.js` directly exposes the enriched `getUser()` response to HTTP clients.

> `src/services/orderService.js` calls `isUserActive()`, which internally uses `getUser()`, but currently only reads `user.active`.

> Bob therefore distinguishes the changed files from the additional components affected by the change."

**Tests tab**:
> "PaymentService has **zero test coverage**. The error handler removal was completely
> invisible to the test suite. UserService has tests, but they don't cover the new fields."

**Dependencies tab**:
> "One dependency bumped — zod, minor version. LOW regression risk.
> Bob hedges appropriately: it recommends verifying against the official changelog,
> noting this conclusion comes from training data rather than an in-repo source."

---

## Step 6 — Show remediation actions and release notes (20 s)

Scroll to the **Remediation** section:
> "Six ordered remediation actions. Priority 1: restore the catch block.
> Priority 2: replace Math.random() with real data sources.
> These are concrete, file-specific, actionable — not generic advice."

Scroll to **Release Notes**:
> "Draft release notes, ready to paste into a PR description or ticket.
> Includes the verdict, what changed, dependency updates, and all known risks."

---

## Step 7 — Explain how IBM Bob 2.0 was used (30 s)

> "In ReleaseGuard, IBM Bob 2.0 is used not only to build the application, but also to perform the release-readiness analysis.
>
> We used Bob in five distinct ways:
>
> 1. **Plan mode** — to design the architecture, schema, and workflow before writing a line of code.
> 2. **Agent mode** — to implement the backend services, frontend dashboard, and TypeScript types.
> 3. **Custom Bob Skill** — the Release-Readiness Skill at `.bob/skills/release-readiness/SKILL.md`
>    encodes the full analysis pipeline as a reusable, version-controlled workflow.
> 4. **Parallel subagents** — four specialist agents (Impact, Test, Dependency, Risk) are dispatched
>    simultaneously in the same Bob turn, demonstrating Bob's parallel orchestration capability.
> 5. **Iterative code review** — Bob reviewed `diffParser.ts`, `contextBuilder.ts`, Skill prompts,
>    and the generated report JSON for correctness and consistency across six development sessions.
>
> The browser dashboard does not call Bob directly — it serves a pre-generated report JSON.
> The Bob analysis is the step that *produces* the report, run by a developer activating the Skill."

---

## Expected Demo Outcome

| Field | Value |
|---|---|
| Change | change-001 — Enrich user profile response + bump zod dependency |
| Decision | **NO-GO** |
| Risk Level | **CRITICAL** |
| Risks found | 6 (1 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW) |
| Remediation actions | 6, priority-ordered |
| Blocking issue | `processPayment()` catch block removed — unhandled rejection risk |
