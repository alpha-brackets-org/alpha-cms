import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('alpha_auth_token');
  const isLoginPage = request.nextUrl.pathname === '/login';

  const payload = token ? await verifyToken(token.value) : null;

  // Redirect to login if there's no valid session and not on login page
  if (!payload && !isLoginPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // An expired/forged cookie shouldn't linger — clear it on the way out.
    if (token) response.cookies.delete('alpha_auth_token');
    return response;
  }

  // Redirect to dashboard if a valid session exists and on login page
  if (payload && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Only match admin routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
