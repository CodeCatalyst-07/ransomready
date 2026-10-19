# RansomReady

**Assess. Detect. Improve.**

RansomReady is a college project addressing NTRO problem statement 317: a Ransomware Readiness Assessment tool. Ransomware can disrupt an organisation’s operations and access to critical data. The project aims to help organisations understand their preparedness, identify gaps, and prioritise improvements. Phases 1 and 2 provide the secure desktop foundation, navigation shell, Home and About pages, and placeholders for future features. Assessments and analysis belong to later phases.

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
- `src/config/`: the navigation list, including page IDs, labels, icons and components. Register a new page in this one list.
- `src/hooks/`: the theme hook reads a saved choice or OS preference, applies `data-theme`, and safely saves the choice under `ransomready-theme`.
- `src/components/`: shared layout, sidebar, header, theme toggle and placeholder card.
- `src/pages/`: Home, About and four empty feature pages.
- `src/styles/`: layout and component CSS; global reset, spacing and theme variables live in `src/index.css`.

Navigation uses React state without a router. Use Tab / Shift+Tab to move through buttons and Enter / Space to activate them. The header's theme button switches light/dark mode; the choice survives restarts when localStorage is available.

## Verify the setup

In the Electron window, visit all six sidebar pages and check that the active item and header agree. Home's Start Assessment button should open the Assessment placeholder. Toggle the theme and restart the app to check persistence. The About page should show real Electron, Node and Chrome versions. In DevTools, check:

```js
window.api                  // { getAppInfo: ... }
await window.api.getAppInfo() // App metadata and runtime versions
window.require              // undefined
window.process              // undefined
```

Confirm that the console has no errors or warnings. `npm run build` should complete successfully, and `npm start` should show the same versions from the built UI. Without a saved theme, the initial screen follows your operating system's light or dark preference.

## Roadmap

- [x] Phase 1: Setup
- [x] Phase 2: UI shell
- [ ] Phase 3: Question bank
- [ ] Phase 4: Assessment wizard
- [ ] Phase 5: Scoring engine
- [ ] Phase 6: Dashboard and charts
- [ ] Phase 7: Early-sign scanner
- [ ] Phase 8: Reports, history and polish
