# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview
ClaimCutter - UK small claims court guided wizard. React + TypeScript + Vite + Electron desktop app.

## Essential Commands
- `npm run dev` - Start Vite dev server (web)
- `npm run electron:dev` - Start Electron desktop dev (requires concurrently + wait-on)
- `npm run build` - TypeScript check + Vite build
- `npm run electron:build` - Build Electron installer (outputs to release/)
- `npm run test` - Vitest (watch mode)
- `npm run lint` - ESLint with strict settings (no unused locals/params)

## Path Alias
- `*` (see below for file content) maps to `src/*` (configured in tsconfig.json, vite.config.ts, vitest.config.ts)

## Key Non-Obvious Patterns
- **PWA disabled for Electron**: `isElectronBuild` flag in vite.config.ts disables PWA plugin (incompatible with file:// protocol)
- **HashRouter required**: App uses HashRouter (not BrowserRouter) for Electron file:// compatibility
- **Dual distribution**: Same codebase ships as PWA (web) AND Electron desktop app
- **IndexedDB storage**: Uses `idb` library for browser persistence, not localStorage (except darkMode + disclaimerAccepted)
- **Electron main/preload**: `electron/main.ts` and `electron/preload.ts` compiled to `dist-electron/` by Vite

## Code Style (Non-Standard)
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` enforced
- Tailwind dark mode: class-based (not media query)
- All form validation uses Zod + react-hook-form + @hookform/resolvers

## Testing
- Vitest with jsdom environment, globals enabled
- Setup file: `src/test/setup.ts`
- Coverage threshold: 80% on branches, functions, lines, statements
- Excludes: `src/test/`, `*.d.ts`, `*.config.*`, `electron/`