import { useState, useEffect, useCallback, useRef } from 'react'

// Basic debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<number | undefined>(undefined)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<number | undefined>(undefined)
  const lastExecutedRef = useRef<number>(0)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastExecution = now - lastExecutedRef.current

      if (timeSinceLastExecution >= delay) {
        lastExecutedRef.current = now
        callbackRef.current(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = window.setTimeout(() => {
          lastExecutedRef.current = Date.now()
          callbackRef.current(...args)
        }, delay - timeSinceLastExecution)
      }
    },
    [delay]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

// Smart debounce for search/filter operations
export function useSmartDebounce<T>(
  value: T,
  {
    shortDelay = 150,    // For short inputs (< 3 characters)
    longDelay = 500,     // For longer inputs
    threshold = 3        // Character threshold to switch delays
  }: {
    shortDelay?: number
    longDelay?: number
    threshold?: number
  } = {}
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const valueString = String(value)
    const delay = valueString.length < threshold ? shortDelay : longDelay

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, shortDelay, longDelay, threshold])

  return debouncedValue
}

// Debounced state hook that also provides immediate value
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue)
  const debouncedValue = useDebounce(immediateValue, delay)

  return [immediateValue, debouncedValue, setImmediateValue]
} 