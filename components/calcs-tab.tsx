'use client'

import { useState, useMemo } from 'react'
import {
  Zap, Settings, Circle, Box, Triangle, HardHat, Plus, Minus, RotateCcw, AlertTriangle, CheckCircle, ChevronRight
} from 'lucide-react'

// ─── DATA TABLES ────────────────────────────────────────────────────────────

const WIRE_RESISTANCE: Record<string, { copper: number; aluminum: number }> = {
  "14": { copper: 3.07, aluminum: 5.06 },
  "12": { copper: 1.93, aluminum: 3.18 },
  "10": { copper: 1.21, aluminum: 2.00 },
  "8":  { copper: 0.764, aluminum: 1.26 },
  "6":  { copper: 0.491, aluminum: 0.808 },
  "4":  { copper: 0.308, aluminum: 0.508 },
  "3":  { copper: 0.245, aluminum: 0.403 },
  "2":  { copper: 0.194, aluminum: 0.319 },
  "1":  { copper: 0.154, aluminum: 0.253 },
  "1/0":{ copper: 0.122, aluminum: 0.201 },
  "2/0":{ copper: 0.0967,aluminum: 0.159 },
  "3/0":{ copper: 0.0766,aluminum: 0.126 },
  "4/0":{ copper: 0.0608,aluminum: 0.100 },
  "250":{ copper: 0.0515,aluminum: 0.0848 },
  "300":{ copper: 0.0429,aluminum: 0.0706 },
  "350":{ copper: 0.0367,aluminum: 0.0605 },
  "400":{ copper: 0.0321,aluminum: 0.0529 },
  "500":{ copper: 0.0258,aluminum: 0.0426 },
}

const WIRE_AMPACITY: Record<string, { cu60: number; cu75: number; cu90: number; al75: number }> = {
  "14": { cu60: 15,  cu75: 20,  cu90: 25,  al75: 0   },
  "12": { cu60: 20,  cu75: 25,  cu90: 30,  al75: 20  },
  "10": { cu60: 30,  cu75: 35,  cu90: 40,  al75: 30  },
  "8":  { cu60: 40,  cu75: 50,  cu90: 55,  al75: 40  },
  "6":  { cu60: 55,  cu75: 65,  cu90: 75,  al75: 50  },
  "4":  { cu60: 70,  cu75: 85,  cu90: 95,  al75: 65  },
  "3":  { cu60: 85,  cu75: 100, cu90: 110, al75: 75  },
  "2":  { cu60: 95,  cu75: 115, cu90: 130, al75: 90  },
  "1":  { cu60: 110, cu75: 130, cu90: 150, al75: 100 },
  "1/0":{ cu60: 125, cu75: 150, cu90: 170, al75: 120 },
  "2/0":{ cu60: 145, cu75: 175, cu90: 195, al75: 135 },
  "3/0":{ cu60: 165, cu75: 200, cu90: 225, al75: 155 },
  "4/0":{ cu60: 195, cu75: 230, cu90: 260, al75: 180 },
  "250":{ cu60: 215, cu75: 255, cu90: 290, al75: 205 },
  "300":{ cu60: 240, cu75: 285, cu90: 320, al75: 230 },
  "350":{ cu60: 260, cu75: 310, cu90: 350, al75: 250 },
  "400":{ cu60: 280, cu75: 335, cu90: 380, al75: 270 },
  "500":{ cu60: 320, cu75: 380, cu90: 430, al75: 310 },
}

const CONDUIT_AREAS: Record<string, { total: number; fill40: number; fill60: number }> = {
  "1/2\" EMT":   { total: 0.304,  fill40: 0.122,  fill60: 0.182 },
  "3/4\" EMT":   { total: 0.533,  fill40: 0.213,  fill60: 0.320 },
  "1\" EMT":     { total: 0.864,  fill40: 0.346,  fill60: 0.518 },
  "1-1/4\" EMT": { total: 1.496,  fill40: 0.598,  fill60: 0.898 },
  "1-1/2\" EMT": { total: 2.036,  fill40: 0.814,  fill60: 1.222 },
  "2\" EMT":     { total: 3.356,  fill40: 1.342,  fill60: 2.014 },
  "2-1/2\" EMT": { total: 4.688,  fill40: 1.875,  fill60: 2.813 },
  "3\" EMT":     { total: 7.499,  fill40: 3.000,  fill60: 4.499 },
  "3-1/2\" EMT": { total: 10.010, fill40: 4.004,  fill60: 6.006 },
  "4\" EMT":     { total: 12.882, fill40: 5.153,  fill60: 7.729 },
  "1/2\" RMC":   { total: 0.314,  fill40: 0.125,  fill60: 0.188 },
  "3/4\" RMC":   { total: 0.549,  fill40: 0.220,  fill60: 0.329 },
  "1\" RMC":     { total: 0.887,  fill40: 0.355,  fill60: 0.532 },
  "1-1/4\" RMC": { total: 1.526,  fill40: 0.610,  fill60: 0.916 },
  "1-1/2\" RMC": { total: 2.071,  fill40: 0.829,  fill60: 1.243 },
  "2\" RMC":     { total: 3.408,  fill40: 1.363,  fill60: 2.045 },
  "2-1/2\" RMC": { total: 4.866,  fill40: 1.946,  fill60: 2.920 },
  "3\" RMC":     { total: 7.499,  fill40: 3.000,  fill60: 4.499 },
  "1\" PVC-40":  { total: 0.832,  fill40: 0.333,  fill60: 0.499 },
  "1-1/4\" PVC-40":{ total: 1.453,fill40: 0.581,  fill60: 0.872 },
  "1-1/2\" PVC-40":{ total: 1.986,fill40: 0.794,  fill60: 1.192 },
  "2\" PVC-40":  { total: 3.291,  fill40: 1.316,  fill60: 1.975 },
  "2-1/2\" PVC-40":{ total: 4.695,fill40: 1.878,  fill60: 2.817 },
  "3\" PVC-40":  { total: 7.268,  fill40: 2.907,  fill60: 4.361 },
}

// NEC Table 5 - Conductor areas (sq in) for THHN/THWN
const WIRE_AREAS: Record<string, number> = {
  "18": 0.0065, "16": 0.0109, "14": 0.0097, "12": 0.0133, "10": 0.0211,
  "8":  0.0366, "6":  0.0507, "4":  0.0824, "3":  0.0973, "2":  0.1158,
  "1":  0.1562, "1/0":0.1855, "2/0":0.2223, "3/0":0.2679, "4/0":0.3237,
  "250":0.3970, "300":0.4608, "350":0.5281, "400":0.5958, "500":0.7073,
}

const BOX_VOLUMES: Record<string, number> = {
  "4\" Round x 1-1/4\"":  12.5,
  "4\" Round x 1-1/2\"":  14.5,
  "4\" Round x 2-1/8\"":  21.5,
  "4\" Square x 1-1/4\"": 18.0,
  "4\" Square x 1-1/2\"": 21.0,
  "4\" Square x 2-1/8\"": 30.3,
  "4-11/16\" x 1-1/2\"":  29.5,
  "4-11/16\" x 2-1/8\"":  42.0,
  "Single Gang 18ci":      18.0,
  "Single Gang 20.3ci":    20.3,
  "Double Gang 34ci":      34.0,
  "Double Gang 38ci":      38.0,
  "Triple Gang 50ci":      50.0,
}

// NEC 430.248 - Single Phase Motor FLA
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

// NEC 430.250 - Three Phase Motor FLA
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

const WIRE_VOLUME: Record<string, number> = {
  "18": 1.50, "16": 1.75, "14": 2.00, "12": 2.25,
  "10": 2.50, "8": 3.00, "6": 5.00,
}

type CalcId = 'voltage-drop' | 'conduit-fill' | 'box-fill' | 'ohms-law' | 'motor-fla' | 'construction'

interface WireEntry { size: string; count: number; id: number }

// ─── SHARED UI ───────────────────────────────────────────────────────────────

function Row({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'green' | 'red' | 'blue' | 'orange' }) {
  const colors = { green: '#00ff88', red: '#ff4444', blue: '#00d4ff', orange: '#ff6b00' }
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e2028] last:border-0">
      <span className="text-xs text-[#888]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold font-mono" style={{ color: highlight ? colors[highlight] : '#f0f0f0' }}>{value}</span>
        {sub && <div className="text-[10px] text-[#555]">{sub}</div>}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'number', placeholder, min, step }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; min?: string; step?: string
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full h-12 bg-[#0a0b0e] border border-[#2a2a35] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none transition-colors font-mono"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-12 bg-[#0a0b0e] border border-[#2a2a35] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none appearance-none transition-colors"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function ResultBox({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`mt-4 p-4 border-l-4 bg-[#0a0b0e] border ${ok ? 'border-l-[#00ff88] border-[#1a3025]' : 'border-l-[#ff4444] border-[#3a1a1a]'}`}>
      {children}
    </div>
  )
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${ok ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
      {ok ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </div>
  )
}

function ProgressBar({ percent, max = 100 }: { percent: number; max?: number }) {
  const clamped = Math.min(percent, max)
  const over = percent > max
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] text-[#555] mb-1">
        <span>0%</span>
        <span className={over ? 'text-[#ff4444]' : ''}>{percent.toFixed(1)}% used</span>
        <span>{max}% max</span>
      </div>
      <div className="h-2 bg-[#1a1a22] w-full">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${Math.min((percent / max) * 100, 100)}%`,
            backgroundColor: over ? '#ff4444' : percent > max * 0.85 ? '#ffaa00' : '#00ff88'
          }}
        />
      </div>
    </div>
  )
}

// ─── VOLTAGE DROP ────────────────────────────────────────────────────────────

function VoltageDropCalc() {
  const [voltage, setVoltage] = useState('120')
  const [phase, setPhase] = useState('1')
  const [wireSize, setWireSize] = useState('12')
  const [material, setMaterial] = useState('copper')
  const [length, setLength] = useState('100')
  const [amps, setAmps] = useState('20')

  const result = useMemo(() => {
    const v = parseFloat(voltage) || 0
    const l = parseFloat(length) || 0
    const a = parseFloat(amps) || 0
    const r = WIRE_RESISTANCE[wireSize]?.[material as 'copper' | 'aluminum'] || 1.93
    if (!v || !l || !a) return null

    const multiplier = phase === '3' ? Math.sqrt(3) : 2
    const drop = (multiplier * r * a * l) / 1000
    const pct = (drop / v) * 100

    // Find minimum wire size that meets 3%
    let recommended: string | null = null
    if (pct > 3) {
      for (const [size, res] of Object.entries(WIRE_RESISTANCE)) {
        const r2 = res[material as 'copper' | 'aluminum']
        const d2 = (multiplier * r2 * a * l) / 1000
        if ((d2 / v) * 100 <= 3) { recommended = size; break }
      }
    }
    return { drop, pct, recommended }
  }, [voltage, phase, wireSize, material, length, amps])

  const wireSizes = Object.keys(WIRE_RESISTANCE)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Voltage" value={voltage} onChange={setVoltage} options={['120','208','240','277','480','600']} />
        <Select label="Phase" value={phase} onChange={setPhase} options={['1','3']} />
        <Select label="Wire Size (AWG/kcmil)" value={wireSize} onChange={setWireSize} options={wireSizes} />
        <Select label="Material" value={material} onChange={setMaterial} options={['copper','aluminum']} />
        <Input label="One-Way Length (ft)" value={length} onChange={setLength} />
        <Input label="Load (Amps)" value={amps} onChange={setAmps} />
      </div>

      {result && (
        <ResultBox ok={result.pct <= 3}>
          <StatusBadge ok={result.pct <= 3} label={result.pct <= 3 ? 'NEC Compliant' : 'Exceeds 3% Limit'} />
          <div className="mt-3 space-y-0">
            <Row label="Voltage Drop" value={`${result.drop.toFixed(2)}V`} highlight={result.pct > 3 ? 'red' : 'green'} />
            <Row label="Drop %" value={`${result.pct.toFixed(2)}%`} highlight={result.pct > 5 ? 'red' : result.pct > 3 ? 'orange' : 'green'} />
            <Row label="Source Voltage" value={`${voltage}V`} />
            <Row label="End Voltage" value={`${(parseFloat(voltage) - result.drop).toFixed(1)}V`} />
            <Row label="NEC Limit (3%)" value={`${(parseFloat(voltage) * 0.03).toFixed(2)}V`} />
          </div>
          <ProgressBar percent={result.pct} max={3} />
          {result.recommended && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#00ff88]">
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              Upsize to <strong>{result.recommended} AWG</strong> to meet 3%
            </div>
          )}
        </ResultBox>
      )}

      <div className="text-[10px] text-[#444] leading-relaxed">
        NEC 210.19(A)(1) recommends max 3% branch circuit drop, 5% total including feeder.
        Formula: VD = {phase === '3' ? '√3' : '2'} × R × I × L ÷ 1000
      </div>
    </div>
  )
}

// ─── CONDUIT FILL ────────────────────────────────────────────────────────────

function ConduitFillCalc() {
  const [conduit, setConduit] = useState('3/4" EMT')
  const [wireType, setWireType] = useState('THHN/THWN')
  const [wires, setWires] = useState<WireEntry[]>([
    { size: '12', count: 3, id: 1 },
  ])
  const [nextId, setNextId] = useState(2)

  const addWire = () => {
    setWires(prev => [...prev, { size: '12', count: 1, id: nextId }])
    setNextId(n => n + 1)
  }

  const removeWire = (id: number) => setWires(prev => prev.filter(w => w.id !== id))

  const updateWire = (id: number, field: 'size' | 'count', val: string) => {
    setWires(prev => prev.map(w => w.id === id ? { ...w, [field]: field === 'count' ? Math.max(0, parseInt(val) || 0) : val } : w))
  }

  const result = useMemo(() => {
    const cd = CONDUIT_AREAS[conduit]
    if (!cd) return null
    const totalUsed = wires.reduce((sum, w) => {
      const area = WIRE_AREAS[w.size] || 0
      return sum + area * w.count
    }, 0)
    const wireCount = wires.reduce((s, w) => s + w.count, 0)
    const limit = wireCount === 1 ? cd.total : wireCount === 2 ? cd.fill60 : cd.fill40
    const limitPct = wireCount === 1 ? 100 : wireCount === 2 ? 60 : 40
    const pct = (totalUsed / cd.total) * 100
    const ok = totalUsed <= limit
    return { totalUsed, limit, limitPct, pct, ok, conduitTotal: cd.total, wireCount }
  }, [conduit, wires])

  const wireSizeOptions = Object.keys(WIRE_AREAS)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Select label="Conduit Type & Size" value={conduit} onChange={setConduit} options={Object.keys(CONDUIT_AREAS)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-wider text-[#555]">Conductors</label>
          <button onClick={addWire} className="flex items-center gap-1 text-[10px] text-[#ff6b00] font-bold uppercase tracking-wider">
            <Plus className="h-3 w-3" /> Add Size
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {wires.map(w => (
            <div key={w.id} className="flex gap-2 items-center">
              <div className="flex-1">
                <select
                  value={w.size}
                  onChange={e => updateWire(w.id, 'size', e.target.value)}
                  className="w-full h-12 bg-[#0a0b0e] border border-[#2a2a35] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none appearance-none"
                >
                  {wireSizeOptions.map(s => <option key={s} value={s}>{s} AWG</option>)}
                </select>
              </div>
              <div className="w-20">
                <input
                  type="number"
                  value={w.count}
                  min="0"
                  onChange={e => updateWire(w.id, 'count', e.target.value)}
                  className="w-full h-12 bg-[#0a0b0e] border border-[#2a2a35] px-3 text-sm text-[#f0f0f0] focus:border-[#ff6b00] focus:outline-none font-mono text-center"
                />
              </div>
              {wires.length > 1 && (
                <button onClick={() => removeWire(w.id)} className="h-12 w-10 flex items-center justify-center text-[#444] hover:text-[#ff4444] transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {result && (
        <ResultBox ok={result.ok}>
          <StatusBadge ok={result.ok} label={result.ok ? `Within ${result.limitPct}% Fill` : `Exceeds ${result.limitPct}% Fill Limit`} />
          <div className="mt-3">
            <Row label="Total Wire Area" value={`${result.totalUsed.toFixed(4)} in²`} />
            <Row label="Conduit Area" value={`${result.conduitTotal.toFixed(4)} in²`} />
            <Row label={`${result.limitPct}% Fill Limit`} value={`${result.limit.toFixed(4)} in²`} highlight={result.ok ? 'green' : 'red'} />
            <Row label="Wire Count" value={`${result.wireCount} conductors`} sub={result.wireCount === 1 ? '100% fill allowed' : result.wireCount === 2 ? '60% fill allowed' : '40% fill allowed'} />
          </div>
          <ProgressBar percent={result.pct} max={result.limitPct} />
        </ResultBox>
      )}

      <div className="text-[10px] text-[#444] leading-relaxed">
        NEC Chapter 9 Table 1: 1 wire = 100%, 2 wires = 60%, 3+ wires = 40% max fill.
        Wire areas from NEC Table 5 (THHN/THWN).
      </div>
    </div>
  )
}

// ─── BOX FILL ────────────────────────────────────────────────────────────────

function BoxFillCalc() {
  const [boxType, setBoxType] = useState('4\" Square x 2-1/8\"')
  const [wireSize, setWireSize] = useState('12')
  const [conductors, setConductors] = useState('4')
  const [devices, setDevices] = useState('1')
  const [groundCount, setGroundCount] = useState('1')
  const [hasClamps, setHasClamps] = useState(true)

  const wireVolume = WIRE_VOLUME[wireSize] || 2.25
  const boxVol = BOX_VOLUMES[boxType] || 30.3

  const result = useMemo(() => {
    const wv = WIRE_VOLUME[wireSize] || 2.25
    const bv = BOX_VOLUMES[boxType] || 30.3
    const conductorVol = (parseInt(conductors) || 0) * wv
    const deviceVol = (parseInt(devices) || 0) * wv * 2  // each device = 2 conductors
    const groundVol = parseInt(groundCount) > 0 ? wv : 0   // all grounds = 1 conductor allowance
    const clampVol = hasClamps ? wv : 0                    // all clamps = 1 conductor allowance
    const total = conductorVol + deviceVol + groundVol + clampVol
    const pct = (total / bv) * 100
    return { conductorVol, deviceVol, groundVol, clampVol, total, pct, ok: total <= bv, remaining: bv - total }
  }, [wireSize, boxType, conductors, devices, groundCount, hasClamps])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Select label="Box Type" value={boxType} onChange={setBoxType} options={Object.keys(BOX_VOLUMES)} />
        </div>
        <Select label="Largest Wire Size" value={wireSize} onChange={setWireSize}
          options={Object.keys(WIRE_VOLUME)} />
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">Volume/Wire</label>
          <div className="h-12 bg-[#0a0b0e] border border-[#1e2028] px-3 flex items-center font-mono text-sm text-[#888]">
            {wireVolume} in³ each
          </div>
        </div>
        <Input label="Conductors (count)" value={conductors} onChange={setConductors} />
        <Input label="Devices (switches/outlets)" value={devices} onChange={setDevices} />
        <Input label="Equipment Grounds" value={groundCount} onChange={setGroundCount} />
        <div className="flex items-center">
          <button
            onClick={() => setHasClamps(v => !v)}
            className={`flex items-center gap-2 h-12 px-3 w-full border text-sm font-medium transition-colors ${hasClamps ? 'border-[#ff6b00] text-[#ff6b00] bg-[#1a0f00]' : 'border-[#2a2a35] text-[#555] bg-[#0a0b0e]'}`}
          >
            <div className={`w-4 h-4 border flex items-center justify-center ${hasClamps ? 'border-[#ff6b00] bg-[#ff6b00]' : 'border-[#555]'}`}>
              {hasClamps && <div className="w-2 h-2 bg-[#0f1115]" />}
            </div>
            Internal Clamps
          </button>
        </div>
      </div>

      <ResultBox ok={result.ok}>
        <StatusBadge ok={result.ok} label={result.ok ? 'Box is OK' : 'Box Overfilled!'} />
        <div className="mt-3">
          <Row label="Conductors" value={`${result.conductorVol.toFixed(2)} in³`} />
          {parseInt(devices) > 0 && <Row label="Devices (×2)" value={`${result.deviceVol.toFixed(2)} in³`} />}
          {parseInt(groundCount) > 0 && <Row label="Ground allowance" value={`${result.groundVol.toFixed(2)} in³`} />}
          {hasClamps && <Row label="Clamp allowance" value={`${result.clampVol.toFixed(2)} in³`} />}
          <Row label="Total Required" value={`${result.total.toFixed(2)} in³`} highlight={result.ok ? 'green' : 'red'} />
          <Row label="Box Capacity" value={`${boxVol} in³`} />
          <Row label={result.ok ? 'Remaining' : 'Over by'} value={`${Math.abs(result.remaining).toFixed(2)} in³`} highlight={result.ok ? 'green' : 'red'} />
        </div>
        <ProgressBar percent={result.pct} max={100} />
      </ResultBox>

      <div className="text-[10px] text-[#444] leading-relaxed">
        NEC 314.16(B): Each conductor counts as 1 volume allowance. Each device = 2 allowances.
        All grounds combined = 1 allowance. All clamps combined = 1 allowance.
      </div>
    </div>
  )
}

// ─── OHM'S LAW ───────────────────────────────────────────────────────────────

function OhmsLawCalc() {
  const [volts, setVolts] = useState('')
  const [amps, setAmps] = useState('')
  const [ohms, setOhms] = useState('')
  const [watts, setWatts] = useState('')

  const result = useMemo(() => {
    const V = parseFloat(volts)
    const I = parseFloat(amps)
    const R = parseFloat(ohms)
    const P = parseFloat(watts)
    const known = [!isNaN(V), !isNaN(I), !isNaN(R), !isNaN(P)].filter(Boolean).length
    if (known < 2) return null

    let calcV = V, calcI = I, calcR = R, calcP = P

    // Solve with available values
    if (!isNaN(V) && !isNaN(I)) { calcR = V / I; calcP = V * I }
    else if (!isNaN(V) && !isNaN(R)) { calcI = V / R; calcP = (V * V) / R }
    else if (!isNaN(V) && !isNaN(P)) { calcI = P / V; calcR = (V * V) / P }
    else if (!isNaN(I) && !isNaN(R)) { calcV = I * R; calcP = I * I * R }
    else if (!isNaN(I) && !isNaN(P)) { calcV = P / I; calcR = P / (I * I) }
    else if (!isNaN(R) && !isNaN(P)) { calcV = Math.sqrt(P * R); calcI = Math.sqrt(P / R) }

    if (!calcV || !calcI || !calcR) return null
    return { V: calcV, I: calcI, R: calcR, P: calcP || calcV * calcI }
  }, [volts, amps, ohms, watts])

  const clear = () => { setVolts(''); setAmps(''); setOhms(''); setWatts('') }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] text-[#555] text-center">Enter any 2 values — results calculate instantly</div>

      {/* The Ohm's Law Wheel visual */}
      <div className="bg-[#0a0b0e] border border-[#1e2028] p-4 grid grid-cols-2 gap-3">
        <div className={`relative ${result && !parseFloat(volts) ? 'opacity-100' : ''}`}>
          <Input label="⚡ Voltage (V)" value={volts} onChange={setVolts} placeholder="Volts" />
          {result && !parseFloat(volts) && (
            <div className="absolute right-3 top-8 text-[#00d4ff] text-sm font-bold font-mono pointer-events-none">
              = {result.V.toFixed(2)}
            </div>
          )}
        </div>
        <div className="relative">
          <Input label="↕ Current (I)" value={amps} onChange={setAmps} placeholder="Amps" />
          {result && !parseFloat(amps) && (
            <div className="absolute right-3 top-8 text-[#00d4ff] text-sm font-bold font-mono pointer-events-none">
              = {result.I.toFixed(3)}
            </div>
          )}
        </div>
        <div className="relative">
          <Input label="⊗ Resistance (R)" value={ohms} onChange={setOhms} placeholder="Ohms" />
          {result && !parseFloat(ohms) && (
            <div className="absolute right-3 top-8 text-[#00d4ff] text-sm font-bold font-mono pointer-events-none">
              = {result.R.toFixed(3)}
            </div>
          )}
        </div>
        <div className="relative">
          <Input label="◈ Power (P)" value={watts} onChange={setWatts} placeholder="Watts" />
          {result && !parseFloat(watts) && (
            <div className="absolute right-3 top-8 text-[#00d4ff] text-sm font-bold font-mono pointer-events-none">
              = {result.P.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-[#0a0b0e] border border-[#1a3025] border-l-4 border-l-[#00d4ff] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Calculated Values</div>
          <Row label="Voltage" value={`${result.V.toFixed(3)} V`} highlight="blue" />
          <Row label="Current" value={`${result.I.toFixed(4)} A`} highlight="green" />
          <Row label="Resistance" value={`${result.R.toFixed(4)} Ω`} highlight="orange" />
          <Row label="Power" value={`${result.P.toFixed(2)} W (${(result.P / 1000).toFixed(4)} kW)`} highlight="blue" />
          {result.P > 0 && (
            <Row label="Monthly cost" value={`$${(result.P / 1000 * 730 * 0.13).toFixed(2)}`} sub="at $0.13/kWh, 24/7" />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#444] font-mono">
        <div className="bg-[#0a0b0e] border border-[#1e2028] p-2">
          <div className="text-[#555] mb-1">OHM'S LAW</div>
          <div>V = I × R</div>
          <div>I = V / R</div>
          <div>R = V / I</div>
        </div>
        <div className="bg-[#0a0b0e] border border-[#1e2028] p-2">
          <div className="text-[#555] mb-1">POWER</div>
          <div>P = V × I</div>
          <div>P = I² × R</div>
          <div>P = V² / R</div>
        </div>
      </div>

      <button onClick={clear} className="flex items-center justify-center gap-2 h-10 border border-[#2a2a35] text-[#555] text-xs uppercase tracking-wider hover:text-[#888] transition-colors">
        <RotateCcw className="h-3.5 w-3.5" /> Clear All
      </button>
    </div>
  )
}

// ─── MOTOR FLA ───────────────────────────────────────────────────────────────

function MotorFLACalc() {
  const [phase, setPhase] = useState('3')
  const [hp, setHp] = useState('5')
  const [voltage, setVoltage] = useState('460')
  const [sf, setSf] = useState('1.15')

  const table = phase === '1' ? MOTOR_FLA_1PH : MOTOR_FLA_3PH
  const hpOptions = Object.keys(table)
  const voltageOptions = phase === '1'
    ? ['115', '200', '208', '230']
    : ['200', '208', '230', '460', '575']

  // Adjust voltage if switching phase and current voltage not available
  const safeVoltage = voltageOptions.includes(voltage) ? voltage : voltageOptions[voltageOptions.length - 2]

  const fla = table[hp]?.[parseInt(safeVoltage)] || 0
  const sfFactor = parseFloat(sf) || 1.15

  const result = useMemo(() => {
    if (!fla) return null
    const runningAmps = fla
    const wireAmps = fla * 1.25
    const breakerAmps = fla * 2.5
    const overloadAmps = fla * sfFactor

    // Find next standard breaker size
    const standardBreakers = [15,20,25,30,35,40,45,50,60,70,80,90,100,110,125,150,175,200,225,250,300,350,400]
    const minBreaker = standardBreakers.find(b => b >= breakerAmps) || breakerAmps

    // Find wire size for 125% of FLA at 75°C
    const wireSize = Object.entries(WIRE_AMPACITY).find(([, amp]) => amp.cu75 >= wireAmps)?.[0] || 'N/A'

    return { runningAmps, wireAmps, breakerAmps, overloadAmps, minBreaker, wireSize }
  }, [fla, sfFactor])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Phase" value={phase} onChange={v => { setPhase(v); setVoltage(v === '1' ? '230' : '460') }} options={['1','3']} />
        <Select label="Horsepower" value={hp} onChange={setHp} options={hpOptions} />
        <Select label="Voltage" value={safeVoltage} onChange={setVoltage} options={voltageOptions} />
        <Select label="Service Factor" value={sf} onChange={setSf} options={['1.0','1.15','1.25']} />
      </div>

      {result && fla > 0 ? (
        <ResultBox ok={true}>
          <div className="text-[10px] uppercase tracking-wider text-[#555] mb-3">
            {hp} HP · {phase}Ø · {safeVoltage}V — NEC Table 430.{phase === '1' ? '248' : '250'}
          </div>
          <Row label="Full Load Amps (FLA)" value={`${fla} A`} highlight="blue" />
          <Row label="Wire Ampacity (125% FLA)" value={`${result.wireAmps.toFixed(1)} A min`} highlight="orange" sub={`Use ${result.wireSize} AWG CU 75°C`} />
          <Row label="Max Breaker (250% FLA)" value={`${result.breakerAmps.toFixed(1)} A`} sub={`Next std size: ${result.minBreaker}A`} highlight="green" />
          <Row label="Overload Trip (SF×FLA)" value={`${result.overloadAmps.toFixed(2)} A`} sub={`NEC 430.32(A)(1)`} />
          <Row label="Locked Rotor (600% est)" value={`${(fla * 6).toFixed(0)} A`} sub="Typical induction motor" />
        </ResultBox>
      ) : (
        <div className="bg-[#0a0b0e] border border-[#2a2a35] p-4 text-sm text-[#555] text-center">
          No NEC table data for this HP/voltage combination
        </div>
      )}

      <div className="text-[10px] text-[#444] leading-relaxed">
        NEC 430.22: Branch circuit conductor min 125% of FLA.
        NEC 430.52: Max OCPD 250% for inverse time breaker.
        NEC 430.32: Overload set at 115–125% of FLA (per service factor).
      </div>
    </div>
  )
}

// ─── CONSTRUCTION CALC ───────────────────────────────────────────────────────

function ConstructionCalc() {
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [num, setNum] = useState('')
  const [den, setDen] = useState('')

  const [addFt1, setAddFt1] = useState('')
  const [addIn1, setAddIn1] = useState('')
  const [addFrac1, setAddFrac1] = useState('')
  const [addFt2, setAddFt2] = useState('')
  const [addIn2, setAddIn2] = useState('')
  const [addFrac2, setAddFrac2] = useState('')

  const convertResult = useMemo(() => {
    const n = parseInt(num), d = parseInt(den)
    if (!d || d === 0) return null
    const ft = parseInt(feet) || 0
    const inch = parseInt(inches) || 0
    const fracInches = n / d
    const totalInches = ft * 12 + inch + fracInches
    const totalFeet = totalInches / 12
    const mm = totalInches * 25.4
    return { totalInches, totalFeet, mm, display: `${ft ? ft + "'-" : ''}${inch}${n ? ` ${n}/${d}` : ''}"` }
  }, [feet, inches, num, den])

  const parseMeasurement = (ft: string, inch: string, frac: string) => {
    const parts = frac.split('/')
    const fracVal = parts.length === 2 ? parseInt(parts[0]) / parseInt(parts[1]) : 0
    return (parseInt(ft) || 0) * 12 + (parseInt(inch) || 0) + fracVal
  }

  const addResult = useMemo(() => {
    const a = parseMeasurement(addFt1, addIn1, addFrac1)
    const b = parseMeasurement(addFt2, addIn2, addFrac2)
    if (!a && !b) return null
    const total = a + b
    const ft = Math.floor(total / 12)
    const remainIn = Math.floor(total % 12)
    const fracPart = total % 1
    return { total, ft, remainIn, fracPart, diff: Math.abs(a - b) }
  }, [addFt1, addIn1, addFrac1, addFt2, addIn2, addFrac2])

  return (
    <div className="flex flex-col gap-4">
      {/* Fraction to Decimal */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Fraction → Decimal Converter</div>
        <div className="bg-[#0a0b0e] border border-[#1e2028] p-3 flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-2">
            <Input label="Feet" value={feet} onChange={setFeet} placeholder="0" />
            <Input label="Inches" value={inches} onChange={setInches} placeholder="0" />
            <Input label="Num" value={num} onChange={setNum} placeholder="3" />
            <Input label="Den" value={den} onChange={setDen} placeholder="8" />
          </div>

          {convertResult && (
            <div className="bg-[#111318] p-3 border border-[#1e2028]">
              <div className="text-[10px] text-[#555] mb-2 font-mono">{convertResult.display}</div>
              <Row label="Decimal Inches" value={`${convertResult.totalInches.toFixed(4)}"`} highlight="green" />
              <Row label="Decimal Feet" value={`${convertResult.totalFeet.toFixed(6)}'`} highlight="blue" />
              <Row label="Millimeters" value={`${convertResult.mm.toFixed(2)} mm`} />
            </div>
          )}
        </div>
      </div>

      {/* Add/Subtract Measurements */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Add Measurements</div>
        <div className="bg-[#0a0b0e] border border-[#1e2028] p-3 flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-[#444] mb-1">First measurement (ft / in / frac)</div>
            <div className="grid grid-cols-3 gap-2">
              <Input label="Ft" value={addFt1} onChange={setAddFt1} placeholder="0" />
              <Input label="In" value={addIn1} onChange={setAddIn1} placeholder="0" />
              <Input label="Frac (3/8)" value={addFrac1} onChange={setAddFrac1} type="text" placeholder="3/8" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#444] mb-1">Second measurement</div>
            <div className="grid grid-cols-3 gap-2">
              <Input label="Ft" value={addFt2} onChange={setAddFt2} placeholder="0" />
              <Input label="In" value={addIn2} onChange={setAddIn2} placeholder="0" />
              <Input label="Frac (3/8)" value={addFrac2} onChange={setAddFrac2} type="text" placeholder="3/8" />
            </div>
          </div>
          {addResult && (
            <div className="bg-[#111318] p-3 border border-[#1e2028]">
              <Row label="Sum" value={`${addResult.ft}' ${addResult.remainIn}" (${addResult.total.toFixed(4)}")`} highlight="green" />
              <Row label="Difference" value={`${addResult.diff.toFixed(4)}"`} />
            </div>
          )}
        </div>
      </div>

      {/* Quick reference */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0a0b0e] border border-[#1e2028] p-3">
          <div className="text-[10px] text-[#555] font-bold mb-2 uppercase tracking-wider">Common Fractions</div>
          {[['1/16','0.0625'],['1/8','0.125'],['3/16','0.1875'],['1/4','0.25'],['5/16','0.3125'],['3/8','0.375'],['7/16','0.4375'],['1/2','0.5'],['9/16','0.5625'],['5/8','0.625'],['11/16','0.6875'],['3/4','0.75'],['13/16','0.8125'],['7/8','0.875'],['15/16','0.9375']].map(([f,d]) => (
            <div key={f} className="flex justify-between text-[10px] font-mono py-0.5 border-b border-[#0f1115] text-[#777]">
              <span>{f}"</span><span className="text-[#555]">{d}"</span>
            </div>
          ))}
        </div>
        <div className="bg-[#0a0b0e] border border-[#1e2028] p-3">
          <div className="text-[10px] text-[#555] font-bold mb-2 uppercase tracking-wider">Conversions</div>
          <div className="text-[10px] font-mono text-[#666] space-y-1">
            <div>1" = 25.4 mm</div>
            <div>1' = 304.8 mm</div>
            <div>1' = 0.3048 m</div>
            <div>1 m = 39.37"</div>
            <div>1 m = 3.2808'</div>
          </div>
          <div className="text-[10px] text-[#555] font-bold mt-3 mb-2 uppercase tracking-wider">Pipe Bending</div>
          <div className="text-[10px] font-mono text-[#666] space-y-1">
            <div>90° shrink: ½"=5" ¾"=6" 1"=8"</div>
            <div>Offset mult: 22.5°=2.6 30°=2.0 45°=1.41 60°=1.15</div>
            <div>Rolling offset: √(rise²+run²)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const CALCS: { id: CalcId; label: string; icon: typeof Zap; color: string; nec: string }[] = [
  { id: 'voltage-drop', label: 'Voltage Drop', icon: Zap,      color: '#ff6b00', nec: '210.19' },
  { id: 'conduit-fill', label: 'Conduit Fill', icon: Circle,   color: '#00d4ff', nec: 'Ch.9'   },
  { id: 'box-fill',     label: 'Box Fill',     icon: Box,      color: '#00ff88', nec: '314.16' },
  { id: 'ohms-law',     label: "Ohm's Law",    icon: Triangle, color: '#ffaa00', nec: 'E=IR'   },
  { id: 'motor-fla',    label: 'Motor FLA',    icon: Settings, color: '#00d4ff', nec: '430'    },
  { id: 'construction', label: 'Construction', icon: HardHat,  color: '#ff6b00', nec: 'Math'   },
]

export function CalcsTab() {
  const [active, setActive] = useState<CalcId>('voltage-drop')
  const current = CALCS.find(c => c.id === active)!

  return (
    <div className="flex flex-col h-full">
      {/* Calculator picker — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
        {CALCS.map(c => {
          const Icon = c.icon
          const isActive = active === c.id
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 border transition-all duration-150"
              style={{
                borderColor: isActive ? c.color : '#1e2028',
                backgroundColor: isActive ? `${c.color}12` : '#0a0b0e',
                minWidth: '80px',
              }}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? c.color : '#444' }} />
              <span className="text-[9px] uppercase tracking-wider font-bold whitespace-nowrap"
                style={{ color: isActive ? c.color : '#555' }}>
                {c.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active calculator header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${current.color}40, transparent)` }} />
        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: current.color }}>
          {current.label}
        </span>
        <span className="text-[10px] text-[#333] font-mono">{current.nec}</span>
        <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${current.color}40, transparent)` }} />
      </div>

      {/* Calculator content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {active === 'voltage-drop' && <VoltageDropCalc />}
        {active === 'conduit-fill' && <ConduitFillCalc />}
        {active === 'box-fill'     && <BoxFillCalc />}
        {active === 'ohms-law'     && <OhmsLawCalc />}
        {active === 'motor-fla'    && <MotorFLACalc />}
        {active === 'construction' && <ConstructionCalc />}
      </div>
    </div>
  )
}
