import { createClient } from "@/lib/supabase/server"
import { InventoryClient } from "@/components/inventory/inventory-client"

export default async function InventoryPage() {
  const supabase = createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, name, color)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("*").order("name"),
  ])

  return <InventoryClient products={products ?? []} categories={categories ?? []} />
}
