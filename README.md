# Forge CRM

A modern, professional CRM frontend built with React + Vite.

## Setup

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Requirements

Your CRM API must be running at `http://localhost:8080`

## Features

- **Dashboard** — Overview with stats, recent deals, pending tasks, and activity feed
- **Contacts** — Full CRUD with search, pagination, tags, lead scoring
- **Contact Detail** — Activity timeline, contact info, lead score bar
- **Deals** — Table with filtering by status (open/won/lost), quick win/lose actions
- **Deal Detail** — Stage progress bar, activity log, mark won/lost with reason
- **Pipeline (Kanban)** — Visual board grouped by stage with deal values per column
- **Activities** — Log calls, notes, emails, meetings with filtering by type
- **Tasks** — Create/complete/delete tasks with priority, due dates, overdue detection

## Tech Stack

- React 18
- React Router v6
- Vite
- Recharts (for future charts)
- lucide-react (icons)
- date-fns (date formatting)
- clsx (classnames)

## API Config

To point to a different API URL, edit `src/lib/api.js`:

```js
const BASE_URL = 'http://localhost:8080/api/v1';
```
