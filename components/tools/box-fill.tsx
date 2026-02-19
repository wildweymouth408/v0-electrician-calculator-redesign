'use client'

import { useState } from 'react'
import { calculateBoxFill, type BoxFillInputs } from '@/lib/calculations'
import { STANDARD_BOXES, COMMON_WIRE_SIZES } from '@/lib/calculator-data'
import { saveCalculation, generateId, type SavedCalculation } from '@/lib/storage'
import { AttachToJob } from '@/components/tools/attach-to-job'
import { toast } from 'sonner'
import { Check, X, Save, Plus, Minus } from 'lucide-react'

export function BoxFillCalculator({ compact = false }: { compact?: boolean }) {
  const [boxType, setBoxType] = useState('4x2.125-sq')
  const [customVolume, setCustomVolume] = useState(30)
  const [conductors, setConductors] = useState([{ size: '14', count: 4 }])
  const [clamps, setClamps] = useState(1)
  const [supportFittings, setSupportFittings] = useState(0)
  const [devices, setDevices] = useState(1)
  const [equipmentGrounds, setEquipmentGrounds] = useState(2)
  const [largestGroundSize, setLargestGroundSize] = useState('14')

  const inputs: BoxFillInputs = {
    boxType,
    customVolume: boxType === 'custom' ? customVolume : undefined,
    conductors,
    clamps,
    supportFittings,
    devices,
    equipmentGrounds,
    largestGroundSize,
  }

  const result = calculateBoxFill(inputs)

  function addConductorRow() {
    setConductors(p => [...p, { size: '14', count: 1 }])
  }

  function removeConductorRow(idx: number) {
    setConductors(p => p.filter((_, i) => i !== idx))
  }

  function updateConductor(idx: number, key: 'size' | 'count', value: string | number) {
    setConductors(p => p.map((c, i) => i === idx ? { ...c, [key]: value } : c))
  }

  function handleSave() {
    const calc: SavedCalculation = {
      id: generateId(),
      type: 'Box Fill',
      label: `${STANDARD_BOXES[boxType]?.description || 'Custom'} box`,
      inputs: inputs as unknown as Record<string, unknown>,
      result: `${result.totalRequired} / ${result.boxCapacity} cu.in. (${result.pass ? 'PASS' : 'FAIL'})`,
      timestamp: new Date().toISOString(),
    }
    saveCalculation(calc)
    toast.success('Calculation saved')
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-[#888]">Box Type</span>
          <select
            value={boxType}
            onChange={e => setBoxType(e.target.value)}
            className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
          >
            {Object.entries(STANDARD_BOXES).map(([key, box]) => (
              <option key={key} value={key}>{box.description} ({box.volume} cu.in.)</option>
            ))}
            <option value="custom">Custom Volume</option>
          </select>
        </label>

        {boxType === 'custom' && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Custom Volume (cu.in.)</span>
            <input
              type="number"
              value={customVolume || ''}
              onChange={e => setCustomVolume(Number(e.target.value))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
        )}

        {/* Conductors */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Conductors</span>
            <button onClick={addConductorRow} className="flex items-center gap-1 text-xs text-[#ff6b00] hover:text-[#ff8533]">
              <Plus className="h-3 w-3" /> Add Size
            </button>
          </div>
          {conductors.map((c, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <select
                value={c.size}
                onChange={e => updateConductor(i, 'size', e.target.value)}
                className="h-10 flex-1 border border-[#333] bg-[#111] px-2 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
              >
                {COMMON_WIRE_SIZES.slice(0, 8).map(s => <option key={s} value={s}>#{s}</option>)}
              </select>
              <input
                type="number"
                value={c.count || ''}
                onChange={e => updateConductor(i, 'count', Number(e.target.value))}
                min={0}
                placeholder="Qty"
                className="h-10 w-16 border border-[#333] bg-[#111] px-2 text-center font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
              />
              {conductors.length > 1 && (
                <button onClick={() => removeConductorRow(i)} className="text-[#555] hover:text-[#ff3333]">
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Other fills */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Clamps</span>
            <input
              type="number"
              value={clamps}
              onChange={e => setClamps(Number(e.target.value))}
              min={0}
              className="h-10 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Devices</span>
            <input
              type="number"
              value={devices}
              onChange={e => setDevices(Number(e.target.value))}
              min={0}
              className="h-10 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Support Fittings</span>
            <input
              type="number"
              value={supportFittings}
              onChange={e => setSupportFittings(Number(e.target.value))}
              min={0}
              className="h-10 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">EGC Count</span>
            <input
              type="number"
              value={equipmentGrounds}
              onChange={e => setEquipmentGrounds(Number(e.target.value))}
              min={0}
              className="h-10 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-[#888]">Largest Ground Size</span>
          <select
            value={largestGroundSize}
            onChange={e => setLargestGroundSize(e.target.value)}
            className="h-10 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
          >
            {COMMON_WIRE_SIZES.slice(0, 8).map(s => <option key={s} value={s}>#{s}</option>)}
          </select>
        </label>
      </div>

      {/* Results */}
      <div className="border border-[#333] bg-[#111] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#888]">Box Fill Result</span>
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
          <span className="font-mono text-2xl font-bold text-[#ff6b00]">{result.totalRequired}</span>
          <span className="text-sm text-[#888]">of {result.boxCapacity} cu.in.</span>
        </div>

        {/* Volume fill bar */}
        <div className="mb-3 h-3 w-full border border-[#333] bg-[#0a0b0d]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min((result.totalRequired / result.boxCapacity) * 100, 100)}%`,
              backgroundColor: result.pass ? '#ff6b00' : '#ff3333',
            }}
          />
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between"><span className="text-[#888]">Conductors</span><span className="font-mono text-[#f0f0f0]">{result.conductorVolume} cu.in.</span></div>
          <div className="flex justify-between"><span className="text-[#888]">Clamps</span><span className="font-mono text-[#f0f0f0]">{result.clampVolume} cu.in.</span></div>
          <div className="flex justify-between"><span className="text-[#888]">Devices</span><span className="font-mono text-[#f0f0f0]">{result.deviceVolume} cu.in.</span></div>
          <div className="flex justify-between"><span className="text-[#888]">Grounds</span><span className="font-mono text-[#f0f0f0]">{result.groundVolume} cu.in.</span></div>
          <div className="flex justify-between"><span className="text-[#888]">Remaining</span><span className={`font-mono ${result.remainingVolume >= 0 ? 'text-[#00ff88]' : 'text-[#ff3333]'}`}>{result.remainingVolume} cu.in.</span></div>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col gap-2">
          <button onClick={handleSave} className="flex items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] py-3 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] hover:bg-[#222]">
            <Save className="h-4 w-4" /> Save Calculation
          </button>
          <AttachToJob note={`[Box Fill] ${STANDARD_BOXES[boxType]?.description || 'Custom'}: ${result.totalRequired} / ${result.boxCapacity} cu.in. (${result.pass ? 'PASS' : 'FAIL'})`} />
        </div>
      )}
    </div>
  )
}
