'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  encodeHolocronProfile,
  HOLOCRON_PROFILE_COOKIE,
  HOLOCRON_SESSION_COOKIE,
} from '@/lib/holocron-auth';

function sanitizeNextPath(value: FormDataEntryValue | null): string {
  const defaultPath = '/dashboard';
  // Only allow redirects into the authenticated dashboard surface.
  // Extend this list when new protected areas are added.
  const allowedPrefixes = ['/dashboard'];

  if (typeof value !== 'string') return defaultPath;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return defaultPath;
  if (trimmed.startsWith('/api')) return defaultPath;
  if (!allowedPrefixes.some((prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`))) return defaultPath;

  return trimmed;
}

function setHolocronSession(profile: { fullName: string; classYear?: string }) {
  const store = cookies();
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  };

  store.set(HOLOCRON_SESSION_COOKIE, '1', cookieOptions);
  store.set(HOLOCRON_PROFILE_COOKIE, encodeHolocronProfile(profile), cookieOptions);
}

function isNonEmptyString(value: FormDataEntryValue | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function loginAction(formData: FormData) {
  const nextPath = sanitizeNextPath(formData.get('next'));

  const fullName = formData.get('fullName');
  const password = formData.get('password');

  if (!isNonEmptyString(fullName) || !isNonEmptyString(password)) {
    redirect('/login');
  }

  setHolocronSession({ fullName });
  redirect(nextPath);
}

export async function signupAction(formData: FormData) {
  const nextPath = sanitizeNextPath(formData.get('next'));

  const fullName = formData.get('fullName');
  const classYear = formData.get('classYear');
  const password = formData.get('password');

  if (!isNonEmptyString(fullName) || !isNonEmptyString(classYear) || !isNonEmptyString(password)) {
    redirect('/signup');
  }

  setHolocronSession({ fullName, classYear });
  redirect(nextPath);
}

export async function registerAction(formData: FormData) {
  return signupAction(formData);
}

export async function logoutAction() {
  const store = cookies();
  store.delete(HOLOCRON_SESSION_COOKIE);
  store.delete(HOLOCRON_PROFILE_COOKIE);
  redirect('/');
}
