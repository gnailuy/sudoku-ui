# Agent Instructions

Start with `.aidoc/INDEX.md` and follow its task-specific reading chains.

- Work on a feature or fix branch; never commit directly to `master`.
- Keep repository code and documentation portable: never commit operator-specific absolute paths, private preview hostnames, or host IP addresses.
- Keep the Go Sudoku HTTP API authoritative for puzzle, session, revision, validation, notes, hints, and history state. Browser-only presentation state must not duplicate game state.
- Update `.aidoc/` whenever architecture, product behavior, deployment, or test coverage changes.
- At task start, classify documentation impact and name the canonical owning document. Before review, run `npm run test:docs` and a bounded semantic self-audit of the changed behavior and neighboring owners. Reserve fresh-context navigation audits for milestones, discovery changes, and cross-component boundaries; report all three evidence layers independently.
- Keep `scripts/validate_aidoc.py` generic and limited to frontmatter metadata. Do not make it interpret prose, mirror code structure, or require updates for ordinary code and documentation changes.
- Run `npm run format:check`, `npm run lint`, `npm test`, `npm run build`, and the applicable black-box `npm run test:e2e` scenarios before review.
- Add or update `.aidoc/designs/e2e-scenarios.md` for feature and bug-fix changes.
- Before changing a reported regression, encode the reporter’s exact preconditions, action order, input method, and timing seam as a failing black-box journey; do not insert waits inside a reported rapid interaction burst.
- Claim only the boundary actually proved: browser touch emulation is browser-level evidence, not physical-device verification. Assert both the visible result and the authoritative API action sequence.
- Preserve keyboard access, visible focus, responsive layout, reduced-motion behavior, and color-independent state cues.

## Readability Ratchet

- Run `python3 scripts/review_size.py` before editing and again after the work is complete.
- When the checker reports violations, inspect those in files you will touch and remove at least one nearby violation when the cleanup is safe and bounded. Do not count mechanical wrapping that makes the code harder to read as an improvement.
- Never introduce or worsen a reported metric. Keep opportunistic cleanup within the touched file or its immediate owner; keep dedicated cleanup changes small and behavior-preserving rather than coupling unrelated refactors to urgent work.
- If violations remain, report the before/after counts in the PR description, identify what was fixed, and explain why any applicable cleanup was not made. When the checker reports no violations, omit readability status from the PR description.
