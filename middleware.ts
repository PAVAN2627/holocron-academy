import { NextResponse, type NextRequest } from 'next/server';

import { HOLOCRON_SESSION_COOKIE } from '@/lib/holocron-auth';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(HOLOCRON_SESSION_COOKIE)?.value);

  if ((pathname === '/login' || pathname === '/register') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/dashboard') && !hasSession) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
