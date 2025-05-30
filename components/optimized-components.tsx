'use client'

import React, { memo, useMemo, useCallback } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { FormattingUtils } from '@/lib/formatting-utils'
import type { PoolInfo, MinerInfo } from '@/lib/p2pool-api'
import type { MinerPayout, MinerWindowShares } from '@/types/p2pool'
import { Activity, Users, DollarSign, TrendingUp, Zap, Trophy } from 'lucide-react'

// Memoized StatCard components to prevent unnecessary re-renders
export const MemoizedPoolStatsGrid = memo(({ 
  poolInfo, 
  isRefreshing 
}: { 
  poolInfo: PoolInfo
  isRefreshing: boolean 
}) => {
  const poolHashrate = useMemo(() => 
    FormattingUtils.formatHashrate(poolInfo.sidechain.difficulty), 
    [poolInfo.sidechain.difficulty]
  )
  
  const poolDifficulty = useMemo(() => 
    FormattingUtils.formatDifficulty(poolInfo.sidechain.difficulty),
    [poolInfo.sidechain.difficulty]
  )

  const effortDisplay = useMemo(() => {
    if (poolInfo?.sidechain?.effort?.current == null) {
      return { value: "N/A", subtitle: "Avg: N/A", gradient: "bg-gradient-to-r from-gray-600 to-gray-600 dark:from-gray-400 dark:to-gray-400" }
    }
    
    const current = poolInfo.sidechain.effort.current
    const average = poolInfo.sidechain.effort.average
    
    let gradient = "bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400"
    if (current <= 50) {
      gradient = "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
    } else if (current <= 100) {
      gradient = "bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400"
    } else if (current <= 150) {
      gradient = "bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400"
    }
    
    return {
      value: `${current.toFixed(1)}%`,
      subtitle: average != null ? `Avg: ${average.toFixed(1)}%` : "Avg: N/A",
      gradient
    }
  }, [poolInfo?.sidechain?.effort])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Pool Hashrate"
        value={poolHashrate}
        subtitle={`Difficulty: ${poolDifficulty}`}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-indigo-900/50"
        iconGradient="bg-gradient-to-br from-cyan-400 to-blue-500"
        decorativeColor="bg-gradient-to-br from-cyan-200/30 to-blue-300/20 dark:from-cyan-800/30 dark:to-blue-700/20"
        valueGradient="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400"
        refreshing={isRefreshing}
      />

      <StatCard
        title="Pool Miners"
        value={poolInfo.sidechain.window.miners.toLocaleString()}
        subtitle={`Total: ${poolInfo.sidechain.miners.toLocaleString()}`}
        icon={Users}
        gradient="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-900/50"
        iconGradient="bg-gradient-to-br from-emerald-400 to-green-500"
        decorativeColor="bg-gradient-to-br from-green-200/30 to-teal-300/20 dark:from-green-800/30 dark:to-teal-700/20"
        valueGradient="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400"
        refreshing={isRefreshing}
      />

      <StatCard
        title="Pool Blocks Found"
        value={poolInfo.sidechain.found.toLocaleString()}
        subtitle="Since inception"
        icon={Trophy}
        gradient="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-900/50"
        iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
        decorativeColor="bg-gradient-to-br from-yellow-200/30 to-orange-300/20 dark:from-yellow-800/30 dark:to-orange-700/20"
        valueGradient="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400"
        refreshing={isRefreshing}
      />

      <StatCard
        title="Pool Effort"
        value={effortDisplay.value}
        subtitle={effortDisplay.subtitle}
        icon={Zap}
        gradient="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-indigo-900/50"
        iconGradient="bg-gradient-to-br from-violet-400 to-purple-500"
        decorativeColor="bg-gradient-to-br from-purple-200/30 to-indigo-300/20 dark:from-purple-800/30 dark:to-indigo-700/20"
        valueGradient={effortDisplay.gradient}
        refreshing={isRefreshing}
      />
    </div>
  )
})

export const MemoizedMinerStatsGrid = memo(({ 
  minerInfo,
  minerWindowShares,
  minerPayouts,
  xmrPrice,
  poolInfo,
  isRefreshing 
}: { 
  minerInfo: MinerInfo
  minerWindowShares: MinerWindowShares
  minerPayouts: MinerPayout[]
  xmrPrice: number | null
  poolInfo: PoolInfo
  isRefreshing: boolean 
}) => {
  const uncleBlocks = useMemo(() => 
    minerInfo.shares.reduce((sum, s) => sum + s.uncles, 0),
    [minerInfo.shares]
  )

  const recentPayouts = useMemo(() => 
    FormattingUtils.filterRecentPayouts(minerPayouts),
    [minerPayouts]
  )

  const poolShare = useMemo(() => 
    FormattingUtils.calculatePoolShare(minerWindowShares, minerInfo, poolInfo),
    [minerWindowShares, minerInfo, poolInfo]
  )

  const payoutStats = useMemo(() => {
    if (recentPayouts.length === 0) return null
    
    const latest = recentPayouts[0]
    return {
      xmr: FormattingUtils.formatXMR(latest?.coinbase_reward || 0),
      usd: xmrPrice ? FormattingUtils.formatUSDOnly(latest?.coinbase_reward || 0, xmrPrice) : null
    }
  }, [recentPayouts, xmrPrice])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Current Shares"
        value={minerWindowShares.shares}
        subtitle="Active in PPLNS window"
        icon={Activity}
        gradient="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-emerald-900/50"
        iconGradient="bg-gradient-to-br from-green-400 to-emerald-500"
        decorativeColor="bg-gradient-to-br from-green-200/30 to-emerald-300/20 dark:from-green-800/30 dark:to-emerald-700/20"
        valueGradient="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
        refreshing={isRefreshing}
      />

      <StatCard
        title="Uncle Blocks"
        value={uncleBlocks}
        subtitle="Orphaned shares"
        icon={Users}
        gradient="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-900/50"
        iconGradient="bg-gradient-to-br from-blue-400 to-cyan-500"
        decorativeColor="bg-gradient-to-br from-blue-200/30 to-cyan-300/20 dark:from-blue-800/30 dark:to-cyan-700/20"
        valueGradient="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400"
        refreshing={isRefreshing}
      />

      <StatCard
        title="Recent Payouts (24h)"
        value={recentPayouts.length}
        icon={DollarSign}
        gradient="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-900/50"
        iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
        decorativeColor="bg-gradient-to-br from-yellow-200/30 to-orange-300/20 dark:from-yellow-800/30 dark:to-orange-700/20"
        valueGradient="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400"
        refreshing={isRefreshing}
      >
        {payoutStats && (
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between bg-gradient-to-r from-green-100/50 to-emerald-100/30 dark:from-green-900/20 dark:to-emerald-900/10 rounded-lg px-2 py-1 backdrop-blur-sm">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                Latest: {payoutStats.xmr}
              </p>
            </div>
            {payoutStats.usd && (
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-100/50 to-cyan-100/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {payoutStats.usd}
                </p>
              </div>
            )}
          </div>
        )}
      </StatCard>

      <StatCard
        title="Est. Pool Share"
        value={`${poolShare.toFixed(3)}%`}
        subtitle="Of total hashrate"
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-100 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-indigo-900/50"
        iconGradient="bg-gradient-to-br from-purple-400 to-indigo-500"
        decorativeColor="bg-gradient-to-br from-purple-200/30 to-indigo-300/20 dark:from-purple-800/30 dark:to-indigo-700/20"
        valueGradient="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400"
        refreshing={isRefreshing}
      />
    </div>
  )
})

// Virtual scrolling list component for large datasets
export const VirtualizedActivityList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 80,
  containerHeight = 256 
}: {
  items: unknown[]
  renderItem: (item: unknown, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
}) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2
  const [scrollTop, setScrollTop] = React.useState(0)
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1)
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount)
  
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return (
    <div 
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => 
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  )
})

VirtualizedActivityList.displayName = 'VirtualizedActivityList'
MemoizedPoolStatsGrid.displayName = 'MemoizedPoolStatsGrid'
MemoizedMinerStatsGrid.displayName = 'MemoizedMinerStatsGrid' 