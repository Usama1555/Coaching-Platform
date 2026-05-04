# Custom Features Added

This file records the features and product changes we implemented that go beyond the original markdown planning docs you provided.

It is meant to track `custom additions`, `workflow changes`, and `platform decisions` that were introduced during build, so they are not confused with the original roadmap.

## 1. Access And Approval System

- Public signup was changed to `coach-only`.
- Client self-signup was removed from the public flow.
- New coach accounts are created as `pending approval`.
- Owner accounts are determined through `OWNER_EMAILS` in `server/.env`.
- Owners can log in to a separate owner workspace.
- Approved owners are not blocked by the pending-coach gate.
- Coach access can be approved from an owner-only dashboard instead of being automatically granted.

## 2. Owner Workspace

- Added an `owner dashboard` at `/owner`.
- Added owner visibility into all coach accounts.
- Added per-coach client counts using `Client.coachId`, so client ownership stays separated correctly.
- Added owner approval controls for pending coaches.
- Added owner labeling in the UI so it is obvious when the signed-in account is the owner account.
- Added owner notification email wiring for new coach access requests.

## 3. Account Management

- Replaced the old profile dropdown concept with a dedicated `/profile` page.
- Both `coach` and `client` users can change their own `name`.
- Both `coach` and `client` users can change their own `password`.
- Profile updates refresh the visible auth/user state immediately after save.

## 4. Coach Client-Management Improvements

- Split the coach clients area into two different jobs:
  - `/coach/clients` for overview and priorities
  - `/coach/clients/roster` for the full client directory
- Added a `Needs attention today` concept to the coach flow.
- Added a dedicated lightweight client roster page instead of forcing all clients into the overview.
- Removed visible email clutter from the main roster.
- Simplified roster actions to focus on:
  - `View details`
  - `Manage account`
- Added search, filtering, and sorting improvements for coach client browsing.
- Simplified the client detail page so it focuses on current snapshot and review flow instead of long repeated history blocks.

## 5. Cross-Role Day Review Flow

- Added a dedicated client date-review page at `/client/review/day`.
- Added a dedicated coach date-review page at `/coach/clients/:clientId/review`.
- Added a shared review interface that combines:
  - workout for a selected date
  - nutrition for the same date
  - check-in/body-metric data for the same date
- Added coach comment support inside the coach-facing day-review flow.
- Moved this date-review experience out of the crowded main pages and behind explicit buttons.

## 6. Client Dashboard And Progress Simplification

- Removed duplicated shortcut-heavy action sections from the client dashboard.
- Reduced the client progress hero actions so it stays focused on the date-review flow instead of repeating navbar navigation.
- Kept navigation clearer by relying more on the top navbar and less on repeated button clusters.

## 7. AI Cost-Control Changes

- Added a frontend feature flag so the AI assistant can stay disabled by default.
- Hid AI entry points unless `VITE_ENABLE_AI_ASSISTANT=true` is explicitly set.
- Kept the core product usable without AI enabled.

## 8. Deployment And Ops Additions

- Added deployment-safe `.env.example` cleanup so example files do not expose real-looking secrets.
- Added a client-side `.env.example`.
- Added Vercel SPA rewrite support for React Router deep links.
- Added production frontend URL handling for backend links and notifications.
- Prepared the repo for Render + Vercel deployment.
- Added internal working docs:
  - `PROJECT_RULES.md`
  - `IDEAS.md`
  - `KNOWN_ISSUES.md`

## 9. Documentation Purpose

- This file should be updated whenever we add a product feature, workflow, or business rule that was `not part of your original markdown specs`.
- Use this as the quickest reference for `what changed beyond the original plan`.
