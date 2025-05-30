"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  Users, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  Info,
  Trophy
} from "lucide-react"
import { P2PoolSettings } from "@/components/p2pool-settings"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { StatCard } from "@/components/ui/stat-card"
import { MinerActivityIndicator } from "@/components/miner-activity-status"
import { getEffortInfo, EffortGuide } from "@/components/effort-indicator"
import { ShareListItem, BlockListItem, PayoutListItem } from "@/components/activity-list-item"
import { FormattingUtils } from "@/lib/formatting-utils"
import { useAppContext } from "@/lib/app-context"
import { useOptimizedP2PoolData } from "@/hooks/useOptimizedP2PoolData"
import { useDebouncedCallback } from "@/hooks/useDebounce"
import { 
  DashboardLoadingSkeleton,
  ActivityListItemSkeleton,
  DashboardGridSkeleton,
  MinerActivityIndicatorSkeleton
} from "@/components/ui/skeletons"
import { toast } from "sonner"

// localStorage keys for persistence
const STORAGE_KEYS = {
  MINER_ADDRESS: 'p2pool-miner-address',
  API_URL: 'p2pool-api-url'
}

export function P2PoolDashboard() {
  // Get shared state from context
  const {
    xmrPrice,
    setIsConnected,
    setLastUpdate,
    setRefreshing,
    setLoading,
    refreshTrigger
  } = useAppContext()

  // Settings state
  const [minerAddress, setMinerAddress] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.MINER_ADDRESS) || ""
    }
    return ""
  })
  const [searchedMinerAddress, setSearchedMinerAddress] = useState("")
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.API_URL) || "https://mini.p2pool.observer"
    }
    return "https://mini.p2pool.observer"
  })
  
  // UI state  
  const [displayedPayoutsCount, setDisplayedPayoutsCount] = useState(10)
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(0)
  const [hasScrolledForCurrentAddress, setHasScrolledForCurrentAddress] = useState(false)
  const [loadingMoreBlocks, setLoadingMoreBlocks] = useState(false)
  const [hasMoreBlocks, setHasMoreBlocks] = useState(true)

  // Use optimized data hook - this replaces all the manual state management
  const {
    poolInfo,
    minerInfo,
    recentMinerShares,
    minerBlocks,
    minerPayouts,
    minerWindowShares,
    isLoading,
    isRefreshing,
    error,
    isConnected,
    lastUpdate,
    refetch,
    loadMoreBlocks,
  } = useOptimizedP2PoolData({
    apiUrl,
    minerAddress: searchedMinerAddress || undefined,
    autoRefresh: true,
  })

  // Sync loading states with context
  useEffect(() => {
    setLoading(isLoading)
    setRefreshing(isRefreshing)
    setIsConnected(isConnected)
    if (lastUpdate) {
      setLastUpdate(lastUpdate)
    }
  }, [isLoading, isRefreshing, isConnected, lastUpdate, setLoading, setRefreshing, setIsConnected, setLastUpdate])

  // Utility functions
  const saveMinerAddress = (address: string) => {
    if (typeof window !== 'undefined') {
      if (address.trim()) {
        localStorage.setItem(STORAGE_KEYS.MINER_ADDRESS, address)
      } else {
        localStorage.removeItem(STORAGE_KEYS.MINER_ADDRESS)
      }
    }
  }

  const saveApiUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.API_URL, url)
    }
  }

  // Event handlers using optimized hook with debouncing
  const debouncedMinerSearch = useDebouncedCallback(async (address: string) => {
    setSearchedMinerAddress(address)
    saveMinerAddress(address)
    
    if (address.trim()) {
      setDisplayedPayoutsCount(10)
      setHasMoreBlocks(true)
      setHasScrolledForCurrentAddress(false)
      // Data will be automatically fetched by the hook when searchedMinerAddress changes
    } else {
      // Clear miner address to stop fetching miner-specific data
      setSearchedMinerAddress("")
    }
  }, 300) // 300ms debounce for search input

  const handleMinerSearch = useCallback((address: string) => {
    // Update local state immediately for UI responsiveness
    setMinerAddress(address)
    // Debounce the actual search operation
    debouncedMinerSearch(address)
  }, [debouncedMinerSearch])

  const handleApiUrlChange = useDebouncedCallback((url: string) => {
    setApiUrl(url)
    saveApiUrl(url)
    // Data will be automatically refetched by the hook when apiUrl changes
  }, 500) // 500ms debounce for API URL changes

  const handleRefreshAll = useCallback(async () => {
    await refetch()
  }, [refetch])

  const loadMoreBlocksAndPayouts = useCallback(async () => {
    if (loadingMoreBlocks || (!hasMoreBlocks && displayedPayoutsCount >= minerPayouts.length)) {
      return
    }
    
    setLoadingMoreBlocks(true)
    try {
      // Use the optimized hook's loadMoreBlocks method
      if (hasMoreBlocks) {
        await loadMoreBlocks()
        const currentBlockCount = minerBlocks.length
        setHasMoreBlocks(currentBlockCount > 0) // Simple heuristic
      }
      
      if (displayedPayoutsCount < minerPayouts.length) {
        setDisplayedPayoutsCount(prev => prev + 20)
      }
      
    } catch (err) {
      console.error('Failed to load more blocks and payouts:', err)
    }
    setLoadingMoreBlocks(false)
  }, [loadingMoreBlocks, hasMoreBlocks, displayedPayoutsCount, minerPayouts.length, loadMoreBlocks, minerBlocks.length])

  // Effects - simplified since the hook handles most data fetching
  useEffect(() => {
    const savedMinerAddress = minerAddress
    if (savedMinerAddress && savedMinerAddress.trim()) {
      console.log('Auto-loading saved miner address:', savedMinerAddress)
      setSearchedMinerAddress(savedMinerAddress)
      // Hook will automatically fetch data when searchedMinerAddress changes
    }
    // Pool data is automatically fetched by the hook
  }, [minerAddress])

  // Listen for refresh triggers from context
  useEffect(() => {
    if (refreshTrigger > 0 && refreshTrigger !== lastRefreshTrigger) {
      setLastRefreshTrigger(refreshTrigger)
      handleRefreshAll()
    }
  }, [refreshTrigger, lastRefreshTrigger, handleRefreshAll])

  // Monitor errors and handle them gracefully to prevent Next.js console errors
  useEffect(() => {
    if (error) {
      // Silent handling for network outages - only log in development mode to prevent Next.js console errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('P2Pool data error (handled):', error);
      }
      
      // Don't show error toasts for certain expected errors that already have specific handling
      if (!error.includes('Miner not found') && 
          !error.includes('Connection failed') &&
          !error.includes('Unable to reach')) {
        
        // Only show error toast if it's a new error (not repeating)
        const errorKey = `p2pool-error-${error.slice(0, 50)}`;
        const lastErrorTime = sessionStorage.getItem(errorKey);
        const now = Date.now();
        
        if (!lastErrorTime || now - parseInt(lastErrorTime) > 30000) { // Only show once per 30 seconds per error type
          sessionStorage.setItem(errorKey, now.toString());
          
          toast.error('Data Update Failed', {
            description: 'Connection issues detected. Retrying automatically.',
            duration: 4000,
            action: {
              label: "Retry Now",
              onClick: () => handleRefreshAll()
            }
          });
        }
      }
    }
  }, [error, handleRefreshAll])

  useEffect(() => {
    if (minerInfo && searchedMinerAddress && !isLoading && !hasScrolledForCurrentAddress) {
      setTimeout(() => {
        const miningDashboard = document.querySelector('[data-mining-dashboard]')
        if (miningDashboard) {
          miningDashboard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
          setHasScrolledForCurrentAddress(true)
        }
      }, 100)
    }
  }, [minerInfo, searchedMinerAddress, isLoading, hasScrolledForCurrentAddress])

  // Memoized computed values for better performance
  const computedValues = useMemo(() => {
    const recentPayouts = FormattingUtils.filterRecentPayouts(minerPayouts)
    const displayedPayouts = FormattingUtils.getDisplayedPayouts(minerPayouts, displayedPayoutsCount)
    const poolShare = poolInfo && minerInfo ? FormattingUtils.calculatePoolShare(minerWindowShares, minerInfo, poolInfo) : 0

    return {
      recentPayouts,
      displayedPayouts,
      poolShare
    }
  }, [minerPayouts, displayedPayoutsCount, poolInfo, minerInfo, minerWindowShares])

  // Loading state
  if (isLoading && !poolInfo) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Connection Settings */}
      <P2PoolSettings
        apiUrl={apiUrl}
        onApiUrlChange={handleApiUrlChange}
        minerAddress={minerAddress}
        onMinerAddressChange={setMinerAddress}
        onMinerSearch={handleMinerSearch}
        isConnected={true} // We'll show connection status in header now
        refreshing={isRefreshing}
      />

      {error && (
        <Alert variant="destructive" className="mx-2 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {poolInfo && (
        <>
          {/* Personal Mining Dashboard */}
          {minerInfo && searchedMinerAddress && (
            <div className="space-y-4 sm:space-y-6" data-mining-dashboard>
              {/* Personal Mining Header */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-100 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-cyan-950/40 border border-blue-200/40 dark:border-blue-700/40 shadow-xl dark:hover:shadow-2xl transition-all duration-500 mx-2 sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/70 to-indigo-100/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-cyan-950/35"></div>
                
                <GlowingEffect 
                  disabled={false}
                  proximity={100}
                  spread={30}
                  blur={2}
                />
                
                <CardHeader className="pb-3 sm:pb-4 relative z-10 border-b border-blue-200/30 dark:border-blue-700/30">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="font-bold text-blue-900 dark:text-blue-100 text-xl sm:text-2xl drop-shadow-sm tracking-tight">
                            Your Mining Dashboard
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-blue-700/90 dark:text-blue-300/90 font-medium">
                          Personal Mining Operations Center
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                      {isRefreshing && (
                         <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-600 border-t-transparent drop-shadow-lg"></div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4 sm:pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    {isLoading && !minerInfo ? (
                      <MinerActivityIndicatorSkeleton />
                    ) : (
                      <MinerActivityIndicator 
                        minerInfo={minerInfo} 
                        minerWindowShares={minerWindowShares} 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Personal Statistics Grid */}
              {isRefreshing && (!minerInfo || !minerWindowShares) ? (
                <DashboardGridSkeleton />
              ) : (
                minerInfo && poolInfo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      value={minerInfo.shares.reduce((sum, s) => sum + s.uncles, 0)}
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
                      value={computedValues.recentPayouts.length}
                      icon={DollarSign}
                      gradient="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-900/50"
                      iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
                      decorativeColor="bg-gradient-to-br from-yellow-200/30 to-orange-300/20 dark:from-yellow-800/30 dark:to-orange-700/20"
                      valueGradient="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400"
                      refreshing={isRefreshing}
                    >
                      {computedValues.recentPayouts.length > 0 && (
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between bg-gradient-to-r from-green-100/50 to-emerald-100/30 dark:from-green-900/20 dark:to-emerald-900/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                              Latest: {FormattingUtils.formatXMR(computedValues.recentPayouts[0]?.coinbase_reward || 0)}
                            </p>
                          </div>
                          {xmrPrice && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-100/50 to-cyan-100/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                {FormattingUtils.formatUSDOnly(computedValues.recentPayouts[0]?.coinbase_reward || 0, xmrPrice)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </StatCard>

                    <StatCard
                      title="Est. Pool Share"
                      value={`${computedValues.poolShare.toFixed(3)}%`}
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
              )}

              {/* Personal Activity Sections */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Share History */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-indigo-950/40 border border-blue-200/40 dark:border-blue-700/40 shadow-xl">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl">Share History</CardTitle>
                    <CardDescription className="text-sm">Recent mining activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-4">
                      <div className="space-y-3">
                        {isLoading && recentMinerShares.length === 0 ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <ActivityListItemSkeleton key={i} />
                          ))
                        ) : (
                          <>
                            {recentMinerShares.map((share) => (
                              <ShareListItem
                                key={share.template_id}
                                share={share}
                                formatTimeAgo={FormattingUtils.formatTimeAgo}
                              />
                            ))}
                            {recentMinerShares.length === 0 && !isLoading && (
                              <div className="text-center text-muted-foreground py-8">
                                <div className="text-lg font-medium mb-2">No shares found</div>
                                <div className="text-sm">Keep mining to see your shares here!</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Rewards Archive */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-100 dark:from-purple-950/30 dark:via-violet-950/30 dark:to-fuchsia-950/40 border border-purple-200/40 dark:border-purple-700/40 shadow-xl">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl">Reward Archive</CardTitle>
                    <CardDescription className="text-sm">Found blocks & payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-4">
                      <div className="space-y-3">
                        {isLoading && minerBlocks.length === 0 && computedValues.displayedPayouts.length === 0 ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <ActivityListItemSkeleton key={i} />
                          ))
                        ) : (
                          <>
                            {minerBlocks.map((block) => (
                              <BlockListItem 
                                key={`${block.main_block.id}-${block.main_block.height}`} 
                                block={block}
                                formatTimeAgo={FormattingUtils.formatTimeAgo}
                                formatXMR={FormattingUtils.formatXMR}
                                formatUSDOnly={(amount) => FormattingUtils.formatUSDOnly(amount, xmrPrice)}
                                xmrPrice={xmrPrice}
                              />
                            ))}
                            
                            {computedValues.displayedPayouts.map((payout, index) => {
                              if (!payout || typeof payout.coinbase_reward !== 'number') return null
                              return (
                                <PayoutListItem 
                                  key={`${payout.timestamp}-${index}`}
                                  payout={payout}
                                  formatTimeAgo={FormattingUtils.formatTimeAgo}
                                  formatXMR={FormattingUtils.formatXMR}
                                  formatUSDOnly={(amount) => FormattingUtils.formatUSDOnly(amount, xmrPrice)}
                                  xmrPrice={xmrPrice}
                                />
                              )
                            })}
                            
                            {/* Show skeleton items when loading more */}
                            {loadingMoreBlocks && (
                              Array.from({ length: 2 }).map((_, i) => (
                                <ActivityListItemSkeleton key={`loading-${i}`} />
                              ))
                            )}
                            
                            {minerBlocks.length === 0 && computedValues.displayedPayouts.length === 0 && !isLoading && (
                              <div className="text-center text-muted-foreground py-8">
                                <div className="text-lg font-medium mb-2">No recent activity</div>
                                <div className="text-sm">Keep mining for blocks and payouts!</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {(hasMoreBlocks || displayedPayoutsCount < minerPayouts.length) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMoreBlocksAndPayouts}
                        disabled={loadingMoreBlocks}
                        className="w-full mt-4"
                      >
                        {loadingMoreBlocks ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Loading more...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Pool Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Pool Hashrate"
              value={FormattingUtils.formatHashrate(poolInfo.sidechain.difficulty)}
              subtitle={`Difficulty: ${FormattingUtils.formatDifficulty(poolInfo.sidechain.difficulty)}`}
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
              value={poolInfo?.sidechain?.effort?.current != null ? `${poolInfo.sidechain.effort.current.toFixed(1)}%` : "N/A"}
              subtitle={poolInfo?.sidechain?.effort?.average != null ? `Avg: ${poolInfo.sidechain.effort.average.toFixed(1)}%` : "Avg: N/A"}
              icon={Zap}
              gradient="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-indigo-900/50"
              iconGradient="bg-gradient-to-br from-violet-400 to-purple-500"
              decorativeColor="bg-gradient-to-br from-purple-200/30 to-indigo-300/20 dark:from-purple-800/30 dark:to-indigo-700/20"
              valueGradient={(() => {
                if (poolInfo?.sidechain?.effort?.current == null) {
                  return "bg-gradient-to-r from-gray-600 to-gray-600 dark:from-gray-400 dark:to-gray-400"
                }
                const effortInfo = getEffortInfo(poolInfo.sidechain.effort.current)
                return effortInfo.tier === "Excellent" 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
                  : effortInfo.tier === "Good"
                  ? "bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400" 
                  : effortInfo.tier === "Normal"
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400"
                  : "bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400"
              })()}
              refreshing={isRefreshing}
            />
          </div>

          {/* Data Source Information */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 mx-2 sm:mx-0">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              <strong>Data Source:</strong> This dashboard shows live data from <code className="text-xs">{apiUrl}</code>. 
              The values displayed here are current, real-time statistics from the P2Pool network.
            </AlertDescription>
          </Alert>

          {/* Effort Guide - Only show if no personal miner tracked */}
          {!searchedMinerAddress && (
            <Card className="bg-muted/30 mx-2 sm:mx-0">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Mining Effort Guide</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Understanding pool effort for finding Monero mainchain blocks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EffortGuide />
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-xs sm:text-sm mb-2 text-blue-800 dark:text-blue-200">💡 Important Distinction:</h4>
                  <div className="space-y-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    <div><span className="font-bold">P2Pool Shares</span> (every ~10s): Individual miner contributions - these do NOT reset effort</div>
                    <div><span className="font-bold">Monero Blocks</span> (every ~2m): Pool-wide achievements - these DO reset effort</div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                  <span className="font-bold">Pool Effort</span> tracks how much work the entire P2Pool network has done toward finding the next 
                  <span className="font-bold"> Monero mainchain block</span>. Finding P2Pool shares (sidechain) doesn&apos;t reset this - only when 
                  the pool collectively finds a Monero block does the effort reset to 0%.
                </p>
              </CardContent>
            </Card>
          )}     
        </>
      )}
    </div>
  )
}