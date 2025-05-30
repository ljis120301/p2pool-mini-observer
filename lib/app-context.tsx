"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PriceAPI } from '@/lib/price-api'

interface AppContextType {
  // XMR Price state
  xmrPrice: number | null
  lastPriceUpdate: Date | null
  priceLoading: boolean
  
  // Connection state
  isConnected: boolean
  lastUpdate: Date | null
  refreshing: boolean
  loading: boolean
  
  // Refresh trigger
  refreshTrigger: number
  
  // Functions
  onRefresh: () => void
  setIsConnected: (connected: boolean) => void
  setLastUpdate: (date: Date | null) => void
  setRefreshing: (refreshing: boolean) => void
  setLoading: (loading: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  // XMR Price state
  const [xmrPrice, setXmrPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const priceApi = new PriceAPI()

  // XMR Price fetching
  const fetchXMRPrice = async () => {
    try {
      setPriceLoading(true)
      const price = await priceApi.getXMRPrice()
      setXmrPrice(price)
      setLastPriceUpdate(new Date())
      console.log('XMR price updated:', price)
    } catch (error) {
      console.error('Failed to fetch XMR price:', error)
    } finally {
      setPriceLoading(false)
    }
  }

  // Functions
  const onRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Effects
  useEffect(() => {
    fetchXMRPrice()
    const priceInterval = setInterval(fetchXMRPrice, 5 * 60 * 1000) // Update every 5 minutes
    return () => clearInterval(priceInterval)
  }, [])

  const contextValue: AppContextType = {
    xmrPrice,
    lastPriceUpdate,
    priceLoading,
    isConnected,
    lastUpdate,
    refreshing,
    loading,
    refreshTrigger,
    onRefresh,
    setIsConnected,
    setLastUpdate,
    setRefreshing,
    setLoading
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
} 