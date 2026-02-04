'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  encodeHolocronProfile,
  HOLOCRON_PROFILE_COOKIE,
  HOLOCRON_SESSION_COOKIE,
} from '@/lib/holocron-auth';
import { AUTH_REDIRECT_ALLOWED_PREFIXES } from '@/lib/routes';
import { createUser, findUser, UserStoreError, verifyPassword } from '@/lib/user-store';

type AuthErrorCode = 'invalid' | 'invalid_name' | 'invalid_password' | 'exists' | 'server';

function redirectWithError(pathname: string, nextPath: string, error: AuthErrorCode): never {
  // `nextPath` must be the result of `sanitizeNextPath` (to avoid open redirects).
  const search = new URLSearchParams();
  search.set('next', nextPath);
  search.set('error', error);
  redirect(`${pathname}?${search.toString()}`);
}

function sanitizeNextPath(value: FormDataEntryValue | null): string {
  const defaultPath = '/dashboard';
  // Only allow redirects into the authenticated dashboard surface.
  // Extend `AUTH_REDIRECT_ALLOWED_PREFIXES` when new protected areas are added.
  const allowedPrefixes = AUTH_REDIRECT_ALLOWED_PREFIXES;

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
  // NOTE: No rate limiting / brute-force protection is implemented here.
  // For any non-demo deployment, enforce limits at the edge or use a real auth provider.
  const nextPath = sanitizeNextPath(formData.get('next'));

  const fullName = formData.get('fullName');
  const password = formData.get('password');

  if (!isNonEmptyString(fullName) || !isNonEmptyString(password)) {
    redirectWithError('/login', nextPath, 'invalid');
  }

  try {
    const user = findUser(fullName);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      redirectWithError('/login', nextPath, 'invalid');
    }

    setHolocronSession({
      fullName: user.fullName,
      ...(user.classYear ? { classYear: user.classYear } : {}),
    });
    redirect(nextPath);
  } catch (err) {
    console.error('Login failed:', err);
    redirectWithError('/login', nextPath, 'server');
  }
}

export async function signupAction(formData: FormData) {
  const nextPath = sanitizeNextPath(formData.get('next'));

  const fullName = formData.get('fullName');
  const classYear = formData.get('classYear');
  const password = formData.get('password');

  if (!isNonEmptyString(fullName) || !isNonEmptyString(classYear) || !isNonEmptyString(password)) {
    redirectWithError('/signup', nextPath, 'invalid');
  }

  try {
    const user = await createUser(fullName, password, classYear);
    setHolocronSession({ fullName: user.fullName, classYear });
    redirect(nextPath);
  } catch (err) {
    if (err instanceof UserStoreError) {
      switch (err.code) {
        case 'user_exists': {
          redirectWithError('/signup', nextPath, 'exists');
          break;
        }
        case 'invalid_name': {
          redirectWithError('/signup', nextPath, 'invalid_name');
          break;
        }
        case 'invalid_password': {
          redirectWithError('/signup', nextPath, 'invalid_password');
          break;
        }
        default: {
          const _exhaustive: never = err.code;
          console.error('Unhandled user store error code:', _exhaustive);
          redirectWithError('/signup', nextPath, 'server');
        }
      }
    }

    console.error('Signup failed:', err);
    redirectWithError('/signup', nextPath, 'server');
  }
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
