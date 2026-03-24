-- ============================================================
-- Stock History Table Migration
-- Tracks create/edit/quantity/price changes per product
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id     UUID,
    change_type  TEXT NOT NULL,   -- 'Product Created', 'Product Edited', 'Quantity Update', 'Price Update'
    old_value    TEXT,
    new_value    TEXT,
    changed_by   TEXT,            -- future: user email/name
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast per-product lookups
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_changed_at  ON stock_history(changed_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all history
CREATE POLICY "allow_read_stock_history" ON stock_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert history
CREATE POLICY "allow_insert_stock_history" ON stock_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
