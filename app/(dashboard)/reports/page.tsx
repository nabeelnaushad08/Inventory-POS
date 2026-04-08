import { createClient } from "@/lib/supabase/server"
import { ReportsClient } from "@/components/reports/reports-client"

type SaleRow = {
  id: string
  invoice_number: string
  total: number
  subtotal: number
  discount_amount: number
  tax_amount: number
  payment_type: string
  status: string
  created_at: string
  cashier: { name: string } | null
}

type SaleItemRow = {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
}

type ProductRow = {
  id: string
  name: string
  cost_price: number
  selling_price: number
}

export default async function ReportsPage() {
  const supabase = createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: salesRaw } = await supabase
    .from("sales")
    .select(`
      id, invoice_number, total, subtotal, discount_amount, tax_amount,
      payment_type, status, created_at,
      cashier:profiles(name)
    `)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
  const sales = (salesRaw ?? []) as SaleRow[]

  const { data: itemsRaw } = await supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, unit_price, total")
  const saleItems = (itemsRaw ?? []) as SaleItemRow[]

  const { data: productsRaw } = await supabase
    .from("products")
    .select("id, name, cost_price, selling_price")
    .eq("is_active", true)
  const products = (productsRaw ?? []) as ProductRow[]

  return (
    <ReportsClient
      sales={sales}
      saleItems={saleItems}
      products={products}
    />
  )
}
