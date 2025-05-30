import { P2PoolAPI } from "@/lib/p2pool-api"
import { PriceAPI } from "@/lib/price-api"

export class FormattingUtils {
  static formatHashrate = P2PoolAPI.formatHashrate
  static formatXMR = P2PoolAPI.formatXMR
  static formatTimeAgo = P2PoolAPI.formatTimeAgo
  static formatTime = P2PoolAPI.formatTime
  static formatDifficulty = P2PoolAPI.formatDifficulty
  
  static formatXMRWithUSD(amount: number, xmrPrice: number | null) {
    if (xmrPrice === null) return P2PoolAPI.formatXMR(amount)
    return PriceAPI.formatXMRWithUSD(amount, xmrPrice)
  }
  
  static formatUSDOnly(amount: number, xmrPrice: number | null) {
    if (xmrPrice === null) return ''
    return PriceAPI.formatUSD(amount, xmrPrice)
  }

  static calculatePoolShare(
    minerWindowShares: { shares: number; blocks: any[] },
    minerInfo: any,
    poolInfo: any
  ): number {
    const windowWeight = poolInfo.sidechain.window.weight
    
    // Get total difficulty of miner's shares in the window
    let minerTotalDifficulty = 0
    if (minerWindowShares.blocks && minerWindowShares.blocks.length > 0) {
      minerTotalDifficulty = minerWindowShares.blocks.reduce((sum: number, block: any) => sum + block.difficulty, 0)
    } else {
      // Fallback: use the shares count from minerInfo
      minerTotalDifficulty = minerInfo.shares.reduce((sum: number, s: any) => sum + s.shares, 0)
    }
    
    // Calculate percentage using difficulty weighting
    let percentage = 0
    if (windowWeight > 0 && minerTotalDifficulty > 0) {
      percentage = (minerTotalDifficulty / windowWeight) * 100
    }
    
    // Debug logging
    console.log('Pool Share Debug - Final:', {
      minerTotalDifficulty,
      windowWeight,
      currentWindowShares: minerWindowShares.shares,
      percentage: percentage.toFixed(6),
      hasWindowBlocks: minerWindowShares.blocks?.length || 0,
      calculationMethod: 'difficulty_weighted_final'
    })
    
    return percentage
  }

  static filterRecentPayouts(payouts: any[]): any[] {
    if (!Array.isArray(payouts)) return []
    
    const now = Math.floor(Date.now() / 1000)
    const twentyFourHoursAgo = now - (24 * 60 * 60)
    
    const recentPayouts = payouts.filter(payout => 
      payout && 
      typeof payout.timestamp === 'number' && 
      payout.timestamp >= twentyFourHoursAgo
    )
    
    console.log(`Filtering payouts: ${payouts.length} total -> ${recentPayouts.length} in last 24h`)
    console.log('24h cutoff timestamp:', twentyFourHoursAgo, new Date(twentyFourHoursAgo * 1000).toLocaleString())
    
    return recentPayouts
  }

  static getDisplayedPayouts(payouts: any[], displayCount: number): any[] {
    if (!Array.isArray(payouts)) return []
    
    return payouts
      .filter(payout => payout && typeof payout.coinbase_reward === 'number' && typeof payout.timestamp === 'number')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, displayCount)
  }
} 