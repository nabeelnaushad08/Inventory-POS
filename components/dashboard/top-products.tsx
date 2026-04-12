import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Trophy } from "lucide-react"
import type { TopProductRow } from "@/types"

interface TopProductsProps {
  products: TopProductRow[]
}

const medals = ["🥇", "🥈", "🥉", "4th", "5th"]

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <CardTitle className="text-base font-semibold">Top Products</CardTitle>
        </div>
        <CardDescription>Best selling items today</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No sales data yet
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-lg w-8 text-center">{medals[index]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 shrink-0">
                  {formatCurrency(product.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
