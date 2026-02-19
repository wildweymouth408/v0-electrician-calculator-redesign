'use client'

import { useState } from 'react'
import { getJobs, addNoteToJob, type Job } from '@/lib/storage'
import { toast } from 'sonner'
import { Briefcase, ChevronDown, Check } from 'lucide-react'

interface AttachToJobProps {
  note: string
}

export function AttachToJob({ note }: AttachToJobProps) {
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [attached, setAttached] = useState<string | null>(null)

  function handleOpen() {
    const currentJobs = getJobs()
    if (currentJobs.length === 0) {
      toast.error('No jobs created yet. Create a job first.')
      return
    }
    setJobs(currentJobs)
    setOpen(!open)
  }

  function handleAttach(job: Job) {
    addNoteToJob(job.id, note)
    setAttached(job.name)
    setOpen(false)
    toast.success(`Saved to ${job.name}`)
    setTimeout(() => setAttached(null), 3000)
  }

  if (attached) {
    return (
      <div className="flex items-center gap-2 bg-[#00ff88]/10 px-3 py-2.5 text-xs font-medium text-[#00ff88]">
        <Check className="h-3.5 w-3.5" />
        Saved to {attached}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 bg-[#00d4ff] py-3 text-xs font-bold uppercase tracking-wider text-[#0f1115] transition-colors hover:bg-[#33ddff] active:scale-[0.99]"
      >
        <Briefcase className="h-3.5 w-3.5" />
        Attach to Job
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 z-50 mb-1 w-full border border-[#333] bg-[#111] shadow-lg"
          style={{ animation: 'fade-in 0.15s ease' }}
        >
          <div className="max-h-40 overflow-y-auto">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => handleAttach(job)}
                className="flex w-full items-center gap-2 border-b border-[#222] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#1a1a1a]"
              >
                <div className="h-2 w-2 shrink-0" style={{ backgroundColor: job.color }} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#f0f0f0]">{job.name}</div>
                  {job.address && <div className="text-[9px] text-[#666]">{job.address}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
