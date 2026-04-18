# SRIKANDI
## Sistem Riset Intelijen Kriminal Andalan Indonesia
### Stack: Next.js 15 · Supabase · Vercel · Claude AI · DeepSeek

---

## 📁 Struktur Lengkap Repository

```
SRIKANDI/                               ← Root repo
│
├── .env.example                        ← Template env vars (commit)
├── .env.local                          ← Env vars aktif (JANGAN commit)
├── .gitignore
├── next.config.js                      ← Next.js config + security headers
├── package.json                        ← Dependencies
├── postcss.config.js                   ← PostCSS untuk Tailwind
├── tailwind.config.ts                  ← Design system SRIKANDI
├── tsconfig.json                       ← TypeScript config
│
├── supabase/
│   └── schema.sql                      ← 14 tabel + RLS + triggers + seed
│
└── src/
    ├── middleware.ts                   ← Route protection (auth guard)
    │
    ├── lib/                            ← Core library — jantung sistem
    │   ├── types.ts                    ← Semua TypeScript types
    │   ├── supabase.ts                 ← Database client + semua fungsi DB
    │   ├── deepseek.ts                 ← Analytical engine (Twin Engine #1)
    │   └── claude.ts                   ← Orchestrator + language (Twin Engine #2)
    │
    └── app/                            ← Next.js App Router
        ├── globals.css                 ← Design system + scanline aesthetic
        ├── layout.tsx                  ← Root layout
        ├── page.tsx                    ← Root → redirect /login
        │
        ├── login/
        │   └── page.tsx                ← Halaman login penyidik
        │
        ├── dashboard/
        │   └── page.tsx                ← Dashboard utama (WIP)
        │
        └── api/                        ← API Routes (Next.js Route Handlers)
            ├── auth/
            │   └── route.ts            ← POST login/logout · GET /me
            ├── kasus/
            │   └── route.ts            ← GET list/detail · POST create · PATCH update
            ├── generate-piip/
            │   └── route.ts            ← POST twin engine → intelligence package
            ├── interogasi/
            │   └── route.ts            ← POST real-time analysis · PUT buat sesi
            └── bap/
                └── route.ts            ← POST generate BAP · GET list BAP
```

---

## 📐 Konvensi Header File

**Setiap file wajib mencantumkan path-nya di baris pertama** sehingga saat membaca file tidak perlu kembali ke README.

Format per jenis file:
```ts
// src/lib/claude.ts                    ← .ts / .tsx / .js
```
```css
/* src/app/globals.css */              ← .css
```
```js
// next.config.js                      ← root-level .js
```

File lib yang memiliki header panjang menggunakan baris kedua:
```ts
// ============================================================
// PATH: src/lib/claude.ts
// SRIKANDI — Twin Engine Orchestrator
// ============================================================
```

---

## 🏗 Arsitektur Twin Engine

```
Input Data Kasus (6 modul PIIP)
          │
          ▼
┌─────────────────────┐
│   DeepSeek Reasoner │  ← Analisis logika, inkonsistensi,
│   (deepseek.ts)     │    korelasi bukti, legal mapping,
│                     │    confidence scoring per temuan
└──────────┬──────────┘
           │ Structured JSON analysis
           ▼
┌─────────────────────┐
│   Claude Sonnet     │  ← Bahasa & strategi: narasi intelijen,
│   (claude.ts)       │    profil psikologis, jebakan logika,
│   Orchestrator      │    rekomendasi taktik interogasi
└──────────┬──────────┘
           │
           ▼
  SRIKANDI Intelligence Package
  (9 modul output siap pakai)
```

**Prinsip Zero Fracture:**
Claude merancang format output DeepSeek → DeepSeek bekerja dalam "rel" Claude → Output masuk ke Claude dalam format yang sudah diekspektasikan → Tidak ada ambiguitas antar engine.

**Efisiensi Real-Time Interogasi:**
DeepSeek menganalisis setiap kalimat tersangka (murah & cepat). Claude hanya dipanggil jika DeepSeek mendeteksi signal kuat (confidence > 0.6). Penyidik tidak merasakan delay.

---

## 🗄 Database (14 Tabel Supabase)

| Tabel | Fungsi |
|-------|--------|
| `penyidik` | User / akun penyidik |
| `kasus` | Master data kasus |
| `tersangka` | Profil tersangka |
| `korban` | Data korban |
| `alat_bukti` | Inventaris barang bukti |
| `saksi` | Data & keterangan saksi |
| `framework_hukum` | Pasal & unsur delik |
| `digital_forensik` | Jejak digital 5 kategori |
| `inkonsistensi_digital` | Konfrontasi digital vs klaim |
| `sesi_interogasi` | Session tracking |
| `transcript_interogasi` | STT output + koreksi + WER |
| `intelligence_package` | Output analisis Claude |
| `bap_draft` | Draft BAP generated |
| `audit_log` | Chain of custody digital |

---

## 🚀 Setup

### 1. Clone & Install
```bash
git clone https://github.com/[username]/SRIKANDI.git
cd SRIKANDI
npm install
```

### 2. Setup Supabase
1. Buat project di [supabase.com](https://supabase.com)
2. SQL Editor → paste `supabase/schema.sql` → Run

### 3. Environment Variables
Buat `.env.local` dari template `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
NEXT_PUBLIC_USE_TWIN_ENGINE=true
```

### 4. Development
```bash
npm run dev        # http://localhost:3000
npm run type-check # TypeScript check
npm run build      # Production build
```

### 5. Deploy Vercel
```bash
npx vercel
# Tambah semua env vars di Vercel Dashboard → Settings → Environment Variables
```

---

## 💰 Estimasi Biaya Operasional

| Komponen | Biaya |
|----------|-------|
| Vercel (hosting) | Free tier — cukup untuk pilot |
| Supabase (database) | Free tier — cukup untuk 1 Polsek |
| Anthropic Claude API | ~Rp 8.000/kasus (Claude Sonnet) |
| DeepSeek API | ~Rp 1.500/kasus (DeepSeek Reasoner) |
| **Total per kasus** | **~Rp 9.500/kasus** |
| **Harga ke Polri** | **Rp 200.000/BAP** |
| **Gross margin** | **~95%** |

---

## 🗓 Roadmap

### ✅ Selesai
- Database schema (14 tabel + RLS + audit log)
- TypeScript types lengkap
- Supabase client + semua fungsi DB
- DeepSeek analytical engine
- Claude orchestrator + twin engine
- API Routes: auth, kasus, generate-piip, interogasi, bap
- Middleware route protection
- Halaman login

### 🔄 Dalam Pengerjaan
- Dashboard utama (statistik + list kasus)
- Form PIIP 6 modul (Next.js + simpan ke DB)
- Ruang interogasi real-time + STT
- Generate & export BAP ke PDF

### 📋 Berikutnya
- STT integration (Whisper)
- Dashboard supervisor
- WER analytics
- Legal Digital Gateway (operator integration)
