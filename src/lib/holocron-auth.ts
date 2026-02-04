export const HOLOCRON_SESSION_COOKIE = 'holocron_session';
export const HOLOCRON_FACTION_COOKIE = 'holocron_faction';

export type HolocronFaction = 'rebel' | 'imperial';

export function coerceHolocronFaction(value: unknown): HolocronFaction {
  if (value === 'imperial') return 'imperial';
  if (value === 'rebel') return 'rebel';
  return 'rebel';
}
