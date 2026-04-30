import { useMemo, useRef, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Funnel, CaretUp, CaretDown, PencilSimple, Trash, DownloadSimple } from '@phosphor-icons/react'
import type { Incident, ImpactLevel, IncidentStatus } from '@/lib/types'
import { formatDate, getAllTopics } from '@/lib/data-utils'

interface IncidentsTableProps {
  incidents: Incident[]
  onEditIncident: (incident: Incident) => void
  onDeleteIncident: (incident: Incident) => void
  onBulkDelete?: (incidents: Incident[]) => void
  onBulkUpdate?: (incidentIds: string[], updates: Partial<Pick<Incident, 'status' | 'impact'>>) => void
}

type SortField = 'createdAt' | 'problem' | 'impact' | 'status'
type SortDirection = 'asc' | 'desc'
type ExportFormat = 'csv' | 'json'
type CsvIncidentField = 'id' | 'createdAt' | 'problem' | 'description' | 'topics' | 'rootCauses' | 'fix' | 'status' | 'impact'

const STATUS_VALUES: IncidentStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed']
const IMPACT_VALUES: ImpactLevel[] = ['Low', 'Medium', 'High', 'Critical']

function downloadFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function csvEscape(value: string | string[] | undefined): string {
  const normalized = (Array.isArray(value) ? value.join('; ') : String(value ?? '')).replace(/[\r\n]+/g, ' ')
  return `"${normalized.replace(/"/g, '""')}"`
}

function incidentsToCsv(incidents: Incident[]): string {
  const headers: CsvIncidentField[] = ['id', 'createdAt', 'problem', 'description', 'topics', 'rootCauses', 'fix', 'status', 'impact']
  const rows = incidents.map((incident) => headers.map((header) => csvEscape(incident[header])).join(','))
  return [headers.join(','), ...rows].join('\n')
}

export function IncidentsTable({ incidents, onEditIncident, onDeleteIncident, onBulkDelete, onBulkUpdate }: IncidentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'All'>('All')
  const [impactFilter, setImpactFilter] = useState<ImpactLevel | 'All'>('All')
  const [topicFilter, setTopicFilter] = useState<string>('All')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null)
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set())
  const [lastSelectedIncidentId, setLastSelectedIncidentId] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState<IncidentStatus | 'No change'>('No change')
  const [bulkImpact, setBulkImpact] = useState<ImpactLevel | 'No change'>('No change')
  const shiftSelectRef = useRef(false)

  const allTopics = useMemo(() => getAllTopics(incidents), [incidents])

  const filteredAndSortedIncidents = useMemo(() => {
    let filtered = incidents

    if (statusFilter !== 'All') {
      filtered = filtered.filter(i => i.status === statusFilter)
    }

    if (impactFilter !== 'All') {
      filtered = filtered.filter(i => i.impact === impactFilter)
    }

    if (topicFilter !== 'All') {
      filtered = filtered.filter(i => i.topics.includes(topicFilter))
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'problem':
          comparison = a.problem.localeCompare(b.problem)
          break
        case 'impact':
          comparison = IMPACT_VALUES.indexOf(a.impact) - IMPACT_VALUES.indexOf(b.impact)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [incidents, statusFilter, impactFilter, topicFilter, sortField, sortDirection])

  const selectedIncidentsList = useMemo(() => {
    return incidents.filter(i => selectedIncidents.has(i.id))
  }, [incidents, selectedIncidents])

  const selectedVisibleCount = filteredAndSortedIncidents.filter((incident) => selectedIncidents.has(incident.id)).length
  const allSelected = filteredAndSortedIncidents.length > 0 && selectedVisibleCount === filteredAndSortedIncidents.length
  const hasActiveFilters = statusFilter !== 'All' || impactFilter !== 'All' || topicFilter !== 'All'
  const canApplyBulkEdit = selectedIncidents.size > 0 && (bulkStatus !== 'No change' || bulkImpact !== 'No change')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getImpactColor = (impact: ImpactLevel) => {
    const colors: Record<ImpactLevel, string> = {
      Low: 'bg-success text-white',
      Medium: 'bg-warning text-white',
      High: 'bg-status-open text-white',
      Critical: 'bg-critical text-white',
    }
    return colors[impact]
  }

  const getStatusColor = (status: IncidentStatus) => {
    const colors: Record<IncidentStatus, string> = {
      Open: 'bg-status-open text-white',
      'In Progress': 'bg-warning text-white',
      Resolved: 'bg-success text-white',
      Closed: 'bg-secondary text-secondary-foreground',
    }
    return colors[status]
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <CaretUp className="h-3 w-3" weight="bold" />
    ) : (
      <CaretDown className="h-3 w-3" weight="bold" />
    )
  }

  const handleDeleteClick = (incident: Incident) => {
    setIncidentToDelete(incident)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (incidentToDelete) {
      onDeleteIncident(incidentToDelete)
    }
    setDeleteDialogOpen(false)
    setIncidentToDelete(null)
  }

  const toggleSelectIncident = (incidentId: string, shiftKey = false) => {
    setSelectedIncidents((prev) => {
      const next = new Set(prev)
      const shouldSelect = !next.has(incidentId)

      if (shiftKey && lastSelectedIncidentId) {
        const currentIndex = filteredAndSortedIncidents.findIndex((incident) => incident.id === incidentId)
        const lastIndex = filteredAndSortedIncidents.findIndex((incident) => incident.id === lastSelectedIncidentId)

        if (currentIndex !== -1 && lastIndex !== -1) {
          const [start, end] = [currentIndex, lastIndex].sort((a, b) => a - b)
          filteredAndSortedIncidents.slice(start, end + 1).forEach((incident) => {
            if (shouldSelect) {
              next.add(incident.id)
            } else {
              next.delete(incident.id)
            }
          })
          return next
        }
      }

      if (shouldSelect) {
        next.add(incidentId)
      } else {
        next.delete(incidentId)
      }
      return next
    })
    setLastSelectedIncidentId(incidentId)
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      const visibleIds = new Set(filteredAndSortedIncidents.map(i => i.id))
      setSelectedIncidents((prev) => new Set([...prev].filter((id) => !visibleIds.has(id))))
    } else {
      setSelectedIncidents((prev) => new Set([...prev, ...filteredAndSortedIncidents.map(i => i.id)]))
    }
  }

  const handleBulkDeleteClick = () => {
    if (selectedIncidents.size > 0) {
      setBulkDeleteDialogOpen(true)
    }
  }

  const confirmBulkDelete = () => {
    const incidentsToDelete = incidents.filter(i => selectedIncidents.has(i.id))
    if (onBulkDelete && incidentsToDelete.length > 0) {
      onBulkDelete(incidentsToDelete)
    }
    setSelectedIncidents(new Set())
    setLastSelectedIncidentId(null)
    setBulkDeleteDialogOpen(false)
  }

  const handleBulkUpdate = () => {
    if (!onBulkUpdate || !canApplyBulkEdit) return

    const updates: Partial<Pick<Incident, 'status' | 'impact'>> = {}
    if (bulkStatus !== 'No change') updates.status = bulkStatus
    if (bulkImpact !== 'No change') updates.impact = bulkImpact

    onBulkUpdate([...selectedIncidents], updates)
    setBulkStatus('No change')
    setBulkImpact('No change')
  }

  const handleExport = (format: ExportFormat) => {
    if (selectedIncidentsList.length === 0) return

    const exportDate = new Date().toISOString().slice(0, 10)
    if (format === 'json') {
      downloadFile(`selected-incidents-${exportDate}.json`, JSON.stringify(selectedIncidentsList, null, 2), 'application/json')
      return
    }

    downloadFile(`selected-incidents-${exportDate}.csv`, incidentsToCsv(selectedIncidentsList), 'text/csv')
  }

  return (
    <div className="space-y-4">
      {selectedIncidents.size > 0 && (
        <div className="bg-accent/10 border border-accent rounded-lg px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-accent-foreground">
                {selectedIncidents.size} incident{selectedIncidents.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIncidents(new Set())
                  setLastSelectedIncidentId(null)
                }}
              >
                Clear selection
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-2">
                <DownloadSimple className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('json')} className="gap-2">
                <DownloadSimple className="h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick} className="gap-2">
                <Trash className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Bulk edit:</span>
            <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as IncidentStatus | 'No change')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No change">Status: no change</SelectItem>
                {STATUS_VALUES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bulkImpact} onValueChange={(value) => setBulkImpact(value as ImpactLevel | 'No change')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No change">Impact: no change</SelectItem>
                {IMPACT_VALUES.map((impact) => (
                  <SelectItem key={impact} value={impact}>{impact}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkUpdate} disabled={!canApplyBulkEdit}>
              Apply to selected
            </Button>
            <span className="text-xs text-muted-foreground">Tip: Shift+Click checkboxes to select a range.</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Funnel className="h-4 w-4" />
          <span className="font-medium">Filters:</span>
        </div>

        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Topics</SelectItem>
            {allTopics.map(topic => (
              <SelectItem key={topic} value={topic}>{topic}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IncidentStatus | 'All')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            {STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={impactFilter} onValueChange={(v) => setImpactFilter(v as ImpactLevel | 'All')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Impact</SelectItem>
            {IMPACT_VALUES.map((impact) => (
              <SelectItem key={impact} value={impact}>{impact}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('All')
              setImpactFilter('All')
              setTopicFilter('All')
            }}
          >
            Clear Filters
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground font-mono">
          {filteredAndSortedIncidents.length} incidents
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all visible incidents" />
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center gap-2">Date<SortIcon field="createdAt" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('problem')}>
                <div className="flex items-center gap-2">Problem<SortIcon field="problem" /></div>
              </TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Root Causes</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-2">Status<SortIcon field="status" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('impact')}>
                <div className="flex items-center gap-2">Impact<SortIcon field="impact" /></div>
              </TableHead>
              <TableHead>Fix</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No incidents found</TableCell>
              </TableRow>
            ) : (
              filteredAndSortedIncidents.map(incident => (
                <TableRow key={incident.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedIncidents.has(incident.id)}
                      onClick={(event) => {
                        shiftSelectRef.current = event.shiftKey
                      }}
                      onKeyDown={(event) => {
                        if (event.key === ' ' || event.key === 'Enter') {
                          shiftSelectRef.current = event.shiftKey
                        }
                      }}
                      onCheckedChange={() => {
                        toggleSelectIncident(incident.id, shiftSelectRef.current)
                        shiftSelectRef.current = false
                      }}
                      aria-label={`Select incident ${incident.problem}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatDate(incident.createdAt)}</TableCell>
                  <TableCell className="font-medium">
                    <div>{incident.problem}</div>
                    {incident.description && (
                      <div className="text-xs text-muted-foreground font-normal line-clamp-2 mt-1">{incident.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {incident.topics.map(topic => <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {incident.rootCauses.map(cause => <Badge key={cause} variant="default" className="text-xs">{cause}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell><Badge className={`${getStatusColor(incident.status)} text-xs`}>{incident.status}</Badge></TableCell>
                  <TableCell><Badge className={`${getImpactColor(incident.impact)} text-xs`}>{incident.impact}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{incident.fix || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditIncident(incident)} aria-label={`Edit ${incident.problem}`}>
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(incident)} aria-label={`Delete ${incident.problem}`}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this incident? This action cannot be undone.
              {incidentToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                  <div className="font-medium text-foreground">{incidentToDelete.problem}</div>
                  <div className="text-sm flex flex-wrap gap-1">
                    {incidentToDelete.rootCauses.map(cause => <Badge key={cause} variant="default" className="text-xs">{cause}</Badge>)}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Incidents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIncidents.size} incident{selectedIncidents.size !== 1 ? 's' : ''}? You can undo this action immediately after deletion.
              <div className="mt-4 p-3 bg-muted rounded-md max-h-48 overflow-y-auto space-y-2">
                {selectedIncidentsList.map((incident) => (
                  <div key={incident.id} className="text-sm text-foreground flex items-start gap-2">
                    <span className="font-medium min-w-0 flex-1">{incident.problem}</span>
                    <div className="flex flex-wrap gap-1">
                      {incident.rootCauses.slice(0, 2).map(cause => <Badge key={cause} variant="secondary" className="text-xs">{cause}</Badge>)}
                      {incident.rootCauses.length > 2 && <Badge variant="secondary" className="text-xs">+{incident.rootCauses.length - 2}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedIncidents.size} Incident{selectedIncidents.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
