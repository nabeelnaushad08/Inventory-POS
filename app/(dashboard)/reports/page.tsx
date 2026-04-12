import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/reports/reports-client'
import type { SaleWithCashier, SaleItem, Product } from '@/types'

export default async function ReportsPage() {
  const supabase = createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sales } = await supabase
    .from('sales')
    .select(
      'id, invoice_number, total, subtotal, discount_amount, tax_amount, payment_type, status, created_at, cashier:profiles(name)'
    )
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .returns<SaleWithCashier[]>()

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('product_id, product_name, quantity, unit_price, total')
    .returns<Pick<SaleItem, 'product_id' | 'product_name' | 'quantity' | 'unit_price' | 'total'>[]>()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, cost_price, selling_price')
    .eq('is_active', true)
    .returns<Pick<Product, 'id' | 'name' | 'cost_price' | 'selling_price'>[]>()

  return (
    <ReportsClient
      sales={sales ?? []}
      saleItems={saleItems ?? []}
      products={products ?? []}
    />
  )
}
