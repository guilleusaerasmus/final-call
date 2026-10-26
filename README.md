# Final Call

**Hackathon departures.** Paste a deadline exactly as the hackathon page writes it ("Deadline: Oct 26, 2026 @ 5:00pm EDT") and get a departures board in your own time zone: when the gate closes, how much build time is really left, and the last safe moment to freeze code, record the video, upload and submit.

It also catches the **daylight-saving trap**: Europe changed its clocks on Oct 25, 2026 and the US changes on Nov 1, so for one week Madrid is 5 hours ahead of New York instead of 6. Final Call tells you when the usual gap is wrong.

Built for [Build With AI: Basics](https://learn-ai-basics.devpost.com/) (Devpost Learn) with the Devpost Learn skill pack and Claude Code.

## Features
- Reads Devpost-style and other common formats: `Oct 26, 2026 @ 5:00pm EDT`, `Nov 2, 2026 11:45pm ET`, `26 Oct 2026 17:00 CET`, `2026-11-04 21:00 PT`, `9:00pm PT on Nov 4`, `UTC+2`, and more. Missing year → next occurrence; missing zone → asks.
- Generic zones (ET, PT) follow the real rules on that date; specific ones (EDT, PST) use the offset as written, with a note when the label doesn't match the region's clock.
- Gate time in split-flap tiles, live countdown and "build time left".
- Backwards shipping plan with live statuses (On time, Boarding, Final call, Departed), adjustable durations and safety buffer, and a runway timeline from now to the gate.
- Add the plan to your calendar (.ics). Remembers your deadline on this device. Nothing leaves your browser.

## Run it
No build step and no dependencies.

```bash
# any static server, e.g.
python -m http.server 8765
# then open http://127.0.0.1:8765/
```

Tests (Node 20+):

```bash
node --test
```

## How it was planned
The Devpost Learn skills turned the idea into a plan before any code: [`devpost/scope.md`](devpost/scope.md) → [`devpost/prd.md`](devpost/prd.md) → [`devpost/spec.md`](devpost/spec.md), then the build in verified slices: [`devpost/checklist.md`](devpost/checklist.md).

## Project layout
- `index.html`, `styles.css`: the board.
- `src/parse.js`: reads the pasted deadline. `src/zones.js`: time-zone words. `src/clock.js`: offsets, conversions and the DST trap, using the browser's `Intl` rules. `src/plan.js`: the backwards plan and statuses. `src/app.js`: wires it together.
- `tests/`: unit tests for the reader, the clock maths and the plan.
