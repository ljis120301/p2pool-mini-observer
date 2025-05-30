import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton for StatCard component
export function StatCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950/30 dark:via-gray-950/30 dark:to-slate-900/50 border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 rounded-xl mr-3" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16 mb-2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for Share/Block/Payout list items
export function ActivityListItemSkeleton() {
  return (
    <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-slate-200/60 dark:border-slate-800/60">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center gap-3 ml-10">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for dashboard grid
export function DashboardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton for activity sections
export function ActivitySectionSkeleton() {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950/30 dark:via-gray-950/30 dark:to-slate-900/40 border border-slate-200/40 dark:border-slate-700/40 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ActivityListItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for mining dashboard header
export function MiningDashboardHeaderSkeleton() {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-100 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-cyan-950/40 border border-blue-200/40 dark:border-blue-700/40 shadow-xl">
      <CardHeader className="pb-4 border-b border-blue-200/30 dark:border-blue-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for pool info grid (public pool stats)
export function PoolInfoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton for main page loading state
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <div className="flex space-x-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <DashboardGridSkeleton />
    </div>
  )
}

// Skeleton for miner activity indicator
export function MinerActivityIndicatorSkeleton() {
  return (
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="relative group">
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <div className="min-w-0 flex-1">
        <Skeleton className="h-6 w-36 mb-2" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
    </div>
  )
}

// Skeleton for load more button area
export function LoadMoreButtonSkeleton() {
  return (
    <div className="w-full mt-4">
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  )
} 