'use client'

import { useState, useEffect } from 'react'
import { getRecentCalculations, type SavedCalculation } from '@/lib/storage'
import { getTipOfTheDay, type SparkTip } from '@/lib/tips'
import { recordToolOpen } from '@/lib/usage'
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
  Settings,
  HardHat,
  Clock,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'

type CalculatorId =
  | 'voltage-drop'
  | 'conduit-fill'
  | 'ohms-law'
  | 'pipe-bending'
  | 'wire-sizing'
  | 'ampacity'
  | 'box-fill'
  | 'motor-fla'
  | 'construction'
  | null

const CALCULATORS = [
  { id: 'voltage-drop' as const,  label: 'Voltage Drop',  desc: 'V, A, length, wire',       icon: Zap,      color: '#ff6b00' },
  { id: 'conduit-fill' as const,  label: 'Conduit Fill',  desc: 'Type, size, wire count',    icon: Cylinder, color: '#00d4ff' },
  { id: 'ohms-law' as const,      label: "Ohm's Law",     desc: 'V, I, R triangle',          icon: Triangle, color: '#ffaa00' },
  { id: 'pipe-bending' as const,  label: 'Pipe Bending',  desc: 'Offsets, 90s, saddles',     icon: Ruler,    color: '#ff6b00' },
  { id: 'wire-sizing' as const,   label: 'Wire Sizing',   desc: 'Load, distance, NEC',       icon: Cable,    color: '#00ff88' },
  { id: 'ampacity' as const,      label: 'Ampacity',      desc: 'Derating & correction',     icon: Gauge,    color: '#00d4ff' },
  { id: 'box-fill' as const,      label: 'Box Fill',      desc: 'NEC 314.16 volumes',        icon: Box,      color: '#ffaa00' },
  { id: 'motor-fla' as const,     label: 'Motor FLA',     desc: '430.248/250 tables',        icon: Settings, color: '#00d4ff' },
  { id: 'construction' as const,  label: 'Construction',  desc: 'Fractions, feet & inches',  icon: HardHat,  color: '#ffaa00' },
] as const

// ── Inline Motor FLA Calculator ───────────────────────────────────────────────

const MOTOR_FLA_1PH: Record<string, Record<number, number>> = {
  "0.5":  { 115: 9.8,  200: 5.6,  208: 5.4,  230: 4.9 },
  "0.75": { 115: 13.8, 200: 7.9,  208: 7.6,  230: 6.9 },
  "1":    { 115: 16.0, 200: 9.2,  208: 8.8,  230: 8.0 },
  "1.5":  { 115: 20.0, 200: 11.5, 208: 11.0, 230: 10.0 },
  "2":    { 115: 24.0, 200: 13.8, 208: 13.2, 230: 12.0 },
  "3":    { 115: 34.0, 200: 19.6, 208: 18.7, 230: 17.0 },
  "5":    { 115: 56.0, 200: 32.2, 208: 30.8, 230: 28.0 },
  "7.5":  { 200: 46.0, 208: 44.0, 230: 40.0 },
  "10":   { 200: 64.0, 208: 61.0, 230: 50.0 },
}

const MOTOR_FLA_3PH: Record<string, Record<number, number>> = {
  "0.5":  { 200: 2.5,  208: 2.4,  230: 2.2,  460: 1.1,  575: 0.9 },
  "0.75": { 200: 3.7,  208: 3.5,  230: 3.2,  460: 1.6,  575: 1.3 },
  "1":    { 200: 4.8,  208: 4.6,  230: 4.2,  460: 2.1,  575: 1.7 },
  "1.5":  { 200: 6.9,  208: 6.6,  230: 6.0,  460: 3.0,  575: 2.4 },
  "2":    { 200: 7.8,  208: 7.5,  230: 6.8,  460: 3.4,  575: 2.7 },
  "3":    { 200: 11.0, 208: 10.6, 230: 9.6,  460: 4.8,  575: 3.9 },
  "5":    { 200: 17.5, 208: 16.7, 230: 15.2, 460: 7.6,  575: 6.1 },
  "7.5":  { 200: 25.3, 208: 24.2, 230: 22.0, 460: 11.0, 575: 9.0 },
  "10":   { 200: 32.2, 208: 30.8, 230: 28.0, 460: 14.0, 575: 11.0 },
  "15":   { 200: 48.3, 208: 46.2, 230: 42.0, 460: 21.0, 575: 17.0 },
  "20":   { 200: 62.1, 208: 59.4, 230: 54.0, 460: 27.0, 575: 22.0 },
  "25":   { 200: 78.2, 208: 74.8, 230: 68.0, 460: 34.0, 575: 27.0 },
  "30":   { 200: 92.0, 208: 88.0, 230: 80.0, 460: 40.0, 575: 32.0 },
  "40":   { 200: 120,  208: 114,  230: 104,  460: 52.0, 575: 41.0 },
  "50":   { 200: 150,  208: 143,  230: 130,  460: 65.0, 575: 52.0 },
  "60":   { 200: 177,  208: 169,  230: 154,  460: 77.0, 575: 62.0 },
  "75":   { 200: 221,  208: 211,  230: 192,  460: 96.0, 575: 77.0 },
  "100":  { 200: 285,  208: 273,  230: 248,  460: 124,  575: 99.0 },
}

function MotorFLACalculator() {
  const [phase, setPhase] = useState('3')
  const [hp, setHp] = useState('5')
  const [voltage, setVoltage] = useState('460')

  const table = phase === '1' ? MOTOR_FLA_1PH : MOTOR_FLA_3PH
  const hpOptions = Object.keys(table)
  const voltageOptions = phase === '1'
    ? ['115', '200', '208', '230']
    : ['200', '208', '230', '460', '575']
  const safeVoltage = voltageOptions.includes(voltage) ? voltage : voltageOptions[voltageOptions.length - 2]
  const fla = table[hp]?.[parseInt(safeVoltage)] || 0

  const sel = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-2.5 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none appearance-none'
  const lbl = 'block text-[10px] uppercase tracking-wider text-[#555] mb-1'

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Phase</label>
          <select className={sel} value={phase} onChange={e => { setPhase(e.target.value); setVoltage(e.target.value === '1' ? '230' : '460') }}>
            <option value="1">1Ø</option>
            <option value="3">3Ø</option>
          </select>
        </div>
        <div>
          <label className={lbl}>HP</label>
          <select className={sel} value={hp} onChange={e => setHp(e.target.value)}>
            {hpOptions.map(h => <option key={h} value={h}>{h} HP</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Voltage</label>
          <select className={sel} value={safeVoltage} onChange={e => setVoltage(e.target.value)}>
            {voltageOptions.map(v => <option key={v} value={v}>{v}V</option>)}
          </select>
        </div>
      </div>

      {fla > 0 ? (
        <div className="bg-[#0a0b0e] border border-[#1a3025] border-l-4 border-l-[#00ff88] p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-[#888]">Full Load Amps</span><span className="font-bold text-[#00d4ff] font-mono">{fla} A</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Wire (125% FLA)</span><span className="font-bold text-[#ffaa00] font-mono">{(fla * 1.25).toFixed(1)} A min</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Breaker (250% FLA)</span><span className="font-bold text-[#00ff88] font-mono">{(fla * 2.5).toFixed(1)} A max</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Overload (115%)</span><span className="font-mono text-[#f0f0f0]">{(fla * 1.15).toFixed(2)} A</span></div>
          <div className="text-[10px] text-[#444] pt-1">NEC 430.22 (wire) · 430.52 (breaker) · 430.32 (overload)</div>
        </div>
      ) : (
        <div className="text-sm text-[#555] text-center py-4">No NEC table data for this combination</div>
      )}
    </div>
  )
}

// ── Inline Construction Calculator ───────────────────────────────────────────

function ConstructionCalculator() {
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [num, setNum] = useState('')
  const [den, setDen] = useState('')

  const inp = 'w-full bg-[#0a0b0e] border border-[#2a2a35] px-3 py-2.5 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none font-mono'
  const lbl = 'block text-[10px] uppercase tracking-wider text-[#555] mb-1'

  const result = (() => {
    const d = parseInt(den)
    if (!d) return null
    const n = parseInt(num) || 0
    const ft = parseInt(feet) || 0
    const inch = parseInt(inches) || 0
    const totalInches = ft * 12 + inch + n / d
    return {
      totalInches: totalInches.toFixed(4),
      totalFeet: (totalInches / 12).toFixed(6),
      mm: (totalInches * 25.4).toFixed(2),
    }
  })()

  return (
    <div className="flex flex-col gap-4 p-1">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Fraction → Decimal</div>
        <div className="grid grid-cols-4 gap-2">
          <div><label className={lbl}>Feet</label><input type="number" className={inp} value={feet} onChange={e => setFeet(e.target.value)} placeholder="0" /></div>
          <div><label className={lbl}>Inches</label><input type="number" className={inp} value={inches} onChange={e => setInches(e.target.value)} placeholder="0" /></div>
          <div><label className={lbl}>Num</label><input type="number" className={inp} value={num} onChange={e => setNum(e.target.value)} placeholder="3" /></div>
          <div><label className={lbl}>Den</label><input type="number" className={inp} value={den} onChange={e => setDen(e.target.value)} placeholder="8" /></div>
        </div>
      </div>

      {result && (
        <div className="bg-[#0a0b0e] border border-[#1a3025] border-l-4 border-l-[#00ff88] p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-[#888]">Decimal Inches</span><span className="font-bold text-[#00ff88] font-mono">{result.totalInches}"</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Decimal Feet</span><span className="font-bold text-[#00d4ff] font-mono">{result.totalFeet}'</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Millimeters</span><span className="font-mono text-[#f0f0f0]">{result.mm} mm</span></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#555]">
        {[['1/8','0.125'],['1/4','0.25'],['3/8','0.375'],['1/2','0.5'],['5/8','0.625'],['3/4','0.75'],['7/8','0.875']].map(([f,d]) => (
          <div key={f} className="flex justify-between bg-[#0a0b0e] border border-[#1e2028] px-2 py-1">
            <span>{f}"</span><span className="text-[#444]">{d}"</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ToolsTabProps {
  initialToolId?: string | null
}

export function ToolsTab({ initialToolId }: ToolsTabProps) {
  const [activeCalc, setActiveCalc] = useState<CalculatorId>(null)
  const [recentCalcs, setRecentCalcs] = useState<SavedCalculation[]>([])
  const [tip, setTip] = useState<SparkTip | null>(null)

  useEffect(() => {
    setRecentCalcs(getRecentCalculations(5))
    setTip(getTipOfTheDay())
  }, [])

  // Support deep-linking from Home tab Quick Actions
  useEffect(() => {
    if (initialToolId && CALCULATORS.find(c => c.id === initialToolId)) {
      openCalc(initialToolId as CalculatorId)
    }
  }, [initialToolId])

  useEffect(() => {
    if (activeCalc === null) setRecentCalcs(getRecentCalculations(5))
  }, [activeCalc])

  function openCalc(id: CalculatorId) {
    if (id) recordToolOpen(id)
    setActiveCalc(id)
  }

  function renderCalculator() {
    switch (activeCalc) {
      case 'voltage-drop':  return <VoltageDropCalculator />
      case 'conduit-fill':  return <ConduitFillCalculator />
      case 'ohms-law':      return <OhmsLawCalculator />
      case 'pipe-bending':  return <PipeBendingCalculator />
      case 'wire-sizing':   return <WireSizingCalculator />
      case 'ampacity':      return <AmpacityCalculator />
      case 'box-fill':      return <BoxFillCalculator />
      case 'motor-fla':     return <MotorFLACalculator />
      case 'construction':  return <ConstructionCalculator />
      default:              return null
    }
  }

  const getCalcTitle = () => CALCULATORS.find(c => c.id === activeCalc)?.label || ''

  const categoryColors: Record<string, string> = {
    safety: '#ff3333', code: '#00d4ff', technique: '#00ff88', tool: '#ffaa00',
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tip of the Day */}
      {tip && (
        <div className="relative overflow-hidden border border-[#333] bg-[#111]">
          <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: categoryColors[tip.category] || '#ff6b00' }} />
          <div className="p-3 pl-4">
            <div className="mb-1 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-[#ffaa00]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffaa00]">Sparky's Tip</span>
              <span className="text-[10px] uppercase tracking-wider text-[#555]">{tip.category}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-[#ccc]">{tip.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#888]">{tip.body}</p>
            {tip.reference && <span className="mt-1 inline-block font-mono text-[10px] text-[#555]">{tip.reference}</span>}
          </div>
        </div>
      )}

      {/* Primary calculators grid */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">Calculators</h2>
        <div className="grid grid-cols-2 gap-2">
          {CALCULATORS.slice(0, 4).map(calc => {
            const Icon = calc.icon
            return (
              <button key={calc.id} onClick={() => openCalc(calc.id)}
                className="group flex flex-col gap-2 border border-[#333] bg-[#111] p-4 text-left transition-all duration-200 hover:border-[#555] active:scale-[0.98]">
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

      {/* Secondary calculators list */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">More Tools</h2>
        <div className="flex flex-col gap-1">
          {CALCULATORS.slice(4).map(calc => {
            const Icon = calc.icon
            return (
              <button key={calc.id} onClick={() => openCalc(calc.id)}
                className="flex items-center gap-3 border border-[#333] bg-[#111] p-3 text-left transition-all duration-200 hover:border-[#555] active:scale-[0.99]">
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
              <div key={calc.id} className="flex items-center justify-between border border-[#222] bg-[#111] px-3 py-2">
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
