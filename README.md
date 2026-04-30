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

Incidents are stored in the user's browser `localStorage` under the `rca-incidents` key. This keeps the app fully static and deployable without a backend. For team-wide production data, connect the incident state layer to an API or database and keep the UI components unchanged.

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
