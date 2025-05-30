"use client"

import { DollarSign, Clock, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAppContext } from "@/lib/app-context"

export function AppHeader() {
  const {
    xmrPrice,
    priceLoading,
    isConnected,
    lastUpdate,
    refreshing,
    loading,
    onRefresh
  } = useAppContext()

  return (
    <header className="border-b border-border">
      <div className="bg-card border rounded-xl shadow-sm mx-4 my-4">
        <div className="p-3 sm:p-6">
          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {/* Left side - Title and description */}
              <div className="flex items-center space-x-4">
                {/* Enhanced icon with gradient */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                
                {/* Title and subtitle */}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent">
                    P2Pool Mini Observer
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Advanced P2Pool Mining Operations Dashboard
                  </p>
                </div>
              </div>
              
              {/* Right side - Status indicators and controls */}
              <div className="flex items-center space-x-3">
                {/* XMR Price - Green/Emerald theme */}
                {xmrPrice && (
                  <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-1.5 rounded-md">
                      <DollarSign className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">${xmrPrice.toFixed(2)}</span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">XMR</span>
                    </div>
                    {priceLoading && (
                      <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                    )}
                  </div>
                )}
                
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Refresh Button - Enhanced with subtle color */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading || refreshing}
                  className="px-4 border-slate-300 dark:border-slate-600 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading || refreshing ? 'animate-spin text-blue-600' : 'text-slate-600 dark:text-slate-400'}`} />
                  <span className="font-medium">Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Bottom section - Feature badges and status */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              {/* Left side - Feature badges with vibrant colors */}
              <div className="flex items-center space-x-2">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full mr-2 animate-pulse"></div>
                  Live Network Data
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full mr-2"></div>
                  Real-time Analytics
                </Badge>
              </div>
              
              {/* Right side - Compact Combined Status - Connection & Last Update */}
              <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg border ${
                isConnected 
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'
              }`}>
                {/* Connection indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected 
                      ? 'bg-green-500 animate-pulse shadow-sm shadow-green-500/50' 
                      : 'bg-red-500 shadow-sm shadow-red-500/50'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isConnected 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                
                {/* Separator */}
                {lastUpdate && (
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                )}
                
                {/* Last update time */}
                {lastUpdate && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      {lastUpdate.toLocaleTimeString()}
                    </span>
                    {refreshing && (
                      <RefreshCw className="h-3 w-3 animate-spin text-blue-600 ml-1" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout - Visible only on mobile */}
          <div className="block md:hidden space-y-4">
            {/* Top row - Icon, title and refresh button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Smaller icon for mobile */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                
                {/* Title only, no subtitle on mobile */}
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent">
                    P2Pool Observer
                  </h1>
                </div>
              </div>
              
              {/* Right side - Theme toggle and refresh */}
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading || refreshing}
                  className="px-3 border-slate-300 dark:border-slate-600 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin text-blue-600' : 'text-slate-600 dark:text-slate-400'}`} />
                </Button>
              </div>
            </div>

            {/* Second row - Price and status indicators */}
            <div className="flex items-center justify-between">
              {/* XMR Price - Compact mobile version */}
              {xmrPrice && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-1 rounded-md">
                    <DollarSign className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">${xmrPrice.toFixed(2)}</span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">XMR</span>
                  </div>
                  {priceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                  )}
                </div>
              )}
              
              {/* Connection Status - Compact mobile version */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                isConnected 
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected 
                    ? 'bg-green-500 animate-pulse shadow-sm shadow-green-500/50' 
                    : 'bg-red-500 shadow-sm shadow-red-500/50'
                }`} />
                <span className={`text-xs font-medium ${
                  isConnected 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {isConnected ? "Online" : "Offline"}
                </span>
                {refreshing && (
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                )}
              </div>
            </div>

            {/* Third row - Feature badges */}
            <div className="flex items-center justify-center space-x-2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm text-xs">
                <div className="w-1 h-1 bg-white/30 rounded-full mr-1 animate-pulse"></div>
                Live Data
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-sm text-xs">
                <div className="w-1 h-1 bg-white/30 rounded-full mr-1"></div>
                Real-time
              </Badge>
              {lastUpdate && (
                <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                  <Clock className="h-2 w-2 mr-1 text-blue-600 dark:text-blue-400" />
                  {lastUpdate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 