-- ============================================================================
-- MULTI-STORE UPGRADE MIGRATION
-- Run this AFTER taking a backup of your existing data.
-- This adds new tables and columns without deleting existing data.
-- ============================================================================

-- Enable UUID extension (likely already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. NEW TABLE: stores
-- ============================================================================
create table if not exists stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text not null,
  address text,
  phone text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table stores enable row level security;
create policy "Public Access Stores" on stores for all using (true) with check (true);

-- ============================================================================
-- 2. NEW TABLE: users (replaces hardcoded auth)
-- ============================================================================
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  password text not null,
  display_name text not null,
  role text check (role in ('main_admin', 'store_admin')) not null default 'store_admin',
  store_id uuid references stores(id) on delete set null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table users enable row level security;
create policy "Public Access Users" on users for all using (true) with check (true);

-- ============================================================================
-- 3. NEW TABLE: stock_transfers (Main Admin: move stock between stores)
-- ============================================================================
create table if not exists stock_transfers (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  product_name text not null,
  from_store_id uuid references stores(id) not null,
  to_store_id uuid references stores(id) not null,
  from_store_name text,
  to_store_name text,
  quantity integer not null,
  notes text,
  transferred_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table stock_transfers enable row level security;
create policy "Public Access Stock Transfers" on stock_transfers for all using (true) with check (true);

-- ============================================================================
-- 4. ADD store_id COLUMN TO EXISTING TABLES
-- These use ALTER TABLE ADD COLUMN IF NOT EXISTS (PostgreSQL 11+)
-- ============================================================================

-- Products
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Bills
DO $$ BEGIN
  ALTER TABLE bills ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Repairs
DO $$ BEGIN
  ALTER TABLE repairs ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Expenditures
DO $$ BEGIN
  ALTER TABLE expenditures ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Customer Queries
DO $$ BEGIN
  ALTER TABLE customer_queries ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================================
-- 5. SEED: Create a default Main Admin user
--    Password: admin123 (stored as plain text for simplicity)
-- ============================================================================
INSERT INTO users (username, password, display_name, role, store_id)
VALUES ('admin', 'admin123', 'Main Administrator', 'main_admin', null)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 6. MIGRATION: Assign existing data to a default store (OPTIONAL)
--    Uncomment and run after creating your first store via the UI.
--    Replace 'YOUR_FIRST_STORE_UUID' with the actual store UUID.
-- ============================================================================
-- UPDATE products SET store_id = 'YOUR_FIRST_STORE_UUID' WHERE store_id IS NULL;
-- UPDATE bills SET store_id = 'YOUR_FIRST_STORE_UUID' WHERE store_id IS NULL;
-- UPDATE repairs SET store_id = 'YOUR_FIRST_STORE_UUID' WHERE store_id IS NULL;
-- UPDATE expenditures SET store_id = 'YOUR_FIRST_STORE_UUID' WHERE store_id IS NULL;
-- UPDATE customer_queries SET store_id = 'YOUR_FIRST_STORE_UUID' WHERE store_id IS NULL;
