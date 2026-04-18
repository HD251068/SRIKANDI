// ============================================================
// PIIP SYSTEM — TypeScript Types
// Sesuai dengan struktur database Supabase
// ============================================================

export type Role = 'penyidik' | 'supervisor' | 'admin'
export type StatusKasus = 'aktif' | 'p21' | 'sp3' | 'sidang' | 'inkracht'
export type GayaInterogasi = 'PEACE' | 'Reid' | 'SUE' | 'Cognitive' | 'Hybrid'
export type JenisBukti = 'fisik' | 'digital' | 'forensik' | 'keterangan' | 'dokumen'
export type KekuatanBukti = 'kuat' | 'sedang' | 'lemah' | 'perlu verifikasi'
export type PosisiSaksi = 'saksi mata' | 'saksi alibi' | 'saksi ahli' | 'saksi a de charge'
export type Speaker = 'penyidik' | 'tersangka'
export type StatusBAP = 'draft' | 'review' | 'final' | 'ditandatangani'

// ============================================================
// PENYIDIK
// ============================================================
export interface Penyidik {
  id: string
  auth_id: string
  nama_lengkap: string
  nrp: string
  pangkat: string
  jabatan: string
  satuan: string
  polsek_id?: string
  foto_url?: string
  is_active: boolean
  role: Role
  created_at: string
  updated_at: string
}

// ============================================================
// KASUS
// ============================================================
export interface Kasus {
  id: string
  nomor_lp: string
  nomor_spdp?: string
  jenis_pidana: string
  tanggal_kejadian?: string
  tanggal_laporan?: string
  lokasi_kejadian?: string
  kronologi?: string
  kondisi_tkp?: string
  ada_cctv?: string
  status: StatusKasus
  threat_level: number  // 1-5
  tujuan_interogasi?: string
  gaya_interogasi: GayaInterogasi
  penyidik_id: string
  supervisor_id?: string
  created_at: string
  updated_at: string
  // Relations
  penyidik?: Penyidik
  tersangka?: Tersangka[]
  korban?: Korban[]
  alat_bukti?: AlatBukti[]
  saksi?: Saksi[]
  framework_hukum?: FrameworkHukum
  digital_forensik?: DigitalForensik
  intelligence_package?: IntelligencePackage[]
}

// ============================================================
// TERSANGKA
// ============================================================
export interface Tersangka {
  id: string
  kasus_id: string
  nama_lengkap: string
  alias?: string
  nik?: string
  tempat_lahir?: string
  tanggal_lahir?: string
  jenis_kelamin?: 'L' | 'P'
  alamat?: string
  pekerjaan?: string
  pendidikan?: string
  agama?: string
  status_perkawinan?: string
  riwayat_kriminal: string
  hubungan_korban?: string
  dugaan_motif?: string
  karakter_kepribadian?: string
  status_penahanan: string
  didampingi_pengacara: boolean
  nama_pengacara?: string
  foto_url?: string
  created_at: string
  updated_at: string
}

// ============================================================
// KORBAN
// ============================================================
export interface Korban {
  id: string
  kasus_id: string
  nama_lengkap: string
  usia?: number
  jenis_kelamin?: string
  pekerjaan?: string
  kondisi?: string
  hubungan_tersangka?: string
  keterangan?: string
  created_at: string
}

// ============================================================
// ALAT BUKTI
// ============================================================
export interface AlatBukti {
  id: string
  kasus_id: string
  deskripsi: string
  jenis: JenisBukti
  kekuatan: KekuatanBukti
  nomor_register?: string
  lokasi_penyimpanan?: string
  catatan?: string
  foto_url?: string
  created_at: string
}

// ============================================================
// SAKSI
// ============================================================
export interface Saksi {
  id: string
  kasus_id: string
  nama_lengkap: string
  nik?: string
  alamat?: string
  pekerjaan?: string
  posisi: PosisiSaksi
  kredibilitas: 'tinggi' | 'sedang' | 'meragukan'
  isi_keterangan?: string
  potensi_konflik?: string
  sudah_bap: boolean
  created_at: string
}

// ============================================================
// FRAMEWORK HUKUM
// ============================================================
export interface FrameworkHukum {
  id: string
  kasus_id: string
  pasal_diduga: string[]
  unsur_terpenuhi?: string
  unsur_belum_terpenuhi?: string
  catatan_khusus?: string
  created_at: string
  updated_at: string
}

// ============================================================
// DIGITAL FORENSIK
// ============================================================
export interface DigitalForensik {
  id: string
  kasus_id: string
  // Perangkat
  device_tersangka?: string
  device_korban?: string
  chat_history?: string
  exif_data?: string
  browsing_history?: string
  device_findings?: string
  // Jaringan
  bts_data?: string
  imei_tracking?: string
  bts_finding?: string
  // Finansial
  bank_data?: string
  ewallet_data?: string
  transfer_data?: string
  financial_findings?: string
  // Platform
  google_timeline?: string
  ojol_data?: string
  sosmed_data?: string
  email_data?: string
  // Pending
  digital_pending?: string
  created_at: string
  updated_at: string
  // Relations
  inkonsistensi?: InkonsistensiDigital[]
}

// ============================================================
// INKONSISTENSI DIGITAL
// ============================================================
export interface InkonsistensiDigital {
  id: string
  kasus_id: string
  klaim_tersangka: string
  fakta_digital: string
  sumber_data?: string
  kekuatan_konfrontasi: 'sangat kuat' | 'kuat' | 'sedang' | 'perlu verifikasi'
  created_at: string
}

// ============================================================
// SESI INTEROGASI
// ============================================================
export interface SesiInterogasi {
  id: string
  kasus_id: string
  tersangka_id: string
  penyidik_id: string
  nomor_sesi: number
  tanggal_sesi: string
  durasi_menit?: number
  lokasi: string
  status: 'berlangsung' | 'selesai' | 'ditangguhkan'
  catatan_sesi?: string
  created_at: string
  // Relations
  transcript?: TranscriptInterogasi[]
}

// ============================================================
// TRANSCRIPT (STT)
// ============================================================
export interface TranscriptInterogasi {
  id: string
  sesi_id: string
  timestamp_bicara: string
  speaker: Speaker
  teks_original: string
  teks_koreksi?: string
  is_corrected: boolean
  flagged_inconsistency: boolean
  flag_note?: string
  sequence_number?: number
  created_at: string
}

// ============================================================
// INTELLIGENCE PACKAGE (Output Claude)
// ============================================================
export interface IntelligencePackage {
  id: string
  kasus_id: string
  versi: number
  generated_by: string
  generated_at: string
  intelligence_brief?: string
  profil_psikologis?: string
  analisis_bukti?: string
  digital_forensic_brief?: string
  gap_analysis?: string
  strategi_pembuka?: string
  jebakan_logika?: string
  red_flags?: string
  rekomendasi_taktik?: string
  model_used: string
  tokens_used?: number
  raw_prompt?: object
  created_at: string
}

// ============================================================
// BAP DRAFT
// ============================================================
export interface BAPDraft {
  id: string
  kasus_id: string
  sesi_id?: string
  nomor_bap?: string
  konten_bap?: string
  status: StatusBAP
  generated_by: string
  reviewed_by?: string
  file_url?: string
  created_at: string
  updated_at: string
}

// ============================================================
// PIIP FORM DATA (untuk state management frontend)
// ============================================================
export interface PIIPFormData {
  kejadian: {
    nomor_lp: string
    nomor_spdp?: string
    jenis_pidana: string
    tanggal_kejadian?: string
    tanggal_laporan?: string
    lokasi_kejadian: string
    kronologi: string
    kondisi_tkp?: string
    ada_cctv?: string
  }
  tersangka: Omit<Tersangka, 'id' | 'kasus_id' | 'created_at' | 'updated_at'>
  korban: Omit<Korban, 'id' | 'kasus_id' | 'created_at'>[]
  alat_bukti: Omit<AlatBukti, 'id' | 'kasus_id' | 'created_at'>[]
  saksi: Omit<Saksi, 'id' | 'kasus_id' | 'created_at'>[]
  framework_hukum: Omit<FrameworkHukum, 'id' | 'kasus_id' | 'created_at' | 'updated_at'>
  digital_forensik: Omit<DigitalForensik, 'id' | 'kasus_id' | 'created_at' | 'updated_at'>
  inkonsistensi: Omit<InkonsistensiDigital, 'id' | 'kasus_id' | 'created_at'>[]
  meta: {
    threat_level: number
    tujuan_interogasi?: string
    gaya_interogasi: GayaInterogasi
  }
}

// ============================================================
// API RESPONSE
// ============================================================
export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface GeneratePIIPResponse {
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
