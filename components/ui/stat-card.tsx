import React, { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  gradient: string
  iconGradient: string
  decorativeColor: string
  valueGradient: string
  refreshing?: boolean
  children?: ReactNode
}

export const StatCard = memo(({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconGradient,
  decorativeColor,
  valueGradient,
  refreshing = false,
  children
}: StatCardProps) => {
  return (
    <Card className={`group relative overflow-hidden ${gradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
      {/* Skeuomorphic background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 dark:to-transparent"></div>
      
      {/* Decorative elements */}
      <div className={`absolute top-3 right-3 w-16 h-16 ${decorativeColor} rounded-full blur-sm`}></div>
      <div className={`absolute bottom-2 left-2 w-8 h-8 ${decorativeColor.replace('30', '20').replace('20', '10')} rounded-full blur-sm`}></div>
      
      <GlowingEffect 
        disabled={false}
        proximity={80}
        spread={25}
        blur={1}
      />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <div className="flex items-center">
          <div className={`p-2 rounded-xl ${iconGradient} shadow-lg mr-3 group-hover:scale-110 transition-transform duration-300`}>
            <div className="relative">
              <Icon className="h-4 w-4 text-white drop-shadow-sm" />
              <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
            </div>
          </div>
          <CardTitle className="text-sm font-semibold drop-shadow-sm">
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
          {refreshing && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current drop-shadow-sm"></div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold min-h-[36px] flex items-center drop-shadow-lg">
          <span className={`${valueGradient} bg-clip-text text-transparent`}>
            {value}
          </span>
        </div>
        {subtitle && (
          <div className="flex items-center space-x-2 h-5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-current to-current shadow-sm animate-pulse opacity-60"></div>
            <p className="text-xs font-medium opacity-80">
              {subtitle}
            </p>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}) 