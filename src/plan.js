// Works backwards from the deadline to the last safe start of each shipping step.

export const DEFAULT_STEPS = [
  { id: 'record', name: 'Record & edit video', minutes: 60 },
  { id: 'upload', name: 'Upload video & check link', minutes: 20 },
  { id: 'write', name: 'Write submission text', minutes: 30 },
  { id: 'submit', name: 'Submit on Devpost', minutes: 15 },
];
export const DEFAULT_BUFFER = 60;
export const BUFFER_CHOICES = [30, 60, 120];

const MIN = 60000;

// Rows in shipping order: code freeze, each step, then the gate.
export function buildPlan(deadline, steps, bufferMin) {
  let cursor = deadline - bufferMin * MIN;
  const timed = [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const start = cursor - steps[i].minutes * MIN;
    timed.unshift({ ...steps[i], start, end: cursor, kind: 'step' });
    cursor = start;
  }
  return [
    { id: 'freeze', name: 'Code freeze', minutes: 0, start: cursor, end: cursor, kind: 'milestone' },
    ...timed,
    { id: 'gate', name: 'Gate closes', minutes: bufferMin, start: deadline, end: deadline, kind: 'gate' },
  ];
}

// Status of a row at `now`, like a departures board.
export function statusAt(row, now) {
  const left = row.start - now;
  if (row.kind === 'gate') return left > 0 ? 'open' : 'closed';
  if (left <= 0) return 'departed';
  if (left <= 30 * MIN) return 'final-call';
  if (left <= 120 * MIN) return 'boarding';
  return 'on-time';
}

export const STATUS_TEXT = {
  'on-time': 'On time',
  boarding: 'Boarding',
  'final-call': 'Final call',
  departed: 'Departed',
  open: 'Open',
  closed: 'Closed',
};
