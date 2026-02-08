-- Create order_comments table
CREATE TABLE IF NOT EXISTS order_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_customer_visible BOOLEAN DEFAULT false,
    author_role TEXT DEFAULT 'owner', -- 'owner', 'customer', 'system'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_comments ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Store Owners can do everything on comments for their store
CREATE POLICY "Store owners can manage comments" ON order_comments
    FOR ALL
    USING (store_id IN (
        SELECT store_id FROM  store_owners WHERE id = auth.uid()
    ));

-- 2. Public/Customers can VIEW visible comments for their order (if they have access to the order)
-- Since orders table has a public insert policy but restricted select, we might need to rely on the order_id linkage.
-- For now, let's keep it simple: if you have the order ID (e.g. from a tracking link), and the comment is visible, you can see it.
-- Or better, stricter:
-- Guests/Public can only Select if is_customer_visible = true
CREATE POLICY "Public can view visible comments" ON order_comments
    FOR SELECT
    USING (is_customer_visible = true);
