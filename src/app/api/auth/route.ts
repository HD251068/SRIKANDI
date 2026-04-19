// src/app/api/auth/route.ts
// ============================================================
// SRIKANDI — API Route: Authentication
// POST /api/auth  { action: 'login'|'logout', email, password }
// GET  /api/auth  — profil penyidik aktif (butuh Authorization header)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPenyidikProfile } from '@/lib/supabase'

// Lazy admin client — hanya dibuat saat ada request masuk
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase env vars belum dikonfigurasi. ' +
      'Tambahkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ' +
      'di Vercel Dashboard → Settings → Environment Variables'
    )
  }
  return createClient(url, key)
}

// ——————————————————————————————————————
// POST — Login / Logout
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action, email, password } = body

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

      const profil = await getPenyidikProfile(data.user.id)

      // Debug log — hapus setelah login berhasil
      console.log('[SRIKANDI] profil:', JSON.stringify(profil))
      console.log('[SRIKANDI] is_active raw:', profil?.is_active, typeof profil?.is_active)

      if (!profil) {
        return NextResponse.json(
          { error: 'Profil penyidik tidak ditemukan di database.' },
          { status: 403 }
        )
      }

      // Cek is_active — handle boolean dan string '1'/'true'
      const isActive = profil.is_active === true 
        || (profil.is_active as unknown as string) === 'true'
        || (profil.is_active as unknown as number) === 1

      if (!isActive) {
        return NextResponse.json(
          { error: `Akun tidak aktif. is_active=${profil.is_active}` },
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
    console.error('[SRIKANDI] auth POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// GET — Profil penyidik aktif
// ——————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      // Bukan error — browser kadang hit endpoint ini tanpa header
      return NextResponse.json(
        { error: 'Authorization header tidak ditemukan', authenticated: false },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await getAdminClient().auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah expired', authenticated: false },
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

    return NextResponse.json({ success: true, authenticated: true, user: profil })

  } catch (err) {
    console.error('[SRIKANDI] auth GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
