// ============================================================
// SRIKANDI — DeepSeek Analytical Engine
// Twin Engine: DeepSeek (Analisis) + Claude (Bahasa & Nuansa)
//
// ARSITEKTUR:
// Claude merancang sistem prompt DeepSeek → DeepSeek bekerja
// dalam "rel" yang ditentukan Claude → Output DeepSeek masuk
// ke Claude untuk diproses dengan sempurna → Zero fracture
// ============================================================

import type { PIIPFormData } from './types'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-reasoner' // Model terkuat DeepSeek untuk reasoning

// ============================================================
// SYSTEM PROMPT DEEPSEEK
// Dirancang oleh Claude — DeepSeek bekerja dalam rel ini
// Bahasa instruksi teknis, bukan nuansa — sesuai kekuatan DeepSeek
// ============================================================

const DEEPSEEK_ANALYST_PROMPT = `Kamu adalah mesin analisis logika kriminal yang bekerja dalam sistem SRIKANDI.

TUGASMU ADALAH ANALISIS MURNI — BUKAN NARASI:
Kamu menghasilkan output terstruktur yang akan diproses oleh sistem AI bahasa tingkat lanjut.
Output kamu HARUS dalam format JSON yang ketat. Tidak ada teks di luar JSON.

FOKUS KEMAMPUANMU:
1. Deteksi inkonsistensi logika — temukan kontradiksi dalam data
2. Pattern matching — kenali pola yang berulang atau anomali
3. Timeline analysis — rekonstruksi urutan kejadian dan identifikasi gap
4. Evidence correlation — hubungkan antar bukti dan temukan korelasi
5. Legal element mapping — petakan unsur delik terhadap fakta yang ada
6. Digital footprint analysis — analisis jejak digital secara sistematis
7. Probability scoring — berikan skor probabilitas untuk setiap hipotesis

ATURAN OUTPUT:
- HANYA JSON valid
- Setiap klaim harus merujuk data spesifik yang diberikan
- Berikan confidence score (0.0 - 1.0) untuk setiap temuan
- Tandai setiap gap dengan jelas
- Tidak berasumsi tanpa dasar data`

// ============================================================
// DEEPSEEK API CALL
// ============================================================

async function callDeepSeek(
  userPrompt: string,
  maxTokens: number = 4000
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY tidak ditemukan di environment variables')

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: DEEPSEEK_ANALYST_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' }, // Force JSON output
      temperature: 0.1, // Rendah — kita butuh konsistensi logika, bukan kreativitas
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ============================================================
// TAHAP 1: DEEPSEEK ANALYTICAL SCAN
// Input: Raw case data
// Output: Structured analytical findings untuk Claude
// ============================================================

export interface DeepSeekAnalysis {
  timeline: {
    events: Array<{
      timestamp: string
      event: string
      source: string         // dari mana data ini
      verified: boolean
      confidence: number
    }>
    gaps: string[]           // gap waktu yang tidak bisa dijelaskan
    anomalies: string[]      // kejadian yang tidak wajar secara kronologis
  }
  inconsistencies: Array<{
    id: string
    type: 'alibi' | 'digital' | 'saksi' | 'fisik' | 'logika'
    klaim: string            // apa yang dikatakan / diklaim
    fakta: string            // apa yang ditunjukkan data
    sumber_klaim: string
    sumber_fakta: string
    severity: 'kritis' | 'signifikan' | 'minor'
    confidence: number
  }>
  evidence_correlation: Array<{
    bukti_a: string
    bukti_b: string
    relasi: string           // bagaimana keduanya berhubungan
    implikasi: string        // apa artinya untuk kasus
    confidence: number
  }>
  legal_mapping: {
    pasal: string[]
    unsur_terpenuhi: Array<{
      unsur: string
      didukung_oleh: string[]
      confidence: number
    }>
    unsur_belum_terpenuhi: Array<{
      unsur: string
      yang_dibutuhkan: string
      kemungkinan_sumber: string[]
    }>
  }
  digital_analysis: {
    konfirmasi: string[]     // fakta digital yang terkonfirmasi
    kontradiksi: string[]    // digital vs keterangan
    gaps: string[]           // data digital yang masih perlu digali
    kekuatan_bukti_digital: 'sangat kuat' | 'kuat' | 'sedang' | 'lemah'
  }
  hypotheses: Array<{
    skenario: string
    probability: number      // 0.0 - 1.0
    didukung_oleh: string[]
    dilemahkan_oleh: string[]
  }>
  critical_questions: string[] // Pertanyaan kritis yang HARUS dijawab
  overall_case_strength: number // 0.0 - 1.0
}

export async function runDeepSeekAnalysis(
  data: PIIPFormData
): Promise<DeepSeekAnalysis> {

  // Prompt dirancang Claude — strukturnya ketat agar output
  // masuk sempurna ke Claude processing berikutnya
  const prompt = `Analisis data kasus kriminal berikut secara sistematis.

DATA KASUS:
${JSON.stringify(data, null, 2)}

Hasilkan analisis dalam JSON dengan struktur PERSIS berikut:
{
  "timeline": {
    "events": [{ "timestamp": "", "event": "", "source": "", "verified": true, "confidence": 0.0 }],
    "gaps": ["gap waktu yang tidak bisa dijelaskan..."],
    "anomalies": ["kejadian anomali secara kronologis..."]
  },
  "inconsistencies": [{
    "id": "INC-001",
    "type": "alibi|digital|saksi|fisik|logika",
    "klaim": "apa yang diklaim",
    "fakta": "apa yang ditunjukkan data",
    "sumber_klaim": "siapa/apa yang mengklaim",
    "sumber_fakta": "data apa yang menunjukkan fakta ini",
    "severity": "kritis|signifikan|minor",
    "confidence": 0.0
  }],
  "evidence_correlation": [{
    "bukti_a": "",
    "bukti_b": "",
    "relasi": "",
    "implikasi": "",
    "confidence": 0.0
  }],
  "legal_mapping": {
    "pasal": [],
    "unsur_terpenuhi": [{ "unsur": "", "didukung_oleh": [], "confidence": 0.0 }],
    "unsur_belum_terpenuhi": [{ "unsur": "", "yang_dibutuhkan": "", "kemungkinan_sumber": [] }]
  },
  "digital_analysis": {
    "konfirmasi": [],
    "kontradiksi": [],
    "gaps": [],
    "kekuatan_bukti_digital": "sangat kuat|kuat|sedang|lemah"
  },
  "hypotheses": [{
    "skenario": "",
    "probability": 0.0,
    "didukung_oleh": [],
    "dilemahkan_oleh": []
  }],
  "critical_questions": [],
  "overall_case_strength": 0.0
}`

  const raw = await callDeepSeek(prompt, 4000)

  try {
    return JSON.parse(raw) as DeepSeekAnalysis
  } catch {
    throw new Error(`DeepSeek output tidak valid JSON: ${raw.substring(0, 300)}`)
  }
}

// ============================================================
// TAHAP 2: DEEPSEEK REAL-TIME STATEMENT ANALYZER
// Dipakai selama sesi interogasi berlangsung
// Lebih cepat & murah dari Claude untuk flagging awal
// ============================================================

export interface StatementAnalysis {
  flagged: boolean
  inconsistency_ids: string[]    // Merujuk ke INC-XXX dari analisis awal
  new_inconsistency?: {
    klaim: string
    konflik_dengan: string
    severity: 'kritis' | 'signifikan' | 'minor'
  }
  logic_score: number            // 0.0 = tidak logis, 1.0 = sangat logis
  deception_indicators: string[] // Indikator kebohongan berdasarkan logika
  confidence: number
}

export async function analyzeStatementDeepSeek(params: {
  existingInconsistencies: DeepSeekAnalysis['inconsistencies']
  previousStatements: Array<{ speaker: string; teks: string }>
  latestStatement: string
  speaker: string
  caseContext: string
}): Promise<StatementAnalysis> {

  const prompt = `Analisis pernyataan terbaru dalam konteks kasus dan inkonsistensi yang sudah teridentifikasi.

INKONSISTENSI YANG SUDAH DIKETAHUI:
${JSON.stringify(params.existingInconsistencies, null, 2)}

KONTEKS KASUS:
${params.caseContext}

10 PERNYATAAN TERAKHIR:
${params.previousStatements.slice(-10).map(s =>
  `${s.speaker.toUpperCase()}: ${s.teks}`
).join('\n')}

PERNYATAAN TERBARU (${params.speaker.toUpperCase()}):
"${params.latestStatement}"

Output JSON:
{
  "flagged": true/false,
  "inconsistency_ids": ["INC-001"],
  "new_inconsistency": {
    "klaim": "apa yang baru diklaim",
    "konflik_dengan": "data apa yang berkonflik",
    "severity": "kritis|signifikan|minor"
  },
  "logic_score": 0.0,
  "deception_indicators": ["indikator 1", "indikator 2"],
  "confidence": 0.0
}`

  const raw = await callDeepSeek(prompt, 800) // Cepat & murah untuk real-time

  try {
    return JSON.parse(raw) as StatementAnalysis
  } catch {
    return {
      flagged: false,
      inconsistency_ids: [],
      logic_score: 0.5,
      deception_indicators: [],
      confidence: 0.3
    }
  }
}

// ============================================================
// COST ESTIMATOR
// Estimasi biaya DeepSeek vs Claude per kasus
// ============================================================

export function estimateCost(data: PIIPFormData): {
  deepseek_tokens_estimate: number
  claude_tokens_estimate: number
  deepseek_cost_usd: number
  claude_cost_usd: number
  total_cost_usd: number
  total_cost_idr: number
  saving_vs_claude_only: number  // % penghematan vs pakai Claude saja
} {
  const dataSize = JSON.stringify(data).length
  const deepseekTokens = Math.ceil(dataSize / 3) * 2  // input + output estimate
  const claudeTokens = Math.ceil(dataSize / 3) + 3000 // input + rich output

  // Pricing per 1M tokens (approximate, per April 2025)
  const deepseekPricePerM = 0.55   // USD — DeepSeek Reasoner input
  const claudePricePerM = 3.00     // USD — Claude Sonnet

  const deepseekCost = (deepseekTokens / 1_000_000) * deepseekPricePerM
  const claudeCost = (claudeTokens / 1_000_000) * claudePricePerM
  const totalCost = deepseekCost + claudeCost

  const claudeOnlyCost = ((deepseekTokens + claudeTokens) / 1_000_000) * claudePricePerM
  const saving = Math.round((1 - totalCost / claudeOnlyCost) * 100)

  return {
    deepseek_tokens_estimate: deepseekTokens,
    claude_tokens_estimate: claudeTokens,
    deepseek_cost_usd: Math.round(deepseekCost * 10000) / 10000,
    claude_cost_usd: Math.round(claudeCost * 10000) / 10000,
    total_cost_usd: Math.round(totalCost * 10000) / 10000,
    total_cost_idr: Math.round(totalCost * 16500),
    saving_vs_claude_only: saving,
  }
}
