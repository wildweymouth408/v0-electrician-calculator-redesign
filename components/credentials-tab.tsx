'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff, Upload, Award, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadCertificate, getCertificateUrl, deleteCertificate } from '@/lib/certificates'
import { encryptField, decryptField } from '@/lib/crypto'

interface Credential {
  id: string
  name: string
  issuer: string
  issue_date: string
  expiry_date: string
  license_number: string | null
  file_path: string | null
  created_at: string
}

interface CredentialDisplay extends Credential {
  imageUrl?: string | null
  licenseDecrypted?: string | null
  showLicense?: boolean
}

export function CredentialsTab() {
  const [credentials, setCredentials] = useState<CredentialDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    license_number: '',
    file: null as File | null,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error || !data) { setLoading(false); return }

      const withUrls = await Promise.all(
        data.map(async (cred) => {
          const imageUrl = cred.file_path
            ? await getCertificateUrl(cred.file_path)
            : null
          return { ...cred, imageUrl, showLicense: false, licenseDecrypted: null }
        })
      )

      setCredentials(withUrls)
      setLoading(false)
    }
    load()
  }, [])

  async function toggleLicense(id: string) {
    setCredentials(prev => prev.map(async (cred) => {
      if (cred.id !== id) return cred
      if (cred.showLicense) return { ...cred, showLicense: false }
      if (cred.licenseDecrypted) return { ...cred, showLicense: true }
      if (!cred.license_number) return { ...cred, showLicense: true }
      try {
        const decrypted = await decryptField(cred.license_number)
        return { ...cred, showLicense: true, licenseDecrypted: decrypted }
      } catch {
        return { ...cred, showLicense: true, licenseDecrypted: 'Unable to decrypt' }
      }
    }) as unknown as CredentialDisplay[])

    // Re-resolve promises
    setCredentials(prev => {
      const updated = [...prev]
      const idx = updated.findIndex(c => c.id === id)
      if (idx === -1) return prev
      const cred = updated[idx]
      if (cred.showLicense && !cred.licenseDecrypted && cred.license_number) {
        decryptField(cred.license_number)
          .then(decrypted => {
            setCredentials(p => p.map(c =>
              c.id === id ? { ...c, showLicense: true, licenseDecrypted: decrypted } : c
            ))
          })
          .catch(() => {
            setCredentials(p => p.map(c =>
              c.id === id ? { ...c, showLicense: true, licenseDecrypted: 'Unable to decrypt' } : c
            ))
          })
      } else {
        updated[idx] = { ...cred, showLicense: !cred.showLicense }
      }
      return updated
    })
  }

  async function handleSave() {
    if (!userId || !form.name) return
    setSaving(true)

    try {
      let file_path: string | null = null
      if (form.file) {
        file_path = await uploadCertificate(userId, form.file)
      }

      let encrypted_license: string | null = null
      if (form.license_number.trim()) {
        encrypted_license = await encryptField(form.license_number.trim())
      }

      const { error } = await supabase.from('credentials').insert({
        user_id: userId,
        name: form.name,
        issuer: form.issuer,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        license_number: encrypted_license,
        file_path,
      })

      if (error) throw error

      // Reload
      const { data } = await supabase
        .from('credentials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (data) {
        const withUrls = await Promise.all(
          data.map(async (cred) => ({
            ...cred,
            imageUrl: cred.file_path ? await getCertificateUrl(cred.file_path) : null,
            showLicense: false,
            licenseDecrypted: null,
          }))
        )
        setCredentials(withUrls)
      }

      setForm({ name: '', issuer: '', issue_date: '', expiry_date: '', license_number: '', file: null })
      setShowForm(false)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(cred: CredentialDisplay) {
    if (!confirm(`Delete "${cred.name}"?`)) return

    if (cred.file_path) await deleteCertificate(cred.file_path)

    await supabase.from('credentials').delete().eq('id', cred.id)

    setCredentials(prev => prev.filter(c => c.id !== cred.id))
  }

  function isExpiringSoon(expiry: string) {
    if (!expiry) return false
    const diff = new Date(expiry).getTime() - Date.now()
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000 // 60 days
  }

  function isExpired(expiry: string) {
    if (!expiry) return false
    return new Date(expiry).getTime() < Date.now()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#ff6b00]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Credential Wallet</h2>
          <p className="text-[11px] text-[#555] mt-0.5">Licenses, certs & cards — encrypted</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded border border-[#ff6b00]/40 bg-[#ff6b00]/10 px-3 py-2 text-xs font-medium uppercase tracking-wider text-[#ff6b00]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded border border-[#ff6b00]/20 bg-[#13161a] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff6b00]">New Credential</span>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-[#555]" /></button>
          </div>

          <input
            placeholder="Name (e.g. OSHA 30, CA Electrician License)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded border border-[#222] bg-[#0d1014] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#444] focus:outline-none focus:border-[#ff6b00]/40"
          />
          <input
            placeholder="Issuer (e.g. CSLB, IBEW)"
            value={form.issuer}
            onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))}
            className="w-full rounded border border-[#222] bg-[#0d1014] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#444] focus:outline-none focus:border-[#ff6b00]/40"
          />
          <input
            placeholder="License / Certificate Number (encrypted)"
            value={form.license_number}
            onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
            className="w-full rounded border border-[#222] bg-[#0d1014] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#444] focus:outline-none focus:border-[#ff6b00]/40"
          />
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-[#444] uppercase tracking-wider">Issue Date</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                className="w-full rounded border border-[#222] bg-[#0d1014] px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#ff6b00]/40"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-[#444] uppercase tracking-wider">Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                className="w-full rounded border border-[#222] bg-[#0d1014] px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#ff6b00]/40"
              />
            </div>
          </div>

          {/* File Upload */}
          <label className="flex items-center gap-2 rounded border border-dashed border-[#333] bg-[#0d1014] px-3 py-3 cursor-pointer hover:border-[#ff6b00]/30 transition-colors">
            <Upload className="h-4 w-4 text-[#555]" />
            <span className="text-xs text-[#555]">
              {form.file ? form.file.name : 'Upload certificate image (optional)'}
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
            />
          </label>

          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="flex items-center justify-center gap-2 rounded bg-[#ff6b00] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save Credential'}
          </button>
        </div>
      )}

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Award className="h-10 w-10 text-[#333]" />
          <p className="text-sm text-[#444]">No credentials yet</p>
          <p className="text-[11px] text-[#333]">Add your licenses, certs, and cards</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {credentials.map(cred => {
            const expired = cred.expiry_date ? isExpired(cred.expiry_date) : false
            const expiringSoon = cred.expiry_date ? isExpiringSoon(cred.expiry_date) : false

            return (
              <div
                key={cred.id}
                className={`rounded border bg-[#13161a] p-4 flex flex-col gap-3 ${
                  expired ? 'border-red-900/40' :
                  expiringSoon ? 'border-yellow-700/40' :
                  'border-[#222]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
