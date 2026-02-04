'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  coerceHolocronFaction,
  HOLOCRON_FACTION_COOKIE,
  HOLOCRON_SESSION_COOKIE,
  type HolocronFaction,
} from '@/lib/holocron-auth';

function sanitizeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/dashboard';
  if (!value.startsWith('/')) return '/dashboard';
  if (value.startsWith('//')) return '/dashboard';
  if (value.startsWith('/api')) return '/dashboard';
  return value;
}

function setHolocronSession(faction: HolocronFaction) {
  const store = cookies();
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  };

  store.set(HOLOCRON_SESSION_COOKIE, '1', cookieOptions);
  store.set(HOLOCRON_FACTION_COOKIE, faction, cookieOptions);
}

export async function loginAction(formData: FormData) {
  const faction = coerceHolocronFaction(formData.get('faction'));
  const nextPath = sanitizeNextPath(formData.get('next'));

  setHolocronSession(faction);
  redirect(nextPath);
}

export async function registerAction(formData: FormData) {
  const faction = coerceHolocronFaction(formData.get('faction'));
  const nextPath = sanitizeNextPath(formData.get('next'));

  setHolocronSession(faction);
  redirect(nextPath);
}

export async function logoutAction() {
  const store = cookies();
  store.delete(HOLOCRON_SESSION_COOKIE);
  store.delete(HOLOCRON_FACTION_COOKIE);
  redirect('/');
}
