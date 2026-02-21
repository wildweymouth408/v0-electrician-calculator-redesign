'use client'

import { useState } from 'react'
import { Calculator, Zap, AlertTriangle, Check, Settings } from 'lucide-react'

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

export function CalcsTab() {
  const [voltage, setVoltage] = useState(120)
  const [phase, setPhase] = useState<1 | 3>(1)
  const [wireSize, setWireSize] = useState("12")
  const [wireType, setWireType] = useState<"copper" | "aluminum">("copper")
  const [length, setLength] = useState(100)
  const [amps, setAmps] = useState(20)

  // Motor FLA states
  const [motorHP, setMotorHP] = useState("5")
  const [motorVoltage, setMotorVoltage] = useState(230)
  
  const motorFLA = motorFLATable[motorHP]?.[motorVoltage] || 0

  const calculateVoltageDrop = () => {
    const resistance = wireResistances[wireSize]?.[wireType] || 1.93
    const distance = length
    
    const drop = (2 * resistance * amps * distance) / 1000
    
    if (phase === 3) {
      const drop3Phase = drop * 0.866
      const percentDrop = (drop3Phase / voltage) * 100
      return { 
        volts: drop3Phase, 
        percent: percentDrop,
        recommended: percentDrop > 3 ? "Wire too small" : "OK"
      }
    }
    
    const percentDrop = (drop / voltage) * 100
    return { 
      volts: drop, 
      percent: percentDrop,
      recommended: percentDrop > 3 ? "Wire too small" : "OK"
    }
  }

  const result = calculateVoltageDrop()
  const recommendedWire = result.percent > 3 
    ? Object.entries(wireResistances).find(([size, res]) => {
        const r = res[wireType]
        const drop = (2 * r * amps * length) / 1000
        return (drop / voltage) * 100 <= 3
      })
    : null

  return (
    <div className="h-full overflow-y-auto pb-20 px-4 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-[#00d4ff]" />
        <span className="text-sm font-bold text-[#00d4ff] uppercase tracking-wider">Calculators</span>
      </div>

      {/* Voltage Drop Calculator */}
      <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-[#ff6b00]" />
          <h2 className="font-bold text-white">Voltage Drop</h2>
          <span className="text-xs text-[#555] ml-auto">210.19(A)(1)</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-[#555] block mb-1">System</label>
            <select 
              value={voltage} 
              onChange={(e) => setVoltage(Number(e.target.value))}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            >
              <option value={120}>120V</option>
              <option value={240}>240V</option>
              <option value={208}>208V</option>
              <option value={277}>277V</option>
              <option value={480}>480V</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#555] block mb-1">Phase</label>
            <select 
              value={phase} 
              onChange={(e) => setPhase(Number(e.target.value) as 1 | 3)}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            >
              <option value={1}>Single Phase</option>
              <option value={3}>Three Phase</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#555] block mb-1">Wire Size</label>
            <select 
              value={wireSize} 
              onChange={(e) => setWireSize(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            >
              {Object.keys(wireResistances).map(size => (
                <option key={size} value={size}>{size} AWG</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#555] block mb-1">Type</label>
            <select 
              value={wireType} 
              onChange={(e) => setWireType(e.target.value as "copper" | "aluminum")}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            >
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#555] block mb-1">One-Way Length (ft)</label>
            <input 
              type="number" 
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-[#555] block mb-1">Load (Amps)</label>
            <input 
              type="number" 
              value={amps}
              onChange={(e) => setAmps(Number(e.target.value))}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Results */}
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
                <p>Exceeds 3% limit for branch circuits</p>
                {recommendedWire && (
                  <p className="text-[#00ff88] mt-1">→ Use {recommendedWire[0]} AWG {wireType}</p>
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

        <div className="mt-3 text-xs text-[#555]">
          <p>• 3% max for branch circuits (210.19)</p>
          <p>• 5% max total for feeder + branch (215.2)</p>
          <p>• Length is one-way distance from panel</p>
        </div>
      </div>

      {/* Motor FLA Calculator */}
      <div className="bg-[#1a1f2e] border border-[#333] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-[#00d4ff]" />
          <h2 className="font-bold text-white">Motor FLA</h2>
          <span className="text-xs text-[#555] ml-auto">430.250</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-[#555] block mb-1">Motor HP</label>
            <select 
              value={motorHP}
              onChange={(e) => setMotorHP(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            >
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
            <select 
              value={motorVoltage}
              onChange={(e) => setMotorVoltage(Number(e.target.value))}
              className="w-full bg-[#0f1115] border border-[#333] rounded px-3 py-2 text-sm text-white"
            >
              <option value={115}>115V</option>
              <option value={208}>208V</option>
              <option value={230}>230V</option>
              <option value={460}>460V</option>
              <option value={575}>575V</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[#0f1115] rounded p-3 border border-[#333]">
          <div className="space-y-2">
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
        </div>

        <div className="mt-3 text-xs text-[#555]">
          <p>• FLA from NEC Table 430.250</p>
          <p>• Breaker max 250% of FLA (430.52)</p>
          <p>• Wire at 125% of FLA (430.22)</p>
        </div>
      </div>
    </div>
  )
}
