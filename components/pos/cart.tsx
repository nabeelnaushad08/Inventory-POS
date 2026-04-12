'use client'

import { usePOSStore } from '@/lib/store/pos-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingCart, Tag, PauseCircle, CreditCard } from 'lucide-react'
import type { StoreSettings } from '@/types'

interface CartProps {
  settings: StoreSettings | null
  onCheckout: () => void
}

export function Cart({ settings, onCheckout }: CartProps) {
  const {
    cart,
    discount,
    discountType,
    removeFromCart,
    updateQuantity,
    setDiscount,
    setDiscountType,
    clearCart,
    holdBill,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
  } = usePOSStore()

  const taxRate = settings?.tax_rate ?? 0
  const currencySymbol = settings?.currency_symbol ?? 'Rs.'

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount(taxRate)
  const total = getTotal(taxRate)

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-gray-900">Cart</h2>
          {cart.length > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 cart-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <ShoppingCart className="h-10 w-10 text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">Cart is empty</p>
            <p className="text-gray-300 text-xs mt-1">Click products to add them</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(item.product.selling_price)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock_quantity}
                      className="w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Discount */}
      {cart.length > 0 && (
        <div className="px-4 py-3 border-t border-b">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5 flex-1">
              <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                {(['percent', 'fixed'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDiscountType(type)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      discountType === type
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    {type === 'percent' ? '%' : currencySymbol}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min="0"
                max={discountType === 'percent' ? '100' : undefined}
                placeholder="Discount"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-medium">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {settings?.tax_name ?? 'Tax'} ({taxRate}%)
            </span>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-base font-bold text-gray-900">
          <span>Total</span>
          <span className="text-primary text-lg">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-12"
          onClick={holdBill}
          disabled={cart.length === 0}
        >
          <PauseCircle className="h-4 w-4 mr-2" />
          Hold Bill
        </Button>
        <Button
          className="h-12 text-base font-bold"
          onClick={onCheckout}
          disabled={cart.length === 0}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Pay {formatCurrency(total)}
        </Button>
      </div>
    </div>
  )
}
