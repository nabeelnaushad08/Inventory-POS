import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard/stats-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { TopProducts } from "@/components/dashboard/top-products"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { LowStockAlert } from "@/components/dashboard/low-stock-alert"

type SaleRow = { total: number; created_at: string }
type RecentSaleRow = {
  id: string
  invoice_number: string
  total: number
  payment_type: string
  created_at: string
  cashier: { name: string } | null
}
type SaleItemRow = {
  product_id: string
  product_name: string
  quantity: number
  total: number
}
type LowStockRow = {
  id: string
  name: string
  stock_quantity: number
  min_stock_level: number
}

export default async function DashboardPage() {
  const supabase = createClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date().toISOString().split("T")[0]
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString()

  // Run queries sequentially with explicit casts to avoid Promise.all inference issues
  const { data: todayRaw } = await supabase
    .from("sales")
    .select("total, created_at")
    .gte("created_at", todayStart)
    .eq("status", "completed")
  const todaySales = (todayRaw ?? []) as SaleRow[]

  const { data: weekRaw } = await supabase
    .from("sales")
    .select("total, created_at")
    .gte("created_at", sevenDaysAgo)
    .eq("status", "completed")
  const weekSales = (weekRaw ?? []) as SaleRow[]

  const { data: monthRaw } = await supabase
    .from("sales")
    .select("total, created_at")
    .gte("created_at", monthStart)
    .eq("status", "completed")
  const monthSales = (monthRaw ?? []) as SaleRow[]

  const { data: recentRaw } = await supabase
    .from("sales")
    .select("id, invoice_number, total, payment_type, created_at, cashier:profiles(name)")
    .order("created_at", { ascending: false })
    .limit(8)
  const recentSales = (recentRaw ?? []) as RecentSaleRow[]

  const { data: itemsRaw } = await supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, total")
    .order("quantity", { ascending: false })
    .limit(50)
  const saleItems = (itemsRaw ?? []) as SaleItemRow[]

  const { data: lowRaw } = await supabase
    .from("products")
    .select("id, name, stock_quantity, min_stock_level")
    .eq("is_active", true)
    .lte("stock_quantity", 10)
    .order("stock_quantity", { ascending: true })
    .limit(6)
  const lowStockAll = (lowRaw ?? []) as LowStockRow[]

  // Aggregate values
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0)
  const weekTotal = weekSales.reduce((sum, s) => sum + s.total, 0)
  const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0)
  const todayCount = todaySales.length

  // Aggregate top products from sale_items
  const productMap = new Map<string, { product_name: string; quantity: number; total: number }>()
  for (const item of saleItems) {
    const existing = productMap.get(item.product_id)
    if (existing) {
      existing.quantity += item.quantity
      existing.total += item.total
    } else {
      productMap.set(item.product_id, {
        product_name: item.product_name,
        quantity: item.quantity,
        total: item.total,
      })
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // 7-day chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split("T")[0]
    const daySales = weekSales.filter((s) => s.created_at.startsWith(dateStr))
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: daySales.reduce((sum, s) => sum + s.total, 0),
    }
  })

  // Only truly low stock
  const lowStock = lowStockAll.filter((p) => p.stock_quantity <= p.min_stock_level)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <DashboardStats
        todayTotal={todayTotal}
        todayCount={todayCount}
        weekTotal={weekTotal}
        monthTotal={monthTotal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={chartData} />
        </div>
        <div>
          <TopProducts products={topProducts} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentSales sales={recentSales} />
        </div>
        <div>
          <LowStockAlert products={lowStock} />
        </div>
      </div>
    </div>
  )
}
