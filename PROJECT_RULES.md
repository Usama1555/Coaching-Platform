# Project Rules

This file captures the current product and implementation decisions for the Coaching Platform so future work stays consistent.

## Product Stage

- The platform is in `Phase 1 beta`.
- Build decisions should prioritize `real coach usability`, `clarity`, and `shipping speed`.
- `Phase 2` should only expand after real beta usage exposes what coaches actually need most.

## Business Rules

- Public signup is `coach-only`.
- Client self-signup should not be exposed publicly.
- New coach accounts are created as `pending approval`.
- Only owner emails listed in `server/.env` under `OWNER_EMAILS` should have owner access.
- Owners approve coaches from the owner dashboard before a coach can use the platform.
- Each client belongs to one coach through `Client.coachId`.
- Clients must never be mixed across coaches in dashboards, counts, or actions.

## Account Rules

- Both coaches and clients can update their own `name` and `password` from the shared `/profile` page.
- Coaches can manage client accounts from the coach workspace.
- If a client leaves coaching, the coach can delete that client account.

## AI Rules

- AI is optional and should stay disabled during beta unless explicitly needed.
- Use `VITE_ENABLE_AI_ASSISTANT=false` by default.
- Do not design core workflows around AI being available.

## Coach Workspace Rules

- `/coach` is the main dashboard.
- `/coach/clients` is the `overview` page, not the full directory.
- The coach overview page should stop after `Needs attention today`.
- The full directory lives on `/coach/clients/roster`.
- The roster should stay lightweight and coach-efficient:
  - show client names first
  - avoid clutter
  - keep email out of the visible list
  - use `View details` and `Manage account` as the main row actions
- Assigning workouts should happen from the client detail flow, not from every roster row.

## UI Rules

- Prefer `mobile-first` layouts, even for desktop-heavy flows.
- Desktop should still feel dense and efficient where coaches manage many clients.
- Avoid tall, repetitive card layouts when a compact list is more useful.
- Use the existing visual language:
  - `glass-panel`
  - `primary-button`
  - `secondary-button`
  - `input-shell`
- Make pages feel intentional and product-focused, not generic admin templates.

## Documentation Rules

- Keep product decisions in this file.
- Keep future feature ideas in `IDEAS.md`.
- Keep unresolved bugs, awkward flows, and testing gaps in `KNOWN_ISSUES.md`.

## Practical Working Rule

- When there is a choice between adding more features or making the coach workflow clearer, choose clarity first.
