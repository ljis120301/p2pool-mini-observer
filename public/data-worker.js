// Web Worker for heavy data processing tasks
// This runs on a separate thread to keep the UI responsive

const formatters = {
  formatHashrate: (difficulty) => {
    const hashrate = difficulty / 30 // Approximate conversion
    if (hashrate >= 1e12) {
      return `${(hashrate / 1e12).toFixed(2)} TH/s`
    } else if (hashrate >= 1e9) {
      return `${(hashrate / 1e9).toFixed(2)} GH/s`
    } else if (hashrate >= 1e6) {
      return `${(hashrate / 1e6).toFixed(2)} MH/s`
    } else if (hashrate >= 1e3) {
      return `${(hashrate / 1e3).toFixed(2)} KH/s`
    } else {
      return `${hashrate.toFixed(2)} H/s`
    }
  },

  formatDifficulty: (difficulty) => {
    if (difficulty >= 1e12) {
      return `${(difficulty / 1e12).toFixed(2)}T`
    } else if (difficulty >= 1e9) {
      return `${(difficulty / 1e9).toFixed(2)}G`
    } else if (difficulty >= 1e6) {
      return `${(difficulty / 1e6).toFixed(2)}M`
    } else if (difficulty >= 1e3) {
      return `${(difficulty / 1e3).toFixed(2)}K`
    } else {
      return difficulty.toLocaleString()
    }
  },

  formatXMR: (amount) => {
    return `${(amount / 1e12).toFixed(6)} XMR`
  },

  formatTimeAgo: (timestamp) => {
    const now = Date.now() / 1000
    const diffSeconds = Math.floor(now - timestamp)
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`
    } else if (diffSeconds < 86400) {
      return `${Math.floor(diffSeconds / 3600)}h ago`
    } else {
      return `${Math.floor(diffSeconds / 86400)}d ago`
    }
  }
}

const processors = {
  // Process large datasets with heavy calculations
  processShares: (shares) => {
    return shares.map(share => ({
      ...share,
      formatted_time: formatters.formatTimeAgo(share.timestamp),
      effort: share.difficulty ? ((share.timestamp - share.prev_timestamp) * share.difficulty) : 0
    }))
  },

  // Calculate mining statistics
  calculateMinerStats: (minerInfo, minerWindowShares, poolInfo) => {
    if (!minerInfo || !poolInfo) return null

    const totalDifficulty = poolInfo.sidechain.difficulty
    const minerHashrate = minerWindowShares.shares > 0 
      ? (minerWindowShares.shares * totalDifficulty) / (10 * 60) // Rough estimate
      : 0

    const poolHashrate = totalDifficulty / 30
    const poolShare = poolHashrate > 0 ? (minerHashrate / poolHashrate) * 100 : 0

    return {
      minerHashrate: formatters.formatHashrate(minerHashrate * 30), // Convert back to difficulty scale
      poolShare: poolShare.toFixed(4),
      estimatedTimeToShare: minerHashrate > 0 ? Math.round(totalDifficulty / minerHashrate) : 0,
      efficiency: minerInfo.shares.length > 0 ? 
        (minerInfo.shares.reduce((sum, s) => sum + s.shares, 0) / 
         (minerInfo.shares.reduce((sum, s) => sum + s.shares + s.uncles, 0) || 1)) * 100 : 0
    }
  },

  // Filter and sort large datasets efficiently
  filterRecentPayouts: (payouts, hours = 24) => {
    const cutoffTime = (Date.now() / 1000) - (hours * 3600)
    return payouts
      .filter(payout => payout.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp - a.timestamp)
  },

  // Process blocks with reward calculations
  processBlocks: (blocks, xmrPrice) => {
    return blocks.map(block => ({
      ...block,
      formatted_time: formatters.formatTimeAgo(block.timestamp),
      formatted_reward: formatters.formatXMR(block.coinbase_reward),
      usd_value: xmrPrice ? (block.coinbase_reward / 1e12) * xmrPrice : null
    }))
  },

  // Aggregate statistics over time periods
  aggregateTimeSeries: (data, timeWindow = 3600) => {
    const buckets = new Map()
    
    data.forEach(item => {
      const bucket = Math.floor(item.timestamp / timeWindow) * timeWindow
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { count: 0, total: 0, items: [] })
      }
      const bucketData = buckets.get(bucket)
      bucketData.count++
      bucketData.total += item.value || 1
      bucketData.items.push(item)
    })

    return Array.from(buckets.entries()).map(([timestamp, data]) => ({
      timestamp,
      count: data.count,
      average: data.total / data.count,
      total: data.total,
      items: data.items
    })).sort((a, b) => b.timestamp - a.timestamp)
  }
}

// Message handler
self.onmessage = function(e) {
  const { id, type, payload } = e.data

  try {
    let result

    switch (type) {
      case 'PROCESS_SHARES':
        result = processors.processShares(payload.shares)
        break

      case 'CALCULATE_MINER_STATS':
        result = processors.calculateMinerStats(
          payload.minerInfo, 
          payload.minerWindowShares, 
          payload.poolInfo
        )
        break

      case 'FILTER_RECENT_PAYOUTS':
        result = processors.filterRecentPayouts(payload.payouts, payload.hours)
        break

      case 'PROCESS_BLOCKS':
        result = processors.processBlocks(payload.blocks, payload.xmrPrice)
        break

      case 'AGGREGATE_TIME_SERIES':
        result = processors.aggregateTimeSeries(payload.data, payload.timeWindow)
        break

      case 'BATCH_PROCESS':
        // Process multiple operations in a single worker call
        result = {}
        for (const [key, operation] of Object.entries(payload.operations)) {
          switch (operation.type) {
            case 'PROCESS_SHARES':
              result[key] = processors.processShares(operation.payload.shares)
              break
            case 'CALCULATE_MINER_STATS':
              result[key] = processors.calculateMinerStats(
                operation.payload.minerInfo,
                operation.payload.minerWindowShares,
                operation.payload.poolInfo
              )
              break
            // Add more cases as needed
          }
        }
        break

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }

    // Send result back to main thread
    self.postMessage({
      id,
      success: true,
      result
    })

  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      id,
      success: false,
      error: error.message
    })
  }
} 