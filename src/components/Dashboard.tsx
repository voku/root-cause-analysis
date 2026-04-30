import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Incident } from '@/lib/types'
import { getRootCauseCounts, getTopicCounts, getThisWeekIncidentCount, getLastWeekIncidentCount } from '@/lib/data-utils'
import { TrendUp, TrendDown, Warning, Clock } from '@phosphor-icons/react'
import { TrendIndicator } from '@/components/TrendIndicator'

interface DashboardProps {
  incidents: Incident[]
}

export function Dashboard({ incidents }: DashboardProps) {
  const rootCauseCounts = getRootCauseCounts(incidents, true).slice(0, 5)
  const topicCounts = getTopicCounts(incidents)
  const thisWeekCount = getThisWeekIncidentCount(incidents)
  const lastWeekCount = getLastWeekIncidentCount(incidents)
  const weekChange = lastWeekCount > 0 ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 : 0
  const isIncreasing = weekChange > 0

  const topicColors = [
    'bg-blue-500',
    'bg-cyan-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-pink-500',
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Warning className="h-4 w-4" />
            Top Root Causes
          </h3>
          <div className="space-y-3">
            {rootCauseCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No root causes yet</p>
            ) : (
              rootCauseCounts.map((cause, index) => (
                <div key={cause.name} className="group flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4">
                      {index + 1}
                    </span>
                    <span className="min-w-0 break-words text-sm font-medium transition-colors group-hover:text-primary">
                      {cause.name}
                    </span>
                    {cause.trend && (
                      <TrendIndicator trend={cause.trend} size="sm" />
                    )}
                  </div>
                  <span className="text-xl font-bold font-mono tabular-nums sm:text-2xl">
                    {cause.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 p-4 sm:p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Problems This Week
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="text-5xl font-bold font-mono tabular-nums sm:text-6xl">
              {thisWeekCount}
            </div>
            {lastWeekCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:pb-2">
                {isIncreasing ? (
                  <TrendUp className="h-5 w-5 text-critical" weight="bold" />
                ) : (
                  <TrendDown className="h-5 w-5 text-success" weight="bold" />
                )}
                <span className={`text-sm font-semibold ${isIncreasing ? 'text-critical' : 'text-success'}`}>
                  {Math.abs(weekChange).toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Problems by Topic
        </h3>
        {topicCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topics yet</p>
        ) : (
          <div className="space-y-4">
            {topicCounts.map((topic, index) => {
              const percentage = (topic.count / incidents.length) * 100
              return (
                <div key={topic.name}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className={`w-3 h-3 rounded ${topicColors[index % topicColors.length]}`} />
                      <span className="min-w-0 break-words text-sm font-medium">{topic.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                      <Badge variant="secondary" className="font-mono">
                        {topic.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${topicColors[index % topicColors.length]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
