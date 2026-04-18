// src/app/api/auth/route.ts
// ============================================================
// SRIKANDI — API Route: Authentication
// POST /api/auth/login    — login penyidik
// POST /api/auth/logout   — logout
// GET  /api/auth/me       — profil penyidik aktif
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPenyidikProfile } from '@/lib/supabase'

// Lazy admin client — runtime only
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase admin env vars')
  return createClient(url, key)
}

// ——————————————————————————————————————
// POST /api/auth — Login
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json()

    // LOGIN
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email dan password wajib diisi' },
          { status: 400 }
        )
      }

      const { data, error } = await getAdminClient().auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Email atau password salah' },
          { status: 401 }
        )
      }

      // Ambil profil penyidik
      const profil = await getPenyidikProfile(data.user.id)

      if (!profil || !profil.is_active) {
        return NextResponse.json(
          { error: 'Akun tidak aktif. Hubungi administrator.' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        session: data.session,
        user: {
          id: profil.id,
          auth_id: data.user.id,
          nama_lengkap: profil.nama_lengkap,
          nrp: profil.nrp,
          pangkat: profil.pangkat,
          jabatan: profil.jabatan,
          satuan: profil.satuan,
          role: profil.role,
        },
      })
    }

    // LOGOUT
    if (action === 'logout') {
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        await getAdminClient().auth.admin.signOut(token)
      }
      return NextResponse.json({ success: true, message: 'Berhasil logout' })
    }

    return NextResponse.json(
      { error: 'Action tidak dikenali. Gunakan: login | logout' },
      { status: 400 }
    )

  } catch (err) {
    console.error('[SRIKANDI] auth error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// GET /api/auth — Profil penyidik aktif
// ——————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header tidak ditemukan' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await getAdminClient().auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah expired' },
        { status: 401 }
      )
    }

    const profil = await getPenyidikProfile(user.id)
    if (!profil) {
      return NextResponse.json(
        { error: 'Profil penyidik tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user: profil })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
