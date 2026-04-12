import { createClient } from '@/lib/supabase/server'
import { InventoryClient } from '@/components/inventory/inventory-client'
import type { ProductWithCategory, Category } from '@/types'

export default async function InventoryPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(id, name, color)')
    .eq('is_active', true)
    .order('name')
    .returns<ProductWithCategory[]>()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
    .returns<Category[]>()

  return (
    <InventoryClient
      products={products ?? []}
      categories={categories ?? []}
    />
  )
}
