/**
 * Validation utilities for P2Pool dashboard inputs
 */

// Monero address patterns
const MONERO_ADDRESS_PATTERNS = {
  STANDARD: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
  INTEGRATED: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{104}$/,
  SUBADDRESS: /^8[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/
} as const

export interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

/**
 * Validates a Monero address
 */
export function validateMinerAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' }
  }

  const trimmed = address.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Address cannot be empty' }
  }

  // Check for basic format
  if (trimmed.length < 95 || trimmed.length > 106) {
    return { 
      isValid: false, 
      error: 'Invalid address length. Monero addresses should be 95-106 characters long.' 
    }
  }

  // Check if it matches any valid Monero address pattern
  const isStandard = MONERO_ADDRESS_PATTERNS.STANDARD.test(trimmed)
  const isIntegrated = MONERO_ADDRESS_PATTERNS.INTEGRATED.test(trimmed)
  const isSubaddress = MONERO_ADDRESS_PATTERNS.SUBADDRESS.test(trimmed)

  if (!isStandard && !isIntegrated && !isSubaddress) {
    return { 
      isValid: false, 
      error: 'Invalid Monero address format. Address must start with 4 (standard/integrated) or 8 (subaddress).' 
    }
  }

  // Add warnings for specific types
  if (isIntegrated) {
    return { 
      isValid: true, 
      warning: 'Integrated address detected. Consider using a standard address for mining.' 
    }
  }

  if (isSubaddress) {
    return { 
      isValid: true, 
      warning: 'Subaddress detected. Ensure your mining software supports subaddresses.' 
    }
  }

  return { isValid: true }
}

/**
 * Validates API URL
 */
export function validateApiUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'API URL is required' }
  }

  const trimmed = url.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'API URL cannot be empty' }
  }

  try {
    const urlObj = new URL(trimmed)
    
    // Must be HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { 
        isValid: false, 
        error: 'API URL must use HTTP or HTTPS protocol' 
      }
    }

    // Warn about HTTP in production
    if (urlObj.protocol === 'http:' && urlObj.hostname !== 'localhost' && !urlObj.hostname.startsWith('192.168.')) {
      return { 
        isValid: true, 
        warning: 'Using HTTP instead of HTTPS may be insecure' 
      }
    }

    return { isValid: true }
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid URL format' 
    }
  }
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 200) // Limit length
}

/**
 * Validates numeric input
 */
export function validateNumericInput(value: string | number, min?: number, max?: number): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' }
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `Must be at least ${min}` }
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `Must be at most ${max}` }
  }

  return { isValid: true }
}

/**
 * Debounced validation for real-time input
 */
export function createDebouncedValidator<T>(
  validator: (value: T) => ValidationResult,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout

  return (value: T): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        resolve(validator(value))
      }, delay)
    })
  }
} 