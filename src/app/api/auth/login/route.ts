import { NextResponse } from 'next/server';

import {
  encodeHolocronProfile,
  HOLOCRON_PROFILE_COOKIE,
  HOLOCRON_SESSION_COOKIE,
} from '@/lib/holocron-auth';
import { findUserByEmail, verifyPassword } from '@/lib/user-store';

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
    email?: unknown;
    password?: unknown;
  };

  if (!isNonEmptyString(payload.email) || !isNonEmptyString(payload.password)) {
    return jsonError('invalid_body', 'email and password are required.', 400);
  }

  try {
    const user = findUserByEmail(payload.email);
    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      return jsonError('invalid_credentials', 'Invalid credentials.', 401);
    }

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
    console.error('Login failed:', err);
    return jsonError('server', 'Login failed.', 500);
  }
}
