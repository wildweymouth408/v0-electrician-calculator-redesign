'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getJobs, saveJob, deleteJob,
  generateId,
  type Job, type Task,
} from '@/lib/storage'
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
} from 'lucide-react'

type View = 'list' | 'detail' | 'create'

export function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [view, setView] = useState<View>('list')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [quickToolsOpen, setQuickToolsOpen] = useState(false)

  // Create job form state
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newCrew, setNewCrew] = useState(['', '', '', ''])

  const refreshJobs = useCallback(() => {
    setJobs(getJobs())
  }, [])

  useEffect(() => {
    refreshJobs()
  }, [refreshJobs])

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null

  function handleCreateJob() {
    if (!newName.trim()) {
      toast.error('Job name is required')
      return
    }
    const job: Job = {
      id: generateId(),
      name: newName.trim(),
      address: newAddress.trim(),
      crew: newCrew.filter(c => c.trim() !== ''),
      tasks: [],
      notes: [],
      createdAt: new Date().toISOString(),
    }
    saveJob(job)
    refreshJobs()
    setNewName('')
    setNewAddress('')
    setNewCrew(['', '', '', ''])
    setSelectedJobId(job.id)
    setView('detail')
    toast.success('Job created')
  }

  function handleDeleteJob(id: string) {
    deleteJob(id)
    refreshJobs()
    setView('list')
    setSelectedJobId(null)
    toast.success('Job deleted')
  }

  function handleAddTask(jobId: string, taskName: string, assignee: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const task: Task = {
      id: generateId(),
      name: taskName,
      assignee,
      status: 'pending',
      notes: '',
      createdAt: new Date().toISOString(),
    }
    job.tasks.push(task)
    saveJob(job)
    refreshJobs()
  }

  function handleUpdateTaskStatus(jobId: string, taskId: string, status: Task['status']) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const task = job.tasks.find(t => t.id === taskId)
    if (!task) return
    task.status = status
    saveJob(job)
    refreshJobs()
  }

  function handleDeleteTask(jobId: string, taskId: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    job.tasks = job.tasks.filter(t => t.id !== taskId)
    saveJob(job)
    refreshJobs()
  }

  function getJobProgress(job: Job) {
    if (job.tasks.length === 0) return 0
    const completed = job.tasks.filter(t => t.status === 'completed').length
    return Math.round((completed / job.tasks.length) * 100)
  }

  function getStatusColor(status: Task['status']) {
    switch (status) {
      case 'completed': return '#00ff88'
      case 'in-progress': return '#ffaa00'
      case 'pending': return '#555'
    }
  }

  function getStatusIcon(status: Task['status']) {
    switch (status) {
      case 'completed': return CheckCircle2
      case 'in-progress': return Clock
      case 'pending': return AlertCircle
    }
  }

  // ── Create View ──────────────────────────
  if (view === 'create') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-[#888] hover:text-[#f0f0f0]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">New Job</h2>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Job Name *</span>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Main Street Renovation"
              className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#888]">Address</span>
            <input
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              placeholder="123 Main St, City, ST"
              className="h-12 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-wider text-[#888]">Crew Members</span>
            {newCrew.map((member, i) => (
              <input
                key={i}
                value={member}
                onChange={e => {
                  const updated = [...newCrew]
                  updated[i] = e.target.value
                  setNewCrew(updated)
                }}
                placeholder={`Crew member ${i + 1}`}
                className="mb-2 h-10 w-full border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateJob}
          className="flex h-12 items-center justify-center gap-2 bg-[#00d4ff] text-sm font-bold uppercase tracking-wider text-[#0f1115] transition-colors hover:bg-[#33ddff] active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> Create Job
        </button>
      </div>
    )
  }

  // ── Detail View ──────────────────────────
  if (view === 'detail' && selectedJob) {
    const progress = getJobProgress(selectedJob)
    return (
      <JobDetailView
        job={selectedJob}
        progress={progress}
        onBack={() => { setView('list'); setSelectedJobId(null) }}
        onDelete={() => handleDeleteJob(selectedJob.id)}
        onAddTask={(name, assignee) => handleAddTask(selectedJob.id, name, assignee)}
        onUpdateStatus={(taskId, status) => handleUpdateTaskStatus(selectedJob.id, taskId, status)}
        onDeleteTask={(taskId) => handleDeleteTask(selectedJob.id, taskId)}
        onOpenQuickTools={() => setQuickToolsOpen(true)}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
      />
    )
  }

  // ── List View ────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0f0f0]">Jobs</h2>
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-1.5 bg-[#00d4ff] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#0f1115] transition-colors hover:bg-[#33ddff] active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" /> New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-[#333] py-12">
          <div className="flex h-14 w-14 items-center justify-center border border-[#333] bg-[#111]">
            <Wrench className="h-6 w-6 text-[#555]" />
          </div>
          <p className="text-sm text-[#888]">No active jobs</p>
          <p className="text-xs text-[#555]">Create your first job to get started.</p>
          <button
            onClick={() => setView('create')}
            className="mt-2 flex items-center gap-1.5 border border-[#333] bg-[#1a1a1a] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#f0f0f0] hover:bg-[#222]"
          >
            <Plus className="h-3.5 w-3.5" /> Create Job
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map(job => {
            const progress = getJobProgress(job)
            const completedCount = job.tasks.filter(t => t.status === 'completed').length
            return (
              <button
                key={job.id}
                onClick={() => { setSelectedJobId(job.id); setView('detail') }}
                className="flex flex-col gap-2 border border-[#333] bg-[#111] p-4 text-left transition-all hover:border-[#555] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#f0f0f0]">{job.name}</div>
                    {job.address && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#888]">
                        <MapPin className="h-3 w-3" /> {job.address}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#00d4ff]">{progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-[#222]">
                  <div
                    className="h-full bg-[#00d4ff] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#888]">
                    {completedCount} of {job.tasks.length} tasks
                  </span>
                  {job.crew.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-[#888]">
                      <Users className="h-3 w-3" /> {job.crew.length}
                    </div>
                  )}
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
  onBack: () => void
  onDelete: () => void
  onAddTask: (name: string, assignee: string) => void
  onUpdateStatus: (taskId: string, status: Task['status']) => void
  onDeleteTask: (taskId: string) => void
  onOpenQuickTools: () => void
  getStatusColor: (status: Task['status']) => string
  getStatusIcon: (status: Task['status']) => typeof CheckCircle2
}

function JobDetailView({
  job, progress, onBack, onDelete, onAddTask,
  onUpdateStatus, onDeleteTask, onOpenQuickTools,
  getStatusColor, getStatusIcon,
}: JobDetailProps) {
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')

  function submitTask() {
    if (!taskName.trim()) return
    onAddTask(taskName.trim(), taskAssignee.trim())
    setTaskName('')
    setTaskAssignee('')
    setShowAddTask(false)
    toast.success('Task added')
  }

  const nextStatus = (current: Task['status']): Task['status'] => {
    if (current === 'pending') return 'in-progress'
    if (current === 'in-progress') return 'completed'
    return 'pending'
  }

  return (
    <div className="flex flex-col gap-4">
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
        <button
          onClick={onDelete}
          className="text-[#555] transition-colors hover:text-[#ff3333]"
          aria-label="Delete job"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="border border-[#333] bg-[#111] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#888]">Progress</span>
          <span className="font-mono text-sm font-bold text-[#00d4ff]">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-[#222]">
          <div
            className="h-full bg-[#00d4ff] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Crew */}
      {job.crew.length > 0 && (
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">Crew</h3>
          <div className="flex flex-wrap gap-2">
            {job.crew.map((member, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border border-[#333] bg-[#111] px-3 py-1.5"
              >
                <div className="flex h-6 w-6 items-center justify-center bg-[#00d4ff] text-[10px] font-bold text-[#0f1115]">
                  {member.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-[#ccc]">{member}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#888]">
            Tasks ({job.tasks.length})
          </h3>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00d4ff] hover:text-[#33ddff]"
          >
            {showAddTask ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {showAddTask ? 'Cancel' : 'Add Task'}
          </button>
        </div>

        {/* Add task form */}
        {showAddTask && (
          <div className="mb-3 flex flex-col gap-2 border border-[#00d4ff]/30 bg-[#00d4ff]/5 p-3">
            <input
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="Task name"
              className="h-10 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={taskAssignee}
                onChange={e => setTaskAssignee(e.target.value)}
                className="h-10 flex-1 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] focus:border-[#00d4ff] focus:outline-none"
              >
                <option value="">Unassigned</option>
                {job.crew.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
              <button
                onClick={submitTask}
                className="flex h-10 items-center justify-center bg-[#00d4ff] px-4 text-xs font-bold uppercase tracking-wider text-[#0f1115] hover:bg-[#33ddff]"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Task list */}
        {job.tasks.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#555]">No tasks yet. Add your first task above.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {job.tasks.map(task => {
              const StatusIcon = getStatusIcon(task.status)
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 border border-[#222] bg-[#111] px-3 py-2.5"
                >
                  <button
                    onClick={() => onUpdateStatus(task.id, nextStatus(task.status))}
                    className="shrink-0 transition-colors"
                    style={{ color: getStatusColor(task.status) }}
                    aria-label={`Mark task as ${nextStatus(task.status)}`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${task.status === 'completed' ? 'text-[#888] line-through' : 'text-[#f0f0f0]'}`}>
                      {task.name}
                    </div>
                    {task.assignee && (
                      <div className="text-[10px] text-[#666]">{task.assignee}</div>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="shrink-0 text-[#555] hover:text-[#ff3333]"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notes from calculators */}
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

      {/* Photo placeholder */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
          <Camera className="h-3.5 w-3.5" /> Photos
        </h3>
        <button className="flex w-full items-center justify-center gap-2 border border-dashed border-[#333] bg-[#111] py-6 text-xs text-[#555] transition-colors hover:border-[#00d4ff] hover:text-[#00d4ff]">
          <Camera className="h-5 w-5" /> Tap to add photo
        </button>
      </div>

      {/* Quick Tools FAB */}
      <button
        onClick={onOpenQuickTools}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center bg-[#ff6b00] shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Quick tools"
        style={{ boxShadow: '0 0 20px rgba(255, 107, 0, 0.3)' }}
      >
        <Wrench className="h-5 w-5 text-[#0f1115]" />
      </button>
    </div>
  )
}
