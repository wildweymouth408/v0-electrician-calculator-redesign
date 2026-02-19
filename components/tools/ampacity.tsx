'use client'

import { useState } from 'react'
import { calculateAmpacity, type AmpacityInputs } from '@/lib/calculations'
import { COMMON_WIRE_SIZES, INSULATION_TYPES } from '@/lib/calculator-data'
import { saveCalculation, generateId, type SavedCalculation } from '@/lib/storage'
import { AttachToJob } from '@/components/tools/attach-to-job'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export function AmpacityCalculator({ compact = false }: { compact?: boolean }) {
  const [inputs, setInputs] = useState<AmpacityInputs>({
    wireSize: '12',
    insulationType: 'THHN',
    material: 'copper',
    ambientTemp: 30,
    conductorsInRaceway: 3,
  })

  const result = calculateAmpacity(inputs)

  function handleSave() {
    if (!result) return
    const calc: SavedCalculation = {
      id: generateId(),
      type: 'Ampacity',
      label: `#${inputs.wireSize} ${inputs.insulationType} ${inputs.material}`,
      inputs: inputs as unknown as Record<string, unknown>,
      result: `${result.correctedAmpacity}A (corrected)`,
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
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Wire Size</span>
            <select
              value={inputs.wireSize}
              onChange={e => setInputs(p => ({ ...p, wireSize: e.target.value }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {COMMON_WIRE_SIZES.map(s => <option key={s} value={s}>#{s}</option>)}
            </select>
          </label>
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
        </div>

        <div className="flex gap-3">
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
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">{'Ambient Temp (\u00B0C)'}</span>
            <input
              type="number"
              value={inputs.ambientTemp || ''}
              onChange={e => setInputs(p => ({ ...p, ambientTemp: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-[#888]">Conductors in Raceway</span>
          <input
            type="number"
            value={inputs.conductorsInRaceway || ''}
            onChange={e => setInputs(p => ({ ...p, conductorsInRaceway: Number(e.target.value) }))}
            min={1}
            className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
          />
        </label>
      </div>

      {result && (
        <div className="border border-[#333] bg-[#111] p-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-[#888]">Ampacity Result</div>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-[#ff6b00]">{result.correctedAmpacity}A</span>
            <span className="text-sm text-[#888]">corrected</span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Base ampacity ({result.tempRating}{'\u00B0C'})</span>
              <span className="font-mono text-[#f0f0f0]">{result.baseAmpacity}A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Temp correction</span>
              <span className="font-mono text-[#f0f0f0]">{'\u00D7'}{result.tempCorrectionFactor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Conduit derating</span>
              <span className="font-mono text-[#f0f0f0]">{'\u00D7'}{result.conduitDerating}</span>
            </div>
          </div>
        </div>
      )}

      {result && !compact && (
        <div className="flex flex-col gap-2">
          <button onClick={handleSave} className="flex items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] py-3 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] hover:bg-[#222]">
            <Save className="h-4 w-4" /> Save Calculation
          </button>
          <AttachToJob note={`[Ampacity] #${inputs.wireSize} ${inputs.insulationType} ${inputs.material} = ${result.correctedAmpacity}A corrected (${result.baseAmpacity}A base)`} />
        </div>
      )}
    </div>
  )
}
