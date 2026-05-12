# Root Cause Analysis

A production-ready React and Vite web application for tracking IT operations incidents, identifying recurring root causes, and managing remediation status from a browser.

## Features

- Incident dashboard with operational summary cards, trends, and charts.
- Problems table with filtering, sorting, single-incident editing, and deletion with undo.
- Bulk selection with select-all and Shift+Click range selection.
- Export selected incidents to CSV or JSON.
- Bulk edit selected incidents to update status and impact.
- Root cause and topic analysis views.
- Interactive root cause graph visualization.
- Persistent browser storage using `localStorage`.
- GitHub Pages deployment workflow for the static Vite build.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Install

```bash
npm ci
```

### Develop

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

### Build

```bash
npm run build
```

The production build is written to `dist/`.

### Preview the Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Deployment

This repository includes `.github/workflows/deploy-pages.yml` to build and deploy the app to GitHub Pages whenever changes are pushed to `main`.

The workflow:

1. Installs dependencies with `npm ci`.
2. Builds the app with `GITHUB_PAGES=true npm run build`.
3. Uploads the `dist/` artifact.
4. Deploys it with GitHub Pages.

The Vite config uses `/root-cause-analysis/` as the base path only when `GITHUB_PAGES=true`, so local development continues to run from `/`.

## Data Storage

Incidents are stored in the user's browser `localStorage` under the `rca-incidents` key. First-time visitors start with a bundled demo dataset so the dashboard, table, and graph are immediately populated on GitHub Pages. Once the app is used, that browser-specific data is preserved locally and is not overwritten.

This keeps the app fully static and deployable without a backend. For team-wide production data, connect the incident state layer to an API or database and keep the UI components unchanged.

## How the App Works Today

This frontend is already a good fit for a legacy application because it is a single React mount without client-side routing.

- `index.html` provides one `#root` element and loads `src/main.tsx`.
- `src/main.tsx` mounts `<App />` once and does not depend on Next.js, Remix, or React Router.
- `src/App.tsx` owns the main incident state and wires together dialogs, tabs, bulk actions, and charts.
- `src/hooks/use-local-storage-state.ts` is the persistence boundary today. Replacing this hook is the main step required to move from browser storage to server-backed data.
- Most components under `src/components/` are UI-focused and can stay unchanged if the `Incident[]` data shape stays the same.

### Incident Data Contract

The shared frontend model is defined in `src/lib/types.ts`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Unique incident identifier |
| `problem` | `string` | Short summary/title |
| `rootCauses` | `string[]` | One or more categorized causes |
| `topics` | `string[]` | One or more tags/topics |
| `fix` | `string` | Resolution or next action |
| `status` | `Open \| In Progress \| Resolved \| Closed` | Workflow state |
| `impact` | `Low \| Medium \| High \| Critical` | Severity |
| `createdAt` | `string` | ISO timestamp |
| `description` | `string \| undefined` | Optional long-form notes |

## Adapting This Frontend to a Legacy PHP App

If your real application already uses PHP templates, server rendering, session auth, and Ajax endpoints, the easiest approach is to keep this repository as a frontend island inside an existing page.

### Recommended Integration Model

1. Let PHP continue to render the surrounding layout, navigation, authentication state, and page-level permissions.
2. Render a single mount element with the selector expected by `src/main.tsx` (currently `<div id="root"></div>`) inside the relevant PHP page.
3. Build this frontend with `npm run build` and include the generated CSS/JS assets from `dist/`, using `dist/index.html` as the reference for the final asset tags.
4. Bootstrap initial incident data from PHP JSON or load it with Ajax after mount.
5. Replace `useLocalStorageState()` with a small API-backed state layer while keeping the existing components and `Incident` type.

### Why This Works Well in a Server-Rendered Environment

- No client-side router means there is no routing conflict with existing PHP URLs.
- The UI is already organized around one top-level `App` component, so it can be mounted on only the page that needs incident management.
- State and persistence are not deeply spread across the codebase; they are centralized enough to swap storage without a full rewrite.
- Forms and tables already operate on plain JSON-friendly objects, which map cleanly to Ajax requests and PHP responses.

### Minimal Backend Responsibilities

To move from demo/static usage to a real application, the backend should provide:

- an endpoint to list incidents for the current user or team
- an endpoint to create a new incident
- an endpoint to update one incident
- an endpoint to delete one incident
- an endpoint for bulk updates if you want to preserve the current bulk-edit UX
- authentication, authorization, validation, and audit logging on the server side

### Suggested Migration Order

1. Keep the current UI and mount it inside one PHP-rendered page.
2. Replace local storage reads with server-provided initial JSON.
3. Replace create, update, delete, and bulk actions with Ajax calls.
4. Keep server rendering for the rest of the application and use this frontend only where rich table/filter/chart behavior is needed.
5. After that works, optionally split the current `App` state into a dedicated API/data hook for cleaner long-term maintenance.

### Files to Change First for a Real Integration

- `src/hooks/use-local-storage-state.ts` - replace browser persistence with Ajax/API persistence
- `src/App.tsx` - connect save/update/delete handlers to backend requests
- `src/lib/types.ts` - align the frontend contract with your PHP/API payloads
- `vite.config.ts` - adjust asset base paths if your PHP app serves assets from a subdirectory or CDN
- `index.html` - useful as a reference for the required root element and asset loading, even if the final shell is rendered by PHP

### Practical Notes for Legacy Backends

- Keep response payloads close to the existing `Incident` shape to avoid unnecessary frontend rewrites.
- Return ISO 8601 timestamps for `createdAt`.
- Enforce CSRF protection on write requests when the PHP app uses cookie-based sessions.
- Escape and validate all server-rendered data before embedding JSON into the page.
- If the page already has filters or other server-rendered controls, let PHP own those outer controls and pass the result set into this app as initial data.

## Using the Incident Table

- Click a row checkbox to select one incident.
- Shift+Click another checkbox to select or clear the full range between the last selected incident and the current incident.
- Use **Export CSV** or **Export JSON** to download selected incidents.
- Use the bulk edit controls to update status and impact across all selected incidents.
- Use the pencil action to fully edit a single incident, including problem, root causes, topics, fix, status, impact, and description.

## Key Files Detector Helper Prompt

Use this prompt when asking an AI assistant to quickly identify important files in this repository:

> Analyze this React/Vite repository and identify the key files for application state, incident table behavior, incident editing, data utilities, styling, build configuration, and deployment. Return a concise list with each file path and why it matters. Prioritize files under `src/`, `vite.config.ts`, `package.json`, and `.github/workflows/`.

## Project Structure

```text
src/App.tsx                         App state, layout, dialogs, and incident mutations
src/components/IncidentsTable.tsx    Incident filtering, sorting, selection, export, and bulk actions
src/components/QuickAddDialog.tsx    New incident form
src/components/EditIncidentDialog.tsx Single incident edit form
src/components/Dashboard.tsx         Dashboard metrics and charts
src/components/RootCausesView.tsx    Root cause summaries
src/components/RootCauseGraph.tsx    Graph visualization
src/lib/data-utils.ts                Incident aggregation, filtering, and formatting helpers
src/lib/types.ts                     Shared TypeScript data models
src/hooks/use-local-storage-state.ts Browser persistence hook
vite.config.ts                       Vite plugins, aliases, and GitHub Pages base path
.github/workflows/deploy-pages.yml   GitHub Pages CI deployment
```

## Contributing

Contributions are welcome at [github.com/voku/root-cause-analysis](https://github.com/voku/root-cause-analysis). Please open an issue or pull request with a clear description of the change and verification performed.

## Security Notes

- Do not commit production incident data or secrets.
- Review exported CSV/JSON files before sharing them outside your organization.
- If connecting a backend, enforce authentication, authorization, audit logging, and output encoding server-side.

## License

See [LICENSE](LICENSE).
