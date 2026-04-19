// src/app/api/generate-piip/route.ts
// ============================================================
// SRIKANDI — API Route: Generate Intelligence Package
// POST /api/generate-piip  — generate via twin engine
// GET  /api/generate-piip?kasus_id=xxx — ambil package terakhir
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ——————————————————————————————————————
// CLIENTS
// ——————————————————————————————————————
function sc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

function getAI() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY

  if (anthropicKey) {
    return { client: new Anthropic({ apiKey: anthropicKey }), model: 'claude-sonnet-4-20250514' }
  }
  if (openrouterKey) {
    return {
      client: new Anthropic({
        apiKey: openrouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://srikandi.vercel.app',
          'X-Title': 'SRIKANDI',
        },
      }),
      // Model yang tersedia di OpenRouter free tier
      model: 'anthropic/claude-3-haiku',
    }
  }
  throw new Error('Tidak ada AI API key. Set ANTHROPIC_API_KEY atau OPENROUTER_API_KEY')
}

// ——————————————————————————————————————
// GET — Ambil package terakhir
// ——————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const kasusId = searchParams.get('kasus_id')
    if (!kasusId) {
      return NextResponse.json({ error: 'kasus_id wajib diisi' }, { status: 400 })
    }

    const { data } = await sc()
      .from('intelligence_package')
      .select('*')
      .eq('kasus_id', kasusId)
      .order('versi', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ success: true, package: data ?? null, exists: !!data })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    )
  }
}

// ——————————————————————————————————————
// POST — Generate Intelligence Package
// ——————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data: piipData, kasus_id, penyidik_id } = body

    if (!piipData || !kasus_id || !penyidik_id) {
      return NextResponse.json(
        { error: 'data, kasus_id, dan penyidik_id wajib diisi' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    console.log('[SRIKANDI] Generating PIIP for kasus:', kasus_id)

    // Cek versi terakhir
    const { data: existing } = await sc()
      .from('intelligence_package')
      .select('versi')
      .eq('kasus_id', kasus_id)
      .order('versi', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = existing ? (existing.versi + 1) : 1

    // Build compact prompt - hindari timeout Vercel 10s
    const kasusRingkas = {
      jenis: piipData?.kejadian?.jenis_pidana,
      kronologi: piipData?.kejadian?.kronologi,
      tersangka: piipData?.tersangka?.nama_lengkap,
      motif: piipData?.tersangka?.dugaan_motif,
      bukti: (piipData?.alat_bukti ?? []).map((b: any) => b.deskripsi).join(', '),
      pasal: (piipData?.framework_hukum?.pasal_diduga ?? []).join(', '),
      gaya: piipData?.meta?.gaya_interogasi,
      threat: piipData?.meta?.threat_level,
    }

    const prompt = \`Kamu adalah SRIKANDI-AI, analis intelijen kriminal Indonesia.
Analisis kasus ini dan hasilkan Intelligence Package. HANYA JSON, tanpa teks lain.

KASUS: \${JSON.stringify(kasusRingkas)}

Output JSON:
{"intelligence_brief":"ringkasan 2 paragraf posisi kasus dan rekomendasi","profil_psikologis":"analisis kepribadian tersangka dan kerentanan psikologis","analisis_bukti":"kekuatan dan kelemahan bukti","digital_forensic_brief":"status jejak digital","gap_analysis":"apa yang masih perlu digali","strategi_pembuka":"3 pertanyaan pembuka strategis","jebakan_logika":"2 skenario konfrontasi inkonsistensi","red_flags":"hal yang perlu diwaspadai","rekomendasi_taktik":"panduan taktis interogasi"}\`

    // Call AI
    const { client, model } = getAI()
    console.log('[SRIKANDI] Using model:', model)
    console.log('[SRIKANDI] ANTHROPIC_KEY exists:', !!process.env.ANTHROPIC_API_KEY)
    console.log('[SRIKANDI] OPENROUTER_KEY exists:', !!process.env.OPENROUTER_API_KEY)

    let response: any
    try {
      response = await client.messages.create({
        model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })
      console.log('[SRIKANDI] AI response received, tokens:', response.usage)
    } catch (aiErr: any) {
      console.error('[SRIKANDI] AI call failed:', aiErr?.message, aiErr?.status, JSON.stringify(aiErr?.error ?? {}))
      throw new Error(`AI error: ${aiErr?.message ?? 'Unknown AI error'}`)
    }

    const rawText = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let packageData
    try {
      packageData = JSON.parse(rawText)
    } catch {
      throw new Error(`AI response bukan valid JSON: ${rawText.substring(0, 200)}`)
    }

    // Simpan ke database
    const { data: saved, error: saveErr } = await sc()
      .from('intelligence_package')
      .insert({
        kasus_id,
        versi: nextVersion,
        generated_by: penyidik_id,
        intelligence_brief: packageData.intelligence_brief,
        profil_psikologis: packageData.profil_psikologis,
        analisis_bukti: packageData.analisis_bukti,
        digital_forensic_brief: packageData.digital_forensic_brief,
        gap_analysis: packageData.gap_analysis,
        strategi_pembuka: packageData.strategi_pembuka,
        jebakan_logika: packageData.jebakan_logika,
        red_flags: packageData.red_flags,
        rekomendasi_taktik: packageData.rekomendasi_taktik,
        model_used: model,
        tokens_used: response.usage?.output_tokens ?? 0,
      })
      .select()
      .single()

    if (saveErr) {
      console.error('[SRIKANDI] Save package error:', saveErr)
      // Tetap return hasil meski gagal simpan
    }

    const processingMs = Date.now() - startTime
    console.log(`[SRIKANDI] Package generated in ${processingMs}ms`)

    return NextResponse.json({
      success: true,
      package_id: saved?.id,
      versi: nextVersion,
      engine_used: 'claude_only',
      processing_time_ms: processingMs,
      cost_breakdown: {
        total_cost_idr: Math.round((response.usage?.input_tokens ?? 0) * 0.05),
        saving_vs_claude_only: 0,
      },
      package: packageData,
    })

  } catch (err) {
    console.error('[SRIKANDI] generate-piip error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal generate intelligence package' },
      { status: 500 }
    )
  }
}
