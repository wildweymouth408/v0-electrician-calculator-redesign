// Calculator formulas - NEC compliant

import {
  WIRE_AREAS, K_FACTOR, AMPACITY_TABLE, WIRE_CROSS_SECTION,
  CONDUIT_AREAS, getConduitFillLimit, BOX_FILL_ALLOWANCE,
  BEND_MULTIPLIERS, getConduitDerating, INSULATION_TEMP,
  TEMP_CORRECTION, STANDARD_BOXES,
} from './calculator-data'

// ── Voltage Drop ──────────────────────────────────
export interface VoltageDropInputs {
  systemVoltage: number
  current: number
  distance: number // one-way in feet
  wireSize: string
  material: 'copper' | 'aluminum'
  phase: 'single' | 'three'
}

export interface VoltageDropResult {
  voltageDrop: number
  dropPercent: number
  pass: boolean
  recommendation: string
}

export function calculateVoltageDrop(inputs: VoltageDropInputs): VoltageDropResult {
  const cm = WIRE_AREAS[inputs.wireSize]
  if (!cm) return { voltageDrop: 0, dropPercent: 0, pass: false, recommendation: 'Invalid wire size' }

  const k = K_FACTOR[inputs.material]
  const phaseFactor = inputs.phase === 'three' ? 1.732 : 2

  const vd = (phaseFactor * k * inputs.current * inputs.distance) / cm
  const percent = (vd / inputs.systemVoltage) * 100

  const threshold = 3 // branch circuit
  const pass = percent <= threshold

  let recommendation = ''
  if (!pass) {
    recommendation = 'Exceeds 3% branch circuit limit. Consider upsizing wire.'
  } else if (percent > 2) {
    recommendation = 'Acceptable but close to limit. Check total system drop.'
  } else {
    recommendation = 'Well within NEC recommended limits.'
  }

  return { voltageDrop: Math.round(vd * 100) / 100, dropPercent: Math.round(percent * 100) / 100, pass, recommendation }
}

// ── Conduit Fill ──────────────────────────────────
export interface ConduitFillInputs {
  conduitType: 'EMT' | 'RMC' | 'PVC'
  tradeSize: string
  wireType: string
  wireSize: string
  wireCount: number
}

export interface ConduitFillResult {
  totalWireArea: number
  allowableArea: number
  fillPercent: number
  pass: boolean
  remainingArea: number
  fillLimit: number
}

export function calculateConduitFill(inputs: ConduitFillInputs): ConduitFillResult {
  const conduitArea = CONDUIT_AREAS[inputs.conduitType]?.[inputs.tradeSize]
  const wireArea = WIRE_CROSS_SECTION[inputs.wireType]?.[inputs.wireSize]

  if (!conduitArea || !wireArea) {
    return { totalWireArea: 0, allowableArea: 0, fillPercent: 0, pass: false, remainingArea: 0, fillLimit: 0 }
  }

  const totalWireArea = wireArea * inputs.wireCount
  const fillLimit = getConduitFillLimit(inputs.wireCount)
  const allowableArea = conduitArea * fillLimit
  const fillPercent = (totalWireArea / conduitArea) * 100
  const pass = totalWireArea <= allowableArea
  const remainingArea = Math.max(0, allowableArea - totalWireArea)

  return {
    totalWireArea: Math.round(totalWireArea * 10000) / 10000,
    allowableArea: Math.round(allowableArea * 10000) / 10000,
    fillPercent: Math.round(fillPercent * 100) / 100,
    pass,
    remainingArea: Math.round(remainingArea * 10000) / 10000,
    fillLimit: fillLimit * 100,
  }
}

// ── Ohm's Law ─────────────────────────────────────
export interface OhmsLawInputs {
  voltage: number | null
  current: number | null
  resistance: number | null
}

export interface OhmsLawResult {
  voltage: number
  current: number
  resistance: number
  power: number
  solvedFor: string
}

export function calculateOhmsLaw(inputs: OhmsLawInputs): OhmsLawResult | null {
  const { voltage: v, current: i, resistance: r } = inputs
  const filled = [v !== null, i !== null, r !== null].filter(Boolean).length

  if (filled < 2) return null

  let voltage = v ?? 0
  let current = i ?? 0
  let resistance = r ?? 0
  let solvedFor = ''

  if (v === null && i !== null && r !== null) {
    voltage = i * r
    solvedFor = 'voltage'
  } else if (i === null && v !== null && r !== null) {
    current = r !== 0 ? v / r : 0
    solvedFor = 'current'
  } else if (r === null && v !== null && i !== null) {
    resistance = i !== 0 ? v / i : 0
    solvedFor = 'resistance'
  }

  const power = voltage * current

  return {
    voltage: Math.round(voltage * 1000) / 1000,
    current: Math.round(current * 1000) / 1000,
    resistance: Math.round(resistance * 1000) / 1000,
    power: Math.round(power * 100) / 100,
    solvedFor,
  }
}

// ── Pipe Bending ──────────────────────────────────
export interface PipeBendingInputs {
  bendType: 'offset' | '90' | '3-point-saddle' | '4-point-saddle'
  offsetHeight: number // inches
  bendAngle: number // degrees (10, 22.5, 30, 45, 60)
  conduitDiameter: number // outer diameter inches
}

export interface PipeBendingResult {
  distanceBetweenBends: number
  shrinkage: number
  travel: number
  firstMark: number
  secondMark: number
  thirdMark?: number
  fourthMark?: number
  bendType: string
}

export function calculatePipeBending(inputs: PipeBendingInputs): PipeBendingResult | null {
  const { bendType, offsetHeight, bendAngle, conduitDiameter } = inputs
  const mult = BEND_MULTIPLIERS[bendAngle]
  if (!mult) return null

  if (bendType === 'offset') {
    const distanceBetweenBends = offsetHeight * mult.multiplier
    const shrinkage = offsetHeight * (mult.shrinkage * 16) // convert back
    const shrinkagePerInch = mult.shrinkage
    const totalShrinkage = offsetHeight * shrinkagePerInch * 16
    const travel = Math.sqrt(distanceBetweenBends ** 2 + offsetHeight ** 2)

    return {
      distanceBetweenBends: Math.round(distanceBetweenBends * 100) / 100,
      shrinkage: Math.round(totalShrinkage * 100) / 100,
      travel: Math.round(travel * 100) / 100,
      firstMark: 0,
      secondMark: Math.round(distanceBetweenBends * 100) / 100,
      bendType: `${bendAngle}° Offset`,
    }
  }

  if (bendType === '90') {
    const stub = offsetHeight // stub-up length
    const deduction = conduitDiameter <= 0.75 ? 5 : conduitDiameter <= 1 ? 6 : conduitDiameter <= 1.25 ? 8 : 11
    const markFromEnd = stub - deduction

    return {
      distanceBetweenBends: 0,
      shrinkage: 0,
      travel: 0,
      firstMark: Math.round(markFromEnd * 100) / 100,
      secondMark: 0,
      bendType: '90° Stub-up',
    }
  }

  if (bendType === '3-point-saddle') {
    const centerBendAngle = bendAngle
    const outerAngle = centerBendAngle / 2
    const outerMult = BEND_MULTIPLIERS[outerAngle]
    const distanceBetweenBends = offsetHeight * mult.multiplier
    const shrinkageInches = offsetHeight * mult.shrinkage * 16

    return {
      distanceBetweenBends: Math.round(distanceBetweenBends * 100) / 100,
      shrinkage: Math.round(shrinkageInches * 100) / 100,
      travel: 0,
      firstMark: -Math.round(distanceBetweenBends * 100) / 100,
      secondMark: 0,
      thirdMark: Math.round(distanceBetweenBends * 100) / 100,
      bendType: `3-Point Saddle (${centerBendAngle}°)`,
    }
  }

  if (bendType === '4-point-saddle') {
    const distanceBetweenBends = offsetHeight * mult.multiplier

    return {
      distanceBetweenBends: Math.round(distanceBetweenBends * 100) / 100,
      shrinkage: Math.round((offsetHeight * mult.shrinkage * 16) * 100) / 100,
      travel: 0,
      firstMark: 0,
      secondMark: Math.round(distanceBetweenBends * 100) / 100,
      thirdMark: Math.round(distanceBetweenBends * 2 * 100) / 100,
      fourthMark: Math.round(distanceBetweenBends * 3 * 100) / 100,
      bendType: `4-Point Saddle (${bendAngle}°)`,
    }
  }

  return null
}

// ── Wire Sizing ───────────────────────────────────
export interface WireSizingInputs {
  loadAmps: number
  distance: number
  systemVoltage: number
  material: 'copper' | 'aluminum'
  insulationType: string
  maxDropPercent: number
  phase?: 'single' | 'three'
}

export interface WireSizingResult {
  recommendedSize: string
  ampacity: number
  voltageDrop: number
  dropPercent: number
  pass: boolean
}

export function calculateWireSizing(inputs: WireSizingInputs): WireSizingResult | null {
  const { loadAmps, distance, systemVoltage, material, insulationType, maxDropPercent } = inputs

  // NEC 215.2(A)(1)(b): voltage drop factor — 2 for single-phase (2 conductors), √3 for three-phase
  const phaseFactor = inputs.phase === 'three' ? 1.732 : 2

  const tempRating = INSULATION_TEMP[insulationType] || 75
  const ampKey = material === 'copper'
    ? (tempRating === 60 ? 'cu60' : tempRating === 90 ? 'cu90' : 'cu75')
    : (tempRating === 60 ? 'al60' : tempRating === 90 ? 'al90' : 'al75')

  const sizes = Object.keys(AMPACITY_TABLE)

  for (const size of sizes) {
    const amp = AMPACITY_TABLE[size][ampKey as keyof typeof AMPACITY_TABLE[string]]
    if (amp >= loadAmps) {
      // Check voltage drop using correct phase factor (NEC 310.15)
      const cm = WIRE_AREAS[size]
      const k = K_FACTOR[material]
      const vd = (phaseFactor * k * loadAmps * distance) / cm
      const percent = (vd / systemVoltage) * 100

      if (percent <= maxDropPercent) {
        return {
          recommendedSize: size,
          ampacity: amp,
          voltageDrop: Math.round(vd * 100) / 100,
          dropPercent: Math.round(percent * 100) / 100,
          pass: true,
        }
      }
    }
  }

  // If no size found with acceptable drop, return largest that fits amps
  for (const size of sizes) {
    const amp = AMPACITY_TABLE[size][ampKey as keyof typeof AMPACITY_TABLE[string]]
    if (amp >= loadAmps) {
      const cm = WIRE_AREAS[size]
      const k = K_FACTOR[material]
      const vd = (phaseFactor * k * loadAmps * distance) / cm
      const percent = (vd / systemVoltage) * 100
      return {
        recommendedSize: size,
        ampacity: amp,
        voltageDrop: Math.round(vd * 100) / 100,
        dropPercent: Math.round(percent * 100) / 100,
        pass: percent <= maxDropPercent,
      }
    }
  }

  return null
}

// ── Ampacity ──────────────────────────────────────
export interface AmpacityInputs {
  wireSize: string
  insulationType: string
  material: 'copper' | 'aluminum'
  ambientTemp: number // Celsius
  conductorsInRaceway: number
}

export interface AmpacityResult {
  baseAmpacity: number
  tempCorrectionFactor: number
  conduitDerating: number
  correctedAmpacity: number
  tempRating: number
}

export function calculateAmpacity(inputs: AmpacityInputs): AmpacityResult | null {
  const { wireSize, insulationType, material, ambientTemp, conductorsInRaceway } = inputs

  const tempRating = INSULATION_TEMP[insulationType] || 75
  const ampKey = material === 'copper'
    ? (tempRating === 60 ? 'cu60' : tempRating === 90 ? 'cu90' : 'cu75')
    : (tempRating === 60 ? 'al60' : tempRating === 90 ? 'al90' : 'al75')

  const baseAmpacity = AMPACITY_TABLE[wireSize]?.[ampKey as keyof typeof AMPACITY_TABLE[string]]
  if (!baseAmpacity) return null

  // Temperature correction
  const tempKey = tempRating === 60 ? 'f60' : tempRating === 90 ? 'f90' : 'f75'
  let tempFactor = 1.0
  const temps = Object.keys(TEMP_CORRECTION).map(Number).sort((a, b) => a - b)
  for (const t of temps) {
    if (ambientTemp <= t) {
      const correction = TEMP_CORRECTION[t]
      tempFactor = correction[tempKey as keyof typeof correction]
      break
    }
  }

  const conduitDerating = getConduitDerating(conductorsInRaceway)
  const corrected = baseAmpacity * tempFactor * conduitDerating

  return {
    baseAmpacity,
    tempCorrectionFactor: tempFactor,
    conduitDerating,
    correctedAmpacity: Math.round(corrected * 100) / 100,
    tempRating,
  }
}

// ── Box Fill ──────────────────────────────────────
export interface BoxFillInputs {
  boxType: string // key from STANDARD_BOXES or 'custom'
  customVolume?: number
  conductors: { size: string; count: number }[]
  clamps: number // internal cable clamps count
  supportFittings: number // fixture studs, hickeys
  devices: number // switches, receptacles (yoke count)
  equipmentGrounds: number // count of equipment grounding conductors
  largestGroundSize: string
}

export interface BoxFillResult {
  conductorVolume: number
  clampVolume: number
  supportVolume: number
  deviceVolume: number
  groundVolume: number
  totalRequired: number
  boxCapacity: number
  pass: boolean
  remainingVolume: number
}

export function calculateBoxFill(inputs: BoxFillInputs): BoxFillResult {
  const { boxType, customVolume, conductors, clamps, supportFittings, devices, equipmentGrounds, largestGroundSize } = inputs

  // Get box volume
  let boxCapacity = customVolume || 0
  if (boxType !== 'custom') {
    boxCapacity = STANDARD_BOXES[boxType]?.volume || 0
  }

  // Conductor volume: each conductor counted at its allowance
  let conductorVolume = 0
  let largestConductorSize = '14'
  for (const c of conductors) {
    const allowance = BOX_FILL_ALLOWANCE[c.size] || 2.0
    conductorVolume += allowance * c.count
    if ((WIRE_AREAS[c.size] || 0) > (WIRE_AREAS[largestConductorSize] || 0)) {
      largestConductorSize = c.size
    }
  }

  const largestAllowance = BOX_FILL_ALLOWANCE[largestConductorSize] || 2.0
  const groundAllowance = BOX_FILL_ALLOWANCE[largestGroundSize] || 2.0

  // Clamps: if any, 1x largest conductor
  const clampVolume = clamps > 0 ? largestAllowance : 0

  // Support fittings: each is 1x largest
  const supportVolume = supportFittings * largestAllowance

  // Devices: each yoke = 2x largest conductor connected to it
  const deviceVolume = devices * 2 * largestAllowance

  // Equipment grounds: all count as 1x largest ground
  const groundVolume = equipmentGrounds > 0 ? groundAllowance : 0

  const totalRequired = conductorVolume + clampVolume + supportVolume + deviceVolume + groundVolume
  const pass = totalRequired <= boxCapacity

  return {
    conductorVolume: Math.round(conductorVolume * 100) / 100,
    clampVolume: Math.round(clampVolume * 100) / 100,
    supportVolume: Math.round(supportVolume * 100) / 100,
    deviceVolume: Math.round(deviceVolume * 100) / 100,
    groundVolume: Math.round(groundVolume * 100) / 100,
    totalRequired: Math.round(totalRequired * 100) / 100,
    boxCapacity,
    pass,
    remainingVolume: Math.round((boxCapacity - totalRequired) * 100) / 100,
  }
}
