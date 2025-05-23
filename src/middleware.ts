import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROUTES_WITHOUT_LAYOUT = new Set([
  '/', 
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password', 
  '/verify-email'
])

export function middleware(request: NextRequest) {
  const merchant = request.cookies.get('merchant')
  const pathname = request.nextUrl.pathname
  const response = NextResponse.next()

  const hadSession = request.cookies.get('session') // Bandera si antes hubo sesión

  // Si no tiene sesión y está en /dashboard, redirigir a login
  if (!merchant && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    if (hadSession) loginUrl.searchParams.set('session', 'expired') // Indicar que la sesión expiró
    return NextResponse.redirect(loginUrl)
  }

  // Si la ruta no usa layout, añadir el header
  if (ROUTES_WITHOUT_LAYOUT.has(pathname)) {
    response.headers.set('x-no-layout', 'true')
  }

  return response
}

// Aplica el middleware a todas las rutas necesarias
export const config = {
  matcher: ['/:path*']
}
