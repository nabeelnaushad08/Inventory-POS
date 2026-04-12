import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from '@/components/products/products-client'
import type { ProductWithCategory, Category } from '@/types'

export default async function ProductsPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(id, name, color)')
    .order('name')
    .returns<ProductWithCategory[]>()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
    .returns<Category[]>()

  return (
    <ProductsClient
      products={products ?? []}
      categories={categories ?? []}
    />
  )
}
