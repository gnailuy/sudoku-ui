---
domain: Architecture
status: Active
entry_points:
  - src/App.tsx
  - src/api/client.ts
dependencies:
  - .aidoc/designs/game-experience.md
  - .aidoc/workflows/test-deployment.md
---

# Web Client Architecture

The React client presents Sudoku sessions owned by the Go HTTP API. A strict ownership boundary prevents stale browser logic from disagreeing with authoritative revisions, validation, or recovery.

## Related Docs

| Document                                           | Relationship                               |
| -------------------------------------------------- | ------------------------------------------ |
| [Game experience](../designs/game-experience.md)   | Presentation intent built on this boundary |
| [Test deployment](../workflows/test-deployment.md) | Same-origin production topology            |
| [E2E scenarios](../designs/e2e-scenarios.md)       | Boundary acceptance coverage               |

## Why the Boundary Exists

The Go engine already defines valid actions, optimistic revisions, hints, history, candidates, and durable recovery. Reimplementing those rules in React would create two game engines and make refresh, concurrency, and backend upgrades unsafe.

The browser owns only presentation concerns such as selection, keyboard focus, pause visibility, elapsed-time display, theme, and preferences. The level picker remains a preferred request, while every active-game label and persisted timer presentation uses `session.actual_difficulty` from the API. The API snapshot owns the cumulative confirmed mistake count, so refresh and recovery cannot disagree with the game session. Theme preference is persisted as `system`, `light`, or `dark`; System follows `prefers-color-scheme` changes, while the resolved theme selects one complete semantic token set for every surface and gameplay state. Automatic candidates are an opt-in browser display preference over authoritative `snapshot.candidates`; enabling or disabling the preview never creates a mutation or derives candidates locally. A first digit edit while Notes and Candidates are both active submits one backend `adopt-candidates-as-notes` action, then returns the browser to manual-note display after success. A small local active-game record stores the opaque API session ID and timer presentation state so refresh can request the authoritative snapshot again; it never stores puzzle values or history.

## What the Client Contains

`SudokuApiClient` is the narrow transport boundary. Its request and response types mirror the canonical OpenAPI 3.1.1 contract in `gnailuy/sudoku/api/openapi.yaml`; transport failures become `SudokuApiError` values rather than leaking fetch details through the component tree.

`App` is the composition root for cohesive welcome, loading, board, controls, completion, and confirmation presentations under `src/components/`. Focused controllers in `src/hooks/` own API session lifecycle, presentation time, and board input/navigation; shared browser-only records and formatting live in `src/presentation.ts`. These boundaries separate presentation responsibilities without introducing an independent game model.

Vitest component tests exercise each extracted presentation boundary through accessible roles, labels, state, and callbacks. Hook tests exercise session recovery and retry behavior, timing, keyboard routing, selection, and API-authoritative mutation decisions. CI measures every component, hook, and shared presentation helper independently and requires each file to retain at least 80% line, statement, and function coverage and 70% branch coverage. Black-box Playwright scenarios remain the authority for integrated browser behavior, responsive geometry, and backend interaction.

`useSessionLifecycle` is the only presentation controller that creates, restores, or mutates API sessions. It serializes user intents through one ordered pipeline, sends each action with the latest confirmed revision, and replaces the confirmed snapshot only with that action's response. Value entry and erase receive a temporary cell-local projection while queued; the projection is explicitly marked as checking and never predicts validity, candidates, peer cleanup, or history. Each authoritative response removes only its corresponding projection, so a later queued result cannot overwrite an earlier result. A conflict reloads the authoritative session, while a transport failure keeps the last confirmed board, offers a retry for the failed action, and discards dependent queued projections.

Manual-note taps additionally use a transient cell-local draft and debounce rapid edits into one complete `set-notes` request. Input received while one note request is in flight remains visible and is sent as the next complete set after the response; the global action pipeline still serializes these requests with values, hints, and history actions. During candidate adoption, `useBoardNavigation` immediately projects the API-supplied candidate grid as note drafts and leaves candidate preview, so later rapid toggles amend that one projected set instead of enqueueing repeated adoption actions. Acceptance removes only unchanged adoption projections, preserving newer drafts for a following `set-notes`; rejection removes the dependent drafts and restores candidate preview. Drafts and projections are never persisted and do not own revision, history, validation, or candidate semantics. `useGameTimer` and `useBoardNavigation` consume authoritative session snapshots but own only elapsed-time display, pending presentation, pause visibility, selection, focus, notes mode, and keyboard or pointer routing.

Input handling is split into three layers. `useBoardNavigation` defines device-independent commands and UX state transitions such as enter digit, erase, change mode, and move selection. Board cells commit mouse and pen selection at pointer press, before a possibly interrupted click, while focus and click remain keyboard and touch fallbacks. `ExactActivationButton` is a thin input adapter that normalizes control-button events into one semantic activation: mouse and keyboard use canonical click activation, while touch and pen commit on pointer release so a second quick tap does not wait for a delayed compatibility click. A touch-release fallback covers browsers that expose the touch stream but omit pointer-type metadata; recognized pointer releases consume that fallback so one gesture still activates exactly once. The adapter suppresses the first click in the short post-touch window unconditionally because mobile browsers can emit compatibility clicks with no pointer type, detail, or coordinates; CSS `touch-action: manipulation` also removes double-tap gesture ambiguity. `useSessionLifecycle` then serializes resulting gameplay actions independently of their input source. Device heuristics therefore cannot change Sudoku semantics, note drafting, revisions, or history.

## Invariants

- Input adapters MUST emit semantic activations only; they MUST NOT own gameplay, note, candidate, revision, or history rules.
- The HTTP API MUST remain authoritative for every puzzle and gameplay mutation.
- Every action MUST wait for earlier queued actions and include the latest confirmed session revision.
- Pending value presentation MUST be distinguishable from authoritative valid or invalid state.
- A failed action MUST discard later dependent projections rather than replaying them against uncertain state.
- A revision conflict MUST reload authoritative session data before another mutation.
- The browser MUST NOT persist an independent puzzle solution or gameplay history.
- Automatic-candidate preview MUST render only API-supplied candidate sets and MUST hide, not delete, saved manual notes.
- Candidate adoption MUST be one backend action; a temporary projection MAY copy the API-supplied candidate grid for immediate feedback, but the browser MUST NOT derive candidates or split adoption across cell requests.
- Same-origin `/api/*` routing MUST hide backend topology from browser code.
- Refresh recovery MUST reload the saved opaque session from the API before showing either the welcome surface or a board.
- Presentation time MUST run independently from API mutation lifecycle and MUST stop only for explicit pause, hidden-page suspension, confirmation decisions, or solved status.
- Theme preference MUST remain browser-owned; both light and dark token sets MUST preserve state precedence, non-color cues, focus visibility, and native control color-scheme behavior.
- Pausing MUST conceal the puzzle, stop presentation time, and leave API game state unchanged.
