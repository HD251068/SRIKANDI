// src/app/api/kasus/route.ts
// ============================================================
// SRIKANDI — API Route: Kasus CRUD
// GET    /api/kasus         — list semua kasus
// POST   /api/kasus         — buat kasus baru + semua relasinya
// GET    /api/kasus?id=xxx  — detail satu kasus
// PATCH  /api/kasus?id=xxx  — update kasus
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service client langsung di route — bypass RLS sepenuhnya
function sc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

// ——————————————————————————————————————
// GET — List atau Detail Kasus
// ——————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      // Query bertahap — hindari join kompleks yang bisa gagal
      const { data: kasus, error: kErr } = await sc()
        .from('kasus').select('*').eq('id', id).single()
      if (kErr) throw new Error(`Kasus tidak ditemukan: ${kErr.message}`)

      // Relasi — ambil satu per satu, tidak fatal kalau gagal
      const [tersangka, korban, bukti, saksi, fw, dig, intel] = await Promise.all([
        sc().from('tersangka').select('*').eq('kasus_id', id),
        sc().from('korban').select('*').eq('kasus_id', id),
        sc().from('alat_bukti').select('*').eq('kasus_id', id),
        sc().from('saksi').select('*').eq('kasus_id', id),
        sc().from('framework_hukum').select('*').eq('kasus_id', id).maybeSingle(),
        sc().from('digital_forensik').select('*').eq('kasus_id', id).maybeSingle(),
        sc().from('intelligence_package').select('*').eq('kasus_id', id).order('versi', { ascending: false }).limit(1),
      ])

      // Inkonsistensi digital
      let inkonsistensi = { data: [] }
      if (dig.data?.id) {
        inkonsistensi = await sc().from('inkonsistensi_digital').select('*').eq('kasus_id', id) as any
      }

      return NextResponse.json({
        success: true,
        data: {
          ...kasus,
          tersangka: tersangka.data ?? [],
          korban: korban.data ?? [],
          alat_bukti: bukti.data ?? [],
          saksi: saksi.data ?? [],
          framework_hukum: fw.data ?? null,
          digital_forensik: dig.data ? { ...dig.data, inkonsistensi_digital: inkonsistensi.data } : null,
          intelligence_package: intel.data ?? [],
        }
      })
    }

    // Ambil kasus tanpa join penyidik untuk hindari ambiguous relationship
    const { data: kasusList, error } = await sc()
      .from('kasus')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    // Ambil tersangka dan korban untuk setiap kasus
    const enriched = await Promise.all((kasusList ?? []).map(async (k: any) => {
      const [t, ko] = await Promise.all([
        sc().from('tersangka').select('id, nama_lengkap').eq('kasus_id', k.id).limit(1),
        sc().from('korban').select('id, nama_lengkap, kondisi').eq('kasus_id', k.id).limit(3),
      ])
      return { ...k, tersangka: t.data ?? [], korban: ko.data ?? [] }
    }))

    return NextResponse.json({ success: true, data: enriched })

  } catch (err) {
    console.error('[SRIKANDI] GET /api/kasus error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengambil data' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// POST — Buat Kasus Baru
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piipData, penyidik_id } = body

    // Sanitize: convert empty strings to null for date/timestamp fields
    const ts = (v: any) => (v && v !== '' ? v : null)

    console.log('[SRIKANDI] POST /api/kasus — penyidik_id:', penyidik_id)
    console.log('[SRIKANDI] nomor_lp:', piipData?.kejadian?.nomor_lp)

    if (!piipData || !penyidik_id) {
      return NextResponse.json(
        { error: 'piipData dan penyidik_id wajib diisi' },
        { status: 400 }
      )
    }

    if (!piipData.kejadian?.nomor_lp) {
      return NextResponse.json(
        { error: 'Nomor LP wajib diisi' },
        { status: 400 }
      )
    }

    // 1. Buat kasus master
    const { data: kasus, error: kasusError } = await sc()
      .from('kasus')
      .insert({
        nomor_lp: piipData.kejadian.nomor_lp,
        nomor_spdp: piipData.kejadian.nomor_spdp || null,
        jenis_pidana: piipData.kejadian.jenis_pidana,
        tanggal_kejadian: ts(piipData.kejadian.tanggal_kejadian),
        tanggal_laporan: ts(piipData.kejadian.tanggal_laporan),
        lokasi_kejadian: piipData.kejadian.lokasi_kejadian || null,
        kronologi: piipData.kejadian.kronologi,
        kondisi_tkp: piipData.kejadian.kondisi_tkp || null,
        ada_cctv: piipData.kejadian.ada_cctv || null,
        threat_level: piipData.meta?.threat_level ?? 3,
        tujuan_interogasi: piipData.meta?.tujuan_interogasi || null,
        gaya_interogasi: piipData.meta?.gaya_interogasi ?? 'PEACE',
        penyidik_id,
      })
      .select()
      .single()

    if (kasusError) {
      console.error('[SRIKANDI] Insert kasus error:', kasusError)
      throw new Error(`Gagal simpan kasus: ${kasusError.message}`)
    }

    const kasusId = kasus.id
    console.log('[SRIKANDI] Kasus created:', kasusId)

    // 2. Tersangka — hanya jika ada nama
    if (piipData.tersangka?.nama_lengkap) {
      const { error: tErr } = await sc()
        .from('tersangka')
        .insert({ 
          ...piipData.tersangka, 
          kasus_id: kasusId,
          tanggal_lahir: ts(piipData.tersangka.tanggal_lahir),
        })
      if (tErr) console.error('[SRIKANDI] Tersangka error:', tErr.message)
    }

    // 3. Korban — filter yang ada nama
    const korbanList = (piipData.korban ?? []).filter((k: any) => k.nama_lengkap)
    if (korbanList.length > 0) {
      const { error: kErr } = await sc()
        .from('korban')
        .insert(korbanList.map((k: any) => ({ ...k, kasus_id: kasusId, usia: k.usia ? parseInt(k.usia) : null })))
      if (kErr) console.error('[SRIKANDI] Korban error:', kErr.message)
    }

    // 4. Alat Bukti — filter yang ada deskripsi
    const buktiList = (piipData.alat_bukti ?? []).filter((b: any) => b.deskripsi)
    if (buktiList.length > 0) {
      const { error: bErr } = await sc()
        .from('alat_bukti')
        .insert(buktiList.map((b: any) => ({ ...b, kasus_id: kasusId })))
      if (bErr) console.error('[SRIKANDI] Bukti error:', bErr.message)
    }

    // 5. Saksi — filter yang ada nama
    const saksiList = (piipData.saksi ?? []).filter((s: any) => s.nama_lengkap)
    if (saksiList.length > 0) {
      const { error: sErr } = await sc()
        .from('saksi')
        .insert(saksiList.map((s: any) => ({ ...s, kasus_id: kasusId })))
      if (sErr) console.error('[SRIKANDI] Saksi error:', sErr.message)
    }

    // 6. Framework Hukum
    const fw = piipData.framework_hukum
    if (fw) {
      const { error: fErr } = await sc()
        .from('framework_hukum')
        .insert({
          kasus_id: kasusId,
          pasal_diduga: fw.pasal_diduga ?? [],
          unsur_terpenuhi: fw.unsur_terpenuhi || null,
          unsur_belum_terpenuhi: fw.unsur_belum_terpenuhi || null,
          catatan_khusus: fw.catatan_khusus || null,
        })
      if (fErr) console.error('[SRIKANDI] Framework error:', fErr.message)
    }

    // 7. Digital Forensik
    const dig = piipData.digital_forensik
    if (dig && Object.values(dig).some(v => v)) {
      const { error: dErr } = await sc()
        .from('digital_forensik')
        .insert({ ...dig, kasus_id: kasusId })
      if (dErr) console.error('[SRIKANDI] Digital error:', dErr.message)
    }

    // 8. Inkonsistensi
    const inkList = (piipData.inkonsistensi ?? []).filter((i: any) => i.klaim_tersangka)
    if (inkList.length > 0) {
      const { error: iErr } = await sc()
        .from('inkonsistensi_digital')
        .insert(inkList.map((i: any) => ({ ...i, kasus_id: kasusId })))
      if (iErr) console.error('[SRIKANDI] Inkonsistensi error:', iErr.message)
    }

    return NextResponse.json({
      success: true,
      kasus_id: kasusId,
      nomor_lp: kasus.nomor_lp,
      message: `Kasus ${kasus.nomor_lp} berhasil disimpan`,
    }, { status: 201 })

  } catch (err) {
    console.error('[SRIKANDI] POST /api/kasus fatal error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal menyimpan kasus' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// PATCH — Update Kasus
// ——————————————————————————————————————
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    const body = await req.json()
    const { data, error } = await sc()
      .from('kasus')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal update kasus' },
      { status: 500 }
    )
  }
}
