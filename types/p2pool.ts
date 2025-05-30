import { LucideIcon } from 'lucide-react'

// Core P2Pool types
export interface PoolInfo {
  sidechain: {
    difficulty: number
    miners: number
    window: {
      miners: number
      weight: number
    }
    found: number
    effort: {
      current: number
      average: number
    }
  }
}

export interface MinerInfo {
  shares: Array<{
    shares: number
    uncles: number
  }>
  last_share_timestamp: number
}

export interface SideBlock {
  template_id: string
  side_height: number
  difficulty: number
  timestamp: number
  miner_address?: string
}

export interface FoundBlock {
  main_block: {
    id: string
    height: number
    reward: number
    timestamp: number
  }
  miner_address?: string
}

export interface MinerWindowShares {
  shares: number
  blocks: SideBlock[]
}

export interface MinerPayout {
  template_id?: string
  coinbase_reward: number
  timestamp: number
  main_height?: number
}

// Dashboard state types
export interface DashboardState {
  poolInfo: PoolInfo | null
  minerInfo: MinerInfo | null
  recentShares: SideBlock[]
  foundBlocks: FoundBlock[]
  recentMinerShares: SideBlock[]
  minerBlocks: FoundBlock[]
  minerPayouts: MinerPayout[]
  minerWindowShares: MinerWindowShares
}

export interface UIState {
  loading: boolean
  refreshing: boolean
  loadingMoreBlocks: boolean
  hasMoreBlocks: boolean
  error: string | null
  hasScrolledForCurrentAddress: boolean
}

export interface SettingsState {
  minerAddress: string
  searchedMinerAddress: string
  apiUrl: string
}

export interface ConnectionState {
  isConnected: boolean
  lastUpdate: Date | null
  displayedPayoutsCount: number
}

export interface PriceState {
  xmrPrice: number | null
  priceLoading: boolean
  lastPriceUpdate: Date | null
}

// Activity status types
export interface ActivityStatus {
  isActive: boolean
  statusText: string
  reason: string
}

// API Response types
export interface PriceData {
  monero: {
    usd: number
    last_updated_at?: number
  }
}

// Component prop types
export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  gradient: string
  iconGradient: string
  decorativeColor: string
  valueGradient: string
  refreshing?: boolean
  children?: React.ReactNode
}

export interface MinerActivityStatusProps {
  minerInfo: MinerInfo | null
  minerWindowShares: MinerWindowShares
}

export interface ShareListItemProps {
  share: SideBlock
  formatTimeAgo: (timestamp: number) => string
}

export interface BlockListItemProps {
  block: FoundBlock
  formatTimeAgo: (timestamp: number) => string
  formatXMR: (amount: number) => string
  formatUSDOnly?: (amount: number) => string
  xmrPrice?: number | null
}

export interface PayoutListItemProps {
  payout: MinerPayout
  formatTimeAgo: (timestamp: number) => string
  formatXMR: (amount: number) => string
  formatUSDOnly?: (amount: number) => string
  xmrPrice?: number | null
} 