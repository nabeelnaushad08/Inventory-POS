'use client'

import { useState, useCallback } from 'react'
import { ProductGrid } from './product-grid'
import { Cart } from './cart'
import { PaymentModal } from './payment-modal'
import { HeldBillsModal } from './held-bills-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePOSStore } from '@/lib/store/pos-store'
import { Search, PauseCircle, Barcode } from 'lucide-react'
import type { ProductWithCategory, Category, StoreSettings } from '@/types'

interface POSClientProps {
  products: ProductWithCategory[]
  categories: Category[]
  settings: StoreSettings | null
}

export function POSClient({ products, categories, settings }: POSClientProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPayment, setShowPayment] = useState(false)
  const [showHeld, setShowHeld] = useState(false)

  const { cart, heldBills } = usePOSStore()

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || p.category_id === selectedCategory
    return matchesSearch && matchesCategory && p.stock_quantity > 0
  })

  const handleBarcodeSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && search.length > 0) {
        const product = products.find(
          (p) => p.barcode === search || p.sku === search
        )
        if (product) {
          usePOSStore.getState().addToCart(product)
          setSearch('')
        }
      }
    },
    [search, products]
  )

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] -m-6 p-4 bg-gray-100">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              className="pl-9 h-11 bg-white border-0 shadow-sm text-base"
              autoFocus
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 bg-white border-0 shadow-sm"
          >
            <Barcode className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-11 bg-white border-0 shadow-sm relative"
            onClick={() => setShowHeld(true)}
          >
            <PauseCircle className="h-4 w-4 mr-2" />
            Held Bills
            {heldBills.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 text-xs px-1">
                {heldBills.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length
            if (count === 0) return null
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid products={filteredProducts} />
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 shrink-0 flex flex-col">
        <Cart settings={settings} onCheckout={() => setShowPayment(true)} />
      </div>

      {showPayment && (
        <PaymentModal
          settings={settings}
          onClose={() => setShowPayment(false)}
        />
      )}
      {showHeld && <HeldBillsModal onClose={() => setShowHeld(false)} />}
    </div>
  )
}
