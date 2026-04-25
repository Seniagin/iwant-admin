# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server on http://localhost:3000
npm run build      # production build → build/
npm test           # Jest in watch mode (CRA)

# Run a single test file:
npm test -- --testPathPattern=App.test --watchAll=false
```

## Environment Variables

Create a `.env` file in the project root:

```
REACT_APP_API_URL=http://localhost:3000   # Backend base URL (no trailing slash)
```

## Architecture

React 19 SPA bootstrapped with Create React App. No global state management — components fetch directly via service functions and hold state locally with `useState`/`useEffect`.

### Layer breakdown

**Pages** (`src/pages/`) — route-level components, one per entity type. Each page owns its data-fetching lifecycle.

**Components** (`src/components/`) — reusable UI pieces: forms, drawers, dialogs, table rows. Large components (e.g. `BusinessUserEditDrawer`, `DemandEditDrawer`) are self-contained with their own fetch calls.

**Service** (`src/service/`) — plain `fetch` wrappers, organized by domain. All functions read `process.env.REACT_APP_API_URL` as the base.

| File | Covers |
|---|---|
| `business.api.service.ts` | businesses, business-users, offers on demands |
| `users.api.service.ts` | end-users (clients) |
| `search.api.service.ts` | demands, categories, admin statistics, manual actions |
| `categories.api.service.ts` | category CRUD |

**Types** (`src/types/`) — shared enums mirroring the backend: `DemandStatusEnum`, `OfferTimingEnum`, `Location`.

**Contexts** (`src/contexts/SnackbarContext.tsx`) — global toast notifications. Use `useSnackbar()` hook anywhere under `<SnackbarProvider>` to call `showSuccess`, `showError`, etc.

### Routing

Defined in `App.tsx` using react-router-dom v7:

| Path | Page |
|---|---|
| `/` | `HomePage` (statistics dashboard) |
| `/demands` | `DemandsPage` |
| `/categories` | `CategoriesPage` |
| `/users`, `/users/new`, `/users/:userId` | end-user management |
| `/business-users`, `/business-users/new`, `/business-users/:userId` | business-user management |
| `/business-users/:userId/businesses/:businessId/edit` | `EditBusinessPage` |

### Maps

`LocationPicker` and `LocationMapPreview` (in `src/components/LocationPicker/`) use `react-leaflet` with OpenStreetMap tiles. Always import `src/setupLeafletDefaultIcons` before rendering any Leaflet map component (already done at the app level in `index.tsx`).

### UI stack

MUI v7 (components + icons) is the primary UI library. `styled-components` is also present for custom CSS-in-JS. Avoid mixing the two on the same component — prefer MUI's `sx` prop for one-off styles.
