---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (the learner asked the agent to do all the work it is allowed to do, under a same-day deadline)

## Slices

- [x] **1. Paste a deadline and see when the gate closes in your time**
  Becomes usable: The page reads the example or a pasted Devpost-style line and shows the gate time in split-flap tiles, the local date and zone, the live countdown and the "read as" line.
  Why now: Proves the whole path (reader → clock → board) on the first slice; the kernel needs a trustworthy instant.
  PRD ref: `prd.md > The Core Journey` (steps 1-3), `prd.md > Reading the deadline`, `prd.md > Gate panel and countdown`
  Spec ref: `spec.md > Deadline reader`, `spec.md > Clock`, `spec.md > Board UI`
  Build: Static page, `src/parse.js`, `src/zones.js`, `src/clock.js`, gate panel in `src/app.js`.
  Verify (mechanical): `node --test` passes the format and conversion tests (Oct 26 5:00pm EDT → 22:00 Madrid; Nov 2 11:45pm ET → 05:45 Tue); page served locally renders 22:00 and a ticking countdown.
  Learner check: Open the page, paste "Nov 2, 2026 11:45pm ET" and see Tue 3 Nov, 05:45.
  Commit: `Read a pasted deadline and show the gate in local time`

- [x] **2. The daylight-saving trap is called out**
  Becomes usable: A warning strip appears when this week's hour gap differs from the usual one, naming both clock-change dates; a separate note appears when the page's abbreviation does not match the region's clock.
  Why now: This is the kernel's most surprising moment and the demo's "oh" beat.
  PRD ref: `prd.md > DST warning`
  Spec ref: `spec.md > Clock`
  Build: `transitions`, `usualGap`, `dstTrap` in `src/clock.js`; strip and note in `src/app.js`.
  Verify (mechanical): Tests: Madrid vs New York on Oct 26, 2026 is 5 h, usual 6 h, Europe changed Oct 25, US changes Nov 1; no trap for Nov 4 PT; "EDT" on Nov 20 gives a mismatch note and no trap.
  Learner check: With the example loaded, read the amber strip; switch "Times shown in" to New York and see it disappear.
  Commit: `Warn about the daylight-saving gap between regions`

- [x] **3. The backwards shipping plan, live**
  Becomes usable: Departures table with last safe start, duration and live status for Code freeze, video, upload, text, submit and the gate; buffer and durations adjustable; "Build time left" line; runway timeline with a NOW marker.
  Why now: Turns a converted time into the decision the user actually needs: when to stop building.
  PRD ref: `prd.md > The shipping plan (departures table)`, `prd.md > The Core Journey` (steps 5-7)
  Spec ref: `spec.md > Planner`, `spec.md > Board UI`
  Build: `src/plan.js`; table, settings, runway and build-time line in `src/app.js` and `styles.css`.
  Verify (mechanical): Tests: defaults give 18:55 / 18:55 / 19:55 / 20:15 / 20:45 / 22:00; a 2 h buffer moves Submit to 19:45; statuses on-time → boarding → final call → departed.
  Learner check: Change the buffer to 2 h and watch every row flip one hour earlier.
  Commit: `Plan shipping steps backwards with live statuses`

- [x] **4. States, persistence and calendar export**
  Becomes usable: Unreadable text, missing time and missing zone states; last deadline and plan remembered on the device; "Add to calendar" downloads the plan as an .ics file.
  Why now: Makes the board dependable to come back to during the day.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: error and zone prompt handling, `localStorage`, `.ics` builder in `src/app.js`.
  Verify (mechanical): In Chrome: "soon-ish" shows the error and keeps 22:00; "Oct 26, 2026 5:00 PM" asks for a zone and New York gives 22:00; "Nov 20, 2026 5:00pm EDT" shows the mismatch note.
  Learner check: Paste a line with no zone and pick one from the prompt.
  Commit: `Handle unreadable input, remember the plan, export to calendar`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — learner opens the live page and tries the core journey (shared with the final review: single-session tiny build)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] App map generated: `devpost/app-map.html` (reference route: paste → `parseDeadline` → `wallToInstant`/`dstTrap` → `buildPlan` → `render`; "to change this" pointers; practice: written acceptance criteria became tests and judged the EDT-in-November fix).
- Activity: recap only, not a hands-on tour; the learner asked the agent to handle the work. Reflection question not asked.

## Revisions

- Added "Build time left", the runway timeline and calendar export during the build (calendar export was listed under Later in scope; promoted because it makes the plan usable outside the page). Recorded in `prd.md > What We're Building`.
- DST trap now compares real clocks only; a mislabelled abbreviation (EDT in winter) is a separate note. Found while testing in the browser.
- Slices 1-4 were built and verified in one working session and committed together in the first commit, not one commit per slice.
