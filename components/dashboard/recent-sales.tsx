import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Sale {
  id: string
  invoice_number: string
  total: number
  payment_type: string
  created_at: string
  cashier?: { name: string } | null
}

const paymentBadge: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  cash: { label: "Cash", variant: "success" },
  card: { label: "Card", variant: "default" },
  mixed: { label: "Mixed", variant: "warning" },
}

export function RecentSales({ sales }: { sales: Sale[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Sales</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </div>
          <Link
            href="/reports"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No sales yet today</div>
        ) : (
          <div className="space-y-2">
            {sales.map((sale) => {
              const pb = paymentBadge[sale.payment_type] ?? paymentBadge.cash
              return (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-800">{sale.invoice_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {sale.cashier?.name ?? "Unknown"} · {formatDateTime(sale.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={pb.variant}>{pb.label}</Badge>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
