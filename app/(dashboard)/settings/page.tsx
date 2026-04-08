import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: settings } = await supabase.from("store_settings").select("*").single()

  return <SettingsClient settings={settings} />
}
