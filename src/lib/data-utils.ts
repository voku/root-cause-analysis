import { Incident, RootCauseCount, TopicCount, TrendData } from './types'

function calculateTrend(currentCount: number, previousCount: number): TrendData {
  if (previousCount === 0) {
    return {
      direction: currentCount > 0 ? 'up' : 'stable',
      percentage: currentCount > 0 ? 100 : 0,
      previousCount,
      currentCount
    }
  }
  
  const change = currentCount - previousCount
  const percentage = Math.abs((change / previousCount) * 100)
  
  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (change > 0) direction = 'up'
  else if (change < 0) direction = 'down'
  
  return { direction, percentage, previousCount, currentCount }
}

function getIncidentsInPeriod(incidents: Incident[], daysAgo: number, periodLength: number): Incident[] {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - daysAgo)
  
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - periodLength)
  
  return incidents.filter(incident => {
    const incidentDate = new Date(incident.createdAt)
    return incidentDate >= startDate && incidentDate < endDate
  })
}

export function getRootCauseCounts(incidents: Incident[], includeTrends = false): RootCauseCount[] {
  const counts = new Map<string, number>()
  
  incidents.forEach(incident => {
    incident.rootCauses.forEach(cause => {
      counts.set(cause, (counts.get(cause) || 0) + 1)
    })
  })
  
  const result = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  
  if (!includeTrends) return result
  
  const currentPeriodIncidents = getIncidentsInPeriod(incidents, 0, 7)
  const previousPeriodIncidents = getIncidentsInPeriod(incidents, 7, 7)
  
  const currentCounts = new Map<string, number>()
  const previousCounts = new Map<string, number>()
  
  currentPeriodIncidents.forEach(incident => {
    incident.rootCauses.forEach(cause => {
      currentCounts.set(cause, (currentCounts.get(cause) || 0) + 1)
    })
  })
  
  previousPeriodIncidents.forEach(incident => {
    incident.rootCauses.forEach(cause => {
      previousCounts.set(cause, (previousCounts.get(cause) || 0) + 1)
    })
  })
  
  return result.map(item => ({
    ...item,
    trend: calculateTrend(
      currentCounts.get(item.name) || 0,
      previousCounts.get(item.name) || 0
    )
  }))
}

export function getTopicCounts(incidents: Incident[], includeTrends = false): TopicCount[] {
  const counts = new Map<string, number>()
  
  incidents.forEach(incident => {
    incident.topics.forEach(topic => {
      counts.set(topic, (counts.get(topic) || 0) + 1)
    })
  })
  
  const result = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  
  if (!includeTrends) return result
  
  const currentPeriodIncidents = getIncidentsInPeriod(incidents, 0, 7)
  const previousPeriodIncidents = getIncidentsInPeriod(incidents, 7, 7)
  
  const currentCounts = new Map<string, number>()
  const previousCounts = new Map<string, number>()
  
  currentPeriodIncidents.forEach(incident => {
    incident.topics.forEach(topic => {
      currentCounts.set(topic, (currentCounts.get(topic) || 0) + 1)
    })
  })
  
  previousPeriodIncidents.forEach(incident => {
    incident.topics.forEach(topic => {
      previousCounts.set(topic, (previousCounts.get(topic) || 0) + 1)
    })
  })
  
  return result.map(item => ({
    ...item,
    trend: calculateTrend(
      currentCounts.get(item.name) || 0,
      previousCounts.get(item.name) || 0
    )
  }))
}

export function getUniqueValues(incidents: Incident[], field: keyof Pick<Incident, 'problem' | 'fix'>): string[] {
  const values = new Set<string>()
  incidents.forEach(incident => {
    const value = incident[field]
    if (value && typeof value === 'string') {
      values.add(value)
    }
  })
  return Array.from(values).sort()
}

export function getAllRootCauses(incidents: Incident[]): string[] {
  const causes = new Set<string>()
  incidents.forEach(incident => {
    incident.rootCauses.forEach(cause => causes.add(cause))
  })
  return Array.from(causes).sort()
}

export function getAllTopics(incidents: Incident[]): string[] {
  const topics = new Set<string>()
  incidents.forEach(incident => {
    incident.topics.forEach(topic => topics.add(topic))
  })
  return Array.from(topics).sort()
}

export function filterBySearchTerm(value: string, searchTerm: string): boolean {
  return value.toLowerCase().includes(searchTerm.toLowerCase())
}

export function getThisWeekIncidentCount(incidents: Incident[]): number {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return incidents.filter(incident => {
    const incidentDate = new Date(incident.createdAt)
    return incidentDate >= oneWeekAgo
  }).length
}

export function getLastWeekIncidentCount(incidents: Incident[]): number {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return incidents.filter(incident => {
    const incidentDate = new Date(incident.createdAt)
    return incidentDate >= twoWeeksAgo && incidentDate < oneWeekAgo
  }).length
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.toLocaleString('en', { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}`
}
