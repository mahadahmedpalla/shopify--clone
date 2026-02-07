-- Function to handle inventory updates based on order status
CREATE OR REPLACE FUNCTION handle_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    product_id TEXT;
    variant_id TEXT;
    qty INTEGER;
    current_stock INTEGER;
BEGIN
    -- CASE 1: New Order (INSERT)
    IF (TG_OP = 'INSERT') THEN
        -- Loop through items in the new order
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := item->>'id';
            variant_id := item->>'variantId';
            qty := (item->>'quantity')::INTEGER;

            IF variant_id IS NOT NULL AND variant_id != '' THEN
                -- Update Variant Stock
                UPDATE product_variants
                SET quantity = quantity - qty
                WHERE id = variant_id;
            ELSE
                -- Update Base Product Stock
                UPDATE products
                SET quantity = quantity - qty
                WHERE id = product_id;
            END IF;
        END LOOP;
        RETURN NEW;
    END IF;

    -- CASE 2: Order Cancelled or Refunded (UPDATE)
    -- Only trigger if status CHANGED to 'cancelled' or 'refunded'
    -- And PREVIOUS status was NOT 'cancelled' or 'refunded' (prevent double counting)
    IF (TG_OP = 'UPDATE') THEN
        IF (NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded')) THEN
            -- Loop through items to RESTORE stock
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := item->>'id';
                variant_id := item->>'variantId';
                qty := (item->>'quantity')::INTEGER;

                IF variant_id IS NOT NULL AND variant_id != '' THEN
                    -- Restore Variant Stock
                    UPDATE product_variants
                    SET quantity = quantity + qty
                    WHERE id = variant_id;
                ELSE
                    -- Restore Base Product Stock
                    UPDATE products
                    SET quantity = quantity + qty
                    WHERE id = product_id;
                END IF;
            END LOOP;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS on_order_placed_inventory ON orders;

CREATE TRIGGER on_order_placed_inventory
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_inventory();
