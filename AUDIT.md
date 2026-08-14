# ClaimCutter — Pre-Release Audit

_Version 1.1.0. Build, lint, and tests are green; Windows installers (NSIS setup + portable)
build successfully._

## Verification (current state)

| Check | Command | Result |
|---|---|---|
| Typecheck + build | `npm run build` | ✅ PASS (2 non-blocking warnings) |
| Lint | `npm run lint` | ✅ PASS |
| Tests | `npx vitest run` | ✅ PASS — 10/10 tests, 2 files |
| Electron files typecheck | `tsc --noEmit electron/main.ts electron/preload.ts` | ✅ PASS |
| Windows installer build | `npm run electron:build:win` | ✅ PASS — see `release/` |
| Dependency audit | `npm audit` | ⚠️ 5 remaining (dev-tooling only) |

Build artifacts (not committed — `release/` is gitignored):
- `release/claimcutter Setup 1.1.0.exe` (NSIS installer)
- `release/claimcutter-1.1.0-portable.exe` (portable)

Build warnings (non-blocking): main bundle is ~945 kB (over the 500 kB chunk warning — no
code-splitting), and `postcss.config.js` triggers a module-type warning.

---

## What has been done

### Pass 1 — blocking defects
1. Test suite fixed (stale placeholders/assertions, empty test file, clipboard spy).
2. ESLint 8 installed + configured (`npm run lint` works).
3. Fee Schedule hearing-fee column fixed.
4. "Haring Scheduled" → "Hearing Scheduled" typo fixed.

### Pass 2 — product decisions
1. **Electron write-only mirror removed** (data lives solely in IndexedDB).
2. **Import Data button** added to Settings.
3. **Per-claim delete** added to Previous Claims (with confirmation).
4. **Mediation save wired up** (position statement + checklist persist to the claim).
5. **Fee schedule re-verified** to EX50A (8 April 2025).
6. **Dormant schema drift tidied** (removed unused/conflicting schemas).

### Pass 3 — dependencies, fee UI, release build
1. **Dependency upgrade** (36 → 5 vulnerabilities):
   - `electron` 28.3.3 → 43.4.0 (runtime; fixed multiple CVEs).
   - `electron-builder` 24.13.3 → 26.15.3 (fixed `tar`/`app-builder-lib`/`electron-updater`).
   - `react-router-dom` 6 → 7 (fixed `react-router` CVEs).
   - Removed unused `uuid` + `@types/uuid` (app uses `crypto.randomUUID()`).
   - Ran `npm audit fix` for non-breaking transitive fixes.
2. **Fee Calculator UI simplified**: the online/paper "Submission Method" toggle and the
   "Online/Paper Court Fee" columns were removed, because the April 2025 fee reform made the
   issue fee the same regardless of filing method. The `submissionMethod` field on a claim is
   retained (it still drives the Submission Guide's online-vs-paper instructions).
3. **Version bumped** 1.0.0 → 1.1.0 and Windows installers built.

---

## Remaining vulnerabilities (deferred — dev/build tooling only)

`npm audit` reports 5 remaining, all in the **build/test toolchain, which is not shipped in the
packaged app**:

| Package | Severity | Notes |
|---|---|---|
| `vitest` | critical | esbuild dev-server request forwarding (dev only) |
| `vite` | high | esbuild dev-server (dev only) |
| `esbuild` | moderate | dev server |
| `vite-node` | moderate | vitest dependency |
| `vite-plugin-pwa` | moderate | depends on vulnerable vite |

Fixing these requires a breaking toolchain migration (`vite` 5 → 8, `vitest` 1 → 4,
`vite-plugin-pwa` 0.17 → 1.x, and likely `vite-plugin-electron`). This is a larger, riskier
migration that touches the Electron build chain, so it was deferred rather than done blind. The
runtime dependencies (what actually ships in the `.exe`) are now clean.

Recommended follow-up: a dedicated toolchain-migration pass (vite/vitest/PWA/electron-plugin),
with the existing test suite as the regression guard.

---

## Build notes

- **Windows Antivirus workaround (environment-specific).** On this machine, Windows Defender
  blocks `MoveFileEx` (directory rename) on directories containing `electron.exe`, which breaks
  electron-builder's extract step (`EPERM`). I patched
  `node_modules/app-builder-lib/out/util/electronGet.js` locally to fall back to copy+delete when
  the rename fails with `EPERM`/`EACCES`. This is in `node_modules` (gitignored) and must be
  re-applied after a fresh `npm install` on this machine, or avoided by adding a Defender
  exclusion for the project folder. A clean CI machine is unlikely to hit this.
- **Code signing:** the installers are **unsigned** (no Authenticode certificate). For a
  production release you will want to sign with a code-signing cert and set `win.certificate*`
  options in the `build` config; otherwise Windows SmartScreen will warn users.

## Advisory

- **Fee data** updated to the April 2025 EX50A schedule from gov.uk. Worth a final human
  spot-check before release (court fees are material).
- **Help with Fees income thresholds** on the Fee Calculator are illustrative and were not
  re-verified.
- **React Router v7 future-flag warnings** no longer apply (migrated to v7); the v7
  `startTransition` future flag is available if desired.
- **Dev-only:** React StrictMode double-invokes the `PreClaimPage` mount effect in dev and can
  race to create a duplicate draft claim; production builds are unaffected.
- **Electron `get-platform`/`open-external` IPC** remain but are currently unused by the renderer.
