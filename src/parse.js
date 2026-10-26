// Reads a deadline line copied from a hackathon page, e.g. "Deadline: Oct 26, 2026 @ 5:00pm EDT".
import { ZONE_WORDS } from './zones.js';
import { offsetMinutes, wallToInstant, offsetLabel } from './clock.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const ORD = '(?:st|nd|rd|th)?';
const LONG_ZONE_NAMES = { eastern: 'ET', central: 'CT', mountain: 'MT', pacific: 'PT' };

function monthIndex(word) {
  return MONTHS.indexOf(word.slice(0, 3).toLowerCase()) + 1;
}

function findZone(text) {
  // Explicit offsets: "UTC+2", "GMT-04:00", "UTC−5:30".
  let m = text.match(/\b(?:UTC|GMT)\s*([+\-−])\s*(\d{1,2})(?::?(\d{2}))?\b/i);
  if (m) {
    const sign = m[1] === '+' ? 1 : -1;
    const offset = sign * (Number(m[2]) * 60 + Number(m[3] || 0));
    return { zone: { kind: 'offset', offset, token: m[0].replace(/\s+/g, ''), label: offsetLabel(offset) }, match: m[0] };
  }
  // Bare ISO offset right after a time: "21:00-04:00", "21:00+0200".
  m = text.match(/\d{1,2}:\d{2}(?::\d{2})?\s*([+\-−])(\d{2}):?(\d{2})\b/);
  if (m) {
    const sign = m[1] === '+' ? 1 : -1;
    const offset = sign * (Number(m[2]) * 60 + Number(m[3]));
    return { zone: { kind: 'offset', offset, token: `${m[1]}${m[2]}:${m[3]}`, label: offsetLabel(offset) }, match: m[0].slice(m[0].search(/[+\-−]\d{2}/)) };
  }
  // "Eastern Time", "Pacific Time".
  m = text.match(/\b(Eastern|Central|Mountain|Pacific)\s+(?:Standard\s+|Daylight\s+)?Time\b/i);
  if (m) return zoneFromWord(LONG_ZONE_NAMES[m[1].toLowerCase()], m[0]);
  // Abbreviations, written in capitals on hackathon pages; longest first so EDT wins over ET.
  const words = Object.keys(ZONE_WORDS).sort((a, b) => b.length - a.length);
  for (const w of words) {
    const re = w === 'Z' ? /\d{1,2}:\d{2}(?::\d{2})?Z\b/ : new RegExp(`(^|[^A-Za-z])${w}(?![A-Za-z])`);
    const hit = text.match(re);
    if (hit) return zoneFromWord(w, w === 'Z' ? 'Z' : w);
  }
  return null;
}

function zoneFromWord(word, match) {
  const info = ZONE_WORDS[word];
  if (info.offset === undefined) {
    return { zone: { kind: 'region', region: info.region, token: word, label: info.label }, match };
  }
  return {
    zone: { kind: 'offset', offset: info.offset, region: info.region, dst: info.dst, token: word, label: info.label },
    match,
  };
}

function findDate(text) {
  let m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3], match: m[0] };
  m = text.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})${ORD}\\b(?:,?\\s+(\\d{4}))?`, 'i'));
  if (m) return { year: m[3] ? +m[3] : null, month: monthIndex(m[1]), day: +m[2], match: m[0] };
  m = text.match(new RegExp(`\\b(\\d{1,2})${ORD}\\s+(?:of\\s+)?${MONTH_RE},?(?:\\s+(\\d{4}))?`, 'i'));
  if (m) return { year: m[3] ? +m[3] : null, month: monthIndex(m[2]), day: +m[1], match: m[0] };
  m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/); // US style, as on US-hosted pages
  if (m) return { year: +m[3], month: +m[1], day: +m[2], match: m[0], usNumeric: true };
  return null;
}

function findTime(text) {
  if (/\bmidnight\b/i.test(text)) return { hour: 0, minute: 0, midnight: true };
  if (/\bnoon\b/i.test(text)) return { hour: 12, minute: 0 };
  let m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i);
  if (m) {
    let hour = +m[1] % 12;
    if (m[3].toLowerCase().startsWith('p')) hour += 12;
    return { hour, minute: +(m[2] || 0) };
  }
  m = text.match(/(?:^|[^\d:])(\d{1,2}):(\d{2})(?![\d])/);
  if (m && +m[1] < 24 && +m[2] < 60) return { hour: +m[1], minute: +m[2] };
  m = text.match(/T(\d{2}):(\d{2})/);
  if (m) return { hour: +m[1], minute: +m[2] };
  return null;
}

// Pure reading of the text. `year` may be null; `zone` may be null.
export function parseDeadline(raw) {
  const text = String(raw || '').replace(/[   ]/g, ' ').trim();
  if (!text) return { ok: false, reason: 'empty' };
  const date = findDate(text);
  if (!date || date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) {
    return { ok: false, reason: 'no-date' };
  }
  const rest = text.replace(date.match, ' ');
  const found = findZone(rest);
  const time = findTime(found ? rest.replace(found.match, ' ') : rest);
  if (!time) return { ok: false, reason: 'no-time' };
  return {
    ok: true,
    parts: { year: date.year, month: date.month, day: date.day, hour: time.hour, minute: time.minute },
    zone: found ? found.zone : null,
    usNumeric: !!date.usNumeric,
  };
}

// Turns a parsed deadline into an instant. `fallbackZone` is used when the text had no zone.
// A missing year means the next occurrence that is not in the past.
export function resolveDeadline(parsed, now, fallbackZone) {
  const zone = parsed.zone || (fallbackZone ? { kind: 'region', region: fallbackZone, token: null, label: fallbackZone } : null);
  if (!zone) return { ok: false, reason: 'no-zone' };
  const zoneArg = zone.kind === 'offset' ? zone.offset : zone.region;
  const at = (year) => wallToInstant({ ...parsed.parts, year }, zoneArg);
  let year = parsed.parts.year;
  let instant;
  if (year) {
    instant = at(year);
  } else {
    year = new Date(now).getUTCFullYear();
    instant = at(year);
    if (instant < now) instant = at(++year);
  }
  const usedOffset = zone.kind === 'offset' ? zone.offset : offsetMinutes(zone.region, instant);
  const gapZone = zone.region || null;

  let mismatch = null;
  if (zone.kind === 'offset' && zone.region) {
    const real = offsetMinutes(zone.region, instant);
    if (real !== zone.offset) {
      mismatch = { written: zone.token, writtenOffset: zone.offset, realOffset: real, region: zone.region };
    }
  }

  const wall = { ...parsed.parts, year };
  return {
    ok: true,
    instant,
    zone,
    usedOffset,
    gapZone,
    mismatch,
    wall,
    readAs: describeWall(wall, zone, usedOffset),
  };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function describeWall(w, zone, usedOffset) {
  const h12 = ((w.hour + 11) % 12) + 1;
  const ampm = w.hour < 12 ? 'AM' : 'PM';
  const time = `${h12}:${String(w.minute).padStart(2, '0')} ${ampm}`;
  const name = zone.token || zone.label;
  return `${MONTH_NAMES[w.month - 1]} ${w.day}, ${w.year} · ${time} ${name} (${offsetLabel(usedOffset)})`;
}
