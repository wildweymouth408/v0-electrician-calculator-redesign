'use client'

import { useState } from 'react'
import { Search, Grid3X3, Zap, Settings, Bell, Cable, Speaker, Flame } from 'lucide-react'

interface SymbolCategory {
  id: string
  name: string
  icon: typeof Zap
  color: string
  symbols: {
    symbol: string
    name: string
    description?: string
  }[]
}

const symbolData: SymbolCategory[] = [
  {
    id: 'power',
    name: 'Power & Distribution',
    icon: Zap,
    color: '#ff6b00',
    symbols: [
      { symbol: 'LP', name: 'Lighting Panel', description: 'Panelboard - Lighting' },
      { symbol: 'PP', name: 'Power Panel', description: 'Panelboard - Power' },
      { symbol: 'MCC', name: 'Motor Control Center' },
      { symbol: 'SWBD', name: 'Switchboard' },
      { symbol: 'SWGR', name: 'Switchgear' },
      { symbol: 'T', name: 'Transformer', description: 'Dry type transformer' },
      { symbol: 'T45-1', name: 'Transformer Schedule', description: 'Type 45, #1 - See schedule' },
      { symbol: 'ATS', name: 'Automatic Transfer Switch' },
      { symbol: 'TS', name: 'Transfer Switch' },
      { symbol: 'GEN', name: 'Generator' },
      { symbol: 'DISC', name: 'Disconnect', description: 'Unfused disconnect' },
      { symbol: '30A', name: 'Disconnect 30A', description: '30 Amp disconnect' },
      { symbol: '60AF', name: 'Fused Disc Frame', description: '60A Frame' },
      { symbol: 'CB 100AF', name: 'Circuit Breaker', description: '100A Frame' },
      { symbol: 'CT', name: 'Current Transformer' },
      { symbol: 'PB', name: 'Pull Box' },
      { symbol: 'JB', name: 'Junction Box' },
    ]
  },
  {
    id: 'outlets',
    name: 'Receptacles & Outlets',
    icon: Cable,
    color: '#00d4ff',
    symbols: [
      { symbol: '○', name: 'Duplex Receptacle', description: 'Standard 120V outlet' },
      { symbol: '○○', name: 'Double Duplex', description: 'Two duplex receptacles' },
      { symbol: '○ ▲', name: 'Split Duplex', description: 'Half switched' },
      { symbol: '○ GFCI', name: 'GFCI Receptacle', description: 'Ground fault protected' },
      { symbol: '○ IG', name: 'Isolated Ground', description: 'Separate ground path' },
      { symbol: '○ WP', name: 'Weatherproof', description: 'Outdoor rated' },
      { symbol: '○ SP', name: 'Surge Protected' },
      { symbol: '○ T', name: 'Tamper Resistant' },
      { symbol: '○ D', name: 'Dedicated Circuit' },
      { symbol: '○ E', name: 'Emergency Circuit' },
      { symbol: '○ 48"', name: '48" AFF', description: '48 inches above finished floor' },
      { symbol: '⌂', name: 'Floor Box', description: 'Flush floor receptacle' },
      { symbol: '⌂ S', name: 'Floor Box Surface', description: 'Surface mounted' },
    ]
  },
  {
    id: 'switches',
    name: 'Switches & Controls',
    icon: Settings,
    color: '#00ff88',
    symbols: [
      { symbol: 'S', name: 'Single Pole Switch' },
      { symbol: 'S2', name: 'Double Pole Switch' },
      { symbol: 'S3', name: 'Three-Way Switch' },
      { symbol: 'S4', name: 'Four-Way Switch' },
      { symbol: 'S $a', name: 'Switch for Outlet', description: 'Controls outlet marked "a"' },
      { symbol: 'D', name: 'Dimmer Switch' },
      { symbol: 'S LV', name: 'Low Voltage Switch' },
      { symbol: 'S T', name: 'Timer Switch' },
      { symbol: 'S MC', name: 'Momentary Contact' },
      { symbol: 'S K', name: 'Key Operated Switch' },
      { symbol: 'S C', name: 'Card Switch', description: 'Hotel/keycard' },
      { symbol: 'S P', name: 'Pilot Light Switch' },
      { symbol: 'M', name: 'Occupancy Sensor', description: 'Ceiling mounted' },
      { symbol: 'M W', name: 'Wall Sensor', description: 'Wall mounted occupancy' },
      { symbol: 'M P', name: 'Parallel Sensors', description: 'Multiple sensors parallel' },
      { symbol: 'PS', name: 'Photo Sensor', description: 'Daylight harvesting' },
    ]
  },
  {
    id: 'fire',
    name: 'Fire Alarm',
    icon: Flame,
    color: '#ff4444',
    symbols: [
      { symbol: 'FACP', name: 'Fire Alarm Control Panel' },
      { symbol: 'NAC', name: 'Notification Appliance', description: 'Horn/strobe/bell' },
      { symbol: 'F S', name: 'Horn Strobe', description: 'Combination unit' },
      { symbol: 'F', name: 'Fire Horn' },
      { symbol: 'S', name: 'Strobe' },
      { symbol: 'B', name: 'Fire Bell' },
      { symbol: 'F', name: 'Pull Station', description: 'Manual fire alarm' },
      { symbol: 'S', name: 'Smoke Detector', description: 'Ceiling mounted' },
      { symbol: 'S D', name: 'Duct Smoke Detector' },
      { symbol: 'H', name: 'Heat Detector' },
      { symbol: 'H F', name: 'Fixed Temp Heat', description: '190°F fixed temperature' },
      { symbol: 'H R', name: 'Rate-of-Rise Heat' },
      { symbol: 'FS', name: 'Flow Switch', description: 'Water flow - sprinkler' },
      { symbol: 'TS', name: 'Tamper Switch' },
      { symbol: 'PIV', name: 'Post Indicator Valve' },
      { symbol: 'CR', name: 'Control Relay' },
      { symbol: 'EOL', name: 'End of Line', description: 'End of line resistor' },
    ]
  },
  {
    id: 'communication',
    name: 'Comm & Data',
    icon: Speaker,
    color: '#8888ff',
    symbols: [
      { symbol: 'T', name: 'Telephone Outlet' },
      { symbol: 'T W', name: 'Telephone Wall', description: 'Wall mounted' },
      { symbol: 'D', name: 'Data Outlet', description: 'Ethernet/computer' },
      { symbol: 'D F', name: 'Data Floor', description: 'Flush floor data' },
      { symbol: 'D S', name: 'Data Surface', description: 'Surface floor box' },
      { symbol: 'TV', name: 'Cable TV Outlet' },
      { symbol: 'IC', name: 'Intercom' },
      { symbol: 'VC', name: 'Volume Control' },
      { symbol: 'S', name: 'Speaker', description: 'Ceiling speaker' },
      { symbol: 'S W', name: 'Speaker Wall', description: 'Wall mounted' },
      { symbol: 'CCTV', name: 'Security Camera' },
      { symbol: 'CR', name: 'Card Reader' },
      { symbol: 'CR WP', name: 'Card Reader WP', description: 'Weatherproof reader' },
      { symbol: 'WAP', name: 'Wireless Access Point' },
    ]
  },
  {
    id: 'conduit',
    name: 'Conduit & Wiring',
    icon: Cable,
    color: '#ffaa00',
    symbols: [
      { symbol: '- - -', name: 'Concealed Conduit', description: 'In walls/ceiling' },
      { symbol: '— — —', name: 'Exposed Conduit', description: 'Surface mounted' },
      { symbol: '- · - · -', name: 'Underground', description: 'Buried conduit' },
      { symbol: '↑', name: 'Conduit Up', description: 'Turning up' },
      { symbol: '↓', name: 'Conduit Down', description: 'Turning down' },
      { symbol: '→', name: 'Conduit Direction', description: 'Direction arrow' },
      { symbol: 'T', name: 'Conduit Stub', description: 'Terminate with bushing' },
      { symbol: 'L211-1,3', name: 'Homerun', description: 'To panel L211, ckt 1&3' },
      { symbol: 'Sz', name: 'Conduit Size', description: 'Size of conduit' },
      { symbol: 'EMT', name: 'Electrical Metallic Tubing' },
      { symbol: 'RMC', name: 'Rigid Metal Conduit' },
      { symbol: 'IMC', name: 'Intermediate Metal Conduit' },
      { symbol: 'FMC', name: 'Flexible Metal Conduit' },
      { symbol: 'LFMC', name: 'Liquidtight Flexible', description: 'Liquidtight flex' },
      { symbol: 'PVC', name: 'PVC Conduit', description: 'Schedule 40/80' },
      { symbol: 'ENT', name: 'Electrical Nonmetallic Tubing' },
      { symbol: 'MC', name: 'Metal Clad Cable' },
      { symbol: 'AC', name: 'Armored Cable', description: 'BX cable' },
      { symbol: 'NM', name: 'Nonmetallic Sheathed', description: 'Romex' },
    ]
  },
  {
    id: 'motors',
    name: 'Motors & Equipment',
    icon: Settings,
    color: '#00ffff',
    symbols: [
      { symbol: 'M 5', name: 'Motor 5 HP', description: '5 horsepower motor' },
      { symbol: 'M 10', name: 'Motor 10 HP' },
      { symbol: 'C', name: 'Contactor' },
      { symbol: 'OL', name: 'Overload Relay' },
      { symbol: 'RV', name: 'Reduced Voltage Starter' },
      { symbol: 'ASD', name: 'VFD Drive', description: 'Adjustable speed drive' },
      { symbol: 'NEMA 2', name: 'NEMA Size 2 Starter' },
      { symbol: 'NEMA 3', name: 'NEMA Size 3 Starter' },
      { symbol: 'D', name: 'Motorized Damper' },
      { symbol: 'V', name: 'Motorized Valve' },
      { symbol: 'EF', name: 'Exhaust Fan' },
      { symbol: 'SF', name: 'Supply Fan' },
      { symbol: 'RF', name: 'Return Fan' },
      { symbol: 'UH', name: 'Unit Heater' },
      { symbol: 'WH', name: 'Water Heater' },
    ]
  }
]

const abbreviations = [
  { abbr: 'AFF', meaning: 'Above Finished Floor' },
  { abbr: 'AFG', meaning: 'Above Finished Grade' },
  { abbr: 'CKT', meaning: 'Circuit' },
  { abbr: 'CU', meaning: 'Copper' },
  { abbr: 'AL', meaning: 'Aluminum' },
  { abbr: 'AT', meaning: 'Amp Trip' },
  { abbr: 'AF', meaning: 'Amp Frame' },
  { abbr: 'FLA', meaning: 'Full Load Amps' },
  { abbr: 'LRA', meaning: 'Locked Rotor Amps' },
  { abbr: 'MCA', meaning: 'Minimum Circuit Amps' },
  { abbr: 'MOCP', meaning: 'Maximum Overcurrent Protection' },
  { abbr: 'GFCI', meaning: 'Ground Fault Circuit Interrupter' },
  { abbr: 'AFCI', meaning: 'Arc Fault Circuit Interrupter' },
  { abbr: 'EGC', meaning: 'Equipment Grounding Conductor' },
  { abbr: 'GEC', meaning: 'Grounding Electrode Conductor' },
  { abbr: 'WP', meaning: 'Weatherproof' },
  { abbr: 'RT', meaning: 'Raintight' },
  { abbr: 'VT', meaning: 'Vaportight' },
  { abbr: 'XP', meaning: 'Explosion Proof' },
  { abbr: 'EXIST', meaning: 'Existing (to remain)' },
  { abbr: 'RE', meaning: 'Remove Existing' },
  { abbr: 'RL', meaning: 'Relocate' },
  { abbr: 'NEW', meaning: 'New installation' },
  { abbr: 'FBO', meaning: 'Furnished By Others' },
  { abbr: 'U.N.O.', meaning: 'Unless Noted Otherwise' },
  { abbr: 'N.T.S.', meaning: 'Not To Scale' },
  { abbr: 'SEE DET', meaning: 'See Detail' },
  { abbr: 'SEE SCHED', meaning: 'See Schedule' },
  { abbr: 'TYP', meaning: 'Typical' },
  { abbr: 'MAX', meaning: 'Maximum' },
  { abbr: 'MIN', meaning: 'Minimum' },
]

export function SymbolsTab() {
  const [activeCategory, setActiveCategory] = useState<string>('power')
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
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[#0f1115] z-10 px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="h-5 w-5 text-[#ff6b00]" />
          <span className="text-sm font-bold text-[#ff6b00] uppercase tracking-wider">Plan Symbols</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
          <input
            type="text"
            placeholder="Search symbols..."
            className="w-full bg-[#1a1f2e] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#555] focus:border-[#ff6b00] focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        {!searchQuery && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {symbolData.map(cat => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-[#ff6b00] text-[#0f1115]' 
                      : 'bg-[#1a1f2e] text-[#888] border border-[#333]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {searchQuery ? (
          // Search Results
          <div className="space-y-4">
            {filteredCategories.map(cat => (
              <div key={cat.id}>
                <h3 className="text-xs font-bold text-[#555] uppercase mb-2">{cat.name}</h3>
                <div className="space-y-2">
                  {cat.symbols.map((sym, idx) => (
                    <div key={idx} className="bg-[#1a1f2e] border border-[#333] rounded-lg p-3 flex items-center gap-3">
                      <div className="w-16 h-16 bg-[#0f1115] rounded flex items-center justify-center border border-[#333] shrink-0">
                        <span className="text-lg font-mono text-[#ff6b00] font-bold">{sym.symbol}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{sym.name}</p>
                        {sym.description && (
                          <p className="text-[#555] text-xs mt-0.5">{sym.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Category View
          <div>
            {activeCatData && (
              <div>
                <h2 className="text-lg font-bold text-white mb-1">{activeCatData.name}</h2>
                <p className="text-xs text-[#555] mb-4">NECA 100 Standard Symbols</p>
                
                <div className="grid grid-cols-1 gap-2">
                  {activeCatData.symbols.map((sym, idx) => (
                    <div key={idx} className="bg-[#1a1f2e] border border-[#333] rounded-lg p-3 flex items-center gap-3 hover:border-[#ff6b00] transition-colors">
                      <div className="w-16 h-16 bg-[#0f1115] rounded flex items-center justify-center border border-[#333] shrink-0">
                        <span className="text-lg font-mono font-bold" style={{ color: activeCatData.color }}>
                          {sym.symbol}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{sym.name}</p>
                        {sym.description && (
                          <p className="text-[#555] text-xs mt-0.5">{sym.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abbreviations Section */}
            <div className="mt-8 pt-6 border-t border-[#333]">
              <h3 className="text-sm font-bold text-[#555] uppercase mb-3">Common Abbreviations</h3>
              <div className="grid grid-cols-2 gap-2">
                {abbreviations.map((item, idx) => (
                  <div key={idx} className="bg-[#1a1f2e] border border-[#333] rounded p-2">
                    <span className="text-[#ff6b00] font-bold text-xs">{item.abbr}</span>
                    <p className="text-[#888] text-xs mt-0.5">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
