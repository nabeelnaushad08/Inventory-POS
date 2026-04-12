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
import { Separator } from '@/components/ui/separator'
import { usePOSStore } from '@/lib/store/pos-store'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils'
import { Loader2, Check, Banknote, CreditCard, Layers } from 'lucide-react'
import { ReceiptModal } from './receipt-modal'
import type { StoreSettings, SaleInsert, SaleItemInsert, StockLogInsert, PaymentType } from '@/types'

interface PaymentModalProps {
  settings: StoreSettings | null
  onClose: () => void
}

const PAYMENT_OPTIONS: { type: PaymentType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'cash',  label: 'Cash',  icon: Banknote,    color: 'text-green-600'  },
  { type: 'card',  label: 'Card',  icon: CreditCard,  color: 'text-blue-600'   },
  { type: 'mixed', label: 'Mixed', icon: Layers,      color: 'text-purple-600' },
]

export function PaymentModal({ settings, onClose }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedInvoice, setCompletedInvoice] = useState<string | null>(null)

  const {
    cart,
    paymentType,
    amountPaid,
    notes,
    setPaymentType,
    setAmountPaid,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getChange,
  } = usePOSStore()

  const { toast } = useToast()
  const supabase = createClient()

  const taxRate = settings?.tax_rate ?? 0
  const currencySymbol = settings?.currency_symbol ?? 'Rs.'

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount(taxRate)
  const total = getTotal(taxRate)
  const change = getChange(taxRate)

  const handleProcessPayment = async () => {
    if (paymentType !== 'card' && amountPaid < total) {
      toast({
        title: 'Insufficient amount',
        description: 'Amount paid is less than total.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const invoiceNumber = generateInvoiceNumber()

      const salePayload: SaleInsert = {
        invoice_number: invoiceNumber,
        cashier_id: user?.id ?? null,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        payment_type: paymentType,
        amount_paid: paymentType === 'card' ? total : amountPaid,
        change_amount: paymentType === 'cash' ? Math.max(0, change) : 0,
        notes: notes || null,
        status: 'completed',
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(salePayload)
        .select('id')
        .single()

      if (saleError) throw saleError

      const itemsPayload: SaleItemInsert[] = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        discount: item.discount,
        total: item.total,
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsPayload)
      if (itemsError) throw itemsError

      // Update stock and write logs
      for (const item of cart) {
        const newQty = Math.max(0, item.product.stock_quantity - item.quantity)

        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', item.product.id)
        if (stockError) throw stockError

        const logPayload: StockLogInsert = {
          product_id: item.product.id,
          change_amount: -item.quantity,
          previous_quantity: item.product.stock_quantity,
          new_quantity: newQty,
          reason: 'sale',
          reference_id: sale.id,
          created_by: user?.id ?? null,
        }
        await supabase.from('stock_logs').insert(logPayload)
      }

      setCompletedInvoice(invoiceNumber)
      clearCart()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process payment'
      toast({ title: 'Payment failed', description: message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  if (completedInvoice) {
    return (
      <ReceiptModal
        invoiceNumber={completedInvoice}
        settings={settings}
        onClose={onClose}
      />
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Payment</DialogTitle>
        </DialogHeader>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currencySymbol)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>- {formatCurrency(discountAmount, currencySymbol)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {settings?.tax_name} ({taxRate}%)
              </span>
              <span>{formatCurrency(taxAmount, currencySymbol)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total, currencySymbol)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-semibold mb-2">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={() => setPaymentType(opt.type)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentType === opt.type
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      paymentType === opt.type ? 'text-primary' : opt.color
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      paymentType === opt.type ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Amount received */}
        {paymentType !== 'card' && (
          <div>
            <p className="text-sm font-semibold mb-2">Amount Received</p>
            <Input
              type="number"
              min={total}
              step="0.01"
              placeholder={`Min. ${formatCurrency(total, currencySymbol)}`}
              value={amountPaid || ''}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              className="h-12 text-lg font-semibold"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              {[
                total,
                Math.ceil(total / 100) * 100,
                Math.ceil(total / 500) * 500,
                Math.ceil(total / 1000) * 1000,
              ].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setAmountPaid(amount)}
                  className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg py-1.5 font-medium transition-colors"
                >
                  {formatCurrency(amount, currencySymbol)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Change */}
        {paymentType === 'cash' && amountPaid >= total && amountPaid > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm text-green-700 font-medium">Change to Return</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(Math.max(0, change), currencySymbol)}
            </p>
          </div>
        )}

        <Button
          onClick={handleProcessPayment}
          className="h-14 text-lg font-bold w-full"
          disabled={
            isProcessing || (paymentType !== 'card' && amountPaid < total)
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Complete Payment
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
