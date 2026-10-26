---
doc: scope
status: approved
---

# Final Call

A departures board for your hackathon deadline: paste the deadline exactly as the hackathon page writes it, and see the last safe moment to start each part of shipping, in your own time zone.

## The Unique Kernel
It doesn't just convert a time zone. It works backwards from the real deadline and tells you, in your local time, the **last safe moment** to freeze code, record the video, upload and submit, like the gate times on an airport board. It also warns you about the DST weeks, when the usual hour gap between your city and the deadline's city is wrong (Europe moved its clocks on Oct 25, 2026; the US moves on Nov 1, so Madrid is 5 hours ahead of New York this week, not 6).

## Who It's For
An online hackathon participant outside the organizer's time zone, juggling several deadlines written as "Oct 26, 2026 @ 5:00pm EDT", "11:45pm ET" or "9:00pm PT". Today they convert by hand, google the time zone, or trust a countdown and still leave the video for the last hour.

## The Core Loop
They copy the deadline line from the hackathon page and paste it. The board shows when the gate closes in their time, a live countdown, and a row per shipping step with its last safe start time and a status (On time, Boarding, Final call, Departed). They come back to it during the day to see which step is boarding now.

## Inspiration & Identity
Airport departures board: dark board, amber split-flap characters, monospace, flight-style statuses and "gate closes" language. Calm and exact, a little playful. It should feel like a real board, not a generic AI dashboard.
Reference: split-flap departure boards (e.g. https://en.wikipedia.org/wiki/Split-flap_display).

## Why This Matters to the Learner
They are entering several online hackathons this month with deadlines in ET, PT and CET while living in Spain, and this week the US/Europe DST mismatch shifts every deadline by an hour versus the usual gap.

## What "Working" Looks Like
On a screen, in under a minute: paste "Deadline: Oct 26, 2026 @ 5:00pm EDT" → the board shows "Gate closes 22:00" in Madrid time, a live countdown, a DST warning ("this week Madrid is 5 h ahead of New York, not the usual 6"), and the backwards plan with a last-safe-moment time and status for each shipping step.
The "oh, that's cool" beat: the steps flip on the board like a departures display, and one of them already says "Final call".

## The POC Boundary
- Paste one deadline in the common hackathon formats (Devpost style, ET/PT/CT/MT/UTC/CET and similar abbreviations, with or without year).
- Deadline shown in the user's local time zone, with the source reading shown so they can trust it.
- Live countdown.
- DST mismatch warning when the gap this week differs from the usual gap.
- Backwards shipping plan with a few default steps, editable durations and a safety buffer, each with a last-safe time and live status.
- A "try an example" deadline so the first screen is never empty.

## Later
- Several saved deadlines on one board.
- Export the plan to a calendar file.
- Share a link to a board.

## Explicitly Cut
- Reading a hackathon URL directly: needs a server to fetch other sites; pasting the line is enough to prove the idea.
- Accounts and sync: nothing personal needs storing to prove the kernel.
- Notifications: require permissions and background work; the board itself proves the timing.
