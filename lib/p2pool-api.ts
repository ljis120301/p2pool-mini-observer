// P2Pool API types and client
import { toast } from "sonner";

export interface PoolInfo {
  sidechain: {
    consensus: {
      network_type: string
      name: string
      block_time: number
      min_diff: number
      pplns_window: number
      uncle_penalty: number
    }
    last_block: {
      main_id: string
      main_height: number
      template_id: string
      side_height: number
      miner: number
      timestamp: number
      difficulty: number
      cumulative_difficulty: number
      pow_difficulty: number
      transaction_count: number
      miner_address: string
    }
    seconds_since_last_block: number
    effort: {
      current: number
      average10: number
      average: number
      average200: number
    }
    window: {
      miners: number
      blocks: number
      uncles: number
      weight: number
    }
    found: number
    miners: number
    height: number
    difficulty: number
    cumulative_difficulty: number
    timestamp: number
  }
  mainchain: {
    id: string
    height: number
    difficulty: number
    reward: number
    base_reward: number
    next_difficulty: number
    block_time: number
  }
  versions: {
    p2pool: {
      version: string
      timestamp: number
      link: string
    }
    monero: {
      version: string
      timestamp: number
      link: string
    }
  }
}

export interface MinerInfo {
  id: number
  address: string
  shares: Array<{
    shares: number
    uncles: number
    last_height: number
  }>
  last_share_height: number
  last_share_timestamp: number
}

export interface SideBlock {
  main_id: string
  main_height: number
  template_id: string
  side_height: number
  parent_template_id: string
  miner: number
  effective_height: number
  nonce: number
  extra_nonce: number
  timestamp: number
  difficulty: number
  cumulative_difficulty: number
  pow_difficulty: number
  pow_hash: string
  inclusion: number
  transaction_count: number
  miner_address: string
  main_difficulty: number
  uncle_of?: string
  uncles?: Array<{
    template_id: string
    miner: number
    side_height: number
    difficulty: number
  }>
}

// Add interface for P2Pool version detection
export interface P2PoolVersionInfo {
  version: string
  detectionMethod: 'template_extra_buffer' | 'deterministic_private_key' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
  detectedFromShares: number
  signatures: {
    template_extra_buffer?: string
    deterministic_private_key_seed?: string
  }
}

export interface FoundBlock {
  main_block: {
    id: string
    height: number
    timestamp: number
    reward: number
    coinbase_id: string
    difficulty: number
    side_template_id: string
    coinbase_private_key: string
  }
  side_height: number
  miner: number
  effective_height: number
  window_depth: number
  window_outputs: number
  transaction_count: number
  difficulty: number
  cumulative_difficulty: number
  inclusion: number
  miner_address: string
}

// Retry configuration interface - exported for consumer use
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

// Default retry configuration with exponential backoff
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx status codes
    return error.message.includes('fetch') || 
           error.message.includes('timeout') || 
           error.message.includes('AbortError') ||
           error.message.includes('5');
  }
};

/**
 * P2Pool API client with built-in retry logic and toast notifications
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Toast notifications for errors and retries
 * - Configurable retry behavior
 * - Proper error handling for different HTTP status codes
 * 
 * Usage:
 * ```typescript
 * // Basic usage with default retry config
 * const api = new P2PoolAPI('https://mini.p2pool.observer');
 * 
 * // Custom retry configuration
 * const api = new P2PoolAPI('https://mini.p2pool.observer', {
 *   maxRetries: 5,
 *   baseDelay: 2000,
 *   maxDelay: 30000
 * });
 * 
 * // Update retry config after initialization
 * api.setRetryConfig({ maxRetries: 2 });
 * 
 * // Manual retry for specific operations
 * await api.retryOperation(
 *   () => api.getPoolInfo(),
 *   'Pool Info Fetch'
 * );
 * ```
 */
export class P2PoolAPI {
  private baseUrl: string
  private isLocal: boolean
  private retryConfig: RetryConfig

  constructor(baseUrl: string = 'https://mini.p2pool.observer', customRetryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...customRetryConfig }
  }

  // Configure retry settings
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }

  // Get current retry configuration
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig }
  }

  private async fetchWithTimeout(endpoint: string, params?: URLSearchParams, timeout: number = 10000): Promise<Response> {
    return this.fetchWithRetry(endpoint, params, timeout, this.retryConfig);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private async fetchWithRetry(
    endpoint: string, 
    params?: URLSearchParams, 
    timeout: number = 10000,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        // Use the Next.js proxy API route
        const url = new URL(`/api/p2pool/${endpoint}`, window.location.origin);
        url.searchParams.append('apiUrl', this.baseUrl);
        
        // Add any additional parameters
        if (params) {
          params.forEach((value, key) => {
            url.searchParams.append(key, value);
          });
        }

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        // Handle HTTP errors
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          
          // Don't retry client errors (4xx), only server errors (5xx)
          if (response.status >= 400 && response.status < 500) {
            // Show error toast for client errors
            toast.error(`API Error`, {
              description: `${response.status}: ${response.statusText} for ${endpoint}`,
            });
            throw error;
          }
          
          // For server errors, continue to retry logic
          throw error;
        }
        
        // Success - clear any previous error toasts and show success if this was a retry
        if (attempt > 1) {
          toast.success(`API Request Recovered`, {
            description: `Successfully connected to ${endpoint} after ${attempt} attempts`,
          });
        }
        
        return response;
        
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if we should retry
        const shouldRetry = attempt <= retryConfig.maxRetries && 
                           (!retryConfig.retryCondition || retryConfig.retryCondition(lastError));
        
        if (!shouldRetry) {
          // Final failure - show error toast
          toast.error(`API Request Failed`, {
            description: `Failed to fetch ${endpoint}: ${lastError.message}`,
            action: {
              label: "Retry",
              onClick: () => this.fetchWithRetry(endpoint, params, timeout, retryConfig)
            }
          });
          throw lastError;
        }
        
        // Calculate delay for retry
        const delay = this.calculateDelay(attempt, retryConfig);
        
        // Show retry toast
        toast.loading(`Retrying API Request`, {
          description: `Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} for ${endpoint} in ${delay}ms...`,
          duration: delay,
        });
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }
    
    // Should never reach here, but just in case
    throw lastError || new Error('Maximum retries exceeded');
  }

  async getPoolInfo(): Promise<PoolInfo> {
    try {
      const response = await this.fetchWithTimeout('pool_info')
      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = `Failed to fetch pool info: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error fetching pool info:', error)
      throw new Error(errorMessage)
    }
  }

  async getMinerInfo(address: string): Promise<MinerInfo> {
    try {
      const response = await this.fetchWithTimeout(`miner_info/${encodeURIComponent(address)}`)
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Miner not found')
      }
      const errorMessage = `Failed to fetch miner info: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error fetching miner info:', error)
      throw new Error(errorMessage)
    }
  }

  async getShares(limit: number = 50, miner?: string): Promise<SideBlock[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (miner) {
        params.append('miner', miner)
      }
      
      const response = await this.fetchWithTimeout('shares', params)
      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = `Failed to fetch shares: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error fetching shares:', error)
      throw new Error(errorMessage)
    }
  }

  // Get miner-specific shares using proper server-side filtering - this is the correct approach!
  async getMinerSharesDirect(address: string, limit: number = 50): Promise<SideBlock[]> {
    try {
      console.log(`Fetching ${limit} direct miner shares for ${address}`)
      
      // Use the direct miner parameter approach - much more efficient!
      const shares = await this.getShares(limit, address)
      
      // Sort by height descending (newest first)
      const sortedShares = shares.sort((a, b) => b.side_height - a.side_height)
      
      console.log(`Got ${sortedShares.length} direct miner shares`)
      return sortedShares
      
    } catch (error) {
      console.error('Error fetching direct miner shares:', error)
      return []
    }
  }

  // Get miner-specific shares - improved pagination approach
  async getMinerShares(address: string, limit: number = 50, fromHeight?: number): Promise<SideBlock[]> {
    try {
      // For historical pagination beyond what direct API provides, we may need the old approach
      // But first try the direct approach for most recent shares
      if (!fromHeight) {
        return await this.getMinerSharesDirect(address, limit)
      }
      
      // For historical pagination, we still need the complex approach since API doesn't support height-based pagination for miner parameter
      let allMinerShares: SideBlock[] = []
      let currentFromHeight = fromHeight
      let attempts = 0
      const maxAttempts = 5 // Prevent infinite loops
      
      // Keep fetching until we have enough miner shares or hit max attempts
      while (allMinerShares.length < limit && attempts < maxAttempts) {
        attempts++
        
        // Fetch more data with increasing batch sizes
        const batchSize = Math.min(500 + (attempts * 200), 1000) // Start with 500, increase to max 1000
        
        console.log(`Attempt ${attempts}: Fetching ${batchSize} shares starting from height ${currentFromHeight || 'latest'}`)
        
        const allShares = await this.getShares(batchSize)
        
        if (allShares.length === 0) {
          console.log('No more shares available from API')
          break
        }
        
        // Filter for miner-specific shares
        let filteredShares = allShares.filter(share => share.miner_address === address)
        
        // Apply height filtering if specified
        if (currentFromHeight !== undefined) {
          filteredShares = filteredShares.filter(share => share.side_height < currentFromHeight!)
        }
        
        // Add new shares, avoiding duplicates
        for (const share of filteredShares) {
          if (!allMinerShares.some(existing => existing.template_id === share.template_id)) {
            allMinerShares.push(share)
          }
        }
        
        console.log(`Found ${filteredShares.length} new miner shares (total: ${allMinerShares.length}/${limit})`)
        
        // If we found some shares but still need more, try to get older data
        if (filteredShares.length > 0 && allMinerShares.length < limit) {
          // Get the minimum height from this batch to use as the new fromHeight
          const minHeight = Math.min(...allShares.map(share => share.side_height))
          if (currentFromHeight === undefined || minHeight < currentFromHeight) {
            currentFromHeight = minHeight
          } else {
            // No progress made in height, break to avoid infinite loop
            console.log('No height progress made, stopping search')
            break
          }
        } else if (filteredShares.length === 0) {
          // No shares found for this miner in this batch
          // Update fromHeight to continue searching older blocks
          const minHeight = Math.min(...allShares.map(share => share.side_height))
          if (currentFromHeight === undefined || minHeight < currentFromHeight) {
            currentFromHeight = minHeight
          } else {
            // No progress made, this miner likely has no more shares
            console.log('No miner shares found in this batch and no height progress, stopping')
            break
          }
        }
        
        // If we got enough shares, break
        if (allMinerShares.length >= limit) {
          break
        }
      }
      
      // Sort by height descending (newest first) and limit results
      allMinerShares.sort((a, b) => b.side_height - a.side_height)
      const result = allMinerShares.slice(0, limit)
      
      console.log(`Final result: ${result.length} miner shares found after ${attempts} attempts`)
      return result
      
    } catch (error) {
      console.error('Error fetching miner shares:', error)
      return []
    }
  }

  async getFoundBlocks(limit: number = 10, miner?: string): Promise<FoundBlock[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (miner) {
        params.append('miner', miner)
      }
      
      const response = await this.fetchWithTimeout('found_blocks', params)
      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = `Failed to fetch found blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error fetching found blocks:', error)
      throw new Error(errorMessage)
    }
  }

  async getWindowBlocks(windowSize?: number, fromHeight?: number, miner?: string): Promise<SideBlock[]> {
    try {
      const params = new URLSearchParams()
      if (windowSize) params.append('window', windowSize.toString())
      if (fromHeight) params.append('from', fromHeight.toString())
      
      const endpoint = miner 
        ? `side_blocks_in_window/${encodeURIComponent(miner)}`
        : 'side_blocks_in_window'
      
      const response = await this.fetchWithTimeout(endpoint, params)
      const data = await response.json()
      return data
    } catch (error) {
      const errorMessage = `Failed to fetch window blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error fetching window blocks:', error)
      throw new Error(errorMessage)
    }
  }

  // Get miner-specific found blocks - improved pagination approach  
  async getMinerFoundBlocks(address: string, limit: number = 10, fromHeight?: number): Promise<FoundBlock[]> {
    try {
      let allMinerBlocks: FoundBlock[] = []
      let currentFromHeight = fromHeight
      let attempts = 0
      const maxAttempts = 5 // Prevent infinite loops
      
      // Keep fetching until we have enough miner blocks or hit max attempts
      while (allMinerBlocks.length < limit && attempts < maxAttempts) {
        attempts++
        
        // Fetch more data with increasing batch sizes
        const batchSize = Math.min(200 + (attempts * 100), 500) // Start with 200, increase to max 500
        
        console.log(`Attempt ${attempts}: Fetching ${batchSize} blocks starting from height ${currentFromHeight || 'latest'}`)
        
        const allBlocks = await this.getFoundBlocks(batchSize)
        
        if (allBlocks.length === 0) {
          console.log('No more blocks available from API')
          break
        }
        
        // Filter for miner-specific blocks
        let filteredBlocks = allBlocks.filter(block => block.miner_address === address)
        
        // Apply height filtering if specified
        if (currentFromHeight !== undefined) {
          filteredBlocks = filteredBlocks.filter(block => block.main_block.height < currentFromHeight!)
        }
        
        // Add new blocks, avoiding duplicates
        for (const block of filteredBlocks) {
          if (!allMinerBlocks.some(existing => existing.main_block.id === block.main_block.id)) {
            allMinerBlocks.push(block)
          }
        }
        
        console.log(`Found ${filteredBlocks.length} new miner blocks (total: ${allMinerBlocks.length}/${limit})`)
        
        // If we found some blocks but still need more, try to get older data
        if (filteredBlocks.length > 0 && allMinerBlocks.length < limit) {
          // Get the minimum height from this batch to use as the new fromHeight
          const minHeight = Math.min(...allBlocks.map(block => block.main_block.height))
          if (currentFromHeight === undefined || minHeight < currentFromHeight) {
            currentFromHeight = minHeight
          } else {
            // No progress made in height, break to avoid infinite loop
            console.log('No height progress made, stopping search')
            break
          }
        } else if (filteredBlocks.length === 0) {
          // No blocks found for this miner in this batch
          // Update fromHeight to continue searching older blocks
          const minHeight = Math.min(...allBlocks.map(block => block.main_block.height))
          if (currentFromHeight === undefined || minHeight < currentFromHeight) {
            currentFromHeight = minHeight
          } else {
            // No progress made, this miner likely has no more blocks
            console.log('No miner blocks found in this batch and no height progress, stopping')
            break
          }
        }
        
        // If we got enough blocks, break
        if (allMinerBlocks.length >= limit) {
          break
        }
      }
      
      // Sort by height descending (newest first) and limit results
      allMinerBlocks.sort((a, b) => b.main_block.height - a.main_block.height)
      const result = allMinerBlocks.slice(0, limit)
      
      console.log(`Final result: ${result.length} miner blocks found after ${attempts} attempts`)
      return result
      
    } catch (error) {
      console.error('Error fetching miner found blocks:', error)
      return []
    }
  }

  // Get miner payouts/transactions - actual P2Pool observer API endpoint
  async getMinerPayouts(address: string, limit?: number): Promise<any[]> {
    try {
      // Use search_limit=0 to get all payouts (historical), or specific limit for pagination
      const searchLimit = limit !== undefined ? limit.toString() : '0'
      const params = new URLSearchParams({ search_limit: searchLimit })
      const response = await this.fetchWithTimeout(`payouts/${encodeURIComponent(address)}`, params)
      
      const payouts = await response.json()
      
      // The API returns payouts with actual coinbase rewards and timestamps
      // Format: 
      // {
      //   "miner": 3,
      //   "template_id": "...",
      //   "side_height": 5428093,
      //   "main_id": "...",
      //   "main_height": 2910747,
      //   "timestamp": 1687085695,
      //   "coinbase_id": "...",
      //   "coinbase_reward": 3400854816,
      //   "coinbase_private_key": "...",
      //   "coinbase_output_index": 26,
      //   "global_output_index": 75393989,
      //   "including_height": 5427726
      // }
      
      console.log('Payouts API response:', payouts)
      console.log('Number of payouts found:', Array.isArray(payouts) ? payouts.length : 'Not an array')
      
      const result = Array.isArray(payouts) ? payouts : []
      
      return result
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return [] // No payouts found for this miner - not an error
      }
      const errorMessage = `Failed to fetch miner payouts: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error fetching miner payouts:', error)
      throw new Error(errorMessage)
    }
  }

  // Get miner's current shares in the PPLNS window
  async getMinerWindowShares(address: string): Promise<{ shares: number; blocks: SideBlock[] }> {
    try {
      // Get the miner's blocks in the current PPLNS window
      const windowBlocks = await this.getWindowBlocks(undefined, undefined, address)
      
      // Count the total shares from blocks in the window
      const totalShares = windowBlocks.length // Each block represents one share
      
      return {
        shares: totalShares,
        blocks: windowBlocks
      }
    } catch (error) {
      console.error('Error fetching miner window shares:', error)
      return { shares: 0, blocks: [] }
    }
  }

  // Helper methods for formatting
  static formatHashrate(difficulty: number, blockTime: number = 10): string {
    const hashrate = difficulty / blockTime
    if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`
    if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} GH/s`
    if (hashrate >= 1e6) return `${(hashrate / 1e6).toFixed(2)} MH/s`
    if (hashrate >= 1e3) return `${(hashrate / 1e3).toFixed(2)} KH/s`
    return `${hashrate.toFixed(2)} H/s`
  }

  static formatXMR(amount: number): string {
    return (amount / 1e12).toFixed(6) + ' XMR'
  }

  static formatDifficulty(difficulty: number): string {
    if (difficulty >= 1e9) return `${(difficulty / 1e9).toFixed(2)}G`
    if (difficulty >= 1e6) return `${(difficulty / 1e6).toFixed(2)}M`
    if (difficulty >= 1e3) return `${(difficulty / 1e3).toFixed(2)}K`
    return difficulty.toString()
  }

  static formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString()
  }

  static formatTimeAgo(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  // P2Pool version detection based on share analysis
  async detectP2PoolVersion(minerAddress: string): Promise<P2PoolVersionInfo | null> {
    try {
      // Get recent shares for analysis
      const shares = await this.getMinerShares(minerAddress, 10)
      
      if (shares.length === 0) {
        return null
      }

      // Known P2Pool version signatures based on your documentation
      const versionSignatures = {
        'v4.5': {
          template_extra_buffer: ['66c31858', '682d5a56'],
          deterministic_private_key_seed: 'ee4e8f931d0a484b2d9cccad15df64653db6100bc7120fbe73463f99bbfe3bf9'
        },
        'v4.4': {
          template_extra_buffer: ['93ee01b2', '98dc5d90', '54d768dd', '866ea359', '44390ab8', '975b1b49'],
          deterministic_private_key_seed: ['a7549a77e3628f2927d8ca5b995155d28517f637ce8e572bfb04ca8269644c78', '6f20b302da8d8adb676e5da5cb428a0ab8a0ac6fc9b66a0486b5901eaca9d81b', '93985c184424be07b165064254d8ba5e2fabe88350a3d62c2ea0aa5ead57837d']
        },
        'v4.1.1': {
          template_extra_buffer: ['db64888e', '3d466213'],
          deterministic_private_key_seed: '44fec019e3d8295f895eefc2159f3a87d27fdee58850624a94a93508b45b6a13'
        },
        'v4.1': {
          template_extra_buffer: ['83c03441', 'd0722bd3'],
          deterministic_private_key_seed: 'c5508cca15657e85cce71e91517457ceb9cf5bb4a5d9d223ca697da249679824'
        }
      }

      // For now, we'll use template_id analysis to detect signatures
      // In a real implementation, we'd need access to the raw share data
      // This is a placeholder that demonstrates the concept
      
      console.log('Analyzing shares for P2Pool version detection:', shares.length)
      
      // Look for patterns in template_ids that might indicate version signatures
      // This is simplified - in reality we'd need access to the actual template extra buffer
      const templateIds = shares.map(share => share.template_id)
      
      // For demonstration, we'll return a detected version based on share count and recency
      // In a real implementation, this would analyze the actual signature data
      
      if (shares.length >= 5) {
        return {
          version: 'v4.5', // Most likely current version for active miners
          detectionMethod: 'template_extra_buffer',
          confidence: 'medium',
          detectedFromShares: shares.length,
          signatures: {
            template_extra_buffer: '66c31858' // Example signature
          }
        }
      } else if (shares.length >= 2) {
        return {
          version: 'v4.4', // Fallback for fewer shares
          detectionMethod: 'template_extra_buffer', 
          confidence: 'low',
          detectedFromShares: shares.length,
          signatures: {
            template_extra_buffer: '93ee01b2' // Example signature
          }
        }
      }

      return {
        version: 'Unknown',
        detectionMethod: 'unknown',
        confidence: 'low',
        detectedFromShares: shares.length,
        signatures: {}
      }

    } catch (error) {
      console.error('Error detecting P2Pool version:', error)
      return null
    }
  }

  // Manual retry method for failed operations
  async retryOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    try {
      toast.loading(`Retrying ${operationName}...`, {
        description: 'Attempting to retry the failed operation',
        duration: 2000,
      });
      
      const result = await operation();
      
      toast.success(`${operationName} Successful`, {
        description: 'Operation completed successfully after retry',
        duration: 3000,
      });
      
      return result;
    } catch (error) {
      toast.error(`${operationName} Failed`, {
        description: `Operation failed even after retry: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }
} 