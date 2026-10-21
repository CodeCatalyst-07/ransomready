# RansomReady

**Assess. Detect. Improve.**

RansomReady is a college project addressing NTRO problem statement 317: a Ransomware Readiness Assessment tool. Ransomware can disrupt an organisation’s operations and access to critical data. The project aims to help organisations understand their preparedness, identify gaps, and prioritise improvements. Phases 1 and 2 provide the secure desktop foundation, navigation shell, Home and About pages, and placeholders for future features. Phase 3 adds a bundled question bank and a temporary read-only Assessment preview. The questionnaire wizard, scoring engine, charts and scanner belong to later phases.

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

The renderer only receives `window.api.getAppInfo()`. The preload invokes `app:get-info`, and the main process returns the app name, app version, and Electron, Node and Chrome versions. The renderer has no direct Node access: context isolation and sandboxing are enabled, and Node integration is disabled. Electron files use CommonJS (`.cjs`) because the project uses `"type": "module"`.

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
- `scripts/validate-questions.mjs`: question bank validation using Node's built-in modules.
- `src/hooks/`: the theme hook reads a saved choice or OS preference, applies `data-theme`, and safely saves the choice under `ransomready-theme`.
- `src/components/`: shared layout, sidebar, header, theme toggle and placeholder card.
- `src/pages/`: Home, About, the Assessment question bank preview and three feature placeholders.
- `src/styles/`: layout and component CSS; global reset, spacing and theme variables live in `src/index.css`.

Navigation uses React state without a router. Use Tab / Shift+Tab to move through buttons and Enter / Space to activate them. The header's theme button switches light/dark mode; the choice survives restarts when localStorage is available.

## Verify the setup

In the Electron window, visit all six sidebar pages and check that the active item and header agree. Home's Start Assessment button should open the temporary question bank preview with 32 questions across 8 domain cards, each showing 4 questions. Toggle the theme on that page and restart the app to check persistence. The About page should show real Electron, Node and Chrome versions. In DevTools, check:

```js
window.api                  // { getAppInfo: ... }
await window.api.getAppInfo() // App metadata and runtime versions
window.require              // undefined
window.process              // undefined
```

Confirm that the console has no errors or warnings. `npm run build` should complete successfully, and `npm start` should show the same versions from the built UI. Without a saved theme, the initial screen follows your operating system's light or dark preference.

## Question bank

The app imports `src/data/domains.json` and `src/data/questions.json` through Vite, so the data is bundled with the UI and is not read from disk at runtime. The Assessment page currently shows only domain summaries and question counts; answering questions starts in Phase 4.

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

Every domain includes at least one critical question. Weights express this project's relative priorities; they are data for the later scoring engine and do not calculate a readiness result in Phase 3.

`src/config/answerOptions.js` defines the future answer values: Yes, fully in place = `1`; Partially in place = `0.5`; No = `0`; Not sure = `0`. Not sure counts as zero because not knowing whether protection exists is itself a gap. These values are configuration only at this stage.

`src/utils/questionBank.js` exports `domains` sorted by order, `questions`, `getQuestionsByDomain(domainId)`, `getQuestionById(id)`, `getDomainById(id)` and `getTotalQuestionCount()`. Unknown question or domain lookups return `undefined`; an unknown domain's question list is empty. `src/config/domainIcons.js` maps domain IDs to icons and exports a fallback icon for unknown IDs.

Validate the data without starting Electron:

```sh
npm run check:data
```

The validator checks the domain schema and IDs, unique question IDs and prefixes, required non-empty text fields, question wording, domain references, valid weights, four questions and at least one critical question per domain, and the total of 32 questions. It prints PASS or FAIL messages and exits with code 1 on failure.

The questions are based on widely recommended good-practice guidance and are not a formal compliance certification. Background references include the [CISA #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide) and [CERT-In's official incident reporting contact information](https://www.cert-in.org.in/s2cMainServlet?pageid=CONTACTUS); organisations should consult CERT-In's current official reporting steps when maintaining their response contacts.

## Roadmap

- [x] Phase 1: Setup
- [x] Phase 2: UI shell
- [x] Phase 3: Question bank
- [ ] Phase 4: Assessment wizard
- [ ] Phase 5: Scoring engine
- [ ] Phase 6: Dashboard and charts
- [ ] Phase 7: Early-sign scanner
- [ ] Phase 8: Reports, history and polish
