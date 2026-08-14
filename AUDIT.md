# ClaimCutter — Pre-Release Audit

_Status: pipeline green (build, lint, tests). Four blocking defects fixed in the first pass;
four product decisions and two cleanups resolved in the second pass (see below)._

## Verification (current state)

| Check | Command | Result |
|---|---|---|
| Typecheck + build | `npm run build` | ✅ PASS (2 non-blocking warnings) |
| Lint | `npm run lint` | ✅ PASS |
| Tests | `npx vitest run` | ✅ PASS — 10/10 tests, 2 files |
| Electron files typecheck | `tsc --noEmit electron/main.ts electron/preload.ts` | ✅ PASS |
| Coverage | `npx vitest run --coverage` | ⚠️ not runnable — `@vitest/coverage-v8` not installed |
| Electron packaging | `npm run electron:build` | ⚠️ not run in this environment |
| GOV.UK / MCOL submission | — | ⚠️ out of scope (app links out) |

Build warnings (non-blocking): main bundle is ~932 kB (over the 500 kB chunk warning — no
code-splitting), and `postcss.config.js` triggers a module-type warning.

---

## Pass 1 — blocking defects (fixed)

1. **Test suite now green** — stale placeholders/assertions in `workflow.test.tsx` corrected;
   empty `primaryJourney.workflow.test.tsx` removed; clipboard assertion now spies correctly
   (`@testing-library/user-event` replaces the mock in `setup()`).
2. **`npm run lint` works** — ESLint 8 + typescript-eslint + react-hooks installed (`.eslintrc.cjs`).
   Note: `eslint@8.57.1` is deprecated — plan a move to ESLint 9 flat config.
3. **Fee Schedule hearing-fee column** now uses `calculateHearingFee()`.
4. **"Haring Scheduled" → "Hearing Scheduled"** typo fixed.
5. `.reasonix/` added to `.gitignore`; `AUDIT.md` added.

---

## Pass 2 — product decisions (resolved)

1. **Electron write-only mirror removed.** `storage.ts` no longer calls
   `window.electronAPI.saveData/deleteData`; the `save-data`/`load-data`/`delete-data` IPC
   handlers and file helpers were removed from `electron/main.ts` and `electron/preload.ts`.
   Data is persisted solely in IndexedDB. (`get-platform`/`open-external` remain for future use.)

2. **Import button added to Settings.** "Import Data" reads the exported JSON, validates it as an
   array of claims, calls `importClaims()`, refreshes the store, and shows success/error feedback.

3. **Per-claim delete added** to Previous Claims, with inline confirmation.

4. **Mediation save wired up.** Position statement (4 sections) and the preparation checklist now
   persist to the current claim's `mediationStatus` (new `positionStatement` +
   `preparationChecklist` fields). The Save button is disabled with a notice when no claim is
   selected.

### Cleanups (also resolved)

5. **Fee schedule re-verified and updated** to the EX50A schedule effective 8 April 2025:
   - Issue fees are now a single fee (the online/paper discount was removed): £35 / £50 / £70 /
     £80 / £115 / £205 / £455, 5% above £10k (capped at £10,000 above £200k).
   - Hearing fee is now a flat rate by track: £147 (small claims) / £171 (other claims).
   - `getFeeLastUpdated()` → "April 2025"; Settings "Fee data last verified" → "April 2025".
   - **Note:** the Fee Calculator's online/paper toggle is now cosmetic (both yield the same fee),
     reflecting the single-fee reality. Consider simplifying the UI in a future pass.

6. **Dormant schema drift tidied.** Removed unused/conflicting `claimSchema`, `eligibilitySchema`,
   `interestSchema`, `letterBeforeClaimSchema`, `preActionChecklistSchema` and their derived type
   exports from `src/schemas/index.ts` (they shadowed the types in `src/types/index.ts` and were
   never used at runtime). Kept the schemas actually used (`addressSchema`, `claimantSchema`,
   `defendantSchema`, `userProfileSchema`, `emptyUserProfile`).

---

## Remaining notes / advisory

- **Fee data**: updated to April 2025 EX50A from gov.uk. Worth a final human spot-check before
  release, as court fees are material.
- **`npm install` reports 36 vulnerabilities** (2 low, 10 moderate, 21 high, 3 critical) across
  transitive deps — the project pins older majors (Electron 28, Vite 5, React 18). Plan a
  dependency-upgrade pass.
- **Help with Fees income thresholds** on the Fee Calculator page are illustrative and were not
  re-verified.
- **React Router v7 future-flag warnings** in tests (harmless).
- **Dev-only:** React StrictMode double-invokes the `PreClaimPage` mount effect and can race to
  create a duplicate draft claim; production builds are unaffected.
- **Electron `get-platform`/`open-external` IPC** remain but are currently unused by the renderer.
