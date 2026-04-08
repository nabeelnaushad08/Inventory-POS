# CloudPOS — Modern Cloud-Based POS & Inventory System

A production-ready, SaaS-ready Point of Sale and Inventory Management system built with **Next.js 14**, **Tailwind CSS**, **ShadCN UI**, and **Supabase**.

---

## Features

### POS / Billing
- Touch-friendly product grid with images
- Barcode/SKU search
- Cart with quantity controls and per-item discounts
- Hold & resume bills
- Multiple payment types: Cash, Card, Mixed
- Change calculation
- Receipt modal + print support

### Inventory Management
- Real-time stock tracking
- Low stock & out-of-stock filtering
- Stock adjustment modal (add / subtract / set) with audit log
- Stock value calculation

### Product Management
- Full CRUD with image upload (Supabase Storage)
- Categories, SKU, barcode, supplier, expiry date
- Profit margin indicator
- Bulk CSV import ready

### Dashboard & Analytics
- Today / Week / Month sales cards
- 7-day area chart
- Top products by revenue
- Recent transactions list
- Low stock alerts widget

### Reports
- 30-day daily revenue bar chart
- Payment method pie chart
- Top products horizontal bar chart
- Full transaction history table

### User Management
- Role-based access: **Admin**, **Manager**, **Cashier**
- Toggle active/inactive
- Role assignment
- Add new staff accounts

### Settings
- Store info (name, address, phone, email)
- Currency & tax configuration
- Receipt footer customization
- Low stock, email & WhatsApp alert toggles

### Security
- Supabase Auth (JWT)
- Row Level Security on all tables
- Middleware route protection
- Zod input validation

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, ShadCN UI |
| State | Zustand |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Notifications | Resend (email) + Twilio (WhatsApp) |

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL, anon key, and service role key.

### 3. Set up the database
Run the contents of `supabase/schema.sql` in your Supabase SQL editor. This creates all tables, RLS policies, enums, triggers, indexes, and sample data.

### 4. Create Supabase Storage bucket
In Supabase dashboard → Storage → create a **public** bucket named `product-images`.

### 5. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User Roles

| Role | POS | Inventory | Products | Reports | Users | Settings |
|------|-----|-----------|----------|---------|-------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cashier | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Project Structure

```
app/
  (auth)/login/          # Login page
  (dashboard)/
    dashboard/           # Analytics dashboard
    pos/                 # POS billing interface
    inventory/           # Stock management
    products/            # Product CRUD
    reports/             # Sales reports
    users/               # Staff management
    settings/            # Store configuration
components/
  ui/                    # ShadCN UI primitives
  layout/                # Sidebar, TopBar
  dashboard/             # Stats, Charts, Tables
  pos/                   # ProductGrid, Cart, PaymentModal
  inventory/             # InventoryTable, StockAdjustModal
  products/              # ProductGrid, ProductFormModal
  reports/               # ReportsClient with charts
  users/                 # UsersClient
  settings/              # SettingsClient
lib/
  supabase/              # client.ts, server.ts, database.types.ts
  store/                 # Zustand POS store
  utils.ts               # Formatting helpers
supabase/
  schema.sql             # Full DB schema with RLS + sample data
```

---

## Notification Setup (Optional)

### Email (Resend)
Set `RESEND_API_KEY` in `.env.local`. Low-stock alerts are sent via `/api/alerts/low-stock`.

### WhatsApp (Twilio)
Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM`. Enable WhatsApp alerts in Settings.
