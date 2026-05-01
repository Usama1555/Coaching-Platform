# Coaching Platform

Science-based online coaching SaaS built for coaches and clients.

## Current Status

This project is in the Phase 1 beta stage and already includes:

- Coach-only public signup with owner approval flow
- Owner dashboard for approving coaches and tracking coach client counts
- Coach and client authentication
- Coach dashboard, client roster, and client detail views
- Workout plan assignment
- Client workout logging with overload cues
- Client nutrition logging
- Client body-metric check-ins
- Progress charts for training, nutrition, and bodyweight

AI is treated as optional and can stay disabled during beta.

## Project Structure

```text
client/
server/
PROJECT_RULES.md
IDEAS.md
KNOWN_ISSUES.md
README.md
```

## Working Docs

Use these files to keep product decisions and follow-up work organized:

- [PROJECT_RULES.md](./PROJECT_RULES.md) for current product and UX rules
- [IDEAS.md](./IDEAS.md) for future features and business ideas
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for bugs, rough edges, and testing gaps

## Local Setup

1. Copy `server/.env.example` to `server/.env`.
2. Copy `client/.env.example` to `client/.env`.
3. Install dependencies in both `server/` and `client/`.
4. Start the API and frontend.

Example commands:

```powershell
cd server
npm install
npm run dev

cd ..\client
npm install
npm run dev
```

The API runs on `http://localhost:5000` by default and the client runs on `http://localhost:5173`.

## Required Environment Variables

### Server

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `OWNER_EMAILS`

### Client

- `VITE_API_URL`

## Optional Environment Variables

### Server

- `EMAIL_FROM`
- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APP_URL`

### Client

- `VITE_ENABLE_AI_ASSISTANT`

Set `VITE_ENABLE_AI_ASSISTANT=false` for the Phase 1 beta if you do not want to expose or pay for AI yet.

`CLIENT_URL` can be a comma-separated allowlist, such as `http://localhost:5173,https://your-frontend.vercel.app`.
Use `APP_URL` for the single public frontend URL used in owner emails and other generated links.

## Coach Approval Flow

Public signup now works like this:

1. A coach submits the public register form.
2. The coach account is created in `pending` status.
3. Owner emails from `OWNER_EMAILS` can access `/owner`.
4. The owner dashboard shows every coach and their assigned client count.
5. Pending coaches cannot enter the coach workspace until approved.

Client counts are derived from each client's `coachId`, so clients are not mixed across coaches.

## Owner Email Notifications

If you want owner notification emails on new coach signups, configure:

- `OWNER_EMAILS`
- `EMAIL_FROM`
- `RESEND_API_KEY`

The current implementation sends a simple transactional email through Resend-compatible API calls.

## Beta Deployment Recommendation

Ship Phase 1 first to a small set of coaches before building Phase 2.

Recommended sequence:

1. Deploy the server and client.
2. Keep AI disabled for the first beta.
3. Invite 3 to 5 real coaches.
4. Let them use the core workflow for 2 to 4 weeks.
5. Fix onboarding friction and missing basics before expanding into Phase 2.

## Deployment Setup

The current recommended production setup is:

- `Render` for the Express API
- `Vercel` for the Vite React frontend

### Backend on Render

Create a new `Web Service` from the `server/` directory with:

- Runtime: `Node`
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Set these environment variables on Render:

- `MONGODB_URI`
- `JWT_SECRET`
- `OWNER_EMAILS`
- `CLIENT_URL`
- `APP_URL`
- `EMAIL_FROM` if using owner emails
- `RESEND_API_KEY` if using owner emails
- `ANTHROPIC_API_KEY` only if you later enable AI
- `CLOUDINARY_*` only when you add photo uploads

### Frontend on Vercel

Create a new Vercel project from the `client/` directory with:

- Framework preset: `Vite`
- Root Directory: `client`

Set this environment variable on Vercel:

- `VITE_API_URL=https://your-render-service.onrender.com/api`

This repo includes `client/vercel.json` so React Router deep links work in production.

### Order of deployment

1. Deploy the backend on Render first and copy its public URL.
2. Deploy the frontend on Vercel using that Render URL in `VITE_API_URL`.
3. Copy the final Vercel production URL.
4. Update Render:
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `APP_URL=https://your-frontend.vercel.app`
5. Redeploy the Render service so CORS and owner email links use the final frontend URL.

### Important note

This project is not currently in a Git repository, so a Git-based Render/Vercel deployment needs a GitHub, GitLab, or Bitbucket repo first.
