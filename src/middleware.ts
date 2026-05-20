import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import {
  DEVICE_TYPE_HEADER,
  DEVICE_VIEW_COOKIE,
  resolveDeviceType,
} from '@/lib/device';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function stripMobilePrefix(pathname: string): string | null {
  const m = pathname.match(/^\/m\/(zh|en)(\/.*)?$/);
  if (!m) return null;
  return `/${m[1]}${m[2] ?? ''}` || `/${m[1]}`;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/easy-resume' || pathname === '/easy-resume/') {
    return NextResponse.redirect(new URL('/zh', request.url));
  }
  if (pathname.startsWith('/easy-resume/')) {
    const rest = pathname.slice('/easy-resume'.length) || '/';
    return NextResponse.redirect(new URL(rest, request.url));
  }
  const legacy = stripMobilePrefix(pathname);
  if (legacy) {
    return NextResponse.redirect(new URL(legacy, request.url));
  }
  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL('/zh', request.url));
  }
  const device = resolveDeviceType(
    request.headers.get('user-agent') ?? '',
    request.cookies.get(DEVICE_VIEW_COOKIE)?.value,
    request.headers.get('sec-ch-ua-mobile'),
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(DEVICE_TYPE_HEADER, device);
  return intlMiddleware(
    new NextRequest(request.url, { headers: requestHeaders }),
  );
}

export const config = {
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
