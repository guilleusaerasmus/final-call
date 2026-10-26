// Wires the departures board together: reads the input, keeps state, renders every second.
import { parseDeadline, resolveDeadline } from './parse.js';
import { hhmm, dayLabel, splitDuration, dstTrap, shortDate, offsetLabel, offsetMinutes } from './clock.js';
import { buildPlan, statusAt, STATUS_TEXT, DEFAULT_STEPS, DEFAULT_BUFFER, BUFFER_CHOICES } from './plan.js';
import { ZONE_CHOICES, cityName } from './zones.js';

const STORE_KEY = 'final-call:v1';
const EXAMPLE = 'Deadline: Oct 26, 2026 @ 5:00pm EDT';
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const $ = (id) => document.getElementById(id);
const els = {
  input: $('deadlineInput'), hint: $('inputHint'), askZone: $('askZone'), askZoneSelect: $('askZoneSelect'),
  zoneSelect: $('zoneSelect'), nowTime: $('nowTime'), flaps: $('gateFlaps'), gateDay: $('gateDay'),
  countdown: $('countdown'), countLabel: $('countLabel'), readAs: $('readAs'), trap: $('trap'), trapText: $('trapText'),
  mismatch: $('mismatch'), rows: $('rows'), buildLeft: $('buildLeft'), track: $('track'), ticks: $('ticks'), ics: $('icsBtn'), bufferSeg: $('bufferSeg'), durations: $('durations'), reset: $('resetBtn'),
};
const hintDefault = els.hint.innerHTML;

const defaults = () => ({
  text: EXAMPLE,
  shownZone: localZone,
  manualZone: null,
  bufferMin: DEFAULT_BUFFER,
  durations: Object.fromEntries(DEFAULT_STEPS.map((s) => [s.id, s.minutes])),
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved.text === 'string') return { ...defaults(), ...saved, durations: { ...defaults().durations, ...saved.durations } };
  } catch { /* private mode or corrupted data: start fresh */ }
  return defaults();
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

const state = load();
let deadline = null; // result of resolveDeadline, kept when new text is unreadable

// ---------- Input ----------

function readInput() {
  const parsed = parseDeadline(state.text);
  els.input.classList.remove('bad');
  els.askZone.hidden = true;
  if (!parsed.ok) {
    if (parsed.reason !== 'empty') showError(parsed.reason);
    else els.hint.innerHTML = hintDefault;
    return;
  }
  const resolved = resolveDeadline(parsed, Date.now(), parsed.zone ? null : state.manualZone);
  if (!resolved.ok) {
    els.askZone.hidden = false;
    els.hint.className = 'hint';
    els.hint.textContent = 'No time zone in that line. Pick the one the hackathon uses.';
    return;
  }
  deadline = resolved;
  els.hint.className = 'hint';
  els.hint.innerHTML = hintDefault;
  bindChips();
  render(true);
}

function showError(reason) {
  els.input.classList.add('bad');
  els.hint.className = 'hint error';
  els.hint.textContent = reason === 'no-time'
    ? 'Found a date but no time. Add it, e.g. "Oct 26, 2026 @ 5:00pm EDT".'
    : 'I couldn’t find a date and time in that. Try "Oct 26, 2026 @ 5:00pm EDT" or "2026-11-04 21:00 PT".';
}

let typingTimer;
els.input.addEventListener('input', () => {
  state.text = els.input.value;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => { readInput(); save(); }, 280);
});
els.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { clearTimeout(typingTimer); state.text = els.input.value; readInput(); save(); }
});

function bindChips() {
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.onclick = () => {
      state.text = chip.dataset.example;
      els.input.value = state.text;
      readInput();
      save();
    };
  });
}

// ---------- Zone selectors ----------

function fillZoneSelect(select, selected) {
  const choices = ZONE_CHOICES.some(([z]) => z === localZone) ? ZONE_CHOICES : [[localZone, `${cityName(localZone)} (your zone)`], ...ZONE_CHOICES];
  select.innerHTML = choices
    .map(([z, name]) => `<option value="${z}"${z === selected ? ' selected' : ''}>${z === localZone && !name.includes('your zone') ? `${name} · your zone` : name}</option>`)
    .join('');
}

fillZoneSelect(els.zoneSelect, state.shownZone);
fillZoneSelect(els.askZoneSelect, state.manualZone || 'America/New_York');
els.zoneSelect.addEventListener('change', () => { state.shownZone = els.zoneSelect.value; save(); render(true); });
els.askZoneSelect.addEventListener('change', () => { state.manualZone = els.askZoneSelect.value; save(); readInput(); });

// ---------- Plan settings ----------

function renderSettings() {
  els.bufferSeg.innerHTML = BUFFER_CHOICES
    .map((m) => `<button type="button" data-min="${m}" aria-pressed="${m === state.bufferMin}">${m < 60 ? m + ' min' : m / 60 + ' h'}</button>`)
    .join('');
  els.bufferSeg.querySelectorAll('button').forEach((b) => {
    b.onclick = () => { state.bufferMin = Number(b.dataset.min); save(); renderSettings(); render(true); };
  });
  els.durations.innerHTML = DEFAULT_STEPS.map((s) => `
    <div class="dur">
      <span>${s.name}</span>
      <div class="stepper">
        <button type="button" data-id="${s.id}" data-d="-5" aria-label="Shorten ${s.name}">−</button>
        <output>${state.durations[s.id]} min</output>
        <button type="button" data-id="${s.id}" data-d="5" aria-label="Lengthen ${s.name}">+</button>
      </div>
    </div>`).join('');
  els.durations.querySelectorAll('button').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.id;
      state.durations[id] = Math.min(240, Math.max(5, state.durations[id] + Number(b.dataset.d)));
      save(); renderSettings(); render(true);
    };
  });
}

els.reset.addEventListener('click', () => {
  const keep = { text: state.text, shownZone: state.shownZone, manualZone: state.manualZone };
  Object.assign(state, defaults(), keep);
  save(); renderSettings(); render(true);
});

// ---------- Rendering ----------

let lastGate = '';
let lastRowTimes = {};
let lastRowsHtml = '';

function renderFlaps(text) {
  const chars = [...text];
  if (els.flaps.children.length !== chars.length) {
    els.flaps.innerHTML = chars.map((c) => `<span class="flap${c === ':' ? ' sep' : ''}">${c}</span>`).join('');
    [...els.flaps.children].forEach((el) => flip(el));
  } else {
    chars.forEach((c, i) => {
      const el = els.flaps.children[i];
      if (el.textContent !== c) { el.textContent = c; flip(el); }
    });
  }
  els.flaps.setAttribute('aria-label', `Gate closes at ${text}`);
}

function flip(el, cls = 'flip') {
  el.classList.remove(cls);
  void el.offsetWidth; // restart the animation
  el.classList.add(cls);
}

function steps() {
  return DEFAULT_STEPS.map((s) => ({ ...s, minutes: state.durations[s.id] }));
}

function render(structural = false) {
  const now = Date.now();
  const zone = state.shownZone;
  els.nowTime.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now) + ` · ${cityName(zone)}`;
  if (!deadline) return;

  const gateText = hhmm(deadline.instant, zone);
  if (gateText !== lastGate || structural) { renderFlaps(gateText); lastGate = gateText; }
  els.gateDay.innerHTML = `${dayLabel(deadline.instant, zone)} <span class="city">· ${cityName(zone)} · ${offsetLabel(offsetMinutes(zone, deadline.instant))}</span>`;
  els.readAs.textContent = deadline.readAs;

  const d = splitDuration(deadline.instant - now);
  els.countLabel.textContent = d.past ? 'Gate closed' : 'Time left';
  els.countdown.classList.toggle('closed', d.past);
  const units = [[d.days, 'd'], [d.hours, 'h'], [d.minutes, 'm'], [d.seconds, 's']].filter(([v], i) => i > 0 || v > 0);
  els.countdown.innerHTML = units.map(([v, u]) => `<span class="u"><b>${String(v).padStart(2, '0')}</b><small>${u}</small></span>`).join('') + (d.past ? '<small>&nbsp;ago</small>' : '');
  document.title = d.past ? 'Gate closed · Final Call' : `${d.days ? d.days + 'd ' : ''}${d.hours}h ${String(d.minutes).padStart(2, '0')}m · Final Call`;

  if (structural) renderNotes(zone);
  const rows = buildPlan(deadline.instant, steps(), state.bufferMin);
  renderBuildLeft(now, zone, rows);
  renderRunway(now, zone, rows, structural);
  renderRows(now, zone, structural);
}

function durText(ms) {
  const d = splitDuration(ms);
  const h = d.days * 24 + d.hours;
  return h ? `${h} h ${String(d.minutes).padStart(2, '0')} m` : `${d.minutes} m`;
}

function renderBuildLeft(now, zone, rows) {
  const freeze = rows[0].start;
  const gate = rows[rows.length - 1].start;
  const el = els.buildLeft;
  el.classList.toggle('late', now >= freeze && now < gate);
  if (now < freeze) {
    el.innerHTML = `Build time left <b>${durText(freeze - now)}</b> <span class="muted">until code freeze at ${hhmm(freeze, zone)}</span>`;
  } else if (now < gate) {
    el.innerHTML = `Code freeze passed <b>${durText(now - freeze)}</b> ago <span class="muted">· ship what you have</span>`;
  } else {
    el.textContent = '';
  }
}

let runwayKey = '';
const PLANE = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 20l22-9.5-3.5 10.5-7-1.2-3.6 4.4-1.2-4.8z"/></svg>';

function renderRunway(now, zone, rows, structural) {
  const freeze = rows[0].start;
  const gate = rows[rows.length - 1].start;
  const from = Math.min(now, freeze);
  const span = Math.max(gate - from, 60000);
  const pct = (t) => Math.min(100, Math.max(0, ((t - from) / span) * 100));
  const key = `${from}|${gate}|${zone}|${Math.floor(now / 60000)}|${rows.map((r) => r.start).join(',')}`;
  if (structural || key !== runwayKey) {
    runwayKey = key;
    const segs = [];
    if (now < freeze) segs.push({ cls: 'build', a: from, b: freeze, text: 'Keep building' });
    const SHORT = { record: 'Video', upload: 'Upload', write: 'Write', submit: 'Submit' };
    rows.filter((r) => r.kind === 'step').forEach((r) => segs.push({ cls: r.id, a: r.start, b: r.end, text: SHORT[r.id] || r.name }));
    segs.push({ cls: 'buffer', a: rows[rows.length - 2].end, b: gate, text: 'Buffer' });
    els.track.innerHTML = segs.map((g) => `<div class="seg-bar ${g.cls}${g.b <= now ? ' past' : ''}" style="left:${pct(g.a)}%;width:${pct(g.b) - pct(g.a)}%" title="${g.text}">${g.text}</div>`).join('')
      + `<div class="plane" id="plane">${PLANE}<span>NOW</span></div>`;
    const ticks = [];
    if (pct(freeze) > 10) ticks.push([0, hhmm(from, zone)]);
    ticks.push([pct(freeze), `Freeze ${hhmm(freeze, zone)}`]);
    ticks.push([100, `Gate ${hhmm(gate, zone)}`]);
    els.ticks.innerHTML = ticks.map(([x, t]) => `<span style="left:${x}%">${t}</span>`).join('');
  }
  const plane = document.getElementById('plane');
  if (plane) plane.style.left = `${pct(now)}%`;
}

function icsDate(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const CRLF = String.fromCharCode(13, 10);

function downloadIcs() {
  if (!deadline) return;
  const rows = buildPlan(deadline.instant, steps(), state.bufferMin);
  const stamp = icsDate(Date.now());
  const events = rows.filter((r) => r.kind !== 'milestone').map((r, i) => [
    'BEGIN:VEVENT',
    `UID:final-call-${deadline.instant}-${r.id}-${i}@final-call`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(r.start)}`,
    `DTEND:${icsDate(r.kind === 'gate' ? r.start + 60000 : r.end)}`,
    `SUMMARY:${r.kind === 'gate' ? 'Gate closes (hackathon deadline)' : r.name}`,
    `DESCRIPTION:Last safe start, planned with Final Call. Deadline read as ${deadline.readAs.replace(/[,;]/g, ' ')}.`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Boarding', 'TRIGGER:-PT10M', 'END:VALARM',
    'END:VEVENT',
  ].join(CRLF));
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Final Call//Hackathon departures//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join(CRLF);
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'final-call-plan.ics' });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

els.ics.addEventListener('click', downloadIcs);

function hoursText(min) {
  const h = Math.abs(min) / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

function renderNotes(zone) {
  const trap = dstTrap(zone, deadline.gapZone, deadline.instant);
  if (trap) {
    const here = cityName(zone);
    const there = cityName(deadline.gapZone);
    const rel = (min) => (min >= 0 ? 'ahead of' : 'behind');
    const when = (c) => (c.at < deadline.instant ? 'changed its clocks on' : 'changes its clocks on');
    els.trapText.innerHTML = `<strong>Daylight-saving trap.</strong> On ${dayLabel(deadline.instant, zone)}, ${here} is <strong>${hoursText(trap.gap)} ${rel(trap.gap)}</strong> ${there}, not the usual ${hoursText(trap.usual)}. ${here} ${when(trap.shownChange)} ${shortDate(trap.shownChange.at)}; ${there} ${when(trap.regionChange)} ${shortDate(trap.regionChange.at)}.`;
    els.trap.hidden = false;
  } else {
    els.trap.hidden = true;
  }
  if (deadline.mismatch) {
    const m = deadline.mismatch;
    els.mismatch.textContent = `The page says ${m.written} (${offsetLabel(m.writtenOffset)}), but on that date ${cityName(m.region)} is on ${offsetLabel(m.realOffset)}. The board uses ${offsetLabel(m.writtenOffset)} as written; check with the organizers if in doubt.`;
    els.mismatch.hidden = false;
  } else {
    els.mismatch.hidden = true;
  }
}

function renderRows(now, zone, structural) {
  const rows = buildPlan(deadline.instant, steps(), state.bufferMin);
  const next = rows.find((r) => r.kind !== 'gate' && statusAt(r, now) !== 'departed');
  const html = rows.map((r) => {
    const st = statusAt(r, now);
    const cls = [r.kind === 'gate' ? 'gate-row' : '', r.kind === 'milestone' ? 'milestone' : '', st === 'departed' ? 'departed' : '', r === next ? 'next' : ''].join(' ').trim();
    const takes = r.kind === 'gate' ? `+${r.minutes} min buffer` : r.kind === 'milestone' ? '—' : `${r.minutes} min`;
    const day = dayLabel(r.start, zone) !== dayLabel(now, zone) ? `<span class="d">${dayLabel(r.start, zone)}</span>` : '';
    return `<tr class="${cls}" data-id="${r.id}">
      <td class="t">${hhmm(r.start, zone)}${day}</td>
      <td class="s">${r.name}</td>
      <td class="k">${takes}</td>
      <td class="st"><span class="status ${st}">${st === 'on-time' || st === 'boarding' || st === 'final-call' ? '<i class="dot"></i>' : ''}${STATUS_TEXT[st]}</span></td>
    </tr>`;
  }).join('');
  if (structural || html !== lastRowsHtml) {
    lastRowsHtml = html;
    els.rows.innerHTML = html;
    const times = {};
    rows.forEach((r) => { times[r.id] = `${hhmm(r.start, zone)}|${statusAt(r, now)}`; });
    [...els.rows.children].forEach((tr) => {
      if (structural || lastRowTimes[tr.dataset.id] !== times[tr.dataset.id]) flip(tr, 'flipped');
    });
    lastRowTimes = times;
  }
}

// ---------- Start ----------

els.input.value = state.text;
renderSettings();
bindChips();
readInput();
render(true);
setInterval(() => render(false), 1000);
