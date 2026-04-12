import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/stats-cards'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProducts } from '@/components/dashboard/top-products'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { LowStockAlert } from '@/components/dashboard/low-stock-alert'
import type {
  Sale,
  SaleWithCashier,
  SaleItem,
  Product,
  ChartDataPoint,
  TopProductRow,
} from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const now = new Date()
  const todayStart = now.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // ── Simple column queries — TypeScript infers from Database generic ──────────
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total, created_at')
    .gte('created_at', todayStart)
    .eq('status', 'completed')
    .returns<Pick<Sale, 'total' | 'created_at'>[]>()

  const { data: weekSales } = await supabase
    .from('sales')
    .select('total, created_at')
    .gte('created_at', sevenDaysAgo)
    .eq('status', 'completed')
    .returns<Pick<Sale, 'total' | 'created_at'>[]>()

  const { data: monthSales } = await supabase
    .from('sales')
    .select('total')
    .gte('created_at', monthStart)
    .eq('status', 'completed')
    .returns<Pick<Sale, 'total'>[]>()

  // ── Joined query — must use .returns<T[]>() ──────────────────────────────────
  const { data: recentSales } = await supabase
    .from('sales')
    .select('id, invoice_number, total, payment_type, created_at, cashier:profiles(name)')
    .order('created_at', { ascending: false })
    .limit(8)
    .returns<SaleWithCashier[]>()

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('product_id, product_name, quantity, total')
    .returns<Pick<SaleItem, 'product_id' | 'product_name' | 'quantity' | 'total'>[]>()

  const { data: lowStockRaw } = await supabase
    .from('products')
    .select('id, name, stock_quantity, min_stock_level')
    .eq('is_active', true)
    .lte('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })
    .limit(6)
    .returns<Pick<Product, 'id' | 'name' | 'stock_quantity' | 'min_stock_level'>[]>()

  // ── Derived values ────────────────────────────────────────────────────────────
  const safeToday = todaySales ?? []
  const safeWeek = weekSales ?? []
  const safeMonth = monthSales ?? []
  const safeItems = saleItems ?? []

  const todayTotal = safeToday.reduce((s, r) => s + r.total, 0)
  const weekTotal = safeWeek.reduce((s, r) => s + r.total, 0)
  const monthTotal = safeMonth.reduce((s, r) => s + r.total, 0)
  const todayCount = safeToday.length

  // Aggregate sale items into top products
  const productMap = new Map<string, TopProductRow>()
  for (const item of safeItems) {
    const existing = productMap.get(item.product_id)
    if (existing) {
      existing.quantity += item.quantity
      existing.total += item.total
    } else {
      productMap.set(item.product_id, {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        total: item.total,
      })
    }
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // 7-day chart data
  const chartData: ChartDataPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const prefix = d.toISOString().split('T')[0]
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: safeWeek
        .filter((s) => s.created_at.startsWith(prefix))
        .reduce((sum, s) => sum + s.total, 0),
    }
  })

  // Only items truly below their minimum threshold
  const lowStock = (lowStockRaw ?? []).filter(
    (p) => p.stock_quantity <= p.min_stock_level
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
        <TopProducts products={topProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentSales sales={recentSales ?? []} />
        </div>
        <LowStockAlert products={lowStock} />
      </div>
    </div>
  )
}
