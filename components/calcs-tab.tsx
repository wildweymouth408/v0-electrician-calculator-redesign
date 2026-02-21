'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator, 
  Zap, 
  AlertTriangle, 
  Check, 
  Settings,
  Grid3X3,
  List,
  Triangle,
  RotateCcw,
  HardHat,
  Circle,
  Square,
  Box
} from 'lucide-react'

// Wire resistance for voltage drop (ohms per 1000 ft)
const wireResistances: Record<string, { copper: number; aluminum: number }> = {
  "14": { copper: 3.07, aluminum: 5.06 },
  "12": { copper: 1.93, aluminum: 3.18 },
  "10": { copper: 1.21, aluminum: 2.00 },
  "8": { copper: 0.764, aluminum: 1.26 },
  "6": { copper: 0.491, aluminum: 0.808 },
  "4": { copper: 0.308, aluminum: 0.508 },
  "3": { copper: 0.245, aluminum: 0.403 },
  "2": { copper: 0.194, aluminum: 0.319 },
  "1": { copper: 0.154, aluminum: 0.253 },
  "1/0": { copper: 0.122, aluminum: 0.201 },
  "2/0": { copper: 0.0967, aluminum: 0.159 },
  "3/0": { copper: 0.0766, aluminum: 0.126 },
  "4/0": { copper: 0.0608, aluminum: 0.100 },
  "250": { copper: 0.0515, aluminum: 0.0848 },
  "300": { copper: 0.0429, aluminum: 0.0706 },
  "350": { copper: 0.0367, aluminum: 0.0605 },
  "400": { copper: 0.0321, aluminum: 0.0529 },
  "500": { copper: 0.0258, aluminum: 0.0426 },
}

// NEC Chapter 9 Table 4 - Conduit areas (square inches)
// 40% fill for 3+ wires, 60% for 2 wires, 100% for 1 wire
const conduitAreas: Record<string, { area: number; 40percent: number }> = {
  "1/2 EMT": { area: 0.304, 40percent: 0.122 },
  "3/4 EMT": { area: 0.533, 40percent: 0.213 },
  "1 EMT": { area: 0.864, 40percent: 0.346 },
  "1-1/4 EMT": { area: 1.496, 40percent: 0.598 },
  "1-1/2 EMT": { area: 2.036, 40percent: 0.814 },
  "2 EMT": { area: 3.356, 40percent: 1.342 },
  "2-1/2 EMT": { area: 4.688, 40percent: 1.875 },
  "3 EMT": { area: 7.498, 40percent: 2.999 },
  "3/4 PVC": { area: 0.533, 40percent: 0.213 },
  "1 PVC": { area: 0.864, 40percent: 0.346 },
  "1-1/4 PVC": { area: 1.496, 40percent: 0.598 },
  "1-1/2 PVC": { area: 2.036, 40percent: 0.814 },
  "2 PVC": { area: 3.356, 40percent: 1.342 },
}

// Wire areas (square inches) - approximate for insulation
const wireAreas: Record<string, number> = {
  "14": 0.013,
  "12": 0.016,
  "10": 0.024,
  "8": 0.043,
  "6": 0.072,
  "4": 0.097,
  "3": 0.113,
  "2": 0.133,
  "1": 0.156,
  "1/0": 0.185,
  "2/0": 0.222,
  "3/0": 0.268,
  "4/0": 0.323,
}

// Motor FLA Table (NEC 430.250)
const motorFLATable: Record<string, Record<number, number>> = {
  "0.5": { 115: 9.8, 208: 4.8, 230: 4.0, 460: 2.0, 575: 1.6 },
  "0.75": { 115: 13.8, 208: 6.9, 230: 5.6, 460: 2.8, 575: 2.2 },
  "1": { 115: 16.0, 208: 8.0, 230: 6.4, 460: 3.2, 575: 2.5 },
  "1.5": { 115: 20.0, 208: 10.0, 230: 8.0, 460: 4.0, 575: 3.2 },
  "2": { 115: 24.0, 208: 12.0, 230: 9.6, 460: 4.8, 575: 3.8 },
  "3": { 115: 34.0, 208: 17.0, 230: 13.6, 460: 6.8, 575: 5.4 },
  "5": { 208: 28.0, 230: 22.0, 460: 11.0, 575: 9.0 },
  "7.5": { 208: 40.0, 230: 32.0, 460: 16.0, 575: 13.0 },
  "10": { 208: 52.0, 230: 40.0, 460: 20.0, 575: 16.0 },
  "15": { 208: 72.0, 230: 58.0, 460: 29.0, 575: 23.0 },
  "20": { 208: 96.0, 230: 76.0, 460: 38.0, 575: 31.0 },
  "25": { 208: 120.0, 230: 96.0, 460: 48.0, 575: 38.0 },
  "30": { 208: 144.0, 230: 116.0, 460: 58.0, 575: 46.0 },
}

// Box volumes (cubic inches)
const boxVolumes: Record<string, number> = {
  "4x1-1/4 Round": 12.5,
  "4x1-1/2 Round": 14.5,
  "4x2-1/8 Round": 21.5,
  "4 Square x 1-1/4": 18.0,
  "4 Square x 1-1/2": 21.0,
  "4 Square x 2-1/8": 30.3,
  "4-11/16 x 1-1/2": 29.5,
  "4-11/16 x 2-1/8": 42.0,
  "Single Gang (18)": 18.0,
  "Double Gang (34)": 34.0,
  "Triple Gang (50)": 50.0,
}

type CalcType = 'voltage-drop' | 'motor-fla' | 'conduit-fill' | 'box-fill' | 'ohms-law' | 'construction'

export function CalcsTab() {
  const [activeCalc, setActiveCalc] = useState<CalcType>('voltage-drop')

  // Voltage Drop States
  const [voltage, setVoltage] = useState(120)
  const [phase, setPhase] = useState<1 | 3>(1)
  const [wireSize, setWireSize] = useState("12")
  const [wireType, setWireType] = useState<"copper" | "aluminum">("copper")
  const [length, setLength] = useState(100)
  const [amps, setAmps] = useState(20)

  // Motor FLA States
  const [motorHP, setMotorHP] = useState("5")
  const [motorVoltage, setMotorVoltage] = useState(230)
  const motorFLA = motorFLATable[motorHP]?.[motorVoltage] || 0

  // Conduit Fill States
  const [conduitType, setConduitType] = useState("3/4 EMT")
  const [wiresInConduit, setWiresInConduit] = useState<{size: string; count: number}[]>([
    {size: "12", count: 3}
  ])

  // Box Fill States
  const [boxType, setBoxType] = useState("4 Square x 2-1/8")
  const [boxWireSize, setBoxWireSize] = useState("12")
  const [wireCount, setWireCount] = useState(4)
  const [deviceCount, setDeviceCount] = useState(1)
  const [hasClamps, setHasClamps] = useState(true)
  const [groundCount, setGroundCount] = useState(1)

  // Ohm's Law States
  const [volts, setVolts] = useState("")
  const [current, setCurrent] = useState("")
  const [resistance, setResistance] = useState("")
  const [power, setPower] = useState("")
  const [solvingFor, setSolvingFor] = useState<'V' | 'I' | 'R' | 'P'>('V')

  // Construction Calc States
  const [fractionInput, setFractionInput] = useState("")
  const [decimalResult, setDecimalResult] = useState<string | null>(null)
  const [feet, setFeet] = useState("")
  const [inches, setInches] = useState("")
  const [numerator, setNumerator] = useState("")
  const [denominator, setDenominator] = useState("")

  const calculators = [
    { id: 'voltage-drop' as CalcType, name: 'Voltage Drop', icon: Zap, color: '#ff6b00', desc: 'Wire sizing & VD' },
    { id: 'motor-fla' as CalcType, name: 'Motor FLA', icon: Settings, color: '#00d4ff', desc: 'Full load amps' },
    { id: 'conduit-fill' as CalcType, name: 'Conduit Fill', icon: Circle, color: '#00ff88', desc: 'NEC Chapter 9' },
    { id: 'box-fill' as CalcType, name: 'Box Fill', icon: Box, color: '#ff6b00', desc: '314.16 calc' },
    { id: 'ohms-law' as CalcType, name: "Ohm's Law", icon: Zap, color: '#00d4ff', desc: 'V=IR & Power' },
    { id: 'construction' as CalcType, name: 'Construction', icon: HardHat, color: '#ffaa00', desc: 'Fractions & math' },
  ]

  const calculateVoltageDrop = () => {
    const resistance = wireResistances[wireSize]?.[wireType] || 1.93
    const drop = (2 * resistance * amps * length) / 1000
    
    if (phase === 3) {
      const drop3Phase = drop * 0.866
      return { 
        volts: drop3Phase, 
        percent: (drop3Phase / voltage) * 100
      }
    }
    return { 
      volts: drop, 
      percent: (drop / voltage) * 100
    }
  }

  const calculateConduitFill = () => {
    const conduitData = conduitAreas[conduitType]
    if (!conduitData) return { used: 0, percent: 0, remaining: 0 }
    
    let totalArea = 0
    wiresInConduit.forEach(wire => {
      const area = wireAreas[wire.size] || 0.016
      totalArea += area * wire.count
    })
    
    const percent = (totalArea / conduitData.area) * 100
    return {
      used: totalArea.toFixed(3),
      percent: percent.toFixed(1),
      remaining: (conduitData.area - totalArea).toFixed(3),
      max40: (conduitData['40percent']).toFixed(3),
      isOver40: totalArea > conduitData['40percent']
    }
  }

  const calculateBoxFill = () => {
    const wireVol = boxWireSize === "14" ? 2.00 : 
                   boxWireSize === "12" ? 2.25 :
                   boxWireSize === "10" ? 2.50 :
                   boxWireSize === "8" ? 3.00 : 2.25
    
    const wiresTotal = wireCount * wireVol
    const devicesTotal = deviceCount * (wireVol * 2)
    const clampsTotal = hasClamps ? wireVol : 0
    const groundTotal = groundCount > 0 ? wireVol : 0
    
    const total = wiresTotal + devicesTotal + clampsTotal + groundTotal
    const boxVol = boxVolumes[boxType] || 30.3
    
    return {
      total,
      boxVol,
      percent: (total / boxVol) * 100,
      remaining: boxVol - total
    }
  }

  const solveOhmsLaw = () => {
    const V = parseFloat(volts) || 0
    const I = parseFloat(current) || 0
    const R = parseFloat(resistance) || 0
    const P = parseFloat(power) || 0

    if (solvingFor === 'V') {
      if (I && R) setVolts((I * R).toFixed(2))
      else if (P && I) setVolts((P / I).toFixed(2))
      else if (P && R) setVolts(Math.sqrt(P * R).toFixed(2))
    } else if (solvingFor === 'I') {
      if (V && R) setCurrent((V / R).toFixed(2))
      else if (P && V) setCurrent((P / V).toFixed(2))
      else if (P && R) setCurrent(Math.sqrt(P / R).toFixed(2))
    } else if (solvingFor === 'R') {
      if (V && I) setResistance((V / I).toFixed(2))
      else if (P && I) setResistance((P / (I * I)).toFixed(2))
      else if (V && P) setResistance(((V * V) / P).toFixed(2))
    } else if (solvingFor === 'P') {
      if (V && I) setPower((V * I).toFixed(2))
      else if (I && R) setPower((I * I * R).toFixed(2))
      else if (V && R) setPower(((V * V) / R).toFixed(2))
    }
  }

  const convertFractionToDecimal = () => {
    if (!numerator || !denominator) return
    
    const num = parseInt(numerator)
    const den = parseInt(denominator)
    const ft = parseInt(feet) || 0
    const inch = parseInt(inches) || 0
    
    if (den === 0) return
    
    const decimal = num / den
    const totalInches = inch + decimal
    const totalFeet = ft + (totalInches / 12)
    
    setDecimalResult({
      inchesOnly: totalInches.toFixed(4),
      feetDecimal: totalFeet.toFixed(4),
      fraction: `${ft}'-${inch} ${num}/${den}"`
    } as any)
  }

  const result = calculateVoltageDrop()
  const recommendedWire = result.percent > 3 
    ? Object.entries(wireResistances).find(([size, res]) => {
        const r = res[wireType]
        const drop = (2 * r * amps * length) / 1000
        return (drop / voltage) * 100 <= 3
      })
    : null

  const conduitResult = calculateConduitFill()
  const boxResult = calculateBoxFill()

  return (
    <div className="h-full overflow-y-auto pb-24 px-4 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-[#00d4ff]" />
        <span className="text-sm font-bold text-[#00d4ff] uppercase tracking-wider">Calculators</span>
      </div>

      {/* Calculator Grid Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {calculators.map((calc) => {
          const Icon = calc.icon
          const isActive = activeCalc === calc.id
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isActive 
                  ? 'bg-[#1a1f2e] border-[#00d4ff]' 
                  : 'bg-[#0f1115] border-[#333] hover:border-[#555]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" style={{ color: calc.color }} />
                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-[#888]'}`}>
                  {calc.name}
                </span>
              </div>
              <p className="text-xs text-[#555]">{calc.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Voltage Drop Calculator */}
      {activeCalc === 'voltage-drop' && (
        <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-[#ff6b00]" />
            <h2 className="font-bold text-white">Voltage Drop</h2>
            <span className="text-xs text-[#555] ml-auto">210.19(A)(1)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-[#555] block mb-1">System</label>
              <select value={voltage} onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                <option value={120}>120V</option>
                <option value={240}>240V</option>
                <option value={208}>208V</option>
                <option value={277}>277V</option>
                <option value={480}>480V</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Phase</label>
              <select value={phase} onChange={(e) => setPhase(Number(e.target.value) as 1 | 3)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                <option value={1}>Single</option>
                <option value={3}>Three</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Wire Size</label>
              <select value={wireSize} onChange={(e) => setWireSize(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                {Object.keys(wireResistances).map(size => (
                  <option key={size} value={size}>{size} AWG</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Type</label>
              <select value={wireType} onChange={(e) => setWireType(e.target.value as "copper" | "aluminum")}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                <option value="copper">Copper</option>
                <option value="aluminum">Aluminum</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Length (ft)</label>
              <input type="number" value={length} onChange={(e) => setLength(Number(e.target.value))}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Load (Amps)</label>
              <input type="number" value={amps} onChange={(e) => setAmps(Number(e.target.value))}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div className="bg-[#0f1115] rounded p-3 border border-[#333]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#888]">Voltage Drop:</span>
              <span className={`text-lg font-bold ${result.percent > 3 ? 'text-red-400' : 'text-[#00ff88]'}`}>
                {result.volts.toFixed(2)}V ({result.percent.toFixed(2)}%)
              </span>
            </div>
            {result.percent > 3 ? (
              <div className="flex items-start gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>Exceeds 3% limit</p>
                  {recommendedWire && (
                    <p className="text-[#00ff88] mt-1">→ Use {recommendedWire[0]} AWG</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#00ff88] text-sm">
                <Check className="h-4 w-4" />
                <p>Within 3% limit - compliant</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Motor FLA Calculator */}
      {activeCalc === 'motor-fla' && (
        <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="font-bold text-white">Motor FLA</h2>
            <span className="text-xs text-[#555] ml-auto">430.250</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-[#555] block mb-1">Motor HP</label>
              <select value={motorHP} onChange={(e) => setMotorHP(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                <option value="0.5">1/2 HP</option>
                <option value="0.75">3/4 HP</option>
                <option value="1">1 HP</option>
                <option value="1.5">1-1/2 HP</option>
                <option value="2">2 HP</option>
                <option value="3">3 HP</option>
                <option value="5">5 HP</option>
                <option value="7.5">7-1/2 HP</option>
                <option value="10">10 HP</option>
                <option value="15">15 HP</option>
                <option value="20">20 HP</option>
                <option value="25">25 HP</option>
                <option value="30">30 HP</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Voltage</label>
              <select value={motorVoltage} onChange={(e) => setMotorVoltage(Number(e.target.value))}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                <option value={115}>115V</option>
                <option value={208}>208V</option>
                <option value={230}>230V</option>
                <option value={460}>460V</option>
                <option value={575}>575V</option>
              </select>
            </div>
          </div>

          <div className="bg-[#0f1115] rounded p-3 border border-[#333] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Full Load Amps:</span>
              <span className="text-xl font-bold text-[#00d4ff]">{motorFLA}A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Breaker (250%):</span>
              <span className="text-lg font-bold text-white">{Math.ceil(motorFLA * 2.5)}A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Wire Size (125%):</span>
              <span className="text-lg font-bold text-[#00ff88]">{Math.ceil(motorFLA * 1.25)}A</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-[#555]">
            <p>• Breaker max 250% of FLA (430.52)</p>
            <p>• Wire at 125% of FLA (430.22)</p>
          </div>
        </div>
      )}

      {/* Conduit Fill Calculator */}
      {activeCalc === 'conduit-fill' && (
        <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Circle className="h-4 w-4 text-[#00ff88]" />
            <h2 className="font-bold text-white">Conduit Fill</h2>
            <span className="text-xs text-[#555] ml-auto">Chapter 9</span>
          </div>

          <div className="mb-3">
            <label className="text-xs text-[#555] block mb-1">Conduit Type</label>
            <select value={conduitType} onChange={(e) => setConduitType(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
              {Object.keys(conduitAreas).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 mb-3">
            {wiresInConduit.map((wire, idx) => (
              <div key={idx} className="flex gap-2">
                <select value={wire.size} onChange={(e) => {
                  const newWires = [...wiresInConduit]
                  newWires[idx].size = e.target.value
                  setWiresInConduit(newWires)
                }} className="flex-1 bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                  {Object.keys(wireAreas).map(size => (
                    <option key={size} value={size}>{size} AWG</option>
                  ))}
                </select>
                <input type="number" value={wire.count} onChange={(e) => {
                  const newWires = [...wiresInConduit]
                  newWires[idx].count = parseInt(e.target.value) || 0
                  setWiresInConduit(newWires)
                }} className="w-20 bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" placeholder="#" />
                {idx > 0 && (
                  <button onClick={() => setWiresInConduit(wiresInConduit.filter((_, i) => i !== idx))}
                    className="px-2 text-red-400">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setWiresInConduit([...wiresInConduit, {size: "12", count: 1}])}
              className="w-full py-2 border border-dashed border-[#555] text-[#888] rounded text-sm">
              + Add Wire Size
            </button>
          </div>

          <div className={`bg-[#0f1115] rounded p-3 border ${parseFloat(conduitResult.percent) > 40 ? 'border-red-500' : 'border-[#333]'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#888]">Fill Percentage:</span>
              <span className={`text-lg font-bold ${parseFloat(conduitResult.percent) > 40 ? 'text-red-400' : 'text-[#00ff88]'}`}>
                {conduitResult.percent}%
              </span>
            </div>
            <div className="text-xs text-[#555] space-y-1">
              <div className="flex justify-between">
                <span>Used Area:</span>
                <span>{conduitResult.used} sq.in.</span>
              </div>
              <div className="flex justify-between">
                <span>40% Max:</span>
                <span>{conduitResult.max40} sq.in.</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span>{conduitResult.remaining} sq.in.</span>
              </div>
            </div>
            {conduitResult.isOver40 && (
              <div className="mt-2 text-xs text-red-400">
                ⚠ Exceeds 40% fill limit for 3+ wires
              </div>
            )}
          </div>
        </div>
      )}

      {/* Box Fill Calculator */}
      {activeCalc === 'box-fill' && (
        <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Box className="h-4 w-4 text-[#ff6b00]" />
            <h2 className="font-bold text-white">Box Fill</h2>
            <span className="text-xs text-[#555] ml-auto">314.16</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-[#555] block mb-1">Box Type</label>
              <select value={boxType} onChange={(e) => setBoxType(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                {Object.keys(boxVolumes).map(box => (
                  <option key={box} value={box}>{box}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Wire Size</label>
              <select value={boxWireSize} onChange={(e) => setBoxWireSize(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white">
                <option value="14">14 AWG (2.00)</option>
                <option value="12">12 AWG (2.25)</option>
                <option value="10">10 AWG (2.50)</option>
                <option value="8">8 AWG (3.00)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Wires</label>
              <input type="number" value={wireCount} onChange={(e) => setWireCount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Devices</label>
              <input type="number" value={deviceCount} onChange={(e) => setDeviceCount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1">Grounds</label>
              <input type="number" value={groundCount} onChange={(e) => setGroundCount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-[#888]">
                <input type="checkbox" checked={hasClamps} onChange={(e) => setHasClamps(e.target.checked)}
                  className="rounded border-[#333] bg-[#0f1115] text-[#ff6b00]" />
                Has Clamps
              </label>
            </div>
          </div>

          <div className={`bg-[#0f1115] rounded p-3 border ${boxResult.percent > 100 ? 'border-red-500' : 'border-[#333]'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#888]">Box Fill:</span>
              <span className={`text-lg font-bold ${boxResult.percent > 100 ? 'text-red-400' : 'text-[#00ff88]'}`}>
                {boxResult.total.toFixed(1)} / {boxResult.boxVol} cu.in.
              </span>
            </div>
            <div className="w-full bg-[#333] rounded-full h-2 mb-2">
              <div className={`h-2 rounded-full ${boxResult.percent > 100 ? 'bg-red-500' : 'bg-[#00ff88]'}`}
                style={{width: `${Math.min(boxResult.percent, 100)}%`}} />
            </div>
            <div className="text-xs text-[#555]">
              {boxResult.percent > 100 ? 
                `⚠ Overfilled by ${(boxResult.total - boxResult.boxVol).toFixed(1)} cu.in.` : 
                `✓ ${boxResult.remaining.toFixed(1)} cu.in. remaining`
              }
            </div>
          </div>
        </div>
      )}

      {/* Ohm's Law Calculator */}
      {activeCalc === 'ohms-law' && (
        <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-[#00d4ff]" />
            <h2 className="font-bold text-white">Ohm's Law & Power</h2>
            <span className="text-xs text-[#555] ml-auto">E=IR</span>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto">
            {['V', 'I', 'R', 'P'].map((val) => (
              <button key={val} onClick={() => setSolvingFor(val as any)}
                className={`px-3 py-1 rounded text-sm font-bold ${solvingFor === val ? 'bg-[#00d4ff] text-[#0f1115]' : 'bg-[#0f1115] text-[#888] border border-[#333]'}`}>
                Solve for {val === 'V' ? 'Volts' : val === 'I' ? 'Amps' : val === 'R' ? 'Ohms' : 'Watts'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={solvingFor === 'V' ? 'opacity-50' : ''}>
              <label className="text-xs text-[#555] block mb-1">Voltage (V)</label>
              <input type="number" value={volts} onChange={(e) => setVolts(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" 
                placeholder="Volts" readOnly={solvingFor === 'V'} />
            </div>
            <div className={solvingFor === 'I' ? 'opacity-50' : ''}>
              <label className="text-xs text-[#555] block mb-1">Current (I)</label>
              <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" 
                placeholder="Amps" readOnly={solvingFor === 'I'} />
            </div>
            <div className={solvingFor === 'R' ? 'opacity-50' : ''}>
              <label className="text-xs text-[#555] block mb-1">Resistance (R)</label>
              <input type="number" value={resistance} onChange={(e) => setResistance(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" 
                placeholder="Ohms" readOnly={solvingFor === 'R'} />
            </div>
            <div className={solvingFor === 'P' ? 'opacity-50' : ''}>
              <label className="text-xs text-[#555] block mb-1">Power (P)</label>
              <input type="number" value={power} onChange={(e) => setPower(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white" 
                placeholder="Watts" readOnly={solvingFor === 'P'} />
            </div>
          </div>

          <button onClick={solveOhmsLaw} className="w-full bg-[#00d4ff] text-[#0f1115] font-bold py-2 rounded mb-2">
            Calculate
          </button>
          <button onClick={() => {setVolts(''); setCurrent(''); setResistance(''); setPower('');}}
            className="w-full border border-[#333] text-[#888] py-2 rounded text-sm">
            Clear
          </button>

          <div className="mt-3 text-xs text-[#555] grid grid-cols-2 gap-2">
            <div>V = I × R</div>
            <div>P = V × I</div>
            <div>I = V / R</div>
            <div>R = V / I</div>
          </div>
        </div>
      )}

      {/* Construction Calculator */}
      {activeCalc === 'construction' && (
        <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <HardHat className="h-4 w-4 text-[#ffaa00]" />
            <h2 className="font-bold text-white">Construction Calc</h2>
          </div>

          <div className="mb-4 p-3 bg-[#0f1115] rounded border border-[#333]">
            <h3 className="text-xs font-bold text-[#888] mb-2">Fraction to Decimal</h3>
            <div className="flex gap-2 items-end mb-2">
              <div className="flex-1">
                <label className="text-xs text-[#555] block mb-1">Feet</label>
                <input type="number" value={feet} onChange={(e) => setFeet(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-[#333] rounded px-2 py-1 text-sm text-white" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#555] block mb-1">Inches</label>
                <input type="number" value={inches} onChange={(e) => setInches(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-[#333] rounded px-2 py-1 text-sm text-white" />
              </div>
            </div>
            <div className="flex gap-2 items-center mb-3">
              <input type="number" value={numerator} onChange={(e) => setNumerator(e.target.value)}
                className="w-16 bg-[#1a1f2e] border border-[#333] rounded px-2 py-1 text-sm text-white text-center" />
              <span className="text-[#888]">/</span>
              <input type="number" value={denominator} onChange={(e) => setDenominator(e.target.value)}
                className="w-16 bg-[#1a1f2e] border border-[#333] rounded px-2 py-1 text-sm text-white text-center" />
              <button onClick={convertFractionToDecimal} className="flex-1 bg-[#ffaa00] text-[#0f1115] font-bold py-1 rounded text-sm">
                Convert
              </button>
            </div>
            
            {decimalResult && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888]">Fraction:</span>
                  <span className="text-white font-mono">{decimalResult.fraction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888]">Decimal Feet:</span>
                  <span className="text-[#00ff88] font-mono">{decimalResult.feetDecimal}'</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888]">Total Inches:</span>
                  <span className="text-[#00d4ff] font-mono">{decimalResult.inchesOnly}"</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[#555]">
            <div className="bg-[#0f1115] p-2 rounded border border-[#333]">
              <div className="font-bold text-white mb-1">Common Conversions</div>
              <div>1/8 = 0.125</div>
              <div>1/4 = 0.25</div>
              <div>3/8 = 0.375</div>
              <div>1/2 = 0.5</div>
              <div>5/8 = 0.625</div>
              <div>3/4 = 0.75</div>
              <div>7/8 = 0.875</div>
            </div>
            <div className="bg-[#0f1115] p-2 rounded border border-[#333]">
              <div className="font-bold text-white mb-1">Metric</div>
              <div>1" = 25.4mm</div>
              <div>1' = 304.8mm</div>
              <div>1m = 3.28'</div>
              <div>1mm = 0.039"</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
