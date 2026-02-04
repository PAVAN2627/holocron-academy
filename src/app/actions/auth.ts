'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  HOLOCRON_FACTION_COOKIE,
  HOLOCRON_SESSION_COOKIE,
  type HolocronFaction,
} from '@/lib/holocron-auth';

function sanitizeNextPath(value: FormDataEntryValue | null): string {
  const defaultPath = '/dashboard';
  const allowedPrefixes = ['/dashboard'];

  if (typeof value !== 'string') return defaultPath;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return defaultPath;
  if (trimmed.startsWith('/api')) return defaultPath;
  if (!allowedPrefixes.some((prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`))) return defaultPath;

  return trimmed;
}

function setHolocronSession(faction: HolocronFaction) {
  const store = cookies();
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  };

  store.set(HOLOCRON_SESSION_COOKIE, '1', cookieOptions);
  store.set(HOLOCRON_FACTION_COOKIE, faction, cookieOptions);
}

function isNonEmptyString(value: FormDataEntryValue | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function loginAction(formData: FormData) {
  const factionValue = formData.get('faction');
  const nextPath = sanitizeNextPath(formData.get('next'));

  if (factionValue !== 'rebel' && factionValue !== 'imperial') {
    redirect('/login');
  }

  if (!isNonEmptyString(formData.get('callsign')) || !isNonEmptyString(formData.get('passcode'))) {
    redirect('/login');
  }

  setHolocronSession(factionValue);
  redirect(nextPath);
}

export async function registerAction(formData: FormData) {
  const factionValue = formData.get('faction');
  const nextPath = sanitizeNextPath(formData.get('next'));

  if (factionValue !== 'rebel' && factionValue !== 'imperial') {
    redirect('/register');
  }

  if (!isNonEmptyString(formData.get('callsign')) || !isNonEmptyString(formData.get('passcode'))) {
    redirect('/register');
  }

  setHolocronSession(factionValue);
  redirect(nextPath);
}

export async function logoutAction() {
  const store = cookies();
  store.delete(HOLOCRON_SESSION_COOKIE);
  store.delete(HOLOCRON_FACTION_COOKIE);
  redirect('/');
}
