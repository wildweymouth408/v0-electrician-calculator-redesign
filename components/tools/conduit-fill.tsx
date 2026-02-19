'use client'

import { useState } from 'react'
import { calculateConduitFill, type ConduitFillInputs } from '@/lib/calculations'
import { CONDUIT_TYPES, CONDUIT_TRADE_SIZES, INSULATION_TYPES, COMMON_WIRE_SIZES } from '@/lib/calculator-data'
import { saveCalculation, generateId, type SavedCalculation } from '@/lib/storage'
import { AttachToJob } from '@/components/tools/attach-to-job'
import { toast } from 'sonner'
import { Check, X, Save } from 'lucide-react'

export function ConduitFillCalculator() {
  const [inputs, setInputs] = useState<ConduitFillInputs>({
    conduitType: 'EMT',
    tradeSize: '3/4',
    wireType: 'THHN',
    wireSize: '12',
    wireCount: 3,
  })

  const result = calculateConduitFill(inputs)
  const hasResult = inputs.wireCount > 0

  function handleSave() {
    const calc: SavedCalculation = {
      id: generateId(),
      type: 'Conduit Fill',
      label: `${inputs.conduitType} ${inputs.tradeSize}" ${inputs.wireCount}x #${inputs.wireSize} ${inputs.wireType}`,
      inputs: inputs as unknown as Record<string, unknown>,
      result: `${result.fillPercent}% (${result.pass ? 'PASS' : 'FAIL'})`,
      timestamp: new Date().toISOString(),
    }
    saveCalculation(calc)
    toast.success('Calculation saved')
  }

  const jobNote = `[Conduit Fill] ${inputs.conduitType} ${inputs.tradeSize}", ${inputs.wireCount}x #${inputs.wireSize} ${inputs.wireType} = ${result.fillPercent}% fill (${result.pass ? 'PASS' : 'FAIL'})`

  return (
    <div className="flex flex-col gap-5">
      {/* Visual conduit fill bar */}
      {hasResult && (
        <div className="relative h-16 border border-[#333] bg-[#111]">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-500"
            style={{
              width: `${Math.min(result.fillPercent / (result.fillLimit || 40) * 100, 100)}%`,
              backgroundColor: result.pass ? '#ff6b00' : '#ff3333',
              opacity: 0.3,
            }}
          />
          <div className="relative flex h-full items-center justify-center">
            <span className="font-mono text-2xl font-bold text-[#f0f0f0]">{result.fillPercent}%</span>
            <span className="ml-2 text-xs text-[#888]">of {result.fillLimit}% limit</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Conduit Type</span>
            <select
              value={inputs.conduitType}
              onChange={e => setInputs(p => ({ ...p, conduitType: e.target.value as typeof inputs.conduitType }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {CONDUIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Trade Size</span>
            <select
              value={inputs.tradeSize}
              onChange={e => setInputs(p => ({ ...p, tradeSize: e.target.value }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {CONDUIT_TRADE_SIZES.map(s => <option key={s} value={s}>{s}"</option>)}
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Wire Type</span>
            <select
              value={inputs.wireType}
              onChange={e => setInputs(p => ({ ...p, wireType: e.target.value }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {INSULATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
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
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-[#888]">Wire Count</span>
          <input
            type="number"
            value={inputs.wireCount || ''}
            onChange={e => setInputs(p => ({ ...p, wireCount: Number(e.target.value) }))}
            min={1}
            placeholder="3"
            className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
          />
        </label>
      </div>

      {hasResult && result.totalWireArea > 0 && (
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

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Total wire area</span>
              <span className="font-mono text-[#f0f0f0]">{result.totalWireArea} sq.in.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Allowable area ({result.fillLimit}%)</span>
              <span className="font-mono text-[#f0f0f0]">{result.allowableArea} sq.in.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Remaining capacity</span>
              <span className="font-mono text-[#f0f0f0]">{result.remainingArea} sq.in.</span>
            </div>
          </div>
        </div>
      )}

      {hasResult && result.totalWireArea > 0 && (
        <div className="flex flex-col gap-2">
          <button onClick={handleSave} className="flex items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] py-3 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] hover:bg-[#222]">
            <Save className="h-4 w-4" /> Save Calculation
          </button>
          <AttachToJob note={jobNote} />
        </div>
      )}
    </div>
  )
}
