---
domain: Architecture
status: Active
entry_points:
  - src/App.tsx
  - src/api/client.ts
  - src/storage/guestGameRepository.ts
dependencies:
  - .aidoc/designs/game-experience.md
  - .aidoc/designs/localization.md
  - .aidoc/workflows/test-deployment.md
---

# Web Client Architecture

The React client presents Sudoku sessions owned by the Go HTTP API. A strict ownership boundary
prevents stale browser logic from disagreeing with authoritative revisions, validation, or recovery.

## Related Docs

| Document                                           | Relationship                               |
| -------------------------------------------------- | ------------------------------------------ |
| [Game experience](../designs/game-experience.md)   | Presentation intent built on this boundary |
| [Localization](../designs/localization.md)         | Locale and message ownership boundary      |
| [Test deployment](../workflows/test-deployment.md) | Same-origin production topology            |
| [E2E scenarios](../designs/e2e-scenarios.md)       | Boundary acceptance coverage               |
| [User accounts](../designs/user-accounts.md)       | Approved guest and account ownership model |

## Why the Boundary Exists

The Go engine already defines valid actions, optimistic revisions, hints, history, candidates, and
durable recovery. Reimplementing those rules in React would create two game engines and make
refresh, concurrency, and backend upgrades unsafe.

The browser owns only presentation concerns such as selection, keyboard focus, pause visibility,
elapsed-time display, theme, and preferences. The level picker remains a preferred request, while
every active-game label and persisted timer presentation uses `session.actual_difficulty` from the
API. The API snapshot owns the cumulative confirmed mistake count, so refresh and recovery cannot
disagree with the game session. Theme preference is persisted as `system`, `light`, or `dark`;
System follows `prefers-color-scheme` changes, while the resolved theme selects one complete
semantic token set for every surface and gameplay state. Candidates remain one API-authoritative
grid. Candidates controls only an 81-cell browser-owned visibility mask, while Notes controls
whether digit input edits that grid or places values. Candidates on reveals every editable cell,
Candidates off hides every cell, and editing a hidden cell reveals only that cell. The browser never
copies, derives, or reconciles a second note model. A small local active-game record stores either
the opaque account-game ID or the browser-local guest ID together with timer presentation state, so
refresh can select the matching authoritative or sealed record again; it never stores puzzle values
or history.

## What the Client Contains

### Transport and localization

`SudokuApiClient` is the narrow transport boundary. Its types mirror the canonical OpenAPI contract,
normalize transport failures as `SudokuApiError`, keep authenticated cookies same-origin, attach
request-proof tokens only to account mutations, and model guest actions as sealed-document
replacement.

`src/i18n/` owns browser-authored messages and API descriptor rendering. Controllers retain message
IDs and typed values rather than rendered English. Valid known descriptors use the selected catalog,
valid unknown descriptors use bounded backend English, and malformed descriptors become a localized
generic failure. Locale never enters gameplay requests or authoritative storage.

### Hint presentation

The API client requests one complete read-only plan from the active guest or account resource. `App`
keeps the preview and current step as disposable state. `HintPanel` renders closed descriptors and
narration; `GameBoard` renders typed marks, nodes, and links. The browser never parses fallback
prose or derives reasoning from scenes.

Navigation remains local. Application submits the exact `plan_id`, and every accepted correction or
strategy result returns the updated authoritative grid. Preparing, refreshing, and applying a hint
use explicit typed states that lock conflicting controls. Rejected or stale application requests a
new plan for the latest revision instead of reconstructing logic in React.

### Guest persistence and account transition

`GuestGameRepository` owns one fixed IndexedDB record containing the browser identity, complete
sealed guest response, and timer presentation state. Replacement and deletion are atomic.
Unsupported records fail explicitly, and the browser never opens or edits sealed gameplay state.

`useSessionLifecycle` uses guest endpoints until an account exists. It advances the visible
confirmed board only after a successful response and IndexedDB replacement. Automatic claim keeps
the guest record through every uncertain or failed response and deletes it only after an
authoritative account game returns.

Authenticated play persists only one opaque active-game pointer and timer presentation state.
Refresh verifies that pointer against the authoritative game list. Account mutations carry the
current request-proof token, destructive operations expose one typed pending state, and elapsed time
synchronizes at bounded intervals plus pause or completion.

### Composition and authoritative mutation

`App` composes welcome, loading, board, controls, completion, and confirmations. Focused hooks own
API lifecycle, presentation time, and input/navigation; `src/presentation.ts` contains shared
browser-only records and formatting. No boundary introduces an independent game model.

`useSessionLifecycle` is the sole controller that creates, restores, or mutates sessions. It
serializes intents, sends each action with the latest confirmed revision, and updates the snapshot
only from that action's response. Temporary cell projections never predict validity, candidates,
peers, or history. Conflict reloads authoritative state; failure keeps the last confirmed board and
drops dependent projections.

Hint application, restart, Undo, and Redo reserve exclusive or single-flight boundaries
synchronously before React renders. Same-puzzle replay resets presentation state only after the
authoritative restart succeeds. Different- puzzle replacement discards the old hint only after the
new session succeeds.

Candidate editing uses a transient cell-local draft and trailing-edge debounce. A hidden cell starts
from an empty visible baseline; a visible cell starts from its displayed set. Input arriving during
a request remains visible and becomes the next complete replacement. Drafts never own revisions,
history, validation, or candidate semantics.

### Input and presentation controllers

`useBoardNavigation` defines device-independent commands and UX state. `ExactActivationButton`
normalizes controls into one semantic activation: mouse and keyboard use canonical click; touch and
pen commit on release and suppress the first compatibility click. Device heuristics never own Sudoku
behavior.

`useGameTimer` and `useBoardNavigation` consume authoritative snapshots while owning only elapsed
display, pause visibility, selection, focus, modes, and input routing. Vitest proves focused
components and hooks; Playwright remains the authority for integrated behavior, responsive geometry,
and backend interaction.

## Invariants

- Input adapters MUST emit semantic activations only; they MUST NOT own gameplay, note, candidate,
  revision, or history rules.
- The HTTP API MUST remain authoritative for every puzzle and gameplay mutation.
- Hint navigation MUST remain browser-local, while hint application MUST submit the exact API-issued
  `plan_id` for the previewed revision.
- Hint marks MUST expose semantic roles through accessible text and non-color visual cues.
- Every action MUST wait for earlier queued actions and include the latest confirmed session
  revision.
- Hint application and same-puzzle restart MUST reserve one exclusive transaction synchronously; no
  later action may queue until it settles.
- History navigation MUST admit at most one Undo or Redo until its authoritative response settles,
  and duplicate suppression MUST occur before the next render.
- Pending value presentation MUST be distinguishable from authoritative valid or invalid state.
- A failed action MUST discard later dependent projections rather than replaying them against
  uncertain state.
- A revision conflict MUST reload authoritative session data before another mutation.
- The browser MUST NOT persist an independent puzzle solution or gameplay history.
- A guest action response MUST replace the complete IndexedDB record before its board becomes
  confirmed in the UI.
- Automatic claim MUST retain the guest record until an authoritative account game is returned, and
  retries MUST reuse the same sealed document.
- Account mutations MUST carry the current request-proof token and MUST NOT copy identity or account
  games into browser storage.
- Timer persistence MUST serialize with sealed-document replacement so older presentation writes
  cannot restore older gameplay.
- Candidate visibility MUST remain browser-owned presentation state scoped to one game; Candidates
  on reveals every editable cell, Candidates off clears the mask, and note entry may reveal only its
  edited cell.
- Candidate edits MUST submit complete `set-candidates` replacements from the displayed baseline;
  the browser MAY project the pending cell but MUST NOT derive Sudoku candidates or create a second
  grid.
- Same-origin `/api/*` routing MUST hide backend topology from browser code.
- Refresh recovery MUST reload the saved opaque session from the API before showing either the
  welcome surface or a board.
- Presentation time MUST run independently from API mutation lifecycle and MUST stop only for
  explicit pause, hidden-page suspension, confirmation decisions, or solved status.
- Theme preference MUST remain browser-owned; both light and dark token sets MUST preserve state
  precedence, non-color cues, focus visibility, and native control color-scheme behavior.
- Pausing MUST conceal the puzzle, stop presentation time, and leave API game state unchanged.
