// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Login gagal')
        return
      }

      // Simpan session token di cookie via Supabase client
      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; secure; samesite=strict`
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; secure; samesite=strict`
      }

      // Simpan profil di sessionStorage untuk akses cepat
      sessionStorage.setItem('srikandi_user', JSON.stringify(data.user))

      router.push('/dashboard')

    } catch {
      setError('Koneksi gagal. Periksa jaringan Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px',
            border: '2px solid #c8a84b',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: '4px',
              border: '1px solid #c8a84b', opacity: 0.4,
            }} />
            <span style={{ fontSize: '24px' }}>⚑</span>
          </div>
          <h1 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: '28px', fontWeight: 600,
            letterSpacing: '4px', color: '#c8a84b',
            textTransform: 'uppercase',
          }}>SRIKANDI</h1>
          <p style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#6e7f8d',
            letterSpacing: '2px', marginTop: '4px',
          }}>SISTEM RISET INTELIJEN KRIMINAL ANDALAN INDONESIA</p>
        </div>

        {/* Form */}
        <div style={{
          background: '#0d1117',
          border: '1px solid #1a2535',
          padding: '32px',
        }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#6e7f8d',
            letterSpacing: '2px', marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '1px solid #1a2535',
          }}>
            ◈ AUTENTIKASI PENYIDIK
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '10px', letterSpacing: '1.5px',
                color: '#6e7f8d', textTransform: 'uppercase',
                marginBottom: '6px',
              }}>Email / NRP</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="penyidik@polri.go.id"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1a2535',
                  color: '#c9d1d9',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '15px',
                  padding: '10px 12px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#c8a84b'}
                onBlur={e => e.target.style.borderColor = '#1a2535'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '10px', letterSpacing: '1.5px',
                color: '#6e7f8d', textTransform: 'uppercase',
                marginBottom: '6px',
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1a2535',
                  color: '#c9d1d9',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '15px',
                  padding: '10px 12px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#c8a84b'}
                onBlur={e => e.target.style.borderColor = '#1a2535'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(218,54,51,0.1)',
                border: '1px solid rgba(218,54,51,0.3)',
                color: '#da3633',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '11px',
                padding: '10px 12px',
                marginBottom: '16px',
                letterSpacing: '0.5px',
              }}>
                ✕ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#1a2535' : '#c8a84b',
                color: loading ? '#6e7f8d' : '#070a0f',
                border: 'none',
                padding: '13px',
                fontFamily: 'Oswald, sans-serif',
                fontSize: '15px', fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳ MEMVERIFIKASI...' : '⚡ MASUK SISTEM'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '9px', color: '#3a4a5a',
          letterSpacing: '1px',
        }}>
          SISTEM INI HANYA UNTUK PERSONIL POLRI YANG BERWENANG<br />
          SETIAP AKSES DICATAT DAN DIAUDIT
        </div>
      </div>
    </div>
  )
}
