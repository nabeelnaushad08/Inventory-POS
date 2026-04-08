"use client"

import { useState } from "react"
import { Tables } from "@/lib/supabase/database.types"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StockAdjustModal } from "./stock-adjust-modal"
import { Search, Package, AlertTriangle, TrendingDown } from "lucide-react"
import Link from "next/link"

type Product = Tables<"products"> & {
  categories?: { id: string; name: string; color: string | null } | null
}

interface InventoryClientProps {
  products: Product[]
  categories: Tables<"categories">[]
}

export function InventoryClient({ products, categories }: InventoryClientProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [localProducts, setLocalProducts] = useState(products)

  const filtered = localProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all" ? true :
      filter === "low" ? (p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0) :
      p.stock_quantity === 0
    return matchSearch && matchFilter
  })

  const totalValue = localProducts.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0)
  const lowStockCount = localProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length
  const outOfStockCount = localProducts.filter(p => p.stock_quantity === 0).length

  const handleStockUpdated = (productId: string, newQty: number) => {
    setLocalProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p)
    )
    setSelectedProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage stock levels</p>
        </div>
        <Button asChild>
          <Link href="/products">+ Add Product</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stock Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter(f => f === "low" ? "all" : "low")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter(f => f === "out" ? "all" : "out")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-xl font-bold text-gray-900">{outOfStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">SKU</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Min Level</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map(product => {
                  const status = getStockStatus(product.stock_quantity, product.min_stock_level)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            Cost: {formatCurrency(product.cost_price)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {product.categories?.name ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono hidden lg:table-cell">
                        {product.sku ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-bold ${status.color}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600 hidden md:table-cell">
                        {product.min_stock_level}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <StockAdjustModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onUpdated={handleStockUpdated}
        />
      )}
    </div>
  )
}
