# AGENTS.md - Ask Mode

This file provides guidance to agents when working with code in this repository.

## Project Documentation Rules (Non-Obvious Only)
- **Domain context**: This app guides users through UK small claims court (Money Claim Online) - all business logic relates to UK jurisdiction
- **13-page wizard flow**: Pages represent sequential steps, not independent features - order matters: Welcome → Eligibility → Pre-Claim → Claim Builder → Fee Calculator → Submission → Tracker → Claims → Mediation → Hearing → Enforcement → Documents → Settings
- **Store is the data source**: `src/store/index.ts` contains all app state - there is no backend API, everything is client-side
- **Schemas define validation rules**: `src/schemas/index.ts` has Zod schemas for all forms - these are the authoritative validation rules
- **Types define domain model**: `src/types/index.ts` defines `Claim` type with full lifecycle tracking - this is the core domain entity
- **Utils are calculation helpers**: `src/utils/` contains pure functions for eligibility, fees, and interest calculations - no side effects
- **Electron is optional**: Same app works as web PWA or Electron desktop - Electron is just a distribution wrapper
- **No external API calls**: All data is local (IndexedDB + localStorage) - no network requests to external services