import { createClient } from "@/lib/supabase/server"
import { ProductsClient } from "@/components/products/products-client"

export default async function ProductsPage() {
  const supabase = createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, name, color)")
      .order("name"),
    supabase.from("categories").select("*").order("name"),
  ])

  return <ProductsClient products={products ?? []} categories={categories ?? []} />
}
