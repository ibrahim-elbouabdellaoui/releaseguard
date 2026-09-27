---
name: release-readiness
description: >
  Use when the user wants to assess whether a code change is ready for release,
  run a ReleaseGuard analysis, or invoke the release-readiness pipeline on a demo change.
  Orchestrates four specialist subagents in parallel (Impact, Test, Dependency, Risk),
  then synthesises their findings into a structured Release-Readiness Report.
---

# Release-Readiness Analysis

This skill orchestrates a full ReleaseGuard release-readiness analysis.
Follow all steps exactly. Do not skip or reorder steps.

## When to activate

When the user says any of: "run the analysis", "assess this change", "is change-001 ready to release",
"run ReleaseGuard", "analyse the diff", or similar release-readiness intent.

---

## Prerequisites

1. Read `AGENTS.md` if not already done in this session.
2. A context file at `backend/context/<change-id>.json` must exist.
   - If it does not exist, instruct the user to run `POST /api/analyze` with the change ID first,
     or trigger it directly by reading the diff and building the context manually.
3. The canonical report schema is in `backend/src/types/report.ts`. Do not deviate from it.

---

## Step 1 — Load context

Read `backend/context/<change-id>.json`.

Extract and confirm the following fields are present:
- `changeId`
- `meta` (title, author, date, description)
- `diff` (raw unified diff string)
- `parsedDiff` (array of per-file chunks)
- `testInventory` (list of test file paths)
- `dependencyManifest` (before/after dependency versions)

If any field is missing, report the gap and do not proceed until it is resolved.

---

## Step 2 — Dispatch four analyst subagents in parallel

Spawn all four subagents **in the same turn** (parallel calls). Each subagent receives:
- The full context JSON content
- Its scoped instructions below

Do not serialise these calls. All four must be issued simultaneously.

### Impact Analyst instructions

```
You are the Impact Analyst for a ReleaseGuard release-readiness assessment.

Your input: the context JSON provided.

Your task:
1. Identify all source files touched by the diff (from parsedDiff[].filePath). These are the "changed files".
2. For each changed file, identify which other source files import or call it (callers/consumers).
   Look at the demo-project/src/ directory structure.
3. Flag any API contract changes: function signature changes, return type changes, exported interface changes.
4. Identify which components, services, or API handlers depend on the changed modules.
5. Assess the blast radius: report how many files are impacted BEYOND the changed files (i.e., consumers only).
   Do not count changed files themselves in the "beyond changed" total — report them separately.
6. For API shape changes, distinguish additive changes (new optional fields added — not breaking by REST conventions)
   from genuinely breaking changes (removed fields, renamed fields, changed types of existing fields).
   An additive change is not inherently breaking even if the developer labels it BREAKING in a comment.

Your output must be ONLY the JSON object for analyses.impact:
{
  "affectedComponents": ["list of all affected file/module names — include both changed files AND consumers"],
  "blastRadius": "N consumers affected beyond the M changed files: [list consumers]; brief note on whether each consumer actually uses the changed behaviour",
  "breakingChanges": ["list of specific breaking changes only — additive fields are not breaking; label speculative/comment-based concerns separately"],
  "notes": "any additional context about the impact"
}
```

### Test Analyst instructions

```
You are the Test Analyst for a ReleaseGuard release-readiness assessment.

Your input: the context JSON provided, specifically: parsedDiff and testInventory.

Your task:
1. For each changed source file path in parsedDiff, determine whether a test in testInventory covers it.
   Match test files to source modules by naming convention (e.g. tests/userService.test.js → src/services/userService.js).
2. Identify changed code paths (functions, branches) that have no corresponding test.
3. Assess whether existing tests are likely to catch the introduced changes.
4. Note any test that exists but does not cover the changed logic path.

Your output must be ONLY the JSON object for analyses.tests:
{
  "coveredPaths": ["source paths that have at least one test"],
  "uncoveredPaths": ["changed source paths with no test coverage"],
  "gapSummary": "brief description of the coverage gap",
  "recommendation": "what tests should be written before release"
}
```

### Dependency Analyst instructions

```
You are the Dependency Analyst for a ReleaseGuard release-readiness assessment.

Your input: the context JSON provided, specifically: diff and dependencyManifest.

Your task:
1. From the diff, identify any package.json changes: added, removed, or version-bumped packages.
2. Compare dependencyManifest.before and dependencyManifest.after for version changes.
3. For each version-bumped package, note whether the version change is major, minor, or patch.
4. Flag any bumped dependency that has known breaking changes in that version range.
   Use your training knowledge of common packages (axios, zod, express, etc.).
   IMPORTANT: when citing changelog details from training knowledge rather than an in-repo source,
   phrase your conclusions conservatively — use "reported to" or "based on training data" rather than
   stating changelog content as fact. Always recommend verifying against the official release notes.
5. Flag transitive risk if a core/widely-used dependency changed.

Your output must be ONLY the JSON object for analyses.dependencies:
{
  "changed": ["list of changed dependency strings, e.g. 'zod: ^3.21.4 → ^3.22.4'"],
  "regressionRisk": "LOW | MEDIUM | HIGH — with brief justification including whether this is a major/minor/patch bump",
  "notes": "specific notes on changelog risks or compatibility issues; hedge any claims based on training data"
}
```

### Risk Analyst instructions

```
You are the Risk Analyst for a ReleaseGuard release-readiness assessment.

Your input: the context JSON provided, specifically: diff.

Your task:
Scan the diff for the following risk patterns:
- Removed error handlers or try/catch blocks
- Hardcoded values (URLs, credentials, magic numbers) introduced
- Commented-out security or validation checks
- TODO/FIXME/HACK markers introduced
- Data mutations without validation
- Missing null checks on values that may be null
- Non-deterministic logic (e.g. Math.random() in business-critical paths)
- Any other code smell or safety issue visible in the diff

For each risk found, assess severity (LOW/MEDIUM/HIGH/CRITICAL) and likelihood (LOW/MEDIUM/HIGH).

Your output must be ONLY the JSON array for analyses.risks:
[
  {
    "description": "specific description of the risk",
    "severity": "LOW | MEDIUM | HIGH | CRITICAL",
    "likelihood": "LOW | MEDIUM | HIGH",
    "mitigationSuggestion": "specific, actionable mitigation step"
  }
]
```

---

## Step 3 — Synthesis (run in the main agent session after all subagents complete)

After receiving all four subagent outputs, synthesise the final report.

### 3a — Apply the verdict rubric

| Condition | Decision |
|---|---|
| Any CRITICAL risk present | NO-GO |
| HIGH risk with no mitigation AND test gaps present | NO-GO |
| Any HIGH risk OR any test gap present | GO-WITH-ACTIONS |
| LOW/MEDIUM risk only AND full test coverage | GO |

Determine riskLevel as the highest severity found across all risk items.

### 3b — Build remediationActions

Create an ordered list (highest priority = lowest number = must fix first).
Each action must reference a specific finding from the analysis.
Be concrete: "Add a try/catch around processPayment() in paymentService.js" not "Handle errors".

### 3c — Draft releaseNotes

Write a brief Markdown release notes section covering:
- What changed (from analyses.impact)
- Dependencies updated (from analyses.dependencies)
- Known issues or risks (from analyses.risks)
- Required pre-release actions (from remediationActions)

### 3d — Assemble the complete report JSON

Write the full report to `backend/reports/report-<change-id>.json` using this exact schema
(from `backend/src/types/report.ts`):

```json
{
  "id": "<change-id>",
  "generatedAt": "<ISO timestamp>",
  "change": {
    "title": "<from meta.title>",
    "author": "<from meta.author>",
    "date": "<from meta.date>",
    "description": "<from meta.description>",
    "filesChanged": ["<from parsedDiff[].filePath>"],
    "linesAdded": <sum of parsedDiff[].linesAdded>,
    "linesRemoved": <sum of parsedDiff[].linesRemoved>
  },
  "verdict": {
    "decision": "GO | GO-WITH-ACTIONS | NO-GO",
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "summary": "<one-sentence verdict summary>"
  },
  "analyses": {
    "impact": { "<Impact Analyst output>" },
    "tests": { "<Test Analyst output>" },
    "dependencies": { "<Dependency Analyst output>" },
    "risks": [ "<Risk Analyst output>" ]
  },
  "remediationActions": [
    { "priority": 1, "action": "...", "rationale": "..." }
  ],
  "releaseNotes": "... Markdown string ..."
}
```

---

## Step 4 — Confirm

Report to the user:
1. The verdict (GO / GO-WITH-ACTIONS / NO-GO) and risk level
2. The top 3 remediation actions
3. The path to the generated report JSON

Example:
```
✗ VERDICT: NO-GO — Risk level: HIGH

Top 3 remediation actions:
1. Restore error handler in paymentService.processPayment() — unhandled rejection risk
2. Add test for getUser() enriched response shape before merging
3. Verify zod 3.22.4 changelog for breaking changes in schema refinement API

Report written to: backend/reports/report-change-001.json
```
