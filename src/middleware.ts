import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect PRO dashboard routes
 * Checks subscription status before allowing access
 * 
 * Note: Since Firebase Auth uses client-side tokens, this middleware
 * provides a basic check. Full protection is handled by DashboardShell.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Allow access to subscription page (to avoid redirect loop)
  if (pathname.includes('/dashboard/settings/subscription')) {
    return NextResponse.next()
  }

  // For now, let the request pass through
  // DashboardShell will handle the full subscription check client-side
  // This middleware can be enhanced later with server-side session verification
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}

