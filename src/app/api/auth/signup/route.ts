import { NextResponse } from 'next/server';

import {
  encodeHolocronProfile,
  HOLOCRON_PROFILE_COOKIE,
  HOLOCRON_SESSION_COOKIE,
} from '@/lib/holocron-auth';
import { createUser, UserStoreError } from '@/lib/user-store';

export const runtime = 'nodejs';

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON body.', 400);
  }

  const payload = body as {
    fullName?: unknown;
    email?: unknown;
    password?: unknown;
    classYear?: unknown;
  };

  if (!isNonEmptyString(payload.fullName) || !isNonEmptyString(payload.email) || !isNonEmptyString(payload.password)) {
    return jsonError('invalid_body', 'fullName, email, and password are required.', 400);
  }

  const classYear = isNonEmptyString(payload.classYear) ? payload.classYear : undefined;

  try {
    const user = await createUser(payload.fullName, payload.email, payload.password, classYear);

    const response = NextResponse.json({
      user: {
        fullName: user.fullName,
        email: user.email,
        ...(user.classYear ? { classYear: user.classYear } : {}),
      },
    });

    const cookieOptions = {
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    };

    response.cookies.set(HOLOCRON_SESSION_COOKIE, '1', cookieOptions);
    response.cookies.set(
      HOLOCRON_PROFILE_COOKIE,
      encodeHolocronProfile({
        fullName: user.fullName,
        email: user.email,
        ...(user.classYear ? { classYear: user.classYear } : {}),
      }),
      cookieOptions
    );

    return response;
  } catch (err) {
    if (err instanceof UserStoreError) {
      switch (err.code) {
        case 'user_exists':
          return jsonError('user_exists', 'User already exists.', 409);
        case 'invalid_name':
          return jsonError('invalid_name', err.message, 400);
        case 'invalid_email':
          return jsonError('invalid_email', err.message, 400);
        case 'invalid_password':
          return jsonError('invalid_password', err.message, 400);
        default: {
          const _exhaustive: never = err.code;
          console.error('Unhandled user store error code:', _exhaustive);
          return jsonError('server', 'Signup failed.', 500);
        }
      }
    }

    console.error('Signup failed:', err);
    return jsonError('server', 'Signup failed.', 500);
  }
}
