import { Card, CardContent } from "@/components/ui/card"
import { P2PoolAPI } from "@/lib/p2pool-api"

interface ShareListItemProps {
  share: {
    template_id: string
    side_height: number
    difficulty: number
    timestamp: number
  }
  formatTimeAgo: (timestamp: number) => string
}

interface BlockListItemProps {
  block: {
    main_block: {
      id: string
      height: number
      reward: number
      timestamp: number
    }
    miner_address?: string
  }
  formatTimeAgo: (timestamp: number) => string
  formatXMR: (amount: number) => string
  formatUSDOnly?: (amount: number) => string
  xmrPrice?: number | null
}

interface PayoutListItemProps {
  payout: {
    template_id?: string
    coinbase_reward: number
    timestamp: number
    main_height?: number
  }
  formatTimeAgo: (timestamp: number) => string
  formatXMR: (amount: number) => string
  formatUSDOnly?: (amount: number) => string
  xmrPrice?: number | null
}

export function ShareListItem({ share, formatTimeAgo }: ShareListItemProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/60 dark:border-green-800/60">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 group-hover:scale-110 transition-transform duration-200">
                <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 rounded-sm shadow-sm"></div>
              </div>
              <div>
                <div className="font-semibold text-green-700 dark:text-green-300 text-sm">
                  Share #{share.side_height.toLocaleString()}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70">
                  P2Pool Sidechain
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-10">
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {P2PoolAPI.formatDifficulty(share.difficulty)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
              {formatTimeAgo(share.timestamp)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BlockListItem({ 
  block, 
  formatTimeAgo, 
  formatXMR, 
  formatUSDOnly,
  xmrPrice 
}: BlockListItemProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/60 dark:border-blue-800/60">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:scale-110 transition-transform duration-200">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-full shadow-sm"></div>
              </div>
              <div>
                <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                  Block #{block.main_block.height.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  Found Block
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-10">
              <div className="flex items-center gap-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {formatXMR(block.main_block.reward)}
                </span>
                {xmrPrice && formatUSDOnly && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {formatUSDOnly(block.main_block.reward)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
              {formatTimeAgo(block.main_block.timestamp)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PayoutListItem({ 
  payout, 
  formatTimeAgo, 
  formatXMR, 
  formatUSDOnly,
  xmrPrice 
}: PayoutListItemProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200/60 dark:border-purple-800/60">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 group-hover:scale-110 transition-transform duration-200">
                <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-400 dark:to-pink-500 rounded-sm shadow-sm"></div>
              </div>
              <div>
                <div className="font-semibold text-purple-700 dark:text-purple-300 text-sm">
                  Payout Received
                </div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                  {payout.main_height ? `Block #${payout.main_height}` : 'Payout'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-10">
              <div className="flex items-center gap-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {formatXMR(payout.coinbase_reward)}
                </span>
                {xmrPrice && formatUSDOnly && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {formatUSDOnly(payout.coinbase_reward)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
              {formatTimeAgo(payout.timestamp)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 