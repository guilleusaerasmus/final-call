---
doc: spec
status: approved
---

# Final Call — Technical Spec

## How This Works, In Plain Language
Final Call is a single web page that runs entirely in your browser. There is no server and no account.
- A **reader** looks at the text you paste and finds the date, the time and the time zone.
- A **clock** turns that into one exact moment, using the browser's own time-zone rules, and shows it in your zone. It also compares this week's hour gap with the usual one to spot the daylight-saving trap.
- A **planner** works backwards from that moment and gives each shipping step its last safe start time and a status.
- The **board** draws all of it as an airport departures board and refreshes every second.
The browser already knows every country's clock changes, so no time-zone library or online service is needed. That keeps the app small, fast and impossible to break on demo day.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. The page loads → the board reads the saved deadline from this device, or the example → the reader parses it → the clock computes the moment → the planner builds the rows → the board renders.
2. The user pastes a line → the reader returns date, time and zone (or a reason it failed) → on success the clock and planner run again and the board flips the changed tiles; on failure the message appears and the last good deadline stays.
3. Every second → the board updates the countdown and recomputes statuses (On time, Boarding, Final call, Departed).
4. The user changes the buffer, a duration or the shown zone → the planner and board run again; the choice is saved on this device.

## Stack
- Plain HTML, CSS and JavaScript modules. No framework, no build step, no dependencies.
  Reason: one page with one loop; nothing to install for anyone who opens the repo.
- Browser `Intl.DateTimeFormat` with IANA time zones for all offset and DST maths. Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- Tests with Node's built-in test runner (`node --test`, Node 24). Docs: https://nodejs.org/api/test.html
- Fonts from Google Fonts with system monospace fallback.

## Where It Runs and How Someone Tries It
- Runs in any modern browser. Locally: `npx serve .` (or any static server) in the project folder, then open the printed address. Opening `index.html` directly also works in Chrome when served; modules need a server.
- Tests: `node --test`.
- Deployment: GitHub Pages from the `main` branch root of the public repository, for a live link. The required demo video is recorded from the deployed page.

## Look and Feel
From `prd.md > Look and Feel`:
- Board background near-black (#0b0b0c), panel #141416, tile #1d1d20 with a thin centre split line; characters amber #ffb000; secondary text #8a8a8f.
- Statuses: On time #3ddc84, Boarding #ffb000 with blinking dot, Final call #ff4d4d pulsing, Departed #6b6b70 struck through, Closed #ff4d4d.
- Type: "JetBrains Mono" for times and board rows, "Inter" for small UI text. Uppercase board labels with letter spacing.
- Split-flap tiles for the gate time; a short flip animation when a character changes; no animation with `prefers-reduced-motion`.
- Dense like a real board, generous spacing around it. Copy uses airport words.

## Components

### Deadline reader (`src/parse.js`)
Finds month, day, optional year, time (12 or 24 hour) and a zone token or offset in free text. Returns `{ok, parts, zone, zoneLabel, kind}` or `{ok:false, reason}`. Handles a missing year by choosing the next non-past date, and a missing zone with `reason: 'no-zone'`.
PRD ref: `prd.md > Reading the deadline`.

### Zone table (`src/zones.js`)
Maps abbreviations to either a region (ET → America/New_York, generic) or a fixed offset (EDT → −04:00, specific), plus the region that specific names belong to, for the mismatch note. Also the list of zones for the "Times shown in" selector.
PRD ref: `prd.md > Reading the deadline`.

### Clock (`src/clock.js`)
`offsetMinutes(zone, instant)` via `Intl` `longOffset`; `wallToInstant(parts, zone)` by iterating the offset; `formatInZone(instant, zone)`; `usualGap(zoneA, zoneB, year)` as the most common daily gap in that year; `transitions(zone, year)` for the clock-change dates used in the warning.
PRD ref: `prd.md > Gate panel and countdown`, `prd.md > DST warning`.

### Planner (`src/plan.js`)
Default steps and buffer; `buildPlan(deadline, steps, bufferMin)` returns rows with last safe start; `statusAt(row, now)` returns on-time, boarding, final-call or departed.
PRD ref: `prd.md > The shipping plan (departures table)`.

### Board UI (`src/app.js`, `index.html`, `styles.css`)
Input, example chips, zone selector, gate panel with split-flap tiles, countdown, warning strip, departures table, plan settings, error and no-zone states, and saving to `localStorage`.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries`.

## Data Model
State held in memory and saved to `localStorage` under one key:
`{ text, shownZone, bufferMin, durations: {record, upload, write, submit}, manualZone }`.
Derived each tick, never stored: the deadline instant, gap warning, plan rows, statuses.
Leaving and coming back restores the saved state; clearing site data returns to the example.

## File Structure
```
build-ai-basics/
├── index.html          # the page
├── styles.css          # departures-board styling
├── src/
│   ├── parse.js        # reads the pasted deadline text
│   ├── zones.js        # time-zone words and selector list
│   ├── clock.js        # offsets, conversions, DST gap check
│   ├── plan.js         # backwards shipping plan and statuses
│   └── app.js          # wires the board together, saves state
├── tests/              # node --test unit tests for parse, clock, plan
├── README.md           # what it is, how to run, live link
└── devpost/            # Devpost learning workspace (scope, prd, spec, checklist, app map)
```

## External Services and Dependencies
- Google Fonts (JetBrains Mono, Inter): CSS link, no key, free. If blocked, system monospace is used.
- GitHub Pages hosting: free for public repositories, no key.

## Important Failure Modes
- **Text in a format the reader doesn't know** → message under the input with two example formats; the board keeps the last good deadline.
- **No time zone in the text** → "Which time zone is this deadline in?" selector appears; the board uses the chosen zone.
- **Ambiguous abbreviation (IST, CST)** → the most common hackathon reading is used (IST = India, CST = US Central) and the "read as" line shows it so the user can spot it.

## What Was Simplified and Why
- **Paste a line** instead of reading the hackathon URL — no server; works on every site. The fuller version would need a fetch proxy and per-site parsing.
- **One deadline** instead of a list — proves the kernel; a list is a later slice.
- **Fixed default steps with editable durations** instead of custom steps — enough for hackathon shipping.

## Decisions and Open Issues
- Plain browser stack, no dependencies — chosen by the agent for reliability on demo day; the learner approves with this document.
- `Intl` for time zones instead of a library — the browser already ships the rules; verified in Node 24 that `longOffset` returns "GMT-04:00" for New York on Oct 26, 2026.
- Genuine unknown checked during the build: that Chrome's `Intl` gives the same offsets as Node for the DST week (the tests encode the expected values).
- No open questions from `prd.md`.
