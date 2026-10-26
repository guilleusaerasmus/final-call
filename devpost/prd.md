---
doc: prd
status: approved
---

# Final Call — Product Requirements

A one-page departures board that turns a hackathon deadline, pasted exactly as the hackathon page writes it, into the last safe moment for each shipping step in your own time zone, for online hackathon participants outside the organizer's time zone.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
1. The user opens the page. The board already shows an example deadline ("Deadline: Oct 26, 2026 @ 5:00pm EDT") so it is never empty, with a hint to paste their own.
2. They paste the deadline line copied from the hackathon page into the input at the top and press Enter (or the board updates as soon as the text is readable).
3. The board shows, large: **Gate closes** at the deadline in their local time and date, the live countdown, and a small "read as" line showing how the text was understood (e.g. "Oct 26, 2026 5:00 PM EDT (UTC−4)").
4. If this week's hour gap between their zone and the deadline's zone differs from the usual gap, a warning strip explains it in one sentence with the two numbers.
5. Below, the shipping plan: one board row per step, from first to last, each with its last safe start time in their zone, the step's duration and a status that updates live.
6. They adjust the safety buffer or a step's duration; every time and status on the board recalculates at once.
7. Success: they know exactly when to stop building and start the video, and which step is boarding now.
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

## Screens and Layout
One screen, top to bottom:
- **Header:** product name "Final Call", the current local time ticking, and "Times shown in: [zone]" with a selector to change the zone.
- **Input bar:** a wide text field ("Paste the deadline line from the hackathon page"), plus two or three example chips (Devpost EDT, "11:45pm ET", "9:00 PM PT").
- **Gate panel:** "GATE CLOSES" with the local date and time in large split-flap characters, the countdown (days, hours, minutes, seconds), and the "read as" line.
- **DST warning strip** (only when relevant).
- **Departures table:** columns TIME (last safe start) · STEP · DURATION · STATUS.
- **Plan settings:** safety buffer choice and each step's duration, compact, under the table.
Works on a laptop screen first; stacks cleanly on a phone.

## Look and Feel
- Airport departures board: near-black board, amber/yellow characters, split-flap style tiles for the gate time, monospace type for all times.
- Status colours like a real board: On time (green), Boarding (amber, blinking dot), Final call (red, pulsing), Departed (grey, struck through), Closed (red).
- Flip animation when a time or status changes. Respect reduced-motion settings.
- Plain, calm language with airport words ("gate closes", "boarding", "final call"). English UI.
- Avoid: generic purple-gradient AI dashboard look, emoji clutter.
Source: `scope.md > Inspiration & Identity`.

## Features and Behavior

### Reading the deadline
- Accepts the common hackathon formats: "Oct 26, 2026 @ 5:00pm EDT", "October 26, 2026 at 5:00 PM ET", "Nov 2, 2026 11:45pm ET", "26 Oct 2026 17:00 CET", "2026-11-04 21:00 PT", "9:00pm PT on Nov 4", with or without a leading "Deadline:" and with or without the year.
- Time zone words understood: ET/EST/EDT, CT/CST/CDT, MT/MST/MDT, PT/PST/PDT, UTC/GMT/Z, CET/CEST, BST, WET/WEST, IST, JST, SGT, AEST/AEDT, and explicit offsets like UTC+2 or -04:00.
- Generic names (ET, PT) follow the real rules of that region on that date; specific ones (EDT, PST) use exactly the offset written.
- No year → the next date that is not in the past.
- Acceptance:
  - [ ] Pasting "Deadline: Oct 26, 2026 @ 5:00pm EDT" in Europe/Madrid shows Gate closes Mon 26 Oct, 22:00.
  - [ ] Pasting "Nov 2, 2026 11:45pm ET" in Europe/Madrid shows Tue 3 Nov, 05:45 (ET is back on EST by then).
  - [ ] The "read as" line names the zone and its UTC offset.

### Gate panel and countdown
- Large local date and time of the deadline, the zone it is shown in, and a countdown ticking every second.
- After the deadline: "Gate closed" and how long ago.
- Acceptance:
  - [ ] The countdown decreases each second and matches the difference between now and the deadline.
  - [ ] Changing "Times shown in" changes every time on the board, not the countdown.

### DST warning
- Compares the hour gap between the shown zone and the deadline's zone on the deadline date with the usual gap for most of that year. If they differ, a strip says so with both numbers and the two clock-change dates involved.
- If the text says a daylight abbreviation on a date when that region is on standard time (or the reverse), a note says which offset was used.
- Acceptance:
  - [ ] Oct 26, 2026 5:00pm EDT seen from Europe/Madrid shows: Madrid is 5 h ahead of New York on that date, not the usual 6; Europe changed on Oct 25 and the US changes on Nov 1.
  - [ ] Nov 4, 2026 9:00pm PT seen from Europe/Madrid shows no warning (usual 9 h gap).

### The shipping plan (departures table)
- Default steps, in shipping order: Code freeze (milestone), Record & edit video (60 min), Upload video & check link (20 min), Write submission text (30 min), Submit on Devpost (15 min); then the safety buffer (default 60 min) before Gate closes.
- Times are computed backwards from the deadline: each step's last safe start = the next step's start minus this step's duration; the last step ends where the buffer begins.
- Status from now vs the step's last safe start: On time (more than 2 h before), Boarding (2 h to 30 min before), Final call (less than 30 min before), Departed (start time has passed). The Gate closes row shows Open or Closed.
- Durations and the buffer (30, 60 or 120 min) can be changed; everything recalculates immediately.
- Acceptance:
  - [ ] With the defaults and the Oct 26 EDT deadline in Madrid: Submit 20:45, Write 20:15, Upload 19:55, Record 18:55, Code freeze 18:55, Gate closes 22:00.
  - [ ] Statuses change on their own as time passes, with no reload.
  - [ ] Changing the buffer to 120 min moves every step one hour earlier.

## States and Boundaries
- **First use** — example deadline already loaded, so the board is full.
- **Unreadable text** — a short message under the input ("I couldn't find a date and time in that") with two example formats; the board keeps the last valid deadline.
- **No time zone in the text** — the board asks "Which time zone is this deadline in?" with a zone selector next to the input, and uses the answer.
- **Deadline already passed** — Gate closed, all steps Departed, countdown shows time since.
- **Returning** — the last pasted deadline, buffer and durations are remembered on this device.

## Product Decisions
- Idea, kernel and design direction were researched and proposed by the agent at the learner's request ("Busca el mejor producto posible"); the learner approves this document.
- Paste a line instead of reading a URL — no server needed, and it works with any hackathon site.
- Airport board metaphor — makes "last safe moment" instantly readable and memorable.
- English UI — hackathon judges and most participants read English.

## What We're Building
Everything under The Core Journey, Features and Behavior and States and Boundaries above, on one page.
Added during the build (see `checklist.md > Revisions`): a "Build time left" line (time until code freeze), a runway timeline from now to the gate with a NOW marker, and "Add to calendar" (.ics export of the plan).

## Deferred From the POC
- Several deadlines on one board — one deadline proves the kernel.
- Share link — no accounts or server in the POC.

## Possible Later Enhancements
- A browser extension that adds the board next to the deadline on Devpost pages.
- Custom steps for different hackathon formats (pitch deck, live demo).

## Non-Goals
- Fetching hackathon pages by URL — needs a server and breaks on site changes.
- Notifications — need permissions and background work.
- Accounts or sync — nothing personal needs storing.

## Open Questions
None blocking `4-spec`.
