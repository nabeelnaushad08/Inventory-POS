import { createClient } from '@/lib/supabase/server'
import { POSClient } from '@/components/pos/pos-client'
import type { ProductWithCategory, Category, StoreSettings } from '@/types'

export default async function POSPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name, color)')
    .eq('is_active', true)
    .order('name')
    .returns<ProductWithCategory[]>()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
    .returns<Category[]>()

  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .single()
    .returns<StoreSettings>()

  return (
    <POSClient
      products={products ?? []}
      categories={categories ?? []}
      settings={settings ?? null}
    />
  )
}
