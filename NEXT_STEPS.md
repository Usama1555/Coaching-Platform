# Next Steps

This file is the practical build guide for what comes next after the current beta state of the Coaching Platform.

It is meant to answer four questions clearly:

1. Where the project stands right now
2. What is already done
3. What should happen next
4. In what order we should build the remaining work

## 1. Current Status

The platform is now in a `beta-ready, partial Phase 2` state.

That means:

- Phase 1 is no longer just a basic MVP
- some Phase 2 capabilities already exist
- the product is strong enough to test with real usage
- the next step should be focused completion, not random feature expansion

## 2. What Is Already Done

### Core Product

- Coach and client authentication
- Owner-only approval flow for coaches
- Coach dashboard
- Client dashboard
- Coach client invitation and ownership flow
- Coach client roster and detail pages
- Workout assignment flow
- Client workout logging
- Session history and coach comments

### Progress And Accountability

- Nutrition logging
- Body-metric / check-in logging
- Progress and trend views
- Date-based review pages
- Combined review of:
  - workout
  - nutrition
  - check-in data

### Account And Admin

- Shared profile page
- Name change
- Password change
- Owner dashboard
- Coach approval controls
- Coach client counts

### Deployment

- GitHub repo connected
- Backend deployed on Render
- Frontend deployed on Vercel
- Live deployment flow already working

## 3. Immediate Priority

Do not jump into too many new systems at once.

The immediate priority should be:

- validate the live beta flow with real usage
- fix any friction or instability
- then finish the missing high-value Phase 2 features in order

## 4. Core Flow To Validate First

This is the live flow we should test end to end before expanding too far:

1. Owner logs in
2. Owner approves coach
3. Coach logs in
4. Coach invites or creates client
5. Coach assigns workout
6. Client logs workout
7. Client saves nutrition
8. Client saves check-in
9. Coach reviews that client by date

If this flow is smooth, then the platform is in a strong place to continue building.

## 5. Recommended Build Order

Build the next features in this order.

### Step 1: Stabilization Pass

Before major new features:

- test the full live flow with real accounts
- note UI friction and missing feedback states
- clean any broken spacing, wording, or confusing navigation
- confirm owner, coach, and client roles behave correctly

### Step 2: Meal Plan System

This is the strongest next feature because it completes the nutrition side in a coach-friendly way.

Build:

- coach meal plan builder
- meal plan assignment to client
- active meal plan page for client
- meal plan display for today

Why first:

- coaches expect it
- it connects naturally to nutrition logs
- it increases product value immediately

### Step 3: Progress Photos

Build:

- photo upload
- photo storage
- photo gallery
- side-by-side comparison view

Why second:

- highly visible coaching value
- strong sales feature
- fits naturally with weekly check-ins

### Step 4: Reminder Automation

Build:

- Sunday check-in reminders
- missed activity reminders
- reminder logs
- in-app reminder visibility

Why third:

- reduces manual coach follow-up
- improves accountability
- makes the product feel more complete

### Step 5: Nutrition Compliance Dashboard

Build:

- weekly calorie compliance
- weekly protein compliance
- coach nutrition summary
- compliance trend display

Why after reminders:

- it becomes more useful once nutrition logging is more consistent
- the data is stronger after coaches and clients actually use the system

## 6. What To Delay For Now

These should stay lower priority for the moment:

- AI expansion
- advanced automation beyond reminders
- pricing/billing complexity
- large visual redesigns
- niche analytics before real coach demand

## 7. AI Position

AI should stay optional and mostly parked for now.

Reason:

- it adds cost
- it is not required for the core coaching workflow
- the product still has more important non-AI features to complete

Recommended approach:

- keep AI disabled by default
- only revisit after the core coaching workflow is fully stable

## 8. Practical Rule For New Work

When deciding what to build next:

- choose features that improve real coach workflow
- choose clarity over feature count
- avoid adding new systems unless they strengthen the live user journey

## 9. Best Next Action

If we continue immediately, the best next action is:

`Start the meal plan system`

That is the cleanest and most valuable next feature block from here.
