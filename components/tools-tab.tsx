'use client'

import { useState, useEffect } from 'react'
import { getRecentCalculations, type SavedCalculation } from '@/lib/storage'
import { getTipOfTheDay, type SparkTip } from '@/lib/tips'
import { CalculatorModal } from '@/components/tools/calculator-modal'
import { VoltageDropCalculator } from '@/components/tools/voltage-drop'
import { ConduitFillCalculator } from '@/components/tools/conduit-fill'
import { OhmsLawCalculator } from '@/components/tools/ohms-law'
import { PipeBendingCalculator } from '@/components/tools/pipe-bending'
import { WireSizingCalculator } from '@/components/tools/wire-sizing'
import { AmpacityCalculator } from '@/components/tools/ampacity'
import { BoxFillCalculator } from '@/components/tools/box-fill'
import {
  Zap,
  Cylinder,
  Triangle,
  Ruler,
  Cable,
  Gauge,
  Box,
  Clock,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'

type CalculatorId = 'voltage-drop' | 'conduit-fill' | 'ohms-law' | 'pipe-bending' | 'wire-sizing' | 'ampacity' | 'box-fill' | null

const CALCULATORS = [
  { id: 'voltage-drop' as const, label: 'Voltage Drop', desc: 'V, A, length, wire', icon: Zap, color: '#ff6b00' },
  { id: 'conduit-fill' as const, label: 'Conduit Fill', desc: 'Type, size, wire count', icon: Cylinder, color: '#00d4ff' },
  { id: 'ohms-law' as const, label: "Ohm's Law", desc: 'V, I, R triangle', icon: Triangle, color: '#ffaa00' },
  { id: 'pipe-bending' as const, label: 'Pipe Bending', desc: 'Offsets, 90s, saddles', icon: Ruler, color: '#ff6b00' },
  { id: 'wire-sizing' as const, label: 'Wire Sizing', desc: 'Load, distance, NEC', icon: Cable, color: '#00ff88' },
  { id: 'ampacity' as const, label: 'Ampacity', desc: 'Derating & correction', icon: Gauge, color: '#00d4ff' },
  { id: 'box-fill' as const, label: 'Box Fill', desc: 'NEC 314.16 volumes', icon: Box, color: '#ffaa00' },
] as const

export function ToolsTab() {
  const [activeCalc, setActiveCalc] = useState<CalculatorId>(null)
  const [recentCalcs, setRecentCalcs] = useState<SavedCalculation[]>([])
  const [tip, setTip] = useState<SparkTip | null>(null)

  useEffect(() => {
    setRecentCalcs(getRecentCalculations(5))
    setTip(getTipOfTheDay())
  }, [])

  // Refresh recent calcs when closing a calculator
  useEffect(() => {
    if (activeCalc === null) {
      setRecentCalcs(getRecentCalculations(5))
    }
  }, [activeCalc])

  function renderCalculator() {
    switch (activeCalc) {
      case 'voltage-drop': return <VoltageDropCalculator />
      case 'conduit-fill': return <ConduitFillCalculator />
      case 'ohms-law': return <OhmsLawCalculator />
      case 'pipe-bending': return <PipeBendingCalculator />
      case 'wire-sizing': return <WireSizingCalculator />
      case 'ampacity': return <AmpacityCalculator />
      case 'box-fill': return <BoxFillCalculator />
      default: return null
    }
  }

  function getCalcTitle() {
    return CALCULATORS.find(c => c.id === activeCalc)?.label || ''
  }

  const categoryColors: Record<string, string> = {
    safety: '#ff3333',
    code: '#00d4ff',
    technique: '#00ff88',
    tool: '#ffaa00',
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tip of the Day Banner */}
      {tip && (
        <div className="relative overflow-hidden border border-[#333] bg-[#111]">
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: categoryColors[tip.category] || '#ff6b00' }}
          />
          <div className="p-3 pl-4">
            <div className="mb-1 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-[#ffaa00]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffaa00]">
                Sparky&apos;s Tip
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#555]">{tip.category}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-[#ccc]">{tip.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#888]">{tip.body}</p>
            {tip.reference && (
              <span className="mt-1 inline-block font-mono text-[10px] text-[#555]">{tip.reference}</span>
            )}
          </div>
        </div>
      )}

      {/* Calculator Grid - Top 4 primary */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">Calculators</h2>
        <div className="grid grid-cols-2 gap-2">
          {CALCULATORS.slice(0, 4).map(calc => {
            const Icon = calc.icon
            return (
              <button
                key={calc.id}
                onClick={() => setActiveCalc(calc.id)}
                className="group flex flex-col gap-2 border border-[#333] bg-[#111] p-4 text-left transition-all duration-200 hover:border-[#555] active:scale-[0.98]"
              >
                <Icon className="h-5 w-5" style={{ color: calc.color }} />
                <div>
                  <div className="text-xs font-bold text-[#f0f0f0]">{calc.label}</div>
                  <div className="text-[10px] text-[#666]">{calc.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Secondary calculators - smaller list */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">More Tools</h2>
        <div className="flex flex-col gap-1">
          {CALCULATORS.slice(4).map(calc => {
            const Icon = calc.icon
            return (
              <button
                key={calc.id}
                onClick={() => setActiveCalc(calc.id)}
                className="flex items-center gap-3 border border-[#333] bg-[#111] p-3 text-left transition-all duration-200 hover:border-[#555] active:scale-[0.99]"
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: calc.color }} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#f0f0f0]">{calc.label}</div>
                  <div className="text-[10px] text-[#666]">{calc.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#555]" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Calculations */}
      {recentCalcs.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#888]">
            <Clock className="h-3.5 w-3.5" /> Recent Calculations
          </h2>
          <div className="flex flex-col gap-1">
            {recentCalcs.map(calc => (
              <div
                key={calc.id}
                className="flex items-center justify-between border border-[#222] bg-[#111] px-3 py-2"
              >
                <div className="flex-1">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-[#888]">{calc.type}</div>
                  <div className="text-xs text-[#ccc]">{calc.label}</div>
                </div>
                <div className="text-right font-mono text-xs text-[#ff6b00]">{calc.result}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {activeCalc && (
        <CalculatorModal title={getCalcTitle()} onClose={() => setActiveCalc(null)}>
          {renderCalculator()}
        </CalculatorModal>
      )}
    </div>
  )
}
