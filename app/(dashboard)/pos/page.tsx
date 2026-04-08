import { createClient } from "@/lib/supabase/server"
import { POSClient } from "@/components/pos/pos-client"

export default async function POSPage() {
  const supabase = createClient()

  const [{ data: products }, { data: categories }, { data: settings }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name, color)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("store_settings").select("*").single(),
  ])

  return (
    <POSClient
      products={products ?? []}
      categories={categories ?? []}
      settings={settings}
    />
  )
}
