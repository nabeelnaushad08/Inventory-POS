"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { usePOSStore } from "@/lib/store/pos-store"
import { formatCurrency } from "@/lib/utils"
import { PauseCircle, Play, Trash2 } from "lucide-react"

interface HeldBillsModalProps {
  onClose: () => void
}

export function HeldBillsModal({ onClose }: HeldBillsModalProps) {
  const { heldBills, resumeBill, deleteHeldBill } = usePOSStore()

  const handleResume = (id: string) => {
    resumeBill(id)
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-primary" />
            Held Bills
          </DialogTitle>
        </DialogHeader>

        {heldBills.length === 0 ? (
          <div className="text-center py-8">
            <PauseCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No held bills</p>
          </div>
        ) : (
          <div className="space-y-3">
            {heldBills.map((bill) => {
              const total = bill.cart.reduce((s, i) => s + i.total, 0)
              const itemCount = bill.cart.reduce((s, i) => s + i.quantity, 0)
              return (
                <div
                  key={bill.id}
                  className="border rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {itemCount} items
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bill.createdAt.toLocaleTimeString()} ·{" "}
                      {bill.cart.slice(0, 2).map((i) => i.product.name).join(", ")}
                      {bill.cart.length > 2 && "..."}
                    </p>
                    <p className="text-base font-bold text-primary mt-1">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteHeldBill(bill.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResume(bill.id)}
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Resume
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
