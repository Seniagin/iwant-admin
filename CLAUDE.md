# CLAUDE.md — Admin

## Overview

React admin dashboard for managing the IWant platform. Provides full CRUD for demands, categories, end-users, businesses, and business accounts. Includes analytics, OpenAI usage tracking, coverage analysis, and a Playground for generating mock data.

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript 4.9 |
| Build | Create React App 5 |
| Routing | react-router-dom 7 |
| UI | MUI v7 (Material-UI) + MUI Icons |
| Styling | MUI `sx` prop + styled-components 6 |
| Maps | react-leaflet 5 + Leaflet 1.9 |
| HTTP | native `fetch` |
| State | React hooks only — no Redux/Zustand |

## Commands

```bash
npm start       # Dev server on http://localhost:3006 (set in .env)
npm run build   # Production build → build/
npm test        # Jest (CRA)
```

## Environment Variables

```env
PORT=3006
REACT_APP_API_URL=http://localhost:3000   # Backend base URL, no trailing slash
```

All service files read `process.env.REACT_APP_API_URL`. No auth headers are sent (admin API is open or handled at network level).

## Project Structure

```
src/
├── App.tsx                          # All route definitions
├── pages/
│   ├── HomePage.tsx                 # Stats dashboard + OpenAI usage/cost tracker
│   ├── DemandsPage.tsx              # List/search/create/edit demands
│   ├── CategoriesPage.tsx           # CRUD categories + Pinecone vector DB stats
│   ├── UsersPage.tsx                # List end-users (clients)
│   ├── UserCreatePage.tsx           # New end-user form
│   ├── UserDetailsPage.tsx          # User detail + demands + edit panel
│   ├── BusinessUsersPage.tsx        # List business accounts
│   ├── BusinessUserCreatePage.tsx   # New business user form
│   ├── BusinessUserDetailsPage.tsx  # Business user + their businesses
│   ├── BusinessesListPage.tsx       # All businesses, search, coverage score
│   ├── BusinessDashboardPage.tsx    # Single business overview + coverage analysis
│   ├── BusinessDemandsDetailPage.tsx # Matching demands for a business + offer creation
│   ├── EditBusinessPage.tsx         # Edit business details/location/contacts
│   ├── CategoryBusinessesPage.tsx   # Businesses in a category, geo-filtered
│   ├── LowCoverageDemandsPage.tsx   # Demands with < 5 matching businesses
│   ├── RejectedMessagesPage.tsx     # API rejection log
│   └── PlaygroundPage.tsx           # Generate mock businesses (dev tool)
├── components/
│   ├── Layout.tsx / Navigation.tsx  # Shell and top nav
│   ├── DemandTableRow.tsx           # Table row with inline demand actions
│   ├── DemandEditDrawer.tsx         # Demand detail/edit side panel
│   ├── DemandCard.tsx               # Card view of a demand
│   ├── UserEditDrawer.tsx           # End-user edit panel
│   ├── UserDemandsPanel.tsx         # User's demands sub-list
│   ├── BusinessUserEditDrawer.tsx   # Business user edit panel
│   ├── BusinessesList.tsx           # Business table with actions
│   ├── BusinessForm.tsx             # Reusable create/edit business form
│   ├── BusinessCreateForm.tsx       # New business wrapper
│   ├── BusinessDemandsSection.tsx   # Matching demands for a business
│   ├── BusinessDemandsDialog.tsx    # Demand interaction modal
│   ├── BusinessCategoriesSection.tsx # Category assignment UI
│   ├── CategorySuggestions.tsx      # AI-suggested categories
│   ├── CategoryCoveragePanel.tsx    # Coverage score breakdown
│   ├── ContactsForm.tsx             # Phone/email/address/website/instagram
│   ├── LocationPicker/              # Interactive Leaflet map location selector
│   ├── PineconeIndexStats.tsx       # Vector DB stats display
│   ├── common/RightDrawer.tsx       # Slide-in panel wrapper
│   └── styles.ts                    # Styled-components definitions
├── service/                         # API wrappers (plain fetch, no auth headers)
│   ├── search.api.service.ts        # Demands, statistics, manual actions, OpenAI usage
│   ├── business.api.service.ts      # Businesses, business-users, offers
│   ├── users.api.service.ts         # End-users
│   ├── categories.api.service.ts    # Categories, Pinecone, coverage
│   ├── rejected-messages.api.service.ts
│   └── mock.api.service.ts          # POST /admin/mock/generate-businesses
├── types/
│   ├── demandStatus.ts              # DemandStatusEnum
│   ├── offerTiming.ts               # OfferTimingEnum (TODAY, THIS_WEEK, DISCUSSIBLE)
│   └── location.ts                  # { latitude, longitude }
├── contexts/
│   ├── SnackbarContext.tsx          # useSnackbar() — toast notifications
│   └── DemandEditOutletContext.tsx  # Shared demand drawer state
└── utils/
    ├── demandDisplay.ts             # Status chip colors, format helpers
    └── hooks/useAsyncOnLoad.ts      # Async fetch on mount hook
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Stats dashboard: user/demand/offer counts, OpenAI token/cost usage |
| `/demands` | All demands — filter by status, create, edit, categorize |
| `/categories` | Category CRUD + Pinecone index stats + sync |
| `/users` | End-user list |
| `/users/new` | Create end-user |
| `/users/:id` | User detail + demands |
| `/business-users` | Business account list |
| `/business-users/new` | Create business account |
| `/business-users/:id` | Business user + their businesses |
| `/businesses` | All businesses — search, delete, coverage |
| `/businesses/:id` | Business dashboard (also at `/business-users/:uid/businesses/:id`) |
| `/businesses/:id/demands` | Matching demands + offer creation for a business |
| `/business-users/:uid/businesses/:id/edit` | Edit business |
| `/categories/:id/businesses` | Businesses in category, geo-filtered |
| `/low-coverage-demands` | Demands with < 5 available businesses |
| `/rejected-messages` | API rejection log |
| `/playground` | Generate mock businesses on a map — dev tool |

## Key Components

**`DemandEditDrawer`** — right slide panel: edit demand fields, change status, categorize, notify businesses.

**`BusinessDashboardPage`** — business overview: category assignments, contacts, coverage score, analyze via OpenAI.

**`BusinessDemandsSection`** — demand matching + offer form (price, timing, comment) for a business.

**`CategoryCoveragePanel`** — coverage score, covered/uncovered services, AI-suggested new categories.

**`LocationPicker`** — Leaflet map click-to-set; always import `setupLeafletDefaultIcons` before use.

**`PlaygroundPage`** — click map to set center, set radius + min/max businesses per category, generates mock data via `POST /admin/mock/generate-businesses`.

## UI Patterns

- **Edit panels:** MUI `Drawer` (right-slide) via `RightDrawer` wrapper
- **Tables:** MUI `Table` + `TablePagination`
- **Notifications:** `useSnackbar()` context (success/error/warning/info)
- **Styling:** MUI `sx` prop for one-offs; styled-components in `styles.ts` for reusable

## Architecture Notes

- No global state — each component fetches on mount, manages own loading/error/data.
- Service functions throw on non-OK HTTP — components catch and show snackbar.
- **Maps:** `setupLeafletDefaultIcons` must be imported before any Leaflet render — see `CategoryBusinessesPage.tsx` for the pattern.
- **Adding a page:** create in `pages/`, add route in `App.tsx`, add nav link in `Navigation.tsx` if top-level.
