import { Incident, RootCauseCount, TopicCount } from './types'

export function getRootCauseCounts(incidents: Incident[]): RootCauseCount[] {
  const counts = new Map<string, number>()
  
  incidents.forEach(incident => {
    incident.rootCauses.forEach(cause => {
      counts.set(cause, (counts.get(cause) || 0) + 1)
    })
  })
  
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function getTopicCounts(incidents: Incident[]): TopicCount[] {
  const counts = new Map<string, number>()
  
  incidents.forEach(incident => {
    incident.topics.forEach(topic => {
      counts.set(topic, (counts.get(topic) || 0) + 1)
    })
  })
  
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
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
