// src/app/dashboard/kasus/[id]/piip/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface IntelPackage {
  intelligence_brief: string
  profil_psikologis: string
  analisis_bukti: string
  digital_forensic_brief: string
  gap_analysis: string
  strategi_pembuka: string
  jebakan_logika: string
  red_flags: string
  rekomendasi_taktik: string
}

interface CostBreakdown {
  deepseek_cost_usd: number
  claude_cost_usd: number
  total_cost_usd: number
  total_cost_idr: number
  saving_vs_claude_only: number
  deepseek_tokens_estimate: number
  claude_tokens_estimate: number
}

const CARDS = [
  { key: 'intelligence_brief',    icon: '📋', title: 'INTELLIGENCE BRIEF',           full: true,  color: '#c8a84b' },
  { key: 'profil_psikologis',     icon: '🧠', title: 'PROFIL PSIKOLOGIS TERSANGKA',  full: false, color: '#9b8ecf' },
  { key: 'analisis_bukti',        icon: '🔬', title: 'ANALISIS BUKTI FISIK',         full: false, color: '#4fa3e0' },
  { key: 'digital_forensic_brief',icon: '💻', title: 'ANALISIS JEJAK DIGITAL',       full: true,  color: '#2ea043' },
  { key: 'gap_analysis',          icon: '⚠',  title: 'GAP ANALYSIS',                 full: false, color: '#e08b2a' },
  { key: 'strategi_pembuka',      icon: '🎯', title: 'STRATEGI PERTANYAAN PEMBUKA',  full: true,  color: '#c8a84b' },
  { key: 'jebakan_logika',        icon: '🪤', title: 'SKENARIO JEBAKAN LOGIKA',      full: false, color: '#e05c2a' },
  { key: 'red_flags',             icon: '🚩', title: 'RED FLAGS — WASPADA',          full: false, color: '#da3633' },
  { key: 'rekomendasi_taktik',    icon: '⚡', title: 'REKOMENDASI TAKTIK INTEROGASI',full: true,  color: '#c8a84b' },
]

export default function PIIPPage() {
  const router = useRouter()
  const params = useParams()
  const kasusId = params.id as string

  const [kasus, setKasus] = useState<any>(null)
  const [pkg, setPkg] = useState<IntelPackage | null>(null)
  const [cost, setCost] = useState<CostBreakdown | null>(null)
  const [engine, setEngine] = useState<'twin' | 'claude_only'>('twin')
  const [processingMs, setProcessingMs] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [useTwin, setUseTwin] = useState(true)

  useEffect(() => { loadKasus() }, [kasusId])

  async function loadKasus() {
    try {
      const res = await fetch(`/api/kasus?id=${kasusId}`)
      const data = await res.json()
      setKasus(data.data)

      // Cek apakah sudah ada package sebelumnya
      const pkgRes = await fetch(`/api/generate-piip?kasus_id=${kasusId}`)
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json()
        if (pkgData.package) setPkg(pkgData.package)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleGenerate() {
    if (!kasus) return
    setLoading(true)
    setError('')
    setPkg(null)

    const msgs = useTwin
      ? ['DeepSeek analytical engine starting...', 'Memindai inkonsistensi & korelasi bukti...', 'Claude menerima hasil analisis...', 'Menyusun intelligence package...']
      : ['Claude menganalisis data kasus...', 'Menyusun profil psikologis...', 'Merumuskan strategi interogasi...']

    let msgIdx = 0
    setLoadingMsg(msgs[0])
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length
      setLoadingMsg(msgs[msgIdx])
    }, 3000)

    try {
      const user = JSON.parse(sessionStorage.getItem('srikandi_user') ?? '{}')

      // Build PIIPFormData dari data kasus
      const piipData = {
        kejadian: {
          nomor_lp: kasus.nomor_lp,
          nomor_spdp: kasus.nomor_spdp,
          jenis_pidana: kasus.jenis_pidana,
          tanggal_kejadian: kasus.tanggal_kejadian,
          tanggal_laporan: kasus.tanggal_laporan,
          lokasi_kejadian: kasus.lokasi_kejadian,
          kronologi: kasus.kronologi,
          kondisi_tkp: kasus.kondisi_tkp,
          ada_cctv: kasus.ada_cctv,
        },
        tersangka: kasus.tersangka?.[0] ?? {},
        korban: kasus.korban ?? [],
        alat_bukti: kasus.alat_bukti ?? [],
        saksi: kasus.saksi ?? [],
        framework_hukum: kasus.framework_hukum ?? { pasal_diduga: [] },
        digital_forensik: kasus.digital_forensik ?? {},
        inkonsistensi: kasus.digital_forensik?.inkonsistensi_digital ?? [],
        meta: {
          threat_level: kasus.threat_level,
          tujuan_interogasi: kasus.tujuan_interogasi,
          gaya_interogasi: kasus.gaya_interogasi,
        },
      }

      const res = await fetch('/api/generate-piip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: piipData,
          kasus_id: kasusId,
          penyidik_id: user.id,
          use_twin_engine: useTwin,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Gagal generate')

      setPkg(result.package)
      setCost(result.cost_breakdown)
      setEngine(result.engine_used)
      setProcessingMs(result.processing_time_ms)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      clearInterval(msgInterval)
      setLoading(false)
      setLoadingMsg('')
    }
  }

  function copyText(text: string, btn: HTMLButtonElement) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = '✓ DISALIN'
      setTimeout(() => btn.textContent = 'SALIN', 2000)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070a0f', color: '#c9d1d9', fontFamily: "'Rajdhani', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid #1a2535', padding: '0 28px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push(`/dashboard/kasus/${kasusId}`)} style={{ background: 'none', border: 'none', color: '#6e7f8d', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
            ← KASUS
          </button>
          <span style={{ color: '#1a2535' }}>|</span>
          <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '3px', color: '#c8a84b' }}>
            INTELLIGENCE PACKAGE
          </span>
          {kasus && (
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: '#6e7f8d' }}>
              {kasus.nomor_lp}
            </span>
          )}
        </div>

        {/* ENGINE TOGGLE + GENERATE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d', letterSpacing: '1px' }}>
            <div
              onClick={() => setUseTwin(t => !t)}
              style={{ width: '36px', height: '18px', background: useTwin ? 'rgba(200,168,75,0.3)' : '#1a2535', border: `1px solid ${useTwin ? '#c8a84b' : '#3a4a5a'}`, borderRadius: '9px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ position: 'absolute', top: '2px', left: useTwin ? '18px' : '2px', width: '12px', height: '12px', background: useTwin ? '#c8a84b' : '#3a4a5a', borderRadius: '50%', transition: 'all 0.2s' }} />
            </div>
            {useTwin ? 'TWIN ENGINE' : 'CLAUDE ONLY'}
          </label>

          <button
            onClick={handleGenerate}
            disabled={loading || !kasus}
            style={{ background: loading ? '#1a2535' : '#c8a84b', color: loading ? '#6e7f8d' : '#070a0f', border: 'none', padding: '10px 24px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '3px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loading ? '⏳ MEMPROSES...' : pkg ? '↻ GENERATE ULANG' : '⚡ GENERATE PIIP'}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* LOADING STATE */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', border: '2px solid #1a2535', borderTopColor: '#c8a84b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#6e7f8d', letterSpacing: '2px', textAlign: 'center' }}>
              {loadingMsg}
            </div>
            {useTwin && (
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#4fa3e0', letterSpacing: '1px' }}>⬡ DEEPSEEK REASONING</div>
                <div style={{ color: '#3a4a5a' }}>→</div>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#c8a84b', letterSpacing: '1px' }}>⚑ CLAUDE STRATEGY</div>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ background: 'rgba(218,54,51,0.1)', border: '1px solid rgba(218,54,51,0.3)', color: '#da3633', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', padding: '14px 16px', marginBottom: '20px', letterSpacing: '0.5px' }}>
            ✕ {error}
          </div>
        )}

        {/* METADATA BAR */}
        {pkg && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px', padding: '10px 16px', background: '#0d1117', border: '1px solid #1a2535' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ea043', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#2ea043', letterSpacing: '1px' }}>
                {engine === 'twin' ? 'TWIN ENGINE: DEEPSEEK + CLAUDE' : 'CLAUDE ONLY'}
              </span>
            </div>
            {processingMs > 0 && (
              <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d' }}>
                ⏱ {(processingMs / 1000).toFixed(1)}s
              </span>
            )}
            {cost && (
              <>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d' }}>
                  💰 Rp {cost.total_cost_idr.toLocaleString('id-ID')} / kasus ini
                </span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#2ea043' }}>
                  ↓ {cost.saving_vs_claude_only}% lebih hemat vs Claude only
                </span>
              </>
            )}
            <span style={{ marginLeft: 'auto', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d' }}>
              HARGA KE POLRI: Rp 200.000/BAP · MARGIN ~95%
            </span>
          </div>
        )}

        {/* INTELLIGENCE PACKAGE OUTPUT */}
        {pkg && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {CARDS.map(card => {
              const content = pkg[card.key as keyof IntelPackage]
              if (!content) return null
              return (
                <div
                  key={card.key}
                  style={{ gridColumn: card.full ? '1 / -1' : 'auto', background: '#0d1117', border: '1px solid #1a2535', borderTop: `2px solid ${card.color}`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #1a2535', background: `${card.color}08` }}>
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: card.color, letterSpacing: '2px' }}>
                      {card.icon} {card.title}
                    </span>
                    <button
                      onClick={e => copyText(content, e.currentTarget)}
                      style={{ background: 'none', border: '1px solid #1a2535', color: '#6e7f8d', padding: '3px 10px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}>
                      SALIN
                    </button>
                  </div>
                  <div style={{ padding: '16px', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#c9d1d9' }}>
                    {content}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* EMPTY STATE */}
        {!pkg && !loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', gap: '16px' }}>
            <div style={{ fontSize: '40px', opacity: 0.2 }}>⚑</div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#3a4a5a', letterSpacing: '2px', textAlign: 'center', lineHeight: 2 }}>
              INTELLIGENCE PACKAGE BELUM DIBUAT<br />
              Klik "GENERATE PIIP" untuk memulai analisis twin engine
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
