import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react'
import type { TrendData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  trend: TrendData
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export function TrendIndicator({ 
  trend, 
  size = 'sm', 
  showPercentage = true,
  className 
}: TrendIndicatorProps) {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  const iconSize = iconSizes[size]
  const textSize = textSizes[size]
  
  if (trend.direction === 'stable') {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Minus className={iconSize} weight="bold" />
        {showPercentage && <span className={`font-semibold ${textSize}`}>0%</span>}
      </div>
    )
  }
  
  const isUp = trend.direction === 'up'
  const Icon = isUp ? TrendUp : TrendDown
  const colorClass = isUp ? 'text-critical' : 'text-success'
  
  return (
    <div className={cn(`flex items-center gap-1 ${colorClass}`, className)}>
      <Icon className={iconSize} weight="bold" />
      {showPercentage && (
        <span className={`font-semibold ${textSize}`}>
          {trend.percentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
