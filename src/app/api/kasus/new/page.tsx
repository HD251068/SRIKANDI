// src/app/dashboard/kasus/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// TYPES
// ============================================================
interface KorbanItem { nama_lengkap: string; usia: string; kondisi: string; hubungan_tersangka: string }
interface BuktiItem { deskripsi: string; jenis: string; kekuatan: string; catatan: string }
interface SaksiItem { nama_lengkap: string; posisi: string; kredibilitas: string; isi_keterangan: string; potensi_konflik: string }
interface InkonsistensiItem { klaim_tersangka: string; fakta_digital: string; sumber_data: string; kekuatan_konfrontasi: string }

// ============================================================
// STYLES
// ============================================================
const S = {
  root: { minHeight: '100vh', background: '#070a0f', color: '#c9d1d9', fontFamily: "'Rajdhani', sans-serif" },
  header: { background: '#0d1117', borderBottom: '1px solid #1a2535', padding: '0 28px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 },
  body: { display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 56px)' },
  sidebar: { background: '#0d1117', borderRight: '1px solid #1a2535', padding: '20px 0' },
  content: { padding: '28px 32px', maxWidth: '900px' },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 20px', cursor: 'pointer',
    fontFamily: 'Share Tech Mono, monospace', fontSize: '11px',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
    color: active ? '#c8a84b' : '#6e7f8d',
    borderLeft: active ? '2px solid #c8a84b' : '2px solid transparent',
    background: active ? 'rgba(200,168,75,0.06)' : 'transparent',
    transition: 'all 0.15s',
  }),
  navDot: (done: boolean): React.CSSProperties => ({
    width: '8px', height: '8px', borderRadius: '50%',
    border: `1px solid ${done ? '#2ea043' : '#3a4a5a'}`,
    background: done ? '#2ea043' : 'transparent',
    flexShrink: 0,
  }),
  sectionTitle: { fontFamily: 'Oswald, sans-serif', fontSize: '18px', fontWeight: 600, letterSpacing: '2px', color: '#c8a84b', textTransform: 'uppercase' as const, marginBottom: '4px' },
  sectionSub: { fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d', letterSpacing: '1.5px', marginBottom: '24px' },
  label: { display: 'block', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', letterSpacing: '1.5px', color: '#6e7f8d', textTransform: 'uppercase' as const, marginBottom: '6px' },
  input: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2535', color: '#c9d1d9', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', padding: '9px 12px', outline: 'none' },
  textarea: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2535', color: '#c9d1d9', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', padding: '9px 12px', outline: 'none', resize: 'vertical' as const, minHeight: '80px' },
  select: { width: '100%', background: '#0d1117', border: '1px solid #1a2535', color: '#c9d1d9', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', padding: '9px 12px', outline: 'none' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { marginBottom: '16px' },
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2535', borderLeft: '2px solid #c8a84b', padding: '14px', marginBottom: '10px' },
  addBtn: { background: 'none', border: '1px dashed #1a2535', color: '#6e7f8d', padding: '8px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', cursor: 'pointer', width: '100%', textAlign: 'left' as const, letterSpacing: '1px', marginBottom: '18px' },
  removeBtn: { background: 'none', border: '1px solid #1a2535', color: '#6e7f8d', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', float: 'right' as const },
  navBtns: { display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #1a2535' },
  prevBtn: { background: 'none', border: '1px solid #1a2535', color: '#6e7f8d', padding: '10px 24px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '2px', cursor: 'pointer' },
  nextBtn: { background: '#c8a84b', border: 'none', color: '#070a0f', padding: '10px 32px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', cursor: 'pointer' },
  submitBtn: { background: '#2ea043', border: 'none', color: '#fff', padding: '12px 32px', fontFamily: 'Oswald, sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '2px', cursor: 'pointer' },
  pasalTag: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.3)', color: '#c8a84b', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', padding: '4px 10px', marginRight: '6px', marginBottom: '6px', cursor: 'pointer' },
}

// ============================================================
// TABS CONFIG
// ============================================================
const TABS = [
  { id: 0, label: 'Kejadian', icon: '📍' },
  { id: 1, label: 'Tersangka', icon: '🎯' },
  { id: 2, label: 'Bukti', icon: '🔬' },
  { id: 3, label: 'Saksi', icon: '👁' },
  { id: 4, label: 'Pasal', icon: '⚖' },
  { id: 5, label: 'Digital', icon: '💻' },
]

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function KasusBaru() {
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pasalInput, setPasalInput] = useState('')

  // Form state
  const [kejadian, setKejadian] = useState({ nomor_lp: '', nomor_spdp: '', jenis_pidana: '', tanggal_kejadian: '', tanggal_laporan: '', lokasi_kejadian: '', kronologi: '', kondisi_tkp: '', ada_cctv: '' })
  const [tersangka, setTersangka] = useState({ nama_lengkap: '', alias: '', nik: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'L', alamat: '', pekerjaan: '', pendidikan: 'SMA / SMK', agama: '', riwayat_kriminal: 'tidak ada', hubungan_korban: '', dugaan_motif: '', karakter_kepribadian: '', status_penahanan: 'dalam tahanan', didampingi_pengacara: false, nama_pengacara: '' })
  const [korban, setKorban] = useState<KorbanItem[]>([{ nama_lengkap: '', usia: '', kondisi: 'Selamat', hubungan_tersangka: '' }])
  const [bukti, setBukti] = useState<BuktiItem[]>([{ deskripsi: '', jenis: 'fisik', kekuatan: 'sedang', catatan: '' }])
  const [saksi, setSaksi] = useState<SaksiItem[]>([{ nama_lengkap: '', posisi: 'saksi mata', kredibilitas: 'sedang', isi_keterangan: '', potensi_konflik: '' }])
  const [pasal, setPasal] = useState<string[]>([])
  const [hukum, setHukum] = useState({ unsur_terpenuhi: '', unsur_belum_terpenuhi: '', catatan_khusus: '' })
  const [digital, setDigital] = useState({ device_tersangka: '', device_korban: '', chat_history: '', exif_data: '', browsing_history: '', device_findings: '', bts_data: '', imei_tracking: '', bts_finding: '', bank_data: '', ewallet_data: '', transfer_data: '', financial_findings: '', google_timeline: '', ojol_data: '', sosmed_data: '', digital_pending: '' })
  const [inkonsistensi, setInkonsistensi] = useState<InkonsistensiItem[]>([])
  const [meta, setMeta] = useState({ threat_level: 3, tujuan_interogasi: '', gaya_interogasi: 'PEACE' })

  // Completeness check per tab
  const done = [
    !!(kejadian.nomor_lp && kejadian.jenis_pidana && kejadian.kronologi),
    !!(tersangka.nama_lengkap && tersangka.dugaan_motif),
    bukti.some(b => b.deskripsi),
    saksi.some(s => s.nama_lengkap),
    pasal.length > 0,
    !!(digital.device_tersangka),
  ]

  function addPasal() {
    if (!pasalInput.trim()) return
    setPasal(p => [...p, pasalInput.trim()])
    setPasalInput('')
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')

    const user = JSON.parse(sessionStorage.getItem('srikandi_user') ?? '{}')

    const piipData = {
      kejadian,
      tersangka: { ...tersangka, didampingi_pengacara: tersangka.didampingi_pengacara },
      korban: korban.filter(k => k.nama_lengkap),
      alat_bukti: bukti.filter(b => b.deskripsi),
      saksi: saksi.filter(s => s.nama_lengkap),
      framework_hukum: { pasal_diduga: pasal, ...hukum },
      digital_forensik: digital,
      inkonsistensi: inkonsistensi.filter(i => i.klaim_tersangka),
      meta,
    }

    try {
      const res = await fetch('/api/kasus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piipData, penyidik_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan')
      router.push(`/dashboard/kasus/${data.kasus_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#6e7f8d', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', letterSpacing: '1px' }}>
            ← DASHBOARD
          </button>
          <span style={{ color: '#1a2535' }}>|</span>
          <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '3px', color: '#c8a84b' }}>KASUS BARU</span>
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#6e7f8d' }}>
          {done.filter(Boolean).length}/{TABS.length} MODUL LENGKAP
        </div>
      </div>

      <div style={S.body}>
        {/* SIDEBAR NAV */}
        <div style={S.sidebar}>
          <div style={{ padding: '12px 20px', fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#3a4a5a', letterSpacing: '2px', marginBottom: '8px' }}>
            MODUL INPUT
          </div>
          {TABS.map(t => (
            <div key={t.id} style={S.navItem(tab === t.id)} onClick={() => setTab(t.id)}>
              <div style={S.navDot(done[t.id])} />
              <span>{t.icon} {t.label}</span>
            </div>
          ))}

          <div style={{ margin: '20px', borderTop: '1px solid #1a2535', paddingTop: '16px' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#3a4a5a', letterSpacing: '2px', marginBottom: '12px' }}>THREAT LEVEL</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1,2,3,4,5].map(l => {
                const colors = ['#2ea043','#b5a229','#e08b2a','#e05c2a','#da3633']
                const active = meta.threat_level === l
                return (
                  <button key={l} onClick={() => setMeta(m => ({...m, threat_level: l}))}
                    style={{ flex: 1, background: active ? `${colors[l-1]}25` : 'none', border: `1px solid ${active ? colors[l-1] : '#1a2535'}`, color: active ? colors[l-1] : '#3a4a5a', padding: '5px 2px', fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', cursor: 'pointer' }}>
                    L{l}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ margin: '0 20px' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#3a4a5a', letterSpacing: '2px', marginBottom: '8px' }}>GAYA INTEROGASI</div>
            <select value={meta.gaya_interogasi} onChange={e => setMeta(m => ({...m, gaya_interogasi: e.target.value}))} style={{ ...S.select, fontSize: '12px' }}>
              {['PEACE','Reid','SUE','Cognitive','Hybrid'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* CONTENT */}
        <div style={S.content}>

          {/* TAB 0: KEJADIAN */}
          {tab === 0 && (
            <div>
              <div style={S.sectionTitle}>Profil Kejadian</div>
              <div style={S.sectionSub}>KRONOLOGI & KONTEKS INSIDEN</div>
              <div style={S.row2}>
                <div>
                  <label style={S.label}>Nomor LP *</label>
                  <input style={S.input} placeholder="LP/XXX/2025/..." value={kejadian.nomor_lp} onChange={e => setKejadian(k => ({...k, nomor_lp: e.target.value}))} />
                </div>
                <div>
                  <label style={S.label}>Jenis Tindak Pidana *</label>
                  <select style={S.select} value={kejadian.jenis_pidana} onChange={e => setKejadian(k => ({...k, jenis_pidana: e.target.value}))}>
                    <option value="">-- Pilih --</option>
                    {['Pembunuhan','Penganiayaan','Pencurian / Perampokan','Penipuan / Penggelapan','Korupsi','Narkotika','KDRT','Pencabulan / Pelecehan Seksual','Terorisme','Siber / Kejahatan Digital','Lainnya'].map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.row2}>
                <div>
                  <label style={S.label}>Tanggal & Waktu Kejadian</label>
                  <input type="datetime-local" style={S.input} value={kejadian.tanggal_kejadian} onChange={e => setKejadian(k => ({...k, tanggal_kejadian: e.target.value}))} />
                </div>
                <div>
                  <label style={S.label}>Tanggal Laporan</label>
                  <input type="date" style={S.input} value={kejadian.tanggal_laporan} onChange={e => setKejadian(k => ({...k, tanggal_laporan: e.target.value}))} />
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Lokasi Kejadian</label>
                <input style={S.input} placeholder="Alamat lengkap..." value={kejadian.lokasi_kejadian} onChange={e => setKejadian(k => ({...k, lokasi_kejadian: e.target.value}))} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Kronologi Kejadian *</label>
                <textarea style={S.textarea} rows={5} placeholder="Urutan kejadian berdasarkan laporan awal..." value={kejadian.kronologi} onChange={e => setKejadian(k => ({...k, kronologi: e.target.value}))} />
              </div>
              <div style={S.row2}>
                <div>
                  <label style={S.label}>Kondisi TKP</label>
                  <select style={S.select} value={kejadian.kondisi_tkp} onChange={e => setKejadian(k => ({...k, kondisi_tkp: e.target.value}))}>
                    <option value="">-- Pilih --</option>
                    {['Tertutup / Indoor','Terbuka / Outdoor','Publik','Privat','Sudah terkontaminasi','Masih steril'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Ada CCTV / Rekaman?</label>
                  <select style={S.select} value={kejadian.ada_cctv} onChange={e => setKejadian(k => ({...k, ada_cctv: e.target.value}))}>
                    <option value="">-- Pilih --</option>
                    {['Ya, sudah diamankan','Ya, belum diamankan','Tidak ada','Tidak diketahui'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Tujuan Interogasi</label>
                <textarea style={S.textarea} rows={3} placeholder="Apa yang harus dicapai dari sesi interogasi ini?" value={meta.tujuan_interogasi} onChange={e => setMeta(m => ({...m, tujuan_interogasi: e.target.value}))} />
              </div>

              {/* KORBAN */}
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#c8a84b', letterSpacing: '1px', marginBottom: '10px', marginTop: '8px' }}>
                PROFIL KORBAN
              </div>
              {korban.map((k, i) => (
                <div key={i} style={S.card}>
                  <button style={S.removeBtn} onClick={() => setKorban(arr => arr.filter((_, j) => j !== i))}>✕</button>
                  <div style={S.row3}>
                    <div><label style={S.label}>Nama</label><input style={S.input} value={k.nama_lengkap} onChange={e => setKorban(arr => arr.map((x, j) => j === i ? {...x, nama_lengkap: e.target.value} : x))} /></div>
                    <div><label style={S.label}>Usia</label><input type="number" style={S.input} value={k.usia} onChange={e => setKorban(arr => arr.map((x, j) => j === i ? {...x, usia: e.target.value} : x))} /></div>
                    <div><label style={S.label}>Kondisi</label>
                      <select style={S.select} value={k.kondisi} onChange={e => setKorban(arr => arr.map((x, j) => j === i ? {...x, kondisi: e.target.value} : x))}>
                        {['Meninggal','Luka berat','Luka ringan','Selamat'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label style={S.label}>Hubungan dengan Tersangka</label><input style={S.input} value={k.hubungan_tersangka} onChange={e => setKorban(arr => arr.map((x, j) => j === i ? {...x, hubungan_tersangka: e.target.value} : x))} /></div>
                </div>
              ))}
              <button style={S.addBtn} onClick={() => setKorban(arr => [...arr, { nama_lengkap: '', usia: '', kondisi: 'Selamat', hubungan_tersangka: '' }])}>+ TAMBAH KORBAN</button>
            </div>
          )}

          {/* TAB 1: TERSANGKA */}
          {tab === 1 && (
            <div>
              <div style={S.sectionTitle}>Profil Tersangka</div>
              <div style={S.sectionSub}>DATA & LATAR BELAKANG SUBJEK INTEROGASI</div>
              <div style={S.row2}>
                <div><label style={S.label}>Nama Lengkap *</label><input style={S.input} value={tersangka.nama_lengkap} onChange={e => setTersangka(t => ({...t, nama_lengkap: e.target.value}))} /></div>
                <div><label style={S.label}>Alias</label><input style={S.input} value={tersangka.alias} onChange={e => setTersangka(t => ({...t, alias: e.target.value}))} /></div>
              </div>
              <div style={S.row3}>
                <div><label style={S.label}>NIK</label><input style={S.input} value={tersangka.nik} onChange={e => setTersangka(t => ({...t, nik: e.target.value}))} /></div>
                <div><label style={S.label}>Tempat Lahir</label><input style={S.input} value={tersangka.tempat_lahir} onChange={e => setTersangka(t => ({...t, tempat_lahir: e.target.value}))} /></div>
                <div><label style={S.label}>Tanggal Lahir</label><input type="date" style={S.input} value={tersangka.tanggal_lahir} onChange={e => setTersangka(t => ({...t, tanggal_lahir: e.target.value}))} /></div>
              </div>
              <div style={S.row3}>
                <div><label style={S.label}>Jenis Kelamin</label>
                  <select style={S.select} value={tersangka.jenis_kelamin} onChange={e => setTersangka(t => ({...t, jenis_kelamin: e.target.value}))}>
                    <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                  </select>
                </div>
                <div><label style={S.label}>Pekerjaan</label><input style={S.input} value={tersangka.pekerjaan} onChange={e => setTersangka(t => ({...t, pekerjaan: e.target.value}))} /></div>
                <div><label style={S.label}>Pendidikan</label>
                  <select style={S.select} value={tersangka.pendidikan} onChange={e => setTersangka(t => ({...t, pendidikan: e.target.value}))}>
                    {['SD','SMP','SMA / SMK','D3','S1','S2/S3','Tidak sekolah'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.field}><label style={S.label}>Alamat</label><input style={S.input} value={tersangka.alamat} onChange={e => setTersangka(t => ({...t, alamat: e.target.value}))} /></div>
              <div style={S.row2}>
                <div><label style={S.label}>Riwayat Kriminal</label>
                  <select style={S.select} value={tersangka.riwayat_kriminal} onChange={e => setTersangka(t => ({...t, riwayat_kriminal: e.target.value}))}>
                    {['tidak ada','Pernah ditangkap, tidak diadili','Pernah diadili, bebas','Pernah dipenjara','Residivis'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Hubungan dengan Korban</label><input style={S.input} value={tersangka.hubungan_korban} onChange={e => setTersangka(t => ({...t, hubungan_korban: e.target.value}))} /></div>
              </div>
              <div style={S.field}><label style={S.label}>Dugaan Motif *</label><textarea style={S.textarea} rows={3} value={tersangka.dugaan_motif} onChange={e => setTersangka(t => ({...t, dugaan_motif: e.target.value}))} /></div>
              <div style={S.field}><label style={S.label}>Karakter / Kepribadian</label><textarea style={S.textarea} rows={3} placeholder="Temperamen, cara bicara, kondisi mental yang diketahui..." value={tersangka.karakter_kepribadian} onChange={e => setTersangka(t => ({...t, karakter_kepribadian: e.target.value}))} /></div>
              <div style={S.row2}>
                <div><label style={S.label}>Status Penahanan</label>
                  <select style={S.select} value={tersangka.status_penahanan} onChange={e => setTersangka(t => ({...t, status_penahanan: e.target.value}))}>
                    {['dalam tahanan','Bebas dengan jaminan','DPO'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Didampingi Pengacara?</label>
                  <select style={S.select} value={tersangka.didampingi_pengacara ? 'ya' : 'tidak'} onChange={e => setTersangka(t => ({...t, didampingi_pengacara: e.target.value === 'ya'}))}>
                    <option value="tidak">Tidak</option><option value="ya">Ya</option>
                  </select>
                </div>
              </div>
              {tersangka.didampingi_pengacara && (
                <div style={S.field}><label style={S.label}>Nama Pengacara</label><input style={S.input} value={tersangka.nama_pengacara} onChange={e => setTersangka(t => ({...t, nama_pengacara: e.target.value}))} /></div>
              )}
            </div>
          )}

          {/* TAB 2: BUKTI */}
          {tab === 2 && (
            <div>
              <div style={S.sectionTitle}>Matriks Alat Bukti</div>
              <div style={S.sectionSub}>INVENTARISASI & KEKUATAN BUKTI</div>
              {bukti.map((b, i) => (
                <div key={i} style={S.card}>
                  <button style={S.removeBtn} onClick={() => setBukti(arr => arr.filter((_, j) => j !== i))}>✕</button>
                  <div style={S.row3}>
                    <div style={{ gridColumn: '1 / 3' }}><label style={S.label}>Deskripsi Barang Bukti *</label><input style={S.input} value={b.deskripsi} onChange={e => setBukti(arr => arr.map((x, j) => j === i ? {...x, deskripsi: e.target.value} : x))} /></div>
                    <div><label style={S.label}>Jenis</label>
                      <select style={S.select} value={b.jenis} onChange={e => setBukti(arr => arr.map((x, j) => j === i ? {...x, jenis: e.target.value} : x))}>
                        {['fisik','digital','forensik','keterangan','dokumen'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={S.row2}>
                    <div><label style={S.label}>Kekuatan</label>
                      <select style={S.select} value={b.kekuatan} onChange={e => setBukti(arr => arr.map((x, j) => j === i ? {...x, kekuatan: e.target.value} : x))}>
                        {['kuat','sedang','lemah','perlu verifikasi'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label style={S.label}>Catatan / Kelemahan</label><input style={S.input} value={b.catatan} onChange={e => setBukti(arr => arr.map((x, j) => j === i ? {...x, catatan: e.target.value} : x))} /></div>
                  </div>
                </div>
              ))}
              <button style={S.addBtn} onClick={() => setBukti(arr => [...arr, { deskripsi: '', jenis: 'fisik', kekuatan: 'sedang', catatan: '' }])}>+ TAMBAH ALAT BUKTI</button>
            </div>
          )}

          {/* TAB 3: SAKSI */}
          {tab === 3 && (
            <div>
              <div style={S.sectionTitle}>Peta Saksi</div>
              <div style={S.sectionSub}>JARINGAN KETERANGAN & POTENSI KONFLIK</div>
              {saksi.map((s, i) => (
                <div key={i} style={S.card}>
                  <button style={S.removeBtn} onClick={() => setSaksi(arr => arr.filter((_, j) => j !== i))}>✕</button>
                  <div style={S.row3}>
                    <div><label style={S.label}>Nama Saksi *</label><input style={S.input} value={s.nama_lengkap} onChange={e => setSaksi(arr => arr.map((x, j) => j === i ? {...x, nama_lengkap: e.target.value} : x))} /></div>
                    <div><label style={S.label}>Posisi</label>
                      <select style={S.select} value={s.posisi} onChange={e => setSaksi(arr => arr.map((x, j) => j === i ? {...x, posisi: e.target.value} : x))}>
                        {['saksi mata','saksi alibi','saksi ahli','saksi a de charge'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label style={S.label}>Kredibilitas</label>
                      <select style={S.select} value={s.kredibilitas} onChange={e => setSaksi(arr => arr.map((x, j) => j === i ? {...x, kredibilitas: e.target.value} : x))}>
                        {['tinggi','sedang','meragukan'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={S.field}><label style={S.label}>Isi Keterangan</label><textarea style={S.textarea} rows={2} value={s.isi_keterangan} onChange={e => setSaksi(arr => arr.map((x, j) => j === i ? {...x, isi_keterangan: e.target.value} : x))} /></div>
                  <div><label style={S.label}>Potensi Konflik</label><input style={S.input} value={s.potensi_konflik} onChange={e => setSaksi(arr => arr.map((x, j) => j === i ? {...x, potensi_konflik: e.target.value} : x))} /></div>
                </div>
              ))}
              <button style={S.addBtn} onClick={() => setSaksi(arr => [...arr, { nama_lengkap: '', posisi: 'saksi mata', kredibilitas: 'sedang', isi_keterangan: '', potensi_konflik: '' }])}>+ TAMBAH SAKSI</button>
            </div>
          )}

          {/* TAB 4: PASAL */}
          {tab === 4 && (
            <div>
              <div style={S.sectionTitle}>Framework Hukum</div>
              <div style={S.sectionSub}>DUGAAN PASAL & UNSUR DELIK</div>
              <div style={S.field}>
                <label style={S.label}>Tambah Dugaan Pasal *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input style={{ ...S.input, flex: 1 }} placeholder="Pasal 338 KUHP tentang Pembunuhan..." value={pasalInput} onChange={e => setPasalInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPasal()} />
                  <button onClick={addPasal} style={{ background: '#c8a84b', border: 'none', color: '#070a0f', padding: '9px 16px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px' }}>+</button>
                </div>
                <div style={{ marginTop: '10px' }}>
                  {pasal.map((p, i) => (
                    <span key={i} style={S.pasalTag} onClick={() => setPasal(arr => arr.filter((_, j) => j !== i))}>
                      {p} <span style={{ opacity: 0.5, fontSize: '10px' }}>✕</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={S.field}><label style={S.label}>Unsur Delik yang Sudah Terpenuhi</label><textarea style={S.textarea} rows={4} value={hukum.unsur_terpenuhi} onChange={e => setHukum(h => ({...h, unsur_terpenuhi: e.target.value}))} /></div>
              <div style={S.field}><label style={S.label}>Unsur Delik yang Masih Perlu Digali *</label><textarea style={S.textarea} rows={4} placeholder="Ini yang akan menjadi agenda interogasi..." value={hukum.unsur_belum_terpenuhi} onChange={e => setHukum(h => ({...h, unsur_belum_terpenuhi: e.target.value}))} /></div>
              <div style={S.field}><label style={S.label}>Catatan Khusus</label><textarea style={S.textarea} rows={3} value={hukum.catatan_khusus} onChange={e => setHukum(h => ({...h, catatan_khusus: e.target.value}))} /></div>
            </div>
          )}

          {/* TAB 5: DIGITAL */}
          {tab === 5 && (
            <div>
              <div style={S.sectionTitle}>Digital Forensik</div>
              <div style={S.sectionSub}>JEJAK DIGITAL — DIPEROLEH SECARA LEGAL</div>

              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#c8a84b', letterSpacing: '1px', padding: '6px 10px', background: 'rgba(200,168,75,0.06)', borderLeft: '2px solid #c8a84b', marginBottom: '12px' }}>📱 A. DATA PERANGKAT</div>
              <div style={S.row2}>
                <div><label style={S.label}>Perangkat Tersangka Disita? *</label>
                  <select style={S.select} value={digital.device_tersangka} onChange={e => setDigital(d => ({...d, device_tersangka: e.target.value}))}>
                    <option value="">-- Pilih --</option>
                    {['Ya — sudah dianalisis','Ya — belum dianalisis','Tidak ada / tidak ditemukan','Terhapus / dirusak'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Perangkat Korban Disita?</label>
                  <select style={S.select} value={digital.device_korban} onChange={e => setDigital(d => ({...d, device_korban: e.target.value}))}>
                    <option value="">-- Pilih --</option>
                    {['Ya — sudah dianalisis','Ya — belum dianalisis','Tidak ada','Tidak relevan'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.row3}>
                <div><label style={S.label}>Chat / WA / Telegram</label>
                  <select style={S.select} value={digital.chat_history} onChange={e => setDigital(d => ({...d, chat_history: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Ditemukan — mendukung dakwaan','Ditemukan — netral','Terhapus — perlu recovery','Tidak ada'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Foto & EXIF</label>
                  <select style={S.select} value={digital.exif_data} onChange={e => setDigital(d => ({...d, exif_data: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Ada — lokasi terkonfirmasi','Ada — metadata terhapus','Tidak ada','Sedang diproses'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Riwayat Browsing</label>
                  <select style={S.select} value={digital.browsing_history} onChange={e => setDigital(d => ({...d, browsing_history: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Ada — relevan','Ada — tidak relevan','Terhapus','Belum diekstrak'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.field}><label style={S.label}>Temuan Kunci dari Device</label><textarea style={S.textarea} rows={2} value={digital.device_findings} onChange={e => setDigital(d => ({...d, device_findings: e.target.value}))} /></div>

              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#c8a84b', letterSpacing: '1px', padding: '6px 10px', background: 'rgba(200,168,75,0.06)', borderLeft: '2px solid #c8a84b', marginBottom: '12px', marginTop: '8px' }}>📡 B. JARINGAN & BTS</div>
              <div style={S.row2}>
                <div><label style={S.label}>Data BTS / Tower</label>
                  <select style={S.select} value={digital.bts_data} onChange={e => setDigital(d => ({...d, bts_data: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Sudah diminta — mendukung timeline','Sudah diminta — kontradiksi alibi','Belum diminta ke operator','Tidak relevan'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>IMEI Tracking</label>
                  <select style={S.select} value={digital.imei_tracking} onChange={e => setDigital(d => ({...d, imei_tracking: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Dilacak — konsisten','Dilacak — ada anomali','Belum dilacak','SIM dibuang / ganti HP'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.field}><label style={S.label}>BTS vs Alibi Tersangka</label><textarea style={S.textarea} rows={2} value={digital.bts_finding} onChange={e => setDigital(d => ({...d, bts_finding: e.target.value}))} /></div>

              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#c8a84b', letterSpacing: '1px', padding: '6px 10px', background: 'rgba(200,168,75,0.06)', borderLeft: '2px solid #c8a84b', marginBottom: '12px', marginTop: '8px' }}>💰 C. FINANSIAL DIGITAL</div>
              <div style={S.row3}>
                <div><label style={S.label}>Rekening Bank</label>
                  <select style={S.select} value={digital.bank_data} onChange={e => setDigital(d => ({...d, bank_data: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Ada transaksi mencurigakan','Normal','Belum diminta','Tidak relevan'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>E-Wallet</label>
                  <select style={S.select} value={digital.ewallet_data} onChange={e => setDigital(d => ({...d, ewallet_data: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Ada transaksi relevan','Bersih','Belum diperiksa','Tidak digunakan'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Google Maps / Ojol</label>
                  <select style={S.select} value={digital.google_timeline} onChange={e => setDigital(d => ({...d, google_timeline: e.target.value}))}>
                    <option value="">-- Status --</option>
                    {['Diakses — rute ke TKP terkonfirmasi','Diakses — tidak ada data','Belum diakses','History dimatikan'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* INKONSISTENSI */}
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#e05c2a', letterSpacing: '1px', padding: '6px 10px', background: 'rgba(224,92,42,0.06)', borderLeft: '2px solid #e05c2a', marginBottom: '12px', marginTop: '8px' }}>⚡ D. INKONSISTENSI DIGITAL vs KETERANGAN</div>
              {inkonsistensi.map((inc, i) => (
                <div key={i} style={{ ...S.card, borderLeftColor: '#e05c2a' }}>
                  <button style={S.removeBtn} onClick={() => setInkonsistensi(arr => arr.filter((_, j) => j !== i))}>✕</button>
                  <div style={S.row2}>
                    <div><label style={S.label}>Klaim Tersangka</label><input style={S.input} value={inc.klaim_tersangka} onChange={e => setInkonsistensi(arr => arr.map((x, j) => j === i ? {...x, klaim_tersangka: e.target.value} : x))} /></div>
                    <div><label style={S.label}>Fakta Digital</label><input style={S.input} value={inc.fakta_digital} onChange={e => setInkonsistensi(arr => arr.map((x, j) => j === i ? {...x, fakta_digital: e.target.value} : x))} /></div>
                  </div>
                  <div style={S.row2}>
                    <div><label style={S.label}>Sumber Data</label><input style={S.input} placeholder="BTS / WhatsApp / CCTV..." value={inc.sumber_data} onChange={e => setInkonsistensi(arr => arr.map((x, j) => j === i ? {...x, sumber_data: e.target.value} : x))} /></div>
                    <div><label style={S.label}>Kekuatan Konfrontasi</label>
                      <select style={S.select} value={inc.kekuatan_konfrontasi} onChange={e => setInkonsistensi(arr => arr.map((x, j) => j === i ? {...x, kekuatan_konfrontasi: e.target.value} : x))}>
                        {['sangat kuat','kuat','sedang','perlu verifikasi'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button style={{ ...S.addBtn, borderColor: '#e05c2a', color: '#e05c2a' }} onClick={() => setInkonsistensi(arr => [...arr, { klaim_tersangka: '', fakta_digital: '', sumber_data: '', kekuatan_konfrontasi: 'kuat' }])}>+ TAMBAH INKONSISTENSI</button>

              <div style={S.field}><label style={S.label}>Bukti Digital yang Masih Perlu Diminta</label><textarea style={S.textarea} rows={3} value={digital.digital_pending} onChange={e => setDigital(d => ({...d, digital_pending: e.target.value}))} /></div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div style={{ background: 'rgba(218,54,51,0.1)', border: '1px solid rgba(218,54,51,0.3)', color: '#da3633', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', padding: '10px 14px', marginTop: '16px', letterSpacing: '0.5px' }}>
              ✕ {error}
            </div>
          )}

          {/* NAV BUTTONS */}
          <div style={S.navBtns}>
            {tab > 0 && <button style={S.prevBtn} onClick={() => setTab(t => t - 1)}>← SEBELUMNYA</button>}
            {tab < 5 && <button style={S.nextBtn} onClick={() => setTab(t => t + 1)}>BERIKUTNYA →</button>}
            {tab === 5 && (
              <button style={S.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ MENYIMPAN...' : '⚡ SIMPAN KASUS'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
