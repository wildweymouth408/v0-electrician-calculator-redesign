'use client'

import { useState } from 'react'
import { calculatePipeBending, type PipeBendingInputs } from '@/lib/calculations'
import { saveCalculation, generateId, type SavedCalculation } from '@/lib/storage'
import { AttachToJob } from '@/components/tools/attach-to-job'
import { toast } from 'sonner'
import { Save, Camera } from 'lucide-react'
import { ArDemoOverlay } from './ar-demo-overlay'

export function PipeBendingCalculator() {
  const [showAR, setShowAR] = useState(false)
  const [inputs, setInputs] = useState<PipeBendingInputs>({
    bendType: 'offset',
    offsetHeight: 4,
    bendAngle: 30,
    conduitDiameter: 0.75,
  })

  const result = calculatePipeBending(inputs)

  const availableAngles = inputs.bendType === '90' ? [90] : [10, 22.5, 30, 45, 60]

  function handleSave() {
    if (!result) return
    const calc: SavedCalculation = {
      id: generateId(),
      type: 'Pipe Bending',
      label: `${result.bendType} ${inputs.offsetHeight}" offset`,
      inputs: inputs as unknown as Record<string, unknown>,
      result: `Marks: ${result.firstMark}"-${result.secondMark}" | Shrink: ${result.shrinkage}"`,
      timestamp: new Date().toISOString(),
    }
    saveCalculation(calc)
    toast.success('Calculation saved')
  }

  const jobNote = result ? `[Pipe Bending] ${result.bendType}, ${inputs.offsetHeight}" offset, Distance: ${result.distanceBetweenBends}", Shrinkage: ${result.shrinkage}"` : ''

  return (
    <div className="flex flex-col gap-5">
      {showAR && <ArDemoOverlay onClose={() => setShowAR(false)} result={result} />}

      {/* Bend type selector */}
      <div className="flex gap-1">
        {(['offset', '90', '3-point-saddle', '4-point-saddle'] as const).map(type => (
          <button
            key={type}
            onClick={() => {
              setInputs(p => ({
                ...p,
                bendType: type,
                bendAngle: type === '90' ? 90 : 30,
              }))
            }}
            className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors ${
              inputs.bendType === type
                ? 'bg-[#ff6b00] text-[#0f1115]'
                : 'border border-[#333] bg-[#111] text-[#888] hover:text-[#f0f0f0]'
            }`}
          >
            {type === 'offset' ? 'Offset' : type === '90' ? '90' : type === '3-point-saddle' ? '3-Pt' : '4-Pt'}
          </button>
        ))}
      </div>

      {/* Visual bend diagram */}
      <div className="flex justify-center">
        <svg viewBox="0 0 240 120" className="h-24 w-full max-w-[240px]">
          {inputs.bendType === 'offset' && (
            <>
              <line x1="20" y1="100" x2="80" y2="100" stroke="#ff6b00" strokeWidth="3" />
              <line x1="80" y1="100" x2="130" y2="40" stroke="#ff6b00" strokeWidth="3" />
              <line x1="130" y1="40" x2="220" y2="40" stroke="#ff6b00" strokeWidth="3" />
              {/* Dimension lines */}
              <line x1="80" y1="40" x2="80" y2="100" stroke="#555" strokeWidth="1" strokeDasharray="3" />
              <text x="70" y="72" fill="#888" fontSize="9" textAnchor="end" fontFamily="var(--font-mono)">
                {inputs.offsetHeight}"
              </text>
              {result && (
                <text x="105" y="112" fill="#ff6b00" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">
                  {result.distanceBetweenBends}" between bends
                </text>
              )}
            </>
          )}
          {inputs.bendType === '90' && (
            <>
              <line x1="120" y1="100" x2="120" y2="40" stroke="#ff6b00" strokeWidth="3" />
              <path d="M 120 40 Q 120 20 140 20" fill="none" stroke="#ff6b00" strokeWidth="3" />
              <line x1="140" y1="20" x2="220" y2="20" stroke="#ff6b00" strokeWidth="3" />
              <text x="105" y="72" fill="#888" fontSize="9" textAnchor="end" fontFamily="var(--font-mono)">
                {inputs.offsetHeight}" stub
              </text>
            </>
          )}
          {(inputs.bendType === '3-point-saddle' || inputs.bendType === '4-point-saddle') && (
            <>
              <line x1="20" y1="60" x2="70" y2="60" stroke="#ff6b00" strokeWidth="3" />
              <line x1="70" y1="60" x2="100" y2="30" stroke="#ff6b00" strokeWidth="3" />
              <line x1="100" y1="30" x2="140" y2="90" stroke="#ff6b00" strokeWidth="3" />
              <line x1="140" y1="90" x2="170" y2="60" stroke="#ff6b00" strokeWidth="3" />
              <line x1="170" y1="60" x2="220" y2="60" stroke="#ff6b00" strokeWidth="3" />
              {/* Obstacle */}
              <rect x="95" y="50" width="50" height="20" fill="#333" stroke="#555" strokeWidth="1" rx="0" />
              <text x="120" y="64" fill="#888" fontSize="8" textAnchor="middle">obstacle</text>
            </>
          )}
        </svg>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-[#888]">
            {inputs.bendType === '90' ? 'Stub-up Length (in)' : 'Offset Height (in)'}
          </span>
          <input
            type="number"
            value={inputs.offsetHeight || ''}
            onChange={e => setInputs(p => ({ ...p, offsetHeight: Number(e.target.value) }))}
            step={0.25}
            className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
          />
        </label>

        {inputs.bendType !== '90' && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Bend Angle</span>
            <select
              value={inputs.bendAngle}
              onChange={e => setInputs(p => ({ ...p, bendAngle: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              {availableAngles.map(a => <option key={a} value={a}>{a}{'\u00B0'}</option>)}
            </select>
          </label>
        )}

        {inputs.bendType === '90' && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Conduit Size (OD inches)</span>
            <select
              value={inputs.conduitDiameter}
              onChange={e => setInputs(p => ({ ...p, conduitDiameter: Number(e.target.value) }))}
              className="h-12 border border-[#333] bg-[#111] px-3 font-mono text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none"
            >
              <option value={0.5}>1/2"</option>
              <option value={0.75}>3/4"</option>
              <option value={1}>1"</option>
              <option value={1.25}>1-1/4"</option>
            </select>
          </label>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="border border-[#333] bg-[#111] p-4">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-[#888]">
            {result.bendType}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {result.distanceBetweenBends > 0 && (
              <div className="flex justify-between">
                <span className="text-[#888]">Distance between bends</span>
                <span className="font-mono font-bold text-[#ff6b00]">{result.distanceBetweenBends}"</span>
              </div>
            )}
            {result.shrinkage > 0 && (
              <div className="flex justify-between">
                <span className="text-[#888]">Shrinkage</span>
                <span className="font-mono text-[#f0f0f0]">{result.shrinkage}"</span>
              </div>
            )}
            {result.travel > 0 && (
              <div className="flex justify-between">
                <span className="text-[#888]">Travel</span>
                <span className="font-mono text-[#f0f0f0]">{result.travel}"</span>
              </div>
            )}
            <div className="mt-1 border-t border-[#333] pt-2 text-xs text-[#888]">
              Marks: {result.firstMark}"
              {result.secondMark ? `, ${result.secondMark}"` : ''}
              {result.thirdMark ? `, ${result.thirdMark}"` : ''}
              {result.fourthMark ? `, ${result.fourthMark}"` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {result && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAR(true)}
              className="flex items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#888] hover:bg-[#222]"
            >
              <Camera className="h-4 w-4" /> AR Demo
            </button>
            <button onClick={handleSave} className="flex flex-1 items-center justify-center gap-2 border border-[#333] bg-[#1a1a1a] py-3 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] hover:bg-[#222]">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
          <AttachToJob note={jobNote} />
        </div>
      )}
    </div>
  )
}
