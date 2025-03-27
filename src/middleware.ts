import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const merchant = request.cookies.get('merchant')

  if (!merchant) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Aplica el middleware solo a las rutas protegidas
export const config = {
  matcher: ['/dashboard/:path*']
}
