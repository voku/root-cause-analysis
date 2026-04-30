import { useState, useEffect } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { Incident, ImpactLevel, IncidentStatus } from '@/lib/types'
import { filterBySearchTerm } from '@/lib/data-utils'

interface EditIncidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (incident: Incident) => void
  incident: Incident | null
  existingProblems: string[]
  existingRootCauses: string[]
  existingTopics: string[]
  existingFixes: string[]
  rootCauseCounts: Record<string, number>
}

type PickerField = 'problem' | 'rootCause' | 'topic' | 'fix'

const pickerLabels: Record<PickerField, string> = {
  problem: 'problem',
  rootCause: 'root cause',
  topic: 'topic',
  fix: 'fix',
}

export function EditIncidentDialog({
  open,
  onOpenChange,
  onSave,
  incident,
  existingProblems,
  existingRootCauses,
  existingTopics,
  existingFixes,
  rootCauseCounts,
}: EditIncidentDialogProps) {
  const [problem, setProblem] = useState('')
  const [rootCauses, setRootCauses] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [fix, setFix] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IncidentStatus>('Open')
  const [impact, setImpact] = useState<ImpactLevel>('Medium')
  const [currentField, setCurrentField] = useState<PickerField | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open && incident) {
      setProblem(incident.problem)
      setRootCauses(incident.rootCauses)
      setTopics(incident.topics)
      setFix(incident.fix)
      setDescription(incident.description || '')
      setStatus(incident.status)
      setImpact(incident.impact)
      setCurrentField(null)
      setSearchTerm('')
    } else if (!open) {
      setProblem('')
      setRootCauses([])
      setTopics([])
      setFix('')
      setDescription('')
      setStatus('Open')
      setImpact('Medium')
      setCurrentField(null)
      setSearchTerm('')
    }
  }, [open, incident])

  const handleSave = () => {
    if (!problem || rootCauses.length === 0 || topics.length === 0 || !incident) {
      return
    }

    onSave({
      ...incident,
      problem,
      rootCauses,
      topics,
      fix,
      description: description.trim() || undefined,
      status,
      impact,
    })

    onOpenChange(false)
  }

  const getFilteredOptions = () => {
    switch (currentField) {
      case 'problem':
        return existingProblems.filter(p => filterBySearchTerm(p, searchTerm))
      case 'rootCause':
        return existingRootCauses.filter(rc => filterBySearchTerm(rc, searchTerm))
      case 'topic':
        return existingTopics.filter(t => filterBySearchTerm(t, searchTerm))
      case 'fix':
        return existingFixes.filter(f => filterBySearchTerm(f, searchTerm))
      default:
        return []
    }
  }

  const handleSelect = (value: string) => {
    switch (currentField) {
      case 'problem':
        setProblem(value)
        setCurrentField(null)
        break
      case 'rootCause':
        if (!rootCauses.includes(value)) {
          setRootCauses([...rootCauses, value])
        }
        setCurrentField(null)
        break
      case 'topic':
        if (!topics.includes(value)) {
          setTopics([...topics, value])
        }
        setCurrentField(null)
        break
      case 'fix':
        setFix(value)
        setCurrentField(null)
        break
    }
    setSearchTerm('')
  }

  const handleCreateNew = () => {
    if (!searchTerm.trim()) return
    handleSelect(searchTerm.trim())
  }

  const removeRootCause = (cause: string) => {
    setRootCauses(rootCauses.filter(rc => rc !== cause))
  }

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic))
  }

  const filteredOptions = getFilteredOptions()
  const showCreateNew = searchTerm.trim() && !filteredOptions.some(opt => opt.toLowerCase() === searchTerm.toLowerCase())
  const renderPicker = (field: PickerField) => {
    if (currentField !== field) {
      return null
    }

    return (
      <div className="mt-3 rounded-md border">
        <Command>
          <CommandInput
            placeholder={`Search or create ${pickerLabels[field]}...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
            autoFocus
          />
          <CommandList className="max-h-[min(40vh,18rem)]">
            <CommandEmpty>
              <button
                onClick={handleCreateNew}
                className="w-full rounded p-2 text-left text-sm hover:bg-accent"
              >
                Create new: <span className="font-semibold">{searchTerm}</span>
              </button>
            </CommandEmpty>
            <CommandGroup>
              {showCreateNew && (
                <CommandItem onSelect={handleCreateNew}>
                  <span className="text-accent-foreground">
                    Create new: <span className="font-semibold">{searchTerm}</span>
                  </span>
                </CommandItem>
              )}
              {filteredOptions.map(option => (
                <CommandItem key={option} onSelect={() => handleSelect(option)}>
                  <span className="flex-1">{option}</span>
                  {field === 'rootCause' && rootCauseCounts[option] && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {rootCauseCounts[option]} incidents
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-4 sm:max-h-[calc(100vh-2rem)] sm:w-full sm:p-6">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="text-2xl font-bold tracking-tight">Edit Incident</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Problem
            </label>
            {problem ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  {problem}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setProblem('')
                    setCurrentField('problem')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setCurrentField('problem')}
              >
                Select or create problem...
              </Button>
            )}
            {renderPicker('problem')}
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Root Causes
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {rootCauses.map(cause => (
                <Badge key={cause} variant="default" className="text-sm py-1.5 px-3">
                  {cause}
                  <button
                    onClick={() => removeRootCause(cause)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setCurrentField('rootCause')}
            >
              Add root cause...
            </Button>
            {renderPicker('rootCause')}
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Topics
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {topics.map(topic => (
                <Badge key={topic} variant="secondary" className="text-sm py-1.5 px-3">
                  {topic}
                  <button
                    onClick={() => removeTopic(topic)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setCurrentField('topic')}
            >
              Add topic...
            </Button>
            {renderPicker('topic')}
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Fix
            </label>
            {fix ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm py-1.5 px-3">
                  {fix}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setFix('')
                    setCurrentField('fix')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setCurrentField('fix')}
              >
                Select or create fix...
              </Button>
            )}
            {renderPicker('fix')}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
                Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full min-h-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Update context, symptoms, timeline, or related notes..."
            />
          </div>
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!problem || rootCauses.length === 0 || topics.length === 0}
          >
            Update Incident
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
