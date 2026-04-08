"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Check, Printer, X } from "lucide-react"
import { Tables } from "@/lib/supabase/database.types"
import { formatCurrency, formatDateTime } from "@/lib/utils"

type Settings = Tables<"store_settings"> | null

interface ReceiptModalProps {
  invoiceNumber: string
  settings: Settings
  onClose: () => void
}

export function ReceiptModal({ invoiceNumber, settings, onClose }: ReceiptModalProps) {
  const handlePrint = () => window.print()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="text-center py-4">
          {/* Success animation */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Invoice: <span className="font-semibold text-gray-800">{invoiceNumber}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateTime(new Date().toISOString())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">{settings?.store_name ?? "Thank you!"}</p>
          <p className="text-xs text-gray-400 mt-1">
            {settings?.receipt_footer ?? "Thank you for your purchase!"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button className="flex-1" onClick={onClose}>
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
