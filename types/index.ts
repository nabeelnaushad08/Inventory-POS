// ============================================================
// /types/index.ts
//
// ALL application-level types live here.
// Components and pages import from here — never from database.ts
// directly. This decouples your UI code from the raw schema.
// ============================================================

import type { Database } from './database'

// ─── Low-level helpers (mirrors Supabase CLI output) ──────────────────────────

/** Full row type for a table */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/** Insert payload for a table */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/** Update payload for a table */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

/** Enum value for a named enum */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// ─── Base row types ────────────────────────────────────────────────────────────

export type Profile      = Tables<'profiles'>
export type Category     = Tables<'categories'>
export type Product      = Tables<'products'>
export type Sale         = Tables<'sales'>
export type SaleItem     = Tables<'sale_items'>
export type StockLog     = Tables<'stock_logs'>
export type StoreSettings = Tables<'store_settings'>

// ─── Insert types ──────────────────────────────────────────────────────────────

export type ProfileInsert       = TablesInsert<'profiles'>
export type ProductInsert       = TablesInsert<'products'>
export type SaleInsert          = TablesInsert<'sales'>
export type SaleItemInsert      = TablesInsert<'sale_items'>
export type StockLogInsert      = TablesInsert<'stock_logs'>
export type StoreSettingsInsert = TablesInsert<'store_settings'>

// ─── Update types ──────────────────────────────────────────────────────────────

export type ProductUpdate       = TablesUpdate<'products'>
export type SaleUpdate          = TablesUpdate<'sales'>
export type StoreSettingsUpdate = TablesUpdate<'store_settings'>

// ─── Enum types ────────────────────────────────────────────────────────────────

export type UserRole    = Enums<'user_role'>
export type PaymentType = Enums<'payment_type'>
export type SaleStatus  = Enums<'sale_status'>
export type StockReason = Enums<'stock_reason'>

// ─── Composed / joined types ──────────────────────────────────────────────────
// These represent the shape returned by Supabase joined queries.
// Use these as the T in .returns<T[]>() on any query that selects
// from multiple tables in a single call.

/** Product row including its parent category (nullable if unset) */
export type ProductWithCategory = Product & {
  categories: Pick<Category, 'id' | 'name' | 'color'> | null
}

/** Sale row including the cashier's profile (nullable if deleted) */
export type SaleWithCashier = Sale & {
  cashier: Pick<Profile, 'name'> | null
}

/** Sale item enriched with the current product row */
export type SaleItemWithProduct = SaleItem & {
  products: Pick<Product, 'id' | 'name' | 'cost_price'> | null
}

// ─── UI / presentation types ───────────────────────────────────────────────────

/**
 * Cart item as stored in the Zustand POS store.
 * Carries the full Product row so the UI can render price, image, stock, etc.
 */
export type CartItem = {
  product: Product
  quantity: number
  /** Per-item discount percentage (0–100) */
  discount: number
  /** Pre-computed line total after discount */
  total: number
}

/** A held bill snapshot in the POS store */
export type HeldBill = {
  id: string
  cart: CartItem[]
  createdAt: Date
}

/** Stock adjustment directions in the inventory UI */
export type StockAdjustType = 'add' | 'subtract' | 'set'

// ─── Dashboard / analytics shapes ─────────────────────────────────────────────

/** One data point for the 7-day / 30-day sales charts */
export type ChartDataPoint = {
  date: string
  sales: number
}

/** Aggregated top-product row (from sale_items aggregation) */
export type TopProductRow = {
  product_id: string
  product_name: string
  quantity: number
  total: number
}

/** The dashboard stats passed to the StatsCards component */
export type DashboardStats = {
  todayTotal: number
  todayCount: number
  weekTotal: number
  monthTotal: number
}
