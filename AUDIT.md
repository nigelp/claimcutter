# ClaimCutter — Pre-Release Audit

_Last updated: pre-release pass. Pipeline is green; four blocking issues fixed. Several product
decisions remain open (see "Open decisions")._

## Verdict

The app builds and the core user flows are exercised by a passing test suite. The four blocking
defects identified in the initial audit have been fixed. Before release you should still make the
decisions listed under "Open decisions" — none of them block the current build, but several affect
data integrity and user expectations.

## Verification (current state)

| Check | Command | Result |
|---|---|---|
| Typecheck + build | `npm run build` | ✅ PASS (2 non-blocking warnings) |
| Lint | `npm run lint` | ✅ PASS |
| Tests | `npx vitest run` | ✅ PASS — 10/10 tests, 2 files |
| Coverage | `npx vitest run --coverage` | ⚠️ not runnable — `@vitest/coverage-v8` not installed |
| Electron packaging | `npm run electron:build` | ⚠️ not run in this environment |
| GOV.UK / MCOL submission | — | ⚠️ out of scope (app links out; no automation possible) |

Build warnings (non-blocking): main bundle is ~932 kB (over the 500 kB chunk warning — no
code-splitting), and `postcss.config.js` triggers a module-type warning.

## Fixes applied (this pass)

1. **Test suite is now green.**
   - Updated stale placeholders in `src/tests/workflow/workflow.test.tsx` to match the shipped
     `PreClaimPage` (defendant `Enter full name` / `Enter address line 1` / `Enter city` /
     `Enter postcode`; claim-details amount `0.00`; `Provide any additional details`).
   - Fixed an ambiguous `Letter Before Claim` assertion (now asserts a unique letter string).
   - Clipboard assertion now spies on `navigator.clipboard.writeText` — `@testing-library/user-event`
     replaces the mock during `userEvent.setup()`, which broke the original assertion.
   - Deleted the empty `src/tests/workflow/primaryJourney.workflow.test.tsx` (was failing with
     "No test suite found").
   - Gave the slow pre-claim test a 15 s timeout (matches the claim-builder test).

2. **`npm run lint` works again.** Installed ESLint 8 + typescript-eslint + eslint-plugin-react-hooks
   and added `.eslintrc.cjs`. (`eslint@8.57.1` is deprecated — plan a move to ESLint 9 flat config.)

3. **Fee Schedule hearing-fee column fixed.** The table matched `HEARING_FEE_BRACKETS` rows against
   `FEE_BRACKETS` by identical bounds (they differ), so the first four rows showed "–". It now uses
   `calculateHearingFee()`.

4. **Typo fixed.** "Haring Scheduled" → "Hearing Scheduled" in `ClaimTrackerPage.tsx`.

5. **Committed.** See git history for the change set (includes the previously-uncommitted
   `ensureCurrentClaim` / auto-fill-badge work).

### Minor lint-only code changes (not bugs)

- `ClaimBuilderPage` `validateStep` `case 3` wrapped in braces (`no-case-declarations`).
- `src/main.tsx` `catch (e)` → `catch` (unused binding).
- `PreClaimPage` removed a now-redundant `eslint-disable-next-line react-hooks/exhaustive-deps`.

## Open decisions (product owner)

1. **Electron file persistence is write-only.** `storage.ts` calls
   `window.electronAPI.saveData()`/`deleteData()` but never `loadData()`. On startup the app reads
   only from IndexedDB, so the JSON mirror in `userData/claim-data/` is never restored. Decide:
   implement read-back, or drop the mirror.
2. **No Import UI.** `importClaims()` exists in `storage.ts` but is never called; Settings offers
   Export only.
3. **No per-claim delete UI.** The store's `deleteClaim()` has no corresponding control (Previous
   Claims only lists).
4. **Mediation "Save Position Statement" is a no-op.** The statement textareas and preparation
   checkboxes are uncontrolled — nothing is persisted, and the "checked items will be included"
   hint is misleading.
5. **Fee data is stale.** Marked "January 2024". Re-verify against current GOV.UK fee schedule
   before release.
6. **Latent schema drift.** `eligibilitySchema.isDefamation` and `claimSchema` strictness do not
   match the app types/defaults. They are exported but unused at runtime today.

## Not tested / limitations

- Electron installer packaging (`electron:build`), including `electron/main.ts`/`preload.ts` which
  are not type-checked by `npm run build` (its `tsconfig.json` only covers `src/`).
- The actual GOV.UK Money Claim Online submission — the app links out rather than submitting.
- PWA/service-worker offline behaviour (intentionally disabled for Electron builds).

## Advisory

- `npm install` reports 36 vulnerabilities (2 low, 10 moderate, 21 high, 3 critical) across the
  dependency tree. These are transitive; the project pins older major versions (Electron 28, Vite 5,
  React 18). Plan a dependency upgrade pass.
- React Router emits v7 future-flag warnings in tests (harmless).
- In dev only, React StrictMode double-invokes the `PreClaimPage` mount effect, which can race and
  create a duplicate draft claim; production builds are unaffected.
