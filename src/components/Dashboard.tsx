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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Warning className="h-4 w-4" />
            Top Root Causes
          </h3>
          <div className="space-y-3">
            {rootCauseCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No root causes yet</p>
            ) : (
              rootCauseCounts.map((cause, index) => (
                <div key={cause.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-mono text-muted-foreground w-4">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {cause.name}
                    </span>
                    {cause.trend && (
                      <TrendIndicator trend={cause.trend} size="sm" />
                    )}
                  </div>
                  <span className="text-2xl font-bold font-mono tabular-nums">
                    {cause.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Problems This Week
          </h3>
          <div className="flex items-end gap-4">
            <div className="text-6xl font-bold font-mono tabular-nums">
              {thisWeekCount}
            </div>
            {lastWeekCount > 0 && (
              <div className="flex items-center gap-2 pb-2">
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

      <Card className="p-6">
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${topicColors[index % topicColors.length]}`} />
                      <span className="text-sm font-medium">{topic.name}</span>
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
