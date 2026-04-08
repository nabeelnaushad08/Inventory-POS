import { createClient } from "@/lib/supabase/server"
import { ProductsClient } from "@/components/products/products-client"

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
  categories: { id: string; name: string; color: string | null } | null
}

type CategoryRow = {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  created_at: string
}

export default async function ProductsPage() {
  const supabase = createClient()

  const { data: productsRaw } = await supabase
    .from("products")
    .select("*, categories(id, name, color)")
    .order("name")
  const products = (productsRaw ?? []) as ProductRow[]

  const { data: categoriesRaw } = await supabase
    .from("categories")
    .select("*")
    .order("name")
  const categories = (categoriesRaw ?? []) as CategoryRow[]

  return <ProductsClient products={products} categories={categories} />
}
