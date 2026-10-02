---
domain: Designs
status: Active
entry_points:
  - tests/app-shell.spec.ts
dependencies:
  - .aidoc/architecture/web-client.md
  - .aidoc/designs/game-experience.md
---

# Browser E2E Scenarios

Black-box Playwright scenarios exercise the built browser boundary as a user would. Component and API-client tests complement these scenarios but do not replace them.

## Regression Intake and Proof

Translate a reported reproduction into an executable journey before changing implementation. Preserve every precondition, action order, input method, speed boundary, and observable outcome from the report; do not substitute a nearby steady state or an implementation-level event for the player's path. Record any unavoidable automation approximation explicitly.

A regression is proved only when the test fails on the faulty behavior and passes after the fix. Assertions cover both what the player sees and the authoritative API action sequence, so a rendered success cannot hide a lost or duplicate mutation. Avoid waits between actions when the report concerns a transition seam; wait only after the complete interaction burst to inspect its result.

Keep one full browser pass for breadth and a small repeated gate for timing-sensitive, high-risk transitions. CI runs the Candidates → Notes → immediate 1/2/3 journey independently through keyboard, mouse, and touchscreen three times in one worker after the full suite. This repeat is deliberately narrow: it catches timing instability without turning every scenario into a slow Cartesian product.

## Related Docs

| Document                                      | Relationship                |
| --------------------------------------------- | --------------------------- |
| [Architecture](../architecture/web-client.md) | Boundaries under test       |
| [Game experience](game-experience.md)         | Product behavior under test |

## Deployment Mount and Host-Policy Boundary

**Action:** Build once for the origin root and once with `SUDOKU_MOUNT_PATH=/game`, then inspect emitted HTML and JavaScript request paths. Validate the generic Caddy example in both modes, then apply any installation-specific access policy outside the browser bundle.

**Expected:** Every asset, API request, health request, and refresh remains under the selected mount. Caddy strips the prefix before backend forwarding and cannot capture a neighboring path. The routing example does not require authentication; an operator may add a consistent reverse-proxy access policy without embedding credentials or policy in static assets. No credential, live backend listener, hostname, active branch, or operator path appears in the browser bundle.

**Automation:** `scripts/check-deployment.mjs` covers root and prefix builds; browser and Caddy request proof runs before applying a shared-host route. `scripts/package-release.test.mjs` proves the valid manifest/inventory contract and rejects unsafe mounts, identity mismatch, and changed files.

## Start a Game

**Action:** Open the app with a healthy same-origin service, choose a level, refresh to verify that the choice remains selected, and start the single primary Play action at desktop, 390×844 phone, and 412×839 Pixel 7 browser-emulation widths.

**Expected:** Before play, the welcome surface renders all 81 positions from the canonical valid preview puzzle without redundant puzzle metadata on desktop and portrait-tablet screens, while a small portrait phone omits the decorative preview and keeps the primary decision flow immediate. The welcome surface exposes the selected difficulty with pressed state, keeps its text readable while the pointer remains over the newly selected button, preserves that browser-only preference across refreshes, and fits a sufficiently large desktop viewport without an unnecessary vertical scrollbar. The request then creates a difficulty-backed API session. The active game displays `actual_difficulty` from the returned session rather than the requested preference, and refresh preserves that authoritative label. The responsive board renders exactly 81 accessible cells with no cell selected until the player interacts, and the status identifies the chosen difficulty without horizontal overflow. At the tested desktop and phone viewports, including the wider-but-shorter 412×839 boundary, the complete closed-shortcuts game shell fits the available height without an unnecessary vertical scrollbar. The tool row uses consistent outline icons with visible labels when space permits and switches to icon-only controls on phone widths; every control retains its full accessible action name and no label wraps or escapes its button. At phone widths, Pause and New puzzle share equal dimensions. At a short wide viewport representative of display scaling, the board and controls share a top edge while the document scrolls and keeps the footer after the complete gameplay area. Dragging one active game through wide, narrow, short, and breakpoint-adjacent viewport sizes keeps the board and cells square, prevents board/control overlap and horizontal overflow, keeps all three candidate-note rows inside each cell, and centers any height-constrained desktop board within the layout track to the left of the controls.

**Automation:** `tests/app-shell.spec.ts`.

## Theme Preference and State Coverage

**Action:** At desktop and phone widths, enter with a dark operating-system preference, switch through System, Light, and Dark, reload, then inspect welcome, invalid gameplay, replacement-dialog, loading, and solved-completion surfaces.

**Expected:** System resolves to the current operating-system preference. An explicit Light or Dark choice persists across refresh and remains stable when the system preference differs. Every surface uses the selected semantic token set without layout overflow; board boundaries, selected/focused cells, pending and invalid values, notes/candidates, controls, dialogs, loading, and completion retain the same precedence and non-color cues. Native controls advertise the resolved color scheme, and the compact Theme control remains keyboard and screen-reader accessible at phone widths.

**Automation:** `tests/app-shell.spec.ts`.

## Enter Values and Notes

**Action:** Before selecting a cell, inspect and press an available touch number-pad digit. Select a given and try both pad and keyboard input. Then select an editable cell and enter a digit through the pad. Enter the same value again, enable Notes on that non-empty cell, and try both pad and keyboard note input. Select another empty editable cell and enter a candidate. Enter the same invalid digit in several cells, then enter it in a valid cell. Fill the ninth non-invalid instance of that digit, then try it through both the number pad and keyboard.

**Expected:** Available number-pad digits stay enabled without a board selection and pressing one prompts the player to select an editable cell without sending an API action or choosing a cell arbitrarily. Selecting a given disables every number-pad digit, and keyboard entry cannot bypass the guard. Each valid state-changing interaction sends one typed action with the current authoritative revision. Re-entering the selected cell's existing value sends no request and leaves the controls stable. Notes mode exposes its pressed state, changes the number pad to a muted note-specific treatment and accessible name, and disables every note digit while the selected cell is non-empty; keyboard entry sends no action in that state. Selecting an empty editable cell enables valid note input, and candidate digits remain legible on a phone without resizing the board. Erase is disabled with no selection, on givens, and whenever the selected editable cell has no content removable in the current mode; it becomes available when the current mode has value or note content to clear. The API response enables undo without modifying givens. Invalid duplicates do not count toward digit completion or block a valid entry. Each server-confirmed invalid value entry increments the informational mistake count; note and hint actions do not. Undo, Redo, and erase leave the count unchanged, refresh restores it from the active API session, and a newly created puzzle starts at zero. A digit shown nine non-invalid times in the authoritative snapshot disables its number-pad button, and keyboard entry cannot bypass that guard.

**Automation:** `tests/app-shell.spec.ts`.

## Automatic Candidates

**Action:** Start with automatic candidates disabled, enable them through the Candidates control at desktop and mobile widths, refresh the active puzzle, and inspect a cell containing different saved notes. Enable Notes and rapidly toggle two displayed candidates while the adoption response is delayed, then Undo and Redo the result before starting a new puzzle while observing API traffic.

**Expected:** Enabling the display reveals only authoritative `snapshot.candidates`, hides saved manual notes without deleting them, uses a quieter visual and an explicit automatic-candidate accessible label, and sends no gameplay mutation. The first digit edit while Notes and Candidates are active sends one `adopt-candidates-as-notes` action without a confirmation dialog, immediately presents the API-supplied grid as editable notes, and turns candidate preview off. Further rapid toggles amend that visible note draft and serialize one complete `set-notes` action behind adoption; they never enqueue another adoption or disappear when its response arrives. The authoritative result materializes the complete candidate grid as notes, applies the initiating toggle, keeps Notes on, and announces the concise one-line status “Candidates copied. Notes on.” One Undo restores the complete prior manual-note map, and Redo reapplies the adoption. The browser remembers candidate preview for the same active puzzle until adoption or an explicit toggle turns it off, while every newly created puzzle starts with Candidates and Notes off and the other browser-only modes at their defaults.

**Automation:** `tests/app-shell.spec.ts`.

## Stable Board Geometry and State Precedence

**Action:** Measure the board and all 81 cells, enter invalid digits 1 through 5 from the keyboard, then repeat the desktop player's normal mouse-click and keyboard-entry rhythm across several empty cells while action responses overlap the next pointer press. Assert selection at pointer press before completing the click. Add a note, erase the value, and select a given digit with pointer and arrow navigation at desktop and mobile widths.

**Expected:** Desktop pointer intent selects the new cell before release, and each later digit targets that cell in both the visible board and the authoritative API action, never the previously invalid cell. Keyboard focus agrees with the selected cell after every completed click. Every board and cell bounding box remains fixed while content changes. Keyboard entry retains focus with a clean solid focus cue rather than a dotted or dashed artifact. Every tested invalid digit uses red ink plus the same complete, fixed-position marker below the glyph and exposes `aria-invalid`; the cue does not depend on text-decoration metrics, become a spellcheck wave, or add a decorative corner marker. The square gameplay board keeps corner-cell selection aligned with the grid. The selected cell is never also styled as a peer or match, peer highlighting remains observable, matching committed values and candidate notes use a quiet circular digit halo rather than a competing fill, and an empty selected cell produces no matches.

**Automation:** `tests/app-shell.spec.ts`.

## Interaction Paths

Keyboard navigation, digit entry, note-mode toggle, automatic-candidate toggle, erase, pause/resume, and standard platform Undo/Redo shortcuts share the same action controller as pointer controls and remain available while the page has focus, even when the board does not. `Ctrl`/`Cmd`+`Z` sends an authoritative undo only when the snapshot permits it; `Ctrl`/`Cmd`+`Shift`+`Z` and `Ctrl`+`Y` similarly send redo. `P` pauses and resumes while all mutation shortcuts remain blocked during pause. A native disclosure exposes the complete shortcut guide to keyboard and assistive-technology users. The 81-cell grid exposes one roving tab stop: Tab enters and selects the current cell, arrow keys move inside the grid, and the next Tab reaches the number pad without traversing every cell. Candidate notes remain visually compact while their values are included in the cell's accessible name. A new or restored board starts without a selection, clicking outside the board clears the highlight, and the first arrow key selects the first editable cell before subsequent arrows navigate normally. Arrow navigation moves DOM focus and selection together, and the selected/focused cell uses the same border treatment as pointer and touch selection rather than leaving a second focus box behind. Undo, redo, and hint availability come directly from the returned snapshot rather than browser-derived history. The geometry and visual-state scenario runs at desktop and narrow mobile widths and asserts the rendered keyboard-focus style; reduced-motion behavior remains a CSS-level invariant.

## Serialized Action Responsiveness

**Action:** Delay action responses, enter values rapidly in different cells, then queue repeated hints and history commands before earlier responses settle.

**Expected:** Each value appears immediately with an accessible checking state before the server responds. Requests remain strictly serialized, and every request carries the revision returned by the preceding response. The first authoritative invalid result remains visible while later cells are pending, and no later response overwrites or conceals it. Repeated hints and history commands preserve their input order while the elapsed timer continues independently. A revision conflict reloads the authoritative board; a transport failure removes dependent projections and exposes a retry for only the failed intent.

**Automation:** `tests/app-shell.spec.ts`.

## Pause, Time, and Refresh Recovery

**Action:** Start a game, issue rapid consecutive hints while API mutations disable conflicting controls, let elapsed time advance, hide and restore the page, pause, wait, refresh the page, and resume at desktop and mobile widths.

**Expected:** Elapsed time continues across in-flight and completed API mutations without restarting its clock. Hiding the page stops the timer until it is visible again without changing the explicit pause state. Pause conceals the board and stops the timer. Refresh shows a neutral loading state instead of flashing the welcome surface, reloads the opaque active session from the API, preserves paused timer state, and shows the restored authoritative board after resume.

**Automation:** `tests/app-shell.spec.ts`.

## Service Failure and Retry

**Action:** Make an otherwise valid move while the game service returns a temporary server failure, then use the offered retry.

**Expected:** The last confirmed board remains visible, the message explains that the board is safe, and the named retry sends the move again. Revision-conflict recovery continues to reload the authoritative session rather than replay stale state.

**Automation:** `tests/app-shell.spec.ts`.

## Leave and New Puzzle Confirmation

**Action:** From an active game, click the site logo, dismiss the leave confirmation, then confirm a return to the front page. Start another game, request a new puzzle, choose a different difficulty in the dialog, confirm it while the session response is delayed, and inspect the transition.

**Expected:** Each confirmation receives focus on its safe action and traps keyboard focus. Dismissal returns focus to the initiating logo or button and keeps the unchanged board. Confirming the logo action clears the active pointer and shows the welcome surface without creating a session. The new-puzzle dialog exposes all levels and creates exactly one session at the newly selected difficulty only after confirmation. While that request is pending, a named loading state replaces the stale board and controls; the new board appears only after the API response.

**Automation:** `tests/app-shell.spec.ts`.

## Solved Completion

**Action:** Apply a move whose authoritative response changes the session status to solved.

**Expected:** The completion message is announced, elapsed time stops, and mutation controls leave the interface. Focus moves from the removed grid cell to the completion heading, whose visible focus cue and accessible name communicate the solved time. The completion panel preserves the final time and offers direct actions to start another board at the same level or return to level selection without an unnecessary confirmation.

**Automation:** `tests/app-shell.spec.ts`.

### Input-method gameplay state matrix

**Strategy:** Cover semantic state transitions and timing boundaries rather than attempting the unbounded Cartesian product of every action sequence. Run the same high-value player journey independently with keyboard, mouse, and touchscreen; combine it with delayed responses, single and rapid input, additions and removals, mode changes, candidate adoption, erase, history, and valid/invalid authoritative results. Dedicated scenarios separately cover pause, refresh, failure/retry, completion, navigation protection, and responsive geometry.

**Action:** In each input-method-only run, start a game and select an editable cell without borrowing another device path. First enable Candidates and Notes, then immediately enter 1, 2, and 3 into a cell whose automatic candidate set contains none of those digits, without waiting between inputs; verify the initiating adoption edit and both follow-up additions survive. Continue with single-note add/remove, rapid additions, and rapid mixed edits while one complete-set save is debounced. Erase the full note set. Enable Candidates again and begin adoption by removing an existing candidate, then add a non-candidate note while adoption is delayed. Return to value mode, enter an invalid value and a valid value, erase the valid value, then Undo and Redo.

**Expected:** All three runs produce the same visible states, exact API actions, and consecutive revisions. Keyboard and mouse use canonical click activation. Touch and pen commit on release, with a touch-event fallback when the browser omits pointer-type metadata; the first click inside the short post-touch window is suppressed even when the browser omits pointer type, click detail, and coordinates. Each completed activation occurs exactly once, and the first digit after a Notes mode change uses the new mode even before React renders again. Empty, one-digit, and multi-digit note sets use one `set-notes` wire action; rapid mixed note edits converge to the exact latest set; note erase saves an empty set. Candidate adoption emits exactly one adoption followed by one complete latest note set, preserving both the initiating removal and the non-candidate addition made while adoption is pending. Invalid and valid values retain distinct authoritative styling, erase is serialized, and Undo/Redo preserve input order.
