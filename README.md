# RansomReady

**Assess. Detect. Improve.** A local desktop ransomware readiness self-assessment.

RansomReady is a college project addressing **NTRO problem statement 317**, a Ransomware Readiness Assessment tool. Ransomware can interrupt an organisation’s work and access to important data. This Electron + React app helps users review their current practices, identify gaps and prioritise improvements, with a separate read-only check for possible warning signs in file names. It uses plain JavaScript, plain CSS and local JSON storage, without a database or external service.

## Features

- Assessment: 32 questions across 8 domains, explanations, review, automatic draft saving and resume.
- Scoring: weighted answers, five maturity levels, critical-gap cap and prioritised recommendations. Scores are recalculated from saved answers, never stored.
- Dashboard: overall score, SVG radar chart, domain bars, answer counts, weakest areas and recommendation filters.
- Early-sign scanner: native folder selection, progress, cancellation, severity filters, Show in Finder and the latest saved scan. Checks names and metadata only.
- PDF report: export from Dashboard through the native save dialog, using Electron’s built-in `printToPDF`. Includes every recommendation and the latest scan when available; scan findings are limited to 25 in the report. Successful export reveals the PDF in Finder.
- Local-only storage: answers and the latest scan stay in Electron’s `userData` folder. The theme preference alone uses localStorage.
- Page error recovery: a friendly error card with Try again and Go to Home actions.

PDF export is on Dashboard. The existing Reports sidebar page remains a placeholder; no report or assessment history browser is implemented.

## Screenshots

**Placeholders — replace these with your own screenshots before submission:**

- [ ] Dashboard screenshot
- [ ] Assessment wizard screenshot
- [ ] Early-sign scanner screenshot
- [ ] Exported PDF report screenshot

## Architecture

```text
React UI (renderer)
        <-> preload.cjs (contextBridge, 13 named methods)
        <-> IPC (electron/ipc/handlers.cjs)
        <-> Electron main process
              |-- storage.cjs        <-> userData/ JSON files
              |-- scanner/           --> selected folder (read-only)
              |-- report/pdfExport.cjs
                    --> hidden window (JavaScript disabled)
                    --> printToPDF --> native-dialog-selected PDF destination
```

**Data flow:** answer questions → save draft/completed answers through the preload and IPC → main-process storage validates and writes JSON → `scoreAssessment` recalculates results in the renderer → Dashboard displays them → the pure `buildReportHtml` creates a standalone escaped HTML document → main process asks where to save → an isolated hidden Electron window prints A4 PDF → Finder reveals the saved file. Scan results load independently; an unavailable scan does not prevent the dashboard or report from working.

The storage module accepts its base directory, so Node tests use isolated temporary folders. Writes are queued and atomic: write a temporary file, then rename it over the destination. Submission saves a completed assessment before clearing the draft.

Files under `app.getPath('userData')`:

- `draft.json`: answers, organisation/assessor, wizard position and timestamps.
- `assessments/assessment-<timestamp>.json`: completed answers and metadata, with no stored scores. The UI uses only the latest completed assessment.
- `latest-scan.json`: latest scan, replacing the previous scan; no scan history.

On macOS this is normally `~/Library/Application Support/RansomReady`. The About page shows the actual path, also available through `(await window.api.getAppInfo()).dataPath` in Electron DevTools. Electron may create its own cache/preferences there too.

## Security design

- Main window: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- The renderer has no Node modules or raw IPC access; `window.require` and `window.process` are undefined.
- Strict CSP in `index.html`; new windows and page navigation are denied.
- Preload exposes exactly 13 named methods: `getAppInfo`, `saveDraft`, `loadDraft`, `clearDraft`, `saveAssessment`, `getLatestAssessment`, `chooseScanFolder`, `startScan`, `cancelScan`, `revealInFolder`, `getLatestScan`, `onScanProgress`, `exportReportPdf`.
- The renderer never supplies destination file paths or the scanner’s root path. Native dialogs in the main process choose them. Show in Finder accepts only a validated relative finding path inside the scanned root.
- The scanner is read-only: it lists directories and checks metadata, never opens file contents or intentionally follows symlinks, and never changes scanned files. Symbolic links are skipped, with containment checked again before revealing a finding.
- Report strings are HTML-escaped. Report CSP is `default-src 'none'; style-src 'unsafe-inline'; img-src data:`; no scripts or external resources are included.
- The hidden PDF window has JavaScript disabled, isolation/sandbox enabled, Node disabled, no preload, and denies navigation/new windows. Temporary HTML is removed and the window destroyed after success or failure.
- App data never leaves the computer through RansomReady. There are no network uploads, telemetry or external analysis services. PDF exports contain organisation and scan information; users control where they save or share them. Local JSON and PDFs are not encrypted by the app.

## Scoring methodology

Question weights are **3 = critical**, **2 = important**, **1 = good practice**. Answer values are **Yes = 1**, **Partial = 0.5**, **No = 0**, **Not sure = 0**. Points = weight × answer value. Overall percent = total points / total possible points × 100; each domain uses its own points and maximum. Percentages are rounded once to one decimal place before level lookup; overall is not an average of rounded domain percentages.

| Level | Name | Percent |
| --- | --- | --- |
| 1 | Initial | 0–24.9 |
| 2 | Developing | 25–49.9 |
| 3 | Defined | 50–69.9 |
| 4 | Managed | 70–84.9 |
| 5 | Resilient | 85–100 |

A weight-3 question answered No or Not sure is a critical gap. Three or more critical gaps cap the overall level at Level 2 (Developing), without changing the percentage. Domain levels are not capped.

Each non-Yes answer creates a recommendation. Priority score is `weight × (1 - answer value)`, sorted descending, then weight descending, domain order ascending and question ID ascending. Weight gives the High / Medium / Low label. The PDF groups recommendations by that label and preserves the engine’s order within each group. The dashboard supports filters and Show all.

Implementation details: [scoring engine](src/utils/scoring.js), [maturity levels](src/config/maturityLevels.js), [answer values](src/config/answerOptions.js), and [question bank](src/data/questions.json). The PDF’s Methodology and limits section repeats the scoring rules. The questions reflect widely recommended good practice; weights and thresholds are this project’s design choices, not an official standard.

## Project structure

```text
electron/
  main.cjs                 Secure app window and lifecycle
  preload.cjs              Named contextBridge operations
  ipc/handlers.cjs         IPC validation and error responses
  storage.cjs              Local atomic JSON storage
  scanner/                 Read-only scanner and sample indicator rules
  report/pdfExport.cjs     Native save dialog and isolated PDF printing
src/
  App.jsx                  Page navigation and error boundary
  components/              Layout, ErrorBoundary, assessment/dashboard/scanner UI
  pages/                   Home, Assessment, Dashboard, Scanner, Reports, About
  config/                  Navigation, answer options and maturity levels
  data/                    Eight domains and 32 questions
  hooks/                   Assessment state/save-resume and theme
  utils/                   Question helpers, scoring, chart maths, report HTML
  styles/                  Layout and component styles
scripts/                   Data validation, Node tests and harmless scan demo
index.html                 Renderer entry point and CSP
electron-builder.yml       Existing macOS packaging configuration
```

## How to run

Use Node.js **22.12.0 or newer** and npm. Initial dependency installation requires internet access.

```sh
git clone https://github.com/CodeCatalyst-07/ransomready.git
cd ransomready
npm install
npm run dev
```

Vite uses `http://localhost:5173`; Electron waits for it and opens DevTools. Keep port 5173 free. React edits refresh automatically; restart the app after Electron/preload changes. Stop with Ctrl+C to end both processes. A browser preview has no desktop bridge, storage or export access.

```sh
npm run build  # Build renderer into dist/
npm start      # Build and open the desktop app using dist/index.html
```

## How to test

Node tests use built-in modules; no additional test or PDF dependencies are required.

```sh
npm run check:data       # Question-bank schema and consistency
npm run test:storage     # Validation, atomic storage and failure handling
npm run test:scoring     # Percentages, levels, cap and recommendation ordering
npm run test:chartmath   # SVG geometry, filtering and weakest-domain helpers
npm run test:scanner     # Name rules, traversal, limits, cancellation, symlinks
npm run test:report      # HTML escaping, CSP, scores, domains and optional scan
npm run build            # Production renderer build
```

For a harmless scanner demo, run `npm run demo:scan-folder` and choose the printed temporary folder in Scanner. Expected demo counts are 2 High, 2 Medium, 1 Low across 9 files.

Manual desktop checks:

1. Complete an assessment, checking draft resume, review and submission. All Yes gives 100% / Level 5; all No gives 0% / Level 1.
2. Open Dashboard and export a PDF. Choose a location, open the saved PDF and inspect every section, chart and recommendation. Repeat with no saved scan and with a latest scan; only the latter includes the scan section. Cancel the save dialog and confirm no success/error message or file is produced.
3. Confirm export is disabled while busy; failures display a dismissible error and success displays a dismissible status message that clears after a few seconds.
4. For development verification only, temporarily throw an error while rendering a page. Confirm the fallback and navigation work, remove the throw, and check Try again. Never leave the throw in submitted code.
5. Check both themes, keyboard focus, Tab/Shift+Tab and Enter/Space. Inspect the console for unexpected errors/warnings. The deliberate boundary test should log its error.
6. In Electron DevTools, verify `Object.keys(window.api).length === 13`, `window.require === undefined`, and `window.process === undefined`.

## Packaging for macOS

Run on a Mac after `npm install`. Set the author in `package.json` before submission.

```sh
npm run pack           # Unpacked .app for smoke testing on this Mac
npm run dist:mac       # Universal DMG for Intel and Apple Silicon
npm run dist:mac:arm64 # Apple Silicon fallback
npm run dist:mac:x64   # Intel fallback
```

Output is in `release/`; unpacked apps are in architecture-specific subfolders. Disk images use `RansomReady-0.1.0-<arch>.dmg`. Open the DMG and drag RansomReady to Applications using the shortcut.

The app is **not signed with an Apple Developer certificate or notarized**. The existing configuration uses a local ad-hoc signature for Apple Silicon compatibility; this does not verify the developer’s identity. macOS may show an “unidentified developer” warning. For a trusted project build, right-click `/Applications/RansomReady.app`, choose **Open**, then confirm **Open**. Alternatively, for this trusted copy only:

```sh
xattr -cr /Applications/RansomReady.app
```

Then open the app. Keep DMGs out of the repository; distribute them through a release/download link. Assessment files live in writable `userData`, outside the app bundle and DMG.

## Limitations and honest notes

- This is a self-assessment, not a formal audit, certification or compliance statement. Answers are not independently verified.
- Weights, thresholds and maturity labels are project design choices.
- The scanner uses a small sample indicator list and checks file names only. False positives and false negatives are possible. A clean result does not prove a computer is safe; RansomReady is not an antivirus or continuous monitor.
- Scans skip symlinks, `.git` and `node_modules`. Defaults limit scans to 200,000 files, depth 25 and 500 retained findings. Unreadable entries are skipped; cancellation/limits yield partial results. PDFs list up to 25 retained findings, with original scan counts.
- The latest scan may concern a different folder or date from the assessment. It is a separate point-in-time check and never affects readiness scoring.
- Only the latest assessment is displayed. No history browser, report library, cloud sync or external analysis is implemented.
- The macOS app is unsigned by a verified developer and is not notarized. Packaging configuration does not prove a release has passed native testing.

## Roadmap

- [x] Phase 1: Secure Electron foundation
- [x] Phase 2: UI shell and theme
- [x] Phase 3: Question bank
- [x] Phase 4: Assessment wizard and save/resume
- [x] Phase 5: Scoring engine
- [x] Phase 6: Dashboard and SVG charts
- [x] Phase 7: Read-only early-sign scanner and macOS packaging configuration
- [x] Phase 8: PDF export, page error boundary and final documentation

## Author

**[Your name, college, department and project details here]**
