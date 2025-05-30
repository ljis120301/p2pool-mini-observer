interface EffortInfo {
  tier: string
  color: string
  bgColor: string
  borderColor: string
  progressColor: string
  description: string
}

export function getEffortInfo(effort: number): EffortInfo {
  if (effort <= 50) {
    return {
      tier: "Excellent",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      borderColor: "border-green-300 dark:border-green-700",
      progressColor: "bg-green-500",
      description: "Well below average - great luck!"
    }
  } else if (effort <= 100) {
    return {
      tier: "Good",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      borderColor: "border-yellow-300 dark:border-yellow-700",
      progressColor: "bg-yellow-500",
      description: "Below average effort"
    }
  } else if (effort <= 150) {
    return {
      tier: "Normal",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      borderColor: "border-orange-300 dark:border-orange-700",
      progressColor: "bg-orange-500",
      description: "Around expected effort"
    }
  } else if (effort <= 200) {
    return {
      tier: "High",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      borderColor: "border-red-300 dark:border-red-700",
      progressColor: "bg-red-500",
      description: "Above average - hang in there!"
    }
  } else {
    return {
      tier: "Very High",
      color: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-200 dark:bg-red-900/30",
      borderColor: "border-red-400 dark:border-red-600",
      progressColor: "bg-red-600",
      description: "Significantly above average"
    }
  }
}

interface EffortGuideProps {
  className?: string
}

export function EffortGuide({ className = "" }: EffortGuideProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 ${className}`}>
      {[
        { range: "0-50%", tier: "Excellent", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20", desc: "Lucky!" },
        { range: "50-100%", tier: "Good", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/20", desc: "Below avg" },
        { range: "100-150%", tier: "Normal", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/20", desc: "Expected" },
        { range: "150-200%", tier: "High", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/20", desc: "Above avg" },
        { range: "200%+", tier: "Very High", color: "text-red-700 dark:text-red-300", bg: "bg-red-200 dark:bg-red-900/30", desc: "Unlucky" }
      ].map((item) => (
        <div key={item.range} className={`p-3 rounded-lg border ${item.bg}`}>
          <div className={`font-medium text-sm ${item.color}`}>{item.tier}</div>
          <div className="text-xs text-muted-foreground">{item.range}</div>
          <div className="text-xs mt-1 opacity-75">{item.desc}</div>
        </div>
      ))}
    </div>
  )
} 