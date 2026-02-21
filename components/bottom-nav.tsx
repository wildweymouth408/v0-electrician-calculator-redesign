'use client'

import { Zap, BookOpen, Calculator, MessageCircle, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'tools' | 'code' | 'calcs' | 'symbols' | 'sparky'

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: typeof Zap; accentColor: string; activeColor: string }[] = [
  { id: 'tools', label: 'Tools', icon: Zap, accentColor: 'text-[#ff6b00]', activeColor: '#ff6b00' },
  { id: 'code', label: 'Code', icon: BookOpen, accentColor: 'text-[#00ff88]', activeColor: '#00ff88' },
  { id: 'calcs', label: 'Calcs', icon: Calculator, accentColor: 'text-[#00d4ff]', activeColor: '#00d4ff' },
  { id: 'symbols', label: 'Symbols', icon: Grid3X3, accentColor: 'text-[#ffaa00]', activeColor: '#ffaa00' },
  { id: 'sparky', label: 'Ask AI', icon: MessageCircle, accentColor: 'text-[#ff6b00]', activeColor: '#ff6b00' },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-[#333] bg-[#0f1115]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="tablist"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors duration-200',
              isActive ? tab.accentColor : 'text-[#555]'
            )}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 transition-all duration-300"
                style={{ backgroundColor: tab.activeColor }}
              />
            )}
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
            <span className={cn(
              'text-[10px] font-medium uppercase tracking-wider',
              isActive ? 'opacity-100' : 'opacity-50'
            )}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
