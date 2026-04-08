"use client"

import { useState } from "react"
import Image from "next/image"
import { Tables } from "@/lib/supabase/database.types"
import { formatCurrency, getStockStatus, getProfitMargin } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductFormModal } from "./product-form-modal"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  ImageOff,
  AlertCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type Product = Tables<"products"> & {
  categories?: { id: string; name: string; color: string | null } | null
}

interface ProductsClientProps {
  products: Product[]
  categories: Tables<"categories">[]
}

export function ProductsClient({ products: initial, categories }: ProductsClientProps) {
  const [products, setProducts] = useState(initial)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search)
  )

  const handleProductSaved = (product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = product
        return updated
      }
      return [product, ...prev]
    })
    setShowForm(false)
    setEditProduct(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", deleteTarget.id)

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast({ title: "Product deleted", description: `${deleteTarget.name} has been removed.` })
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} products total</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products found</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const status = getStockStatus(product.stock_quantity, product.min_stock_level)
            const margin = getProfitMargin(product.cost_price, product.selling_price)
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-200 hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Product image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => { setEditProduct(product); setShowForm(true) }}
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:bg-blue-50 transition-colors"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  {/* Stock badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {/* Product info */}
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </p>
                  {product.categories && (
                    <p className="text-xs text-muted-foreground mt-1">{product.categories.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-base font-bold text-primary">
                        {formatCurrency(product.selling_price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(product.cost_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">
                        {product.stock_quantity} units
                      </p>
                      <p className="text-xs text-green-600">{margin.toFixed(0)}% margin</p>
                    </div>
                  </div>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      SKU: {product.sku}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onSaved={handleProductSaved}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Product
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
