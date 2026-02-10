-- Create a secure function to track order status by ID
-- This allows public access to specific order details without exposing sensitive customer info

CREATE OR REPLACE FUNCTION track_order_status(p_order_id UUID)
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
    WHERE o.id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access to public (anon) and logged-in users (authenticated)
GRANT EXECUTE ON FUNCTION track_order_status(UUID) TO anon, authenticated;
