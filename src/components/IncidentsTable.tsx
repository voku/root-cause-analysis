import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Funnel, CaretUp, CaretDown, PencilSimple, Trash } from '@phosphor-icons/react'
import type { Incident, ImpactLevel, IncidentStatus } from '@/lib/types'
import { formatDate, getAllTopics } from '@/lib/data-utils'

interface IncidentsTableProps {
  incidents: Incident[]
  onEditIncident: (incident: Incident) => void
  onDeleteIncident: (incident: Incident) => void
  onBulkDelete?: (incidents: Incident[]) => void
}

type SortField = 'createdAt' | 'problem' | 'impact' | 'status'
type SortDirection = 'asc' | 'desc'

export function IncidentsTable({ incidents, onEditIncident, onDeleteIncident, onBulkDelete }: IncidentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'All'>('All')
  const [impactFilter, setImpactFilter] = useState<ImpactLevel | 'All'>('All')
  const [topicFilter, setTopicFilter] = useState<string>('All')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null)
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set())

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
          const impactOrder: Record<ImpactLevel, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
          comparison = impactOrder[a.impact] - impactOrder[b.impact]
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [incidents, statusFilter, impactFilter, topicFilter, sortField, sortDirection])

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

  const hasActiveFilters = statusFilter !== 'All' || impactFilter !== 'All' || topicFilter !== 'All'

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

  const toggleSelectIncident = (incidentId: string) => {
    setSelectedIncidents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId)
      } else {
        newSet.add(incidentId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIncidents.size === filteredAndSortedIncidents.length) {
      setSelectedIncidents(new Set())
    } else {
      setSelectedIncidents(new Set(filteredAndSortedIncidents.map(i => i.id)))
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
    setBulkDeleteDialogOpen(false)
  }

  const selectedIncidentsList = useMemo(() => {
    return incidents.filter(i => selectedIncidents.has(i.id))
  }, [incidents, selectedIncidents])

  const allSelected = filteredAndSortedIncidents.length > 0 && 
    selectedIncidents.size === filteredAndSortedIncidents.length

  return (
    <div className="space-y-4">
      {selectedIncidents.size > 0 && (
        <div className="bg-accent/10 border border-accent rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-accent-foreground">
              {selectedIncidents.size} incident{selectedIncidents.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIncidents(new Set())}
            >
              Clear selection
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDeleteClick}
            className="gap-2"
          >
            <Trash className="h-4 w-4" />
            Delete Selected
          </Button>
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
              <SelectItem key={topic} value={topic}>
                {topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IncidentStatus | 'All')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={impactFilter} onValueChange={(v) => setImpactFilter(v as ImpactLevel | 'All')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Impact</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
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
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all incidents"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="createdAt" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('problem')}
              >
                <div className="flex items-center gap-2">
                  Problem
                  <SortIcon field="problem" />
                </div>
              </TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Root Causes</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('impact')}
              >
                <div className="flex items-center gap-2">
                  Impact
                  <SortIcon field="impact" />
                </div>
              </TableHead>
              <TableHead>Fix</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No incidents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedIncidents.map(incident => (
                <TableRow key={incident.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedIncidents.has(incident.id)}
                      onCheckedChange={() => toggleSelectIncident(incident.id)}
                      aria-label={`Select incident ${incident.problem}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatDate(incident.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{incident.problem}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {incident.topics.map(topic => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {incident.rootCauses.map(cause => (
                        <Badge key={cause} variant="default" className="text-xs">
                          {cause}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(incident.status)} text-xs`}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getImpactColor(incident.impact)} text-xs`}>
                      {incident.impact}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {incident.fix || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditIncident(incident)}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(incident)}
                      >
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
                    {incidentToDelete.rootCauses.map(cause => (
                      <Badge key={cause} variant="default" className="text-xs">
                        {cause}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Incidents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIncidents.size} incident{selectedIncidents.size !== 1 ? 's' : ''}? 
              You can undo this action immediately after deletion.
              <div className="mt-4 p-3 bg-muted rounded-md max-h-48 overflow-y-auto space-y-2">
                {selectedIncidentsList.map((incident) => (
                  <div key={incident.id} className="text-sm text-foreground flex items-start gap-2">
                    <span className="font-medium min-w-0 flex-1">{incident.problem}</span>
                    <div className="flex flex-wrap gap-1">
                      {incident.rootCauses.slice(0, 2).map(cause => (
                        <Badge key={cause} variant="secondary" className="text-xs">
                          {cause}
                        </Badge>
                      ))}
                      {incident.rootCauses.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{incident.rootCauses.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIncidents.size} Incident{selectedIncidents.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
