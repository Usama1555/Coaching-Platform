# Known Issues

This file tracks current bugs, rough edges, and testing gaps that are worth revisiting.

## Current UX Gaps

- From the new client roster flow, `View details` opens the client detail page, but the back path may still feel overview-focused instead of roster-aware.
- The coach client experience was recently split into overview and roster pages, so it should be visually reviewed again with a larger real dataset.

## Testing Gaps

- Some newer flows were validated by build checks and direct inspection, but not all were fully tested end-to-end with live user behavior.
- Coach owner approval should be rechecked once deployed to confirm the full signup, approval, and login flow behaves the same outside local development.
- Client account management from the roster should be manually tested again:
  - password reset
  - client deletion
  - visible roster refresh after deletion

## Integration Gaps

- Owner notification email depends on valid `OWNER_EMAILS`, `EMAIL_FROM`, and `RESEND_API_KEY`.
- Cloudinary and reminder automation are planned but should be treated as later-phase work unless already configured.

## Product Gaps

- No billing or paid coach gating is in place yet.
- AI is intentionally optional and disabled by default for beta, so no core workflow should depend on it.

## Process Note

- If a new issue is found, add it here instead of relying on memory or chat history.
