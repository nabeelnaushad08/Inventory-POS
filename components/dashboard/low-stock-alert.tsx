import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/types"

export function LowStockAlert({ products }: { products: Pick<Product, 'id' | 'name' | 'stock_quantity' | 'min_stock_level'>[] }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-base font-semibold">Low Stock</CardTitle>
          </div>
          {products.length > 0 && (
            <Badge variant="warning">{products.length}</Badge>
          )}
        </div>
        <CardDescription>Items running low</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm text-muted-foreground">All items well stocked</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Min: {product.min_stock_level}
                  </p>
                </div>
                <Badge
                  variant={product.stock_quantity === 0 ? "destructive" : "warning"}
                  className="shrink-0 ml-2"
                >
                  {product.stock_quantity === 0 ? "Out" : `${product.stock_quantity} left`}
                </Badge>
              </div>
            ))}
            <Link
              href="/inventory"
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Manage inventory <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
