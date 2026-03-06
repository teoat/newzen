import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/cases(.*)',
  '/forensic(.*)',
  '/admin(.*)',
  '/settings(.*)',
  '/project(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  
  // COMPLETELY SKIP MIDDLEWARE FOR API ROUTES
  // Let Next.js Rewrites handle proxying to backend
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check for manual auth token in cookies
  const manualToken = req.cookies.get('zenith_access_token');
  
  // If it's a protected route and no manual token, use Clerk protection
  if (isProtectedRoute(req)) {
      if (!manualToken) {
        await auth.protect();
      }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
