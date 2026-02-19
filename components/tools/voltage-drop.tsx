'use client'

import { useState } from 'react'
import { calculateVoltageDrop, type VoltageDropInputs } from '@/lib/calculations'
import { WIRE_SIZES, SYSTEM_VOLTAGES } from '@/lib/calculator-data'
import { saveCalculation, generateId, type SavedCalculation } from '@/lib/storage'
import { AttachToJob } from '@/components/tools/attach-to-job'
import { toast } from 'sonner'
import { Check, X, Save } from 'lucide-react'

export function VoltageDropCalculator() {
  const [inputs, setInputs] = useState<VoltageDropInputs>({
    systemVoltage: 120,
    current: 20,
    distance: 100,
    wireSize: '12',
    material: 'copper',
    phase: 'single',
  })

  const result = calculateVoltageDrop(inputs)
  const hasResult = inputs.current > 0 && inputs.distance > 0

  function handleSave() {
    const calc: SavedCalculation = {
      id: generateId(),
      type: 'Voltage Drop',
      label: `${inputs.systemVoltage}V ${inputs.current}A ${inputs.distance}ft #${inputs.wireSize} ${inputs.material}`,
      inputs: inputs as unknown as Record<string, unknown>,
      result: `${result.dropPercent}% (${result.pass ? 'PASS' : 'FAIL'})`,
      timestamp: new Date().toISOString(),
    }
    saveCalculation(calc)
    toast.success('Calculation saved')
  }

  const jobNote = `[Voltage Drop] ${inputs.systemVoltage}V, ${inputs.current}A, ${inputs.distance}ft, #${inputs.wireSize} ${inputs.material === 'copper' ? 'Cu' : 'Al'} = ${result.voltageDrop}V / ${result.dropPercent}% (${result.pass ? 'PASS' : 'FAIL'})`

  return (
    <div className="flex flex-col gap-5">
      {/* Animated wire SVG */}
      <div className="relative h-12 w-full overflow-hidden">
        <svg viewBox="0 0 400 48" className="h-full w-full" preserveAspectRatio="none">
          <line x1="0" y1="24" x2="400" y2="24" stroke="#333" strokeWidth="2" />
          <line
            x1="0" y1="24" x2="400" y2="24"
            stroke="#ff6b00"
            strokeWidth="2"
            strokeDasharray="4 8"
            style={{ animation: 'electron-flow 0.8s linear infinite' }}
          />
          {hasResult && (
            <text x="200" y="14" textAnchor="middle" fill="#888" fontSize="10" fontFamily="var(--font-mono)">
              {result.voltageDrop}V drop over {inputs.distance}ft
            </text>
          )}
        </svg>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
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
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Phase</span>
            <select
              value={inputs.phase}
              onChange={e => setInputs(p => ({ ...p, phase: e.target.value as 'single' | 'three' }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              <option value="single">1-Phase</option>
              <option value="three">3-Phase</option>
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Current (A)</span>
            <input
              type="number"
              value={inputs.current || ''}
              onChange={e => setInputs(p => ({ ...p, current: Number(e.target.value) }))}
              placeholder="20"
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Distance (ft)</span>
            <input
              type="number"
              value={inputs.distance || ''}
              onChange={e => setInputs(p => ({ ...p, distance: Number(e.target.value) }))}
              placeholder="100"
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Wire Size</span>
            <select
              value={inputs.wireSize}
              onChange={e => setInputs(p => ({ ...p, wireSize: e.target.value }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {WIRE_SIZES.map(s => <option key={s} value={s}>#{s} AWG</option>)}
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
      </div>

      {/* Results */}
      {hasResult && (
        <div className="border border-[#333] bg-[#111] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Result</span>
            <span className={`flex items-center gap-1.5 border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
              result.pass
                ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]'
                : 'border-[#ff3333]/30 bg-[#ff3333]/10 text-[#ff3333]'
            }`}>
              {result.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {result.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-[#ff6b00]">{result.dropPercent}%</span>
            <span className="text-sm text-[#888]">voltage drop</span>
          </div>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-xl text-[#f0f0f0]">{result.voltageDrop}V</span>
            <span className="text-sm text-[#888]">of {inputs.systemVoltage}V</span>
          </div>
          <p className="text-xs text-[#888]">{result.recommendation}</p>
        </div>
      )}

      {/* Actions */}
      {hasResult && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] py-3 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] transition-colors hover:bg-[#222]"
          >
            <Save className="h-4 w-4" /> Save Calculation
          </button>
          <AttachToJob note={jobNote} />
        </div>
      )}
    </div>
  )
}
