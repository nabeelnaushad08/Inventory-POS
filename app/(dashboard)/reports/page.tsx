import { createClient } from "@/lib/supabase/server"
import { ReportsClient } from "@/components/reports/reports-client"

export default async function ReportsPage() {
  const supabase = createClient()

  // Last 30 days sales
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: sales }, { data: saleItems }, { data: products }] = await Promise.all([
    supabase
      .from("sales")
      .select(`
        id, invoice_number, total, subtotal, discount_amount, tax_amount,
        payment_type, status, created_at,
        cashier:profiles(name)
      `)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("sale_items")
      .select("product_id, product_name, quantity, unit_price, total"),
    supabase
      .from("products")
      .select("id, name, cost_price, selling_price")
      .eq("is_active", true),
  ])

  return (
    <ReportsClient
      sales={sales ?? []}
      saleItems={saleItems ?? []}
      products={products ?? []}
    />
  )
}
