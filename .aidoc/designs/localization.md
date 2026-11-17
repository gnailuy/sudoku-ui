---
domain: Designs
status: Active
entry_points:
  - src/App.tsx
  - src/api/client.ts
  - src/api/types.ts
dependencies:
  - .aidoc/architecture/web-client.md
  - .aidoc/designs/game-experience.md
  - .aidoc/designs/e2e-scenarios.md
---

# Web Localization

The Sudoku web client provides complete presentation for every locale registered in `src/i18n/locales.ts`. The browser owns locale selection and translated presentation while the Go API remains locale-neutral and supplies stable message descriptors with plain-English fallback text.

## Related Docs

| Document                                                                                                             | Relationship                                                               |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Architecture](../architecture/web-client.md)                                                                        | Browser/backend ownership and persistence boundary                         |
| [Game experience](game-experience.md)                                                                                | Complete visible and accessible product surface to localize                |
| [E2E scenarios](e2e-scenarios.md)                                                                                    | Browser and real-stack acceptance owner                                    |
| [Backend localization contract](https://github.com/gnailuy/sudoku/blob/main/.aidoc/designs/localization-contract.md) | Canonical message IDs, typed arguments, and English fallback wire contract |
| `src/api/types.ts`                                                                                                   | Generated-compatible descriptor and argument unions                        |
| `src/components/`                                                                                                    | Visible and accessible presentation surfaces                               |

## Product Scope

`src/i18n/locales.ts` is the canonical production-locale registry. The runtime catalog loader maps every registered locale to one complete dynamically imported catalog, while the eager test registry validates the complete set together. English is the source, synchronous fallback, and only catalog in the initial application graph. The selector and browser negotiation expose only entries that satisfy the catalog, ICU, accessibility, and responsive acceptance gates in this document.

Spanish stays neutral/international, Portuguese stays Brazilian Portuguese, and Chinese region tags resolve to independent Simplified or Traditional script catalogs. Add a regional catalog only after recurring product-language differences justify independent translation and review; never transform one regional catalog into another at runtime.

Completeness means the same player journey is available in every locale: welcome, difficulty selection, active game, board labels, controls, shortcuts, candidates, hints, errors, loading and transaction states, confirmations, pause, completion, account entry, My games, account settings, and assistive announcements. A partially translated surface is not shippable.

The line CLI and TUI remain English-only and belong to the backend design. This client does not send its locale to the API and does not ask the server to translate responses.

## Localization Runtime

Use FormatJS through `react-intl`. ICU MessageFormat supplies named interpolation, plural/select behavior, and translator-controlled argument order. A repository-owned wrapper exposes typed message IDs and formatting helpers so components do not call catalog internals or assemble sentences from fragments.

Catalogs are organized by stable product domains rather than component filenames: `common`, `welcome`, `game`, `hints`, `account`, `errors`, and `accessibility`. Moving a component does not rename its messages. IDs use lowercase dotted names and describe meaning rather than English wording or layout.

English source messages live in the same catalog format as every translated locale. There is no parallel hard-coded English path. Development and tests fail on a missing ID, invalid ICU syntax, missing or extra named arguments, or catalog drift. Production falls back to English only for a valid known ID that is absent from a selected catalog; release validation forbids that state for every supported catalog.

## Locale Selection and Persistence

The header exposes one compact language control on every welcome, game, loading, completion, and account surface. It contains Auto plus every locale in the canonical production registry. Language names are self-named so a player can recover after choosing an unfamiliar locale. Auto remains first; the production languages then use one stable alphabetical order by their English language names, independent of the currently selected locale. The automatic language choice is visibly named Auto, while the neighboring automatic appearance choice is named System to match its computer icon and operating-system behavior. The native menu keeps every complete self-name, including Português (Brasil), while the closed control uses an approved compact self-name when needed, such as Português, to preserve header space without hiding the exact choice. The closed value is visually centered within the control rather than biased by the disclosure arrow. Pointer selection dismisses the native selector and its transient focus treatment; keyboard selection retains visible focus and exposes the current selection and expanded state without relying on color.

The browser persists only `auto` or a value from the canonical production-locale registry in a versioned local preference key. It is a global presentation preference, not game state, account data, or history. Changing language loads the selected catalog chunk and updates the current surface in place without a reload, API request, timer interruption, board mutation, or loss of focus context. The current complete catalog remains rendered until the requested catalog is ready, so an asynchronous load never unmounts or replaces gameplay state.

Browser negotiation reads `navigator.languages` in order and resolves the first recognized language. Ordinary language and region tags resolve through the canonical registry. English remains first-match significant, so a primary English preference wins over a later installed language pack. Chinese region tags resolve to the corresponding Simplified or Traditional script catalog, legacy Tagalog tags resolve to Filipino, Portuguese tags resolve to Brazilian Portuguese, and unsupported values fall back to English.

The app listens for browser language changes only while Auto is selected. An explicit choice ignores later browser preference changes until Auto is restored.

`document.documentElement.lang` always reflects the resolved locale. Direction comes from locale metadata: Arabic sets right-to-left document direction, while every other production locale remains left-to-right. Date, number, and list formatting use `Intl` with the resolved locale; Sudoku coordinates, digits, timers, and product identifiers retain their defined domain format unless the catalog message explicitly formats them.

## API Message Rendering

An API message descriptor contains a stable `id`, closed typed `arguments`, and a complete English `text` fallback. The client validates the entire descriptor before formatting it.

For a known ID with valid arguments, the browser renders the selected catalog message and ignores `text`. For an unknown ID or a catalog-version mismatch, it displays the backend's bounded English `text` so the action remains understandable. For a malformed descriptor, it displays the client's localized generic failure and never serializes raw response data into the page.

Typed backend arguments map to ICU values through one adapter. Cell, candidate, row, column, box, difficulty, and strategy arguments use locale-aware product formatters rather than preformatted backend prose. Ordered non-empty `digits`, `cells`, `candidates`, and `units` collections format each typed item first and then use the active locale's conjunction rules; a one-item collection remains a valid grouped value without replacing the distinct scalar argument contract. The adapter does not infer Sudoku meaning from an ID, parse fallback text, or reconstruct a hint from scene metadata.

Hint scenes, targets, links, marks, effects, plan identity, and step order remain unchanged. Literal narration chunks become localizable message descriptors; digit and target chunks remain typed. The hint renderer may reorder localized words around those semantic references, but it cannot move reasoning or conclusion selection out of the backend.

Known API error descriptors map through the same catalog. Stable error codes still drive retry and control behavior. The player sees localized copy for known failures, English fallback for a newer unknown descriptor, and a localized generic message for malformed or unsafe responses.

## UI String Ownership

Every authored player-facing string moves behind the localization boundary, including:

- text nodes, headings, button labels, dialog copy, status text, empty states, and notices;
- `aria-label`, `aria-description`, live-region announcements, validation explanations, focus-transition context, and hidden screen-reader text;
- difficulty and strategy display names, hint titles, step messages, legends, target descriptions, and keyboard help;
- loading, saving, claiming, restarting, refreshing, undoing, redoing, retry, and destructive-confirmation states; and
- document title, metadata under application control, account labels, game summaries, and elapsed-time phrasing.

Brand names, personal profile data, email addresses, opaque game IDs, and server-provided user content are not translated. CSS class names, test IDs, log messages, internal error details, and analytics-free diagnostics are not catalog entries.

Components request complete messages, not fragments. Translators control word order and plurality; code does not concatenate translated nouns, punctuation, or coordinates. Reusable labels such as difficulty and strategy names have one catalog owner and are referenced by stable domain IDs.

## Native Editorial Quality

Each production catalog is edited as native product copy rather than as a word-for-word transformation of English. Review preserves the product intent, action and result, level of formality, and accessibility meaning while allowing sentence structure, idiom, punctuation, coordinate order, and repeated or omitted nouns to differ by locale.

Each catalog owns a consistent vocabulary for recurring product concepts such as Notes, candidate visibility, Sudoku units, difficulty, strategy names, account actions, devices, and storage. Established borrowed terms may be more natural than literal translations; whichever choice native review accepts is used consistently across visible and assistive text. Cross-locale parity applies to meaning and state, not syntax or word count.

English is the source of product intent and the bounded runtime fallback, not a sentence template. Translators rewrite the complete thought around typed ICU arguments. They may combine repeated clauses, shorten coordinate lists that the scene already makes clear, and choose natural verbs or sentence boundaries, but they do not change the deduction, action, safety consequence, or distinction between product concepts. Regional or script variants are independently reviewed catalogs rather than runtime conversions because natural terminology and phrasing may differ beyond character forms.

### Translation Review Gate

A design or pull request cannot claim exact translated copy until each affected locale passes a complete editorial review after the source meaning and typed arguments are stable. Review the full user journey or teaching sequence in context rather than approving isolated catalog lines.

For every affected locale:

1. Read the translated sequence without looking at English. Rewrite any sentence that sounds translated, forces English grammar onto the locale, repeats a quantifier or noun unnaturally, or makes the reader decode a long coordinate list.
2. Compare the rewritten sequence with the English intent, typed arguments, scene, and resulting action. Confirm that shortening or regrouping did not lose a condition, target, count, causality, or safety consequence.
3. Check the locale's established glossary, coordinate vocabulary, punctuation, spacing, formality, and strategy naming across both visible and assistive text. Review Simplified Chinese and Traditional Chinese independently; character conversion is not editorial review.
4. Read adjacent steps together. Each step must add one clear idea, refer naturally to facts already visible in the scene, and avoid restating the complete premise when a shorter native reference is unambiguous.
5. Record the reviewed locales, complete message scope, review method, and any intentionally borrowed terminology in the pull request evidence. If language feedback exposes awkward copy during design review, pause implementation and revise the complete affected sequence before seeking approval again.

Reject literal calques even when they are grammatically parseable. Warning signs include English-driven subject order, stacked nominal phrases, mechanical one-to-one synonyms, redundant forms equivalent to “all each,” and abstract labels where the locale would state the concrete Sudoku consequence directly. A fluent reader should understand the reasoning on the first pass without consulting English.

Automated checks prove catalog completeness, ICU validity, argument parity, runtime wiring, and that backend-owned reasoning prose does not silently reuse the English fallback in a non-English production catalog. They do not prove that prose sounds native. Release evidence therefore reports mechanical catalog checks and locale editorial review separately; screenshots prove fit and context, not linguistic quality.

Layouts do not assume any locale is shorter than English. Controls permit bounded growth, dialogs wrap without hiding actions, and accessible names remain complete even when visible labels use an approved compact form.

## Accessibility and Responsive Behavior

Language switching preserves the focused semantic control when it still exists. If a translated state transition replaces that control, focus follows the same existing game-experience rule as the English surface. Live regions announce the new language once and do not replay the complete page.

Every locale retains keyboard access, roving board focus, non-color states, reduced motion, touch targets, and screen-reader equivalence. Candidate and hint target names must remain unambiguous in every production locale at desktop and phone widths. Locale changes cannot reopen dialogs, close hints, reset selection, alter Notes or Candidates state, or restart presentation time. The release bundles Devanagari glyph coverage for Hindi and Thai glyph coverage for Thai so rendering does not depend on fonts installed on the player’s device.

A pseudo-locale expands and decorates source messages to expose clipping, concatenation, and untranslated literals during development. It is test-only and never appears in the production selector. Screenshot acceptance covers every production locale plus pseudo-locale expansion so both compact and wide translations exercise the responsive layout.

## Catalog and Type Workflow

One extraction or registry command produces the canonical message-ID and argument manifest from repository-owned source declarations. CI compares every production catalog against that manifest and rejects missing IDs, extra stale IDs, argument-name drift, invalid ICU, and duplicate ownership.

Browser-authored IDs exist only while the product uses them. Removing the last call site also removes that ID from English and every translated catalog in the same change; catalogs are current product sources, not translation archives. The backend contract fixture contributes API-owned message IDs and argument schemas. The frontend manifest combines those IDs with browser-owned messages without copying backend English as frontend source authority. Coordinated backend changes update generated TypeScript unions, every production catalog, and representative descriptor fixtures together.

Each locale has one canonical, reviewable catalog file under `src/i18n/catalogs/`; the runtime loader exposes those files as independent application chunks without duplicating messages. Generated runtime bundles are build artifacts rather than canonical sources. English is available synchronously as the guaranteed fallback, and the resolved non-English catalog loads as a same-origin, content-hashed application chunk. CI inspects the build manifest to keep translated catalogs out of the initial static import graph and enforces the measured initial-JavaScript gzip budget.

## Implementation Boundary

`src/i18n/` owns locale negotiation, persisted preference, catalog validation, pseudo-localization, typed browser message references, and API descriptor formatting. Browser-authored status, retry, and error state stores typed catalog references rather than rendered English, so a locale change immediately rerenders existing feedback. The hint renderer consumes API-authored summary, step, and narration descriptors without retaining literal narration or parallel prose paths.

All production catalogs and the backend-owned descriptor manifest change together. The development-only pseudo-locale remains available through the explicit test query but is absent from the production selector and persisted preference vocabulary.

## Acceptance

Mechanical acceptance runs formatting, lint, unit tests, production build, documentation validation, catalog validation, generated-type checks, browser E2E, and the real React-plus-Go full-stack lane.

Semantic acceptance proves:

- every visible and assistive product message is owned by exactly one catalog entry;
- all production catalogs have identical IDs and argument contracts;
- API descriptors localize without parsing fallback English;
- unknown valid API IDs show bounded English fallback, while malformed descriptors show a localized generic failure;
- Auto and explicit preferences negotiate, persist, react, and update document metadata correctly;
- switching locale preserves authoritative game state, presentation state, timer behavior, focus, and open hint position;
- plural/select and target formatting are correct for representative errors, account summaries, elapsed time, hints, rows, columns, boxes, cells, candidates, strategies, and difficulties; and
- no API request varies by locale or emits `Accept-Language` as a gameplay contract.

Black-box journeys cover welcome, one guest game, one signed-in game, hint preview/application, retryable error, confirmation, completion, and language switching for every entry in the production-locale registry. Desktop and phone screenshots are captured and inspected for every production locale and pseudo-locale overflow. Accessibility checks verify document language, names, live regions, focus order, and keyboard operation in each production locale.

## Boundary

The web client does not translate the line CLI or TUI, localize API responses on the server, store locale in account or game records, translate logs, introduce community translation infrastructure, localize user content, or ship partial language catalogs.
