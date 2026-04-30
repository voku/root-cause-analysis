import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Funnel, CaretUp, CaretDown, PencilSimple } from '@phosphor-icons/react'
import type { Incident, ImpactLevel, IncidentStatus } from '@/lib/types'
import { formatDate, getAllTopics } from '@/lib/data-utils'

interface IncidentsTableProps {
  incidents: Incident[]
  onEditIncident: (incident: Incident) => void
}

type SortField = 'createdAt' | 'problem' | 'impact' | 'status'
type SortDirection = 'asc' | 'desc'

export function IncidentsTable({ incidents, onEditIncident }: IncidentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'All'>('All')
  const [impactFilter, setImpactFilter] = useState<ImpactLevel | 'All'>('All')
  const [topicFilter, setTopicFilter] = useState<string>('All')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

  return (
    <div className="space-y-4">
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No incidents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedIncidents.map(incident => (
                <TableRow key={incident.id} className="hover:bg-muted/30 transition-colors">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEditIncident(incident)}
                    >
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
