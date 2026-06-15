# Campaign Copilot

A polished, AI-first CRM-style demo scoped for an FDE assignment. Instead of a traditional dashboard full of CRUD screens, this project centers on a marketer talking to the product:

- Build an audience from plain English
- Generate the campaign message
- Recommend the best channel
- Launch through a separate channel simulator service
- Watch callback events flow into analytics

## What’s in the repo

- `client/` — the polished single-page UI
- `server/` — CRM backend and callback API
- `simulator/` — separate channel simulator service

## Quick start

```bash
cd /home/sahil/Projects/Project/Xeno
npm install
npm run dev
```

Optional smoke check, after both services are up:

```bash
npm run smoke
```

That starts:

- CRM backend on `http://localhost:4000`
- Channel simulator on `http://localhost:4100`

Open `http://localhost:4000` in your browser.

## API surface

- `GET /api/bootstrap` — initial dashboard data
- `POST /api/segment/preview` — parse a natural-language audience prompt
- `POST /api/message/generate` — generate a campaign message
- `POST /api/channel/recommend` — recommend WhatsApp, Email, or SMS
- `POST /api/campaigns` — save a campaign draft
- `POST /api/campaign/send` — send a campaign to the simulator
- `POST /receipt` — callback endpoint for delivery events
- `GET /api/metrics` — campaign funnel metrics
- `GET /api/insights` — AI-style performance summary

## Scope note

This is intentionally a demo-first build. It uses seeded data and in-memory state so the feature surface stays focused on the AI flow and the separate channel service, which is what the assignment emphasized.

If you want to push it closer to the original checklist later, the next clean upgrade would be replacing the in-memory store with MongoDB Atlas or SQLite and wiring real CSV imports to persistence.
