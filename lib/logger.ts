type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatMessage('debug', message, data)
      console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data)
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.formatMessage('info', message, data)
      console.info(`[INFO] ${entry.timestamp} - ${message}`, data)
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatMessage('warn', message, data)
      console.warn(`[WARN] ${entry.timestamp} - ${message}`, data)
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      const entry = this.formatMessage('error', message, error)
      console.error(`[ERROR] ${entry.timestamp} - ${message}`, error)
    }
  }

  // Specific mining-related logging methods
  mining = {
    activityStatus: (data: any) => this.debug('Activity Status Debug', data),
    poolShare: (data: any) => this.debug('Pool Share Debug - Final', data),
    payoutFiltering: (total: number, recent: number) => 
      this.debug(`Filtering payouts: ${total} total -> ${recent} in last 24h`),
    dataFetch: (address: string, isNewSearch: boolean) => 
      this.info('Fetching all data', { address, isNewSearch }),
    dataFetchSuccess: () => this.info('All data fetched successfully'),
    dataFetchError: (error: any) => this.error('Error fetching data', error),
    priceUpdate: (price: number) => this.info('XMR price updated', { price })
  }
}

export const logger = new Logger() 