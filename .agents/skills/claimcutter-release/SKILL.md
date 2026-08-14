---
name: claimcutter-release
description: Cut a release of the ClaimCutter desktop app (UK small claims guide) — verify build/lint/tests, bump the version, build Windows installers, smoke test, publish to GitHub Releases, and update the Netlify download links. Use this whenever the user asks to release, rebuild, ship, publish, "cut a new version", or "do a build" of ClaimCutter, even if they don't say the word "release".
---

# ClaimCutter release

Run the full release workflow for the ClaimCutter desktop app. Repo: `G:\claimcutter`.

## Preconditions

- Windows + Node 22+, git, `netlify` CLI authenticated as `nigelpowell@hotmail.com`.
- GitHub fine-grained PAT with **Contents: Read and write** on `nigelp/claimcutter`, exported as `GH_TOKEN` (for the publish step).
- Git credential helper is `manager` (Windows Credential Manager), **not** `store`.

## Steps (in order)

1. **Verify green**
   ```bash
   npm run build        # tsc + vite
   npm run lint
   npx vitest run       # expect 13 tests, all pass
   ```

2. **Bump the version** in `package.json` (`"version"`, e.g. `1.1.0` → `1.2.0`).

3. **Build the installers**
   ```bash
   npm run electron:build:win
   ```
   Outputs (in `release/`, gitignored):
   - `claimcutter Setup <version>.exe`
   - `claimcutter-<version>-portable.exe`

   **Windows AV workaround** (only on the dev machine): if the build fails with
   `EPERM ... rename 'win-unpacked.tmp' -> 'win-unpacked'`, patch
   `node_modules/app-builder-lib/out/util/electronGet.js` so the extract step falls
   back to copy+delete when the rename throws `EPERM`/`EACCES` (re-apply after each
   `npm install`). Full detail in `RELEASE.md`.

4. **Smoke test the portable exe**
   ```bash
   ./release/claimcutter-<version>-portable.exe
   ```
   Confirm it launches and the window title is **"ClaimCutter - UK Small Claims Guide"**,
   then close it: `taskkill //F //IM claimcutter.exe`.

5. **Publish to GitHub Releases**
   ```bash
   npm run release:win
   ```
   Rebuilds and uploads the installers + `latest.yml` to a release tagged `v<version>`
   (uses the `publish` config in `package.json` + `GH_TOKEN`).
   Manual fallback: create release for tag `v<version>`, attach both `.exe` files
   (GitHub renames the setup file spaces → dots).

6. **Update the website download links** (if the version changed): edit the two
   `href`s in `website/index.html` to:
   ```
   https://github.com/nigelp/claimcutter/releases/download/v<version>/claimcutter.Setup.<version>.exe
   https://github.com/nigelp/claimcutter/releases/download/v<version>/claimcutter-<version>-portable.exe
   ```
   Redeploy:
   ```bash
   netlify deploy --prod --dir website --site claimcutter
   ```

7. **Commit & push**
   ```bash
   git add -A
   git commit -m "Release v<version>"
   git push origin main
   ```

## Caveats

- Installers are **unsigned** (no Authenticode cert) → Windows SmartScreen warns users.
- `latest.yml` is generated, but the app does **not** implement `electron-updater` yet.
- Remaining `npm audit` findings (5) are dev/build tooling only (vite/vitest/esbuild/pwa), not shipped.

The full, verbose runbook is in `RELEASE.md` (repo root).
