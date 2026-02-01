import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

/**
 * Role-based access control
 */
const PROTECTED_ROUTES = ['/dashboard', '/investigate', '/reconciliation', '/forensic', '/ingestion'];
const ADMIN_ROUTES = ['/admin', '/settings/security'];
const PUBLIC_ROUTES = ['/login', '/api/health'];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is admin-only
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Middleware for authentication and authorization
 * 
 * This middleware:
 * 1. Checks if user is authenticated
 * 2. Validates user roles for admin routes
 * 3. Redirects unauthenticated users to login
 * 4. Redirects unauthorized users to dashboard
 * 5. Adds security headers
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes (except auth)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') // NextAuth handles its own routes
  ) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  // Check if route is public
  if (isPublicRoute(pathname)) {
    // If user is logged in and trying to access login, redirect to dashboard
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!session?.user) {
    // Store original URL for redirect after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  if (isAdminRoute(pathname)) {
    // Verify user has admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/?unauthorized', request.url));
    }
  }

  // Add security headers to response
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' wss:// ws:// https:;",
  );

  // Add user info to headers for server components
  if (session?.user) {
      response.headers.set('X-User-ID', session.user.id || 'unknown');
      response.headers.set('X-User-Role', session.user.role || 'guest');
  }

  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  // Run middleware on all routes
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
