'use client'

import { useState, useEffect } from 'react'
import { LogOut, Bell, Sun, Moon, Zap, User, ChevronRight, Info, Bolt } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Profile {
  name?: string
  role?: string
  years_exp?: number
  email?: string
}

export function MoreTab() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(false)
  const [fieldMode, setFieldMode] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? null)

      const { data } = await supabase
        .from('profiles')
        .select('name, role, years_exp')
        .eq('id', user.id)
        .single()

      if (data) setProfile({ ...data, email: user.email })
    }
    loadProfile()

    const savedNotifications = localStorage.getItem('sparky_notifications')
    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications))
    const savedDark = localStorage.getItem('sparky_dark_mode')
    if (savedDark !== null) setDarkMode(JSON.parse(savedDark))
    const savedField = localStorage.getItem('sparky_field_mode')
    if (savedField !== null) setFieldMode(JSON.parse(savedField))
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    window.location.reload()
  }

  function toggleNotifications() {
    const next = !notifications
    setNotifications(next)
    localStorage.setItem('sparky_notifications', JSON.stringify(next))
  }

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('sparky_dark_mode', JSON.stringify(next))
    window.dispatchEvent(new Event('sparky_dark_mode_changed'))
  }

  function toggleFieldMode() {
    const next = !fieldMode
    setFieldMode(next)
    localStorage.setItem('sparky_field_mode', JSON.stringify(next))
    // Dispatch event so Home tab reacts without a page reload
    window.dispatchEvent(new Event('sparky_field_mode_changed'))
  }

  const displayName = profile?.name || email?.split('@')[0] || 'Electrician'
  const roleLabel = profile?.role
    ? `${profile.role}${profile.years_exp ? ` · ${profile.years_exp} yrs` : ''}`
    : null

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">

      {/* Profile Card */}
      <div className="rounded border border-[#222] bg-[#13161a] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-[#ff6b00]/10 border border-[#ff6b00]/30">
            <User className="h-6 w-6 text-[#ff6b00]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#f0f0f0] truncate">{displayName}</span>
            {roleLabel && (
              <span className="text-xs text-[#ff6b00] uppercase tracking-wider mt-0.5">{roleLabel}</span>
            )}
            <span className="text-[11px] text-[#555] truncate mt-0.5">{email}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-widest text-[#444] px-1 mb-1">
          Settings
        </span>

        {/* Field Mode */}
        <div className={`flex items-center justify-between rounded border px-4 py-3 transition-colors ${
          fieldMode ? 'border-[#ffaa00]/40 bg-[#ffaa0008]' : 'border-[#222] bg-[#13161a]'
        }`}>
          <div className="flex items-center gap-3">
            <Sun className={`h-4 w-4 ${fieldMode ? 'text-[#ffaa00]' : 'text-[#888]'}`} />
            <div className="flex flex-col">
              <span className={`text-sm ${fieldMode ? 'text-[#ffaa00]' : 'text-[#ccc]'}`}>Field Mode</span>
              <span className="text-[10px] text-[#444] uppercase tracking-wider">High-vis · Glove-safe</span>
            </div>
          </div>
          <button
            onClick={toggleFieldMode}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              fieldMode ? 'bg-[#ffaa00]' : 'bg-[#333]'
            }`}
            aria-label="Toggle field mode"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                fieldMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between rounded border border-[#222] bg-[#13161a] px-4 py-3">
          <div className="flex items-center gap-3">
            {darkMode
              ? <Moon className="h-4 w-4 text-[#888]" />
              : <Sun className="h-4 w-4 text-[#888]" />
            }
            <span className="text-sm text-[#ccc]">Dark Mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              darkMode ? 'bg-[#ff6b00]' : 'bg-[#333]'
            }`}
            aria-label="Toggle dark mode"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                darkMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between rounded border border-[#222] bg-[#13161a] px-4 py-3">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-[#888]" />
            <span className="text-sm text-[#ccc]">Notifications</span>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              notifications ? 'bg-[#ff6b00]' : 'bg-[#333]'
            }`}
            aria-label="Toggle notifications"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                notifications ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-widest text-[#444] px-1 mb-1">
          About
        </span>
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="flex items-center justify-between rounded border border-[#222] bg-[#13161a] px-4 py-3 text-left w-full"
        >
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-[#ff6b00]" />
            <span className="text-sm text-[#ccc]">About Sparky</span>
          </div>
          <ChevronRight
            className={`h-4 w-4 text-[#555] transition-transform duration-200 ${showAbout ? 'rotate-90' : ''}`}
          />
        </button>

        {showAbout && (
          <div className="rounded border border-[#222] bg-[#0d1014] px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff6b00]">
                <Zap className="h-4 w-4 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#ff6b00]">Sparky</div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider">Field Electrical Assistant</div>
              </div>
            </div>
            <p className="text-xs text-[#777] leading-relaxed">
              Built by an 11-year Silicon Valley electrician for apprentices and journeymen in the field.
              Fast NEC lookups, load calculations, conduit math, and an AI assistant that speaks your language.
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-[#1a1d22]">
              <Info className="h-3 w-3 text-[#444]" />
              <span className="text-[10px] text-[#444] uppercase tracking-wider">Version 1.0 · Built with ⚡ in California</span>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center justify-center gap-2 rounded border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm font-medium uppercase tracking-wider text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50 w-full"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>

      <div className="pb-4" />
    </div>
  )
}
