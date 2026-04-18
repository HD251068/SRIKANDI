// ============================================================
// SRIKANDI — Claude AI Client
// Sistem Riset Intelijen Kriminal Andalan Indonesia
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type { PIIPFormData, GeneratePIIPResponse } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4000

// ============================================================
// SYSTEM PROMPT — Identitas & Peran Claude dalam SRIKANDI
// ============================================================

const SRIKANDI_SYSTEM_PROMPT = `Kamu adalah SRIKANDI-AI, sistem analis intelijen kriminal tingkat lanjut yang dirancang khusus untuk kepolisian Indonesia.

PERAN KAMU:
- Menganalisis data pra-interogasi secara komprehensif dan objektif
- Mengidentifikasi celah logika, inkonsistensi, dan gap informasi
- Merekomendasikan strategi interogasi berbasis bukti
- Membantu penyidik membangun kasus yang solid dan tahan gugatan hukum

PRINSIP KERJA:
- Selalu berbasis data yang diberikan, tidak berasumsi tanpa dasar
- Analisis harus dapat dipertanggungjawabkan secara hukum
- Prioritaskan bukti digital sebagai bukti yang paling objektif
- Rekomendasi harus sesuai dengan KUHAP dan hukum acara pidana Indonesia
- Output harus praktis dan langsung dapat digunakan penyidik

FORMAT OUTPUT:
- Gunakan Bahasa Indonesia yang formal namun jelas
- Terstruktur dan mudah dibaca penyidik di lapangan
- Hindari spekulasi tanpa dasar fakta

BATASAN:
- Tidak merekomendasikan tindakan yang melanggar HAM atau KUHAP
- Tidak mengarahkan pada kesimpulan sebelum bukti cukup
- Selalu ingatkan jika data yang diberikan tidak cukup untuk analisis solid`

// ============================================================
// GENERATE INTELLIGENCE PACKAGE
// ============================================================

export async function generateIntelligencePackage(
  data: PIIPFormData
): Promise<GeneratePIIPResponse> {

  const userPrompt = `Analisis data kasus berikut dan hasilkan SRIKANDI Intelligence Package lengkap.

DATA KASUS LENGKAP:
${JSON.stringify(data, null, 2)}

INSTRUKSI OUTPUT:
Hasilkan analisis dalam format JSON yang valid. HANYA JSON, tanpa teks lain, tanpa markdown, tanpa backtick.

Struktur JSON yang diharapkan:
{
  "intelligence_brief": "Ringkasan eksekutif situasi kasus 3-4 paragraf. Posisi tersangka, kekuatan bukti saat ini, dan rekomendasi utama.",
  "profil_psikologis": "Analisis profil psikologis tersangka berdasarkan data latar belakang, riwayat, dan konteks kejadian. Identifikasi kerentanan psikologis yang dapat dimanfaatkan dalam interogasi.",
  "analisis_bukti": "Analisis kritis setiap bukti fisik: kekuatan, kelemahan, dan implikasi hukumnya. Identifikasi bukti mana yang paling kuat untuk konfrontasi.",
  "digital_forensic_brief": "Analisis menyeluruh jejak digital. Apa yang sudah terkonfirmasi secara digital, inkonsistensi kritis antara data digital vs keterangan tersangka, dan gap digital yang masih perlu digali.",
  "gap_analysis": "Identifikasi secara spesifik: (1) Unsur delik apa yang belum terpenuhi, (2) Informasi apa yang masih hilang, (3) Bukti apa yang masih perlu dicari, (4) Pertanyaan kritis yang belum terjawab.",
  "strategi_pembuka": "5 pertanyaan pembuka strategis dengan format: [Pertanyaan] → [Tujuan psikologis] → [Respons yang diharapkan] → [Tindak lanjut jika menghindar]",
  "jebakan_logika": "3 skenario jebakan logika yang bisa dieksekusi, prioritaskan yang berbasis inkonsistensi digital. Format: [Setup] → [Klaim tersangka yang diprediksi] → [Konfrontasi dengan data] → [Efek psikologis yang diharapkan]",
  "red_flags": "Hal-hal kritis yang harus diwaspadai: potensi alibi kuat, saksi yang bisa melemahkan dakwaan, bukti yang bisa dikontestasi, risiko prosedural, dan aspek HAM yang harus dijaga.",
  "rekomendasi_taktik": "Panduan taktis lengkap: (1) Urutan optimal sesi interogasi, (2) Kapan dan bagaimana menggunakan bukti digital sebagai tekanan psikologis, (3) Teknik spesifik sesuai gaya interogasi yang dipilih dan profil tersangka, (4) Indikator bahwa tersangka mulai terbuka."
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SRIKANDI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const rawText = response.content
    .filter(block => block.type === 'text')
    .map(block => block.type === 'text' ? block.text : '')
    .join('')

  // Clean dan parse JSON
  const cleanText = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    return JSON.parse(cleanText) as GeneratePIIPResponse
  } catch {
    throw new Error(`Gagal parsing response AI: ${cleanText.substring(0, 200)}`)
  }
}

// ============================================================
// GENERATE BAP DRAFT
// ============================================================

export async function generateBAPDraft(params: {
  kasusData: PIIPFormData
  transcript: Array<{ speaker: string; teks: string; timestamp: string }>
  nomorBAP: string
  nomorSesi: number
}): Promise<string> {

  const prompt = `Buat draft Berita Acara Pemeriksaan (BAP) formal berdasarkan data berikut.

NOMOR BAP: ${params.nomorBAP}
SESI KE: ${params.nomorSesi}

DATA KASUS:
${JSON.stringify(params.kasusData, null, 2)}

TRANSCRIPT INTEROGASI:
${params.transcript.map(t =>
  `[${t.timestamp}] ${t.speaker.toUpperCase()}: ${t.teks}`
).join('\n')}

INSTRUKSI:
Buat BAP formal sesuai format standar kepolisian Indonesia (KUHAP). 
BAP harus mencakup:
1. Kepala BAP (nomor, hari, tanggal, waktu, tempat)
2. Identitas pemeriksa dan yang diperiksa
3. Dasar pemeriksaan (pasal yang disangkakan)
4. Pertanyaan dan jawaban dalam format formal (P: / J:)
5. Penutup dan tanda tangan

Gunakan bahasa formal BAP yang baku. Konversi transcript menjadi format tanya-jawab yang terstruktur.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SRIKANDI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content
    .filter(block => block.type === 'text')
    .map(block => block.type === 'text' ? block.text : '')
    .join('')
}

// ============================================================
// REAL-TIME INTEROGASI ASSIST
// Analisis inkonsistensi on-the-fly selama sesi
// ============================================================

export async function analyzeStatement(params: {
  kasusContext: string
  previousStatements: Array<{ speaker: string; teks: string }>
  latestStatement: string
  speaker: string
}): Promise<{
  flagged: boolean
  inconsistency?: string
  suggestedFollowUp?: string
  confidence: 'tinggi' | 'sedang' | 'rendah'
}> {

  const prompt = `Analisis pernyataan terbaru ini dalam konteks kasus dan pernyataan sebelumnya.

KONTEKS KASUS (ringkasan):
${params.kasusContext}

PERNYATAAN SEBELUMNYA:
${params.previousStatements.slice(-10).map(s =>
  `${s.speaker.toUpperCase()}: ${s.teks}`
).join('\n')}

PERNYATAAN TERBARU (${params.speaker.toUpperCase()}):
"${params.latestStatement}"

Analisis dan jawab dalam JSON:
{
  "flagged": true/false,
  "inconsistency": "Jelaskan inkonsistensi jika ada, null jika tidak ada",
  "suggestedFollowUp": "Pertanyaan follow-up yang disarankan untuk penyidik, null jika tidak perlu",
  "confidence": "tinggi/sedang/rendah"
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: SRIKANDI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.type === 'text' ? b.text : '')
    .join('')
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    return JSON.parse(text)
  } catch {
    return { flagged: false, confidence: 'rendah' }
  }
}

// ============================================================
// WER TRACKER — Word Error Rate untuk STT
// ============================================================

export function calculateWER(original: string, corrected: string): number {
  const origWords = original.toLowerCase().split(/\s+/)
  const corrWords = corrected.toLowerCase().split(/\s+/)

  // Simple Levenshtein-based WER
  const errors = levenshteinDistance(origWords, corrWords)
  return Math.round((errors / origWords.length) * 100) / 100
}

function levenshteinDistance(a: string[], b: string[]): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
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
