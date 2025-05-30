import { openDB, type IDBPDatabase } from 'idb'
import { logger } from './logger'
import type { PoolInfo, MinerInfo, SideBlock, FoundBlock, MinerPayout } from '@/types/p2pool'

// Database schema version and name
const DB_NAME = 'P2PoolStorage'
const DB_VERSION = 2

// Store names for different data types
const STORES = {
  POOL_INFO: 'poolInfo',
  MINER_INFO: 'minerInfo',
  SHARES: 'shares',
  BLOCKS: 'blocks',
  PAYOUTS: 'payouts',
  METADATA: 'metadata',
} as const

// Data retention periods (in milliseconds)
const RETENTION_PERIODS = {
  POOL_INFO: 24 * 60 * 60 * 1000, // 1 day
  MINER_INFO: 7 * 24 * 60 * 60 * 1000, // 7 days
  SHARES: 30 * 24 * 60 * 60 * 1000, // 30 days
  BLOCKS: 365 * 24 * 60 * 60 * 1000, // 1 year (blocks are permanent)
  PAYOUTS: 365 * 24 * 60 * 60 * 1000, // 1 year
} as const

interface StoredData<T = any> {
  id: string
  data: T
  timestamp: number
  lastAccessed: number
}

interface StorageMetadata {
  totalSize: number
  lastCleanup: number
  dataVersion: string
}

class P2PoolStorage {
  private db: IDBPDatabase | null = null
  private initPromise: Promise<void> | null = null
  private isInitialized = false

  constructor() {
    this.initPromise = this.init()
  }

  private async init(): Promise<void> {
    // Skip initialization on server side
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available (likely SSR)')
      return
    }

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Pool info store
          if (!db.objectStoreNames.contains(STORES.POOL_INFO)) {
            const poolStore = db.createObjectStore(STORES.POOL_INFO, { keyPath: 'id' })
            poolStore.createIndex('timestamp', 'timestamp')
            poolStore.createIndex('apiUrl', 'apiUrl')
          }

          // Miner info store
          if (!db.objectStoreNames.contains(STORES.MINER_INFO)) {
            const minerStore = db.createObjectStore(STORES.MINER_INFO, { keyPath: 'id' })
            minerStore.createIndex('timestamp', 'timestamp')
            minerStore.createIndex('apiUrl', 'apiUrl')
            minerStore.createIndex('address', 'address')
          }

          // Shares store
          if (!db.objectStoreNames.contains(STORES.SHARES)) {
            const sharesStore = db.createObjectStore(STORES.SHARES, { keyPath: 'id' })
            sharesStore.createIndex('timestamp', 'timestamp')
            sharesStore.createIndex('apiUrl', 'apiUrl')
          }

          // Blocks store  
          if (!db.objectStoreNames.contains(STORES.BLOCKS)) {
            const blocksStore = db.createObjectStore(STORES.BLOCKS, { keyPath: 'id' })
            blocksStore.createIndex('timestamp', 'timestamp')
            blocksStore.createIndex('apiUrl', 'apiUrl')
          }

          // Payouts store
          if (!db.objectStoreNames.contains(STORES.PAYOUTS)) {
            const payoutsStore = db.createObjectStore(STORES.PAYOUTS, { keyPath: 'id' })
            payoutsStore.createIndex('timestamp', 'timestamp')
            payoutsStore.createIndex('apiUrl', 'apiUrl')
            payoutsStore.createIndex('address', 'address')
          }

          // Metadata store
          if (!db.objectStoreNames.contains(STORES.METADATA)) {
            db.createObjectStore(STORES.METADATA, { keyPath: 'id' })
          }
        },
      })

      this.isInitialized = true
      logger.debug('P2Pool storage initialized successfully')
      
      // Schedule cleanup
      this.scheduleCleanup()
    } catch (error) {
      logger.error('Failed to initialize P2Pool storage', error)
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise
    }
    if (!this.db) {
      throw new Error('Storage not initialized')
    }
  }

  // Generic storage methods
  private async store<T>(storeName: string, key: string, data: T): Promise<void> {
    await this.ensureReady()
    if (!this.db) return

    const storedData: StoredData<T> = {
      id: key,
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
    }

    const tx = this.db.transaction(storeName, 'readwrite')
    await tx.objectStore(storeName).put(storedData)
    await tx.done
  }

  private async retrieve<T>(storeName: string, key: string): Promise<T | null> {
    await this.ensureReady()
    if (!this.db) return null

    const tx = this.db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const result = await store.get(key)
    
    if (result) {
      // Update last accessed time
      result.lastAccessed = Date.now()
      await store.put(result)
      await tx.done
      return result.data
    }

    return null
  }

  // Pool info storage
  async storePoolInfo(apiUrl: string, poolInfo: PoolInfo): Promise<void> {
    if (typeof window === 'undefined') return // Skip on server side
    
    const key = `pool_${apiUrl}`
    await this.store(STORES.POOL_INFO, key, poolInfo)
  }

  async getPoolInfo(apiUrl: string): Promise<PoolInfo | null> {
    if (typeof window === 'undefined') return null // Skip on server side
    
    const key = `pool_${apiUrl}`
    return this.retrieve(STORES.POOL_INFO, key)
  }

  // Miner info storage
  async storeMinerInfo(apiUrl: string, address: string, minerInfo: MinerInfo): Promise<void> {
    const key = `miner_${apiUrl}_${address}`
    await this.store(STORES.MINER_INFO, key, minerInfo)
  }

  async getMinerInfo(apiUrl: string, address: string): Promise<MinerInfo | null> {
    const key = `miner_${apiUrl}_${address}`
    return this.retrieve(STORES.MINER_INFO, key)
  }

  // Shares storage (with deduplication)
  async storeShares(apiUrl: string, shares: SideBlock[]): Promise<void> {
    await this.ensureReady()
    if (!this.db || shares.length === 0) return

    const tx = this.db.transaction(STORES.SHARES, 'readwrite')
    const store = tx.objectStore(STORES.SHARES)
    
    for (const share of shares) {
      const key = `share_${apiUrl}_${share.side_height}_${share.template_id}`
      const storedData: StoredData<SideBlock> = {
        id: key,
        data: share,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      }
      await store.put(storedData)
    }
    
    await tx.done
  }

  async getSharesByMiner(apiUrl: string, address: string, limit: number = 100): Promise<SideBlock[]> {
    await this.ensureReady()
    if (!this.db) return []

    const tx = this.db.transaction(STORES.SHARES, 'readonly')
    const index = tx.objectStore(STORES.SHARES).index('miner_address')
    const range = IDBKeyRange.only(address)
    
    const results = await index.getAll(range, limit)
    return results
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(item => item.data)
      .slice(0, limit)
  }

  // Blocks storage
  async storeBlocks(apiUrl: string, blocks: FoundBlock[]): Promise<void> {
    await this.ensureReady()
    if (!this.db || blocks.length === 0) return

    const tx = this.db.transaction(STORES.BLOCKS, 'readwrite')
    const store = tx.objectStore(STORES.BLOCKS)
    
    for (const block of blocks) {
      const key = `block_${apiUrl}_${block.main_block.height}_${block.main_block.id}`
      const storedData: StoredData<FoundBlock> = {
        id: key,
        data: block,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      }
      await store.put(storedData)
    }
    
    await tx.done
  }

  async getBlocksByMiner(apiUrl: string, address: string, limit: number = 50): Promise<FoundBlock[]> {
    await this.ensureReady()
    if (!this.db) return []

    const tx = this.db.transaction(STORES.BLOCKS, 'readonly')
    const index = tx.objectStore(STORES.BLOCKS).index('miner_address')
    const range = IDBKeyRange.only(address)
    
    const results = await index.getAll(range, limit)
    return results
      .sort((a, b) => b.data.main_block.height - a.data.main_block.height)
      .map(item => item.data)
      .slice(0, limit)
  }

  // Payouts storage
  async storePayouts(apiUrl: string, address: string, payouts: MinerPayout[]): Promise<void> {
    const key = `payouts_${apiUrl}_${address}`
    await this.store(STORES.PAYOUTS, key, payouts)
  }

  async getPayouts(apiUrl: string, address: string): Promise<MinerPayout[] | null> {
    const key = `payouts_${apiUrl}_${address}`
    return this.retrieve(STORES.PAYOUTS, key)
  }

  // Cleanup old data to manage storage space
  private async scheduleCleanup(): Promise<void> {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanup().catch(error => {
        logger.error('Storage cleanup failed', error)
      })
    }, 60 * 60 * 1000)

    // Run initial cleanup after 10 seconds
    setTimeout(() => {
      this.cleanup().catch(error => {
        logger.error('Initial storage cleanup failed', error)
      })
    }, 10000)
  }

  async cleanup(): Promise<void> {
    await this.ensureReady()
    if (!this.db) return

    const now = Date.now()
    let deletedCount = 0

    try {
      // Clean up each store based on retention periods
      for (const [storeKey, storeName] of Object.entries(STORES)) {
        if (storeName === STORES.METADATA) continue

        const retentionPeriod = RETENTION_PERIODS[storeKey as keyof typeof RETENTION_PERIODS]
        const cutoffTime = now - retentionPeriod

        const tx = this.db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const index = store.index('timestamp')
        const range = IDBKeyRange.upperBound(cutoffTime)

        const cursor = await index.openCursor(range)
        while (cursor) {
          await cursor.delete()
          deletedCount++
          await cursor.continue()
        }

        await tx.done
      }

      // Update metadata
      const metadata: StorageMetadata = {
        totalSize: await this.calculateStorageSize(),
        lastCleanup: now,
        dataVersion: '1.0',
      }

      await this.store(STORES.METADATA, 'global', metadata)

      if (deletedCount > 0) {
        logger.debug(`Storage cleanup completed, deleted ${deletedCount} old records`)
      }
    } catch (error) {
      logger.error('Storage cleanup error', error)
    }
  }

  private async calculateStorageSize(): Promise<number> {
    await this.ensureReady()
    if (!this.db) return 0

    // Estimate storage size (rough calculation)
    let totalSize = 0
    
    for (const storeName of Object.values(STORES)) {
      const tx = this.db.transaction(storeName, 'readonly')
      const count = await tx.objectStore(storeName).count()
      totalSize += count * 1024 // Rough estimate of 1KB per record
    }

    return totalSize
  }

  // Memory management for long-running sessions
  async getStorageInfo(): Promise<StorageMetadata | null> {
    return this.retrieve(STORES.METADATA, 'global')
  }

  async clearOldCache(olderThanHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    
    for (const storeName of Object.values(STORES)) {
      if (storeName === STORES.METADATA) continue

      try {
        const tx = this.db?.transaction(storeName, 'readwrite')
        if (!tx) continue

        const store = tx.objectStore(storeName)
        const index = store.index('timestamp')
        const range = IDBKeyRange.upperBound(cutoffTime)

        const cursor = await index.openCursor(range)
        while (cursor) {
          await cursor.delete()
          await cursor.continue()
        }

        await tx.done
      } catch (error) {
        logger.error(`Failed to clear cache for ${storeName}`, error)
      }
    }
  }
}

// Export singleton instance
export const storage = new P2PoolStorage() 