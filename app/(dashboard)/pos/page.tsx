import { createClient } from "@/lib/supabase/server"
import { POSClient } from "@/components/pos/pos-client"

type ProductRow = {
  id: string
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  category_id: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock_level: number
  image_url: string | null
  supplier: string | null
  expiry_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  categories: { name: string; color: string | null } | null
}

type CategoryRow = {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  created_at: string
}

type SettingsRow = {
  id: string
  store_name: string
  store_address: string | null
  store_phone: string | null
  store_email: string | null
  currency: string
  currency_symbol: string
  tax_rate: number
  tax_name: string
  receipt_footer: string | null
  logo_url: string | null
  whatsapp_number: string | null
  notification_email: string | null
  low_stock_alerts: boolean
  email_alerts: boolean
  whatsapp_alerts: boolean
  updated_at: string
}

export default async function POSPage() {
  const supabase = createClient()

  const { data: productsRaw } = await supabase
    .from("products")
    .select("*, categories(name, color)")
    .eq("is_active", true)
    .order("name")
  const products = (productsRaw ?? []) as ProductRow[]

  const { data: categoriesRaw } = await supabase
    .from("categories")
    .select("*")
    .order("name")
  const categories = (categoriesRaw ?? []) as CategoryRow[]

  const { data: settingsRaw } = await supabase
    .from("store_settings")
    .select("*")
    .single()
  const settings = settingsRaw as SettingsRow | null

  return (
    <POSClient
      products={products}
      categories={categories}
      settings={settings}
    />
  )
}
