# ShopFlow API — Synthetic Demo Project

> **This is a synthetic application. All data is fictional.**
> It exists solely as a demo target for ReleaseGuard analysis.

## Structure

```
demo-project/
├── src/
│   ├── api/          — Express route handlers (users.js, orders.js)
│   ├── services/     — Business logic (userService.js, orderService.js, paymentService.js)
│   └── utils/        — Shared utilities (validation.js)
├── tests/            — Partial test coverage (deliberately incomplete)
└── changes/
    ├── change-001.diff          — Pre-baked unified diff for demo analysis
    └── change-001-meta.json     — Commit metadata
```

## What change-001 contains

`change-001.diff` makes three changes designed to give each ReleaseGuard analyst something to find:

| Analyst | What it finds |
|---|---|
| **Impact Analyst** | `UserService.getUser()` response shape changed (breaking) — `paymentService.js` and `/users` API handler are consumers |
| **Test Analyst** | No test covers the modified `getUser()` enrichment path; `paymentService.js` has no test coverage at all |
| **Dependency Analyst** | `zod` bumped from 3.21.4 → 3.22.4 (minor version bump with potential breaking changes in schema refinement API) |
| **Risk Analyst** | Error handler removed from `paymentService.processPayment()` — unhandled payment failures will crash the Node process |

## Do not modify `changes/`

The files in `changes/` are the fixed demo inputs for ReleaseGuard. They are the source of truth for the demo scenario.
