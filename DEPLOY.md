Deployment guide — Vercel (frontend) + Render (backend + simulator)

Prerequisites

- GitHub account (or Git provider supported by Vercel/Render)
- Vercel account
- Render account

Overview

- Frontend: `client/` (static HTML/CSS/JS) — deploy to Vercel as a static site
- Backend: `server/` (Node/Express) — deploy to Render as a web service
- Simulator: `simulator/` (Node/Express) — deploy to Render as a separate web service

Frontend (Vercel)

1. In Vercel, click "New Project" and import the repository.
2. When asked for framework, choose "Other" (Static Site).
3. Set the "Root Directory" to `client`.
4. Set build command empty and Output Directory empty — Vercel will serve static files from the `client` folder.
5. Deploy. After deployment, copy the Vercel URL (e.g. `https://your-project.vercel.app`).

Backend (Render)

Option A — Quick (use Dockerfile)

1. In Render, create a new Web Service.
2. Connect your GitHub repo and select the branch.
3. Choose "Docker" as the Environment.
4. Set the Start Command to `npm run start:crm` (the Dockerfile already runs this by default).
5. Add an Environment Variable `PORT` (Render provides one automatically).
6. Deploy. Note the service URL (e.g. `https://crm-yourname.onrender.com`).

Option B — Node environment

1. Create a new Web Service on Render.
2. Set Build Command: `npm install --production`
3. Set Start Command: `npm run start:crm`
4. Deploy.

Simulator (Render)

1. Create another Web Service for the simulator.
2. Use the Dockerfile method or Node environment.
3. Start Command: `npm run start:sim`
4. After deploy, note the simulator URL (e.g. `https://sim-yourname.onrender.com`).

Hooking services together

- Set `SIMULATOR_URL` on the CRM service to `https://sim-yourname.onrender.com/simulate`.
- Set `CRM_CALLBACK_URL` on the simulator (or leave simulator default to callback to CRM) to `https://crm-yourname.onrender.com/receipt`.

Quick verification

- Visit the Vercel URL to open the UI.
- In the UI, generate a segment and launch a campaign.
- Check Render service logs for the simulator and CRM to see POST /receipt calls.

Notes & tips

- The repository uses an in-memory store for demo purposes. For production, swap `server/store.js` with a MongoDB or SQLite-backed store.
- If you want a single deployable artifact instead of two Render services, you can run the simulator as a background job inside the CRM server, but the assignment specifically wants it separate.

CI / GitHub Actions (optional)

- Add tests and a workflow that runs `npm run smoke` after both services are up (requires separate staging URLs). See `scripts/smoke.mjs` for a simple check.

