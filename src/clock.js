// Time-zone maths on top of the browser's own rules (Intl), no library needed.

const offsetFormatters = new Map();

// Minutes east of UTC for an IANA zone at an instant, e.g. -240 for New York on Oct 26, 2026.
export function offsetMinutes(zone, instant) {
  if (zone === 'UTC') return 0;
  let fmt = offsetFormatters.get(zone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' });
    offsetFormatters.set(zone, fmt);
  }
  const name = fmt.formatToParts(new Date(instant)).find((p) => p.type === 'timeZoneName').value;
  const m = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0; // "GMT" alone
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

// The instant (ms since epoch) of a wall-clock time in a zone.
// `zone` is either an IANA name or a fixed offset in minutes.
export function wallToInstant({ year, month, day, hour, minute }, zone) {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  if (typeof zone === 'number') return asUtc - zone * 60000;
  let guess = asUtc - offsetMinutes(zone, asUtc) * 60000;
  // A second pass settles instants near a clock change.
  guess = asUtc - offsetMinutes(zone, guess) * 60000;
  return guess;
}

export function wallParts(instant, zone) {
  const d = new Date(instant + offsetMinutes(zone, instant) * 60000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');

export function hhmm(instant, zone) {
  const p = wallParts(instant, zone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function dayLabel(instant, zone) {
  const p = wallParts(instant, zone);
  return `${DAYS[p.weekday]} ${p.day} ${MONTHS[p.month - 1]}`;
}

export function offsetLabel(minutes) {
  if (minutes === 0) return 'UTC';
  const sign = minutes < 0 ? '−' : '+';
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `UTC${sign}${h}${m ? ':' + pad(m) : ''}`;
}

// Hour gap (in minutes) from zone B to zone A at an instant: positive when A is ahead.
export function gapMinutes(zoneA, zoneB, instant) {
  return offsetMinutes(zoneA, instant) - offsetMinutes(zoneB, instant);
}

// The gap that holds on most days of the year: what people think of as "the" difference.
export function usualGap(zoneA, zoneB, year) {
  const counts = new Map();
  for (let day = 0; day < 365; day++) {
    const t = Date.UTC(year, 0, 1, 12) + day * 86400000;
    const g = gapMinutes(zoneA, zoneB, t);
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// Dates (UTC noon, ms) in `year` when the zone's offset changes, with the new offset.
export function transitions(zone, year) {
  const out = [];
  let prev = offsetMinutes(zone, Date.UTC(year, 0, 1, 12));
  for (let day = 1; day <= 365; day++) {
    const t = Date.UTC(year, 0, 1, 12) + day * 86400000;
    const off = offsetMinutes(zone, t);
    if (off !== prev) out.push({ at: t, from: prev, to: off });
    prev = off;
  }
  return out;
}

export function shortDate(ms) {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// Countdown pieces for a positive or negative difference in ms.
export function splitDuration(ms) {
  const past = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const minutes = Math.floor(s / 60);
  const seconds = s - minutes * 60;
  return { past, days, hours, minutes, seconds };
}

// The daylight-saving trap: on the deadline date, the gap between the shown zone and the
// deadline's region differs from the gap that holds most of the year, because the two
// regions change their clocks on different dates. Uses the region's real clock, so a
// mislabelled abbreviation (EDT in winter) is reported separately, not as a trap.
// Returns null when there is no trap.
export function dstTrap(shownZone, deadlineRegion, instant) {
  if (!deadlineRegion || shownZone === deadlineRegion) return null;
  const year = new Date(instant).getUTCFullYear();
  const shownChanges = transitions(shownZone, year);
  const regionChanges = transitions(deadlineRegion, year);
  if (!shownChanges.length || !regionChanges.length) return null;
  const gap = gapMinutes(shownZone, deadlineRegion, instant);
  const usual = usualGap(shownZone, deadlineRegion, year);
  if (gap === usual) return null;
  const nearest = (list) => list.reduce((best, c) => (Math.abs(c.at - instant) < Math.abs(best.at - instant) ? c : best));
  return { gap, usual, shownChange: nearest(shownChanges), regionChange: nearest(regionChanges) };
}
