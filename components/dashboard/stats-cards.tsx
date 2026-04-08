"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
} from "lucide-react"

interface StatsCardsProps {
  todayTotal: number
  todayCount: number
  weekTotal: number
  monthTotal: number
}

export function DashboardStats({ todayTotal, todayCount, weekTotal, monthTotal }: StatsCardsProps) {
  const stats = [
    {
      title: "Today's Sales",
      value: formatCurrency(todayTotal),
      subtitle: `${todayCount} transactions`,
      icon: ShoppingCart,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "This Week",
      value: formatCurrency(weekTotal),
      subtitle: "Last 7 days",
      icon: TrendingUp,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "This Month",
      value: formatCurrency(monthTotal),
      subtitle: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      icon: Calendar,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Avg. Per Sale",
      value: formatCurrency(todayCount > 0 ? todayTotal / todayCount : 0),
      subtitle: "Today's average",
      icon: DollarSign,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.lightColor}`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
