import { supabase } from '../lib/supabase';

/**
 * Validates a coupon code and calculates the potential discount.
 * 
 * @param {String} code - The coupon code to validate
 * @param {String} storeId - The store ID
 * @param {Array} cart - The current cart items
 * @param {Number} subtotal - Current subtotal of the cart
 * @param {String} customerEmail - (Optional) for usage limits per customer if implemented
 * @returns {Promise<Object>} { isValid, discountAmount, coupon, error }
 */
export const validateCoupon = async (code, storeId, cart, subtotal, customerEmail = null) => {
    if (!code || !code.trim()) {
        return { isValid: false, error: "Please enter a coupon code." };
    }

    try {
        // 1. Fetch Coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('store_id', storeId)
            .ilike('code', code.trim()) // Case-insensitive lookup
            .maybeSingle();

        if (error) {
            console.error("Coupon fetch error:", error);
            return { isValid: false, error: "Error validating coupon." };
        }

        if (!coupon) {
            return { isValid: false, error: "Invalid coupon code." };
        }

        // 2. Check Status & Dates
        if (!coupon.is_active) {
            return { isValid: false, error: "This coupon is no longer active." };
        }

        const now = new Date();
        const start = new Date(coupon.starts_at);
        if (now < start) {
            return { isValid: false, error: "This coupon is not yet valid." };
        }

        if (coupon.ends_at) {
            const end = new Date(coupon.ends_at);
            if (now > end) {
                return { isValid: false, error: "This coupon has expired." };
            }
        }

        // 3. Check Usage Limits (Global)
        if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
            return { isValid: false, error: "This coupon has reached its usage limit." };
        }

        // 4. Check Minimum Order Value
        if (coupon.min_order_value > 0 && subtotal < coupon.min_order_value) {
            return {
                isValid: false,
                error: `This coupon requires a minimum order of $${parseFloat(coupon.min_order_value).toFixed(2)}.`
            };
        }

        // 5. Calculate Discount
        let discountAmount = 0;
        let applicableItemsCount = 0;

        if (coupon.applies_to === 'all') {
            // Apply to entire subtotal (excluding exclusions)
            // Filter out excluded items
            const eligibleItems = cart.filter(item => {
                if (coupon.excluded_product_ids?.includes(item.id)) return false;
                // If we tracked excluded categories via JOIN, we'd check here. 
                // For now assuming we just check IDs or if item has category_id.
                // If item doesn't have category_id populated, we might miss this check.
                // Assuming cart item has category_id.
                if (coupon.excluded_product_ids?.includes(String(item.id))) return false;
                // Note: Schema stores JSONB strings or numbers? usually strings/numbers mixed in JS. Safe string conversion.

                return true;
            });

            if (eligibleItems.length === 0 && cart.length > 0) {
                return { isValid: false, error: "This coupon does not apply to the items in your cart." };
            }

            // Calculate base for discount
            // Percentage: (Sum of eligible items) * %
            // Fixed: Face value (capped at subtotal?)

            if (coupon.discount_type === 'percentage') {
                const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                discountAmount = eligibleTotal * (coupon.value / 100);
            } else {
                discountAmount = coupon.value;
            }

        } else if (coupon.applies_to === 'specific_products') {
            const includedIds = coupon.included_product_ids?.map(String) || [];
            const eligibleItems = cart.filter(item => includedIds.includes(String(item.id)));

            if (eligibleItems.length === 0) {
                return { isValid: false, error: "This coupon applies to specific products not in your cart." };
            }

            if (coupon.discount_type === 'percentage') {
                const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                discountAmount = eligibleTotal * (coupon.value / 100);
            } else {
                // Fixed amount likely applies ONCE per order, or per item?
                // Standard Shopify: Fixed amount off the entire order if condition met.
                // It doesn't multiply by item quantity usually unless specified "Per Item".
                // We'll assume "Fixed Amount off Order".
                discountAmount = coupon.value;
            }

        } else if (coupon.applies_to === 'specific_categories') {
            // Requires cart items to have category_id
            const includedCats = coupon.included_category_ids?.map(String) || [];
            const eligibleItems = cart.filter(item => includedCats.includes(String(item.category_id)));

            if (eligibleItems.length === 0) {
                return { isValid: false, error: "This coupon applies to specific collections not in your cart." };
            }

            if (coupon.discount_type === 'percentage') {
                const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                discountAmount = eligibleTotal * (coupon.value / 100);
            } else {
                discountAmount = coupon.value;
            }
        }

        // Cap discount at subtotal
        if (discountAmount > subtotal) {
            discountAmount = subtotal;
        }

        return {
            isValid: true,
            discountAmount,
            coupon,
            error: null
        };

    } catch (err) {
        console.error("Coupon validation error:", err);
        return { isValid: false, error: "Unexpected error validating coupon." };
    }
};
