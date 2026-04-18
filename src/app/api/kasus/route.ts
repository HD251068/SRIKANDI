// src/app/api/kasus/route.ts
// ============================================================
// SRIKANDI — API Route: Kasus CRUD
// GET    /api/kasus         — list semua kasus
// POST   /api/kasus         — buat kasus baru + semua relasinya
// GET    /api/kasus?id=xxx  — detail satu kasus
// PATCH  /api/kasus?id=xxx  — update kasus
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  getSemuaKasus,
  getKasusById,
  createKasus,
  updateKasus,
  upsertTersangka,
  upsertKorban,
  upsertAlatBukti,
  upsertSaksi,
  upsertFrameworkHukum,
  upsertDigitalForensik,
  upsertInkonsistensi,
} from '@/lib/supabase'
import type { PIIPFormData } from '@/lib/types'

// ——————————————————————————————————————
// GET — List atau Detail Kasus
// ——————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      // Detail satu kasus lengkap dengan semua relasi
      const kasus = await getKasusById(id)
      return NextResponse.json({ success: true, data: kasus })
    }

    // List semua kasus
    const kasus = await getSemuaKasus()
    return NextResponse.json({ success: true, data: kasus })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengambil data kasus' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// POST — Buat Kasus Baru (lengkap semua modul)
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piipData, penyidik_id } = body as {
      piipData: PIIPFormData
      penyidik_id: string
    }

    if (!piipData || !penyidik_id) {
      return NextResponse.json(
        { error: 'piipData dan penyidik_id wajib diisi' },
        { status: 400 }
      )
    }

    // 1. Buat kasus master
    const kasus = await createKasus({
      nomor_lp: piipData.kejadian.nomor_lp,
      nomor_spdp: piipData.kejadian.nomor_spdp,
      jenis_pidana: piipData.kejadian.jenis_pidana,
      tanggal_kejadian: piipData.kejadian.tanggal_kejadian,
      tanggal_laporan: piipData.kejadian.tanggal_laporan,
      lokasi_kejadian: piipData.kejadian.lokasi_kejadian,
      kronologi: piipData.kejadian.kronologi,
      kondisi_tkp: piipData.kejadian.kondisi_tkp,
      ada_cctv: piipData.kejadian.ada_cctv,
      threat_level: piipData.meta.threat_level,
      tujuan_interogasi: piipData.meta.tujuan_interogasi,
      gaya_interogasi: piipData.meta.gaya_interogasi,
      penyidik_id,
    })

    const kasusId = kasus.id

    // 2. Simpan semua relasi secara paralel
    await Promise.all([
      // Tersangka
      upsertTersangka({ ...piipData.tersangka, kasus_id: kasusId }),

      // Korban (array)
      piipData.korban.length > 0
        ? upsertKorban(piipData.korban.map(k => ({ ...k, kasus_id: kasusId })))
        : Promise.resolve(),

      // Alat Bukti (array)
      piipData.alat_bukti.length > 0
        ? upsertAlatBukti(piipData.alat_bukti.map(b => ({ ...b, kasus_id: kasusId })))
        : Promise.resolve(),

      // Saksi (array)
      piipData.saksi.length > 0
        ? upsertSaksi(piipData.saksi.map(s => ({ ...s, kasus_id: kasusId })))
        : Promise.resolve(),

      // Framework Hukum
      upsertFrameworkHukum({ ...piipData.framework_hukum, kasus_id: kasusId }),

      // Digital Forensik
      upsertDigitalForensik({ ...piipData.digital_forensik, kasus_id: kasusId }),
    ])

    // 3. Inkonsistensi digital (setelah digital forensik tersimpan)
    if (piipData.inkonsistensi.length > 0) {
      await upsertInkonsistensi(
        piipData.inkonsistensi.map(i => ({ ...i, kasus_id: kasusId }))
      )
    }

    return NextResponse.json({
      success: true,
      kasus_id: kasusId,
      nomor_lp: kasus.nomor_lp,
      message: `Kasus ${kasus.nomor_lp} berhasil disimpan`,
    }, { status: 201 })

  } catch (err) {
    console.error('[SRIKANDI] create-kasus error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal menyimpan kasus' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// PATCH — Update Status / Field Kasus
// ——————————————————————————————————————
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id kasus wajib diisi' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const updated = await updateKasus(id, body)

    return NextResponse.json({ success: true, data: updated })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal update kasus' },
      { status: 500 }
    )
  }
}
