import { create } from 'zustand'
import type { Product, CartItem, HeldBill, PaymentType } from '@/types'

// Re-export so other files can import CartItem from one place
export type { CartItem } from '@/types'

type POSStore = {
  // ── State ──────────────────────────────────────────────────
  cart: CartItem[]
  discount: number
  discountType: 'percent' | 'fixed'
  paymentType: PaymentType
  amountPaid: number
  notes: string
  heldBills: HeldBill[]

  // ── Cart actions ───────────────────────────────────────────
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateItemDiscount: (productId: string, discount: number) => void
  clearCart: () => void

  // ── Checkout options ───────────────────────────────────────
  setDiscount: (discount: number) => void
  setDiscountType: (type: 'percent' | 'fixed') => void
  setPaymentType: (type: PaymentType) => void
  setAmountPaid: (amount: number) => void
  setNotes: (notes: string) => void

  // ── Held bills ─────────────────────────────────────────────
  holdBill: () => void
  resumeBill: (id: string) => void
  deleteHeldBill: (id: string) => void

  // ── Computed (call as functions so they're always fresh) ───
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTaxAmount: (taxRate: number) => number
  getTotal: (taxRate: number) => number
  getChange: (taxRate: number) => number
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cart: [],
  discount: 0,
  discountType: 'percent',
  paymentType: 'cash',
  amountPaid: 0,
  notes: '',
  heldBills: [],

  addToCart: (product) => {
    const { cart } = get()
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total:
                  (item.quantity + 1) *
                  item.product.selling_price *
                  (1 - item.discount / 100),
              }
            : item
        ),
      })
    } else {
      set({
        cart: [
          ...cart,
          { product, quantity: 1, discount: 0, total: product.selling_price },
        ],
      })
    }
  },

  removeFromCart: (productId) =>
    set({ cart: get().cart.filter((item) => item.product.id !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }
    set({
      cart: get().cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total:
                quantity *
                item.product.selling_price *
                (1 - item.discount / 100),
            }
          : item
      ),
    })
  },

  updateItemDiscount: (productId, discount) =>
    set({
      cart: get().cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              discount,
              total:
                item.quantity *
                item.product.selling_price *
                (1 - discount / 100),
            }
          : item
      ),
    }),

  clearCart: () =>
    set({
      cart: [],
      discount: 0,
      discountType: 'percent',
      paymentType: 'cash',
      amountPaid: 0,
      notes: '',
    }),

  setDiscount: (discount) => set({ discount }),
  setDiscountType: (discountType) => set({ discountType }),
  setPaymentType: (paymentType) => set({ paymentType }),
  setAmountPaid: (amountPaid) => set({ amountPaid }),
  setNotes: (notes) => set({ notes }),

  holdBill: () => {
    const { cart, heldBills } = get()
    if (cart.length === 0) return
    set({
      heldBills: [
        ...heldBills,
        { id: `held-${Date.now()}`, cart: [...cart], createdAt: new Date() },
      ],
      cart: [],
      discount: 0,
      amountPaid: 0,
      notes: '',
    })
  },

  resumeBill: (id) => {
    const { heldBills } = get()
    const bill = heldBills.find((b) => b.id === id)
    if (!bill) return
    set({ cart: bill.cart, heldBills: heldBills.filter((b) => b.id !== id) })
  },

  deleteHeldBill: (id) =>
    set({ heldBills: get().heldBills.filter((b) => b.id !== id) }),

  getSubtotal: () => get().cart.reduce((sum, item) => sum + item.total, 0),

  getDiscountAmount: () => {
    const { discount, discountType, getSubtotal } = get()
    const subtotal = getSubtotal()
    return discountType === 'percent'
      ? (subtotal * discount) / 100
      : Math.min(discount, subtotal)
  },

  getTaxAmount: (taxRate) => {
    const taxable = get().getSubtotal() - get().getDiscountAmount()
    return (taxable * taxRate) / 100
  },

  getTotal: (taxRate) =>
    get().getSubtotal() - get().getDiscountAmount() + get().getTaxAmount(taxRate),

  getChange: (taxRate) => get().amountPaid - get().getTotal(taxRate),
}))
