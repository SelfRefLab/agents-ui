import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register']
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if user is authenticated for protected routes
  if (pathname.startsWith('/chat') || pathname.startsWith('/api/chat') || pathname.startsWith('/api/chats')) {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      // Check for OA authentication before redirecting
      
      // Redirect to login page for web routes
      if (pathname.startsWith('/chat')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      // Return 401 for API routes
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
