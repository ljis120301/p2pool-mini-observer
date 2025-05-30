import { P2PoolAPI } from "@/lib/p2pool-api"

interface MinerActivityStatusProps {
  minerInfo: any | null
  minerWindowShares: { shares: number; blocks: any[] }
}

interface ActivityStatus {
  isActive: boolean
  statusText: string
  reason: string
}

export function getMinerActivityStatus(
  minerInfo: any | null,
  minerWindowShares: { shares: number; blocks: any[] }
): ActivityStatus {
  if (!minerInfo || !minerWindowShares) {
    return { isActive: false, statusText: 'No Data', reason: 'No miner data available' }
  }

  const now = Math.floor(Date.now() / 1000)
  const lastShareAgo = now - minerInfo.last_share_timestamp
  const hasWindowShares = minerWindowShares.shares > 0
  
  // Debug logging
  console.log('Activity Status Debug:', {
    lastShareTimestamp: minerInfo.last_share_timestamp,
    lastShareDate: new Date(minerInfo.last_share_timestamp * 1000).toLocaleString(),
    lastShareAgoHours: (lastShareAgo / 3600).toFixed(1),
    windowShares: minerWindowShares.shares,
    hasWindowShares
  })
  
  if (!hasWindowShares) {
    if (lastShareAgo > 86400) { // > 24 hours
      const daysAgo = Math.floor(lastShareAgo / 86400)
      return { 
        isActive: false, 
        statusText: 'Inactive', 
        reason: `No PPLNS shares, last: ${daysAgo}d ago` 
      }
    } else {
      const hoursAgo = Math.floor(lastShareAgo / 3600)
      return { 
        isActive: false, 
        statusText: 'Inactive', 
        reason: `No PPLNS shares, last: ${hoursAgo}h ago` 
      }
    }
  }
  
  // Has shares in window - check recency for activity level
  if (lastShareAgo <= 7200) { // 2 hours
    return { 
      isActive: true, 
      statusText: 'Currently Mining', 
      reason: `${minerWindowShares.shares} PPLNS shares, last: ${P2PoolAPI.formatTimeAgo(minerInfo.last_share_timestamp)}` 
    }
  }
  
  if (lastShareAgo <= 14400) { // 4 hours  
    return { 
      isActive: true, 
      statusText: 'Currently Mining', 
      reason: `${minerWindowShares.shares} PPLNS shares, last: ${Math.floor(lastShareAgo / 3600)}h ago` 
    }
  }
  
  if (lastShareAgo <= 28800) { // 8 hours
    return { 
      isActive: true, 
      statusText: 'Low Activity', 
      reason: `${minerWindowShares.shares} PPLNS shares, last: ${Math.floor(lastShareAgo / 3600)}h ago` 
    }
  }
  
  return { 
    isActive: false, 
    statusText: 'Inactive', 
    reason: `${minerWindowShares.shares} old PPLNS shares, last: ${Math.floor(lastShareAgo / 3600)}h ago` 
  }
}

export function MinerActivityIndicator({ minerInfo, minerWindowShares }: MinerActivityStatusProps) {
  const activityStatus = getMinerActivityStatus(minerInfo, minerWindowShares)
  
  return (
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="relative group">
        <div className={`absolute inset-0 rounded-full blur-sm ${
          activityStatus.isActive 
            ? (activityStatus.statusText.includes('Currently Mining') 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-yellow-400 animate-pulse')
            : 'bg-red-400'
        }`}></div>
        <div className={`relative w-6 h-6 rounded-full border-2 border-white/50 shadow-lg ${
          activityStatus.isActive 
            ? (activityStatus.statusText.includes('Currently Mining') 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-yellow-500 animate-pulse')
            : 'bg-red-500'
        }`}></div>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xl font-bold block text-blue-900 dark:text-blue-100 drop-shadow-sm">
          {activityStatus.statusText}
        </span>
        <span className="text-sm text-blue-700/80 dark:text-blue-300/80 font-medium block bg-white/30 dark:bg-blue-950/30 px-2 py-1 rounded-md mt-1 backdrop-blur-sm">
          {activityStatus.reason}
        </span>
      </div>
    </div>
  )
} 