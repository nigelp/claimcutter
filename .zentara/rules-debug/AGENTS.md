# AGENTS.md - Debug Mode

This file provides guidance to agents when working with code in this repository.

## Project Debug Rules (Non-Obvious Only)
- **Electron dev requires wait-on**: `npm run electron:dev` waits for Vite at localhost:5173 before launching Electron - if it hangs, Vite didn't start
- **PWA breaks in Electron**: If you see service worker errors in Electron, PWA plugin wasn't properly disabled for the build
- **IndexedDB vs localStorage**: Claims data is in IndexedDB (via `idb`), not localStorage - check DevTools > Application > IndexedDB
- **Dark mode persists separately**: Dark mode state persists to localStorage, not IndexedDB - theme flicker on load means persistence failed
- **Vitest jsdom limitations**: jsdom doesn't support IndexedDB natively - tests using IndexedDB need mocking
- **Electron preload isolation**: `electron/preload.ts` runs in isolated context - cannot access Node.js APIs from renderer without explicit expose
- **Build output split**: Web build goes to `dist/`, Electron main process goes to `dist-electron/` - wrong output means wrong build command
- **Strict TS errors block build**: `npm run build` runs `tsc` first - unused variables/params cause build failure, not just warnings