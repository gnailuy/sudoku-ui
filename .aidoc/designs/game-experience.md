---
domain: Designs
status: Active
entry_points:
  - src/App.tsx
dependencies:
  - .aidoc/architecture/web-client.md
  - .aidoc/designs/e2e-scenarios.md
  - .aidoc/designs/localization.md
---

# Game Experience

Sudoku UI aims for the speed and clarity of leading browser Sudoku products without cloning their
visual identity. The experience favors a calm editorial surface, direct controls, and equivalent
keyboard and touch paths.

## Related Docs

| Document                                      | Relationship                  |
| --------------------------------------------- | ----------------------------- |
| [Architecture](../architecture/web-client.md) | State ownership constraints   |
| [E2E scenarios](e2e-scenarios.md)             | Observable product acceptance |
| [Localization](localization.md)               | Language and message behavior |

## Why This Experience Exists

A daily puzzle should reduce cognitive overhead outside the puzzle itself. Controls stay close to
the board, state changes are immediate and legible, and recovery should make interruption safe
rather than surprising. A persistent System/Light/Dark preference lets the experience fit the
player's environment without changing gameplay.

## What the Experience Provides

### Global preferences

The header keeps language, appearance, and account access available on every surface. Controls share
a stable height and responsive geometry. Language names remain complete in the menu; approved
compact labels may appear in the closed control without changing the selected locale. Auto follows
the first supported browser language, while System follows the operating-system color preference.
Explicit locale and theme choices persist globally.

Changing locale or theme updates presentation in place. It preserves the active game, timer,
selection, focus, modes, dialogs, and current hint step. Healthy service state stays silent; only
connection work or failure that blocks play appears in the status surface.

[Web Localization](localization.md) owns the locale registry, catalogs, selection details, and
editorial gate. The architecture document owns persisted preference and state boundaries.

### Welcome, account, and game creation

The welcome surface asks for one decision: choose a difficulty and start that puzzle. It keeps
sign-in secondary, uses a real valid puzzle as the wide-screen preview, and omits the decorative
preview on small portrait phones. The selected difficulty is only a request preference; active play
always shows the API-owned actual difficulty.

Guest play is immediate. After sign-in, the account sheet provides My games and account actions
without replacing the active board. Claiming a guest game uses a named non-interactive saving
transition, retains the local copy until success, and admits one request. Destructive actions
require explicit confirmation and remain visible, locked, and specifically named while their result
is uncertain.

[User Accounts and Guest Experience](user-accounts.md) owns identity, claim, storage, and account
lifecycle details. Browser acceptance lives in [Browser E2E Scenarios](e2e-scenarios.md).

### Authoritative play and input

The API owns puzzle values, candidates, validity, mistakes, revisions, history, and hint
application. The browser may project a pending value or candidate edit for responsiveness, but it
never predicts validity or derives Sudoku state. Actions serialize against the latest confirmed
revision; a conflict reloads the authoritative board, and a failure restores the last confirmed
state with a named retry.

Values and Notes share one semantic input path across keyboard, mouse, touch, and pen. Candidates
controls visibility of the one API-owned candidate grid; Notes changes digit input from value
placement to candidate editing. Editing a hidden cell reveals only that cell and begins from an
empty visible baseline. Editing a visible cell begins from its displayed set. Rapid candidate edits
remain visible and debounce into complete-set replacements without allowing an older response to
roll back newer input.

Undo and Redo are single-flight operations. The first activation locks both history controls
synchronously and names the pending operation until the response settles. Repeated same-tick
activations do nothing. Ordinary input retains its immediate presentation path and ordered transport
behavior.

Local guards prevent mutation without an editable target, Notes input on a non-empty cell, redundant
value submission, or use of a completed digit. Mistakes increase only after the API confirms an
invalid value and never create a strike limit.

### Board, controls, and responsive layout

The puzzle is the dominant visual object. Its own 3×3 boundaries form the frame; the board and
adjacent controls do not use competing cards. Desktop places the instrument panel beside the board,
while narrow screens move it below. Notes and Candidates form a mode group; Erase, Undo, Redo, and
Hint form a separate action group. Labels remain visible when space permits and become icon-only
before they wrap, with complete accessible names retained.

The board stays square, preserves a fixed 3×3 candidate grid in every cell, and uses zero-minimum
layout tracks so values, candidates, focus, and validation do not resize it. Short viewports
compress outer spacing before allowing document scroll; the footer follows the complete board and
controls rather than obscuring them.

Selection is the strongest filled state. Peers use a quieter surface, matching values and candidates
use a digit halo, and invalid values add both red ink and a fixed-position non-color marker.
Pointer, touch, and arrow navigation keep DOM focus and selection aligned. The board uses one roving
tab stop, and each cell's accessible name includes visible candidates.

### Hints

Hint preview is read-only and turns Candidates on before the first teaching step. Corrections appear
before strategic hints and use correction titles without strategy metadata. Strategy observe and
explain steps keep the neutral Hint heading; the final action reveals the strategy name and grade,
and Back hides them again.

The browser renders the backend's closed narration, target, scene, and effect contracts without
parsing fallback prose or reconstructing Sudoku reasoning. Back and Next are local. Apply submits
the exact previewed `plan_id` as one exclusive, undoable action. A stale plan remains visible but
disabled while a fresh plan is requested for the latest revision.

The hint panel replaces inactive gameplay controls rather than stacking above them. The board
remains visible as evidence but read-only. Keyboard and visible controls provide equivalent open,
navigate, apply, and close paths.

The backend
[`hint-presentation-protocol.md`](https://github.com/gnailuy/sudoku/blob/main/.aidoc/designs/hint-presentation-protocol.md)
owns reasoning and transport invariants. Its
[`hint-reference-plans.md`](https://github.com/gnailuy/sudoku/blob/main/.aidoc/designs/hint-reference-plans.md)
owns maintained strategy storyboards. This document owns only the player-facing
progressive-disclosure and interaction contract.

### Pause, replay, recovery, and completion

Pause conceals the puzzle and stops presentation time without mutating game state. Hidden pages
suspend the timer independently of the player's explicit pause choice. Refresh first restores the
authoritative session behind a neutral loading surface, so welcome never flashes before a saved
board.

Leaving an unfinished game or choosing Start over requires confirmation. Replay keeps the puzzle
identity and waits for the authoritative restart before resetting presentation state. Choosing a
different puzzle replaces the stale board with a named loading surface until creation succeeds.
Solved games stop time, move focus to the completion heading, and offer replay or another puzzle
without restoring mutation controls.

### Feedback

Healthy edits, restoration, hint close/application, and ordinary history completion remain visually
quiet while assistive announcements confirm them. The responsible control owns active state. Restart
and account-save success use a brief non-layout-shifting notice. Errors, conflicts, and retryable
failures alone use the persistent status surface; hints, pause, loading, completion, and
confirmations retain dedicated modes.

## Accessibility Constraints

Keyboard navigation and visible focus are first-class interaction paths. Motion honors
reduced-motion preferences, controls expose names and state to assistive technology, and status
changes use appropriate live semantics without stealing focus.
