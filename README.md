# SRIKANDI
# PIIP System — MVP
## Pre-Interrogation Intelligence Package
### Stack: Next.js + Supabase + Vercel + Claude AI

---

## 📁 Struktur Project

```
piip-mvp/
├── supabase/
│   ├── schema.sql          ← Database schema (jalankan di Supabase SQL Editor)
│   └── seed.sql            ← Data testing
│
├── src/
│   ├── app/                ← Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx            ← Dashboard utama
│   │   │   ├── kasus/
│   │   │   │   ├── page.tsx        ← List semua kasus
  │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx    ← Detail kasus
│   │   │   │   │   ├── piip/       ← Input PIIP 6 modul
│   │   │   │   │   ├── interogasi/ ← Sesi interogasi + STT
│   │   │   │   │   └── bap/        ← Generate BAP
│   │   │   │   └── new/
│   │   │   │       └── page.tsx    ← Buat kasus baru
│   │   └── api/
│   │       ├── generate-piip/      ← Claude API integration
│   │       ├── generate-bap/       ← BAP generator
│   │       └── stt/                ← Speech-to-text endpoint
│   │
│   ├── components/
│   │   ├── piip/                   ← 6 modul input form
│   │   ├── interogasi/             ← Sesi interogasi UI
│   │   ├── dashboard/              ← Widgets & charts
│   │   └── ui/                     ← Shared components
│   │
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client
│   │   ├── claude.ts               ← Anthropic client
│   │   └── types.ts                ← TypeScript types
│   │
│   └── styles/
│       └── globals.css
│
├── .env.local                      ← Environment variables (JANGAN di-commit!)
├── .env.example                    ← Template env vars
├── package.json
└── README.md
```

---

## 🚀 Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/[username]/piip-mvp.git
cd piip-mvp
npm install
```

### 2. Setup Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka SQL Editor
3. Copy & paste isi `supabase/schema.sql`
4. Jalankan (Run)

### 3. Environment Variables
Buat file `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Anthropic
ANTHROPIC_API_KEY=[api-key]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development
```bash
npm run dev
```

### 5. Deploy ke Vercel
```bash
npx vercel
# Ikuti instruksi, tambahkan env vars di Vercel dashboard
```

---

## 📊 Database Tables

| Tabel | Fungsi |
|-------|--------|
| `penyidik` | User / akun penyidik |
| `kasus` | Master data kasus |
| `tersangka` | Profil tersangka |
| `korban` | Data korban |
| `alat_bukti` | Inventaris barang bukti |
| `saksi` | Data & keterangan saksi |
| `framework_hukum` | Pasal & unsur delik |
| `digital_forensik` | Jejak digital |
| `inkonsistensi_digital` | Konfrontasi digital vs klaim |
| `sesi_interogasi` | Session tracking |
| `transcript_interogasi` | STT output + koreksi |
| `intelligence_package` | Output analisis Claude |
| `bap_draft` | Draft BAP generated |
| `audit_log` | Chain of custody digital |

---

## 💰 Estimasi Biaya MVP (Per Bulan)

| Service | Free Tier | Estimasi Pilot |
|---------|-----------|----------------|
| Vercel | 100GB bandwidth | Cukup |
| Supabase | 500MB DB, 2GB storage | Cukup untuk 1 Polsek |
| Anthropic API | Pay per use | ~Rp 500rb/bulan (50 kasus) |
| **Total** | | **< Rp 500rb/bulan** |

---

## 🗓 Roadmap MVP

- [x] Database Schema
- [ ] Auth (Login penyidik)
- [ ] PIIP Input Form (6 modul)
- [ ] Claude API Integration
- [ ] Save & Retrieve Kasus
- [ ] Generate Intelligence Package
- [ ] Export BAP PDF
- [ ] STT Integration
- [ ] Dashboard Supervisor
- [ ] Pilot Deploy (1 Polsek)
