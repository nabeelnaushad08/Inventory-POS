'use client'

import Image from 'next/image'
import { usePOSStore } from '@/lib/store/pos-store'
import { formatCurrency } from '@/lib/utils'
import { Plus, ImageOff } from 'lucide-react'
import type { ProductWithCategory } from '@/types'

interface ProductGridProps {
  products: ProductWithCategory[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const addToCart = usePOSStore((s) => s.addToCart)
  const cart = usePOSStore((s) => s.cart)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-500 font-medium">No products found</p>
        <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="pos-product-grid">
      {products.map((product) => {
        const cartItem = cart.find((i) => i.product.id === product.id)
        const inCart = cartItem?.quantity ?? 0
        const isOutOfStock = product.stock_quantity === 0

        return (
          <button
            key={product.id}
            onClick={() => !isOutOfStock && addToCart(product)}
            disabled={isOutOfStock}
            className={[
              'relative bg-white rounded-xl p-3 text-left transition-all',
              'hover:shadow-md hover:-translate-y-0.5 active:scale-95',
              'border-2 group',
              inCart > 0
                ? 'border-primary shadow-md shadow-primary/10'
                : 'border-transparent shadow-sm',
              isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {inCart > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full text-xs font-bold flex items-center justify-center z-10 shadow">
                {inCart}
              </div>
            )}

            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="h-8 w-8 text-gray-300" />
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                </div>
              )}
              {!isOutOfStock && (
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </p>
              <p className="text-base font-bold text-primary mt-1">
                {formatCurrency(product.selling_price)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stock: {product.stock_quantity}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
