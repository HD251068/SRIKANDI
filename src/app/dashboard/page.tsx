// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  nama_lengkap: string
  nrp: string
  pangkat: string
  jabatan: string
  satuan: string
  role: string
}

interface Stats {
  aktif: number
  p21: number
  sp3: number
  total: number
}

interface Kasus {
  id: string
  nomor_lp: string
  jenis_pidana: string
  status: string
  threat_level: number
  created_at: string
  tersangka?: { nama_lengkap: string }[]
}

const THREAT_COLORS: Record<number, string> = {
  1: '#2ea043', 2: '#b5a229', 3: '#e08b2a', 4: '#e05c2a', 5: '#da3633'
}
const THREAT_LABELS: Record<number, string> = {
  1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4', 5: 'L5'
}
const STATUS_COLORS: Record<string, string> = {
  aktif: '#e08b2a', p21: '#2ea043', sp3: '#da3633',
  sidang: '#c8a84b', inkracht: '#6e7f8d'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({ aktif: 0, p21: 0, sp3: 0, total: 0 })
  const [kasus, setKasus] = useState<Kasus[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('srikandi_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))

    const tick = () => setTime(new Date().toLocaleTimeString('id-ID', { hour12: false }))
    tick()
    const clockInterval = setInterval(tick, 1000)
    loadData()
    return () => clearInterval(clockInterval)
  }, [])

  async function loadData() {
    try {
      const res = await fetch('/api/kasus')
      if (res.ok) {
        const data = await res.json()
        const list: Kasus[] = data.data ?? []
        setKasus(list)
        setStats({
          aktif: list.filter(k => k.status === 'aktif').length,
          p21: list.filter(k => k.status === 'p21').length,
          sp3: list.filter(k => k.status === 'sp3').length,
          total: list.length,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    sessionStorage.removeItem('srikandi_user')
    router.push('/login')
  }

  const filtered = kasus.filter(k =>
    !searchQuery ||
    k.nomor_lp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.jenis_pidana?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.tersangka?.[0]?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#070a0f', color: '#c9d1d9', fontFamily: "'Rajdhani', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid #1a2535', padding: '0 28px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #c8a84b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚑</div>
          <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '3px', color: '#c8a84b' }}>SRIKANDI</span>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#3a4a5a', letterSpacing: '1px' }}>SISTEM RISET INTELIJEN KRIMINAL ANDALAN INDONESIA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: '#c8a84b' }}>{time}</span>
          {user && (
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d', textAlign: 'right' }}>
              <div style={{ color: '#c9d1d9', fontSize: '11px' }}>{user.pangkat} {user.nama_lengkap}</div>
              <div>{user.nrp} · {user.satuan}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #1a2535', color: '#6e7f8d', padding: '4px 12px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}>
            KELUAR
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Kasus', val: stats.total, color: '#c8a84b' },
            { label: 'Aktif', val: stats.aktif, color: '#e08b2a' },
            { label: 'P21 / Selesai', val: stats.p21, color: '#2ea043' },
            { label: 'SP3', val: stats.sp3, color: '#da3633' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#0d1117', border: '1px solid #1a2535', padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: color }} />
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '36px', fontWeight: 600, color, lineHeight: 1, marginBottom: '4px' }}>
                {loading ? '—' : val}
              </div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* KASUS TABLE */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #1a2535' }}>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', letterSpacing: '2px', color: '#6e7f8d', textTransform: 'uppercase' }}>◈ Daftar Kasus</span>
            <button
              onClick={() => router.push('/dashboard/kasus/new')}
              style={{ background: '#c8a84b', color: '#070a0f', border: 'none', padding: '8px 20px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', cursor: 'pointer' }}
            >
              + KASUS BARU
            </button>
          </div>

          <input
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2535', color: '#c9d1d9', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', padding: '10px 14px', outline: 'none', marginBottom: '12px' }}
            placeholder="Cari nomor LP, jenis pidana, atau nama tersangka..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#3a4a5a', letterSpacing: '2px' }}>
              ⏳ MEMUAT DATA...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#3a4a5a', letterSpacing: '1px', lineHeight: 2 }}>
              {kasus.length === 0 ? '— BELUM ADA KASUS TERDAFTAR —\nKlik "+ KASUS BARU" untuk mulai' : '— TIDAK ADA HASIL PENCARIAN —'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['No. LP', 'Jenis Pidana', 'Tersangka', 'Status', 'Threat', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1a2535' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(k => (
                  <tr key={k.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,168,75,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#c8a84b' }}>{k.nomor_lp}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)', fontSize: '14px' }}>{k.jenis_pidana}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)', fontSize: '14px', color: '#6e7f8d' }}>{k.tersangka?.[0]?.nama_lengkap ?? '—'}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)' }}>
                      <span style={{ background: `${STATUS_COLORS[k.status] ?? '#6e7f8d'}20`, border: `1px solid ${STATUS_COLORS[k.status] ?? '#6e7f8d'}50`, color: STATUS_COLORS[k.status] ?? '#6e7f8d', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', padding: '3px 8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {k.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)' }}>
                      <span style={{ background: `${THREAT_COLORS[k.threat_level]}25`, border: `1px solid ${THREAT_COLORS[k.threat_level]}60`, color: THREAT_COLORS[k.threat_level], fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', padding: '3px 8px' }}>
                        {THREAT_LABELS[k.threat_level]}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: '#6e7f8d' }}>
                      {new Date(k.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(26,37,53,0.5)' }}>
                      <button onClick={() => router.push(`/dashboard/kasus/${k.id}`)}
                        style={{ background: 'none', border: '1px solid #1a2535', color: '#c8a84b', padding: '4px 12px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}>
                        BUKA →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: '1px solid #1a2535', paddingTop: '16px', marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#3a4a5a', letterSpacing: '1px' }}>
            SRIKANDI v1.0 · TWIN ENGINE: DEEPSEEK + CLAUDE · SETIAP AKSES DICATAT
          </span>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#3a4a5a' }}>
            {user?.satuan}
          </span>
        </div>
      </div>
    </div>
  )
}
