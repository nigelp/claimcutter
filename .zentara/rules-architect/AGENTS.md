# AGENTS.md - Architect Mode

This file provides guidance to agents when working with code in this repository.

## Project Architecture Rules (Non-Obvious Only)
- **Stateless utility functions**: All `src/utils/*.ts` are pure functions - adding state or side effects breaks testability and reusability
- **Zustand store is single source of truth**: No Redux, no Context API for state - Zustand with persist middleware is the only state layer
- **No backend architecture**: This is 100% client-side - any feature requiring server needs architectural redesign
- **Linear claim workflow**: Claims progress through 9 statuses sequentially - parallel or branching workflows would require store redesign
- **Electron is thin wrapper**: `electron/main.ts` only creates BrowserWindow - no IPC channels defined yet, adding them requires preload changes
- **PWA and Electron share code**: Same React app serves both targets - target-specific code must check `isElectronBuild` flag
- **Validation is schema-driven**: Zod schemas in `src/schemas/` drive form validation - adding fields requires updating both types AND schemas
- **Tailwind is the CSS system**: No CSS modules, no styled-components - all styling through Tailwind utility classes
- **Component hierarchy is flat**: Pages import directly from `src/components/` - no nested component folders, keep it flat