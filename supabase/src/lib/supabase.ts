// ============================================================
// SRIKANDI — Supabase Client
// Sistem Riset Intelijen Kriminal Andalan Indonesia
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Kasus, Tersangka, Korban, AlatBukti, Saksi,
  FrameworkHukum, DigitalForensik, InkonsistensiDigital,
  SesiInterogasi, TranscriptInterogasi, IntelligencePackage,
  BAPDraft, Penyidik } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Cek .env.local')
}

// Client untuk browser (dengan auth session)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// AUTH HELPERS
// ============================================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getPenyidikProfile(authId: string): Promise<Penyidik | null> {
  const { data, error } = await supabase
    .from('penyidik')
    .select('*')
    .eq('auth_id', authId)
    .single()
  if (error) return null
  return data
}

// ============================================================
// KASUS
// ============================================================

export async function getSemuaKasus() {
  const { data, error } = await supabase
    .from('kasus')
    .select(`
      *,
      penyidik (nama_lengkap, pangkat, nrp),
      tersangka (id, nama_lengkap),
      korban (id, nama_lengkap, kondisi)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Kasus[]
}

export async function getKasusById(id: string) {
  const { data, error } = await supabase
    .from('kasus')
    .select(`
      *,
      penyidik (nama_lengkap, pangkat, nrp, jabatan, satuan),
      tersangka (*),
      korban (*),
      alat_bukti (*),
      saksi (*),
      framework_hukum (*),
      digital_forensik (*, inkonsistensi_digital (*)),
      intelligence_package (*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Kasus
}

export async function createKasus(payload: Partial<Kasus>) {
  const { data, error } = await supabase
    .from('kasus')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Kasus
}

export async function updateKasus(id: string, payload: Partial<Kasus>) {
  const { data, error } = await supabase
    .from('kasus')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Kasus
}

// ============================================================
// TERSANGKA
// ============================================================

export async function upsertTersangka(payload: Partial<Tersangka>) {
  const { data, error } = await supabase
    .from('tersangka')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data as Tersangka
}

// ============================================================
// KORBAN
// ============================================================

export async function upsertKorban(items: Partial<Korban>[]) {
  const { data, error } = await supabase
    .from('korban')
    .upsert(items)
    .select()
  if (error) throw error
  return data as Korban[]
}

export async function deleteKorban(id: string) {
  const { error } = await supabase.from('korban').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// ALAT BUKTI
// ============================================================

export async function upsertAlatBukti(items: Partial<AlatBukti>[]) {
  const { data, error } = await supabase
    .from('alat_bukti')
    .upsert(items)
    .select()
  if (error) throw error
  return data as AlatBukti[]
}

export async function deleteAlatBukti(id: string) {
  const { error } = await supabase.from('alat_bukti').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// SAKSI
// ============================================================

export async function upsertSaksi(items: Partial<Saksi>[]) {
  const { data, error } = await supabase
    .from('saksi')
    .upsert(items)
    .select()
  if (error) throw error
  return data as Saksi[]
}

export async function deleteSaksi(id: string) {
  const { error } = await supabase.from('saksi').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// FRAMEWORK HUKUM
// ============================================================

export async function upsertFrameworkHukum(payload: Partial<FrameworkHukum>) {
  const { data, error } = await supabase
    .from('framework_hukum')
    .upsert(payload, { onConflict: 'kasus_id' })
    .select()
    .single()
  if (error) throw error
  return data as FrameworkHukum
}

// ============================================================
// DIGITAL FORENSIK
// ============================================================

export async function upsertDigitalForensik(payload: Partial<DigitalForensik>) {
  const { data, error } = await supabase
    .from('digital_forensik')
    .upsert(payload, { onConflict: 'kasus_id' })
    .select()
    .single()
  if (error) throw error
  return data as DigitalForensik
}

export async function upsertInkonsistensi(items: Partial<InkonsistensiDigital>[]) {
  const { data, error } = await supabase
    .from('inkonsistensi_digital')
    .upsert(items)
    .select()
  if (error) throw error
  return data as InkonsistensiDigital[]
}

export async function deleteInkonsistensi(id: string) {
  const { error } = await supabase
    .from('inkonsistensi_digital').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// INTELLIGENCE PACKAGE
// ============================================================

export async function saveIntelligencePackage(payload: Partial<IntelligencePackage>) {
  const { data, error } = await supabase
    .from('intelligence_package')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as IntelligencePackage
}

export async function getLatestPackage(kasusId: string) {
  const { data, error } = await supabase
    .from('intelligence_package')
    .select('*')
    .eq('kasus_id', kasusId)
    .order('versi', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data as IntelligencePackage
}

// ============================================================
// SESI INTEROGASI
// ============================================================

export async function createSesiInterogasi(payload: Partial<SesiInterogasi>) {
  const { data, error } = await supabase
    .from('sesi_interogasi')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as SesiInterogasi
}

export async function getSesiByKasus(kasusId: string) {
  const { data, error } = await supabase
    .from('sesi_interogasi')
    .select('*, transcript_interogasi(*)')
    .eq('kasus_id', kasusId)
    .order('nomor_sesi', { ascending: true })
  if (error) throw error
  return data as SesiInterogasi[]
}

// ============================================================
// TRANSCRIPT (STT)
// ============================================================

export async function insertTranscript(payload: Partial<TranscriptInterogasi>) {
  const { data, error } = await supabase
    .from('transcript_interogasi')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as TranscriptInterogasi
}

export async function koreksiTranscript(id: string, teksKoreksi: string) {
  const { data, error } = await supabase
    .from('transcript_interogasi')
    .update({ teks_koreksi: teksKoreksi, is_corrected: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as TranscriptInterogasi
}

// ============================================================
// BAP DRAFT
// ============================================================

export async function saveBAPDraft(payload: Partial<BAPDraft>) {
  const { data, error } = await supabase
    .from('bap_draft')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as BAPDraft
}

export async function updateBAPStatus(id: string, status: BAPDraft['status']) {
  const { data, error } = await supabase
    .from('bap_draft')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as BAPDraft
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats() {
  const [kasusAktif, kasusP21, kasusSP3, kasusTotal] = await Promise.all([
    supabase.from('kasus').select('id', { count: 'exact' }).eq('status', 'aktif'),
    supabase.from('kasus').select('id', { count: 'exact' }).eq('status', 'p21'),
    supabase.from('kasus').select('id', { count: 'exact' }).eq('status', 'sp3'),
    supabase.from('kasus').select('id', { count: 'exact' }),
  ])
  return {
    aktif: kasusAktif.count ?? 0,
    p21: kasusP21.count ?? 0,
    sp3: kasusSP3.count ?? 0,
    total: kasusTotal.count ?? 0,
  }
}
