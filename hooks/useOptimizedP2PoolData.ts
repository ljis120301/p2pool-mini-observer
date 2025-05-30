import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { P2PoolAPI } from '@/lib/p2pool-api'
import { PriceAPI } from '@/lib/price-api'
import { logger } from '@/lib/logger'
import { queryKeys } from '@/lib/query-client'
import { storage } from '@/lib/storage'
import { TIME_CONSTANTS, UI_CONSTANTS } from '@/lib/constants'
import type {
  PoolInfo,
  MinerInfo,
  SideBlock,
  FoundBlock,
  MinerWindowShares,
  MinerPayout
} from '@/types/p2pool'

interface UseOptimizedP2PoolDataProps {
  apiUrl: string
  minerAddress?: string
  autoRefresh?: boolean
}

interface UseOptimizedP2PoolDataResult {
  // Data state
  poolInfo: PoolInfo | null
  minerInfo: MinerInfo | null
  recentShares: SideBlock[]
  foundBlocks: FoundBlock[]
  recentMinerShares: SideBlock[]
  minerBlocks: FoundBlock[]
  minerPayouts: MinerPayout[]
  minerWindowShares: MinerWindowShares
  xmrPrice: number | null
  
  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  isFetchingMore: boolean
  
  // Error states  
  error: string | null
  hasError: boolean
  
  // Connection state
  isConnected: boolean
  lastUpdate: Date | null
  
  // Actions
  refetch: () => Promise<void>
  loadMoreShares: () => Promise<void>
  loadMoreBlocks: () => Promise<void>
  clearCache: () => void
}

export function useOptimizedP2PoolData({
  apiUrl,
  minerAddress,
  autoRefresh = true
}: UseOptimizedP2PoolDataProps): UseOptimizedP2PoolDataResult {
  const queryClient = useQueryClient()
  const api = useMemo(() => new P2PoolAPI(apiUrl), [apiUrl])
  const priceApi = useMemo(() => new PriceAPI(), [])

  // Pool info query with IndexedDB backup
  const poolInfoQuery = useQuery({
    queryKey: queryKeys.poolInfo(apiUrl),
    queryFn: async () => {
      try {
        const data = await api.getPoolInfo()
        // Store in IndexedDB for offline access
        await storage.storePoolInfo(apiUrl, data)
        return data
      } catch (error) {
        // Try to get from IndexedDB if network fails
        const cachedData = await storage.getPoolInfo(apiUrl)
        if (cachedData) {
          logger.debug('Using cached pool info from IndexedDB')
          return cachedData
        }
        throw error
      }
    },
    refetchInterval: autoRefresh ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Recent shares query
  const recentSharesQuery = useQuery({
    queryKey: queryKeys.recentShares(apiUrl, 10),
    queryFn: async () => {
      const shares = await api.getShares(10)
      // Store in IndexedDB
      await storage.storeShares(apiUrl, shares)
      return shares
    },
    refetchInterval: autoRefresh ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 30 * 1000,
  })

  // Found blocks query
  const foundBlocksQuery = useQuery({
    queryKey: queryKeys.foundBlocks(apiUrl, 5),
    queryFn: async () => {
      const blocks = await api.getFoundBlocks(5)
      await storage.storeBlocks(apiUrl, blocks)
      return blocks
    },
    refetchInterval: autoRefresh ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 60 * 1000, // Blocks change less frequently
  })

  // XMR Price query (less frequent updates)
  const xmrPriceQuery = useQuery({
    queryKey: queryKeys.xmrPrice(),
    queryFn: () => priceApi.getXMRPrice(),
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false, // 5 minutes
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Individual miner queries (only when minerAddress is provided)
  const minerInfoQuery = useQuery({
    queryKey: queryKeys.minerInfo(apiUrl, minerAddress || ''),
    queryFn: async () => {
      if (!minerAddress) throw new Error('No miner address provided')
      try {
        const data = await api.getMinerInfo(minerAddress)
        await storage.storeMinerInfo(apiUrl, minerAddress, data)
        return data
      } catch (error) {
        const cachedData = await storage.getMinerInfo(apiUrl, minerAddress)
        if (cachedData) {
          logger.debug('Using cached miner info from IndexedDB')
          return cachedData
        }
        throw error
      }
    },
    enabled: !!minerAddress,
    refetchInterval: autoRefresh && minerAddress ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 30 * 1000,
  })

  const minerSharesQuery = useQuery({
    queryKey: queryKeys.minerShares(apiUrl, minerAddress || '', UI_CONSTANTS.DEFAULT_SHARES_LIMIT),
    queryFn: async () => {
      if (!minerAddress) throw new Error('No miner address provided')
      try {
        const shares = await api.getMinerSharesDirect(minerAddress, UI_CONSTANTS.DEFAULT_SHARES_LIMIT)
        await storage.storeShares(apiUrl, shares)
        return shares
      } catch (error) {
        const cachedShares = await storage.getSharesByMiner(apiUrl, minerAddress, UI_CONSTANTS.DEFAULT_SHARES_LIMIT)
        if (cachedShares.length > 0) {
          logger.debug('Using cached miner shares from IndexedDB')
          return cachedShares
        }
        throw error
      }
    },
    enabled: !!minerAddress,
    refetchInterval: autoRefresh && minerAddress ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 30 * 1000,
  })

  const minerBlocksQuery = useQuery({
    queryKey: queryKeys.minerBlocks(apiUrl, minerAddress || '', UI_CONSTANTS.DEFAULT_BLOCKS_LIMIT),
    queryFn: async () => {
      if (!minerAddress) throw new Error('No miner address provided')
      try {
        const blocks = await api.getMinerFoundBlocks(minerAddress, UI_CONSTANTS.DEFAULT_BLOCKS_LIMIT)
        await storage.storeBlocks(apiUrl, blocks)
        return blocks
      } catch (error) {
        const cachedBlocks = await storage.getBlocksByMiner(apiUrl, minerAddress, UI_CONSTANTS.DEFAULT_BLOCKS_LIMIT)
        if (cachedBlocks.length > 0) {
          logger.debug('Using cached miner blocks from IndexedDB')
          return cachedBlocks
        }
        throw error
      }
    },
    enabled: !!minerAddress,
    refetchInterval: autoRefresh && minerAddress ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 60 * 1000,
  })

  const minerPayoutsQuery = useQuery({
    queryKey: queryKeys.minerPayouts(apiUrl, minerAddress || ''),
    queryFn: async () => {
      if (!minerAddress) throw new Error('No miner address provided')
      try {
        const payouts = await api.getMinerPayouts(minerAddress)
        await storage.storePayouts(apiUrl, minerAddress, payouts)
        return payouts
      } catch (error) {
        const cachedPayouts = await storage.getPayouts(apiUrl, minerAddress)
        if (cachedPayouts) {
          logger.debug('Using cached miner payouts from IndexedDB')
          return cachedPayouts
        }
        throw error
      }
    },
    enabled: !!minerAddress,
    refetchInterval: autoRefresh && minerAddress ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const minerWindowSharesQuery = useQuery({
    queryKey: queryKeys.minerWindowShares(apiUrl, minerAddress || ''),
    queryFn: async () => {
      if (!minerAddress) throw new Error('No miner address provided')
      return api.getMinerWindowShares(minerAddress)
    },
    enabled: !!minerAddress,
    refetchInterval: autoRefresh && minerAddress ? TIME_CONSTANTS.REFRESH_INTERVAL : false,
    staleTime: 30 * 1000,
  })

  // Memory-efficient data management
  const optimizedData = useMemo(() => {
    // Limit data size for long-running sessions
    const maxShares = 1000
    const maxBlocks = 100
    const maxPayouts = 500

    const recentShares = recentSharesQuery.data?.slice(0, 50) || []
    const foundBlocks = foundBlocksQuery.data?.slice(0, 20) || []
    const minerShares = minerSharesQuery.data?.slice(0, maxShares) || []
    const minerBlocks = minerBlocksQuery.data?.slice(0, maxBlocks) || []
    const minerPayouts = minerPayoutsQuery.data?.slice(0, maxPayouts) || []

    return {
      recentShares,
      foundBlocks,
      minerShares,
      minerBlocks,
      minerPayouts,
    }
  }, [
    recentSharesQuery.data,
    foundBlocksQuery.data,
    minerSharesQuery.data,
    minerBlocksQuery.data,
    minerPayoutsQuery.data,
  ])

  // Connection status
  const isConnected = useMemo(() => {
    return !poolInfoQuery.isError && (poolInfoQuery.data !== undefined || poolInfoQuery.isFetching)
  }, [poolInfoQuery.isError, poolInfoQuery.data, poolInfoQuery.isFetching])

  // Loading states
  const isLoading = useMemo(() => {
    const baseLoading = poolInfoQuery.isLoading || recentSharesQuery.isLoading || foundBlocksQuery.isLoading
    if (!minerAddress) return baseLoading
    
    return baseLoading || minerInfoQuery.isLoading || minerSharesQuery.isLoading || minerBlocksQuery.isLoading || minerPayoutsQuery.isLoading || minerWindowSharesQuery.isLoading
  }, [poolInfoQuery.isLoading, recentSharesQuery.isLoading, foundBlocksQuery.isLoading, minerAddress, minerInfoQuery.isLoading, minerSharesQuery.isLoading, minerBlocksQuery.isLoading, minerPayoutsQuery.isLoading, minerWindowSharesQuery.isLoading])

  const isRefreshing = useMemo(() => {
    const baseRefreshing = poolInfoQuery.isFetching || recentSharesQuery.isFetching || foundBlocksQuery.isFetching
    if (!minerAddress) return baseRefreshing
    
    return baseRefreshing || minerInfoQuery.isFetching || minerSharesQuery.isFetching || minerBlocksQuery.isFetching || minerPayoutsQuery.isFetching || minerWindowSharesQuery.isFetching
  }, [poolInfoQuery.isFetching, recentSharesQuery.isFetching, foundBlocksQuery.isFetching, minerAddress, minerInfoQuery.isFetching, minerSharesQuery.isFetching, minerBlocksQuery.isFetching, minerPayoutsQuery.isFetching, minerWindowSharesQuery.isFetching])

  // Error handling
  const error = useMemo(() => {
    const errors = [
      poolInfoQuery.error,
      recentSharesQuery.error,
      foundBlocksQuery.error,
      minerInfoQuery.error,
      minerSharesQuery.error,
      minerBlocksQuery.error,
      minerPayoutsQuery.error,
      minerWindowSharesQuery.error,
    ].filter(Boolean)
    
    return errors.length > 0 ? errors[0]?.message || 'Unknown error' : null
  }, [
    poolInfoQuery.error,
    recentSharesQuery.error,
    foundBlocksQuery.error,
    minerInfoQuery.error,
    minerSharesQuery.error,
    minerBlocksQuery.error,
    minerPayoutsQuery.error,
    minerWindowSharesQuery.error,
  ])

  // Actions
  const refetch = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.poolInfo(apiUrl) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.recentShares(apiUrl, 10) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.foundBlocks(apiUrl, 5) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.xmrPrice() }),
    ])

    if (minerAddress) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.minerInfo(apiUrl, minerAddress) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.minerShares(apiUrl, minerAddress, UI_CONSTANTS.DEFAULT_SHARES_LIMIT) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.minerBlocks(apiUrl, minerAddress, UI_CONSTANTS.DEFAULT_BLOCKS_LIMIT) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.minerPayouts(apiUrl, minerAddress) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.minerWindowShares(apiUrl, minerAddress) }),
      ])
    }
  }, [queryClient, apiUrl, minerAddress])

  const loadMoreShares = useCallback(async () => {
    if (!minerAddress) return
    
    const currentShares = minerSharesQuery.data || []
    const newLimit = currentShares.length + UI_CONSTANTS.REQUEST_LIMIT_SHARES
    
    await queryClient.fetchQuery({
      queryKey: queryKeys.minerShares(apiUrl, minerAddress, newLimit),
      queryFn: () => api.getMinerSharesDirect(minerAddress, newLimit),
    })
  }, [queryClient, apiUrl, minerAddress, minerSharesQuery.data, api])

  const loadMoreBlocks = useCallback(async () => {
    if (!minerAddress) return
    
    const currentBlocks = minerBlocksQuery.data || []
    const newLimit = currentBlocks.length + UI_CONSTANTS.REQUEST_LIMIT_BLOCKS
    
    await queryClient.fetchQuery({
      queryKey: queryKeys.minerBlocks(apiUrl, minerAddress, newLimit),
      queryFn: () => api.getMinerFoundBlocks(minerAddress, newLimit),
    })
  }, [queryClient, apiUrl, minerAddress, minerBlocksQuery.data, api])

  const clearCache = useCallback(() => {
    queryClient.clear()
    storage.clearOldCache(0).catch(error => {
      logger.error('Failed to clear storage cache', error)
    })
  }, [queryClient])

  // Last update time
  const lastUpdate = useMemo(() => {
    const times = [
      poolInfoQuery.dataUpdatedAt,
      recentSharesQuery.dataUpdatedAt,
      foundBlocksQuery.dataUpdatedAt,
      minerInfoQuery.dataUpdatedAt,
      minerSharesQuery.dataUpdatedAt,
      minerBlocksQuery.dataUpdatedAt,
      minerPayoutsQuery.dataUpdatedAt,
      minerWindowSharesQuery.dataUpdatedAt,
    ].filter(Boolean)
    
    return times.length > 0 ? new Date(Math.max(...times)) : null
  }, [
    poolInfoQuery.dataUpdatedAt,
    recentSharesQuery.dataUpdatedAt,
    foundBlocksQuery.dataUpdatedAt,
    minerInfoQuery.dataUpdatedAt,
    minerSharesQuery.dataUpdatedAt,
    minerBlocksQuery.dataUpdatedAt,
    minerPayoutsQuery.dataUpdatedAt,
    minerWindowSharesQuery.dataUpdatedAt,
  ])

  return {
    // Data
    poolInfo: poolInfoQuery.data || null,
    minerInfo: minerInfoQuery.data || null,
    recentShares: optimizedData.recentShares,
    foundBlocks: optimizedData.foundBlocks,
    recentMinerShares: optimizedData.minerShares,
    minerBlocks: optimizedData.minerBlocks,
    minerPayouts: optimizedData.minerPayouts,
    minerWindowShares: minerWindowSharesQuery.data || { shares: 0, blocks: [] },
    xmrPrice: xmrPriceQuery.data || null,
    
    // Loading states
    isLoading,
    isRefreshing,
    isFetchingMore: false,
    
    // Error states
    error,
    hasError: !!error,
    
    // Connection state
    isConnected,
    lastUpdate,
    
    // Actions
    refetch,
    loadMoreShares,
    loadMoreBlocks,
    clearCache,
  }
} 