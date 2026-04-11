'use client'
import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { PipelineLead, PipelineStatus } from '@/lib/db/pipeline'

// Defined here (not imported from lib/db) to avoid pulling Node.js pg into the client bundle.
const PIPELINE_STATUSES: PipelineStatus[] = [
  'NEW', 'CONTACTED', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST',
]
import { LeadSidePanel } from './LeadSidePanel'

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<PipelineStatus, string> = {
  NEW:          'New',
  CONTACTED:    'Contacted',
  QUOTED:       'Quoted',
  CLOSED_WON:   'Closed Won',
  CLOSED_LOST:  'Closed Lost',
}

const COLUMN_ACCENT: Record<PipelineStatus, string> = {
  NEW:          'border-gray-700',
  CONTACTED:    'border-indigo-700/60',
  QUOTED:       'border-violet-700/60',
  CLOSED_WON:   'border-green-700/60',
  CLOSED_LOST:  'border-red-900/60',
}

const COLUMN_HEADER: Record<PipelineStatus, string> = {
  NEW:          'text-gray-400',
  CONTACTED:    'text-indigo-400',
  QUOTED:       'text-violet-400',
  CLOSED_WON:   'text-green-400',
  CLOSED_LOST:  'text-red-400',
}

// ── OVR colour ────────────────────────────────────────────────────────────────

function ovrClass(ovr: number) {
  if (ovr >= 90) return 'text-amber-400'
  if (ovr >= 80) return 'text-yellow-500'
  if (ovr >= 70) return 'text-slate-300'
  return 'text-orange-400'
}

function formatShortDate(d: Date | string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-TT', {
    timeZone: 'America/Port_of_Spain',
    day: 'numeric', month: 'short',
  })
}

// ── Lead card (draggable) ─────────────────────────────────────────────────────

function LeadCard({
  lead,
  onClick,
  ghost = false,
}: {
  lead: PipelineLead
  onClick?: () => void
  ghost?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none
        ${ghost ? 'shadow-2xl ring-1 ring-indigo-500/50' : 'hover:border-gray-600'}
        transition-colors`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-black ${ovrClass(lead.calculated_ovr)}`}>
          {lead.calculated_ovr}
        </span>
        {lead.note_count > 0 && (
          <span className="text-[10px] text-gray-500">{lead.note_count} note{lead.note_count !== 1 ? 's' : ''}</span>
        )}
      </div>
      <p className="text-white text-sm font-medium leading-tight truncate">{lead.full_name}</p>
      <p className="text-gray-500 text-xs mt-0.5 truncate">{lead.parish ?? 'T&T'}</p>
      {lead.last_note_at && (
        <p className="text-gray-600 text-[10px] mt-1">{formatShortDate(lead.last_note_at)}</p>
      )}
    </div>
  )
}

// ── Column (droppable) ────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  leads,
  onCardClick,
}: {
  status: PipelineStatus
  leads: PipelineLead[]
  onCardClick: (lead: PipelineLead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className={`flex flex-col rounded-xl border ${COLUMN_ACCENT[status]} bg-gray-950/60 min-h-[400px] w-52 flex-shrink-0`}>
      <div className="px-3 py-3 border-b border-gray-800/60 flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${COLUMN_HEADER[status]}`}>
          {COLUMN_LABELS[status]}
        </span>
        <span className="text-xs text-gray-600 font-medium">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 p-2 rounded-b-xl transition-colors ${isOver ? 'bg-indigo-950/30' : ''}`}
      >
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-700 text-xs">Drop here</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Board ─────────────────────────────────────────────────────────────────────

interface Props {
  initialLeads: PipelineLead[]
}

export function PipelineBoard({ initialLeads }: Props) {
  const [leads, setLeads]               = useState(initialLeads)
  const [activeId, setActiveId]         = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeLead = activeId ? leads.find(l => l.id === activeId) ?? null : null

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const leadId    = active.id as string
    const newStatus = over.id  as PipelineStatus
    const lead      = leads.find(l => l.id === leadId)
    if (!lead || lead.pipeline_status === newStatus) return

    // Optimistic update
    setLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, pipeline_status: newStatus } : l)
    )
    // Also update the side panel if it's showing this lead
    setSelectedLead(prev =>
      prev?.id === leadId ? { ...prev, pipeline_status: newStatus } : prev
    )

    const res = await fetch(`/api/pro/leads/${leadId}/pipeline`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      // Roll back on failure
      setLeads(prev =>
        prev.map(l => l.id === leadId ? { ...l, pipeline_status: lead.pipeline_status } : l)
      )
    }
  }

  const byStatus = Object.fromEntries(
    PIPELINE_STATUSES.map(s => [s, leads.filter(l => l.pipeline_status === s)])
  ) as Record<PipelineStatus, PipelineLead[]>

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                leads={byStatus[status]}
                onCardClick={setSelectedLead}
              />
            ))}
          </div>
        </div>

        {/* Drag ghost card */}
        <DragOverlay>
          {activeLead && <LeadCard lead={activeLead} ghost />}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <LeadSidePanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  )
}
