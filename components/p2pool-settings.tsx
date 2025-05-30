"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff,
  InfoIcon,
  Search,
  Loader2
} from "lucide-react"

interface P2PoolSettingsProps {
  apiUrl: string
  onApiUrlChange: (url: string) => void
  minerAddress: string
  onMinerAddressChange: (address: string) => void
  onMinerSearch: (address: string) => void
  isConnected: boolean
  refreshing?: boolean
}

// Default to mini p2pool observer
const DEFAULT_API_URL = "https://mini.p2pool.observer"

export function P2PoolSettings({
  apiUrl,
  onApiUrlChange,
  minerAddress,
  onMinerAddressChange,
  onMinerSearch,
  isConnected,
  refreshing
}: P2PoolSettingsProps) {
  const [searchingWallet, setSearchingWallet] = useState(false)
  const [localMinerAddress, setLocalMinerAddress] = useState(minerAddress)
  const [hasSearched, setHasSearched] = useState(false)

  // Set default API URL on component mount
  useEffect(() => {
    if (!apiUrl) {
      onApiUrlChange(DEFAULT_API_URL)
    }
  }, [apiUrl, onApiUrlChange])

  // Update local state when prop changes
  useEffect(() => {
    setLocalMinerAddress(minerAddress)
    // If minerAddress is not empty, it means a search has been performed
    if (minerAddress) {
      setHasSearched(true)
    }
  }, [minerAddress])

  const validateMinerAddress = (address: string): boolean => {
    // Basic Monero address validation (simplified)
    if (!address) return true // Empty is valid (optional)
    
    // Monero addresses are typically 95 characters long and start with 4
    const isValidLength = address.length === 95
    const startsWithFour = address.startsWith('4')
    
    return isValidLength && startsWithFour
  }

  const handleMinerSearch = async () => {
    if (hasSearched) {
      // Clear functionality
      onMinerAddressChange('')
      onMinerSearch('')
      setHasSearched(false)
      setLocalMinerAddress('')
      return
    }

    if (localMinerAddress.trim() && validateMinerAddress(localMinerAddress)) {
      setSearchingWallet(true)
      
      try {
        onMinerAddressChange(localMinerAddress)
        onMinerSearch(localMinerAddress)
        setHasSearched(true)
        
      } catch (error) {
        console.error('Error searching wallet:', error)
      } finally {
        setSearchingWallet(false)
      }
    }
  }

  const handleMinerInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMinerSearch()
    }
  }

  const isValidMinerAddress = validateMinerAddress(localMinerAddress)

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-200/40 dark:border-indigo-700/40 shadow-xl dark:hover:shadow-2xl transition-all duration-500">
      {/* Layered crystal-like background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-indigo-50/70 to-purple-100/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-blue-950/35"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.12),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.06),_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(147,51,234,0.1),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,_rgba(147,51,234,0.05),_transparent_50%)]"></div>
      
      {/* Hexagonal pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '30px 30px'
      }}></div>
      
      {/* Floating crystal elements */}
      <div className="absolute top-6 right-6 w-32 h-32 bg-gradient-conic from-indigo-200/25 via-purple-200/20 to-blue-200/15 dark:from-indigo-700/20 dark:via-purple-700/15 dark:to-blue-700/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-conic from-blue-200/30 via-indigo-200/25 to-purple-200/20 dark:from-blue-700/25 dark:via-indigo-700/20 dark:to-purple-700/15 rounded-full blur-2xl"></div>
      
      {/* Settings gear pattern */}
      <div className="absolute top-2 right-2 opacity-20">
        <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
        </svg>
      </div>
      
      {/* Border accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent dark:via-indigo-500/50"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent dark:via-purple-500/50"></div>
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-400/60 to-transparent dark:via-blue-500/40"></div>
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-indigo-400/60 to-transparent dark:via-indigo-500/40"></div>

      <GlowingEffect 
        disabled={false}
        proximity={100}
        spread={30}
        blur={2}
      />
      
      <CardHeader className="pb-4 relative z-10 border-b border-indigo-200/30 dark:border-indigo-700/30">
        <CardTitle className="flex items-center text-xl">
          <div className="relative group mr-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
            <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-400/90 to-purple-500/90 dark:from-indigo-600/90 dark:to-purple-700/90 shadow-2xl border border-white/30 dark:border-white/20 backdrop-blur-sm">
              {/* White overlay bar behind the icon */}
              <div className="absolute inset-[2px] bg-gradient-to-br from-white/40 via-indigo-100/30 to-purple-200/20 dark:from-white/10 dark:via-indigo-800/20 dark:to-purple-900/15 rounded-xl"></div>
              <div className="relative z-10">
                <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-2xl" />
              </div>
            </div>
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-indigo-900 dark:text-indigo-100 text-xl sm:text-2xl drop-shadow-sm tracking-tight">
                P2Pool <span className="hidden sm:inline">Mini </span>Configuration
              </span>
            </div>
            <div className="text-xs sm:text-sm text-indigo-700/90 dark:text-indigo-300/90 font-medium">
              <span className="hidden sm:inline">Connected to P2Pool Mini Observer - </span>Track your mining progress
            </div>
          </div>
          <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-indigo-600 border-t-transparent drop-shadow-lg"></div>
            )}
          </div>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-indigo-700/90 dark:text-indigo-300/90 font-medium mt-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-white/90 via-indigo-50/70 to-purple-50/50 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-blue-950/50 rounded-xl border border-indigo-300/40 dark:border-indigo-600/40 backdrop-blur-sm shadow-inner">
          <div className="flex items-center space-x-2 min-h-[20px]">
            <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="flex-1">
              <span className="hidden sm:inline">Real-time P2Pool mining data and personal statistics</span>
              <span className="sm:hidden">Real-time mining data & stats</span>
            </span>
            {refreshing && (
              <div className="text-xs text-indigo-600 flex items-center flex-shrink-0">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span className="hidden sm:inline">Refreshing...</span>
              </div>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 relative z-10">
        {/* Connection Status */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white/70 via-indigo-50/50 to-purple-50/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg">
          {/* Background pattern for status card */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 dark:to-transparent"></div>
          <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-indigo-200/20 to-purple-300/15 dark:from-indigo-800/20 dark:to-purple-700/15 rounded-full blur-sm"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className={`absolute inset-0 rounded-full blur-sm ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <div className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white/50 shadow-lg flex items-center justify-center ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {isConnected ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  ) : (
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold flex items-center min-h-[24px] text-indigo-900 dark:text-indigo-100 text-sm sm:text-base">
                  {isConnected ? "Connected" : "Disconnected"}
                  <div className="flex items-center justify-center w-6 h-4 ml-2 flex-shrink-0">
                    {refreshing && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                    )}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-indigo-700/80 dark:text-indigo-300/80 min-h-[20px] font-medium">
                  <span className="block sm:inline">P2Pool Mini Observer</span>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline text-xs">{DEFAULT_API_URL}</span>
                  {refreshing && <span className="text-purple-600"> • Refreshing...</span>}
                </div>
              </div>
            </div>
            
            <Badge 
              variant={isConnected ? "default" : "destructive"} 
              className={`flex-shrink-0 min-w-[80px] justify-center shadow-lg text-xs sm:text-sm ${
                isConnected 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-green-400" 
                  : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-red-400"
              }`}
            >
              {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {refreshing ? "Refreshing" : isConnected ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>

        {/* Miner Address Search */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Label htmlFor="miner-address" className="text-base sm:text-lg font-semibold text-indigo-900 dark:text-indigo-100 flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-sm"></div>
              <span>Track Your Mining Address</span>
            </Label>
          </div>
          
          {/* Mobile: Stack input and button vertically */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex-1 relative">
              <Input
                id="miner-address"
                value={localMinerAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalMinerAddress(e.target.value)}
                onKeyPress={handleMinerInputKeyPress}
                placeholder="4... (Enter your Monero wallet address)"
                className={`${!isValidMinerAddress ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" : "border-indigo-300 dark:border-indigo-600"} 
                  bg-white/70 dark:bg-indigo-950/30 backdrop-blur-sm shadow-lg text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-600/60 dark:placeholder:text-indigo-400/60
                  focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-400/30 dark:focus:ring-purple-500/30 text-sm`}
                disabled={hasSearched}
              />
              {hasSearched && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-100/70 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-md border border-green-300 dark:border-green-700 pointer-events-none"></div>
              )}
            </div>
            <Button
              onClick={handleMinerSearch}
              disabled={(!localMinerAddress.trim() || !isValidMinerAddress) && !hasSearched}
              className={`relative overflow-hidden shadow-xl transition-all duration-300 w-full sm:w-auto ${
                hasSearched 
                  ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-red-400" 
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-indigo-400"
              } border text-white font-semibold px-4 sm:px-6`}
            >
              {/* Button background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="relative z-10 flex items-center justify-center">
                {searchingWallet ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {searchingWallet ? "Searching..." : hasSearched ? "Clear" : "Track"}
              </div>
            </Button>
          </div>
          
          {/* Status messages */}
          {!isValidMinerAddress && localMinerAddress.trim() && !hasSearched && (
            <div className="p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                Please enter a valid Monero address (95 characters, starting with 4)
              </p>
            </div>
          )}
          {hasSearched && minerAddress && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold">
                ✓ Tracking wallet: 
                <span className="block sm:inline mt-1 sm:mt-0 sm:ml-1 font-mono">
                  {minerAddress.slice(0, 8)}...{minerAddress.slice(-8)}
                </span>
              </p>
            </div>
          )}
          <div className="p-3 bg-gradient-to-r from-blue-50/50 to-cyan-50/40 dark:from-blue-950/20 dark:to-cyan-950/15 border border-blue-200/60 dark:border-blue-800/60 rounded-lg backdrop-blur-sm">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
              Enter your Monero wallet address to see your personal mining statistics, recent shares, and blocks found on P2Pool Mini
            </p>
          </div>
        </div>

        {/* Help Information */}
        <Alert className="relative overflow-hidden bg-gradient-to-r from-cyan-50/70 via-blue-50/60 to-indigo-50/50 dark:from-cyan-950/30 dark:via-blue-950/25 dark:to-indigo-950/30 border border-cyan-200/60 dark:border-cyan-700/60 shadow-lg">
          {/* Background pattern for alert */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 dark:to-transparent"></div>
          <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-cyan-200/20 to-blue-300/15 dark:from-cyan-800/20 dark:to-blue-700/15 rounded-full blur-sm"></div>
          
          <InfoIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <AlertDescription className="text-cyan-800 dark:text-cyan-200 font-medium text-xs sm:text-sm">
            <span className="font-bold">Quick start:</span> Enter your wallet address above to track mining progress and rewards.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 