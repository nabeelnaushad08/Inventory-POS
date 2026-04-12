"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { StoreSettings } from "@/types"
import {
  Store,
  Bell,
  Receipt,
  Globe,
  Loader2,
  Check,
} from "lucide-react"

const schema = z.object({
  store_name: z.string().min(1, "Store name is required"),
  store_address: z.string().optional(),
  store_phone: z.string().optional(),
  store_email: z.string().email().optional().or(z.literal("")),
  currency: z.string().min(1),
  currency_symbol: z.string().min(1),
  tax_rate: z.coerce.number().min(0).max(100),
  tax_name: z.string().min(1),
  receipt_footer: z.string().optional(),
  whatsapp_number: z.string().optional(),
  notification_email: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface SettingsClientProps {
  settings: StoreSettings | null
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const [lowStockAlerts, setLowStockAlerts] = useState(settings?.low_stock_alerts ?? true)
  const [emailAlerts, setEmailAlerts] = useState(settings?.email_alerts ?? false)
  const [whatsappAlerts, setWhatsappAlerts] = useState(settings?.whatsapp_alerts ?? false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      store_name: settings?.store_name ?? "",
      store_address: settings?.store_address ?? "",
      store_phone: settings?.store_phone ?? "",
      store_email: settings?.store_email ?? "",
      currency: settings?.currency ?? "PKR",
      currency_symbol: settings?.currency_symbol ?? "Rs.",
      tax_rate: settings?.tax_rate ?? 0,
      tax_name: settings?.tax_name ?? "Tax",
      receipt_footer: settings?.receipt_footer ?? "",
      whatsapp_number: settings?.whatsapp_number ?? "",
      notification_email: settings?.notification_email ?? "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        low_stock_alerts: lowStockAlerts,
        email_alerts: emailAlerts,
        whatsapp_alerts: whatsappAlerts,
        store_address: data.store_address || null,
        store_phone: data.store_phone || null,
        store_email: data.store_email || null,
        receipt_footer: data.receipt_footer || null,
        whatsapp_number: data.whatsapp_number || null,
        notification_email: data.notification_email || null,
        updated_at: new Date().toISOString(),
      }

      if (settings?.id) {
        await supabase.from("store_settings").update(payload).eq("id", settings.id)
      } else {
        await supabase.from("store_settings").insert(payload)
      }

      toast({
        title: "Settings saved",
        description: "Your store settings have been updated.",
        variant: "default",
      })
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your store preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="store">
          <TabsList className="mb-6">
            <TabsTrigger value="store" className="gap-2">
              <Store className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Receipt className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Store Information
                </CardTitle>
                <CardDescription>Basic details about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="store_name" className="mb-2 block">
                    Store Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="store_name"
                    {...register("store_name")}
                    placeholder="My Awesome Store"
                    className="h-11"
                  />
                  {errors.store_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.store_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="store_address" className="mb-2 block">Address</Label>
                  <Input
                    id="store_address"
                    {...register("store_address")}
                    placeholder="123 Main St, City"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store_phone" className="mb-2 block">Phone</Label>
                    <Input
                      id="store_phone"
                      {...register("store_phone")}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_email" className="mb-2 block">Email</Label>
                    <Input
                      id="store_email"
                      type="email"
                      {...register("store_email")}
                      placeholder="store@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Currency & Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency" className="mb-2 block">Currency Code</Label>
                    <Input
                      id="currency"
                      {...register("currency")}
                      placeholder="PKR"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency_symbol" className="mb-2 block">Currency Symbol</Label>
                    <Input
                      id="currency_symbol"
                      {...register("currency_symbol")}
                      placeholder="Rs."
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_name" className="mb-2 block">Tax Name</Label>
                    <Input
                      id="tax_name"
                      {...register("tax_name")}
                      placeholder="GST / VAT / Tax"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_rate" className="mb-2 block">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      {...register("tax_rate")}
                      placeholder="0"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="receipt_footer" className="mb-2 block">Receipt Footer Message</Label>
                  <Input
                    id="receipt_footer"
                    {...register("receipt_footer")}
                    placeholder="Thank you for shopping with us!"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Shown at the bottom of every receipt
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alert Preferences
                </CardTitle>
                <CardDescription>Configure when and how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Low Stock Alerts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get notified when stock falls below minimum level
                    </p>
                  </div>
                  <Switch
                    checked={lowStockAlerts}
                    onCheckedChange={setLowStockAlerts}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Receive alerts via email
                      </p>
                    </div>
                    <Switch
                      checked={emailAlerts}
                      onCheckedChange={setEmailAlerts}
                    />
                  </div>
                  {emailAlerts && (
                    <div>
                      <Label htmlFor="notification_email" className="mb-2 block">Notification Email</Label>
                      <Input
                        id="notification_email"
                        type="email"
                        {...register("notification_email")}
                        placeholder="alerts@yourstore.com"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">WhatsApp Alerts</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Receive alerts via WhatsApp (requires Twilio setup)
                      </p>
                    </div>
                    <Switch
                      checked={whatsappAlerts}
                      onCheckedChange={setWhatsappAlerts}
                    />
                  </div>
                  {whatsappAlerts && (
                    <div>
                      <Label htmlFor="whatsapp_number" className="mb-2 block">
                        WhatsApp Number
                      </Label>
                      <Input
                        id="whatsapp_number"
                        {...register("whatsapp_number")}
                        placeholder="+1234567890 (with country code)"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" className="min-w-32" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
