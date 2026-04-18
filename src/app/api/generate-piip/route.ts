// src/app/api/generate-piip/route.ts
// ============================================================
// SRIKANDI — API Route: Generate Intelligence Package
// POST /api/generate-piip
// Twin Engine: DeepSeek (Analisis) + Claude (Strategi)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { generateIntelligencePackage } from '@/lib/claude'
import { saveIntelligencePackage, getLatestPackage } from '@/lib/supabase'
import type { PIIPFormData } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    // ——————————————————————————————————————
    // 1. Parse & Validate Request
    // ——————————————————————————————————————
    const body = await req.json()
    const { data, kasus_id, penyidik_id, use_twin_engine = true } = body as {
      data: PIIPFormData
      kasus_id: string
      penyidik_id: string
      use_twin_engine?: boolean
    }

    if (!data || !kasus_id || !penyidik_id) {
      return NextResponse.json(
        { error: 'data, kasus_id, dan penyidik_id wajib diisi' },
        { status: 400 }
      )
    }

    // ——————————————————————————————————————
    // 2. Cek versi terakhir (untuk increment versi)
    // ——————————————————————————————————————
    const existing = await getLatestPackage(kasus_id)
    const nextVersion = existing ? existing.versi + 1 : 1

    // ——————————————————————————————————————
    // 3. Jalankan Twin Engine
    // DeepSeek → Claude → Intelligence Package
    // ——————————————————————————————————————
    console.log(`[SRIKANDI] Generating package v${nextVersion} untuk kasus ${kasus_id}`)
    console.log(`[SRIKANDI] Engine: ${use_twin_engine ? 'Twin (DeepSeek+Claude)' : 'Claude Only'}`)

    const result = await generateIntelligencePackage(data, {
      useTwinEngine: use_twin_engine,
    })

    // ——————————————————————————————————————
    // 4. Simpan ke Supabase
    // ——————————————————————————————————————
    const saved = await saveIntelligencePackage({
      kasus_id,
      versi: nextVersion,
      generated_by: penyidik_id,
      intelligence_brief: result.package.intelligence_brief,
      profil_psikologis: result.package.profil_psikologis,
      analisis_bukti: result.package.analisis_bukti,
      digital_forensic_brief: result.package.digital_forensic_brief,
      gap_analysis: result.package.gap_analysis,
      strategi_pembuka: result.package.strategi_pembuka,
      jebakan_logika: result.package.jebakan_logika,
      red_flags: result.package.red_flags,
      rekomendasi_taktik: result.package.rekomendasi_taktik,
      model_used: `twin:deepseek-reasoner+claude-sonnet-4`,
      raw_prompt: { data, deepseek_analysis: result.deepseek_analysis },
    })

    // ——————————————————————————————————————
    // 5. Return Response
    // ——————————————————————————————————————
    return NextResponse.json({
      success: true,
      package_id: saved.id,
      versi: nextVersion,
      engine_used: result.engine_used,
      processing_time_ms: result.processing_time_ms,
      cost_breakdown: result.cost_breakdown,
      package: result.package,
      deepseek_analysis: result.deepseek_analysis,
    })

  } catch (err) {
    console.error('[SRIKANDI] generate-piip error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET — ambil package terakhir untuk kasus tertentu
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

    const pkg = await getLatestPackage(kasusId)
    if (!pkg) {
      return NextResponse.json(
        { error: 'Intelligence package belum dibuat untuk kasus ini' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, package: pkg })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
