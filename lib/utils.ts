import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol = "PKR"): string {
  return `${symbol} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function generateInvoiceNumber(): string {
  const prefix = "INV"
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0")
  return `${prefix}-${timestamp}-${random}`
}

export function getStockStatus(quantity: number, minLevel: number): {
  label: string
  color: string
  variant: "default" | "secondary" | "destructive" | "outline"
} {
  if (quantity === 0) {
    return { label: "Out of Stock", color: "text-red-600", variant: "destructive" }
  }
  if (quantity <= minLevel) {
    return { label: "Low Stock", color: "text-yellow-600", variant: "secondary" }
  }
  return { label: "In Stock", color: "text-green-600", variant: "default" }
}

export function calculateProfit(costPrice: number, sellingPrice: number, quantity: number): number {
  return (sellingPrice - costPrice) * quantity
}

export function getProfitMargin(costPrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - costPrice) / sellingPrice) * 100
}
