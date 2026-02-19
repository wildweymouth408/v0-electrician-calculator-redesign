'use client'

import { useState, useEffect } from 'react'
import { BottomNav, type TabId } from '@/components/bottom-nav'
import { ToolsTab } from '@/components/tools-tab'
import { JobsTab } from '@/components/jobs-tab'
import { CodeTab } from '@/components/code-tab'
import { MoreTab } from '@/components/more-tab'
import { getSettings, type UserRole } from '@/lib/storage'
import { Toaster } from 'sonner'

export default function SparkyApp() {
  const [activeTab, setActiveTab] = useState<TabId>('tools')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Set default tab based on user role
    const settings = getSettings()
    if (settings.role === 'foreman') {
      setActiveTab('jobs')
    }
  }, [])

  function handleRoleChange(role: UserRole) {
    if (role === 'foreman') {
      setActiveTab('jobs')
    } else {
      setActiveTab('tools')
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0f1115]">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#ff6b00]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-xs uppercase tracking-widest text-[#555]">Loading...</span>
        </div>
      </div>
    )
  }

  // Tab accent colors for the top bar
  const tabAccentColor: Record<TabId, string> = {
    tools: '#ff6b00',
    jobs: '#00d4ff',
    code: '#00ff88',
    more: '#888',
  }

  const tabTitle: Record<TabId, string> = {
    tools: 'Tools',
    jobs: 'Jobs',
    code: 'NEC Code',
    more: 'More',
  }

  return (
    <div className="flex h-dvh flex-col bg-[#0f1115] text-[#f0f0f0]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#f0f0f0',
            borderRadius: '0',
            fontSize: '12px',
          },
        }}
      />

      {/* Top header */}
      <header className="flex items-center justify-between border-b border-[#333] bg-[#0f1115] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ color: tabAccentColor[activeTab] }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-wider" style={{ color: tabAccentColor[activeTab] }}>
            Sparky
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#555]">
            / {tabTitle[activeTab]}
          </span>
        </div>

        {/* Electron flow animation in header */}
        <div className="h-1 w-16 overflow-hidden bg-[#222]">
          <div
            className="h-full w-4"
            style={{
              backgroundColor: tabAccentColor[activeTab],
              animation: 'electron-flow 1.5s linear infinite',
            }}
          />
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {activeTab === 'tools' && <ToolsTab />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'code' && <CodeTab />}
        {activeTab === 'more' && <MoreTab onRoleChange={handleRoleChange} />}
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
