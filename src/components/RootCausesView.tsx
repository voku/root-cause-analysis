import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Incident } from '@/lib/types'
import { getRootCauseCounts } from '@/lib/data-utils'
import { Warning, ChartBar } from '@phosphor-icons/react'
import { TrendIndicator } from '@/components/TrendIndicator'

interface RootCausesViewProps {
  incidents: Incident[]
}

export function RootCausesView({ incidents }: RootCausesViewProps) {
  const rootCauseCounts = getRootCauseCounts(incidents, true)
  const maxCount = rootCauseCounts[0]?.count || 1

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Warning className="h-5 w-5 text-primary" weight="bold" />
            Root Cause Analysis
          </h3>
          <Badge variant="secondary" className="font-mono">
            {rootCauseCounts.length} unique causes
          </Badge>
        </div>

        {rootCauseCounts.length === 0 ? (
          <div className="text-center py-12">
            <ChartBar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No root causes documented yet. Add your first incident to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootCauseCounts.map((cause, index) => {
              const percentage = (cause.count / maxCount) * 100
              const barColor = index < 3 ? 'bg-critical' : index < 6 ? 'bg-warning' : 'bg-primary'

              return (
                <div key={cause.name} className="group">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                        #{index + 1}
                      </span>
                      <span className="min-w-0 break-words font-medium transition-colors group-hover:text-primary">
                        {cause.name}
                      </span>
                      {cause.trend && (
                        <TrendIndicator trend={cause.trend} size="sm" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span className="text-xs text-muted-foreground">
                        {((cause.count / incidents.length) * 100).toFixed(1)}% of all incidents
                      </span>
                      <Badge variant="default" className="font-mono font-bold min-w-[3rem] justify-center">
                        {cause.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-critical/20 bg-gradient-to-br from-critical/10 to-critical/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Top Cause
          </div>
          <div className="break-words text-2xl font-bold font-mono">
            {rootCauseCounts[0]?.name || 'N/A'}
          </div>
          {rootCauseCounts[0] && (
            <div className="text-sm text-muted-foreground mt-1">
              {rootCauseCounts[0].count} incidents
            </div>
          )}
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Causes {'>'} 5 Incidents
          </div>
          <div className="text-2xl font-bold font-mono">
            {rootCauseCounts.filter(rc => rc.count > 5).length}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            High frequency issues
          </div>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Avg Per Cause
          </div>
          <div className="text-2xl font-bold font-mono">
            {rootCauseCounts.length > 0
              ? (incidents.length / rootCauseCounts.length).toFixed(1)
              : '0'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Incidents per root cause
          </div>
        </Card>
      </div>
    </div>
  )
}
