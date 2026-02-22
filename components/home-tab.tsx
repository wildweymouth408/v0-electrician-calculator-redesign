'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Zap, User, Award, AlertTriangle, ChevronRight,
  Plus, Trash2, Calendar, Shield, Clock, Lightbulb, Edit2, Check, X,
  Calculator, BookOpen, MessageSquare, Cylinder, Triangle, Ruler, Cable, Gauge, Box, Settings, HardHat,
  Camera, Image, Expand, Upload
} from 'lucide-react'
import { getTipOfTheDay } from '@/lib/tips'
import { getTopTools, hasUsageData } from '@/lib/usage'
import { supabase } from '@/lib/supabase'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string
  role: string
  yearsExp: number
  workType: string
  licenseNumber: string
  licenseState: string
}

interface Credential {
  id: string
  name: string
  issueDate: string
  expiryDate: string
  category: string
  imageUrl?: string
}

type TabId = 'home' | 'tools' | 'reference' | 'sparky' | 'more'

interface HomeTabProps {
  onNavigate?: (tab: TabId, toolId?: string) => void
}

const ROLE_OPTIONS = [
  'Apprentice - Year 1','Apprentice - Year 2','Apprentice - Year 3',
  'Apprentice - Year 4','Apprentice - Year 5','Journeyman','Foreman',
  'General Foreman','Master Electrician','Estimator','Inspector',
]

const WORK_TYPES = ['Residential', 'Commercial', 'Industrial', 'Mixed']

const CREDENTIAL_CATEGORIES = ['License','OSHA','Safety','Manufacturer','First Aid','Other']

const DEFAULT_CREDENTIALS: Credential[] = []

// ─── TOOL DEFINITIONS ────────────────────────────────────────────────────────

const ALL_TOOLS = [
  { id: 'voltage-drop',  label: 'Voltage Drop',  desc: 'V, A, length, wire',      icon: Zap,       color: '#ff6b00', tab: 'tools' as TabId },
  { id: 'conduit-fill',  label: 'Conduit Fill',  desc: 'Type, size, wire count',   icon: Cylinder,  color: '#00d4ff', tab: 'tools' as TabId },
  { id: 'ohms-law',      label: "Ohm's Law",     desc: 'V, I, R triangle',         icon: Triangle,  color: '#ffaa00', tab: 'tools' as TabId },
  { id: 'pipe-bending',  label: 'Pipe Bending',  desc: 'Offsets, 90s, saddles',    icon: Ruler,     color: '#ff6b00', tab: 'tools' as TabId },
  { id: 'wire-sizing',   label: 'Wire Sizing',   desc: 'Load, distance, NEC',      icon: Cable,     color: '#00ff88', tab: 'tools' as TabId },
  { id: 'ampacity',      label: 'Ampacity',      desc: 'Derating & correction',    icon: Gauge,     color: '#00d4ff', tab: 'tools' as TabId },
  { id: 'box-fill',      label: 'Box Fill',      desc: 'NEC 314.16 volumes',       icon: Box,       color: '#ffaa00', tab: 'tools' as TabId },
  { id: 'motor-fla',     label: 'Motor FLA',     desc: '430.248/250 tables',       icon: Settings,  color: '#00d4ff', tab: 'tools' as TabId },
  { id: 'construction',  label: 'Construction',  desc: 'Fractions, feet & inches', icon: HardHat,   color: '#ffaa00', tab: 'tools' as TabId },
]

const DEFAULT_QUICK_ACTIONS = [
  { id: 'sparky-chat',  label: 'Ask Sparky',    desc: 'Get a code answer fast', icon: MessageSquare, color: '#ff6b00', tab: 'sparky'    as TabId },
  { id: 'voltage-drop', label: 'Voltage Drop',  desc: 'Most-used calculator',   icon: Zap,           color: '#00d4ff', tab: 'tools'     as TabId },
  { id: 'nec-ref',      label: 'NEC Reference', desc: 'Look up an article',     icon: BookOpen,      color: '#00ff88', tab: 'reference' as TabId },
  { id: 'box-fill',     label: 'Box Fill',      desc: 'NEC 314.16 volumes',     icon: Box,           color: '#ffaa00', tab: 'tools'     as TabId },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function daysUntilExpiry(dateStr: string): number | null {
  if (!dateStr) return null
  const exp = new Date(dateStr)
  const now = new Date()
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function expiryColor(days: number | null): string {
  if (days === null) return '#555'
  if (days < 0) return '#ff4444'
  if (days < 30) return '#ff4444'
  if (days < 90) return '#ffaa00'
  return '#00ff88'
}

function expiryLabel(days: number | null, dateStr: string): string {
  if (!dateStr) return 'No expiry set'
  if (days === null) return ''
  if (days < 0) return `Expired ${Math.abs(days)}d ago`
  if (days === 0) return 'Expires today!'
  if (days < 90) return `Expires in ${days}d`
  return `Valid · ${days}d remaining`
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inp = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none'
  const lbl = 'block text-[10px] uppercase tracking-wider text-[#555] mb-1.5'

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      onAuth()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full justify-center px-2 py-6">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center w-14 h-14 bg-[#ff6b00] mb-3">
          <Zap className="h-7 w-7 text-[#0f1115]" />
        </div>
        <h1 className="text-2xl font-bold text-[#ff6b00] uppercase tracking-wider">Sparky</h1>
        <p className="text-[11px] text-[#555] uppercase tracking-widest mt-1">Your Field Electrical Assistant</p>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label className={lbl}>Email</label>
          <input className={inp} type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className={lbl}>Password</label>
          <input className={inp} type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="text-xs text-[#ff4444]">{error}</p>}
        <button onClick={handleSubmit} disabled={loading || !email || !password}
          className="w-full py-3.5 bg-[#ff6b00] text-[#0f1115] text-sm font-bold uppercase tracking-wider disabled:opacity-40 mt-2">
          {loading ? 'Please wait...' : isLogin ? 'Sign In →' : 'Create Account →'}
        </button>
        <button onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-[#555] underline text-center">
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

// ─── ONBOARDING SCREEN ────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('Journeyman')
  const [yearsExp, setYearsExp] = useState(1)
  const [workType, setWorkType] = useState('Commercial')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseState, setLicenseState] = useState('CA')
  const [step, setStep] = useState(1)

  const inp = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none'
  const sel = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none appearance-none'
  const lbl = 'block text-[10px] uppercase tracking-wider text-[#555] mb-1.5'

  return (
    <div className="flex flex-col h-full justify-center px-2 py-6">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center w-14 h-14 bg-[#ff6b00] mb-3">
          <Zap className="h-7 w-7 text-[#0f1115]" />
        </div>
        <h1 className="text-2xl font-bold text-[#ff6b00] uppercase tracking-wider">Sparky</h1>
        <p className="text-[11px] text-[#555] uppercase tracking-widest mt-1">Your Field Electrical Assistant</p>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <p className="text-sm text-[#888]">Let's set up your profile so Sparky knows who you are.</p>
          </div>
          <div>
            <label className={lbl}>Your First Name</label>
            <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mike" autoFocus />
          </div>
          <div>
            <label className={lbl}>Your Role</label>
            <select className={sel} value={role} onChange={e => setRole(e.target.value)}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Years of Experience</label>
            <input className={inp} type="number" min={0} max={50} value={yearsExp}
              onChange={e => setYearsExp(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className={lbl}>Primary Work Type</label>
            <div className="grid grid-cols-2 gap-2">
              {WORK_TYPES.map(w => (
                <button key={w} onClick={() => setWorkType(w)}
                  className={`py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${workType === w ? 'border-[#ff6b00] text-[#ff6b00] bg-[#ff6b0012]' : 'border-[#2a2a35] text-[#555]'}`}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => name.trim() ? setStep(2) : null} disabled={!name.trim()}
            className="w-full py-3.5 bg-[#ff6b00] text-[#0f1115] text-sm font-bold uppercase tracking-wider disabled:opacity-40 mt-2">
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <p className="text-sm text-[#888]">Optional — add your license info now or later.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className={lbl}>License Number</label>
              <input className={inp} value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)} placeholder="C-10 #12345" />
            </div>
            <div>
              <label className={lbl}>State</label>
              <input className={inp} value={licenseState}
                onChange={e => setLicenseState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="CA" maxLength={2} />
            </div>
          </div>
          <div className="bg-[#111] border border-[#2a2a35] p-3 mt-2">
            <p className="text-[10px] text-[#555] leading-relaxed">
              You can add OSHA cards, certifications, and other credentials after setup. Sparky will track expiration dates and remind you before they lapse.
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3.5 border border-[#2a2a35] text-[#555] text-sm font-bold uppercase tracking-wider">
              ← Back
            </button>
            <button
              onClick={() => onComplete({ name: name.trim(), role, yearsExp, workType, licenseNumber, licenseState })}
              className="flex-[2] py-3.5 bg-[#ff6b00] text-[#0f1115] text-sm font-bold uppercase tracking-wider">
              Let's Go →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── IMAGE VIEWER MODAL ───────────────────────────────────────────────────────

function ImageViewerModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]"
        onClick={e => e.stopPropagation()}>
        <span className="text-xs font-bold uppercase tracking-wider text-[#f0f0f0]">{name}</span>
        <button onClick={onClose}><X className="h-5 w-5 text-[#555]" /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <img src={url} alt={name}
          className="max-w-full max-h-full object-contain rounded border border-[#222]" />
      </div>
    </div>
  )
}

// ─── CREDENTIAL CARD ─────────────────────────────────────────────────────────

function CredentialCard({ cred, onEdit, onDelete, onImageClick }: {
  cred: Credential
  onEdit: (cred: Credential) => void
  onDelete: (id: string) => void
  onImageClick: (url: string, name: string) => void
}) {
  const days = daysUntilExpiry(cred.expiryDate)
  const color = expiryColor(days)
  const label = expiryLabel(days, cred.expiryDate)

  return (
    <div className="bg-[#111] border border-[#2a2a35] p-3 flex items-center gap-3"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}>

      {/* Thumbnail */}
      {cred.imageUrl ? (
        <button
          onClick={() => onImageClick(cred.imageUrl!, cred.name)}
          className="shrink-0 w-12 h-12 rounded border border-[#2a2a35] overflow-hidden relative group"
        >
          <img src={cred.imageUrl} alt={cred.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Expand className="h-3.5 w-3.5 text-white" />
          </div>
        </button>
      ) : (
        <button
          onClick={() => onEdit(cred)}
          className="shrink-0 w-12 h-12 rounded border border-dashed border-[#2a2a35] flex items-center justify-center text-[#333] hover:border-[#ff6b00] hover:text-[#ff6b00] transition-colors"
        >
          <Camera className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#f0f0f0] truncate">{cred.name}</span>
          <span className="text-[9px] uppercase tracking-wider text-[#444] border border-[#2a2a35] px-1.5 py-0.5 shrink-0">
            {cred.category}
          </span>
        </div>
        {cred.expiryDate ? (
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3 w-3 shrink-0" style={{ color }} />
            <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
          </div>
        ) : (
          <span className="text-[10px] text-[#444] mt-1 block">Tap edit to add dates</span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onEdit(cred)} className="text-[#555] hover:text-[#ff6b00] transition-colors p-1">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(cred.id)} className="text-[#555] hover:text-[#ff4444] transition-colors p-1">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── EDIT CREDENTIAL MODAL ────────────────────────────────────────────────────

function EditCredentialModal({ cred, userId, onSave, onClose }: {
  cred: Credential | null
  userId: string
  onSave: (cred: Credential) => void
  onClose: () => void
}) {
  const isNew = !cred?.id || cred.id === 'new'
  const [name, setName] = useState(cred?.name || '')
  const [category, setCategory] = useState(cred?.category || 'Other')
  const [issueDate, setIssueDate] = useState(cred?.issueDate || '')
  const [expiryDate, setExpiryDate] = useState(cred?.expiryDate || '')
  const [imageUrl, setImageUrl] = useState(cred?.imageUrl || '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inp = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-2.5 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none'
  const sel = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-2.5 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none appearance-none'
  const lbl = 'block text-[10px] uppercase tracking-wider text-[#555] mb-1.5'

  async function handleImageUpload(file: File) {
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('certificates')
        .getPublicUrl(path)

      // For private buckets, use signed URL instead
      const { data: signedData, error: signedError } = await supabase.storage
        .from('certificates')
        .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

      if (signedError) throw signedError
      setImageUrl(signedData.signedUrl)
    } catch (e: any) {
      setUploadError('Upload failed. Try again.')
      console.error(e)
    }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full bg-[#0f1115] border-t border-[#2a2a35] p-4 p-8 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">
            {isNew ? 'Add Credential' : 'Edit Credential'}
          </span>
          <button onClick={onClose}><X className="h-4 w-4 text-[#555]" /></button>
        </div>

        <div>
          <label className={lbl}>Name</label>
          <input className={inp} value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. OSHA 30, C-10 License..." />
        </div>

        <div>
          <label className={lbl}>Category</label>
          <select className={sel} value={category} onChange={e => setCategory(e.target.value)}>
            {CREDENTIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Issue Date</label>
            <input className={inp} type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Expiry Date</label>
            <input className={inp} type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className={lbl}>Certificate Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
            }}
          />
          {imageUrl ? (
            <div className="flex items-center gap-3">
              <img src={imageUrl} alt="Certificate"
                className="w-20 h-20 object-cover rounded border border-[#2a2a35]" />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#ff6b00] uppercase tracking-wider font-bold border border-[#ff6b0033] px-3 py-1.5 hover:border-[#ff6b00] transition-colors">
                  Replace
                </button>
                <button
                  onClick={() => setImageUrl('')}
                  className="text-xs text-[#ff4444] uppercase tracking-wider font-bold border border-[#ff444433] px-3 py-1.5 hover:border-[#ff4444] transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-[#2a2a35] py-4 text-xs text-[#555] uppercase tracking-wider hover:border-[#ff6b00] hover:text-[#ff6b00] transition-colors disabled:opacity-50">
              {uploading
                ? <><Upload className="h-4 w-4 animate-pulse" /> Uploading...</>
                : <><Camera className="h-4 w-4" /> Tap to add photo or take a picture</>
              }
            </button>
          )}
          {uploadError && <p className="text-xs text-[#ff4444] mt-1">{uploadError}</p>}
        </div>

        <button
          onClick={() => {
            if (!name.trim()) return
            onSave({
              id: cred?.id && !isNew ? cred.id : Date.now().toString(),
              name: name.trim(), category, issueDate, expiryDate, imageUrl
            })
          }}
          disabled={!name.trim() || uploading}
          className="w-full py-3 bg-[#ff6b00] text-[#0f1115] text-sm font-bold uppercase tracking-wider disabled:opacity-40">
          Save
        </button>
      </div>
    </div>
  )
}

// ─── MAIN HOME TAB ────────────────────────────────────────────────────────────

export function HomeTab({ onNavigate }: HomeTabProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>(DEFAULT_CREDENTIALS)
  const [editingCred, setEditingCred] = useState<Credential | null>(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [quickActions, setQuickActions] = useState(DEFAULT_QUICK_ACTIONS)
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null)
  const tip = getTipOfTheDay()

  useEffect(() => {
    if (hasUsageData()) {
      const topIds = getTopTools(4)
      const topTools = topIds
        .map(id => ALL_TOOLS.find(t => t.id === id))
        .filter(Boolean) as typeof ALL_TOOLS
      if (topTools.length < 4) {
        const extras = ALL_TOOLS
          .filter(t => !topIds.includes(t.id))
          .slice(0, 4 - topTools.length)
        setQuickActions([...topTools, ...extras].slice(0, 4).map(t => ({ ...t, desc: t.desc })))
      } else {
        setQuickActions(topTools.slice(0, 4))
      }
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        loadUserData(session.user.id)
      }
      setLoaded(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        loadUserData(session.user.id)
      } else {
        setUserId(null)
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(uid: string) {
    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', uid).single()
    if (prof) {
      setProfile({
        name: prof.name, role: prof.role, yearsExp: prof.years_exp,
        workType: prof.work_type, licenseNumber: prof.license_number || '',
        licenseState: prof.license_state || 'CA'
      })
    }
    const { data: creds } = await supabase
      .from('credentials').select('*').eq('user_id', uid).order('created_at')
    if (creds && creds.length > 0) {
      setCredentials(creds.map(c => ({
        id: c.id, name: c.name, issueDate: c.issue_date || '',
        expiryDate: c.expiry_date || '', category: c.issuer || 'Other',
        imageUrl: c.image_url || ''
      })))
    }
  }

  async function saveProfile(p: UserProfile) {
    if (!userId) return
    await supabase.from('profiles').upsert({
      id: userId, name: p.name, role: p.role, years_exp: p.yearsExp,
      work_type: p.workType, license_number: p.licenseNumber, license_state: p.licenseState
    })
    setProfile(p)
  }

  async function saveCred(saved: Credential) {
    if (!userId) return
    const isNew = !credentials.find(c => c.id === saved.id)
    if (isNew) {
      const { data } = await supabase.from('credentials').insert({
        user_id: userId, name: saved.name, issuer: saved.category,
        issue_date: saved.issueDate || null, expiry_date: saved.expiryDate || null,
        image_url: saved.imageUrl || null
      }).select().single()
      if (data) setCredentials(prev => [...prev, { ...saved, id: data.id }])
    } else {
      await supabase.from('credentials').update({
        name: saved.name, issuer: saved.category,
        issue_date: saved.issueDate || null, expiry_date: saved.expiryDate || null,
        image_url: saved.imageUrl || null
      }).eq('id', saved.id)
      setCredentials(prev => prev.map(c => c.id === saved.id ? saved : c))
    }
  }

  async function deleteCred(id: string) {
    await supabase.from('credentials').delete().eq('id', id)
    setCredentials(prev => prev.filter(c => c.id !== id))
  }

  if (!loaded) return null
  if (!userId) return <AuthScreen onAuth={() => {}} />
  if (!profile) return <OnboardingScreen onComplete={p => saveProfile(p)} />

  const alerts = credentials.filter(c => {
    const d = daysUntilExpiry(c.expiryDate)
    return d !== null && d < 60
  })

  const categoryColors: Record<string, string> = {
    safety: '#ff3333', code: '#00d4ff', technique: '#00ff88', tool: '#ffaa00',
  }

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* Profile header */}
      <div className="bg-[#111] border border-[#2a2a35] p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-[#ff6b00] shrink-0">
          <User className="h-6 w-6 text-[#0f1115]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-[#f0f0f0]">{profile.name}</div>
          <div className="text-xs text-[#888]">{profile.role}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#555]">{profile.yearsExp} yr{profile.yearsExp !== 1 ? 's' : ''} experience</span>
            <span className="text-[#333]">·</span>
            <span className="text-[10px] text-[#555]">{profile.workType}</span>
            {profile.licenseNumber && (
              <>
                <span className="text-[#333]">·</span>
                <span className="text-[10px] text-[#555]">{profile.licenseState} #{profile.licenseNumber}</span>
              </>
            )}
          </div>
        </div>
        <button onClick={() => setShowEditProfile(true)}
          className="text-[#555] hover:text-[#ff6b00] transition-colors p-1 shrink-0">
          <Edit2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expiry alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map(a => {
            const days = daysUntilExpiry(a.expiryDate)
            return (
              <div key={a.id} className="flex items-center gap-2.5 bg-[#1a0a0a] border border-[#ff444433] p-3">
                <AlertTriangle className="h-4 w-4 text-[#ff4444] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#ff4444]">{a.name}</span>
                  <span className="text-xs text-[#888] ml-2">{expiryLabel(days, a.expiryDate)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tip of the day */}
      {tip && (
        <div className="relative overflow-hidden border border-[#2a2a35] bg-[#111]">
          <div className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: categoryColors[tip.category] || '#ff6b00' }} />
          <div className="p-3 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-3.5 w-3.5 text-[#ffaa00]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffaa00]">Sparky's Tip</span>
              <span className="text-[10px] uppercase tracking-wider text-[#444]">{tip.category}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-[#ccc]">{tip.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#777]">{tip.body}</p>
            {tip.reference && (
              <span className="mt-1 inline-block font-mono text-[10px] text-[#444]">{tip.reference}</span>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#888]">
            {hasUsageData() ? 'Your Top Tools' : 'Quick Actions'}
          </h2>
          {hasUsageData() && (
            <span className="text-[9px] text-[#444] uppercase tracking-wider">Based on your usage</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => onNavigate?.(action.tab, action.id !== 'sparky-chat' && action.id !== 'nec-ref' ? action.id : undefined)}
                className="border border-[#2a2a35] bg-[#111] p-3 flex flex-col gap-1.5 text-left transition-colors hover:border-[#333] active:scale-[0.98]"
                style={{ borderLeftColor: action.color, borderLeftWidth: 3 }}
              >
                <Icon className="h-4 w-4" style={{ color: action.color }} />
                <span className="text-xs font-bold text-[#f0f0f0]">{action.label}</span>
                <span className="text-[10px] text-[#555]">{action.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Credentials wallet */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#00ff88]" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#888]">Credentials</h2>
          </div>
          <button
            onClick={() => setEditingCred({ id: 'new', name: '', issueDate: '', expiryDate: '', category: 'Other', imageUrl: '' })}
            className="flex items-center gap-1.5 text-[10px] text-[#ff6b00] uppercase tracking-wider font-bold border border-[#ff6b0033] px-2.5 py-1.5 hover:border-[#ff6b00] transition-colors">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {credentials.length === 0 ? (
          <div className="border border-dashed border-[#2a2a35] p-6 text-center">
            <p className="text-[11px] text-[#444]">No credentials added yet</p>
            <p className="text-[10px] text-[#333] mt-1">Add any certifications here — OSHA cards, licenses, manufacturer certs, and more</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {credentials.map(c => (
              <CredentialCard key={c.id} cred={c}
                onEdit={setEditingCred}
                onDelete={deleteCred}
                onImageClick={(url, name) => setViewingImage({ url, name })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit credential modal */}
      {editingCred && userId && (
        <EditCredentialModal
          cred={editingCred}
          userId={userId}
          onSave={saved => { saveCred(saved); setEditingCred(null) }}
          onClose={() => setEditingCred(null)}
        />
      )}

      {/* Image viewer */}
      {viewingImage && (
        <ImageViewerModal
          url={viewingImage.url}
          name={viewingImage.name}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* Edit profile modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setShowEditProfile(false)}>
          <div className="w-full bg-[#0f1115] border-t border-[#2a2a35] p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Edit Profile</span>
              <button onClick={() => setShowEditProfile(false)}><X className="h-4 w-4 text-[#555]" /></button>
            </div>
            {[
              { label: 'Name', value: profile.name, key: 'name', type: 'text' },
              { label: 'Years Experience', value: String(profile.yearsExp), key: 'yearsExp', type: 'number' },
              { label: 'License Number', value: profile.licenseNumber, key: 'licenseNumber', type: 'text' },
              { label: 'License State', value: profile.licenseState, key: 'licenseState', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1.5">{f.label}</label>
                <input
                  className="w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-2.5 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
                  type={f.type} value={f.value}
                  onChange={e => setProfile(prev => prev ? { ...prev, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value } : prev)}
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1.5">Role</label>
              <select
                className="w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-2.5 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none appearance-none"
                value={profile.role}
                onChange={e => setProfile(prev => prev ? { ...prev, role: e.target.value } : prev)}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-2">Work Type</label>
              <div className="grid grid-cols-2 gap-2">
                {WORK_TYPES.map(w => (
                  <button key={w}
                    onClick={() => setProfile(prev => prev ? { ...prev, workType: w } : prev)}
                    className={`py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${profile.workType === w ? 'border-[#ff6b00] text-[#ff6b00] bg-[#ff6b0012]' : 'border-[#2a2a35] text-[#555]'}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { saveProfile(profile); setShowEditProfile(false) }}
              className="w-full py-3 bg-[#ff6b00] text-[#0f1115] text-sm font-bold uppercase tracking-wider mt-2">
              Save Profile
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
