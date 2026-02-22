// NEC Reference Data Tables for Electrician Calculations
// Targeting 2023 NEC edition

// Wire Circular Mil Areas (AWG/kcmil)
export const WIRE_AREAS: Record<string, number> = {
  '18': 1620,
  '16': 2580,
  '14': 4110,
  '12': 6530,
  '10': 10380,
  '8': 16510,
  '6': 26240,
  '4': 41740,
  '3': 52620,
  '2': 66360,
  '1': 83690,
  '1/0': 105600,
  '2/0': 133100,
  '3/0': 167800,
  '4/0': 211600,
  '250': 250000,
  '300': 300000,
  '350': 350000,
  '400': 400000,
  '500': 500000,
  '600': 600000,
  '750': 750000,
  '1000': 1000000,
}

// Resistance constant K (ohm-cmil/ft)
export const K_FACTOR = {
  copper: 12.9,
  aluminum: 21.2,
}

// NEC Table 310.16 - Ampacities of Insulated Conductors (rated 0-2000V, 60/75/90C)
// 14, 12, 10 AWG capped per NEC 240.4(D) — all temp columns show max OCPD rating
export const AMPACITY_TABLE: Record<string, { cu60: number; cu75: number; cu90: number; al60: number; al75: number; al90: number }> = {
  '14': { cu60: 15, cu75: 15, cu90: 15, al60: 0, al75: 0, al90: 0 },
  '12': { cu60: 20, cu75: 20, cu90: 20, al60: 15, al75: 15, al90: 15 },
  '10': { cu60: 30, cu75: 30, cu90: 30, al60: 25, al75: 25, al90: 25 },
  '8':  { cu60: 40, cu75: 50, cu90: 55, al60: 30, al75: 40, al90: 45 },
  '6':  { cu60: 55, cu75: 65, cu90: 75, al60: 40, al75: 50, al90: 60 },
  '4':  { cu60: 70, cu75: 85, cu90: 95, al60: 55, al75: 65, al90: 75 },
  '3':  { cu60: 85, cu75: 100, cu90: 115, al60: 65, al75: 75, al90: 85 },
  '2':  { cu60: 95, cu75: 115, cu90: 130, al60: 75, al75: 90, al90: 100 },
  '1':  { cu60: 110, cu75: 130, cu90: 145, al60: 85, al75: 100, al90: 115 },
  '1/0': { cu60: 125, cu75: 150, cu90: 170, al60: 100, al75: 120, al90: 135 },
  '2/0': { cu60: 145, cu75: 175, cu90: 195, al60: 115, al75: 135, al90: 150 },
  '3/0': { cu60: 165, cu75: 200, cu90: 225, al60: 130, al75: 155, al90: 175 },
  '4/0': { cu60: 195, cu75: 230, cu90: 260, al60: 150, al75: 180, al90: 205 },
  '250': { cu60: 215, cu75: 255, cu90: 290, al60: 170, al75: 205, al90: 230 },
  '300': { cu60: 240, cu75: 285, cu90: 320, al60: 190, al75: 230, al90: 255 },
  '350': { cu60: 260, cu75: 310, cu90: 350, al60: 210, al75: 250, al90: 280 },
  '400': { cu60: 280, cu75: 335, cu90: 380, al60: 225, al75: 270, al90: 305 },
  '500': { cu60: 320, cu75: 380, cu90: 430, al60: 260, al75: 310, al90: 350 },
  '600': { cu60: 355, cu75: 420, cu90: 475, al60: 285, al75: 340, al90: 385 },
  '750': { cu60: 400, cu75: 475, cu90: 535, al60: 320, al75: 385, al90: 435 },
  '1000': { cu60: 455, cu75: 545, cu90: 615, al60: 375, al75: 445, al90: 500 },
}

// Insulation type temperature ratings
export const INSULATION_TEMP: Record<string, number> = {
  'TW': 60,
  'UF': 60,
  'THW': 75,
  'THWN': 75,
  'XHHW': 75, // when wet; 90C dry
  'USE': 75,
  'THHN': 90,
  'THWN-2': 90,
  'XHHW-2': 90,
  'USE-2': 90,
}

// Temperature correction factors (NEC Table 310.15(B)(1))
export const TEMP_CORRECTION: Record<number, { f60: number; f75: number; f90: number }> = {
  21: { f60: 1.08, f75: 1.05, f90: 1.04 },
  26: { f60: 1.00, f75: 1.00, f90: 1.00 },
  30: { f60: 1.00, f75: 1.00, f90: 1.00 },
  31: { f60: 0.91, f75: 0.94, f90: 0.96 },
  36: { f60: 0.91, f75: 0.94, f90: 0.96 },
  41: { f60: 0.82, f75: 0.88, f90: 0.91 },
  46: { f60: 0.71, f75: 0.82, f90: 0.87 },
  51: { f60: 0.58, f75: 0.75, f90: 0.82 },
  56: { f60: 0.41, f75: 0.67, f90: 0.76 },
  61: { f60: 0.00, f75: 0.58, f90: 0.71 },
}

// Conduit fill derating factors (NEC Table 310.15(C)(1))
export const CONDUIT_FILL_DERATING: Record<string, number> = {
  '1-3': 1.00,
  '4-6': 0.80,
  '7-9': 0.70,
  '10-20': 0.50,
  '21-30': 0.45,
  '31-40': 0.40,
  '41+': 0.35,
}

export function getConduitDerating(wireCount: number): number {
  if (wireCount <= 3) return 1.0
  if (wireCount <= 6) return 0.80
  if (wireCount <= 9) return 0.70
  if (wireCount <= 20) return 0.50
  if (wireCount <= 30) return 0.45
  if (wireCount <= 40) return 0.40
  return 0.35
}

// Wire cross-sectional areas for conduit fill (sq inches) - NEC Chapter 9 Table 5
export const WIRE_CROSS_SECTION: Record<string, Record<string, number>> = {
  'THHN': {
    '14': 0.0097, '12': 0.0133, '10': 0.0211, '8': 0.0366,
    '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
    '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679,
    '4/0': 0.3237, '250': 0.3970, '300': 0.4608, '350': 0.5242,
    '400': 0.5863, '500': 0.7073, '600': 0.8676, '750': 1.0496,
  },
  'THWN': {
    '14': 0.0097, '12': 0.0133, '10': 0.0211, '8': 0.0366,
    '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
    '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679,
    '4/0': 0.3237, '250': 0.3970, '300': 0.4608, '350': 0.5242,
    '400': 0.5863, '500': 0.7073, '600': 0.8676, '750': 1.0496,
  },
  'XHHW': {
    '14': 0.0139, '12': 0.0181, '10': 0.0243, '8': 0.0437,
    '6': 0.0590, '4': 0.0814, '3': 0.0962, '2': 0.1146,
    '1': 0.1534, '1/0': 0.1825, '2/0': 0.2190, '3/0': 0.2642,
    '4/0': 0.3197, '250': 0.3904, '300': 0.4536, '350': 0.5166,
    '400': 0.5782, '500': 0.6984, '600': 0.8709, '750': 1.0532,
  },
}

// Conduit internal areas (sq inches) by type and trade size - NEC Chapter 9 Table 4
export const CONDUIT_AREAS: Record<string, Record<string, number>> = {
  'EMT': {
    '1/2': 0.304, '3/4': 0.533, '1': 0.864, '1-1/4': 1.496,
    '1-1/2': 2.036, '2': 3.356, '2-1/2': 5.858, '3': 8.846,
    '3-1/2': 11.545, '4': 14.753,
  },
  'RMC': {
    '1/2': 0.314, '3/4': 0.533, '1': 0.887, '1-1/4': 1.526,
    '1-1/2': 2.071, '2': 3.408, '2-1/2': 4.866, '3': 7.499,
    '3-1/2': 9.521, '4': 12.554,
  },
  'PVC': {
    '1/2': 0.285, '3/4': 0.508, '1': 0.832, '1-1/4': 1.453,
    '1-1/2': 1.986, '2': 3.291, '2-1/2': 4.695, '3': 7.268,
    '3-1/2': 9.737, '4': 12.554,
  },
}

// NEC conduit fill limits - Chapter 9 Table 1
export function getConduitFillLimit(wireCount: number): number {
  if (wireCount === 1) return 0.53
  if (wireCount === 2) return 0.31
  return 0.40
}

// Box fill volume allowances per conductor (cubic inches) - NEC 314.16(B)
export const BOX_FILL_ALLOWANCE: Record<string, number> = {
  '18': 1.50,
  '16': 1.75,
  '14': 2.00,
  '12': 2.25,
  '10': 2.50,
  '8': 3.00,
  '6': 5.00,
}

// Standard box volumes (cubic inches) - NEC Table 314.16(A)
export const STANDARD_BOXES: Record<string, { description: string; volume: number }> = {
  '4x1.25-sq': { description: '4" Square x 1-1/4" deep', volume: 18.0 },
  '4x1.5-sq': { description: '4" Square x 1-1/2" deep', volume: 21.0 },
  '4x2.125-sq': { description: '4" Square x 2-1/8" deep', volume: 30.3 },
  '4-11/16x1.25-sq': { description: '4-11/16" Square x 1-1/4" deep', volume: 25.5 },
  '4-11/16x1.5-sq': { description: '4-11/16" Square x 1-1/2" deep', volume: 29.5 },
  '4-11/16x2.125-sq': { description: '4-11/16" Square x 2-1/8" deep', volume: 42.0 },
  '3x2x1.5': { description: '3" x 2" x 1-1/2" Device Box', volume: 7.5 },
  '3x2x2': { description: '3" x 2" x 2" Device Box', volume: 10.0 },
  '3x2x2.25': { description: '3" x 2" x 2-1/4" Device Box', volume: 10.5 },
  '3x2x2.5': { description: '3" x 2" x 2-1/2" Device Box', volume: 12.5 },
  '3x2x2.75': { description: '3" x 2" x 2-3/4" Device Box', volume: 14.0 },
  '3x2x3.5': { description: '3" x 2" x 3-1/2" Device Box', volume: 18.0 },
  '4-oct-1.25': { description: '4" Octagonal x 1-1/4" deep', volume: 12.5 },
  '4-oct-1.5': { description: '4" Octagonal x 1-1/2" deep', volume: 15.5 },
  '4-oct-2.125': { description: '4" Octagonal x 2-1/8" deep', volume: 21.5 },
}

// Pipe bending multipliers
export const BEND_MULTIPLIERS: Record<number, { multiplier: number; shrinkage: number }> = {
  10: { multiplier: 6.0, shrinkage: 1 / 16 },
  22.5: { multiplier: 2.6, shrinkage: 3 / 16 },
  30: { multiplier: 2.0, shrinkage: 1 / 4 },
  45: { multiplier: 1.414, shrinkage: 3 / 8 },
  60: { multiplier: 1.155, shrinkage: 1 / 2 },
}

// Common wire sizes for dropdowns
export const WIRE_SIZES = [
  '14', '12', '10', '8', '6', '4', '3', '2', '1',
  '1/0', '2/0', '3/0', '4/0',
  '250', '300', '350', '400', '500', '600', '750', '1000',
]

export const COMMON_WIRE_SIZES = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0']

export const SYSTEM_VOLTAGES = [120, 208, 240, 277, 480]

export const CONDUIT_TYPES = ['EMT', 'RMC', 'PVC'] as const
export const CONDUIT_TRADE_SIZES = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2', '2-1/2', '3', '3-1/2', '4'] as const
export const INSULATION_TYPES = ['THHN', 'THWN', 'XHHW'] as const
export const MATERIAL_TYPES = ['copper', 'aluminum'] as const
export const BEND_TYPES = ['offset', '90', '3-point-saddle', '4-point-saddle'] as const
