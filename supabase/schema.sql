-- ============================================
-- POS + Inventory Management System Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier');
CREATE TYPE payment_type AS ENUM ('cash', 'card', 'mixed');
CREATE TYPE sale_status AS ENUM ('completed', 'refunded', 'held');
CREATE TYPE stock_reason AS ENUM ('sale', 'restock', 'adjustment', 'damage', 'return');

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'cashier',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cashier')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'package',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, color, icon) VALUES
  ('Groceries', 'Food and grocery items', '#22c55e', 'shopping-basket'),
  ('Beverages', 'Drinks and beverages', '#3b82f6', 'coffee'),
  ('Bakery', 'Bread and baked goods', '#f59e0b', 'cake'),
  ('Electronics', 'Electronic devices', '#8b5cf6', 'zap'),
  ('Hardware', 'Tools and hardware', '#ef4444', 'wrench'),
  ('Clothing', 'Apparel and accessories', '#ec4899', 'shirt'),
  ('Household', 'Home and household items', '#14b8a6', 'home'),
  ('Personal Care', 'Health and beauty', '#f97316', 'heart'),
  ('Stationery', 'Office and school supplies', '#6366f1', 'pen-tool'),
  ('Other', 'Miscellaneous items', '#94a3b8', 'package');

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  supplier TEXT,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SALES
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
  cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_type payment_type NOT NULL DEFAULT 'cash',
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  status sale_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SALE ITEMS
-- ============================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL
);

-- ============================================
-- STOCK LOGS
-- ============================================
CREATE TABLE stock_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason stock_reason NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STORE SETTINGS (single row)
-- ============================================
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'My Store',
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  currency TEXT NOT NULL DEFAULT 'PKR',
  currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_name TEXT NOT NULL DEFAULT 'Tax',
  receipt_footer TEXT DEFAULT 'Thank you for shopping with us!',
  logo_url TEXT,
  whatsapp_number TEXT,
  notification_email TEXT,
  low_stock_alerts BOOLEAN NOT NULL DEFAULT true,
  email_alerts BOOLEAN NOT NULL DEFAULT false,
  whatsapp_alerts BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO store_settings (store_name) VALUES ('My POS Store');

CREATE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories: authenticated can read, admin/manager can write
CREATE POLICY "Categories viewable by authenticated"
  ON categories FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin/Manager can manage categories"
  ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Products: all authenticated can read, admin/manager can write
CREATE POLICY "Products viewable by authenticated"
  ON products FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin/Manager can manage products"
  ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Sales: all authenticated can insert, read own or admin/manager read all
CREATE POLICY "Users can create sales"
  ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view sales"
  ON sales FOR SELECT USING (
    cashier_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Sale items: follow sale access
CREATE POLICY "Sale items follow sale access"
  ON sale_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_id AND (
        s.cashier_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
      )
    )
  );

-- Stock logs: admin/manager
CREATE POLICY "Stock logs viewable by admin/manager"
  ON stock_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Authenticated can create stock logs"
  ON stock_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Store settings: admin only for write, all authenticated for read
CREATE POLICY "Settings viewable by authenticated"
  ON store_settings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can update settings"
  ON store_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_stock_logs_product ON stock_logs(product_id);
CREATE INDEX idx_stock_logs_created_at ON stock_logs(created_at DESC);

-- ============================================
-- SAMPLE DATA (for development/demo)
-- ============================================

-- Sample products
INSERT INTO products (name, description, sku, barcode, category_id, cost_price, selling_price, stock_quantity, min_stock_level, supplier)
SELECT
  p.name, p.description, p.sku, p.barcode,
  c.id as category_id,
  p.cost_price, p.selling_price, p.stock_quantity, p.min_stock_level, p.supplier
FROM (VALUES
  ('Whole Milk 1L', 'Fresh whole milk', 'SKU-001', '4001234567890', 'Groceries', 80, 120, 50, 10, 'Dairy Farm Co.'),
  ('White Bread', 'Sliced white bread 400g', 'SKU-002', '4001234567891', 'Bakery', 45, 70, 30, 8, 'Baker''s Best'),
  ('Basmati Rice 1kg', 'Premium basmati rice', 'SKU-003', '4001234567892', 'Groceries', 150, 220, 100, 20, 'Rice Mill'),
  ('Coca Cola 500ml', 'Carbonated soft drink', 'SKU-004', '4001234567893', 'Beverages', 40, 65, 80, 15, 'Beverage Co.'),
  ('Cooking Oil 1L', 'Sunflower cooking oil', 'SKU-005', '4001234567894', 'Groceries', 180, 260, 40, 10, 'Oil Industries'),
  ('Sugar 1kg', 'White refined sugar', 'SKU-006', '4001234567895', 'Groceries', 80, 120, 60, 15, 'Sugar Mills'),
  ('Eggs (Dozen)', 'Farm fresh eggs', 'SKU-007', '4001234567896', 'Groceries', 150, 200, 25, 5, 'Poultry Farm'),
  ('Green Tea (25 bags)', 'Herbal green tea', 'SKU-008', '4001234567897', 'Beverages', 90, 150, 35, 8, 'Tea House'),
  ('Shampoo 200ml', 'Anti-dandruff shampoo', 'SKU-009', '4001234567898', 'Personal Care', 120, 180, 20, 5, 'Beauty Corp'),
  ('Notebook A4', '200 pages ruled notebook', 'SKU-010', '4001234567899', 'Stationery', 40, 70, 45, 10, 'Paper Works')
) AS p(name, description, sku, barcode, cat_name, cost_price, selling_price, stock_quantity, min_stock_level, supplier)
JOIN categories c ON c.name = p.cat_name;
