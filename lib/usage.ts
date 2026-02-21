// Tool usage tracker — stores open counts in localStorage so Home tab can show top tools

const STORAGE_KEY = 'sparky_tool_usage'

export interface ToolUsage {
  [toolId: string]: number
}

function getUsageData(): ToolUsage {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveUsageData(data: ToolUsage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

// Call this every time a user opens a calculator
export function recordToolOpen(toolId: string): void {
  const data = getUsageData()
  data[toolId] = (data[toolId] || 0) + 1
  saveUsageData(data)
}

// Returns top N tool IDs sorted by most-opened
export function getTopTools(n: number): string[] {
  const data = getUsageData()
  return Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id)
}

// Returns true if the user has any recorded usage
export function hasUsageData(): boolean {
  const data = getUsageData()
  return Object.keys(data).length > 0
}
