import { useRef, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface WorkerMessage {
  id: string
  type: string
  payload: any
}

interface WorkerResponse {
  id: string
  success: boolean
  result?: any
  error?: string
}

interface UseWebWorkerOptions {
  workerScript: string
  maxConcurrentTasks?: number
}

export function useWebWorker({ workerScript, maxConcurrentTasks = 4 }: UseWebWorkerOptions) {
  const workerRef = useRef<Worker | null>(null)
  const pendingTasksRef = useRef<Map<string, { resolve: Function, reject: Function }>>(new Map())
  const taskCounterRef = useRef(0)

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      workerRef.current = new Worker(workerScript)
      
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, success, result, error } = event.data
        const pendingTask = pendingTasksRef.current.get(id)
        
        if (pendingTask) {
          pendingTasksRef.current.delete(id)
          if (success) {
            pendingTask.resolve(result)
          } else {
            pendingTask.reject(new Error(error || 'Worker task failed'))
          }
        }
      }

      workerRef.current.onerror = (error) => {
        logger.error('Web Worker error:', error)
        // Reject all pending tasks
        pendingTasksRef.current.forEach(({ reject }) => {
          reject(new Error('Worker error'))
        })
        pendingTasksRef.current.clear()
      }

    } catch (error) {
      logger.error('Failed to create Web Worker:', error)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      pendingTasksRef.current.clear()
    }
  }, [workerScript])

  // Execute task in worker
  const executeTask = useCallback(async <T = any>(type: string, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Web Worker not available'))
        return
      }

      // Check if we have too many concurrent tasks
      if (pendingTasksRef.current.size >= maxConcurrentTasks) {
        reject(new Error('Too many concurrent tasks'))
        return
      }

      const taskId = `task_${++taskCounterRef.current}_${Date.now()}`
      
      // Store promise handlers
      pendingTasksRef.current.set(taskId, { resolve, reject })

      // Send task to worker
      const message: WorkerMessage = {
        id: taskId,
        type,
        payload
      }

      try {
        workerRef.current.postMessage(message)
      } catch (error) {
        pendingTasksRef.current.delete(taskId)
        reject(error)
      }

      // Set timeout for task
      setTimeout(() => {
        if (pendingTasksRef.current.has(taskId)) {
          pendingTasksRef.current.delete(taskId)
          reject(new Error('Task timeout'))
        }
      }, 30000) // 30 second timeout
    })
  }, [maxConcurrentTasks])

  // Batch execute multiple tasks
  const executeBatch = useCallback(async (operations: Record<string, { type: string, payload: any }>) => {
    return executeTask('BATCH_PROCESS', { operations })
  }, [executeTask])

  const isAvailable = !!workerRef.current
  const pendingTaskCount = pendingTasksRef.current.size

  return {
    executeTask,
    executeBatch,
    isAvailable,
    pendingTaskCount
  }
}

// Specific hooks for common data processing tasks
export function useDataProcessor() {
  const worker = useWebWorker({ workerScript: '/data-worker.js' })

  const processShares = useCallback(async (shares: any[]) => {
    if (!worker.isAvailable || shares.length === 0) return shares
    
    try {
      return await worker.executeTask('PROCESS_SHARES', { shares })
    } catch (error) {
      logger.error('Failed to process shares in worker:', error)
      return shares // Fallback to original data
    }
  }, [worker])

  const calculateMinerStats = useCallback(async (minerInfo: any, minerWindowShares: any, poolInfo: any) => {
    if (!worker.isAvailable) return null
    
    try {
      return await worker.executeTask('CALCULATE_MINER_STATS', {
        minerInfo,
        minerWindowShares,
        poolInfo
      })
    } catch (error) {
      logger.error('Failed to calculate miner stats in worker:', error)
      return null
    }
  }, [worker])

  const filterRecentPayouts = useCallback(async (payouts: any[], hours = 24) => {
    if (!worker.isAvailable || payouts.length === 0) return payouts
    
    try {
      return await worker.executeTask('FILTER_RECENT_PAYOUTS', { payouts, hours })
    } catch (error) {
      logger.error('Failed to filter payouts in worker:', error)
      return payouts // Fallback to original data
    }
  }, [worker])

  const processBlocks = useCallback(async (blocks: any[], xmrPrice: number | null) => {
    if (!worker.isAvailable || blocks.length === 0) return blocks
    
    try {
      return await worker.executeTask('PROCESS_BLOCKS', { blocks, xmrPrice })
    } catch (error) {
      logger.error('Failed to process blocks in worker:', error)
      return blocks // Fallback to original data
    }
  }, [worker])

  return {
    processShares,
    calculateMinerStats,
    filterRecentPayouts,
    processBlocks,
    isAvailable: worker.isAvailable,
    pendingTaskCount: worker.pendingTaskCount
  }
} 