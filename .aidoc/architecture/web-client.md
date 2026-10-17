---
domain: Architecture
status: Active
entry_points:
  - src/App.tsx
  - src/api/client.ts
  - src/storage/guestGameRepository.ts
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
| [User accounts](../designs/user-accounts.md)       | Approved guest and account ownership model |

## Why the Boundary Exists

The Go engine already defines valid actions, optimistic revisions, hints, history, candidates, and durable recovery. Reimplementing those rules in React would create two game engines and make refresh, concurrency, and backend upgrades unsafe.

The browser owns only presentation concerns such as selection, keyboard focus, pause visibility, elapsed-time display, theme, and preferences. The level picker remains a preferred request, while every active-game label and persisted timer presentation uses `session.actual_difficulty` from the API. The API snapshot owns the cumulative confirmed mistake count, so refresh and recovery cannot disagree with the game session. Theme preference is persisted as `system`, `light`, or `dark`; System follows `prefers-color-scheme` changes, while the resolved theme selects one complete semantic token set for every surface and gameplay state. Candidates remain one API-authoritative grid. Candidates controls only an 81-cell browser-owned visibility mask, while Notes controls whether digit input edits that grid or places values. Candidates on reveals every editable cell, Candidates off hides every cell, and editing a hidden cell reveals only that cell. The browser never copies, derives, or reconciles a second note model. A small local active-game record stores the opaque API session ID and timer presentation state so refresh can request the authoritative snapshot again; it never stores puzzle values or history.

## What the Client Contains

`SudokuApiClient` is the narrow transport boundary. Its request and response types mirror the canonical OpenAPI 3.1.1 contract in `gnailuy/sudoku/api/openapi.yaml`; transport failures become `SudokuApiError` values rather than leaking fetch details through the component tree. The account transport keeps application cookies same-origin, supplies the current account's request-proof token only on authenticated mutations, encodes account-game identifiers, and models guest actions as sealed-document replacement.

`SudokuApiClient` requests read-only complete hint previews through the active guest or account-game resource. A successful preview turns Candidates on before rendering the typed candidate facts required by its current step and leaves the authoritative grid visible after close or apply. `App` keeps one preview and current step as disposable state: correction plans use their correction title without strategy metadata, strategy plans retain their name and grade, Back and Next stay local, `GameBoard` renders typed problem/extra or strategy roles, and Apply submits the exact `plan_id`. `HintPanel` renders the optional hint narration IR as a closed text, digit, or target union without parsing fallback prose; a target becomes a direct highlighted reference, a visible compact locator, and a fully expanded screen-reader location. The browser validates the complete token stream before rendering it and uses the API-authored `message` unchanged when narration is absent, malformed, or unsupported, preventing partial or guessed explanations while the contract is migrated strategy by strategy. While the preview is open, the hint panel replaces the inactive number pad, tools, and shortcut disclosure so the control column cannot grow or move the board into the footer; board cells remain visible for evidence but reject pointer and keyboard selection. `H` opens a preview, Left and Right navigate, Enter applies only on the final step, and Escape closes it, while the same visible controls preserve the touch path. Every applied correction or strategy result returns the updated authoritative candidate grid; the browser does not translate effects into local mutations. A preview never enters IndexedDB or account storage. Any rejected or stale application discards dependent state and requests a fresh plan for the latest authoritative revision instead of applying or reconstructing hint logic in React.

`GuestGameRepository` is the browser persistence boundary for the account milestone. The repository owns one fixed IndexedDB record containing schema version 1, a browser-local game identity, the latest complete sealed guest response, and timer presentation state. Replacement and deletion each complete in one read-write transaction; unsupported records fail explicitly instead of being interpreted as game state. The local identity scopes browser-only focus and the per-game candidate visibility mask without exposing the sealed document, while the persisted resume timestamp keeps elapsed presentation coherent across browser restarts.

`useSessionLifecycle` routes new games and ordered mutations through sealed guest endpoints until an account exists. Each successful response and its replacement document reach IndexedDB before the visible confirmed board advances; failed transport or storage retains the last complete record and exposes a retry. New-game replacement writes the new record atomically, guest recovery loads only that record, and leaving clears only guest state. A serialized storage queue prevents timer persistence from overwriting a newer sealed action response.

Startup also resolves the same-origin HttpOnly account session. When an account and local guest coexist, the controller immediately claims that one sealed document, retains IndexedDB through every failed or uncertain response, and clears it only after the authoritative account-game response succeeds. For an authenticated game, the browser stores only the active opaque game identifier and timer presentation pointer; refresh first confirms that identifier in the account's authoritative game list, then reloads the exact game route before showing the board. A stale or deleted identifier is discarded instead of selecting another game implicitly. Account creation, resume, ordered actions, listing, presentation-time synchronization, per-game or bulk deletion, logout, session revocation, and account deletion use the request-proof token returned by the current-account route. The client synchronizes elapsed time every five active seconds and immediately on pause or completion; account summaries consume backend-owned status and elapsed time rather than reconstructing either from timestamps. Guest and account actions share one serialized intent boundary, but only guest mode writes sealed documents or gameplay presentation into IndexedDB.

`App` is the composition root for cohesive welcome, loading, board, controls, completion, and confirmation presentations under `src/components/`. Focused controllers in `src/hooks/` own API session lifecycle, presentation time, and board input/navigation; shared browser-only records and formatting live in `src/presentation.ts`. These boundaries separate presentation responsibilities without introducing an independent game model.

Vitest component tests exercise each extracted presentation boundary through accessible roles, labels, state, and callbacks. Hook tests exercise session recovery and retry behavior, timing, keyboard routing, selection, and API-authoritative mutation decisions. CI measures every component, hook, and shared presentation helper independently and requires each file to retain at least 80% line, statement, and function coverage and 70% branch coverage. Black-box Playwright scenarios remain the authority for integrated browser behavior, responsive geometry, and backend interaction.

`useSessionLifecycle` is the only presentation controller that creates, restores, or mutates API sessions. It serializes user intents through one ordered pipeline, sends each action with the latest confirmed revision, and replaces the confirmed snapshot only with that action's response. Value entry and erase receive a temporary cell-local projection while queued; the projection is explicitly marked as checking and never predicts validity, candidates, peer cleanup, or history. Each authoritative response removes only its corresponding projection, so a later queued result cannot overwrite an earlier result. A conflict reloads the authoritative session, while a transport failure keeps the last confirmed board, offers a retry for the failed action, and discards dependent queued projections.

Same-puzzle replay is one serialized `restart` action within that pipeline. The browser keeps the confirmed board and timer until the authoritative replacement state arrives, then closes any open hint, resets browser-only timer, selection, Notes, and Candidates presentation, and moves focus to the fresh board. A different-puzzle replacement also discards the prior puzzle’s open hint only after the new authoritative session succeeds. Account elapsed time resets in the same backend revision; guest presentation storage receives zero only after the sealed replacement succeeds.

History navigation is a single-flight transition within that pipeline. The first Undo or Redo reserves the history boundary synchronously before React renders, so same-tick pointer, touch, or keyboard activations cannot enqueue a second history command. Both history controls remain unavailable and expose the active “Undoing…” or “Redoing…” state until the authoritative response succeeds or fails; the confirmed board stays visible, and the returned snapshot alone restores `can_undo` and `can_redo`. Ordinary value and candidate intents keep their immediate presentation and ordered transport behavior.

Candidate taps use a transient cell-local draft and debounce rapid edits into one complete `set-candidates` request. A hidden cell begins from an empty visible baseline and is revealed before its first edit; a visible cell begins from the complete displayed authoritative set. Input received while one request is in flight remains visible and is sent as the next complete set after the response; the global action pipeline still serializes these requests with values, hints, and history actions. Drafts and projections are never persisted and do not own revision, history, validation, or candidate semantics. `useGameTimer` and `useBoardNavigation` consume authoritative session snapshots but own only elapsed-time display, pending presentation, pause visibility, selection, focus, notes mode, and keyboard or pointer routing.

Input handling is split into three layers. `useBoardNavigation` defines device-independent commands and UX state transitions such as enter digit, erase, change mode, and move selection. Board cells commit mouse and pen selection at pointer press, before a possibly interrupted click, while focus and click remain keyboard and touch fallbacks. `ExactActivationButton` is a thin input adapter that normalizes control-button events into one semantic activation: mouse and keyboard use canonical click activation, while touch and pen commit on pointer release so a second quick tap does not wait for a delayed compatibility click. A touch-release fallback covers browsers that expose the touch stream but omit pointer-type metadata; recognized pointer releases consume that fallback so one gesture still activates exactly once. The adapter suppresses the first click in the short post-touch window unconditionally because mobile browsers can emit compatibility clicks with no pointer type, detail, or coordinates; CSS `touch-action: manipulation` also removes double-tap gesture ambiguity. `useSessionLifecycle` then serializes resulting gameplay actions independently of their input source. Device heuristics therefore cannot change Sudoku semantics, candidate drafting, revisions, or history.

## Invariants

- Input adapters MUST emit semantic activations only; they MUST NOT own gameplay, note, candidate, revision, or history rules.
- The HTTP API MUST remain authoritative for every puzzle and gameplay mutation.
- Hint navigation MUST remain browser-local, while hint application MUST submit the exact API-issued `plan_id` for the previewed revision.
- Hint marks MUST expose semantic roles through accessible text and non-color visual cues.
- Every action MUST wait for earlier queued actions and include the latest confirmed session revision.
- History navigation MUST admit at most one Undo or Redo until its authoritative response settles, and duplicate suppression MUST occur before the next render.
- Pending value presentation MUST be distinguishable from authoritative valid or invalid state.
- A failed action MUST discard later dependent projections rather than replaying them against uncertain state.
- A revision conflict MUST reload authoritative session data before another mutation.
- The browser MUST NOT persist an independent puzzle solution or gameplay history.
- A guest action response MUST replace the complete IndexedDB record before its board becomes confirmed in the UI.
- Automatic claim MUST retain the guest record until an authoritative account game is returned, and retries MUST reuse the same sealed document.
- Account mutations MUST carry the current request-proof token and MUST NOT copy identity or account games into browser storage.
- Timer persistence MUST serialize with sealed-document replacement so older presentation writes cannot restore older gameplay.
- Candidate visibility MUST remain browser-owned presentation state scoped to one game; Candidates on reveals every editable cell, Candidates off clears the mask, and note entry may reveal only its edited cell.
- Candidate edits MUST submit complete `set-candidates` replacements from the displayed baseline; the browser MAY project the pending cell but MUST NOT derive Sudoku candidates or create a second grid.
- Same-origin `/api/*` routing MUST hide backend topology from browser code.
- Refresh recovery MUST reload the saved opaque session from the API before showing either the welcome surface or a board.
- Presentation time MUST run independently from API mutation lifecycle and MUST stop only for explicit pause, hidden-page suspension, confirmation decisions, or solved status.
- Theme preference MUST remain browser-owned; both light and dark token sets MUST preserve state precedence, non-color cues, focus visibility, and native control color-scheme behavior.
- Pausing MUST conceal the puzzle, stop presentation time, and leave API game state unchanged.
