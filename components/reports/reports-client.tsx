"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { TrendingUp, DollarSign, ShoppingCart, BarChart2 } from "lucide-react"
import type { SaleWithCashier, SaleItem, Product } from "@/types"

interface ReportsClientProps {
  sales: SaleWithCashier[]
  saleItems: Pick<SaleItem, 'product_id' | 'product_name' | 'quantity' | 'unit_price' | 'total'>[]
  products: Pick<Product, 'id' | 'name' | 'cost_price' | 'selling_price'>[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function ReportsClient({ sales, saleItems, products }: ReportsClientProps) {
  const completedSales = sales.filter((s) => s.status === "completed")

  const totalRevenue = completedSales.reduce((s, sale) => s + sale.total, 0)
  const totalDiscount = completedSales.reduce((s, sale) => s + sale.discount_amount, 0)
  const totalTransactions = completedSales.length

  // Estimate profit from sale items
  const productCostMap = new Map(products.map((p) => [p.id, p.cost_price]))
  const totalProfit = saleItems.reduce((sum, item) => {
    const cost = productCostMap.get(item.product_id) ?? 0
    return sum + (item.unit_price - cost) * item.quantity
  }, 0)

  // Daily chart data (last 30 days)
  const dailyData = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      map.set(d.toISOString().split("T")[0], 0)
    }
    completedSales.forEach((sale) => {
      const day = sale.created_at.split("T")[0]
      if (map.has(day)) {
        map.set(day, (map.get(day) ?? 0) + sale.total)
      }
    })
    return Array.from(map.entries()).map(([date, sales]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales,
    }))
  }, [completedSales])

  // Payment type distribution
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {}
    completedSales.forEach((s) => {
      map[s.payment_type] = (map[s.payment_type] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [completedSales])

  // Top products
  const topProductsData = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>()
    saleItems.forEach((item) => {
      const existing = map.get(item.product_id)
      if (existing) {
        existing.qty += item.quantity
        existing.revenue += item.total
      } else {
        map.set(item.product_id, {
          name: item.product_name,
          qty: item.quantity,
          revenue: item.total,
        })
      }
    })
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [saleItems])

  const paymentBadge: Record<string, "default" | "secondary" | "success" | "warning"> = {
    cash: "success",
    card: "default",
    mixed: "warning",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Last 30 days performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Gross Profit",
            value: formatCurrency(totalProfit),
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Transactions",
            value: totalTransactions.toString(),
            icon: ShoppingCart,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Total Discounts",
            value: formatCurrency(totalDiscount),
            icon: BarChart2,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily Revenue (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      interval={4}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "transactions"]} />
                      <Legend
                        formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Products by Revenue</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {topProductsData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No sales data</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#374151" }}
                      width={120}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        name === "revenue" ? formatCurrency(v) : v,
                        name === "revenue" ? "Revenue" : "Units Sold",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Transaction History</CardTitle>
              <CardDescription>{completedSales.length} transactions in last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Cashier</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sales.slice(0, 50).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                          {sale.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">
                          {formatDateTime(sale.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell">
                          {sale.cashier?.name ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={paymentBadge[sale.payment_type] ?? "default"} className="capitalize">
                            {sale.payment_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              sale.status === "completed" ? "success" :
                              sale.status === "held" ? "warning" :
                              "destructive"
                            }
                            className="capitalize"
                          >
                            {sale.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
