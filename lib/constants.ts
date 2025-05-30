// Time constants (in seconds)
export const TIME_CONSTANTS = {
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_DAY: 86400,
  REFRESH_INTERVAL: 30000, // 30 seconds
  PRICE_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  SCROLL_DELAY: 100,
  ACTIVITY_THRESHOLDS: {
    TWO_HOURS: 7200,
    FOUR_HOURS: 14400,
    EIGHT_HOURS: 28800,
  }
} as const

// UI Constants
export const UI_CONSTANTS = {
  LOAD_BATCH_SIZE: 20,
  INITIAL_PAYOUTS_COUNT: 10,
  MORE_PAYOUTS_INCREMENT: 20,
  DEFAULT_SHARES_LIMIT: 30,
  DEFAULT_BLOCKS_LIMIT: 10,
  REQUEST_LIMIT_SHARES: 25,
  REQUEST_LIMIT_BLOCKS: 15,
} as const

// Storage keys
export const STORAGE_KEYS = {
  MINER_ADDRESS: 'p2pool-miner-address',
  API_URL: 'p2pool-api-url'
} as const

// Default values
export const DEFAULTS = {
  API_URL: 'https://mini.p2pool.observer'
} as const 