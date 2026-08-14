# Releasing ClaimCutter

Step-by-step runbook for cutting a release of the desktop app + updating the download site.
Run from the repo root (`G:\claimcutter`).

## Pre-flight

- Windows machine with Node 22+, Git, and a GitHub fine-grained PAT that has
  **Contents: Read and write** (for push + releases) on `nigelp/claimcutter`.
- `GH_TOKEN` set as a Windows user environment variable (for the publish step).
- Git credential helper is `manager` (Windows Credential Manager), **not** `store`.

## 1. Verify the code is green

```bash
npm run build          # tsc + vite
npm run lint
npx vitest run         # expect 13 tests, all pass
```

## 2. Bump the version

Edit `"version"` in `package.json` (e.g. `1.1.0` → `1.2.0`).

## 3. Build the installers

```bash
npm run electron:build:win
```

Outputs (in `release/`, gitignored):
- `claimcutter Setup <version>.exe`  (NSIS installer)
- `claimcutter-<version>-portable.exe`

### Windows AV workaround (only on this dev machine)

If the build fails with `EPERM: operation not permitted, rename
'...\win-unpacked.tmp' -> '...\win-unpacked'`, Windows Defender is blocking the
directory rename (MoveFileEx) on folders containing `electron.exe`. Patch
`node_modules/app-builder-lib/out/util/electronGet.js` so the extract step falls
back to copy+delete when the rename throws `EPERM`/`EACCES` (must be re-applied
after every `npm install`).

## 4. Smoke test the portable exe

```bash
./release/claimcutter-<version>-portable.exe
```

Confirm it launches and the window title reads **"ClaimCutter - UK Small Claims Guide"**,
then close it (`taskkill //F //IM claimcutter.exe`).

## 5. Publish to GitHub Releases

```bash
npm run release:win
```

This rebuilds **and** uploads the installers + `latest.yml` to a GitHub Release
tagged `v<version>` (uses the `publish` config in `package.json` + `GH_TOKEN`).

> If publishing manually instead: create a release for tag `v<version>`, attach
> the two `.exe` files. GitHub renames the setup file to `claimcutter.Setup.<version>.exe`
> (spaces → dots).

## 6. Update the download links on the website

The marketing site lives in `website/` (version-controlled) and is deployed to
Netlify. The download button + portable link in `website/index.html` point at the
GitHub release URL:

```
https://github.com/nigelp/claimcutter/releases/download/v<version>/claimcutter.Setup.<version>.exe
https://github.com/nigelp/claimcutter/releases/download/v<version>/claimcutter-<version>-portable.exe
```

If the version changed, update those two `href`s, commit, and redeploy:

```bash
netlify deploy --prod --dir website --site claimcutter
```

(Or rely on Netlify git auto-deploy if the site has been linked to the repo.)

## 7. Commit & push

```bash
git add -A
git commit -m "Release v<version>"
git push origin main
```

## Notes / caveats

- **Installers are unsigned** (no Authenticode cert) → Windows SmartScreen warns users.
  To remove the warning, add a code-signing cert + `win.certificate*` to the `build` config.
- `latest.yml` is generated for auto-update, but the app does **not** implement
  `electron-updater` yet — in-app auto-update needs separate wiring.
- Remaining `npm audit` findings (5) are all dev/build tooling (vite/vitest/esbuild/pwa),
  not shipped in the app. A future toolchain-migration pass (vite 5→8, vitest 1→4,
  vite-plugin-pwa 0.17→1) would clear them.
