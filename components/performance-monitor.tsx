'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useServiceWorker } from '@/lib/service-worker'
import { storage } from '@/lib/storage'
import { logger } from '@/lib/logger'
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  Activity,
  Wifi,
  WifiOff,
  Download
} from 'lucide-react'

interface CacheStats {
  reactQuery: {
    queryCount: number
    cachedQueries: number
    invalidQueries: number
  }
  serviceWorker: {
    size: number
    count: number
  } | null
  indexedDB: {
    totalSize: number
    lastCleanup: number
    dataVersion: string
  } | null
}

export function PerformanceMonitor() {
  const queryClient = useQueryClient()
  const serviceWorkerManager = useServiceWorker()
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    reactQuery: { queryCount: 0, cachedQueries: 0, invalidQueries: 0 },
    serviceWorker: null,
    indexedDB: null
  })
  const [isOnline, setIsOnline] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null)

  useEffect(() => {
    updateStats()
    
    // Set up periodic stats updates
    const interval = setInterval(updateStats, 30000) // Every 30 seconds
    
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Monitor memory usage if available
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory
        if (memory) {
          setMemoryUsage(memory.usedJSHeapSize)
        }
      }
      
      updateMemory()
      const memoryInterval = setInterval(updateMemory, 5000)
      
      return () => {
        clearInterval(interval)
        clearInterval(memoryInterval)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateStats = async () => {
    try {
      // React Query stats
      const queryCache = queryClient.getQueryCache()
      const queries = queryCache.getAll()
      const cachedQueries = queries.filter(q => q.state.data !== undefined).length
      const invalidQueries = queries.filter(q => q.state.isInvalidated).length

      // Service Worker cache stats
      const swCacheInfo = serviceWorkerManager.isSupported 
        ? await serviceWorkerManager.getCacheInfo() 
        : null

      // IndexedDB stats
      const indexedDBInfo = await storage.getStorageInfo()

      setCacheStats({
        reactQuery: {
          queryCount: queries.length,
          cachedQueries,
          invalidQueries
        },
        serviceWorker: swCacheInfo,
        indexedDB: indexedDBInfo
      })
    } catch (error) {
      logger.error('Failed to update performance stats', error)
    }
  }

  const clearAllCaches = async () => {
    setIsClearing(true)
    try {
      // Clear React Query cache
      queryClient.clear()
      logger.debug('React Query cache cleared')

      // Clear Service Worker cache
      if (serviceWorkerManager.isSupported) {
        await serviceWorkerManager.clearCache()
        logger.debug('Service Worker cache cleared')
      }

      // Clear IndexedDB cache
      await storage.clearOldCache(0)
      logger.debug('IndexedDB cache cleared')

      await updateStats()
    } catch (error) {
      logger.error('Failed to clear caches', error)
    } finally {
      setIsClearing(false)
    }
  }

  const installPWA = async () => {
    try {
      const installed = await serviceWorkerManager.installApp()
      if (installed) {
        logger.debug('PWA installed successfully')
      } else {
        logger.debug('PWA installation not available or declined')
      }
    } catch (error) {
      logger.error('PWA installation failed', error)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="text-green-600">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          {serviceWorkerManager.isPWA && (
            <Badge variant="secondary">PWA</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* React Query Stats */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" />
            React Query Cache
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Queries</div>
              <div className="font-mono">{cacheStats.reactQuery.queryCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cached</div>
              <div className="font-mono text-green-600">{cacheStats.reactQuery.cachedQueries}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Invalid</div>
              <div className="font-mono text-yellow-600">{cacheStats.reactQuery.invalidQueries}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Service Worker Stats */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Service Worker Cache
          </h3>
          {cacheStats.serviceWorker ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Cache Size</div>
                <div className="font-mono">{formatBytes(cacheStats.serviceWorker.size)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cached Items</div>
                <div className="font-mono">{cacheStats.serviceWorker.count}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Service Worker not supported or not active
            </div>
          )}
        </div>

        <Separator />

        {/* IndexedDB Stats */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" />
            IndexedDB Storage
          </h3>
          {cacheStats.indexedDB ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Estimated Size</div>
                <div className="font-mono">{formatBytes(cacheStats.indexedDB.totalSize)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Cleanup</div>
                <div className="font-mono text-xs">
                  {formatDate(cacheStats.indexedDB.lastCleanup)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No storage data available
            </div>
          )}
        </div>

        {/* Memory Usage */}
        {memoryUsage && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-3">Memory Usage</h3>
              <div className="text-sm">
                <div className="text-muted-foreground">Heap Size</div>
                <div className="font-mono">{formatBytes(memoryUsage)}</div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={updateStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Stats
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllCaches}
            disabled={isClearing}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? 'Clearing...' : 'Clear All Caches'}
          </Button>

          {serviceWorkerManager.isSupported && !serviceWorkerManager.isPWA && (
            <Button
              variant="outline"
              size="sm"
              onClick={installPWA}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Install PWA
            </Button>
          )}
        </div>

        {/* Performance Tips */}
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="font-medium mb-1">Performance Tips:</div>
          <ul className="space-y-1">
            <li>• Data is cached automatically for optimal performance</li>
            <li>• Offline support available when service worker is active</li>
            <li>• Clear caches if you notice memory issues</li>
            <li>• Install as PWA for better mobile experience</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 