// src/app/api/bap/route.ts
// ============================================================
// SRIKANDI — API Route: Generate BAP Draft
// POST /api/bap — generate BAP dari transcript
// GET  /api/bap?kasus_id=xxx — ambil semua BAP kasus
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { generateBAPDraft } from '@/lib/claude'
import { saveBAPDraft, getSesiByKasus } from '@/lib/supabase'
import type { PIIPFormData } from '@/lib/types'

// ——————————————————————————————————————
// POST — Generate BAP Draft
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      kasus_id,
      sesi_id,
      penyidik_id,
      kasusData,
      nomor_bap,
      nomor_sesi,
    } = body as {
      kasus_id: string
      sesi_id: string
      penyidik_id: string
      kasusData: PIIPFormData
      nomor_bap: string
      nomor_sesi: number
    }

    if (!kasus_id || !sesi_id || !penyidik_id || !kasusData) {
      return NextResponse.json(
        { error: 'kasus_id, sesi_id, penyidik_id, kasusData wajib diisi' },
        { status: 400 }
      )
    }

    // 1. Ambil transcript sesi ini dari Supabase
    const sesiList = await getSesiByKasus(kasus_id)
    const sesi = sesiList.find(s => s.id === sesi_id)

    if (!sesi) {
      return NextResponse.json(
        { error: 'Sesi interogasi tidak ditemukan' },
        { status: 404 }
      )
    }

    const transcript = (sesi.transcript ?? []).map(t => ({
      speaker: t.speaker,
      teks: t.teks_koreksi ?? t.teks_original, // Pakai versi terkoreksi jika ada
      timestamp: new Date(t.timestamp_bicara).toLocaleTimeString('id-ID'),
    }))

    if (transcript.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada transcript untuk sesi ini' },
        { status: 400 }
      )
    }

    // 2. Generate BAP via Claude
    console.log(`[SRIKANDI] Generating BAP ${nomor_bap} untuk kasus ${kasus_id}`)

    const bapText = await generateBAPDraft({
      kasusData,
      transcript,
      nomorBAP: nomor_bap,
      nomorSesi: nomor_sesi,
    })

    // 3. Simpan draft ke Supabase
    const saved = await saveBAPDraft({
      kasus_id,
      sesi_id,
      nomor_bap,
      konten_bap: bapText,
      status: 'draft',
      generated_by: penyidik_id,
    })

    // 4. Hitung WER stats dari sesi ini
    const transcriptRaw = sesi.transcript ?? []
    const correctedCount = transcriptRaw.filter(t => t.is_corrected).length
    const totalCount = transcriptRaw.length
    const werEstimate = totalCount > 0
      ? Math.round((correctedCount / totalCount) * 100)
      : 0

    return NextResponse.json({
      success: true,
      bap_id: saved.id,
      nomor_bap,
      konten_bap: bapText,
      stats: {
        total_utterances: totalCount,
        corrected: correctedCount,
        wer_percent: werEstimate,
        stt_accuracy_percent: 100 - werEstimate,
      },
    })

  } catch (err) {
    console.error('[SRIKANDI] generate-bap error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal generate BAP' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// GET — Ambil semua BAP untuk kasus
// ——————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const kasusId = searchParams.get('kasus_id')

    if (!kasusId) {
      return NextResponse.json(
        { error: 'kasus_id wajib diisi' },
        { status: 400 }
      )
    }

    // Ambil via sesi
    const sesiList = await getSesiByKasus(kasusId)

    return NextResponse.json({
      success: true,
      data: sesiList,
      total_sesi: sesiList.length,
    })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengambil data BAP' },
      { status: 500 }
    )
  }
}
