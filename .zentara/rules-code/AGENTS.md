# AGENTS.md - Code Mode

This file provides guidance to agents when working with code in this repository.

## Project Coding Rules (Non-Obvious Only)
- **Zod schemas are the source of truth**: All validation schemas in `src/schemas/index.ts` must match TypeScript types in `src/types/index.ts` - they are NOT auto-generated
- **Zustand store persistence**: Only `disclaimerAccepted`, `darkMode`, and `eligibilityAnswers` are persisted - claims are NOT auto-saved to store, use explicit `saveCurrentClaim()`
- **Claim lifecycle is linear**: Status flows through 9 states defined in `ClaimStatus` type - do not skip states
- **PDF generation uses pdf-lib**: Not jsPDF or html2pdf - the library choice matters for API compatibility
- **Icons from lucide-react only**: Do not import other icon libraries - all icons come from lucide-react
- **date-fns for dates**: Not moment.js or dayjs - use date-fns for all date operations
- **Utility functions are pure**: `src/utils/*.ts` files export pure functions with no side effects - they do NOT interact with store
- **Pages are route-level components**: Each file in `src/pages/` corresponds to exactly one route in `src/App.tsx`
- **Components are shared UI**: `src/components/` exports are used across multiple pages - check imports before modifying