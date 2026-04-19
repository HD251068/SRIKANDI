// src/app/dashboard/kasus/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function KasusDetail() {
  const router = useRouter()
  const params = useParams()
  const [kasus, setKasus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/kasus?id=${params.id}`)
      .then(r => r.json())
      .then(d => { setKasus(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  const s = {
    root: { minHeight: '100vh', background: '#070a0f', color: '#c9d1d9', fontFamily: "'Rajdhani', sans-serif" },
    header: { background: '#0d1117', borderBottom: '1px solid #1a2535', padding: '0 28px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky' as const, top: 0, zIndex: 100 },
    body: { padding: '32px 40px' },
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#6e7f8d', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
          ← DASHBOARD
        </button>
        <span style={{ color: '#1a2535' }}>|</span>
        <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '3px', color: '#c8a84b' }}>
          {loading ? '...' : kasus?.nomor_lp ?? 'DETAIL KASUS'}
        </span>
      </div>

      <div style={s.body}>
        {loading ? (
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#3a4a5a', letterSpacing: '2px' }}>⏳ MEMUAT...</div>
        ) : !kasus ? (
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#da3633' }}>Kasus tidak ditemukan</div>
        ) : (
          <div>
            {/* INFO KASUS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              {[
                { label: 'Nomor LP', val: kasus.nomor_lp },
                { label: 'Jenis Pidana', val: kasus.jenis_pidana },
                { label: 'Status', val: kasus.status?.toUpperCase() },
                { label: 'Lokasi', val: kasus.lokasi_kejadian ?? '—' },
                { label: 'Tanggal Laporan', val: kasus.tanggal_laporan ? new Date(kasus.tanggal_laporan).toLocaleDateString('id-ID') : '—' },
                { label: 'Threat Level', val: `L${kasus.threat_level}` },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#0d1117', border: '1px solid #1a2535', padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#6e7f8d', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* KRONOLOGI */}
            <div style={{ background: '#0d1117', border: '1px solid #1a2535', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d', letterSpacing: '2px', marginBottom: '10px' }}>KRONOLOGI</div>
              <div style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{kasus.kronologi ?? '—'}</div>
            </div>

            {/* GENERATE PIIP BUTTON */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push(`/dashboard/kasus/${kasus.id}/piip`)}
                style={{ background: '#c8a84b', color: '#070a0f', border: 'none', padding: '12px 28px', fontFamily: 'Oswald, sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '3px', cursor: 'pointer' }}>
                ⚡ GENERATE INTELLIGENCE PACKAGE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
