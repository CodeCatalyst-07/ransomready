# RansomReady

**Assess. Detect. Improve.**

RansomReady is a college project addressing NTRO problem statement 317: a Ransomware Readiness Assessment tool. Ransomware can disrupt an organisation’s operations and access to critical data. The project aims to help organisations understand their preparedness, identify gaps, and prioritise improvements. Phase 1 provides the desktop app foundation and a runtime information screen; the assessment features belong to later phases.

## Tech stack

- Plain JavaScript and React for the renderer
- Vite with the React plugin for development and UI builds
- Electron for the desktop shell
- Plain CSS with automatic light and dark mode
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

This is a local production-like run, not an installer or packaged release. A browser preview at the Vite URL displays a friendly message because Electron's bridge is only available in the desktop window.

## Verify the setup

In the Electron window, confirm that the placeholder card shows real Electron, Node and Chrome versions. In its DevTools console, check:

```js
window.api                  // { getAppInfo: ... }
await window.api.getAppInfo() // App metadata and runtime versions
window.require              // undefined
window.process              // undefined
```

Confirm that the console has no errors or warnings. `npm run build` should complete successfully, and `npm start` should show the same versions from the built UI. The screen follows your operating system's light or dark preference.

## Roadmap

- [x] Phase 1: Setup
- [ ] Phase 2: UI shell
- [ ] Phase 3: Question bank
- [ ] Phase 4: Assessment wizard
- [ ] Phase 5: Scoring engine
- [ ] Phase 6: Dashboard and charts
- [ ] Phase 7: Early-sign scanner
- [ ] Phase 8: Reports, history and polish
