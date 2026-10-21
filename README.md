# RansomReady

**Assess. Detect. Improve.**

RansomReady is a college project addressing NTRO problem statement 317: a Ransomware Readiness Assessment tool. Ransomware can disrupt an organisation’s operations and access to critical data. The project aims to help organisations understand their preparedness, identify gaps, and prioritise improvements. Phases 1 and 2 provide the secure desktop foundation, navigation shell, Home and About pages, and placeholders for future features. Phase 3 adds a bundled question bank. Phase 4 adds the assessment wizard, automatic draft saving, resume support, review and completed-answer storage. Phase 5 adds scoring, maturity levels and prioritised recommendations. Phase 6 adds the results dashboard and SVG charts. The scanner, reports and history belong to later phases.

## Tech stack

- Plain JavaScript and React for the renderer
- Vite with the React plugin for development and UI builds
- Electron for the desktop shell
- Plain CSS with an OS-aware, persistent light/dark theme toggle
- lucide-react for icons
- concurrently, wait-on and cross-env for portable development scripts

No database, external API integration, custom native modules or packaging tools are used.

The npm override selects a patched `shell-quote` version for concurrently's development scripts; see [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv).

## Architecture

```text
React UI (renderer) <-> preload (contextBridge) <-> IPC <-> Electron main process
     App.jsx              preload.cjs        handlers.cjs       main.cjs
```

The renderer receives only six methods: `getAppInfo`, `saveDraft`, `loadDraft`, `clearDraft`, `saveAssessment` and `getLatestAssessment`. App info includes the app name, version, runtime versions and `dataPath`. The renderer has no direct Node access: context isolation and sandboxing are enabled, and Node integration is disabled. Electron files use CommonJS (`.cjs`) because the project uses `"type": "module"`.

## Architecture: data storage

The renderer never touches the file system. React calls `window.api`, the preload forwards the specific operation through IPC, and the main process uses `electron/storage.cjs` to write JSON under `app.getPath('userData')`. No assessment data is stored in localStorage, the project directory or the app bundle. The storage module has no Electron imports and accepts a base directory so tests can use a temporary folder.

Files inside userData:

- `draft.json`: current answers, organisation/assessor names, wizard stage and current step, `startedAt`, and `savedAt`.
- `assessments/assessment-<timestamp>.json`: completed answers plus `id` and ISO `completedAt`.

Drafts save after about 500 ms of inactivity. Storage validates payloads and size, queues operations, and writes a temporary file then renames it over the destination. Missing or corrupt drafts return `null`. Submission saves the completed assessment before clearing the draft. Failed submission keeps answers available for retry; cleanup failures are shown separately.

The expected macOS location is `~/Library/Application Support/RansomReady`. The runtime is authoritative; print the actual folder in Electron DevTools with:

```js
(await window.api.getAppInfo()).dataPath
```

Verified development path on this Mac: `/Users/arnav/Library/Application Support/RansomReady` (returned by `getAppInfo().dataPath`).

Electron may also create its own preferences/cache files in this folder. The app never writes assessment files into the packaged read-only `.dmg`.

Run storage tests (Node built-ins only; temporary files are cleaned up):

```sh
npm run test:storage
```

## Run locally

Install a current Node.js LTS release (22.12 or newer) and Git first. The initial dependency installation needs internet access to download Electron and npm packages.

```sh
git clone https://github.com/CodeCatalyst-07/ransomready.git
cd ransomready
npm install
npm run dev
```

Vite starts on `http://localhost:5173`. Electron waits for Vite, then opens the app and DevTools. Keep this terminal running. Stop development with Ctrl+C; on macOS this also stops Electron if closing its window leaves it running. Port 5173 must be available. React edits refresh automatically; restart `npm run dev` after changing Electron or preload files.

Build the UI:

```sh
npm run build
```

Build and open the desktop app using `dist/index.html`:

```sh
npm start
```

This is a local production-like run, not an installer or packaged release. A browser preview at the Vite URL works too; its About page displays a friendly runtime message because Electron's bridge is only available in the desktop window.

## Project structure

- `src/App.jsx`: holds the current page state and looks up its component.
- `src/config/`: navigation, answer options and domain icon mappings. Register a new page in the navigation list.
- `src/data/`: bundled domain and question JSON files.
- `src/utils/questionBank.js`: sorted domains, questions and lookup/count helpers.
- `src/config/maturityLevels.js`: five maturity levels and their shared lookup helper.
- `src/utils/scoring.js`: pure scoring, critical-gap cap and recommendation functions; no UI or bundled data imports.
- `src/utils/scoreAssessment.js`: connects the pure engine to the real question bank for the UI.
- `scripts/test-scoring.mjs`: scoring tests using Node built-ins.
- `scripts/validate-questions.mjs`: question bank validation using Node's built-in modules.
- `scripts/test-storage.cjs`: storage tests with isolated temporary files.
- `electron/storage.cjs`: validated, atomic JSON storage; `electron/ipc/handlers.cjs` registers the storage calls.
- `src/hooks/useAssessment.js`: reducer, progress helpers and debounced auto-save.
- `src/components/assessment/`: intro/resume, domain questions, progress, review and completion screens.
- `src/hooks/`: the theme hook reads a saved choice or OS preference, applies `data-theme`, and safely saves the choice under `ransomready-theme`.
- `src/components/`: shared layout, sidebar, header, theme toggle and placeholder card.
- `src/pages/`: Home, About, the Assessment wizard, Dashboard and two feature placeholders.
- `src/styles/`: layout and component CSS; global reset, spacing and theme variables live in `src/index.css`.

Navigation uses React state without a router. Use Tab / Shift+Tab to move through buttons and Enter / Space to activate them. The header's theme button switches light/dark mode; the choice survives restarts when localStorage is available.

## Verify the setup

In the Electron window, visit all six sidebar pages and check that the active item and header agree. Home's Start Assessment button opens the wizard with 32 questions across 8 domains. Enter an organisation, answer some questions, wait for auto-save, quit Electron completely and reopen to check the Resume card, answer count and saved step. Next requires all four answers; incomplete earlier domains block jumping ahead. Radio buttons support arrow keys; Tab reaches navigation buttons and the expandable explanations. Complete all 32 answers, review/edit, then submit: the completion screen shows the overall percent, maturity badge and a View dashboard button; a JSON file containing answers and metadata (no scores) exists in userData/assessments, and draft.json is removed. All Yes should give 100% / Level 5 (Resilient); all No should give 0% / Level 1 (Initial). Toggle the theme on that page and restart the app to check persistence. The About page should show real Electron, Node and Chrome versions. In DevTools, check:

```js
Object.keys(window.api)     // getAppInfo, saveDraft, loadDraft, clearDraft, saveAssessment, getLatestAssessment
await window.api.getAppInfo() // App metadata and runtime versions
window.require              // undefined
window.process              // undefined
```

Confirm that the console has no errors or warnings. `npm run build` should complete successfully, and `npm start` should show the same versions from the built UI. Without a saved theme, the initial screen follows your operating system's light or dark preference.

## Question bank

The app imports `src/data/domains.json` and `src/data/questions.json` through Vite, so the data is bundled with the UI and is not read from disk at runtime. The Assessment wizard uses these bundled domains and questions; Completed files store answers only; Phase 5 calculates scores from those answers whenever results are needed.

`domains.json` is an array of 8 objects:

| Field | Meaning |
| --- | --- |
| `id` | Unique domain ID: `backup`, `access`, `patching`, `email`, `network`, `detection`, `incident` or `awareness` |
| `name` | Display name |
| `description` | One-sentence description |
| `order` | Display order, from 1 to 8 |

`questions.json` is an array of 32 objects, with exactly 4 per domain:

| Field | Meaning |
| --- | --- |
| `id` | Unique ID using the domain prefix (`BKP`, `ACC`, `PAT`, `EML`, `NET`, `DET`, `INC`, `AWR`) and number `01` to `04`, such as `BKP-01` |
| `domainId` | ID of the domain the question belongs to |
| `text` | Plain-language yes/no question beginning with “Does your organisation...” or “Are ...” |
| `why` | One or two plain sentences explaining why the topic matters against ransomware |
| `recommendation` | One actionable imperative sentence for answers other than Yes |
| `weight` | Priority: `3` = critical, `2` = important, `1` = good practice |

Every domain includes at least one critical question. Weights express this project's relative priorities and feed the scoring engine.

`src/config/answerOptions.js` defines the answer options and scoring values: Yes, fully in place = `1`; Partially in place = `0.5`; No = `0`; Not sure = `0`. Not sure counts as zero because not knowing whether protection exists is itself a gap. The scoring engine reads these values from configuration.

`src/utils/questionBank.js` exports `domains` sorted by order, `questions`, `getQuestionsByDomain(domainId)`, `getQuestionById(id)`, `getDomainById(id)` and `getTotalQuestionCount()`. Unknown question or domain lookups return `undefined`; an unknown domain's question list is empty. `src/config/domainIcons.js` maps domain IDs to icons and exports a fallback icon for unknown IDs.

Validate the data without starting Electron:

```sh
npm run check:data
```

The validator checks the domain schema and IDs, unique question IDs and prefixes, required non-empty text fields, question wording, domain references, valid weights, four questions and at least one critical question per domain, and the total of 32 questions. It prints PASS or FAIL messages and exits with code 1 on failure.

The questions are based on widely recommended good-practice guidance and are not a formal compliance certification. Background references include the [CISA #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide) and [CERT-In's official incident reporting contact information](https://www.cert-in.org.in/s2cMainServlet?pageid=CONTACTUS); organisations should consult CERT-In's current official reporting steps when maintaining their response contacts.

## Scoring methodology

Question points = weight × answer score; maximum points = weight. Weights are **3 = critical**, **2 = important**, **1 = good practice**. Answer scores are **Yes = 1**, **Partial = 0.5**, **No = 0**, **Not sure = 0**.

Domain percent = (domain points / domain maximum points) × 100. Overall percent = (total points / total maximum points) × 100 across all questions, rather than an average of domain percents. Each percent is rounded once to one decimal place with `Math.round(value * 10) / 10`; that rounded number is also used for level lookup.

| Level | Name | Percent range |
| --- | --- | --- |
| 1 | Initial | 0–24.9 |
| 2 | Developing | 25–49.9 |
| 3 | Defined | 50–69.9 |
| 4 | Managed | 70–84.9 |
| 5 | Resilient | 85–100 |

A critical gap is a weight-3 question answered No or Not sure. With three or more critical gaps, the overall level cannot exceed Level 2 (Developing). The percent stays unchanged and the summary explains any applied cap. Individual domain levels are never capped.

Every answer other than Yes produces a recommendation. Its priority score is `weight × (1 - answer score)`. Recommendations sort by this score descending, then weight descending, then domain order ascending, then question ID ascending. Labels come from weight: 3 = High, 2 = Medium, 1 = Low. The dashboard shows the first eight matching recommendations, with a Show all toggle and priority/domain filters.

Scores are never stored in saved files. Only answers are stored as assessment responses, alongside the existing metadata, so assessments can be re-scored when the methodology changes. The weights and level thresholds are design choices made for this project, not an official industry standard.

Run the scoring tests without Electron or a bundler:

```sh
npm run test:scoring
```

## Dashboard

The Dashboard loads the latest completed assessment through `window.api.getLatestAssessment()`. Results are always recalculated from saved answers with `scoreAssessment`; scores are never stored. Loading, empty, unavailable desktop bridge, storage error (with Retry), and unscorable older-assessment states are handled without crashing.

`src/components/dashboard/` contains reusable components that receive props and never fetch data:

- `DashboardHeader`: organisation, assessor, local completion date, maturity cap notice and Reassess action.
- `ScoreGauge` and `RadarChart`: overall percentage and eight domain scores, with accessible chart labels and a screen-reader domain table.
- `DomainBars`, `StatsRow` and `WeakAreas`: domain scores and levels, answer counts, gap counts and three weakest domains.
- `RecommendationsPanel`: priority/domain filters, readable current answers and an eight-item expandable list.
- `DashboardEmpty`: a Start assessment action when no completed assessment exists.

Charts use plain SVG and CSS with no chart library or new dependencies. Geometry and filtering helpers live in `src/utils/chartMath.js`. Both themes use the existing shared colour variables; charts show numbers or level names alongside colour, bars expose progress values, and transitions respect reduced-motion preferences.

Run the chart helper tests (Node built-ins only):

```sh
npm run test:chartmath
```

For a manual check, finish an assessment and select View dashboard. Check the gauge, radar, eight domain bars, five statistics, weakest areas and recommendations. Try both filters, Show all / Show fewer and a filter combination with no matches. All Yes should show 100% and “No gaps found. Keep testing and improving.”; all No should show 0%, Level 1 and radar vertices at the centre. Check light/dark themes, narrow widths, keyboard focus and visible radar labels. Reassess opens the Assessment page, where an existing draft can still be resumed.

## Roadmap

- [x] Phase 1: Setup
- [x] Phase 2: UI shell
- [x] Phase 3: Question bank
- [x] Phase 4: Assessment wizard
- [x] Phase 5: Scoring engine
- [x] Phase 6: Dashboard and charts
- [ ] Phase 7: Early-sign scanner
- [ ] Phase 8: Reports, history and polish
