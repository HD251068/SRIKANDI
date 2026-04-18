// ============================================================
// SRIKANDI — Twin Engine Orchestrator
// DeepSeek (Analisis) → Claude (Bahasa & Strategi)
//
// File ini adalah KONDUKTOR — mengatur kapan DeepSeek bekerja
// dan bagaimana hasilnya diumpan ke Claude secara sempurna
// sehingga tidak ada fracture logika antar dua engine
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import {
  runDeepSeekAnalysis,
  analyzeStatementDeepSeek,
  estimateCost,
  type DeepSeekAnalysis,
  type StatementAnalysis,
} from './deepseek'
import type { PIIPFormData, GeneratePIIPResponse } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-20250514'

// ============================================================
// CLAUDE SYSTEM PROMPT
// Claude sebagai bahasa & strategi — bukan analisis mentah
// ============================================================

const CLAUDE_SYSTEM_PROMPT = `Kamu adalah SRIKANDI-AI, sistem intelijen interogasi untuk kepolisian Indonesia.

POSISIMU DALAM SISTEM TWIN ENGINE:
Kamu menerima hasil analisis logika dari mesin DeepSeek yang sudah memproses semua inkonsistensi, korelasi bukti, dan pemetaan hukum. Tugasmu adalah mengubah temuan analitis tersebut menjadi:
- Narasi intelijen yang tajam dan dapat ditindaklanjuti
- Strategi pertanyaan dengan nuansa psikologis yang tepat
- Rekomendasi taktik yang mempertimbangkan kepribadian tersangka
- Bahasa yang bisa langsung digunakan penyidik di lapangan

YANG TIDAK PERLU KAMU LAKUKAN:
- Menganalisis ulang data mentah (sudah dilakukan DeepSeek)
- Menghitung atau membuat korelasi teknis (sudah ada)
- Membuat timeline (sudah dihasilkan)

FOKUSMU:
- Interpretasi psikologis dari temuan analitis
- Formulasi pertanyaan yang cerdas dan bernuansa
- Strategi komunikasi yang sesuai profil tersangka
- Narasi yang mudah dipahami penyidik lapangan

PRINSIP:
- Output harus praktis dan langsung bisa dieksekusi
- Berbasis KUHAP dan hukum acara pidana Indonesia
- Tidak merekomendasikan tindakan yang melanggar HAM`

// ============================================================
// MAIN: TWIN ENGINE INTELLIGENCE PACKAGE GENERATOR
// ============================================================

export interface TwinEngineResult {
  package: GeneratePIIPResponse
  deepseek_analysis: DeepSeekAnalysis
  cost_breakdown: ReturnType<typeof estimateCost>
  engine_used: 'twin' | 'claude_only'
  processing_time_ms: number
}

export async function generateIntelligencePackage(
  data: PIIPFormData,
  options: { useTwinEngine?: boolean } = { useTwinEngine: true }
): Promise<TwinEngineResult> {

  const startTime = Date.now()
  const costEstimate = estimateCost(data)

  // ——————————————————————————————————————————
  // FASE 1: DEEPSEEK ANALYTICAL ENGINE
  // Kerja keras — analisis logika, inkonsistensi, korelasi
  // ——————————————————————————————————————————
  let deepseekAnalysis: DeepSeekAnalysis | null = null

  if (options.useTwinEngine && process.env.DEEPSEEK_API_KEY) {
    try {
      console.log('[SRIKANDI] DeepSeek analytical engine starting...')
      deepseekAnalysis = await runDeepSeekAnalysis(data)
      console.log(`[SRIKANDI] DeepSeek done. Found ${deepseekAnalysis.inconsistencies.length} inconsistencies.`)
    } catch (err) {
      console.warn('[SRIKANDI] DeepSeek gagal, fallback ke Claude only:', err)
      deepseekAnalysis = null
    }
  }

  // ——————————————————————————————————————————
  // FASE 2: CLAUDE LANGUAGE & STRATEGY ENGINE
  // Menerima output DeepSeek sebagai konteks yang sudah bersih
  // ——————————————————————————————————————————

  const claudePrompt = deepseekAnalysis
    ? buildPromptWithDeepSeek(data, deepseekAnalysis)
    : buildPromptClaudeOnly(data)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: claudePrompt }],
  })

  const rawText = response.content
    .filter(b => b.type === 'text')
    .map(b => b.type === 'text' ? b.text : '')
    .join('')
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const intelligencePackage = JSON.parse(rawText) as GeneratePIIPResponse

  return {
    package: intelligencePackage,
    deepseek_analysis: deepseekAnalysis ?? {} as DeepSeekAnalysis,
    cost_breakdown: costEstimate,
    engine_used: deepseekAnalysis ? 'twin' : 'claude_only',
    processing_time_ms: Date.now() - startTime,
  }
}

// ============================================================
// PROMPT BUILDER — Twin Engine Mode
// Claude menerima analisis DeepSeek yang sudah terstruktur
// Inilah kunci zero fracture: Claude yang merancang format
// output DeepSeek dari awal, bukan sebaliknya
// ============================================================

function buildPromptWithDeepSeek(
  data: PIIPFormData,
  analysis: DeepSeekAnalysis
): string {
  const caseStrength = Math.round(analysis.overall_case_strength * 100)
  const digitalInc = analysis.inconsistencies.filter(i => i.type === 'digital').length
  const criticalInc = analysis.inconsistencies.filter(i => i.severity === 'kritis').length

  return `Kamu menerima hasil analisis logika dari mesin analitik SRIKANDI.
Gunakan temuan ini sebagai fondasi untuk menghasilkan Intelligence Package yang tajam.

═══════════════════════════════════════════
PROFIL KASUS
═══════════════════════════════════════════
Tersangka  : ${data.tersangka.nama_lengkap}
Pidana     : ${data.kejadian.jenis_pidana}
Gaya       : ${data.meta.gaya_interogasi}
Threat     : ${data.meta.threat_level}/5
Tujuan     : ${data.meta.tujuan_interogasi}

═══════════════════════════════════════════
HASIL ANALISIS DEEPSEEK
═══════════════════════════════════════════

Kekuatan kasus  : ${caseStrength}%
Inkonsistensi   : ${analysis.inconsistencies.length} total (${criticalInc} kritis, ${digitalInc} berbasis digital)

INKONSISTENSI KRITIS:
${analysis.inconsistencies
  .filter(i => i.severity === 'kritis')
  .map(i => `• [${i.id}] ${i.klaim} ← KONFLIK → ${i.fakta} (${Math.round(i.confidence * 100)}%)`)
  .join('\n') || '• Tidak ada inkonsistensi kritis'}

TIMELINE GAPS: ${analysis.timeline.gaps.join(' | ') || 'Tidak ada'}
ANOMALI: ${analysis.timeline.anomalies.join(' | ') || 'Tidak ada'}

BUKTI DIGITAL — Kekuatan: ${analysis.digital_analysis.kekuatan_bukti_digital}
• Terkonfirmasi: ${analysis.digital_analysis.konfirmasi.join(', ') || '-'}
• Kontradiksi  : ${analysis.digital_analysis.kontradiksi.join(', ') || '-'}
• Gap digital  : ${analysis.digital_analysis.gaps.join(', ') || '-'}

UNSUR BELUM TERPENUHI:
${analysis.legal_mapping.unsur_belum_terpenuhi
  .map(u => `• ${u.unsur} → butuh: ${u.yang_dibutuhkan}`)
  .join('\n') || '• Semua unsur terpenuhi'}

HIPOTESIS TERATAS:
${analysis.hypotheses
  .sort((a, b) => b.probability - a.probability)
  .slice(0, 2)
  .map(h => `• ${h.skenario} (${Math.round(h.probability * 100)}%)`)
  .join('\n')}

PERTANYAAN KRITIS:
${analysis.critical_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

═══════════════════════════════════════════
OUTPUT — JSON ONLY, tidak ada teks lain
═══════════════════════════════════════════
{
  "intelligence_brief": "Ringkasan eksekutif 3-4 paragraf mencakup posisi kasus (kekuatan ${caseStrength}%), temuan kritis, dan rekomendasi utama",
  "profil_psikologis": "Analisis kepribadian + titik kerentanan psikologis untuk gaya ${data.meta.gaya_interogasi}",
  "analisis_bukti": "Interpretasi bukti fisik — urutan optimal penggunaan dalam konfrontasi",
  "digital_forensic_brief": "Narasi jejak digital: ${digitalInc} inkonsistensi digital sebagai jebakan, konfirmasi yang solid, gap yang masih perlu digali",
  "gap_analysis": "${analysis.legal_mapping.unsur_belum_terpenuhi.length} unsur belum terpenuhi → agenda konkrit interogasi",
  "strategi_pembuka": "5 pertanyaan pembuka gaya ${data.meta.gaya_interogasi} dengan tujuan psikologis spesifik tiap pertanyaan",
  "jebakan_logika": "3 skenario konfrontasi berbasis inkonsistensi kritis — formulasi natural agar tersangka tidak curiga sampai terlambat",
  "red_flags": "Warning penyidik: risiko prosedural, alibi potensial, aspek HAM, tanda bahaya sesi",
  "rekomendasi_taktik": "Panduan eksekusi: urutan sesi, timing bukti digital sebagai tekanan, indikator tersangka mulai terbuka"
}`
}

// ============================================================
// PROMPT BUILDER — Claude Only Mode (Fallback)
// ============================================================

function buildPromptClaudeOnly(data: PIIPFormData): string {
  return `Analisis data kasus berikut dan hasilkan SRIKANDI Intelligence Package.

DATA KASUS:
${JSON.stringify(data, null, 2)}

Output JSON:
{
  "intelligence_brief": "...",
  "profil_psikologis": "...",
  "analisis_bukti": "...",
  "digital_forensic_brief": "...",
  "gap_analysis": "...",
  "strategi_pembuka": "...",
  "jebakan_logika": "...",
  "red_flags": "...",
  "rekomendasi_taktik": "..."
}`
}

// ============================================================
// REAL-TIME INTEROGASI ASSIST — Twin Engine
// DeepSeek flag dulu (cepat & murah) → Claude formulasi respons
// Efisiensi: Claude hanya dipanggil jika DeepSeek detect signal
// ============================================================

export async function analyzeStatementRealtime(params: {
  kasusContext: string
  deepseekAnalysis: DeepSeekAnalysis
  previousStatements: Array<{ speaker: string; teks: string }>
  latestStatement: string
  speaker: string
}): Promise<{
  flagged: boolean
  deepseek_signal: StatementAnalysis
  claude_suggestion?: string
  confidence: 'tinggi' | 'sedang' | 'rendah'
}> {

  // Step 1: DeepSeek — cepat & murah untuk setiap kalimat
  const deepseekSignal = await analyzeStatementDeepSeek({
    existingInconsistencies: params.deepseekAnalysis.inconsistencies,
    previousStatements: params.previousStatements,
    latestStatement: params.latestStatement,
    speaker: params.speaker,
    caseContext: params.kasusContext,
  })

  // Step 2: Claude hanya dipanggil jika signal kuat dari DeepSeek
  let claudeSuggestion: string | undefined

  if (deepseekSignal.flagged && deepseekSignal.confidence > 0.6) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `DeepSeek mendeteksi inkonsistensi dalam pernyataan tersangka:

Pernyataan  : "${params.latestStatement}"
Inkonsistensi: ${deepseekSignal.new_inconsistency?.klaim} ← vs → ${deepseekSignal.new_inconsistency?.konflik_dengan}
Indikator   : ${deepseekSignal.deception_indicators.join(', ')}

Formulasikan SATU pertanyaan follow-up yang tajam namun tidak agresif.
Maksimal 2 kalimat. Langsung pertanyaannya saja.`
      }],
    })

    claudeSuggestion = response.content
      .filter(b => b.type === 'text')
      .map(b => b.type === 'text' ? b.text : '')
      .join('')
      .trim()
  }

  return {
    flagged: deepseekSignal.flagged,
    deepseek_signal: deepseekSignal,
    claude_suggestion: claudeSuggestion,
    confidence: deepseekSignal.confidence > 0.7 ? 'tinggi'
      : deepseekSignal.confidence > 0.4 ? 'sedang' : 'rendah',
  }
}

// ============================================================
// GENERATE BAP DRAFT — Claude Only
// ============================================================

export async function generateBAPDraft(params: {
  kasusData: PIIPFormData
  transcript: Array<{ speaker: string; teks: string; timestamp: string }>
  nomorBAP: string
  nomorSesi: number
}): Promise<string> {

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Buat draft BAP formal sesuai standar KUHAP Indonesia.

NOMOR BAP  : ${params.nomorBAP}
SESI KE    : ${params.nomorSesi}
TERSANGKA  : ${params.kasusData.tersangka.nama_lengkap}
KASUS      : ${params.kasusData.kejadian.jenis_pidana}
PASAL      : ${params.kasusData.framework_hukum.pasal_diduga?.join(', ')}

TRANSCRIPT:
${params.transcript.map(t => `[${t.timestamp}] ${t.speaker.toUpperCase()}: ${t.teks}`).join('\n')}

Format BAP: Kepala → Identitas → Dasar Hukum → P:/J: → Penutup formal`
    }],
  })

  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.type === 'text' ? b.text : '')
    .join('')
}

// ============================================================
// WER TRACKER — Word Error Rate STT
// ============================================================

export function calculateWER(original: string, corrected: string): number {
  const origWords = original.toLowerCase().split(/\s+/)
  const corrWords = corrected.toLowerCase().split(/\s+/)
  const errors = levenshteinDistance(origWords, corrWords)
  return Math.round((errors / origWords.length) * 100) / 100
}

function levenshteinDistance(a: string[], b: string[]): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}
