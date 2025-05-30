// Price API types and client for cryptocurrency price conversion

export interface PriceData {
  monero: {
    usd: number
    last_updated_at?: number
  }
}

export class PriceAPI {
  private baseUrl: string
  private useProxy: boolean

  constructor(useProxy: boolean = true) {
    this.baseUrl = useProxy ? '/api/price' : 'https://api.coingecko.com/api/v3'
    this.useProxy = useProxy
  }

  private async fetchWithTimeout(endpoint: string, timeout: number = 10000): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const url = this.useProxy 
        ? `${this.baseUrl}/${endpoint}`
        : `${this.baseUrl}/${endpoint}`

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async getXMRPrice(): Promise<number> {
    try {
      const response = await this.fetchWithTimeout('simple/price?ids=monero&vs_currencies=usd&include_last_updated_at=true')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PriceData = await response.json()
      
      // Check if price data is recent (within last 10 minutes)
      if (data.monero.last_updated_at) {
        const now = Math.floor(Date.now() / 1000)
        const tenMinutesAgo = now - (10 * 60)
        
        if (data.monero.last_updated_at < tenMinutesAgo) {
          // Only warn about stale data, don't error out
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('XMR price data is stale:', new Date(data.monero.last_updated_at * 1000))
          }
        }
      }
      
      return data.monero.usd
    } catch (error) {
      // Silent handling for network outages - don't log to console to prevent Next.js errors
      // Only log in development mode for debugging purposes
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('XMR price fetch failed (expected during network outages):', error)
      }
      // Return null instead of throwing to gracefully handle price fetch failures
      throw new Error(`Failed to fetch XMR price: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper method to format XMR amount with USD conversion
  static formatXMRWithUSD(xmrAmount: number, usdPrice: number): string {
    const xmr = (xmrAmount / 1e12).toFixed(6)
    const usd = ((xmrAmount / 1e12) * usdPrice).toFixed(2)
    return `${xmr} XMR ($${usd})`
  }

  // Helper method to format just the USD value
  static formatUSD(xmrAmount: number, usdPrice: number): string {
    const usd = ((xmrAmount / 1e12) * usdPrice).toFixed(2)
    return `$${usd}`
  }
} 