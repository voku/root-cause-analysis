// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { Incident } from '@/lib/types'
import { Network, MagnifyingGlassMinus, MagnifyingGlassPlus, ArrowsOutSimple, ChartLine } from '@phosphor-icons/react'

interface RootCauseGraphProps {
  incidents: Incident[]
}

interface GraphNode {
  id: string
  type: 'topic' | 'rootCause' | 'problem'
  label: string
  count: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  index?: number
  vx?: number
  vy?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  value: number
  index?: number
}

export function RootCauseGraph({ incidents }: RootCauseGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const timelineRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [showTimeline, setShowTimeline] = useState(true)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  useEffect(() => {
    if (!svgRef.current || incidents.length === 0) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const nodeMap = new Map<string, GraphNode>()

    const topicCounts = new Map<string, number>()
    const rootCauseCounts = new Map<string, number>()
    const problemCounts = new Map<string, number>()

    incidents.forEach(incident => {
      incident.topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
      incident.rootCauses.forEach(cause => {
        rootCauseCounts.set(cause, (rootCauseCounts.get(cause) || 0) + 1)
      })
      problemCounts.set(incident.problem, (problemCounts.get(incident.problem) || 0) + 1)
    })

    topicCounts.forEach((count, topic) => {
      const node: GraphNode = {
        id: `topic-${topic}`,
        type: 'topic',
        label: topic,
        count,
      }
      nodes.push(node)
      nodeMap.set(node.id, node)
    })

    rootCauseCounts.forEach((count, cause) => {
      const node: GraphNode = {
        id: `cause-${cause}`,
        type: 'rootCause',
        label: cause,
        count,
      }
      nodes.push(node)
      nodeMap.set(node.id, node)
    })

    const topProblems = Array.from(problemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    topProblems.forEach(([problem, count]) => {
      const node: GraphNode = {
        id: `problem-${problem}`,
        type: 'problem',
        label: problem,
        count,
      }
      nodes.push(node)
      nodeMap.set(node.id, node)
    })

    const linkCounts = new Map<string, number>()

    incidents.forEach(incident => {
      const problemNode = `problem-${incident.problem}`
      if (!nodeMap.has(problemNode)) return

      incident.rootCauses.forEach(cause => {
        const causeNode = `cause-${cause}`
        const linkKey = `${problemNode}-${causeNode}`
        linkCounts.set(linkKey, (linkCounts.get(linkKey) || 0) + 1)

        incident.topics.forEach(topic => {
          const topicNode = `topic-${topic}`
          const linkKey2 = `${causeNode}-${topicNode}`
          linkCounts.set(linkKey2, (linkCounts.get(linkKey2) || 0) + 1)
        })
      })
    })

    linkCounts.forEach((count, key) => {
      const [sourceId, targetId] = key.split('-').reduce((acc, part, idx, arr) => {
        if (idx === 0) return [part]
        if (idx === 1) {
          if (part === 'problem' || part === 'cause' || part === 'topic') {
            return [[acc[0], arr[idx - 1]].join('-')]
          }
          return [[acc[0], part].join('-')]
        }
        if (acc.length === 1) {
          if (part === 'problem' || part === 'cause' || part === 'topic') {
            return [acc[0], part]
          }
          return [acc[0], [arr.slice(1, idx).join('-'), part].join('-')]
        }
        return [acc[0], [acc[1], part].join('-')]
      }, [] as string[]) as [string, string]

      if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
        links.push({
          source: sourceId,
          target: targetId,
          value: count,
        })
      }
    })

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform)
        setZoom(event.transform.k)
      })

    svg.call(zoomBehavior)

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => 120 - (d.value * 5))
        .strength(d => Math.min(d.value / 10, 0.5))
      )
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength(d => d.type === 'topic' ? -400 : d.type === 'rootCause' ? -300 : -200)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => {
        if (d.type === 'topic') return 40
        if (d.type === 'rootCause') return 35
        return 25
      }))

    simulationRef.current = simulation

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'oklch(0.88 0.01 250)')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value) * 1.5)

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(d)
      })

    node.append('circle')
      .attr('r', d => {
        if (d.type === 'topic') return 10 + Math.sqrt(d.count) * 3
        if (d.type === 'rootCause') return 8 + Math.sqrt(d.count) * 2.5
        return 6 + Math.sqrt(d.count) * 2
      })
      .attr('fill', d => {
        if (d.type === 'topic') return 'oklch(0.75 0.15 195)'
        if (d.type === 'rootCause') return 'oklch(0.60 0.20 25)'
        return 'oklch(0.45 0.15 250)'
      })
      .attr('stroke', d => {
        if (d.type === 'topic') return 'oklch(0.65 0.15 195)'
        if (d.type === 'rootCause') return 'oklch(0.50 0.20 25)'
        return 'oklch(0.35 0.15 250)'
      })
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .style('transition', 'all 0.2s')

    node.append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label)
      .attr('x', 0)
      .attr('y', d => {
        const radius = d.type === 'topic' 
          ? 10 + Math.sqrt(d.count) * 3
          : d.type === 'rootCause' 
          ? 8 + Math.sqrt(d.count) * 2.5 
          : 6 + Math.sqrt(d.count) * 2
        return radius + 14
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', 'oklch(0.35 0.02 250)')
      .attr('pointer-events', 'none')

    node.append('text')
      .text(d => d.count)
      .attr('x', 0)
      .attr('y', 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.type === 'topic' ? '12px' : '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0)

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
    })

    svg.on('click', () => {
      setSelectedNode(null)
    })

    return () => {
      simulation.stop()
    }
  }, [incidents])

  useEffect(() => {
    if (!timelineRef.current || incidents.length === 0 || !showTimeline) return

    const width = timelineRef.current.clientWidth
    const height = timelineRef.current.clientHeight
    const margin = { top: 10, right: 40, bottom: 30, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const sortedIncidents = [...incidents].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    const timeExtent = d3.extent(sortedIncidents, d => new Date(d.createdAt)) as [Date, Date]
    
    const timeBuckets = d3.timeDay.range(timeExtent[0], d3.timeDay.offset(timeExtent[1], 1))
    const bucketCounts = new Map<string, number>()
    
    timeBuckets.forEach(bucket => {
      const key = bucket.toISOString().split('T')[0]
      bucketCounts.set(key, 0)
    })
    
    sortedIncidents.forEach(incident => {
      const date = new Date(incident.createdAt)
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0]
      bucketCounts.set(key, (bucketCounts.get(key) || 0) + 1)
    })

    const timelineData = Array.from(bucketCounts.entries()).map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count,
    }))

    const svg = d3.select(timelineRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleTime()
      .domain(timeExtent)
      .range([0, innerWidth])

    const maxCount = d3.max(timelineData, d => d.count) || 1
    const yScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([innerHeight, 0])

    const area = d3.area<{ date: Date; count: number }>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.count))
      .curve(d3.curveMonotoneX)

    const line = d3.line<{ date: Date; count: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(timelineData)
      .attr('fill', 'oklch(0.75 0.15 195 / 0.15)')
      .attr('d', area)

    g.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', 'oklch(0.75 0.15 195)')
      .attr('stroke-width', 2)
      .attr('d', line)

    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(timelineData.length, 6))
      .tickFormat(d => d3.timeFormat('%b %d')(d as Date))

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', 'oklch(0.88 0.01 250)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'oklch(0.88 0.01 250)'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'oklch(0.50 0.02 250)')
        .attr('font-size', '11px')
        .attr('font-family', 'var(--font-inter)')
      )

    const yAxis = d3.axisLeft(yScale)
      .ticks(3)
      .tickFormat(d => d.toString())

    g.append('g')
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', 'oklch(0.88 0.01 250)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'oklch(0.88 0.01 250)'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'oklch(0.50 0.02 250)')
        .attr('font-size', '11px')
        .attr('font-family', 'var(--font-mono)')
      )

    g.selectAll('circle')
      .data(timelineData.filter(d => d.count > 0))
      .join('circle')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', 3)
      .attr('fill', 'oklch(0.60 0.20 25)')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `${d3.timeFormat('%b %d, %Y')(d.date)}: ${d.count} incident${d.count !== 1 ? 's' : ''}`)

  }, [incidents, showTimeline])

  const handleZoomIn = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1.3
    )
  }

  const handleZoomOut = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      0.7
    )
  }

  const handleReset = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    )
    setZoom(1)
    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart()
    }
  }

  if (incidents.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No data to visualize yet. Add incidents to see connection patterns.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-2">
              <Network className="h-5 w-5 text-primary" weight="bold" />
              System Dependency Graph
            </h3>
            <p className="text-sm text-muted-foreground">
              Interactive visualization showing how root causes connect across topics and problems
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch 
                id="timeline-toggle" 
                checked={showTimeline} 
                onCheckedChange={setShowTimeline}
              />
              <Label htmlFor="timeline-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <ChartLine className="h-4 w-4" />
                Timeline
              </Label>
            </div>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <Button variant="outline" size="sm" onClick={handleZoomOut} aria-label="Zoom out graph">
              <MagnifyingGlassMinus className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="font-mono px-3">
              {(zoom * 100).toFixed(0)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={handleZoomIn} aria-label="Zoom in graph">
              <MagnifyingGlassPlus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} aria-label="Reset graph zoom">
              <ArrowsOutSimple className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-lg border bg-muted/30 sm:h-[520px] lg:h-[600px]">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ cursor: 'grab' }}
          />
          
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card/95 px-4 py-2 shadow-sm backdrop-blur-sm sm:right-auto">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'oklch(0.75 0.15 195)' }} />
              <span className="text-xs font-medium">Topics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'oklch(0.60 0.20 25)' }} />
              <span className="text-xs font-medium">Root Causes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'oklch(0.45 0.15 250)' }} />
              <span className="text-xs font-medium">Problems</span>
            </div>
          </div>

          {selectedNode && (
            <div className="absolute top-4 right-4 left-4 sm:left-auto sm:max-w-xs rounded-lg border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant={
                  selectedNode.type === 'topic' ? 'default' : 
                  selectedNode.type === 'rootCause' ? 'destructive' : 
                  'secondary'
                }>
                  {selectedNode.type === 'topic' ? 'Topic' : 
                   selectedNode.type === 'rootCause' ? 'Root Cause' : 
                   'Problem'}
                </Badge>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
               <div className="mb-2 break-words text-sm font-semibold">{selectedNode.label}</div>
              <div className="text-xs text-muted-foreground">
                {selectedNode.count} {selectedNode.count === 1 ? 'incident' : 'incidents'}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <strong>Tip:</strong> Drag nodes to rearrange, click to view details, scroll to zoom
        </div>
      </Card>

      {showTimeline && (
        <Card className="p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-1">
              <ChartLine className="h-4 w-4 text-accent" weight="bold" />
              Incident Frequency Timeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Daily incident volume over time
            </p>
          </div>
          <div className="relative h-[180px] overflow-hidden rounded-lg border bg-muted/30 sm:h-[220px]">
            <svg
              ref={timelineRef}
              width="100%"
              height="100%"
            />
          </div>
        </Card>
      )}
    </div>
  )
}
