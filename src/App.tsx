import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster, toast } from 'sonner'
import { Plus, ChartBar, Warning, ListBullets, Network } from '@phosphor-icons/react'
import { QuickAddDialog } from '@/components/QuickAddDialog'
import { EditIncidentDialog } from '@/components/EditIncidentDialog'
import { Dashboard } from '@/components/Dashboard'
import { IncidentsTable } from '@/components/IncidentsTable'
import { RootCausesView } from '@/components/RootCausesView'
import { RootCauseGraph } from '@/components/RootCauseGraph'
import type { Incident } from '@/lib/types'
import { getUniqueValues, getAllRootCauses, getAllTopics, getRootCauseCounts } from '@/lib/data-utils'
import { ulid } from 'ulid'

function App() {
  const [incidents, setIncidents] = useKV<Incident[]>('rca-incidents', [])
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [incidentToEdit, setIncidentToEdit] = useState<Incident | null>(null)

  const safeIncidents = incidents || []

  const existingProblems = useMemo(() => getUniqueValues(safeIncidents, 'problem'), [safeIncidents])
  const existingRootCauses = useMemo(() => getAllRootCauses(safeIncidents), [safeIncidents])
  const existingTopics = useMemo(() => getAllTopics(safeIncidents), [safeIncidents])
  const existingFixes = useMemo(() => getUniqueValues(safeIncidents, 'fix'), [safeIncidents])

  const rootCauseCounts = useMemo(() => {
    const counts = getRootCauseCounts(safeIncidents)
    const map: Record<string, number> = {}
    counts.forEach(({ name, count }) => {
      map[name] = count
    })
    return map
  }, [safeIncidents])

  const handleSaveIncident = (newIncident: Omit<Incident, 'id' | 'createdAt'>) => {
    setIncidents((current) => [
      ...(current || []),
      {
        ...newIncident,
        id: ulid(),
        createdAt: new Date().toISOString(),
      },
    ])
    toast.success('Incident logged successfully', {
      description: `Problem: ${newIncident.problem}`,
    })
  }

  const handleEditIncident = (incident: Incident) => {
    setIncidentToEdit(incident)
    setEditDialogOpen(true)
  }

  const handleUpdateIncident = (updatedIncident: Incident) => {
    setIncidents((current) =>
      (current || []).map((inc) =>
        inc.id === updatedIncident.id ? updatedIncident : inc
      )
    )
    toast.success('Incident updated successfully', {
      description: `Problem: ${updatedIncident.problem}`,
    })
  }

  const handleDeleteIncident = (incident: Incident) => {
    setIncidents((current) =>
      (current || []).filter((inc) => inc.id !== incident.id)
    )
    toast.success('Incident deleted', {
      description: `Problem: ${incident.problem}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Root Cause Analysis</h1>
              <p className="text-sm text-muted-foreground mt-1">
                IT Operations Incident Tracker
              </p>
            </div>
            <Button onClick={() => setQuickAddOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" weight="bold" />
              Add Incident
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <ChartBar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="problems" className="gap-2">
              <ListBullets className="h-4 w-4" />
              Problems
            </TabsTrigger>
            <TabsTrigger value="root-causes" className="gap-2">
              <Warning className="h-4 w-4" />
              Root Causes
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-2">
              <Network className="h-4 w-4" />
              Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard incidents={safeIncidents} />
          </TabsContent>

          <TabsContent value="problems">
            <IncidentsTable 
              incidents={safeIncidents} 
              onEditIncident={handleEditIncident}
              onDeleteIncident={handleDeleteIncident}
            />
          </TabsContent>

          <TabsContent value="root-causes">
            <RootCausesView incidents={safeIncidents} />
          </TabsContent>

          <TabsContent value="graph">
            <RootCauseGraph incidents={safeIncidents} />
          </TabsContent>
        </Tabs>
      </main>

      <QuickAddDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSave={handleSaveIncident}
        existingProblems={existingProblems}
        existingRootCauses={existingRootCauses}
        existingTopics={existingTopics}
        existingFixes={existingFixes}
        rootCauseCounts={rootCauseCounts}
      />

      <EditIncidentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateIncident}
        incident={incidentToEdit}
        existingProblems={existingProblems}
        existingRootCauses={existingRootCauses}
        existingTopics={existingTopics}
        existingFixes={existingFixes}
        rootCauseCounts={rootCauseCounts}
      />
    </div>
  )
}

export default App