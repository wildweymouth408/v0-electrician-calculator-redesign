'use client'

import { useState, useMemo } from 'react'
import {
  Search, Mic, Bookmark, AlertTriangle, Check, X, Zap, ChevronRight,
  Calculator, Star, BookOpen, ChevronDown, ChevronUp, Clock,
  Grid3X3, Settings, Bell, Cable, Speaker, Flame, ShieldAlert
} from 'lucide-react'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Section = 'code' | 'symbols' | 'inspect'

interface KeyPoint {
  id: string
  text: string
  plainEnglish: string
  application: string
  exceptions?: string[]
}

interface Violation {
  scenario: string
  consequence: string
  fix: string
}

interface NECArticle {
  article: string
  title: string
  scope: string
  keyPoints: KeyPoint[]
  commonViolations: Violation[]
  relatedArticles: string[]
}

interface InspectionItem {
  id: string
  title: string
  nec: string
  severity: 'critical' | 'major' | 'minor'
  category: string
  what_fails: string
  why_it_fails: string
  what_passes: string
  inspector_note: string
  photo_prompt: string
  has_diagram: boolean
}

interface SymbolCategory {
  id: string
  name: string
  icon: typeof Zap
  color: string
  symbols: { symbol: string; name: string; description?: string }[]
}

// ─── NEC DATABASE ─────────────────────────────────────────────────────────────

const necDatabase: NECArticle[] = [
  {
    article: "110.26",
    title: "Working Space About Electrical Equipment",
    scope: "Requirements for safe access and working space around electrical equipment",
    keyPoints: [
      {
        id: "110.26(A)",
        text: "Working space shall be not less than 30 inches wide, 36 inches deep, and 6.5 feet high",
        plainEnglish: "3 feet clear space in front of panels, floor to ceiling",
        application: "All panelboards, switchboards, motor control centers"
      },
      {
        id: "110.26(B)",
        text: "Clear working space required in front of equipment for safe operation",
        plainEnglish: "No storage, boxes, or equipment blocking electrical panels",
        application: "Electrical rooms, mechanical rooms, utility spaces"
      }
    ],
    commonViolations: [
      { scenario: "Storage boxes blocking electrical panel", consequence: "No safe access for maintenance, arc flash hazard, OSHA violation", fix: "Clear 36-inch deep, 30-inch wide, 6.5-foot high working space. Mark with floor tape." },
      { scenario: "Panel mounted too close to wall (less than 30 inches wide space)", consequence: "Unable to safely work on energized equipment", fix: "Relocate panel or widen access aisle to minimum 30 inches" }
    ],
    relatedArticles: ["110.27", "408.36", "250.24"]
  },
  {
    article: "210.8",
    title: "GFCI Protection for Personnel",
    scope: "Ground-fault circuit-interrupter protection requirements to prevent shock",
    keyPoints: [
      {
        id: "210.8(A)",
        text: "GFCI protection required for all 125V single-phase 15A and 20A outlets in bathrooms, garages, outdoors, crawl spaces, unfinished basements, kitchens, laundry areas",
        plainEnglish: "GFCI outlets or breakers required near water, outside, and damp locations",
        application: "All residential, commercial, and industrial 120V general purpose outlets",
        exceptions: ["Dedicated appliance circuits not readily accessible", "Garage door openers in some jurisdictions"]
      },
      {
        id: "210.8(B)",
        text: "Commercial and industrial facilities: GFCI for all 125V 15A/20A outlets in bathrooms, rooftops, kitchens",
        plainEnglish: "Commercial kitchens, outdoor roof outlets, bathrooms need GFCI",
        application: "Commercial tenant spaces, restaurants, office kitchens"
      }
    ],
    commonViolations: [
      { scenario: "Standard outlet within 6 feet of commercial sink without GFCI", consequence: "Shock hazard in wet location, inspection failure", fix: "Install GFCI receptacle or GFCI circuit breaker" },
      { scenario: "Missing GFCI in unfinished basement", consequence: "Electrocution risk in damp environment", fix: "Install GFCI protection for all 120V outlets in unfinished basements" }
    ],
    relatedArticles: ["210.12", "406.4", "590.6"]
  },
  {
    article: "210.12",
    title: "Arc-Fault Circuit-Interrupter Protection",
    scope: "AFCI requirements to prevent fires from electrical arcing",
    keyPoints: [
      {
        id: "210.12(A)",
        text: "All 120V single-phase 15A and 20A branch circuits supplying outlets or devices in dwelling units shall be AFCI protected",
        plainEnglish: "AFCI breakers required for almost all residential circuits (2023 NEC)",
        application: "Bedrooms, living rooms, hallways, closets, kitchens, laundry rooms",
        exceptions: ["Branch circuits supplying only fire alarm systems"]
      }
    ],
    commonViolations: [
      { scenario: "Standard breaker used for bedroom circuit instead of AFCI", consequence: "Fire safety violation, failed inspection, insurance issues", fix: "Install combination-type AFCI circuit breaker" },
      { scenario: "AFCI breaker nuisance tripping with refrigerator or garage door opener", consequence: "Loss of power to critical equipment", fix: "Use AFCI breaker designed for motor loads, or dedicated non-AFCI circuit if code permits" }
    ],
    relatedArticles: ["210.8", "406.4", "550.25"]
  },
  {
    article: "250.24",
    title: "Grounding Service-Supplied AC Systems",
    scope: "Connection of grounded conductor to grounding electrode system at service",
    keyPoints: [
      {
        id: "250.24(A)",
        text: "The grounded conductor shall be connected to the grounding electrode system at the service point",
        plainEnglish: "Neutral connects to ground ONLY at the main service panel",
        application: "Main service entrance - bonding screw/strap installed",
        exceptions: ["Separately derived systems per 250.30"]
      },
      {
        id: "250.24(B)",
        text: "Main bonding jumper shall connect the grounded conductor to the equipment grounding conductor",
        plainEnglish: "In main panel only, connect neutral bus to ground bus/case",
        application: "Main service panel - remove this bond in subpanels"
      }
    ],
    commonViolations: [
      { scenario: "Bonding screw left in subpanel (neutral and ground bonded)", consequence: "Neutral current flows on ground paths, creates shock hazard, violates 250.24", fix: "Remove green bonding screw or strap in subpanel. Neutral and ground must be separate downstream of main." },
      { scenario: "Subpanel fed with 3-wire (no separate ground) instead of 4-wire", consequence: "No equipment grounding path, shock hazard", fix: "Run 4-wire feeder (2 hots, neutral, ground) to subpanel" }
    ],
    relatedArticles: ["250.32", "408.36", "310.16"]
  },
  {
    article: "250.32",
    title: "Grounding at Separate Buildings",
    scope: "Grounding requirements for feeders to detached structures",
    keyPoints: [
      {
        id: "250.32(A)",
        text: "Grounding electrode required at separate building supplied by feeder",
        plainEnglish: "Running power to garage or shed? Needs ground rod(s) there",
        application: "Detached garages, workshops, outbuildings with subpanels",
        exceptions: ["Single branch circuit with no subpanel"]
      },
      {
        id: "250.32(B)",
        text: "Grounded conductor not to be connected to equipment grounding conductors at separate buildings",
        plainEnglish: "Subpanel in garage: neutral isolated from ground, remove bonding screw",
        application: "All subpanels in detached structures"
      }
    ],
    commonViolations: [
      { scenario: "Garage subpanel with neutral and ground bonded together", consequence: "Parallel paths for neutral current, shock hazard, code violation", fix: "Remove bonding screw in garage subpanel. Install separate ground bar." },
      { scenario: "Missing ground rod(s) at detached structure", consequence: "Inadequate grounding, potential equipment damage, inspection fail", fix: "Install minimum two ground rods 6 feet apart at separate building" }
    ],
    relatedArticles: ["250.24", "250.53", "408.36"]
  },
  {
    article: "250.53",
    title: "Grounding Electrode Installation",
    scope: "Requirements for grounding electrodes and their installation",
    keyPoints: [
      { id: "250.53(A)", text: "Rod, pipe, and plate electrodes shall not be less than 8 feet in length", plainEnglish: "Ground rods must be 8 feet long, driven fully except for connection", application: "Commercial and residential services" },
      { id: "250.53(B)", text: "Two grounding electrodes required unless single rod proves <25 ohms resistance", plainEnglish: "Install two ground rods minimum - don't bother testing, just add the second", application: "All new construction, commercial services" },
      { id: "250.53(C)", text: "Spacing of electrode shall be not less than 6 feet apart", plainEnglish: "Ground rods must be minimum 6 feet apart to be effective", application: "Multiple ground rod installations" }
    ],
    commonViolations: [
      { scenario: "Single ground rod for commercial service without resistance test", consequence: "Inadequate grounding, potential equipment damage, inspection failure", fix: "Install second ground rod minimum 6 feet from first, or perform fall-of-potential test proving <25 ohms" },
      { scenario: "Ground rods installed only 2-3 feet apart", consequence: "Electrodes act as single ground, ineffective grounding system", fix: "Space ground rods minimum 6 feet apart (more is better)" }
    ],
    relatedArticles: ["250.24", "250.32", "250.66"]
  },
  {
    article: "310.16",
    title: "Allowable Ampacities",
    scope: "Ampacity tables for wire sizing based on temperature ratings",
    keyPoints: [
      { id: "310.16-General", text: "Ampacities for conductors rated 0-2000 volts per Table 310.16", plainEnglish: "How many amps can this wire carry? Depends on temperature rating (60°C, 75°C, 90°C)", application: "Sizing branch circuit and feeder conductors" },
      { id: "310.15(B)(3)(a)", text: "Adjustment factors for more than three current-carrying conductors in raceway", plainEnglish: "4-6 wires in conduit = 80% of table ampacity. 7-9 wires = 70%.", application: "Conduit fill derating calculations" }
    ],
    commonViolations: [
      { scenario: "14 AWG wire on 20A breaker (using 60°C ampacity)", consequence: "Fire hazard from overheated conductors, insulation damage", fix: "Use 12 AWG minimum for 20A circuits, or downsize breaker to 15A" },
      { scenario: "Not derating ampacity for 6 circuits in single conduit", consequence: "Conductors overheat due to bundled heat, fire hazard", fix: "Apply 80% derating factor to Table 310.16 ampacities, or separate circuits into multiple conduits" }
    ],
    relatedArticles: ["210.19", "250.66", "314.16"]
  },
  {
    article: "314.16",
    title: "Box Fill Calculations",
    scope: "Box fill calculations and volume requirements",
    keyPoints: [
      { id: "314.16(A)", text: "Boxes shall be of sufficient size to provide free space for all enclosed conductors", plainEnglish: "Count your wires - each box has maximum fill capacity", application: "All junction boxes, outlet boxes, device boxes" },
      { id: "314.16(B)", text: "Volume allowance: 14 AWG = 2.00 cu.in., 12 AWG = 2.25 cu.in., 10 AWG = 2.50 cu.in.", plainEnglish: "14 gauge wire takes 2 cubic inches, 12 gauge takes 2.25, etc.", application: "Calculating required box size" },
      { id: "314.16(B)(4)", text: "Device or equipment fill shall be counted as 2 conductors", plainEnglish: "Switch or receptacle in box counts as 2 wires worth of space", application: "Device box calculations" },
      { id: "314.16(B)(2)", text: "Clamp fill shall be counted as 1 conductor", plainEnglish: "Cable clamps inside box count as 1 wire worth of space", application: "Metal box calculations" }
    ],
    commonViolations: [
      { scenario: "Box overstuffed with too many wire connections", consequence: "Overheating, damaged wire insulation, short circuits, inspection fail", fix: "Calculate fill: count each wire + device (as 2) + clamps (as 1). Use larger box or add extension ring if overfilled." },
      { scenario: "4-inch square box with 12 AWG wires and receptacle - no extension ring", consequence: "Box overfilled beyond 21 cubic inches, wires compressed", fix: "4-inch square = 21 cu.in. max. Add extension ring for additional wires." }
    ],
    relatedArticles: ["314.20", "314.24", "300.14"]
  }
]

// ─── INSPECTION DATA ──────────────────────────────────────────────────────────

const inspectionItems: InspectionItem[] = [
  {
    id: 'subpanel-bond',
    title: 'Subpanel Neutral-Ground Bond',
    nec: '250.24 / 250.32',
    severity: 'critical',
    category: 'Grounding',
    what_fails: 'Green bonding screw or bonding strap installed in subpanel — neutral bus connected to ground bus or panel enclosure.',
    why_it_fails: 'Creates parallel paths for neutral current to flow back on equipment grounds and conduit. Causes stray voltage on metal surfaces, nuisance breaker trips, and shock hazard. This is the #1 most common commercial inspection failure.',
    what_passes: 'Neutral bus isolated from enclosure (floating). Separate ground bar bolted to panel enclosure. Green bonding screw removed and retained or discarded. 4-wire feeder with separate EGC.',
    inspector_note: 'Inspectors will physically check that the neutral bus is isolated. They will look for the bonding screw — if it\'s in, it fails. They will also verify a 4-wire feeder. A 3-wire feeder to a subpanel is an automatic fail.',
    photo_prompt: 'Close-up photo of electrical subpanel interior showing neutral bus bar with green bonding screw installed, commercial electrical panel, realistic professional photo',
    has_diagram: true
  },
  {
    id: 'working-clearance',
    title: 'Insufficient Working Clearance',
    nec: '110.26',
    severity: 'critical',
    category: 'Panel Access',
    what_fails: 'Any object within 36 inches in front of panel. Storage, equipment, piping, structural columns, or another panel facing the same direction that reduces clearance below 36".',
    why_it_fails: 'Energized work requires safe access. OSHA and NEC both require 3 feet of clear space. Even temporary storage fails inspection — "temporary" doesn\'t matter.',
    what_passes: '36" minimum depth, 30" minimum width, 6\'6" minimum height of clear working space. Space dedicated — not used for storage, passage, or other equipment. Mark floor with yellow line or tape.',
    inspector_note: 'Inspectors will physically walk into the space and measure. They will also check headroom. Common in commercial TI work where panels end up behind new walls or in storage areas.',
    photo_prompt: 'Electrical panel with boxes and storage materials blocking front access in commercial building, code violation, realistic photo',
    has_diagram: false
  },
  {
    id: 'open-knockouts',
    title: 'Open Knockouts / Missing Covers',
    nec: '110.12 / 408.7',
    severity: 'major',
    category: 'Panel Integrity',
    what_fails: 'Any open knockout in a panel enclosure, junction box, or wireway. Missing breaker blanks. Open holes in enclosures from removed conduit fittings.',
    why_it_fails: 'Allows insects, rodents, moisture, and fingers into energized equipment. Also creates arc flash hazard — fault current can exit through opening. Inspectors treat this as negligence.',
    what_passes: 'All unused knockouts sealed with listed plugs or snap-in fillers. All breaker positions filled — blank fillers for unused slots. Conduit connections made with listed fittings, no open entries.',
    inspector_note: 'Quick visual check — inspectors scan the entire panel face and sides. Open breaker slots and open knockouts are instant write-ups. Keep a bag of knockout seals and breaker blanks on every job.',
    photo_prompt: 'Electrical panel with multiple open knockouts and missing breaker blanks, commercial panelboard, realistic close-up photo',
    has_diagram: false
  },
  {
    id: 'conduit-support',
    title: 'Improper Conduit Support Spacing',
    nec: '358.30 (EMT) / 344.30 (RMC)',
    severity: 'major',
    category: 'Conduit',
    what_fails: 'EMT without support within 3 feet of every box, fitting, or enclosure. EMT runs exceeding 10 feet between supports. RMC exceeding 10-14 feet (depends on size) between supports.',
    why_it_fails: 'Unsupported conduit sags, creates stress on connections, allows conduit to pull from fittings during fault conditions. Also a safety hazard if conduit falls.',
    what_passes: 'EMT: support within 3\' of every termination, max 10\' between supports. RMC: within 3\' of terminations, spacing per Table 344.30(B)(2). Strut, pipe clamps, beam clamps, or listed hangers — no wire hangers.',
    inspector_note: 'Inspectors walk the conduit runs and look for long unsupported spans. Above-ceiling work is common fail location. Measure the spans if it looks close. Wire hangers are an automatic fail — unlisted support method.',
    photo_prompt: 'EMT conduit run in commercial ceiling without proper support straps, sagging between joists, code violation photo',
    has_diagram: false
  },
  {
    id: 'gfci-missing',
    title: 'Missing GFCI Protection',
    nec: '210.8',
    severity: 'major',
    category: 'Protection',
    what_fails: 'Standard receptacles within 6 feet of sinks. Any outdoor receptacle without GFCI. Receptacles in commercial kitchens, break rooms, bathrooms without GFCI. Receptacles in unfinished areas without GFCI.',
    why_it_fails: 'Personnel shock protection. Water and electricity in proximity create electrocution risk. NEC 210.8 requirements have expanded significantly — many locations now require GFCI that didn\'t before 2020 NEC.',
    what_passes: 'GFCI receptacle OR GFCI breaker protecting the circuit. GFCI breaker is cleaner on commercial work — protects entire circuit. Label downstream non-GFCI outlets "GFCI Protected" with stickers.',
    inspector_note: 'Inspectors test every GFCI with a plug-in tester. They check trip and reset. Outdoor, kitchen, bathroom, near sinks — they know where to look. Don\'t forget rooftop mechanical areas.',
    photo_prompt: 'Standard non-GFCI outlet installed near commercial kitchen sink, close-up realistic photo, code violation',
    has_diagram: false
  },
  {
    id: 'box-fill-exceeded',
    title: 'Box Fill Exceeded',
    nec: '314.16',
    severity: 'major',
    category: 'Boxes',
    what_fails: 'Too many conductors, devices, and fittings crammed into a box beyond its listed cubic inch volume. Most common in device boxes with multiple circuits, wire nuts pushed in on top.',
    why_it_fails: 'Overheating from compressed insulation, damaged wire insulation from sharp edges, connections pulled loose from overcrowding. Fire and shock hazard.',
    what_passes: 'Calculate fill before rough-in: count conductors (each = 1 volume allowance), devices (each = 2), clamps (all = 1), grounds (all = 1). Total cubic inches must not exceed box rating. Use larger box or extension ring.',
    inspector_note: 'Inspectors spot-check boxes, especially busy ones with multiple circuits. They look for wire insulation damage, wires kinked around edges, and boxes that clearly can\'t close. Carry extension rings.',
    photo_prompt: 'Electrical junction box with too many wires and wire nuts overflowing, overfilled device box, realistic close-up photo',
    has_diagram: true
  },
  {
    id: 'panel-labeling',
    title: 'Unlabeled or Illegible Panel Directory',
    nec: '408.4',
    severity: 'major',
    category: 'Labeling',
    what_fails: 'Missing circuit directory. Illegible or penciled directory. Circuits labeled "spare" when actually connected. Directory that doesn\'t match actual circuit assignments.',
    why_it_fails: 'Emergency responders and maintenance personnel need to identify circuits quickly. Incorrect labeling is an active safety hazard. NEC 408.4(A) requires every circuit to be legibly identified.',
    what_passes: 'Permanent, typed or printed directory. Every circuit identified with clear description of load and location. "SPARE" only for truly disconnected circuits. Updated when circuits change. Affixed inside panel door.',
    inspector_note: 'Inspectors open every panel and check the directory. Handwritten is technically acceptable but typed shows professionalism. "Panel A" and "Panel B" without content is an automatic fail. Update during rough-in, not after.',
    photo_prompt: 'Electrical panel directory with missing labels and illegible handwritten circuit descriptions, commercial panelboard, realistic photo',
    has_diagram: false
  },
  {
    id: 'wire-connections',
    title: 'Splices Outside of Boxes',
    nec: '300.15',
    severity: 'critical',
    category: 'Wiring',
    what_fails: 'Wire nuts or other splices made in conduit, in walls, above ceiling without accessible junction box, or any location other than a listed box or fitting.',
    why_it_fails: 'Connections must be accessible for maintenance and inspection. Connections in inaccessible locations can\'t be inspected for tightening. Failed connections cause arcing, fires.',
    what_passes: 'All splices in listed boxes with covers. Boxes accessible without damaging building. If conduit sleeve has a splice, install a junction box. Wire nuts in conduit bodies only if listed for that use.',
    inspector_note: 'Inspectors pull on wires in conduit to feel for splices. They look for junction boxes above ceiling that are blocked or buried. "Above ceiling accessible" means actually accessible, not buried under insulation.',
    photo_prompt: 'Wire nuts and electrical splice made inside conduit without junction box, code violation, realistic photo',
    has_diagram: false
  },
  {
    id: 'conduit-fill',
    title: 'Conduit Fill Exceeded',
    nec: 'Chapter 9, Table 1',
    severity: 'major',
    category: 'Conduit',
    what_fails: '3 or more conductors filling more than 40% of conduit cross-sectional area. Pulling too many circuits through one conduit to save money.',
    why_it_fails: 'Heat buildup from multiple conductors requires derating ampacity. Overfilling makes pulling impossible and damages insulation. Violates both fill rules and ampacity derating requirements.',
    what_passes: 'Maximum 40% fill for 3+ conductors. Calculate conductor areas from NEC Chapter 9 Table 5. Select conduit size from Chapter 9 Table 4. Document calculation if questioned.',
    inspector_note: 'Inspectors count conductors and conduit size. They know the tables. If you have 12 conductors in 1" EMT, they will write it up. Show your fill calculation on the job folder.',
    photo_prompt: 'Overfilled EMT conduit with too many wires being pulled through, conduit fill violation, realistic photo',
    has_diagram: true
  },
  {
    id: 'weatherproof-covers',
    title: 'Missing Weatherproof Covers',
    nec: '406.9',
    severity: 'minor',
    category: 'Wet Locations',
    what_fails: 'Outdoor receptacles without in-use weatherproof covers (bubble covers). Outlet boxes in wet locations with standard flat covers. Exterior fixtures without wet/damp rated covers.',
    why_it_fails: 'Water infiltration causes shock hazard and equipment damage. 406.9(B)(1) requires "extra-duty" in-use covers for all outdoor receptacles since 2008 NEC.',
    what_passes: 'Extra-duty in-use weatherproof covers (bubble style) on all outdoor receptacles. While-in-use covers stay closed over plugged cords. WP/WR rated devices in wet locations.',
    inspector_note: 'Quick visual on all exterior outlets. Flat covers on outdoor receptacles are an automatic fail — they were code before 2008 but not since. Extra-duty only, not standard WP covers.',
    photo_prompt: 'Outdoor electrical receptacle with flat weatherproof cover instead of bubble in-use cover, exterior wall, code violation photo',
    has_diagram: false
  },
  {
    id: 'wire-size-breaker',
    title: 'Conductor Ampacity vs Breaker Mismatch',
    nec: '240.4',
    severity: 'critical',
    category: 'Overcurrent Protection',
    what_fails: '14 AWG wire on 20A breaker. 12 AWG wire on 30A breaker. Any conductor protected by an overcurrent device larger than its ampacity allows.',
    why_it_fails: 'Overcurrent protection exists to protect the conductor. If the breaker doesn\'t trip before the wire overheats, insulation burns and fires start. This is how residential fires start.',
    what_passes: '14 AWG max 15A. 12 AWG max 20A. 10 AWG max 30A. Follow Table 310.16 ampacity for the termination temperature rating. When in doubt, go larger wire or smaller breaker.',
    inspector_note: 'Inspectors check wire size against breaker size at panels and at the load end. They look for 14 AWG on 20A circuits specifically — it\'s extremely common. Label your wire reels.',
    photo_prompt: 'Electrical panel showing 14 AWG wire connected to 20 amp circuit breaker, close-up realistic photo',
    has_diagram: true
  },
  {
    id: 'equipment-grounding',
    title: 'Missing Equipment Grounding Conductor',
    nec: '250.118',
    severity: 'critical',
    category: 'Grounding',
    what_fails: 'Metal conduit used as sole grounding path without proper connections. Non-metallic conduit run without a separate EGC pulled. Fixtures and equipment without grounding connection.',
    why_it_fails: 'Equipment grounding provides the fault current path to trip the breaker. Without a reliable EGC, a fault on equipment leaves it energized at line voltage — lethal touch hazard.',
    what_passes: 'Listed EGC type per 250.118 — equipment grounding conductor in raceway, metallic conduit with proper connections, or separate green/bare conductor. Verify continuity at panel.',
    inspector_note: 'Inspectors check grounding at panels and spot-check at device locations. PVC conduit without EGC pulled is an automatic fail. Verify all metal boxes are grounded.',
    photo_prompt: 'PVC conduit run to junction box without equipment grounding conductor pulled, electrical installation, realistic photo',
    has_diagram: false
  }
]

// ─── SYMBOL DATA ──────────────────────────────────────────────────────────────

const symbolData: SymbolCategory[] = [
  {
    id: 'power', name: 'Power & Distribution', icon: Zap, color: '#ff6b00',
    symbols: [
      { symbol: 'LP', name: 'Lighting Panel', description: 'Panelboard - Lighting' },
      { symbol: 'PP', name: 'Power Panel', description: 'Panelboard - Power' },
      { symbol: 'MCC', name: 'Motor Control Center' },
      { symbol: 'SWBD', name: 'Switchboard' },
      { symbol: 'SWGR', name: 'Switchgear' },
      { symbol: 'T', name: 'Transformer', description: 'Dry type transformer' },
      { symbol: 'ATS', name: 'Automatic Transfer Switch' },
      { symbol: 'GEN', name: 'Generator' },
      { symbol: 'DISC', name: 'Disconnect', description: 'Unfused disconnect' },
      { symbol: 'CB', name: 'Circuit Breaker' },
      { symbol: 'CT', name: 'Current Transformer' },
      { symbol: 'PB', name: 'Pull Box' },
      { symbol: 'JB', name: 'Junction Box' },
    ]
  },
  {
    id: 'outlets', name: 'Receptacles & Outlets', icon: Cable, color: '#00d4ff',
    symbols: [
      { symbol: '○', name: 'Duplex Receptacle', description: 'Standard 120V outlet' },
      { symbol: '○ GFCI', name: 'GFCI Receptacle', description: 'Ground fault protected' },
      { symbol: '○ IG', name: 'Isolated Ground', description: 'Separate ground path' },
      { symbol: '○ WP', name: 'Weatherproof', description: 'Outdoor rated' },
      { symbol: '○ T', name: 'Tamper Resistant' },
      { symbol: '○ E', name: 'Emergency Circuit' },
      { symbol: '⌂', name: 'Floor Box', description: 'Flush floor receptacle' },
    ]
  },
  {
    id: 'switches', name: 'Switches & Controls', icon: Settings, color: '#00ff88',
    symbols: [
      { symbol: 'S', name: 'Single Pole Switch' },
      { symbol: 'S2', name: 'Double Pole Switch' },
      { symbol: 'S3', name: 'Three-Way Switch' },
      { symbol: 'S4', name: 'Four-Way Switch' },
      { symbol: 'D', name: 'Dimmer Switch' },
      { symbol: 'S T', name: 'Timer Switch' },
      { symbol: 'S P', name: 'Pilot Light Switch' },
      { symbol: 'M', name: 'Occupancy Sensor', description: 'Ceiling mounted' },
      { symbol: 'PS', name: 'Photo Sensor', description: 'Daylight harvesting' },
    ]
  },
  {
    id: 'fire', name: 'Fire Alarm', icon: Flame, color: '#ff4444',
    symbols: [
      { symbol: 'FACP', name: 'Fire Alarm Control Panel' },
      { symbol: 'F S', name: 'Horn Strobe', description: 'Combination unit' },
      { symbol: 'F', name: 'Pull Station', description: 'Manual fire alarm' },
      { symbol: 'S', name: 'Smoke Detector', description: 'Ceiling mounted' },
      { symbol: 'S D', name: 'Duct Smoke Detector' },
      { symbol: 'H', name: 'Heat Detector' },
      { symbol: 'FS', name: 'Flow Switch', description: 'Water flow - sprinkler' },
    ]
  },
  {
    id: 'communication', name: 'Comm & Data', icon: Speaker, color: '#8888ff',
    symbols: [
      { symbol: 'T', name: 'Telephone Outlet' },
      { symbol: 'D', name: 'Data Outlet', description: 'Ethernet/computer' },
      { symbol: 'TV', name: 'Cable TV Outlet' },
      { symbol: 'WAP', name: 'Wireless Access Point' },
      { symbol: 'CCTV', name: 'Security Camera' },
      { symbol: 'CR', name: 'Card Reader' },
      { symbol: 'IC', name: 'Intercom' },
    ]
  },
  {
    id: 'conduit', name: 'Conduit & Wiring', icon: Cable, color: '#ffaa00',
    symbols: [
      { symbol: '- - -', name: 'Concealed Conduit', description: 'In walls/ceiling' },
      { symbol: '——', name: 'Exposed Conduit', description: 'Surface mounted' },
      { symbol: '···', name: 'Underground', description: 'Buried conduit' },
      { symbol: 'EMT', name: 'Electrical Metallic Tubing' },
      { symbol: 'RMC', name: 'Rigid Metal Conduit' },
      { symbol: 'IMC', name: 'Intermediate Metal Conduit' },
      { symbol: 'FMC', name: 'Flexible Metal Conduit' },
      { symbol: 'LFMC', name: 'Liquidtight Flexible' },
      { symbol: 'PVC', name: 'PVC Conduit', description: 'Schedule 40/80' },
      { symbol: 'MC', name: 'Metal Clad Cable' },
      { symbol: 'NM', name: 'Nonmetallic Sheathed', description: 'Romex' },
    ]
  },
  {
    id: 'motors', name: 'Motors & Equipment', icon: Settings, color: '#00ffff',
    symbols: [
      { symbol: 'M', name: 'Motor' },
      { symbol: 'C', name: 'Contactor' },
      { symbol: 'OL', name: 'Overload Relay' },
      { symbol: 'ASD', name: 'VFD Drive', description: 'Adjustable speed drive' },
      { symbol: 'EF', name: 'Exhaust Fan' },
      { symbol: 'UH', name: 'Unit Heater' },
      { symbol: 'WH', name: 'Water Heater' },
    ]
  }
]

const abbreviations = [
  { abbr: 'AFF', meaning: 'Above Finished Floor' },
  { abbr: 'AFG', meaning: 'Above Finished Grade' },
  { abbr: 'CKT', meaning: 'Circuit' },
  { abbr: 'FLA', meaning: 'Full Load Amps' },
  { abbr: 'LRA', meaning: 'Locked Rotor Amps' },
  { abbr: 'MCA', meaning: 'Minimum Circuit Amps' },
  { abbr: 'MOCP', meaning: 'Maximum Overcurrent Protection' },
  { abbr: 'GFCI', meaning: 'Ground Fault Circuit Interrupter' },
  { abbr: 'AFCI', meaning: 'Arc Fault Circuit Interrupter' },
  { abbr: 'EGC', meaning: 'Equipment Grounding Conductor' },
  { abbr: 'GEC', meaning: 'Grounding Electrode Conductor' },
  { abbr: 'WP', meaning: 'Weatherproof' },
  { abbr: 'XP', meaning: 'Explosion Proof' },
  { abbr: 'FBO', meaning: 'Furnished By Others' },
  { abbr: 'U.N.O.', meaning: 'Unless Noted Otherwise' },
  { abbr: 'TYP', meaning: 'Typical' },
]

// ─── SVG DIAGRAMS ─────────────────────────────────────────────────────────────

function SubpanelBondDiagram({ wrong }: { wrong: boolean }) {
  return (
    <svg viewBox="0 0 200 160" className="w-full" style={{ maxHeight: 160 }}>
      <rect x="30" y="20" width="140" height="120" fill="#1a1f2e" stroke={wrong ? '#ff4444' : '#00ff88'} strokeWidth="2" rx="3" />
      <text x="100" y="38" textAnchor="middle" fill="#888" fontSize="9" fontFamily="monospace">SUBPANEL</text>
      <rect x="55" y="50" width="8" height="70" fill="#00d4ff" rx="1" />
      <text x="59" y="132" textAnchor="middle" fill="#00d4ff" fontSize="8" fontFamily="monospace">N</text>
      <rect x="137" y="50" width="8" height="70" fill="#00ff88" rx="1" />
      <text x="141" y="132" textAnchor="middle" fill="#00ff88" fontSize="8" fontFamily="monospace">G</text>
      <line x1="59" y1="55" x2="40" y2="55" stroke="#00d4ff" strokeWidth="1.5" />
      <line x1="59" y1="70" x2="40" y2="70" stroke="#00d4ff" strokeWidth="1.5" />
      <line x1="59" y1="85" x2="40" y2="85" stroke="#00d4ff" strokeWidth="1.5" />
      <line x1="141" y1="55" x2="160" y2="55" stroke="#00ff88" strokeWidth="1.5" />
      <line x1="141" y1="70" x2="160" y2="70" stroke="#00ff88" strokeWidth="1.5" />
      {wrong ? (
        <>
          <line x1="63" y1="90" x2="137" y2="90" stroke="#ff4444" strokeWidth="2.5" strokeDasharray="4,2" />
          <circle cx="100" cy="90" r="8" fill="#ff4444" opacity="0.2" />
          <text x="100" y="94" textAnchor="middle" fill="#ff4444" fontSize="9" fontWeight="bold">✕</text>
          <text x="100" y="108" textAnchor="middle" fill="#ff4444" fontSize="7" fontFamily="monospace">BONDED - WRONG</text>
        </>
      ) : (
        <>
          <text x="100" y="94" textAnchor="middle" fill="#00ff88" fontSize="7" fontFamily="monospace">ISOLATED</text>
          <text x="100" y="105" textAnchor="middle" fill="#00ff88" fontSize="7" fontFamily="monospace">NO BOND ✓</text>
          <line x1="80" y1="118" x2="120" y2="118" stroke="#00ff88" strokeWidth="1" />
          <line x1="86" y1="122" x2="114" y2="122" stroke="#00ff88" strokeWidth="1" />
          <line x1="93" y1="126" x2="107" y2="126" stroke="#00ff88" strokeWidth="1" />
          <text x="100" y="135" textAnchor="middle" fill="#00ff88" fontSize="7" fontFamily="monospace">EARTH</text>
        </>
      )}
    </svg>
  )
}

function BoxFillDiagram({ wrong }: { wrong: boolean }) {
  return (
    <svg viewBox="0 0 200 140" className="w-full" style={{ maxHeight: 140 }}>
      <rect x="50" y="20" width="100" height="90" fill="#1a1f2e" stroke={wrong ? '#ff4444' : '#00ff88'} strokeWidth="2" rx="2" />
      <text x="100" y="14" textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">4" SQUARE BOX</text>
      {wrong ? (
        <>
          {[30,42,54,66,78,88,98,108].map((y, i) => (
            <line key={i} x1="60" y1={y} x2="140" y2={y} stroke={i % 2 === 0 ? '#ff6b00' : '#fff'} strokeWidth="2.5" />
          ))}
          <text x="100" y="122" textAnchor="middle" fill="#ff4444" fontSize="8" fontFamily="monospace">OVERFILLED ✕</text>
          <text x="100" y="132" textAnchor="middle" fill="#ff4444" fontSize="7" fontFamily="monospace">Exceeds 21 cu.in.</text>
        </>
      ) : (
        <>
          {[35,50,65].map((y, i) => (
            <line key={i} x1="65" y1={y} x2="135" y2={y} stroke={i % 2 === 0 ? '#ff6b00' : '#fff'} strokeWidth="2.5" />
          ))}
          <text x="100" y="90" textAnchor="middle" fill="#00ff88" fontSize="8" fontFamily="monospace">SPACE REMAINING ✓</text>
          <text x="100" y="122" textAnchor="middle" fill="#00ff88" fontSize="8" fontFamily="monospace">Within 21 cu.in.</text>
        </>
      )}
    </svg>
  )
}

function ConduitFillDiagram({ wrong }: { wrong: boolean }) {
  const wires = wrong ? 12 : 4
  const colors = ['#ff6b00', '#ffffff', '#000000', '#ff0000', '#00ff88', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#888888', '#ff8800', '#8800ff']
  return (
    <svg viewBox="0 0 200 100" className="w-full" style={{ maxHeight: 100 }}>
      <ellipse cx="100" cy="50" rx="45" ry="45" fill="none" stroke={wrong ? '#ff4444' : '#00ff88'} strokeWidth="3" />
      <ellipse cx="100" cy="50" rx="42" ry="42" fill="#0a0b0e" />
      {Array.from({ length: wires }).map((_, i) => {
        const angle = (i / wires) * Math.PI * 2
        const r = wrong ? 28 : 18
        const x = 100 + r * Math.cos(angle)
        const y = 50 + r * Math.sin(angle)
        return <circle key={i} cx={x} cy={y} r={wrong ? 5 : 7} fill={colors[i % colors.length]} />
      })}
      <text x="100" y="54" textAnchor="middle" fill={wrong ? '#ff4444' : '#00ff88'} fontSize="9" fontWeight="bold" fontFamily="monospace">
        {wrong ? `${wires} WIRES` : `${wires} WIRES`}
      </text>
      <text x="100" y="92" textAnchor="middle" fill={wrong ? '#ff4444' : '#00ff88'} fontSize="8" fontFamily="monospace">
        {wrong ? '60%+ FILL ✕' : '~30% FILL ✓'}
      </text>
    </svg>
  )
}

function WireBreakerDiagram({ wrong }: { wrong: boolean }) {
  return (
    <svg viewBox="0 0 200 120" className="w-full" style={{ maxHeight: 120 }}>
      <rect x="30" y="30" width="50" height="60" fill="#1a1f2e" stroke="#555" strokeWidth="1.5" rx="3" />
      <text x="55" y="55" textAnchor="middle" fill={wrong ? '#ff4444' : '#00ff88'} fontSize="14" fontWeight="bold" fontFamily="monospace">20A</text>
      <text x="55" y="70" textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">BREAKER</text>
      <line x1="80" y1="60" x2="140" y2="60" stroke={wrong ? '#ff4444' : '#00ff88'} strokeWidth={wrong ? 2 : 4} />
      <rect x="120" y="20" width="55" height="35" fill="#1a1f2e" stroke={wrong ? '#ff4444' : '#00ff88'} strokeWidth="1.5" rx="2" />
      <text x="147" y="35" textAnchor="middle" fill={wrong ? '#ff4444' : '#00ff88'} fontSize="11" fontWeight="bold" fontFamily="monospace">
        {wrong ? '#14' : '#12'}
      </text>
      <text x="147" y="48" textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">AWG</text>
      <text x="100" y="85" textAnchor="middle" fill={wrong ? '#ff4444' : '#00ff88'} fontSize="8" fontFamily="monospace">
        {wrong ? '15A MAX on #14 ✕' : '#12 = 20A OK ✓'}
      </text>
      <text x="100" y="96" textAnchor="middle" fill={wrong ? '#ff4444' : '#00ff88'} fontSize="7" fontFamily="monospace">
        {wrong ? 'NEC 240.4 VIOLATION' : 'NEC 240.4 COMPLIANT'}
      </text>
    </svg>
  )
}

function getDiagram(id: string, wrong: boolean) {
  switch (id) {
    case 'subpanel-bond': return <SubpanelBondDiagram wrong={wrong} />
    case 'box-fill-exceeded': return <BoxFillDiagram wrong={wrong} />
    case 'conduit-fill': return <ConduitFillDiagram wrong={wrong} />
    case 'wire-size-breaker': return <WireBreakerDiagram wrong={wrong} />
    default: return null
  }
}

// ─── CODE SECTION ─────────────────────────────────────────────────────────────

const ampacityTable = [
  { size: "14 AWG", copper: { "60°C": 15, "75°C": 20, "90°C": 25 } },
  { size: "12 AWG", copper: { "60°C": 20, "75°C": 25, "90°C": 30 } },
  { size: "10 AWG", copper: { "60°C": 30, "75°C": 35, "90°C": 40 } },
  { size: "8 AWG",  copper: { "60°C": 40, "75°C": 50, "90°C": 55 } },
  { size: "6 AWG",  copper: { "60°C": 55, "75°C": 65, "90°C": 75 } },
  { size: "4 AWG",  copper: { "60°C": 70, "75°C": 85, "90°C": 95 } },
  { size: "3 AWG",  copper: { "60°C": 85, "75°C": 100, "90°C": 110 } },
  { size: "2 AWG",  copper: { "60°C": 95, "75°C": 115, "90°C": 130 } },
]

const wireVolumes: Record<string, number> = { "14": 2.00, "12": 2.25, "10": 2.50, "8": 3.00, "6": 5.00 }

function CodeSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [bookmarked, setBookmarked] = useState<string[]>([])

  const startVoiceSearch = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => setSearchQuery(event.results[0][0].transcript)
    recognition.start()
  }

  const filteredArticles = useMemo(() => {
    if (activeFilter) {
      const filterMap: Record<string, string[]> = {
        "GFCI": ["210.8"], "AFCI": ["210.12"],
        "Grounding": ["250.24", "250.32", "250.53"],
        "Wire Size": ["310.16"], "Box Fill": ["314.16"], "Clearance": ["110.26"]
      }
      return necDatabase.filter(a => (filterMap[activeFilter] || []).includes(a.article))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return necDatabase.filter(a =>
        a.article.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) ||
        a.keyPoints.some(kp => kp.plainEnglish.toLowerCase().includes(q) || kp.text.toLowerCase().includes(q)) ||
        a.commonViolations.some(v => v.scenario.toLowerCase().includes(q))
      )
    }
    return necDatabase
  }, [searchQuery, activeFilter])

  return (
    <div>
      <div className="sticky top-0 bg-[#0f1115] field-mode:bg-black z-10 pb-3 border-b border-[#1e2028] field-mode:border-yellow-400/20 mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555] field-mode:text-yellow-400/50" />
          <input type="text" placeholder="Search NEC articles..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 pl-9 pr-10 py-2.5 text-sm text-white field-mode:text-yellow-100 placeholder-[#555] focus:border-[#00ff88] focus:outline-none" />
          <button onClick={startVoiceSearch}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 ${isListening ? 'text-red-400 animate-pulse' : 'text-[#00ff88]'}`}>
            <Mic className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {["GFCI","AFCI","Grounding","Wire Size","Box Fill","Clearance"].map(f => (
            <button key={f} onClick={() => setActiveFilter(activeFilter === f ? null : f)}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors border ${activeFilter === f ? 'bg-[#00ff88] text-[#0f1115] border-[#00ff88]' : 'bg-[#111] text-[#888] border-[#2a2a35]'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Ampacity table */}
      {(activeFilter === "Wire Size" || searchQuery.toLowerCase().includes("wire") || searchQuery.toLowerCase().includes("ampacity")) && (
        <div className="mb-4 bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 p-3 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-[#00ff88]" />
            <span className="font-bold text-white field-mode:text-yellow-100 text-sm">Ampacity (310.16) — Copper</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#333] text-[#555]">
                <th className="text-left py-1">Size</th>
                <th className="text-center py-1">60°C</th>
                <th className="text-center py-1 text-[#00ff88] field-mode:text-yellow-300">75°C</th>
                <th className="text-center py-1">90°C</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2028]">
              {ampacityTable.map(row => (
                <tr key={row.size}>
                  <td className="py-1 font-mono text-[#f0f0f0] field-mode:text-yellow-100">{row.size}</td>
                  <td className="text-center py-1 text-[#888] field-mode:text-yellow-400/50">{row.copper["60°C"]}A</td>
                  <td className="text-center py-1 text-[#f0f0f0] field-mode:text-yellow-100">{row.copper["75°C"]}A</td>
                  <td className="text-center py-1 text-[#888] field-mode:text-yellow-400/50">{row.copper["90°C"]}A</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Article cards */}
      <div className="space-y-4">
        {filteredArticles.map(article => (
          <div key={article.article} className="bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 overflow-hidden">
            <div className="bg-[#161b24] field-mode:bg-black p-3 border-b border-[#2a2a35] field-mode:border-yellow-400/20 flex items-start justify-between">
              <div>
                <span className="text-[#00ff88] field-mode:text-yellow-300 font-bold text-sm font-mono">{article.article}</span>
                <h3 className="text-white field-mode:text-yellow-100 font-semibold text-sm mt-0.5">{article.title}</h3>
                <p className="text-[#666] field-mode:text-yellow-400/50 text-xs mt-0.5">{article.scope}</p>
              </div>
              <button onClick={() => setBookmarked(prev =>
                prev.includes(article.article) ? prev.filter(a => a !== article.article) : [...prev, article.article])}>
                <Bookmark className={`h-4 w-4 ${bookmarked.includes(article.article) ? 'fill-[#00ff88] text-[#00ff88]' : 'text-[#555]'}`} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {article.keyPoints.map(kp => (
                <div key={kp.id} className="bg-[#0a0b0e] field-mode:bg-black p-2.5 border-l-2 border-[#00ff88] field-mode:border-yellow-400">
                  <span className="text-[#00ff88] field-mode:text-yellow-300 text-xs font-mono font-bold">{kp.id}</span>
                  <p className="text-white field-mode:text-yellow-100 text-sm font-medium mt-1">{kp.plainEnglish}</p>
                  <p className="text-[#555] field-mode:text-yellow-400/40 text-xs italic mt-0.5">"{kp.text}"</p>
                  <p className="text-[#00d4ff] field-mode:text-yellow-300/80 text-xs mt-1">→ {kp.application}</p>
                </div>
              ))}
            </div>
            {article.commonViolations.length > 0 && (
              <div className="p-3 bg-[#130d10] field-mode:bg-black border-t border-[#2a2a35] field-mode:border-yellow-400/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs uppercase text-red-400 font-bold">Common Violations</span>
                </div>
                {article.commonViolations.map((v, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <div className="flex items-start gap-1.5">
                      <X className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-red-300 text-xs">{v.scenario}</p>
                    </div>
                    <div className="flex items-start gap-1.5 mt-1 pl-5">
                      <Check className="h-3.5 w-3.5 text-[#00ff88] mt-0.5 shrink-0" />
                      <p className="text-[#00ff88] field-mode:text-yellow-300 text-xs">{v.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {article.relatedArticles.length > 0 && (
              <div className="p-3 border-t border-[#2a2a35] field-mode:border-yellow-400/20">
                <div className="flex flex-wrap gap-1.5">
                  {article.relatedArticles.map(art => (
                    <button key={art} onClick={() => { setSearchQuery(art); setActiveFilter(null) }}
                      className="flex items-center gap-0.5 px-2 py-1 bg-[#0a0b0e] field-mode:bg-black text-[#00d4ff] field-mode:text-yellow-300 text-xs border border-[#2a2a35] field-mode:border-yellow-400/30 hover:border-[#00d4ff]">
                      {art} <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── INSPECT SECTION ──────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Grounding', 'Panel Access', 'Panel Integrity', 'Conduit', 'Protection', 'Boxes', 'Labeling', 'Wiring', 'Wet Locations', 'Overcurrent Protection']
const SEVERITY_COLOR = { critical: '#ff4444', major: '#ffaa00', minor: '#00d4ff' }
const SEVERITY_LABEL = { critical: 'CRITICAL', major: 'MAJOR', minor: 'MINOR' }

function InspectSection() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>('subpanel-bond')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let items = inspectionItems
    if (activeCategory !== 'All') items = items.filter(i => i.category === activeCategory)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.what_fails.toLowerCase().includes(q) ||
        i.nec.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      )
    }
    return items
  }, [activeCategory, searchQuery])

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-[#ff4444]" />
          <span className="text-sm font-bold text-[#ff4444] uppercase tracking-wider">Inspection Failures</span>
        </div>
        <p className="text-[10px] text-[#555]">Most common commercial inspection write-ups. Know before the inspector shows up.</p>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555] field-mode:text-yellow-400/50" />
        <input type="text" placeholder="Search violations..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 pl-9 pr-3 py-2.5 text-sm text-white field-mode:text-yellow-100 placeholder-[#555] focus:border-[#ff4444] focus:outline-none" />
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-colors ${activeCategory === cat ? 'border-[#ff4444] text-[#ff4444] bg-[#ff444410]' : 'border-[#2a2a35] text-[#555]'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        {(['critical','major','minor'] as const).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />
            <span className="text-[9px] uppercase tracking-wider text-[#555]">{SEVERITY_LABEL[s]}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(item => {
          const isExpanded = expandedId === item.id
          return (
            <div key={item.id} className="border overflow-hidden" style={{ borderColor: isExpanded ? SEVERITY_COLOR[item.severity] : '#2a2a35' }}>
              <button className="w-full p-3 text-left bg-[#111] field-mode:bg-black flex items-start gap-3"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: SEVERITY_COLOR[item.severity] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white field-mode:text-yellow-100">{item.title}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border"
                      style={{ color: SEVERITY_COLOR[item.severity], borderColor: SEVERITY_COLOR[item.severity] + '40' }}>
                      {SEVERITY_LABEL[item.severity]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-[#555] field-mode:text-yellow-400/40">{item.nec}</span>
                    <span className="text-[10px] text-[#444]">·</span>
                    <span className="text-[10px] text-[#555] field-mode:text-yellow-400/40">{item.category}</span>
                  </div>
                </div>
                <div className="text-[#555] field-mode:text-yellow-400/40 shrink-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#1e2028]">
                  {item.has_diagram && (
                    <div className="grid grid-cols-2 border-b border-[#1e2028]">
                      <div className="p-3 border-r border-[#1e2028] bg-[#130d10] field-mode:bg-black">
                        <div className="flex items-center gap-1.5 mb-2">
                          <X className="h-3 w-3 text-[#ff4444]" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff4444]">Fails</span>
                        </div>
                        {getDiagram(item.id, true)}
                      </div>
                      <div className="p-3 bg-[#0d1310] field-mode:bg-black">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Check className="h-3 w-3 text-[#00ff88]" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#00ff88]">Passes</span>
                        </div>
                        {getDiagram(item.id, false)}
                      </div>
                    </div>
                  )}

                  {!item.has_diagram && (
                    <div className="mx-3 mt-3 border border-dashed border-[#2a2a35] field-mode:border-yellow-400/20 p-3 bg-[#0a0b0e] field-mode:bg-black">
                      <div className="text-[9px] uppercase tracking-wider text-[#444] field-mode:text-yellow-400/40 mb-1">Photo Reference</div>
                      <div className="text-[10px] text-[#555] field-mode:text-yellow-400/40 italic leading-relaxed">{item.photo_prompt}</div>
                    </div>
                  )}

                  <div className="p-3 border-t border-[#1e2028] bg-[#130d10] field-mode:bg-black">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <X className="h-3.5 w-3.5 text-[#ff4444] shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff4444]">What Fails</span>
                    </div>
                    <p className="text-xs text-[#cc8888] leading-relaxed">{item.what_fails}</p>
                  </div>

                  <div className="p-3 border-t border-[#1e2028] bg-[#111] field-mode:bg-black">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#ffaa00] shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffaa00]">Why It Fails</span>
                    </div>
                    <p className="text-xs text-[#aaa] field-mode:text-yellow-100/70 leading-relaxed">{item.why_it_fails}</p>
                  </div>

                  <div className="p-3 border-t border-[#1e2028] bg-[#0d1310] field-mode:bg-black">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Check className="h-3.5 w-3.5 text-[#00ff88] shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ff88]">What Passes</span>
                    </div>
                    <p className="text-xs text-[#88cc99] leading-relaxed">{item.what_passes}</p>
                  </div>

                  <div className="p-3 border-t border-[#1e2028] bg-[#0f1115] field-mode:bg-black">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="h-3.5 w-3.5 text-[#00d4ff] shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00d4ff]">Inspector's Note</span>
                    </div>
                    <p className="text-xs text-[#8899aa] field-mode:text-yellow-100/60 leading-relaxed italic">"{item.inspector_note}"</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SYMBOLS SECTION ──────────────────────────────────────────────────────────

function SymbolsSection() {
  const [activeCategory, setActiveCategory] = useState('power')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = symbolData.map(cat => ({
    ...cat,
    symbols: cat.symbols.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.symbols.length > 0)

  const activeCatData = symbolData.find(c => c.id === activeCategory)

  return (
    <div>
      <div className="sticky top-0 bg-[#0f1115] field-mode:bg-black z-10 pb-3 border-b border-[#1e2028] field-mode:border-yellow-400/20 mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555] field-mode:text-yellow-400/50" />
          <input type="text" placeholder="Search symbols..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 pl-9 pr-3 py-2.5 text-sm text-white field-mode:text-yellow-100 placeholder-[#555] focus:border-[#ff6b00] focus:outline-none" />
        </div>
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {symbolData.map(cat => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors ${isActive ? 'text-[#0f1115] border-transparent' : 'text-[#888] border-[#2a2a35]'}`}
                  style={{ backgroundColor: isActive ? cat.color : 'transparent' }}>
                  <Icon className="h-3 w-3" />
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {searchQuery ? (
        <div className="space-y-4">
          {filteredCategories.map(cat => (
            <div key={cat.id}>
              <h3 className="text-[10px] font-bold text-[#555] field-mode:text-yellow-400/50 uppercase mb-2">{cat.name}</h3>
              <div className="space-y-1">
                {cat.symbols.map((sym, idx) => (
                  <div key={idx} className="bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 p-3 flex items-center gap-3">
                    <div className="w-14 h-14 bg-[#0a0b0e] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-mono text-[#ff6b00] field-mode:text-yellow-300 font-bold">{sym.symbol}</span>
                    </div>
                    <div>
                      <p className="text-white field-mode:text-yellow-100 font-medium text-sm">{sym.name}</p>
                      {sym.description && <p className="text-[#555] field-mode:text-yellow-400/50 text-xs mt-0.5">{sym.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {activeCatData && (
            <div>
              <h2 className="text-sm font-bold text-white field-mode:text-yellow-100 mb-0.5">{activeCatData.name}</h2>
              <p className="text-[10px] text-[#555] field-mode:text-yellow-400/50 mb-3">NECA 100 Standard Symbols</p>
              <div className="space-y-1">
                {activeCatData.symbols.map((sym, idx) => (
                  <div key={idx} className="bg-[#111] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/30 p-3 flex items-center gap-3 hover:border-[#333] transition-colors">
                    <div className="w-14 h-14 bg-[#0a0b0e] field-mode:bg-black border border-[#2a2a35] field-mode:border-yellow-400/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-mono font-bold field-mode:text-yellow-300" style={{ color: activeCatData.color }}>{sym.symbol}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white field-mode:text-yellow-100 font-medium text-sm">{sym.name}</p>
                      {sym.description && <p className="text-[#555] field-mode:text-yellow-400/50 text-xs mt-0.5">{sym.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 pt-6 border-t border-[#1e2028] field-mode:border-yellow-400/20">
            <h3 className="text-[10px] font-bold text-[#555] field-mode:text-yellow-400/50 uppercase mb-3">Common Abbreviations</h3>
            <div className="grid grid-cols-2 gap-1">
              {abbreviations.map((item, idx) => (
                <div key={idx} className="bg-[#111] field-mode:bg-black border border-[#1e2028] field-mode:border-yellow-400/20 p-2">
                  <span className="text-[#ff6b00] field-mode:text-yellow-300 font-bold text-xs">{item.abbr}</span>
                  <p className="text-[#666] field-mode:text-yellow-400/50 text-[10px] mt-0.5">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function ReferenceTab() {
  const [section, setSection] = useState<Section>('code')

  const sections: { id: Section; label: string; color: string }[] = [
    { id: 'code',    label: 'NEC Code',  color: '#00ff88' },
    { id: 'inspect', label: 'Inspect',   color: '#ff4444' },
    { id: 'symbols', label: 'Symbols',   color: '#ff6b00' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-0 mb-5 border border-[#2a2a35] field-mode:border-yellow-400/30">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all"
            style={{
              color: section === s.id ? '#0f1115' : s.color,
              backgroundColor: section === s.id ? s.color : 'transparent',
              borderRight: s.id !== 'symbols' ? '1px solid #2a2a35' : 'none'
            }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {section === 'code'    && <CodeSection />}
        {section === 'inspect' && <InspectSection />}
        {section === 'symbols' && <SymbolsSection />}
      </div>
    </div>
  )
}
