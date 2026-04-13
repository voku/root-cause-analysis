import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Incident } from '@/lib/types'
import { getRootCauseCounts } from '@/lib/data-utils'
import { Warning, ChartBar } from '@phosphor-icons/react'

interface RootCausesViewProps {
  incidents: Incident[]
}

export function RootCausesView({ incidents }: RootCausesViewProps) {
  const rootCauseCounts = getRootCauseCounts(incidents)
  const maxCount = rootCauseCounts[0]?.count || 1

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                        #{index + 1}
                      </span>
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {cause.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-critical/10 to-critical/5 border-critical/20">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Top Cause
          </div>
          <div className="text-2xl font-bold font-mono">
            {rootCauseCounts[0]?.name || 'N/A'}
          </div>
          {rootCauseCounts[0] && (
            <div className="text-sm text-muted-foreground mt-1">
              {rootCauseCounts[0].count} incidents
            </div>
          )}
        </Card>

        <Card className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
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

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
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
