// src/middleware.ts
// ============================================================
// SRIKANDI — Middleware: Route Protection
// Semua route /dashboard/* wajib login
// Client dibuat per-request (tidak ada module-level init)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Lewati route publik
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Lewati asset statis
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Cek session dari cookie
  const accessToken = req.cookies.get('sb-access-token')?.value

  if (!accessToken) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verifikasi token — lazy import createClient agar tidak crash saat build
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      // Env vars belum ada (saat build) — lewati saja
      return NextResponse.next()
    }

    const supabase = createClient(url, key)
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Inject user id ke header
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', user.id)
    return NextResponse.next({ request: { headers: requestHeaders } })

  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
