import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'
import type { StoreSettings } from '@/types'

export default async function SettingsPage() {
  const supabase = createClient()

  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .single()
    .returns<StoreSettings>()

  return <SettingsClient settings={settings ?? null} />
}
