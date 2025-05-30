import { QueryClient } from '@tanstack/react-query'
import { logger } from './logger'

// Query configuration optimized for P2Pool data
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds (P2Pool updates every ~20-30 seconds)
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch when window regains focus (for real-time mining data)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      // Network recovery refetching
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        logger.error('Mutation failed', error)
      },
    },
  },
})

// Query keys for consistent cache management
export const queryKeys = {
  // Pool data
  poolInfo: (apiUrl: string) => ['poolInfo', apiUrl] as const,
  recentShares: (apiUrl: string, limit: number) => ['recentShares', apiUrl, limit] as const,
  foundBlocks: (apiUrl: string, limit: number) => ['foundBlocks', apiUrl, limit] as const,
  
  // Miner data
  minerInfo: (apiUrl: string, address: string) => ['minerInfo', apiUrl, address] as const,
  minerShares: (apiUrl: string, address: string, limit: number) => ['minerShares', apiUrl, address, limit] as const,
  minerBlocks: (apiUrl: string, address: string, limit: number) => ['minerBlocks', apiUrl, address, limit] as const,
  minerPayouts: (apiUrl: string, address: string) => ['minerPayouts', apiUrl, address] as const,
  minerWindowShares: (apiUrl: string, address: string) => ['minerWindowShares', apiUrl, address] as const,
  
  // Price data (less frequent updates)
  xmrPrice: () => ['xmrPrice'] as const,
} as const

// Performance monitoring for queries
export const setupQueryDevtools = () => {
  if (process.env.NODE_ENV === 'development') {
    import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
      // Devtools available in development
      return ReactQueryDevtools
    })
  }
} 