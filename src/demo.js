// Scripted walkthrough used to record the demo video: open the page with ?demo=1.
// It only drives the real UI (typing, clicks, scrolling); nothing in the app is faked.

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (sel) => document.querySelector(sel);

async function typeInto(input, text, perChar = 55) {
  input.focus();
  input.value = '';
  input.dispatchEvent(new Event('input'));
  for (const ch of text) {
    input.value += ch;
    input.dispatchEvent(new Event('input'));
    await wait(perChar);
  }
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
}

function scrollToEl(el, block = 'center') {
  el.scrollIntoView({ behavior: 'smooth', block });
}

function pick(select, value) {
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

function cue(text) {
  let el = $('#demoCue');
  if (!el) {
    el = Object.assign(document.createElement('div'), { id: 'demoCue' });
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  if (text) el.classList.add('show');
}

export async function runDemo() {
  document.documentElement.classList.add('demo');
  const input = $('#deadlineInput');
  window.scrollTo(0, 0);
  input.value = 'Nov 4, 2026 @ 9:00 PM PT';
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  await wait(2200);

  cue('Paste the deadline from the hackathon page');
  await typeInto(input, 'Deadline: Oct 26, 2026 @ 5:00pm EDT', 45);
  await wait(3200);

  cue('Gate time, countdown and build time left, in your zone');
  await wait(3800);

  cue('The daylight-saving trap');
  scrollToEl($('#trap'));
  await wait(5200);

  cue('Last safe start for every shipping step');
  scrollToEl($('.runway'));
  await wait(4500);
  scrollToEl($('.departures'), 'start');
  await wait(3500);

  cue('Need a bigger safety buffer? Everything moves');
  scrollToEl($('#rows'), 'center');
  await wait(1200);
  $('#bufferSeg button[data-min="120"]').click();
  await wait(3200);
  $('#bufferSeg button[data-min="60"]').click();
  await wait(1800);

  cue('Seen from New York, no trap');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await wait(1200);
  pick($('#zoneSelect'), 'America/New_York');
  await wait(3800);
  pick($('#zoneSelect'), 'Europe/Madrid');
  await wait(1500);

  cue('Any format: 11:45pm ET after the US clock change');
  $('.chip[data-example="Nov 2, 2026 11:45pm ET"]').click();
  await wait(3000);
  scrollToEl($('.world'));
  await wait(4200);

  cue('One click from any Devpost page, or share the board');
  scrollToEl($('.extras'));
  await wait(4500);

  cue('');
  input.value = 'Deadline: Oct 26, 2026 @ 5:00pm EDT';
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await wait(2500);
  document.documentElement.classList.add('demo-done');
}
