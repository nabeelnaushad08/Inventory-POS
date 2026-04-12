// ============================================================
// /types/database.ts
//
// This is the single source of truth for the Supabase schema.
// It mirrors what `supabase gen types typescript` would produce.
// All application types in /types/index.ts are derived from here.
// Never import this file directly in components — use /types/index.ts.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'manager' | 'cashier'
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'admin' | 'manager' | 'cashier'
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string
          role?: 'admin' | 'manager' | 'cashier'
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          sku: string | null
          barcode: string | null
          category_id: string | null
          cost_price: number
          selling_price: number
          stock_quantity: number
          min_stock_level: number
          image_url: string | null
          supplier: string | null
          expiry_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price: number
          selling_price: number
          stock_quantity?: number
          min_stock_level?: number
          image_url?: string | null
          supplier?: string | null
          expiry_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          selling_price?: number
          stock_quantity?: number
          min_stock_level?: number
          image_url?: string | null
          supplier?: string | null
          expiry_date?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      sales: {
        Row: {
          id: string
          invoice_number: string
          cashier_id: string | null
          subtotal: number
          discount_amount: number
          tax_amount: number
          total: number
          payment_type: 'cash' | 'card' | 'mixed'
          amount_paid: number
          change_amount: number
          notes: string | null
          status: 'completed' | 'refunded' | 'held'
          created_at: string
        }
        Insert: {
          id?: string
          invoice_number?: string
          cashier_id?: string | null
          subtotal: number
          discount_amount?: number
          tax_amount?: number
          total: number
          payment_type: 'cash' | 'card' | 'mixed'
          amount_paid: number
          change_amount?: number
          notes?: string | null
          status?: 'completed' | 'refunded' | 'held'
          created_at?: string
        }
        Update: {
          status?: 'completed' | 'refunded' | 'held'
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sales_cashier_id_fkey'
            columns: ['cashier_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          discount: number
          total: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          discount?: number
          total: number
        }
        Update: {
          quantity?: number
          unit_price?: number
          discount?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sale_items_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sales'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      stock_logs: {
        Row: {
          id: string
          product_id: string
          change_amount: number
          previous_quantity: number
          new_quantity: number
          reason: 'sale' | 'restock' | 'adjustment' | 'damage' | 'return'
          reference_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          change_amount: number
          previous_quantity: number
          new_quantity: number
          reason: 'sale' | 'restock' | 'adjustment' | 'damage' | 'return'
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_logs_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          store_address: string | null
          store_phone: string | null
          store_email: string | null
          currency: string
          currency_symbol: string
          tax_rate: number
          tax_name: string
          receipt_footer: string | null
          logo_url: string | null
          whatsapp_number: string | null
          notification_email: string | null
          low_stock_alerts: boolean
          email_alerts: boolean
          whatsapp_alerts: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          store_address?: string | null
          store_phone?: string | null
          store_email?: string | null
          currency?: string
          currency_symbol?: string
          tax_rate?: number
          tax_name?: string
          receipt_footer?: string | null
          logo_url?: string | null
          whatsapp_number?: string | null
          notification_email?: string | null
          low_stock_alerts?: boolean
          email_alerts?: boolean
          whatsapp_alerts?: boolean
          updated_at?: string
        }
        Update: {
          store_name?: string
          store_address?: string | null
          store_phone?: string | null
          store_email?: string | null
          currency?: string
          currency_symbol?: string
          tax_rate?: number
          tax_name?: string
          receipt_footer?: string | null
          logo_url?: string | null
          whatsapp_number?: string | null
          notification_email?: string | null
          low_stock_alerts?: boolean
          email_alerts?: boolean
          whatsapp_alerts?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'cashier'
      payment_type: 'cash' | 'card' | 'mixed'
      sale_status: 'completed' | 'refunded' | 'held'
      stock_reason: 'sale' | 'restock' | 'adjustment' | 'damage' | 'return'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
