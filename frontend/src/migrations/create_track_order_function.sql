-- Create a secure function to track order status by ID (Partial Match Supported)
-- This allows public access to specific order details without exposing sensitive customer info

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
    LIMIT 1; -- Return only one match (best effort)
END;
$$ LANGUAGE plpgsql;

-- Grant access to public (anon) and logged-in users (authenticated)
GRANT EXECUTE ON FUNCTION track_order_status(TEXT) TO anon, authenticated;
