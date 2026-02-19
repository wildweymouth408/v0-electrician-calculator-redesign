// LocalStorage persistence layer for Sparky

export type UserRole = 'apprentice' | 'journeyman' | 'foreman'

export interface UserSettings {
  role: UserRole
  name: string
  license: string
  company: string
  darkMode: boolean
  notifications: boolean
}

export interface CrewMember {
  id: string
  name: string
  role: string
  phone: string
}

export interface Task {
  id: string
  name: string
  assignee: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  necReference: string
  photos: string[]
  completedAt: string
  notes: string
  createdAt: string
}

export interface Job {
  id: string
  name: string
  address: string
  crew: CrewMember[]
  tasks: Task[]
  notes: string[]
  status: 'on-track' | 'at-risk' | 'complete'
  color: string
  createdAt: string
}

export interface SavedCalculation {
  id: string
  type: string
  label: string
  inputs: Record<string, unknown>
  result: string
  timestamp: string
}

const KEYS = {
  jobs: 'sparky-jobs',
  calcs: 'sparky-calcs',
  bookmarks: 'sparky-bookmarks',
  recentArticles: 'sparky-recent-articles',
  settings: 'sparky-settings',
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked
  }
}

// ── Settings ──────────────────────────────────────
const DEFAULT_SETTINGS: UserSettings = {
  role: 'apprentice',
  name: '',
  license: '',
  company: '',
  darkMode: true,
  notifications: false,
}

export function getSettings(): UserSettings {
  return getItem(KEYS.settings, DEFAULT_SETTINGS)
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getSettings()
  const updated = { ...current, ...settings }
  setItem(KEYS.settings, updated)
  return updated
}

// ── Jobs ──────────────────────────────────────────
export function getJobs(): Job[] {
  return getItem<Job[]>(KEYS.jobs, [])
}

export function saveJob(job: Job): void {
  const jobs = getJobs()
  const idx = jobs.findIndex(j => j.id === job.id)
  if (idx >= 0) {
    jobs[idx] = job
  } else {
    jobs.unshift(job)
  }
  setItem(KEYS.jobs, jobs)
}

export function deleteJob(id: string): void {
  const jobs = getJobs().filter(j => j.id !== id)
  setItem(KEYS.jobs, jobs)
}

export function addNoteToJob(jobId: string, note: string): void {
  const jobs = getJobs()
  const job = jobs.find(j => j.id === jobId)
  if (job) {
    job.notes.push(note)
    setItem(KEYS.jobs, jobs)
  }
}

// ── Calculations ──────────────────────────────────
export function getCalculations(): SavedCalculation[] {
  return getItem<SavedCalculation[]>(KEYS.calcs, [])
}

export function saveCalculation(calc: SavedCalculation): void {
  const calcs = getCalculations()
  calcs.unshift(calc)
  // Keep last 100
  if (calcs.length > 100) calcs.length = 100
  setItem(KEYS.calcs, calcs)
}

export function getRecentCalculations(limit = 5): SavedCalculation[] {
  return getCalculations().slice(0, limit)
}

export function clearCalculations(): void {
  setItem(KEYS.calcs, [])
}

// ── Bookmarks ─────────────────────────────────────
export function getBookmarks(): string[] {
  return getItem<string[]>(KEYS.bookmarks, [])
}

export function toggleBookmark(articleId: string): boolean {
  const bookmarks = getBookmarks()
  const idx = bookmarks.indexOf(articleId)
  if (idx >= 0) {
    bookmarks.splice(idx, 1)
    setItem(KEYS.bookmarks, bookmarks)
    return false
  } else {
    bookmarks.push(articleId)
    setItem(KEYS.bookmarks, bookmarks)
    return true
  }
}

// ── Recent Articles ───────────────────────────────
export function getRecentArticles(): string[] {
  return getItem<string[]>(KEYS.recentArticles, [])
}

export function addRecentArticle(articleId: string): void {
  const recent = getRecentArticles().filter(id => id !== articleId)
  recent.unshift(articleId)
  if (recent.length > 10) recent.length = 10
  setItem(KEYS.recentArticles, recent)
}

// ── Utility ───────────────────────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function clearAllData(): void {
  Object.values(KEYS).forEach(key => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  })
}
