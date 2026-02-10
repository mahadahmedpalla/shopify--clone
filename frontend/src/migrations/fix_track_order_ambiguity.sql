-- Drop the old UUID version of the function to avoid ambiguity
DROP FUNCTION IF EXISTS track_order_status(UUID);

-- Ensure the TEXT version exists (re-run to be safe, though not strictly necessary if previous step succeeded)
CREATE OR REPLACE FUNCTION track_order_status(p_order_id TEXT)
RETURNS TABLE (
    id UUID,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    currency TEXT,
    total NUMERIC,
    store_id UUID
)
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure input is at least 8 characters to prevent easy guessing
    IF length(p_order_id) < 8 THEN
        RAISE EXCEPTION 'Order ID must be at least 8 characters';
    END IF;

    RETURN QUERY
    SELECT 
        o.id,
        o.status,
        o.created_at,
        o.updated_at,
        o.currency,
        o.total,
        o.store_id
    FROM orders o
    WHERE o.id::text ILIKE p_order_id || '%' -- Case-insensitive prefix match
    LIMIT 1; -- Return only one match
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION track_order_status(TEXT) TO anon, authenticated;
