import { NextResponse } from 'next/server';
 
export function middleware(request) {
  // This middleware ensures that client-side routing patterns work with Next.js
  // Add custom route handling logic here if needed
  return NextResponse.next();
}
 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};