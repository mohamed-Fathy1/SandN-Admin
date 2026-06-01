# CLAUDE.md — S&N Admin Dashboard

## Package Manager
bun — `bun install`, `bun run <script>`.

## Common Commands
```bash
bun run dev          # Vite + auto-regen routeTree (port 5174 or next free)
bun run build        # routeTree gen + tsc -b + vite build
bun run lint         # eslint
bun run format       # prettier
bun run test         # vitest watch
bun run test:run     # vitest single run (CI)
bun run typecheck    # tsc --noEmit
```

## Project
Admin SPA for S&N Lingerie. Email+OTP auth. Single access tier.
Separate codebase from the customer storefront — but mirrors its patterns.

## Stack
React 19 + TS + Vite + TanStack Router + TanStack Query + Zustand + Tailwind v4 + Framer Motion + Sonner.

## State Management Decision Tree
- Comes from a network endpoint? → **TanStack Query**
- Lives in the URL (filters, page, tab)? → **TanStack Router** search params (validated with Zod)
- Persists across reloads & is global (token, sidebar collapse)? → **Zustand** (persisted)
- Local UI state (input value before submit, modal open)? → `useState`
- Computed from other state? → `useMemo` / selector

## Design System
- UI lives in `src/designs/`. Brand tokens on `A` (`src/designs/layout/tokens.ts`).
- Layout & utility = Tailwind. Brand-critical colors/radii/shadows = `A.*`.
- Never hardcode an `A` value inline.

## Auth
- Token from `POST /authentication/active-account` → `auth-store` (Zustand, persist key `sn_admin_session`).
- Axios request interceptor (`src/shared/lib/axios.ts`) attaches `Authorization: Bearer <token>`.
- Response interceptor: `401` → clear session → dispatch `auth:expired` event → `__root.tsx` redirects to `/login` and shows toast.
- Route `__root.tsx` redirects to `/login` when token is missing (added in Phase 2).
- **Token lives in `localStorage`** (Zustand `persist`). Known XSS surface — accepted because admin SPA runs on a separate origin and backend has no httpOnly-cookie auth. Revisit if backend gains cookie support.

## API Integration
- Pattern: `api/` → `hooks/` → component. Components never import from `api/`.
- Response envelope: `{ statusCode, data, message, success }`. Hooks return `data.data` only.
- Errors → `ApiError` (`statusCode`, `message`, `errors[]`). Use `instanceof ApiError` for field-level validation mapping.

## Bilingual Fields
- Use `<BilingualInput>` for `{ ar, en }` fields. Always send both. Display `.en` in tables (via `toEN()` from `shared/utils/bilingual.ts`).

## Image Uploads
- Use `useUploadImage()` — never call the presign endpoint directly from components. Pass the folder per-call via `mutate({ folder, file })`.
- Flow: `POST /aws/get-presigned-url` (auth) → `PUT` binary to `uploadUrl` (plain `s3` axios, **no auth header**) → use returned `fileUrl`.
- Max file size: 5 MB. Accepted types: jpeg/png/webp.

## Forms
- Manual `useState` + Zod `safeParse` on submit. No `react-hook-form`.
- Map Zod errors AND `ApiError.errors[]` into `<AdminFormField error={...}>`.

## Mobile / iOS Safari
- Form-control `font-size` must stay ≥ 16px on touch devices — set globally in `styles/globals.css` via a `(hover: none) and (pointer: coarse)` query. Smaller font on `input` / `select` / `textarea` triggers iOS Safari's focus-zoom.
- Use `<DateInput>` for dates — never `<input type="date">` directly. iOS renders the native control as a blank "button" with no placeholder when empty, and `-webkit-appearance: none` can suppress the picker entirely. The shared component layers a transparent native input above a placeholder + calendar icon (`z-10`) so taps still reach the native picker.
- Disabled form controls need a reason. Native `disabled` swallows taps silently — fatal on mobile where there's no hover-tooltip to explain why. `<DateInput>` and `<SearchableSelect>` accept `disabledReason?: string`; when set, the component keeps the trigger natively *enabled*, applies `aria-disabled` + disabled styling, and toasts the localized reason on tap.
- `<Select>` (Radix) passes `modal={false}` to skip the body scroll-lock — Radix's default lock applies `position: fixed` to `<body>`, which snaps iOS Safari to the top of the page when the dropdown opens.
- For Radix `Popover.Content` with an auto-focused input, override `onOpenAutoFocus` and call `ref.current?.focus({ preventScroll: true })`. Plain `autoFocus` causes iOS to scroll the page to bring the focused input into the visual viewport — usually hiding the popover above the fold.

## Tables
- All list views use `<AdminTable>` (TanStack Table). Never roll a bespoke `<table>`.

## Mutations
- Always invalidate via `cache-invalidation.ts` — never inline `queryClient.invalidateQueries`.
- Toast on success and on error. Guard against double-submit with `mutation.isPending`.

## Currency
- EGP only. Use `formatEGP()` from `shared/utils/format.ts` — never hardcode `"EGP"` or `"$"`.

## Routing
- File-based. Route files are thin shells (lazy import + Suspense + `validateSearch` Zod schema).
- Never put business logic in route files.
- Protected pages use `lazy(() => import(...).then(m => ({ default: m.Foo })))` so the login route doesn't ship the full admin bundle. Fallback: `<PageSkeleton />`.

## Adding a Feature
1. Add types → `src/shared/types/api.ts`
2. Add query keys → `src/shared/lib/query-keys.ts`
3. Add invalidation entry → `src/shared/lib/cache-invalidation.ts`
4. Write `api/<name>.ts`
5. Write `hooks/use-<name>.ts` (queries + mutations w/ toast)
6. Write Zod schema → `schemas/<name>-form.ts`
7. Write design page → `src/designs/<feature>/<name>-page.tsx`
8. Wire route shell → `src/routes/...`
9. Add MSW handlers → `src/test/mocks/handlers/<feature>.ts`
10. Add tests next to the code

## DO NOT
- Hardcode `A` token values inline.
- Import from `api/` in components or route files.
- Use `useEffect` for data fetching — use TanStack Query.
- Store server state in Zustand.
- Use `$` for currency — always EGP.
- Skip `<ConfirmDialog>` for hard-delete / bulk-delete / order cancellation.
- Use `<a href>` for internal navigation — TanStack `<Link to>`.
- Access `import.meta.env` directly — use `src/config/env.ts`.
- Mock Axios in tests — use MSW.
- Fire a mutation twice without an `isPending` guard.
- Catch `ApiError` silently — surface to user via toast or inline.
- Disable a `<DateInput>` / `<SearchableSelect>` on a "do X first" precondition without passing `disabledReason`. Skip the reason only for pure loading-state (`isPending`) disables.

## Known Gaps
- **Products: no Deleted tab.** `/product/get-all-products` excludes soft-deleted rows server-side, so there's no list to render in a Deleted view. Soft-delete / restore / hard-delete endpoints still exist; if a "deleted products" list endpoint is added, re-introduce the tab. The list endpoint excludes soft-deleted rows in all states.

## Reference
- System requirements doc: `~/.claude/plans/from-sandn-ecommerce-client-app-encapsulated-sutherland.md`
- Storefront repo (mirror these patterns): `/Users/mohamedfathy/Documents/dev/SandN-Ecommerce`
- Admin API guide: `/Users/mohamedfathy/Documents/dev/AdminAPI-Integration-Guide.md`
