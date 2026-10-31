---
domain: Designs
status: Active
entry_points:
  - tests/app-shell.spec.ts
dependencies:
  - .aidoc/architecture/web-client.md
  - .aidoc/designs/game-experience.md
  - .aidoc/designs/localization.md
---

# Browser E2E Scenarios

Black-box Playwright scenarios exercise the built browser boundary as a user would. Component and
API-client tests complement these scenarios but do not replace them.

## Regression Intake and Proof

Translate a reported reproduction into an executable journey before changing implementation.
Preserve every precondition, action order, input method, speed boundary, and observable outcome from
the report; do not substitute a nearby steady state or an implementation-level event for the
player's path. Record any unavoidable automation approximation explicitly.

A regression is proved only when the test fails on the faulty behavior and passes after the fix.
Assertions cover both what the player sees and the authoritative API action sequence, so a rendered
success cannot hide a lost or duplicate mutation. Avoid waits between actions when the report
concerns a transition seam; wait only after the complete interaction burst to inspect its result.

Keep one full browser pass for breadth and a small repeated gate for timing-sensitive, high-risk
transitions. CI runs the Notes → immediate 1/2/3 journey independently through keyboard, mouse, and
touchscreen three times in one worker after the full suite. This repeat is deliberately narrow: it
catches timing instability without turning every scenario into a slow Cartesian product.

## Related Docs

| Document                                      | Relationship                |
| --------------------------------------------- | --------------------------- |
| [Architecture](../architecture/web-client.md) | Boundaries under test       |
| [Game experience](game-experience.md)         | Product behavior under test |
| [Localization](localization.md)               | Locale acceptance contract  |

## Locale Selection and Preservation

**Action:** Exercise Auto plus every entry in the production-locale registry from welcome and
active-game surfaces; reload explicit choices; change browser languages while Auto is selected; then
switch locale with a focused board cell and a multi-step hint open. Record gameplay traffic, elapsed
time, presentation modes, current hint step, document metadata, and desktop/phone geometry. Capture
representative welcome, game, and hint surfaces for every production locale and the development-only
pseudo-locale.

**Expected:** Every production choice renders a complete catalog, persists as the versioned global
preference, and sets the resolved `document.lang`. Hindi and Thai load their bundled script-specific
faces instead of depending on operating-system fonts. The language, appearance, and account controls
keep equal outer heights at desktop and phone widths. The language selector keeps Auto first and
production languages in stable English-name order, preserves complete menu names including Português
(Brasil), and shows compact Português only in the closed control. The closed label and chevron form
one centered unit inside a restrained fixed width without clipping any production language; the
indicator therefore cannot optically push the label aside or leave a one-sided void. The selector
names its automatic choice Auto beside the theme control's distinct System label, dismisses focus
after pointer selection, and retains visible focus after keyboard selection. Auto follows supported
browser-language changes, resolves primary English before a later installed Chinese language, and
explicit choices ignore browser changes. Locale changes issue no gameplay request and preserve
authoritative state, timer continuity, selection, focus, Notes/Candidates visibility, and the open
hint step. Pseudo remains absent from the selector and production preference vocabulary. The
reported German welcome title remains clear of the board preview. All production catalogs and the
pseudo-locale avoid horizontal overflow, clipped controls, hidden dialog actions, and truncated
assistive names at desktop and phone widths.

**Automation:** `tests/localization.spec.ts` owns locale negotiation, preservation, request
invariance, bundled Hindi and Thai font availability, responsive overflow, and screenshot capture.
Catalog unit tests prove ICU syntax, exact ID sets, and argument parity; descriptor tests prove
known, unknown-valid, and malformed handling.

## Deployment Mount and Host-Policy Boundary

**Action:** Build once for the origin root and once with `SUDOKU_MOUNT_PATH=/game`, then inspect
emitted HTML and JavaScript request paths. Validate the generic Caddy example in both modes, then
apply any installation-specific access policy outside the browser bundle.

**Expected:** Every asset, API request, health request, and refresh remains under the selected
mount. Caddy strips the prefix before backend forwarding and cannot capture a neighboring path. The
routing example does not require authentication; an operator may add a consistent reverse-proxy
access policy without embedding credentials or policy in static assets. No credential, live backend
listener, hostname, active branch, or operator path appears in the browser bundle.

**Automation:** `scripts/check-deployment.mjs` covers root and prefix builds; browser and Caddy
request proof runs before applying a shared-host route. `scripts/package-release.test.mjs` proves
the valid manifest/inventory contract and rejects unsafe mounts, identity mismatch, and changed
files.

## Static Legal Pages

**Action:** Open the Privacy policy and Terms of use directly, follow the links between them and
back to the game, and build the site at both the origin root and a path prefix.

**Expected:** Each legal page is a readable standalone HTML document with one primary heading, a
revision date, keyboard-visible links, responsive light/dark presentation that resolves the same
persisted System/Light/Dark preference as the game before paint, and no dependency on the React
application or API. Relative assets and navigation remain inside either deployment mount, and the
game footer exposes both pages.

**Automation:** `tests/legal-pages.spec.ts` covers the browser boundary and screenshots;
`scripts/check-deployment.mjs` proves both documents and their shared stylesheet survive root and
prefix builds.

## Single Guest Game Lifecycle

**Action:** Start a guest puzzle, perform ordered value and note actions, refresh and reopen the
browser, then replace or leave the active puzzle while inspecting IndexedDB and API traffic.

**Expected:** Guest creation uses the sealed-document endpoint and writes exactly one
schema-validated IndexedDB record before the board appears. Every action sends the latest sealed
document and revision, then atomically replaces that record before confirming the returned board.
Refresh and browser restart restore the authoritative snapshot, difficulty, elapsed time, pause
state, and browser-only game identity from the same record. A failed action or storage write keeps
the last confirmed record and offers a retry. Starting another puzzle replaces rather than
accumulates guest records; leaving clears only the one guest record. No identity, application
session, provider token, or editable authoritative game JSON enters browser-readable storage.

**Automation:** `tests/app-shell.spec.ts` covers creation, ordered action replacement, refresh
recovery, failure retention, replacement, and deletion; storage assertions inspect the fixed
IndexedDB record directly.

## Account Sign-In and Automatic Claim

**Action:** Start one guest puzzle, complete a same-origin Google sign-in return, and reload with a
valid application session while inspecting the claim request and IndexedDB. Then open and refresh
both an unfinished game and a finished game from My games in the same browser context, and use
account controls at desktop and phone widths.

**Expected:** The current account is resolved through the HttpOnly application session. Exactly one
claim sends the existing sealed guest document with current request-proof metadata. While that
response is pending, a named “Saving your puzzle to your account…” transition replaces the
interactive board and explains that the local copy remains safe. The local record remains available
through failed or uncertain claim responses and is deleted only after an authoritative account game
returns. Success announces “Game saved to your account,” keeps the claimed board visible, replaces
the header Sign in action with a stable identity control, and suppresses any stale pre-claim
elapsed-time write so it cannot replace the success state with an error. The identity control opens
a responsive account sheet above welcome or gameplay, lists each game's authoritative In progress or
Finished status and player elapsed time under My games, closes with Escape or the backdrop, and
resumes a selected game without an intermediate home transition. Refresh verifies the browser's
active opaque identifier against the account list and reloads that exact authoritative game instead
of returning to the welcome surface. An unfinished game restores its board, difficulty, elapsed
time, and paused presentation. A finished game restores the solved completion panel, final elapsed
time, actual difficulty, and both next actions without reopening mutation controls. Per-game
deletion, Delete all, and session revocation use named confirmation dialogs with safe initial focus,
trapped keyboard navigation, Escape dismissal, and trigger-focus restoration. After submission, the
exact destructive label changes to a pending label, Cancel and Escape cannot dismiss the dialog, and
the dialog remains visible until the delayed server response succeeds; saved-game opening and
sign-out likewise name their active target instead of exposing only a generic busy state. Account
deletion additionally stays unavailable until the player types the exact current account email, and
explains that identity, sessions, and owned games are removed while the shared puzzle catalog
remains. New authenticated puzzles, resume, ordered actions, bounded elapsed-time synchronization,
per-game or bulk deletion, sign out, session revocation, and account deletion use account endpoints
without copying identity, request-proof values, or account game contents into localStorage,
sessionStorage, or IndexedDB.

**Automation:** `tests/app-shell.spec.ts` proves the successful automatic-claim boundary and
fixed-record deletion; `src/hooks/useSessionLifecycle.test.ts` covers retained retries and the
account-game lifecycle; `src/components/AccountPanel.test.tsx` covers account controls.

## Start a Game

**Action:** Open the app with a healthy same-origin service, choose a level, refresh to verify that
the choice remains selected, and start the single primary Play action at desktop, 390×844 phone, and
412×839 Pixel 7 browser-emulation widths.

**Expected:** Before play, the welcome surface says “New puzzle,” “Choose your difficulty,” and
“Pick a level, then start when you're ready,” labels the level group “Difficulty,” and exposes one
“Start [difficulty] puzzle” action. Healthy signed-out and signed-in startup render no idle sentence
or empty status surface. The welcome surface renders all 81 positions from the canonical valid
preview puzzle without redundant puzzle metadata on desktop and portrait-tablet screens, while a
small portrait phone omits the decorative preview and keeps the primary decision flow immediate. The
welcome surface exposes the selected difficulty with pressed state, keeps its text readable while
the pointer remains over the newly selected button, preserves that browser-only preference across
refreshes, and fits a sufficiently large desktop viewport without an unnecessary vertical scrollbar.
Theme, difficulty, Notes, and Candidates share the same quiet accent-tinted selected surface and ink
instead of presenting persistent state as another primary action. A delayed request immediately
changes the initiating action to “Starting [difficulty] puzzle…”, marks it busy, locks every
difficulty choice, and admits exactly one creation request before it creates the difficulty-backed
API session. The active game displays `actual_difficulty` from the returned session rather than the
requested preference, and refresh preserves that authoritative label. One compact difficulty heading
replaces the old repeated difficulty-plus-generic-title hierarchy; elapsed time, mistakes, Pause,
and Start over form one restrained utility row. The responsive board renders exactly 81 accessible
cells with no cell selected until the player interacts, and the compact game identity identifies the
chosen difficulty without horizontal overflow. The grid itself is the board frame: its stage has no
decorative background, outer border, or shadow. The controls use an unframed instrument panel rather
than a competing card. Healthy play has no persistent status sentence or empty status divider, so
routine restoration and successful actions cannot shift the board or controls. At the tested desktop
and phone viewports, including the wider-but-shorter 412×839 boundary, the complete closed-shortcuts
game shell fits the available height without an unnecessary vertical scrollbar. The tool row uses
consistent outline icons with visible labels when space permits and switches to icon-only controls
on phone widths; every control retains its full accessible action name and no label wraps or escapes
its button. Notes and Candidates expose one accessible mode group, while Erase, Undo, Redo, and Hint
expose a separate puzzle-action group; narrow layouts retain that distinction as a two-plus-four
visual split without horizontal overflow. At phone widths, Pause and Start over share equal
dimensions. At a short wide viewport representative of display scaling, the board and controls share
a top edge while the document scrolls and keeps the footer after the complete gameplay area.
Dragging one active game through wide, narrow, short, and breakpoint-adjacent viewport sizes keeps
the board and cells square, prevents board/control overlap and horizontal overflow, keeps all three
candidate-note rows inside each cell, and centers any height-constrained desktop board within the
layout track to the left of the controls.

**Automation:** `tests/app-shell.spec.ts`.

## Theme Preference and State Coverage

**Action:** At desktop and phone widths, enter with a dark operating-system preference, switch
through System, Light, and Dark, reload, then inspect welcome, invalid gameplay, replacement-dialog,
loading, and solved-completion surfaces.

**Expected:** System resolves to the current operating-system preference. An explicit Light or Dark
choice persists across refresh and remains stable when the system preference differs. Every surface
uses the selected semantic token set without layout overflow; board boundaries, selected/focused
cells, pending and invalid values, notes/candidates, controls, dialogs, loading, and completion
retain the same precedence and non-color cues. The compact pressed-state appearance group remains
keyboard and screen-reader accessible at phone widths. Healthy service state adds no technical
status copy to the header; connection progress or failure appears only when it affects play.

**Automation:** `tests/app-shell.spec.ts`.

## Enter Values and Notes

**Action:** Before selecting a cell, inspect and press an available touch number-pad digit. Select a
given and try both pad and keyboard input. Then select an editable cell and enter a digit through
the pad. Enter the same value again, enable Notes on that non-empty cell, and try both pad and
keyboard note input. Select another empty editable cell and enter a candidate. Enter the same
invalid digit in several cells, then enter it in a valid cell. Fill the ninth non-invalid instance
of that digit, then try it through both the number pad and keyboard.

**Expected:** Available number-pad digits stay enabled without a board selection and pressing one
prompts the player to select an editable cell without sending an API action or choosing a cell
arbitrarily. Selecting a given disables every number-pad digit, and keyboard entry cannot bypass the
guard. Each valid state-changing interaction sends one typed action with the current authoritative
revision. Re-entering the selected cell's existing value sends no request and leaves the controls
stable. Notes mode exposes its pressed state, changes the number pad to a muted note-specific
treatment and accessible name, and disables every note digit while the selected cell is non-empty;
keyboard entry sends no action in that state. Selecting an empty editable cell enables valid note
input, and candidate digits remain legible on a phone without resizing the board. Erase is disabled
with no selection, on givens, and whenever the selected editable cell has no content removable in
the current mode; it becomes available when the current mode has value or note content to clear. The
API response enables undo without modifying givens. Invalid duplicates do not count toward digit
completion or block a valid entry. Each server-confirmed invalid value entry increments the
informational mistake count; note and hint actions do not. Undo, Redo, and erase leave the count
unchanged, refresh restores it from the active API session, and a newly created puzzle starts at
zero. A digit shown nine non-invalid times in the authoritative snapshot disables its number-pad
button, and keyboard entry cannot bypass that guard.

**Automation:** `tests/app-shell.spec.ts`.

## One Candidate Grid with Cell-Level Visibility

**Action:** Start with stored `123` in one hidden cell, select a committed digit that matches hidden
candidates, enable Notes, enter `4` and `5`, turn Candidates on and off, refresh, request a hint
while candidates are hidden, and repeat at desktop, phone, and narrow-phone widths while observing
API traffic.

**Expected:** Hidden cells render neither candidate digits nor empty matching halos. The first
hidden-cell edit reveals only that cell and submits `4` then `45`, replacing stored `123` from the
empty visible baseline. Candidates on reveals every cell without mutation and preserves the edited
`45`; Candidates off hides every cell without changing stored sets. Notes remains independent of
visibility. Refresh restores the per-game visibility mask, while a new or restarted puzzle clears
it. A successful hint preview turns Candidates on and leaves the grid visible after close or apply.
Undo and Redo restore only authoritative values and candidate sets, not the browser mask.

**Automation:** `tests/app-shell.spec.ts`.

## Stable Board Geometry and State Precedence

**Action:** Measure the board and all 81 cells, enter invalid digits 1 through 5 from the keyboard,
then repeat the desktop player's exact mouse-click and keyboard-entry rhythm across several empty
cells while action responses overlap the next click. Use Playwright's real mouse click followed
immediately by keyboard input for every cell, without synthetic event dispatch or inserted waits.
Add a note, erase the value, and select a given digit with pointer and arrow navigation at desktop
and mobile widths.

**Expected:** Desktop pointer intent selects the new cell before release, and each later digit
targets that cell in both the visible board and the authoritative API action, never the previously
invalid cell. Keyboard focus agrees with the selected cell after every completed click. Every board
and cell bounding box remains fixed while content changes. Keyboard entry retains focus with a clean
solid focus cue rather than a dotted or dashed artifact. Every tested invalid digit uses red ink
plus the same complete, fixed-position marker below the glyph and exposes `aria-invalid`; the cue
does not depend on text-decoration metrics, become a spellcheck wave, or add a decorative corner
marker. The square gameplay board keeps corner-cell selection aligned with the grid. The selected
cell is never also styled as a peer or match, peer highlighting remains observable, matching
committed values and candidate notes use a quiet circular digit halo rather than a competing fill,
and an empty selected cell produces no matches.

**Automation:** `tests/app-shell.spec.ts`.

## Interaction Paths

Keyboard navigation, digit entry, deliberate Notes editing, erase, pause/resume, hint
opening/navigation/application/closing, and standard platform Undo/Redo shortcuts share the same
semantic actions as pointer controls and remain available while the page has focus, even when the
board does not. `Ctrl`/`Cmd`+`Z` sends an authoritative undo only when the snapshot permits it;
`Ctrl`/`Cmd`+`Shift`+`Z` and `Ctrl`+`Y` similarly send redo. A rapid burst of pointer, touchscreen,
or keyboard activations admits exactly one history request, disables both history controls, and
exposes the active “Undoing…” or “Redoing…” state until that response settles. Sequential Undo after
settlement restores each exact authoritative board and candidate state, Redo follows the same path,
and a manual action from a historical state returns `can_redo: false` so the abandoned branch cannot
be replayed. `P` pauses and resumes while all mutation shortcuts remain blocked during pause. A
native disclosure exposes the complete shortcut guide to keyboard and assistive-technology users.
The 81-cell grid exposes one roving tab stop: Tab enters and selects the current cell, arrow keys
move inside the grid, and the next Tab reaches the number pad without traversing every cell. Visible
Notes remain visually compact while their values are included in the cell's accessible name. A new
or restored board starts without a selection, clicking outside the board clears the highlight, and
the first arrow key selects the first editable cell before subsequent arrows navigate normally.
Arrow navigation moves DOM focus and selection together, and the selected/focused cell uses the same
border treatment as pointer and touch selection rather than leaving a second focus box behind. Undo,
redo, and hint availability come directly from the returned snapshot rather than browser-derived
history. The geometry and visual-state scenario runs at desktop and narrow mobile widths and asserts
the rendered keyboard-focus style; reduced-motion behavior remains a CSS-level invariant.

## Renderer-Neutral Hint Teaching

**Action:** Exercise value correction, candidate correction, and strategy preview through guest and
account transports. Navigate by keyboard and visible controls, apply the exact plan, reject stale
and consumed plans, and run the generated 23-strategy fixture matrix plus the real-stack
complete-game corpus.

**Expected:** Preview is read-only, turns Candidates on, and leaves the API-authoritative grid
visible. Corrections identify the exact invalid value or candidate cell without exposing strategy
metadata. Strategy observe and explain steps retain the neutral Hint heading; only the final action
reveals strategy name and grade, and Back hides them again.

Every valid strategy step renders the closed narration union and complete typed scene without
parsing fallback English. Progressive scenes add a bounded fact or relation, preserve the causal
proof, and isolate the exact final placement or grouped elimination. Visual roles, links, labels,
locators, and accessible names remain meaningful without color. Malformed narration falls back as
one complete message rather than partially rendering an unsafe stream.

The hint panel replaces inactive controls while preserving board and footer geometry. Board input is
disabled during preview. Back, Next, Left, Right, and Escape never mutate. Repeated `H` opens,
advances one step, and applies from the final step; Enter remains a final-step alternative. Apply
reserves one exclusive transaction, sends exactly one `apply-hint` with the previewed `plan_id` and
current revision, and produces one Undo entry. A stale plan stays visible but disabled until a
replacement arrives; an already-consumed identical replacement closes instead of looping.

The backend
[`hint-reference-plans.md`](https://github.com/gnailuy/sudoku/blob/main/.aidoc/designs/hint-reference-plans.md)
is the canonical owner of strategy storyboards, coordinates, scene counts, and logical progression.
This catalog verifies renderer behavior against generated fixtures rather than duplicating those
storyboards in prose.

**Fixture matrix:** `tests/hint-strategy-matrix.spec.ts` reads the manifest and one formatted case
per registered strategy under `tests/fixtures/hint-plans/`. It proves every authored step, exact
final effect, structured-narration handling, progressive metadata disclosure, responsive geometry,
and representative English, Simplified Chinese, and Traditional Chinese presentation. Fixture files
are generated from the backend's maintained complete-game manifest; the command in the test owner is
the source of truth.

**Real-stack corpus:** `npm run test:e2e:fullstack` starts the reviewed backend harness and the real
Vite client, then solves the maintained minimum corpus only through Reveal, Next, and Apply. Every
game must reach normal completion, and the browser-observed strategy set must equal all registered
strategies. This lane proves React transport, sealed guest documents, revisions, exact-plan
application, progression, and solved completion without replacing the fast fixture matrix.

**Automation:** `tests/hint-strategy-matrix.spec.ts`, `tests/fullstack/full-game-hints.spec.ts`,
`playwright.fullstack.config.ts`, `tests/app-shell.spec.ts`, `src/components/HintPanel.test.tsx`,
`src/components/GameBoard.test.tsx`, `src/hooks/useSessionLifecycle.test.ts`, and
`src/api/client.test.ts`.

## Serialized Action Responsiveness

**Action:** Delay action responses, enter values rapidly in different cells, then activate Undo or
Redo three times without waits through separate keyboard, mouse, and touchscreen journeys. Inspect
the confirmed board, history controls, status announcement, request sequence, revisions, and failure
recovery.

**Expected:** Each value appears immediately with an accessible checking state before the server
responds. Requests remain strictly serialized, and every request carries the revision returned by
the preceding response. The first authoritative invalid result remains visible while later cells are
pending, and no later response overwrites or conceals it. The first history activation admits
exactly one request; both history controls disable synchronously, the confirmed board stays visible,
and the status announces “Undoing…” or “Redoing…” until settlement. The authoritative response
redraws the board once and restores availability from `can_undo` and `can_redo`. Failure retains the
confirmed board, releases the history lock, and offers the existing retry. The elapsed timer
continues independently, a revision conflict reloads the authoritative board, and ordinary
optimistic input paths retain their existing behavior.

**Automation:** `tests/app-shell.spec.ts` and `src/hooks/useSessionLifecycle.test.ts`.

## Pause, Time, and Refresh Recovery

**Action:** Start a game, issue rapid consecutive moves while API mutations preserve ordering, let
elapsed time advance, hide and restore the page, pause, wait, refresh the page, and resume at
desktop and mobile widths.

**Expected:** Elapsed time continues across in-flight and completed API mutations without restarting
its clock. Hiding the page stops the timer until it is visible again without changing the explicit
pause state. Pause conceals the board and stops the timer. Refresh shows a neutral loading state
instead of flashing the welcome surface, reloads the opaque active session from the API, preserves
paused timer state, and shows the restored authoritative board after resume.

**Automation:** `tests/app-shell.spec.ts`.

## Service Failure and Retry

**Action:** Make an otherwise valid move while the game service returns a temporary server failure,
then use the offered retry.

**Expected:** The last confirmed board remains visible, the message explains that the board is safe,
and the named retry sends the move again. Revision-conflict recovery continues to reload the
authoritative session rather than replay stale state.

**Automation:** `tests/app-shell.spec.ts`.

## Leave, Replay, and Different Puzzle Confirmation

**Action:** Build the product at a nested mount and verify that the site logo targets that mount
rather than the host root. From the mounted welcome surface, select the logo and remain in Sudoku.
From an active game, click the logo, dismiss the leave confirmation, then confirm a return to the
front page. Start another game, open a hint, choose Start over, and replay the same puzzle; open
another hint, reopen Start over, choose a different difficulty, confirm Play a different puzzle
while the session response is delayed, and inspect both transitions. Repeat Replay this puzzle from
the solved completion panel.

**Expected:** The welcome logo keeps navigation inside the configured Sudoku mount and never targets
an unrelated host-root application. Each confirmation receives focus on its safe action and traps
keyboard focus. Dismissal returns focus to the initiating logo or button and keeps the unchanged
board. Confirming the logo action clears the active pointer without creating a session, fetches the
deployed shell without cache, and reloads only when its module entry differs from the running
document; an unchanged or failed check shows the welcome surface normally. The Start over dialog
gives Cancel safe initial focus and presents Replay this puzzle and Play a different puzzle as equal
choice surfaces. Only the different-puzzle surface contains the level picker, and neither choice
uses accent fill as a recommendation. Replay sends one `restart` action, preserves puzzle identity
and difficulty, waits for the authoritative clean snapshot, closes the old hint and removes its
marks, resets time and browser-only modes, shows a brief non-layout-shifting notice, and focuses the
board without creating a session. A successful different-puzzle replacement also closes the old hint
before the new board appears. The solved panel gives replay and another puzzle the same peer
treatment, with level selection as quiet navigation. Play a different puzzle creates exactly one
session at the selected difficulty; while that request is pending, a named loading state replaces
the stale board and controls, and the new board appears only after the API response.

**Automation:** `scripts/check-deployment.mjs` and `tests/app-shell.spec.ts`.

## Solved Completion

**Action:** Apply a move whose authoritative response changes the session status to solved.

**Expected:** The completion message is announced, elapsed time stops, and mutation controls leave
the interface. Focus moves from the removed grid cell to the completion heading, whose visible focus
cue and accessible name communicate the solved time. The completion panel preserves the final time
and offers direct actions to start another board at the same level or return to level selection
without an unnecessary confirmation.

**Automation:** `tests/app-shell.spec.ts`.

### Input-method gameplay state matrix

**Strategy:** Cover semantic state transitions and timing boundaries rather than attempting the
unbounded Cartesian product of every action sequence. Run the same high-value player journey
independently with keyboard, mouse, and touchscreen; combine it with delayed responses, single and
rapid input, additions and removals, independent mode and visibility changes, erase, history, and
valid/invalid authoritative results. Dedicated scenarios separately cover pause, refresh,
failure/retry, completion, navigation protection, and responsive geometry.

**Action:** In each input-method-only run, start a game and select an editable cell without
borrowing another device path. First enable Notes, then immediately enter 1, 2, and 3 into a hidden
cell whose stored candidate set differs, without waiting between inputs; verify the empty visible
baseline and all three additions survive. Continue with single-note add/remove, rapid additions, and
rapid mixed edits while one complete-set save is debounced. Erase the full note set. Continue by
removing an existing candidate, then add another note while the earlier complete-set save is
delayed. Return to value mode, enter an invalid value and a valid value, erase the valid value, then
Undo and Redo.

**Expected:** All three runs produce the same visible states, exact API actions, and consecutive
revisions. Keyboard and mouse use canonical click activation. Touch and pen commit on release, with
a touch-event fallback when the browser omits pointer-type metadata; the first click inside the
short post-touch window is suppressed even when the browser omits pointer type, click detail, and
coordinates. Each completed activation occurs exactly once, and the first digit after a Notes mode
change uses the new mode even before React renders again. Empty, one-digit, and multi-digit
candidate sets use one `set-candidates` wire action; the trailing-edge debounce restarts for every
immediate edit so the 1/2/3 burst emits one complete save, rapid mixed edits converge to the exact
latest set, and erase saves an empty set. Notes editing operates on the authoritative candidate grid
without a copy or adoption transition; hidden cells begin from an empty visible baseline, visible
cells begin from their displayed set, and Candidates changes visibility without mutation. Invalid
and valid values retain distinct authoritative styling, erase is serialized, and Undo/Redo preserve
input order.
