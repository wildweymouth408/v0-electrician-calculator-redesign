'use client'

import { useState } from 'react'
import { calculateWireSizing, type WireSizingInputs } from '@/lib/calculations'
import { SYSTEM_VOLTAGES, INSULATION_TYPES } from '@/lib/calculator-data'
import { saveCalculation, generateId, type SavedCalculation } from '@/lib/storage'
import { AttachToJob } from '@/components/tools/attach-to-job'
import { toast } from 'sonner'
import { Check, X, Save } from 'lucide-react'

export function WireSizingCalculator({ compact = false }: { compact?: boolean }) {
  const [inputs, setInputs] = useState<WireSizingInputs>({
    loadAmps: 20,
    distance: 100,
    systemVoltage: 120,
    material: 'copper',
    insulationType: 'THHN',
    maxDropPercent: 3,
  })

  const result = calculateWireSizing(inputs)

  function handleSave() {
    if (!result) return
    const calc: SavedCalculation = {
      id: generateId(),
      type: 'Wire Sizing',
      label: `${inputs.loadAmps}A ${inputs.distance}ft ${inputs.systemVoltage}V`,
      inputs: inputs as unknown as Record<string, unknown>,
      result: `#${result.recommendedSize} (${result.dropPercent}%)`,
      timestamp: new Date().toISOString(),
    }
    saveCalculation(calc)
    toast.success('Calculation saved')
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Load (A)</span>
            <input
              type="number"
              value={inputs.loadAmps || ''}
              onChange={e => setInputs(p => ({ ...p, loadAmps: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Distance (ft)</span>
            <input
              type="number"
              value={inputs.distance || ''}
              onChange={e => setInputs(p => ({ ...p, distance: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Voltage</span>
            <select
              value={inputs.systemVoltage}
              onChange={e => setInputs(p => ({ ...p, systemVoltage: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {SYSTEM_VOLTAGES.map(v => <option key={v} value={v}>{v}V</option>)}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Material</span>
            <select
              value={inputs.material}
              onChange={e => setInputs(p => ({ ...p, material: e.target.value as 'copper' | 'aluminum' }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Insulation</span>
            <select
              value={inputs.insulationType}
              onChange={e => setInputs(p => ({ ...p, insulationType: e.target.value }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {INSULATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Max Drop %</span>
            <select
              value={inputs.maxDropPercent}
              onChange={e => setInputs(p => ({ ...p, maxDropPercent: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              <option value={3}>3% (Branch)</option>
              <option value={5}>5% (Total)</option>
            </select>
          </label>
        </div>
      </div>

      {result && (
        <div className="border border-[#333] bg-[#111] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Recommended Wire</span>
            <span className={`flex items-center gap-1.5 border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
              result.pass
                ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]'
                : 'border-[#ff3333]/30 bg-[#ff3333]/10 text-[#ff3333]'
            }`}>
              {result.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {result.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-[#ff6b00]">#{result.recommendedSize}</span>
            <span className="text-sm text-[#888]">AWG</span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Ampacity</span>
              <span className="font-mono text-[#f0f0f0]">{result.ampacity}A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Voltage drop</span>
              <span className="font-mono text-[#f0f0f0]">{result.voltageDrop}V ({result.dropPercent}%)</span>
            </div>
          </div>
        </div>
      )}

      {result && !compact && (
        <div className="flex flex-col gap-2">
          <button onClick={handleSave} className="flex items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] py-3 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] hover:bg-[#222]">
            <Save className="h-4 w-4" /> Save Calculation
          </button>
          <AttachToJob note={`[Wire Sizing] ${inputs.loadAmps}A, ${inputs.distance}ft, ${inputs.systemVoltage}V = #${result.recommendedSize} AWG (${result.dropPercent}% drop)`} />
        </div>
      )}
    </div>
  )
}
