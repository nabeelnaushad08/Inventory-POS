'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Package } from 'lucide-react'
import type { ProductWithCategory, StockLogInsert, StockReason, StockAdjustType } from '@/types'

const REASONS: { value: StockReason; label: string }[] = [
  { value: 'restock',    label: 'Restock / Purchase' },
  { value: 'adjustment', label: 'Manual Adjustment'  },
  { value: 'damage',     label: 'Damaged / Lost'     },
  { value: 'return',     label: 'Customer Return'    },
]

interface StockAdjustModalProps {
  product: ProductWithCategory
  onClose: () => void
  onUpdated: (productId: string, newQty: number) => void
}

export function StockAdjustModal({ product, onClose, onUpdated }: StockAdjustModalProps) {
  const [adjustType, setAdjustType] = useState<StockAdjustType>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState<StockReason>('restock')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const numAmount = Number(amount)
  const newQuantity =
    adjustType === 'set'
      ? numAmount
      : adjustType === 'add'
      ? product.stock_quantity + numAmount
      : Math.max(0, product.stock_quantity - numAmount)

  const handleSubmit = async () => {
    if (!amount) return
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', product.id)

      if (updateError) throw updateError

      const logPayload: StockLogInsert = {
        product_id: product.id,
        change_amount: newQuantity - product.stock_quantity,
        previous_quantity: product.stock_quantity,
        new_quantity: newQuantity,
        reason,
        notes: notes || null,
        created_by: user?.id ?? null,
      }
      await supabase.from('stock_logs').insert(logPayload)

      toast({
        title: 'Stock updated',
        description: `${product.name} is now ${newQuantity} units.`,
      })
      onUpdated(product.id, newQuantity)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stock'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Adjust Stock
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-gray-900">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            Current stock:{' '}
            <span className="font-bold text-gray-800">{product.stock_quantity}</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Adjust type */}
          <div>
            <Label className="mb-2 block">Adjustment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {([['add', '+ Add'], ['subtract', '− Remove'], ['set', '= Set']] as [StockAdjustType, string][]).map(
                ([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setAdjustType(type)}
                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      adjustType === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="amount" className="mb-2 block">
              {adjustType === 'set' ? 'New Quantity' : 'Amount'}
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11"
              autoFocus
            />
            {amount && (
              <p className="text-xs text-muted-foreground mt-1">
                New quantity will be:{' '}
                <span className="font-bold text-gray-800">{newQuantity}</span>
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as StockReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-2 block">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!amount || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Update Stock'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
