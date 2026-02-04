export const HOLOCRON_SESSION_COOKIE = 'holocron_session';
export const HOLOCRON_FACTION_COOKIE = 'holocron_faction';

export type HolocronFaction = 'rebel' | 'imperial';

export function coerceHolocronFaction(value: unknown): HolocronFaction {
  return value === 'imperial' ? 'imperial' : 'rebel';
}
