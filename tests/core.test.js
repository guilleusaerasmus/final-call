import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeadline, resolveDeadline } from '../src/parse.js';
import { hhmm, dayLabel, dstTrap, usualGap } from '../src/clock.js';
import { buildPlan, statusAt, DEFAULT_STEPS, DEFAULT_BUFFER } from '../src/plan.js';

const MADRID = 'Europe/Madrid';
const NOW = Date.UTC(2026, 9, 26, 10, 0); // Mon Oct 26, 2026 11:00 in Madrid

function read(text, now = NOW, fallback) {
  const p = parseDeadline(text);
  assert.equal(p.ok, true, `parse failed for "${text}": ${p.reason}`);
  const r = resolveDeadline(p, now, fallback);
  assert.equal(r.ok, true, `resolve failed for "${text}": ${r.reason}`);
  return r;
}

test('Devpost format with EDT shows 22:00 in Madrid on Mon 26 Oct', () => {
  const r = read('Deadline: Oct 26, 2026 @ 5:00pm EDT');
  assert.equal(hhmm(r.instant, MADRID), '22:00');
  assert.equal(dayLabel(r.instant, MADRID), 'Mon 26 Oct');
  assert.equal(r.readAs, 'Oct 26, 2026 · 5:00 PM EDT (UTC−4)');
});

test('Generic ET follows the US clock change: Nov 2 11:45pm ET is 05:45 Tue in Madrid', () => {
  const r = read('Nov 2, 2026 11:45pm ET');
  assert.equal(hhmm(r.instant, MADRID), '05:45');
  assert.equal(dayLabel(r.instant, MADRID), 'Tue 3 Nov');
  assert.equal(r.usedOffset, -300);
});

test('Many hackathon formats are understood', () => {
  const cases = [
    ['October 26, 2026 at 5:00 PM ET', '22:00'],
    ['26 Oct 2026 17:00 CET', '17:00'],
    ['2026-11-04 21:00 PT', '06:00'],
    ['9:00pm PT on Nov 4, 2026', '06:00'],
    ['Nov 4, 2026 @ 9PM Pacific Time', '06:00'],
    ['Oct 30, 2026 11:59 PM UTC', '00:59'],
    ['Oct 30, 2026 23:59 UTC+2', '22:59'],
    ['10/28/2026 1:00 PM PDT', '21:00'],
  ];
  for (const [text, want] of cases) assert.equal(hhmm(read(text).instant, MADRID), want, text);
});

test('No year means the next date that is not in the past', () => {
  const r = read('Nov 4 @ 9:00pm PT');
  assert.equal(r.wall.year, 2026);
  const past = read('Oct 1 @ 9:00pm PT');
  assert.equal(past.wall.year, 2027);
});

test('Text without a zone asks for one, then uses it', () => {
  const p = parseDeadline('Oct 26, 2026 5:00 PM');
  assert.equal(p.ok, true);
  assert.equal(resolveDeadline(p, NOW, null).reason, 'no-zone');
  assert.equal(hhmm(resolveDeadline(p, NOW, 'America/New_York').instant, MADRID), '22:00');
});

test('Unreadable text gives a reason', () => {
  assert.equal(parseDeadline('').reason, 'empty');
  assert.equal(parseDeadline('soon-ish').reason, 'no-date');
  assert.equal(parseDeadline('Oct 26, 2026').reason, 'no-time');
});

test('DST trap: Madrid is 5 h ahead of New York on Oct 26, 2026, not the usual 6', () => {
  const r = read('Deadline: Oct 26, 2026 @ 5:00pm EDT');
  assert.equal(usualGap(MADRID, 'America/New_York', 2026), 360);
  const trap = dstTrap(MADRID, r.gapZone, r.instant);
  assert.ok(trap);
  assert.equal(trap.gap, 300);
  assert.equal(trap.usual, 360);
  assert.equal(new Date(trap.shownChange.at).getUTCDate(), 25); // Europe: Oct 25
  assert.equal(new Date(trap.regionChange.at).getUTCMonth(), 10); // US: Nov 1
  assert.equal(new Date(trap.regionChange.at).getUTCDate(), 1);
});

test('No DST trap for a PT deadline after both clock changes', () => {
  const r = read('Nov 4, 2026 9:00pm PT');
  assert.equal(dstTrap(MADRID, r.gapZone, r.instant), null);
});

test('A daylight abbreviation on a standard-time date is pointed out', () => {
  const r = read('Nov 20, 2026 5:00pm EDT');
  assert.ok(r.mismatch);
  assert.equal(r.mismatch.realOffset, -300);
  assert.equal(dstTrap(MADRID, r.gapZone, r.instant), null, 'a mislabelled zone is not a DST trap');
});

test('Backwards plan with defaults matches the PRD times', () => {
  const r = read('Deadline: Oct 26, 2026 @ 5:00pm EDT');
  const rows = buildPlan(r.instant, DEFAULT_STEPS, DEFAULT_BUFFER);
  const times = Object.fromEntries(rows.map((row) => [row.id, hhmm(row.start, MADRID)]));
  assert.deepEqual(times, { freeze: '18:55', record: '18:55', upload: '19:55', write: '20:15', submit: '20:45', gate: '22:00' });
  const later = buildPlan(r.instant, DEFAULT_STEPS, 120);
  assert.equal(hhmm(later.find((x) => x.id === 'submit').start, MADRID), '19:45');
});

test('Statuses follow the clock like a departures board', () => {
  const row = { start: NOW + 3 * 3600000, kind: 'step' };
  assert.equal(statusAt(row, NOW), 'on-time');
  assert.equal(statusAt(row, row.start - 90 * 60000), 'boarding');
  assert.equal(statusAt(row, row.start - 10 * 60000), 'final-call');
  assert.equal(statusAt(row, row.start + 1), 'departed');
  assert.equal(statusAt({ start: NOW, kind: 'gate' }, NOW + 1), 'closed');
});
