import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"

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

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: raw } = await supabase.from("store_settings").select("*").single()
  const settings = raw as SettingsRow | null

  return <SettingsClient settings={settings} />
}
