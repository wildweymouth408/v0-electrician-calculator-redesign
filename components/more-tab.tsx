'use client'

import { useState, useEffect } from 'react'
import {
  getSettings, saveSettings,
  getCalculations, clearCalculations, clearAllData,
  type UserSettings, type UserRole, type SavedCalculation,
} from '@/lib/storage'
import { toast } from 'sonner'
import {
  User,
  Shield,
  Building2,
  Clock,
  Trash2,
  Moon,
  Bell,
  HardHat,
  ChevronRight,
  History,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react'

type MoreView = 'menu' | 'profile' | 'history' | 'settings'

interface MoreTabProps {
  onRoleChange: (role: UserRole) => void
}

export function MoreTab({ onRoleChange }: MoreTabProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [view, setView] = useState<MoreView>('menu')
  const [savedCalcs, setSavedCalcs] = useState<SavedCalculation[]>([])

  useEffect(() => {
    setSettings(getSettings())
    setSavedCalcs(getCalculations())
  }, [])

  function updateSettings(partial: Partial<UserSettings>) {
    const updated = saveSettings(partial)
    setSettings(updated)
    if (partial.role) {
      onRoleChange(partial.role)
    }
  }

  if (!settings) return null

  // ── Profile View ──────────────────
  if (view === 'profile') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('menu')} className="text-[#888] hover:text-[#f0f0f0]" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Profile</h2>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Name</span>
            <input
              value={settings.name}
              onChange={e => updateSettings({ name: e.target.value })}
              placeholder="John Smith"
              className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">License #</span>
            <input
              value={settings.license}
              onChange={e => updateSettings({ license: e.target.value })}
              placeholder="JW-12345"
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Company / Union</span>
            <input
              value={settings.company}
              onChange={e => updateSettings({ company: e.target.value })}
              placeholder="IBEW Local 134"
              className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
        </div>
      </div>
    )
  }

  // ── History View ──────────────────
  if (view === 'history') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('menu')} className="text-[#888] hover:text-[#f0f0f0]" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Saved Calculations</h2>
          </div>
          {savedCalcs.length > 0 && (
            <button
              onClick={() => {
                clearCalculations()
                setSavedCalcs([])
                toast.success('History cleared')
              }}
              className="text-xs text-[#ff3333] hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {savedCalcs.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#555]">No saved calculations yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {savedCalcs.map(calc => (
              <div key={calc.id} className="flex items-start justify-between border border-[#222] bg-[#111] px-3 py-2.5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6b00]">{calc.type}</span>
                    <span className="text-[9px] text-[#555]">
                      {new Date(calc.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#ccc]">{calc.label}</div>
                </div>
                <span className="shrink-0 font-mono text-xs text-[#f0f0f0]">{calc.result}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Settings View ─────────────────
  if (view === 'settings') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('menu')} className="text-[#888] hover:text-[#f0f0f0]" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Settings</h2>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between border border-[#222] bg-[#111] px-4 py-3">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-[#888]" />
              <span className="text-xs text-[#f0f0f0]">Dark Mode</span>
            </div>
            <div className="relative">
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${
                  settings.darkMode ? 'bg-[#ff6b00]' : 'bg-[#333]'
                }`}
                role="switch"
                aria-checked={settings.darkMode}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-[#f0f0f0] transition-transform ${
                    settings.darkMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border border-[#222] bg-[#111] px-4 py-3">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-[#888]" />
              <span className="text-xs text-[#f0f0f0]">Notifications</span>
            </div>
            <div className="relative">
              <button
                onClick={() => updateSettings({ notifications: !settings.notifications })}
                className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${
                  settings.notifications ? 'bg-[#ff6b00]' : 'bg-[#333]'
                }`}
                role="switch"
                aria-checked={settings.notifications}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-[#f0f0f0] transition-transform ${
                    settings.notifications ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 border border-[#ff3333]/20 bg-[#ff3333]/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#ff3333]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff3333]">Danger Zone</span>
          </div>
          <button
            onClick={() => {
              if (confirm('Clear all app data? This cannot be undone.')) {
                clearAllData()
                setSettings(getSettings())
                setSavedCalcs([])
                toast.success('All data cleared')
              }
            }}
            className="flex w-full items-center justify-center gap-2 border border-[#ff3333]/30 bg-[#ff3333]/10 py-3 text-xs font-bold uppercase tracking-wider text-[#ff3333] hover:bg-[#ff3333]/20"
          >
            <Trash2 className="h-4 w-4" /> Clear All App Data
          </button>
        </div>
      </div>
    )
  }

  // ── Main Menu ─────────────────────
  const roleLabels: Record<UserRole, { label: string; icon: typeof HardHat }> = {
    apprentice: { label: 'Apprentice', icon: HardHat },
    journeyman: { label: 'Journeyman', icon: Shield },
    foreman: { label: 'Foreman', icon: Building2 },
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Role Selector */}
      <div>
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">Your Role</h3>
        <div className="flex gap-1">
          {(Object.entries(roleLabels) as [UserRole, { label: string; icon: typeof HardHat }][]).map(([role, { label, icon: Icon }]) => (
            <button
              key={role}
              onClick={() => updateSettings({ role })}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                settings.role === role
                  ? 'bg-[#ff6b00] text-[#0f1115]'
                  : 'border border-[#333] bg-[#111] text-[#888]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[#555]">
          {settings.role === 'apprentice' && 'Opens to Tools tab by default.'}
          {settings.role === 'journeyman' && 'Opens to Tools tab by default.'}
          {settings.role === 'foreman' && 'Opens to Jobs tab by default.'}
        </p>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setView('profile')}
          className="flex items-center gap-3 border border-[#222] bg-[#111] px-4 py-3 text-left transition-colors hover:border-[#555]"
        >
          <User className="h-4 w-4 text-[#888]" />
          <div className="flex-1">
            <div className="text-xs font-medium text-[#f0f0f0]">Profile</div>
            <div className="text-[10px] text-[#666]">
              {settings.name || 'Name, license, company'}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#555]" />
        </button>

        <button
          onClick={() => { setSavedCalcs(getCalculations()); setView('history') }}
          className="flex items-center gap-3 border border-[#222] bg-[#111] px-4 py-3 text-left transition-colors hover:border-[#555]"
        >
          <History className="h-4 w-4 text-[#888]" />
          <div className="flex-1">
            <div className="text-xs font-medium text-[#f0f0f0]">Saved Calculations</div>
            <div className="text-[10px] text-[#666]">Full calculation history</div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#555]" />
        </button>

        <button
          onClick={() => setView('settings')}
          className="flex items-center gap-3 border border-[#222] bg-[#111] px-4 py-3 text-left transition-colors hover:border-[#555]"
        >
          <Clock className="h-4 w-4 text-[#888]" />
          <div className="flex-1">
            <div className="text-xs font-medium text-[#f0f0f0]">Settings</div>
            <div className="text-[10px] text-[#666]">Theme, notifications, data</div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#555]" />
        </button>
      </div>

      {/* Footer attribution */}
      <div className="mt-8 flex flex-col items-center gap-1 py-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ff6b00]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-sm font-bold tracking-wider text-[#f0f0f0]">SPARKY</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-[#333]">v1.0 -- Built by Ian Weymouth</span>
      </div>
    </div>
  )
}
