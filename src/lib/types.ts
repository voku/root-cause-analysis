export type ImpactLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type IncidentStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'

export interface Incident {
  id: string
  problem: string
  rootCauses: string[]
  topics: string[]
  fix: string
  status: IncidentStatus
  impact: ImpactLevel
  createdAt: string
  description?: string
}

export interface RootCauseCount {
  name: string
  count: number
  trend?: TrendData
}

export interface TopicCount {
  name: string
  count: number
  trend?: TrendData
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  previousCount: number
  currentCount: number
}

export interface AutocompleteOption {
  value: string
  count?: number
}
