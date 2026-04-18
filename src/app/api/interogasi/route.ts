// src/app/api/interogasi/route.ts
// ============================================================
// SRIKANDI — API Route: Real-Time Interogasi Assist
// POST /api/interogasi/analyze
// DeepSeek flag → Claude formulasi (jika perlu)
// Didesain untuk latensi rendah — dipanggil setiap kalimat
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { analyzeStatementRealtime } from '@/lib/claude'
import {
  insertTranscript,
  koreksiTranscript,
  createSesiInterogasi,
} from '@/lib/supabase'
import type { DeepSeekAnalysis } from '@/lib/deepseek'

// ——————————————————————————————————————
// POST /api/interogasi/analyze
// Analisis real-time setiap pernyataan
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      sesi_id,
      kasus_context,
      deepseek_analysis,
      previous_statements,
      latest_statement,
      speaker,
      sequence_number,
    } = body as {
      sesi_id: string
      kasus_context: string
      deepseek_analysis: DeepSeekAnalysis
      previous_statements: Array<{ speaker: string; teks: string }>
      latest_statement: string
      speaker: 'penyidik' | 'tersangka'
      sequence_number: number
    }

    if (!sesi_id || !latest_statement || !speaker) {
      return NextResponse.json(
        { error: 'sesi_id, latest_statement, dan speaker wajib diisi' },
        { status: 400 }
      )
    }

    // 1. Simpan transcript dulu (fire and forget tidak oke — kita butuh id)
    const transcript = await insertTranscript({
      sesi_id,
      speaker,
      teks_original: latest_statement,
      sequence_number,
      flagged_inconsistency: false,
    })

    // 2. Analisis twin engine (paralel dengan simpan)
    const analysis = await analyzeStatementRealtime({
      kasusContext: kasus_context,
      deepseekAnalysis: deepseek_analysis,
      previousStatements: previous_statements,
      latestStatement: latest_statement,
      speaker,
    })

    // 3. Update transcript jika ada flag
    if (analysis.flagged) {
      await koreksiTranscript(transcript.id, latest_statement) // trigger update
      // Update flag di database
      await insertTranscript({
        sesi_id,
        speaker,
        teks_original: latest_statement,
        sequence_number,
        flagged_inconsistency: true,
        flag_note: analysis.claude_suggestion,
      })
    }

    return NextResponse.json({
      success: true,
      transcript_id: transcript.id,
      flagged: analysis.flagged,
      confidence: analysis.confidence,
      claude_suggestion: analysis.claude_suggestion,
      deepseek_signal: {
        logic_score: analysis.deepseek_signal.logic_score,
        deception_indicators: analysis.deepseek_signal.deception_indicators,
        inconsistency_ids: analysis.deepseek_signal.inconsistency_ids,
        new_inconsistency: analysis.deepseek_signal.new_inconsistency,
      },
    })

  } catch (err) {
    console.error('[SRIKANDI] analyze-statement error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal menganalisis pernyataan' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// POST /api/interogasi/sesi
// Buat sesi interogasi baru
// ——————————————————————————————————————
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { kasus_id, tersangka_id, penyidik_id, nomor_sesi, lokasi } = body

    if (!kasus_id || !tersangka_id || !penyidik_id) {
      return NextResponse.json(
        { error: 'kasus_id, tersangka_id, penyidik_id wajib diisi' },
        { status: 400 }
      )
    }

    const sesi = await createSesiInterogasi({
      kasus_id,
      tersangka_id,
      penyidik_id,
      nomor_sesi: nomor_sesi ?? 1,
      lokasi: lokasi ?? 'Ruang Interogasi',
      status: 'berlangsung',
    })

    return NextResponse.json({ success: true, sesi_id: sesi.id, data: sesi })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal membuat sesi' },
      { status: 500 }
    )
  }
}
