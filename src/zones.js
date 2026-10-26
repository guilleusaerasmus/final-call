// Time-zone words found on hackathon pages.
// `region` abbreviations follow that region's real rules on the date (generic, e.g. ET).
// `offset` abbreviations use exactly the offset written (specific, e.g. EDT), and name the
// region they belong to so a daylight/standard mismatch can be pointed out.
export const ZONE_WORDS = {
  ET: { region: 'America/New_York', label: 'Eastern Time' },
  EST: { offset: -300, region: 'America/New_York', dst: false, label: 'Eastern Standard Time' },
  EDT: { offset: -240, region: 'America/New_York', dst: true, label: 'Eastern Daylight Time' },
  CT: { region: 'America/Chicago', label: 'Central Time' },
  CST: { offset: -360, region: 'America/Chicago', dst: false, label: 'Central Standard Time' },
  CDT: { offset: -300, region: 'America/Chicago', dst: true, label: 'Central Daylight Time' },
  MT: { region: 'America/Denver', label: 'Mountain Time' },
  MST: { offset: -420, region: 'America/Denver', dst: false, label: 'Mountain Standard Time' },
  MDT: { offset: -360, region: 'America/Denver', dst: true, label: 'Mountain Daylight Time' },
  PT: { region: 'America/Los_Angeles', label: 'Pacific Time' },
  PST: { offset: -480, region: 'America/Los_Angeles', dst: false, label: 'Pacific Standard Time' },
  PDT: { offset: -420, region: 'America/Los_Angeles', dst: true, label: 'Pacific Daylight Time' },
  UTC: { offset: 0, label: 'UTC' },
  GMT: { offset: 0, label: 'GMT' },
  Z: { offset: 0, label: 'UTC' },
  CET: { offset: 60, region: 'Europe/Paris', dst: false, label: 'Central European Time' },
  CEST: { offset: 120, region: 'Europe/Paris', dst: true, label: 'Central European Summer Time' },
  WET: { offset: 0, region: 'Europe/Lisbon', dst: false, label: 'Western European Time' },
  WEST: { offset: 60, region: 'Europe/Lisbon', dst: true, label: 'Western European Summer Time' },
  BST: { offset: 60, region: 'Europe/London', dst: true, label: 'British Summer Time' },
  IST: { offset: 330, label: 'India Standard Time' },
  SGT: { offset: 480, label: 'Singapore Time' },
  JST: { offset: 540, label: 'Japan Standard Time' },
  AEST: { offset: 600, region: 'Australia/Sydney', dst: false, label: 'Australian Eastern Standard Time' },
  AEDT: { offset: 660, region: 'Australia/Sydney', dst: true, label: 'Australian Eastern Daylight Time' },
};

// Zones offered in the "Times shown in" selector and the "which zone?" prompt.
export const ZONE_CHOICES = [
  ['America/Los_Angeles', 'Los Angeles (PT)'],
  ['America/Denver', 'Denver (MT)'],
  ['America/Chicago', 'Chicago (CT)'],
  ['America/New_York', 'New York (ET)'],
  ['America/Sao_Paulo', 'São Paulo'],
  ['Europe/London', 'London'],
  ['Europe/Madrid', 'Madrid'],
  ['Europe/Paris', 'Paris'],
  ['Europe/Berlin', 'Berlin'],
  ['Africa/Lagos', 'Lagos'],
  ['Asia/Dubai', 'Dubai'],
  ['Asia/Kolkata', 'India (IST)'],
  ['Asia/Singapore', 'Singapore'],
  ['Asia/Tokyo', 'Tokyo'],
  ['Australia/Sydney', 'Sydney'],
  ['UTC', 'UTC'],
];

export function cityName(zone) {
  const hit = ZONE_CHOICES.find(([z]) => z === zone);
  if (hit) return hit[1].replace(/ \(.*\)$/, '');
  if (zone === 'UTC') return 'UTC';
  const last = zone.split('/').pop();
  return last.replace(/_/g, ' ');
}
