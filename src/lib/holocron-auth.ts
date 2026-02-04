export const HOLOCRON_SESSION_COOKIE = 'holocron_session';
export const HOLOCRON_PROFILE_COOKIE = 'holocron_profile';

// Display-only profile information for the hackathon demo.
// Do not use this cookie for authorization, access control, or grading.
export type HolocronProfile = {
  fullName: string;
  classYear?: string;
};

export function encodeHolocronProfile(profile: HolocronProfile): string {
  // The encoded shape is persisted in user cookies; if it changes, update `parseHolocronProfile` accordingly.
  return JSON.stringify({
    fullName: profile.fullName.trim().slice(0, 80),
    classYear: profile.classYear?.trim().slice(0, 32) || undefined,
  });
}

export function parseHolocronProfile(value: unknown): HolocronProfile | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const fullName = (parsed as { fullName?: unknown }).fullName;
    const classYear = (parsed as { classYear?: unknown }).classYear;

    if (typeof fullName !== 'string' || fullName.trim().length === 0) return null;
    if (classYear != null && typeof classYear !== 'string') return null;

    return {
      fullName,
      classYear: typeof classYear === 'string' && classYear.trim().length > 0 ? classYear : undefined,
    };
  } catch {
    return null;
  }
}
