'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getJobs, saveJob, deleteJob,
  generateId,
  type Job, type Task, type CrewMember,
} from '@/lib/storage'
import { NEC_ARTICLES } from '@/lib/nec-articles'
import { toast } from 'sonner'
import { QuickToolsDrawer } from '@/components/tools/quick-tools-drawer'
import {
  Plus,
  MapPin,
  Users,
  ChevronLeft,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  StickyNote,
  Wrench,
  X,
  Phone,
  UserPlus,
  Filter,
  CalendarDays,
  Flag,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  ImageIcon,
  Pencil,
} from 'lucide-react'

type View = 'list' | 'detail' | 'create' | 'edit'
type TaskFilter = 'all' | 'mine' | 'completed'

const JOB_COLORS = ['#00d4ff', '#ff6b00', '#00ff88', '#ffaa00', '#ff3333', '#aa77ff']

export function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [view, setView] = useState<View>('list')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [quickToolsOpen, setQuickToolsOpen] = useState(false)

  // Create / edit job form state
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formCrew, setFormCrew] = useState<CrewMember[]>([])
  const [formColor, setFormColor] = useState(JOB_COLORS[0])

  const refreshJobs = useCallback(() => {
    setJobs(getJobs())
  }, [])

  useEffect(() => {
    refreshJobs()
  }, [refreshJobs])

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null

  function resetForm() {
    setFormName('')
    setFormAddress('')
    setFormCrew([])
    setFormColor(JOB_COLORS[0])
  }

  function handleCreateJob() {
    if (!formName.trim()) {
      toast.error('Job name is required')
      return
    }
    const job: Job = {
      id: generateId(),
      name: formName.trim(),
      address: formAddress.trim(),
      crew: formCrew.filter(c => c.name.trim() !== ''),
      tasks: [],
      notes: [],
      status: 'on-track',
      color: formColor,
      createdAt: new Date().toISOString(),
    }
    saveJob(job)
    refreshJobs()
    resetForm()
    setSelectedJobId(job.id)
    setView('detail')
    toast.success('Job created')
  }

  function handleEditJob() {
    if (!selectedJob || !formName.trim()) return
    const updated: Job = {
      ...selectedJob,
      name: formName.trim(),
      address: formAddress.trim(),
      crew: formCrew.filter(c => c.name.trim() !== ''),
      color: formColor,
    }
    saveJob(updated)
    refreshJobs()
    setView('detail')
    toast.success('Job updated')
  }

  function openEditForm(job: Job) {
    setFormName(job.name)
    setFormAddress(job.address)
    setFormCrew(job.crew)
    setFormColor(job.color)
    setView('edit')
  }

  function handleDeleteJob(id: string) {
    deleteJob(id)
    refreshJobs()
    setView('list')
    setSelectedJobId(null)
    toast.success('Job deleted')
  }

  function handleAddTask(jobId: string, task: Omit<Task, 'id' | 'createdAt'>) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    job.tasks.push(newTask)
    updateJobStatus(job)
    saveJob(job)
    refreshJobs()
  }

  function handleCompleteTask(jobId: string, taskId: string, photos: string[], notes: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const task = job.tasks.find(t => t.id === taskId)
    if (!task) return
    task.status = 'completed'
    task.photos = photos
    task.notes = notes || task.notes
    task.completedAt = new Date().toISOString()
    updateJobStatus(job)
    saveJob(job)
    refreshJobs()
  }

  function handleUpdateTaskStatus(jobId: string, taskId: string, status: Task['status']) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const task = job.tasks.find(t => t.id === taskId)
    if (!task) return
    task.status = status
    if (status === 'completed') {
      task.completedAt = new Date().toISOString()
    } else {
      task.completedAt = ''
    }
    updateJobStatus(job)
    saveJob(job)
    refreshJobs()
  }

  function handleReassignTask(jobId: string, taskId: string, assignee: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const task = job.tasks.find(t => t.id === taskId)
    if (!task) return
    task.assignee = assignee
    saveJob(job)
    refreshJobs()
    toast.success(`Reassigned to ${assignee || 'unassigned'}`)
  }

  function handleDeleteTask(jobId: string, taskId: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    job.tasks = job.tasks.filter(t => t.id !== taskId)
    updateJobStatus(job)
    saveJob(job)
    refreshJobs()
  }

  function updateJobStatus(job: Job) {
    if (job.tasks.length === 0) {
      job.status = 'on-track'
      return
    }
    const allComplete = job.tasks.every(t => t.status === 'completed')
    if (allComplete) {
      job.status = 'complete'
      return
    }
    const hasOverdue = job.tasks.some(t => {
      if (t.status === 'completed' || !t.dueDate) return false
      return new Date(t.dueDate) < new Date()
    })
    job.status = hasOverdue ? 'at-risk' : 'on-track'
  }

  function getJobProgress(job: Job) {
    if (job.tasks.length === 0) return 0
    const completed = job.tasks.filter(t => t.status === 'completed').length
    return Math.round((completed / job.tasks.length) * 100)
  }

  function addCrewMember() {
    setFormCrew([...formCrew, { id: generateId(), name: '', role: '', phone: '' }])
  }

  function updateCrewMember(index: number, field: keyof CrewMember, value: string) {
    const updated = [...formCrew]
    updated[index] = { ...updated[index], [field]: value }
    setFormCrew(updated)
  }

  function removeCrewMember(index: number) {
    setFormCrew(formCrew.filter((_, i) => i !== index))
  }

  // Status badge config
  const statusConfig = {
    'on-track': { label: 'On Track', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
    'at-risk': { label: 'At Risk', color: '#ffaa00', bg: 'rgba(255,170,0,0.1)' },
    'complete': { label: 'Complete', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)' },
  }

  // ── Create / Edit View ──────────────────────────
  if (view === 'create' || view === 'edit') {
    const isEdit = view === 'edit'
    return (
      <div className="flex flex-col gap-5" style={{ animation: 'slide-up 0.3s ease' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => { resetForm(); setView(isEdit ? 'detail' : 'list') }} className="text-[#888] hover:text-[#f0f0f0]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">
            {isEdit ? 'Edit Job' : 'New Job'}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Job Name */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Job Name *</span>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Johnson Residence Remodel"
              className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
            />
          </label>

          {/* Address */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Address</span>
            <input
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="123 Main St, Anytown, ST 12345"
              className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
            />
          </label>

          {/* Job Color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Job Color</span>
            <div className="flex gap-2">
              {JOB_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormColor(color)}
                  className="h-8 w-8 border-2 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: formColor === color ? '#f0f0f0' : 'transparent',
                    transform: formColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Crew Members */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#888]">
                Crew Members ({formCrew.length})
              </span>
              <button
                onClick={addCrewMember}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00d4ff] hover:text-[#33ddff]"
              >
                <UserPlus className="h-3 w-3" /> Add
              </button>
            </div>
            {formCrew.length === 0 && (
              <p className="py-3 text-center text-[11px] text-[#555]">No crew members yet. Add someone to get started.</p>
            )}
            {formCrew.map((member, i) => (
              <div key={member.id} className="flex flex-col gap-2 border border-[#333] bg-[#111] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#555]">Member {i + 1}</span>
                  <button onClick={() => removeCrewMember(i)} className="text-[#555] hover:text-[#ff3333]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={member.name}
                  onChange={e => updateCrewMember(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="h-10 border border-[#333] bg-[#0f1115] px-3 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    value={member.role}
                    onChange={e => updateCrewMember(i, 'role', e.target.value)}
                    placeholder="Role (e.g. Journeyman)"
                    className="h-10 flex-1 border border-[#333] bg-[#0f1115] px-3 text-xs text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
                  />
                  <input
                    value={member.phone}
                    onChange={e => updateCrewMember(i, 'phone', e.target.value)}
                    placeholder="Phone"
                    type="tel"
                    className="h-10 w-32 border border-[#333] bg-[#0f1115] px-3 text-xs text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={isEdit ? handleEditJob : handleCreateJob}
          className="flex h-14 items-center justify-center gap-2 bg-[#00d4ff] text-sm font-bold uppercase tracking-wider text-[#0f1115] transition-colors hover:bg-[#33ddff] active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> {isEdit ? 'Save Changes' : 'Create Job'}
        </button>
      </div>
    )
  }

  // ── Detail View ──────────────────────────
  if (view === 'detail' && selectedJob) {
    return (
      <JobDetailView
        job={selectedJob}
        progress={getJobProgress(selectedJob)}
        statusConfig={statusConfig}
        onBack={() => { setView('list'); setSelectedJobId(null) }}
        onDelete={() => handleDeleteJob(selectedJob.id)}
        onEdit={() => openEditForm(selectedJob)}
        onAddTask={(task) => handleAddTask(selectedJob.id, task)}
        onCompleteTask={(taskId, photos, notes) => handleCompleteTask(selectedJob.id, taskId, photos, notes)}
        onUpdateStatus={(taskId, status) => handleUpdateTaskStatus(selectedJob.id, taskId, status)}
        onReassignTask={(taskId, assignee) => handleReassignTask(selectedJob.id, taskId, assignee)}
        onDeleteTask={(taskId) => handleDeleteTask(selectedJob.id, taskId)}
        onOpenQuickTools={() => setQuickToolsOpen(true)}
      />
    )
  }

  // ── List View ────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Active Jobs</h2>
        <button
          onClick={() => { resetForm(); setView('create') }}
          className="flex items-center gap-1.5 bg-[#00d4ff] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#0f1115] transition-colors hover:bg-[#33ddff] active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" /> New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-dashed border-[#333] py-16">
          <div className="flex h-16 w-16 items-center justify-center border border-[#333] bg-[#111]">
            <Wrench className="h-7 w-7 text-[#555]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#888]">No active jobs</p>
            <p className="mt-1 text-xs text-[#555]">Create your first job to start tracking work.</p>
          </div>
          <button
            onClick={() => { resetForm(); setView('create') }}
            className="mt-2 flex items-center gap-1.5 border border-[#00d4ff] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#00d4ff] transition-all hover:bg-[#00d4ff] hover:text-[#0f1115]"
          >
            <Plus className="h-3.5 w-3.5" /> Create First Job
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map(job => {
            const progress = getJobProgress(job)
            const completedCount = job.tasks.filter(t => t.status === 'completed').length
            const sc = statusConfig[job.status]
            return (
              <button
                key={job.id}
                onClick={() => { setSelectedJobId(job.id); setView('detail') }}
                className="group flex flex-col gap-2.5 border bg-[#111] p-4 text-left transition-all hover:border-[#555] active:scale-[0.99]"
                style={{ borderColor: '#333', borderLeftColor: job.color, borderLeftWidth: '3px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#f0f0f0]">{job.name}</div>
                    {job.address && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#888]">
                        <MapPin className="h-3 w-3 shrink-0" /> {job.address}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: sc.color, backgroundColor: sc.bg }}
                    >
                      {sc.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#555] transition-colors group-hover:text-[#f0f0f0]" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-[#222]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: job.color }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#888]">
                    {completedCount} of {job.tasks.length} tasks
                  </span>
                  <div className="flex items-center gap-2">
                    {job.crew.length > 0 && (
                      <div className="flex items-center -space-x-1.5">
                        {job.crew.slice(0, 4).map((member) => (
                          <div
                            key={member.id}
                            className="flex h-6 w-6 items-center justify-center border border-[#0f1115] text-[9px] font-bold text-[#0f1115]"
                            style={{ backgroundColor: job.color }}
                            title={member.name}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {job.crew.length > 4 && (
                          <div className="flex h-6 w-6 items-center justify-center border border-[#0f1115] bg-[#333] text-[9px] font-bold text-[#888]">
                            +{job.crew.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="font-mono text-xs font-bold" style={{ color: job.color }}>{progress}%</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <QuickToolsDrawer open={quickToolsOpen} onOpenChange={setQuickToolsOpen} />
    </div>
  )
}

// ── Job Detail Component ──────────────────────────

interface JobDetailProps {
  job: Job
  progress: number
  statusConfig: Record<string, { label: string; color: string; bg: string }>
  onBack: () => void
  onDelete: () => void
  onEdit: () => void
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  onCompleteTask: (taskId: string, photos: string[], notes: string) => void
  onUpdateStatus: (taskId: string, status: Task['status']) => void
  onReassignTask: (taskId: string, assignee: string) => void
  onDeleteTask: (taskId: string) => void
  onOpenQuickTools: () => void
}

function JobDetailView({
  job, progress, statusConfig,
  onBack, onDelete, onEdit, onAddTask,
  onCompleteTask, onUpdateStatus, onReassignTask, onDeleteTask,
  onOpenQuickTools,
}: JobDetailProps) {
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([])
  const [completionNotes, setCompletionNotes] = useState('')
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Add task form state
  const [taskName, setTaskName] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskNecRef, setTaskNecRef] = useState('')
  const [taskNotes, setTaskNotes] = useState('')

  // Swipe state
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)

  const sc = statusConfig[job.status]

  function resetTaskForm() {
    setTaskName('')
    setTaskAssignee('')
    setTaskPriority('medium')
    setTaskDueDate('')
    setTaskNecRef('')
    setTaskNotes('')
  }

  function submitTask() {
    if (!taskName.trim()) {
      toast.error('Task name is required')
      return
    }
    onAddTask({
      name: taskName.trim(),
      assignee: taskAssignee,
      status: 'pending',
      priority: taskPriority,
      dueDate: taskDueDate,
      necReference: taskNecRef,
      photos: [],
      completedAt: '',
      notes: taskNotes,
    })
    resetTaskForm()
    setShowAddTask(false)
    toast.success('Task added')
  }

  function handleTaskTap(task: Task) {
    if (task.status === 'completed') {
      // Toggle back to in-progress
      onUpdateStatus(task.id, 'in-progress')
    } else if (task.status === 'in-progress') {
      // Open completion flow
      setCompletingTaskId(task.id)
      setCompletionPhotos([])
      setCompletionNotes('')
    } else {
      onUpdateStatus(task.id, 'in-progress')
    }
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCompletionPhotos(prev => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function submitCompletion() {
    if (!completingTaskId) return
    onCompleteTask(completingTaskId, completionPhotos, completionNotes)
    setCompletingTaskId(null)
    setCompletionPhotos([])
    setCompletionNotes('')
    toast.success('Task completed')
  }

  // Touch handlers for swipe gestures
  function onTouchStart(taskId: string, e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    setSwipedTaskId(taskId)
    setSwipeDirection(null)
  }

  function onTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX
    const diff = touchCurrentX.current - touchStartX.current
    if (Math.abs(diff) > 40) {
      setSwipeDirection(diff < 0 ? 'left' : 'right')
    } else {
      setSwipeDirection(null)
    }
  }

  function onTouchEnd(task: Task) {
    if (swipeDirection === 'left' && task.status !== 'completed') {
      // Swipe left = Quick Complete
      setCompletingTaskId(task.id)
      setCompletionPhotos([])
      setCompletionNotes('')
    } else if (swipeDirection === 'right' && task.status !== 'completed') {
      // Swipe right = show reassign (simple approach)
      const nextCrew = job.crew.find(c => c.name !== task.assignee)
      if (nextCrew) {
        onReassignTask(task.id, nextCrew.name)
      }
    }
    setSwipedTaskId(null)
    setSwipeDirection(null)
  }

  // Filter tasks
  const filteredTasks = job.tasks.filter(t => {
    if (taskFilter === 'completed') return t.status === 'completed'
    if (taskFilter === 'mine') return true // In a real app, would filter by current user
    return true
  })

  // Collect all photos from completed tasks
  const allPhotos = job.tasks.flatMap(t => t.photos || [])

  const priorityConfig = {
    high: { label: 'High', color: '#ff3333', bg: 'rgba(255,51,51,0.1)' },
    medium: { label: 'Med', color: '#ffaa00', bg: 'rgba(255,170,0,0.1)' },
    low: { label: 'Low', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  }

  function isOverdue(dueDate: string, status: string) {
    if (!dueDate || status === 'completed') return false
    return new Date(dueDate) < new Date()
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-4" style={{ animation: 'slide-up 0.25s ease' }}>
      {/* Task Completion Modal */}
      {completingTaskId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setCompletingTaskId(null)}>
          <div
            className="w-full max-w-lg border-t border-[#333] bg-[#0f1115] p-5"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slide-up 0.3s ease' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Complete Task</h3>
              <button onClick={() => setCompletingTaskId(null)} className="text-[#888] hover:text-[#f0f0f0]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo capture */}
            <div className="mb-4">
              <span className="mb-2 block text-[10px] uppercase tracking-wider text-[#888]">
                Photos {completionPhotos.length > 0 && `(${completionPhotos.length})`}
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {completionPhotos.map((photo, i) => (
                  <div key={i} className="relative h-20 w-20 shrink-0 border border-[#333]">
                    <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => setCompletionPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-[#ff3333] text-[8px] text-[#f0f0f0]"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center border border-dashed border-[#555] bg-[#111] text-[#555] transition-colors hover:border-[#00d4ff] hover:text-[#00d4ff]">
                  <Camera className="mb-1 h-5 w-5" />
                  <span className="text-[8px] uppercase">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Notes */}
            <textarea
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              placeholder="Completion notes (optional)..."
              rows={2}
              className="mb-4 w-full border border-[#333] bg-[#111] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
            />

            <button
              onClick={submitCompletion}
              className="flex h-12 w-full items-center justify-center gap-2 bg-[#00ff88] text-sm font-bold uppercase tracking-wider text-[#0f1115] transition-colors hover:bg-[#33ffaa] active:scale-[0.99]"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </button>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {showPhotoGallery && allPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowPhotoGallery(false)}>
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Photos ({allPhotos.length})</h3>
              <button onClick={() => setShowPhotoGallery(false)} className="text-[#888] hover:text-[#f0f0f0]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {allPhotos.map((photo, i) => (
                <div key={i} className="aspect-square border border-[#333]">
                  <img src={photo} alt={`Work photo ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowConfirmDelete(false)}>
          <div className="w-full max-w-sm border border-[#333] bg-[#111] p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-1 flex items-center gap-2 text-[#ff3333]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Delete Job</h3>
            </div>
            <p className="mb-4 text-xs text-[#888]">
              This will permanently delete &quot;{job.name}&quot; and all its tasks. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 border border-[#333] bg-[#1a1a1a] py-2.5 text-xs font-bold uppercase tracking-wider text-[#888] hover:bg-[#222]"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-1 bg-[#ff3333] py-2.5 text-xs font-bold uppercase tracking-wider text-[#f0f0f0] hover:bg-[#ff5555]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[#888] hover:text-[#f0f0f0]" aria-label="Back to jobs">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-[#f0f0f0]">{job.name}</h2>
            {job.address && (
              <p className="flex items-center gap-1 text-[10px] text-[#888]">
                <MapPin className="h-3 w-3" /> {job.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center border border-[#333] bg-[#111] text-[#888] hover:border-[#555] hover:text-[#f0f0f0]"
            aria-label="Edit job"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="flex h-8 w-8 items-center justify-center border border-[#333] bg-[#111] text-[#555] hover:border-[#ff3333] hover:text-[#ff3333]"
            aria-label="Delete job"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress + Status */}
      <div className="border bg-[#111] p-3" style={{ borderColor: '#333', borderLeftColor: job.color, borderLeftWidth: '3px' }}>
        <div className="mb-2 flex items-center justify-between">
          <span
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ color: sc.color, backgroundColor: sc.bg }}
          >
            {sc.label}
          </span>
          <span className="font-mono text-sm font-bold" style={{ color: job.color }}>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-[#222]">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: job.color }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-[#888]">
          <span>{job.tasks.filter(t => t.status === 'completed').length} of {job.tasks.length} tasks</span>
          <span>{job.crew.length} crew member{job.crew.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Crew Section */}
      {job.crew.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            <Users className="h-3.5 w-3.5" /> Crew Members ({job.crew.length})
          </h3>
          <div className="flex flex-col gap-1">
            {job.crew.map((member) => (
              <div key={member.id} className="flex items-center gap-3 border border-[#222] bg-[#111] px-3 py-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold text-[#0f1115]"
                  style={{ backgroundColor: job.color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#f0f0f0]">{member.name}</div>
                  {member.role && <div className="text-[10px] text-[#666]">{member.role}</div>}
                </div>
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex h-8 w-8 items-center justify-center border border-[#333] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0f1115]"
                    aria-label={`Call ${member.name}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            Tasks ({job.tasks.length})
          </h3>
          <div className="flex items-center gap-2">
            {/* Task filters */}
            <div className="flex border border-[#333]">
              {(['all', 'completed'] as TaskFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors"
                  style={{
                    backgroundColor: taskFilter === f ? '#1a1a1a' : 'transparent',
                    color: taskFilter === f ? '#f0f0f0' : '#555',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => { resetTaskForm(); setShowAddTask(!showAddTask) }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00d4ff] hover:text-[#33ddff]"
            >
              {showAddTask ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {showAddTask ? 'Cancel' : 'Add'}
            </button>
          </div>
        </div>

        {/* Add task form */}
        {showAddTask && (
          <div className="mb-3 flex flex-col gap-3 border border-[#00d4ff]/30 bg-[#00d4ff]/5 p-4" style={{ animation: 'slide-up 0.2s ease' }}>
            <input
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="Task title *"
              className="h-11 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
              autoFocus
            />

            <div className="flex gap-2">
              <select
                value={taskAssignee}
                onChange={e => setTaskAssignee(e.target.value)}
                className="h-11 flex-1 border border-[#333] bg-[#111] px-3 text-xs text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
              >
                <option value="">Assign to...</option>
                {job.crew.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <input
                type="date"
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                className="h-11 border border-[#333] bg-[#111] px-2 text-xs text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
              />
            </div>

            {/* Priority selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#555]">Priority:</span>
              {(['high', 'medium', 'low'] as const).map(p => {
                const pc = priorityConfig[p]
                return (
                  <button
                    key={p}
                    onClick={() => setTaskPriority(p)}
                    className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: taskPriority === p ? pc.bg : 'transparent',
                      color: taskPriority === p ? pc.color : '#555',
                      border: `1px solid ${taskPriority === p ? pc.color : '#333'}`,
                    }}
                  >
                    {pc.label}
                  </button>
                )
              })}
            </div>

            {/* NEC Reference */}
            <select
              value={taskNecRef}
              onChange={e => setTaskNecRef(e.target.value)}
              className="h-11 border border-[#333] bg-[#111] px-3 text-xs text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
            >
              <option value="">NEC Reference (optional)</option>
              {NEC_ARTICLES.map(a => (
                <option key={a.id} value={a.number}>{a.number} - {a.title}</option>
              ))}
            </select>

            {/* Notes */}
            <textarea
              value={taskNotes}
              onChange={e => setTaskNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="border border-[#333] bg-[#111] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#555] focus:border-[#00d4ff] focus:outline-none"
            />

            <button
              onClick={submitTask}
              className="flex h-11 items-center justify-center gap-2 bg-[#00d4ff] text-xs font-bold uppercase tracking-wider text-[#0f1115] hover:bg-[#33ddff] active:scale-[0.99]"
            >
              Create Task
            </button>
          </div>
        )}

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#555]">
            {taskFilter !== 'all' ? 'No matching tasks.' : 'No tasks yet. Add your first task above.'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="mb-1 text-[9px] text-[#555]">Swipe left to complete &middot; Swipe right to reassign</p>
            {filteredTasks.map(task => {
              const pc = priorityConfig[task.priority || 'medium']
              const overdue = isOverdue(task.dueDate, task.status)
              const isSwiping = swipedTaskId === task.id
              return (
                <div
                  key={task.id}
                  className="relative overflow-hidden"
                  onTouchStart={e => onTouchStart(task.id, e)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={() => onTouchEnd(task)}
                >
                  {/* Swipe indicators */}
                  {isSwiping && swipeDirection === 'left' && (
                    <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#00ff88]/20 text-[9px] font-bold uppercase text-[#00ff88]">
                      <Camera className="mr-1 h-3.5 w-3.5" /> Done
                    </div>
                  )}
                  {isSwiping && swipeDirection === 'right' && (
                    <div className="absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-[#00d4ff]/20 text-[9px] font-bold uppercase text-[#00d4ff]">
                      <ArrowRight className="mr-1 h-3.5 w-3.5" /> Move
                    </div>
                  )}

                  <div
                    className="flex items-center gap-3 border border-[#222] bg-[#111] px-3 py-2.5 transition-transform"
                    style={{
                      transform: isSwiping && swipeDirection ? `translateX(${swipeDirection === 'left' ? '-20px' : '20px'})` : 'none',
                    }}
                  >
                    {/* Status button */}
                    <button
                      onClick={() => handleTaskTap(task)}
                      className="shrink-0 transition-colors"
                      aria-label={`Task status: ${task.status}`}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-[#00ff88]" />
                      ) : task.status === 'in-progress' ? (
                        <Clock className="h-5 w-5 text-[#ffaa00]" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-[#555]" />
                      )}
                    </button>

                    {/* Task content */}
                    <div className="flex-1">
                      <div className={`text-xs font-medium ${task.status === 'completed' ? 'text-[#666] line-through' : 'text-[#f0f0f0]'}`}>
                        {task.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {task.assignee && (
                          <span className="text-[9px] text-[#888]">{task.assignee}</span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center gap-0.5 text-[9px] ${overdue ? 'font-bold text-[#ff3333]' : 'text-[#666]'}`}>
                            <CalendarDays className="h-2.5 w-2.5" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.necReference && (
                          <span className="flex items-center gap-0.5 text-[9px] text-[#00ff88]">
                            <BookOpen className="h-2.5 w-2.5" />
                            {task.necReference}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: priority + photo indicator */}
                    <div className="flex items-center gap-2">
                      {task.photos && task.photos.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[9px] text-[#888]">
                          <ImageIcon className="h-3 w-3" />
                          {task.photos.length}
                        </div>
                      )}
                      <span
                        className="px-1.5 py-0.5 text-[8px] font-bold uppercase"
                        style={{ color: pc.color, backgroundColor: pc.bg }}
                      >
                        {pc.label}
                      </span>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="shrink-0 text-[#444] hover:text-[#ff3333]"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Calculator Notes */}
      {job.notes.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            <StickyNote className="h-3.5 w-3.5" /> Calculator Notes ({job.notes.length})
          </h3>
          <div className="flex flex-col gap-1">
            {job.notes.map((note, i) => (
              <div key={i} className="border-l-2 border-[#ff6b00] bg-[#111] px-3 py-2">
                <p className="font-mono text-[11px] leading-relaxed text-[#ccc]">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            <Camera className="h-3.5 w-3.5" /> Photos ({allPhotos.length})
          </h3>
          {allPhotos.length > 0 && (
            <button
              onClick={() => setShowPhotoGallery(true)}
              className="text-[10px] font-bold uppercase tracking-wider text-[#00d4ff] hover:text-[#33ddff]"
            >
              View All
            </button>
          )}
        </div>
        {allPhotos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allPhotos.slice(0, 6).map((photo, i) => (
              <div key={i} className="h-16 w-16 shrink-0 border border-[#333]">
                <img src={photo} alt={`Work photo ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
            {allPhotos.length > 6 && (
              <button
                onClick={() => setShowPhotoGallery(true)}
                className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#333] bg-[#111] text-[10px] font-bold text-[#888]"
              >
                +{allPhotos.length - 6}
              </button>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-[11px] text-[#555]">
            Photos appear here when tasks are completed.
          </p>
        )}
      </div>

      {/* Quick Tools FAB */}
      <button
        onClick={onOpenQuickTools}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center bg-[#ff6b00] transition-transform hover:scale-105 active:scale-95"
        aria-label="Quick tools"
        style={{ boxShadow: '0 0 20px rgba(255, 107, 0, 0.3)' }}
      >
        <Wrench className="h-5 w-5 text-[#0f1115]" />
      </button>
    </div>
  )
}
