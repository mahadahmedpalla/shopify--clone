export const calculateBestPrice = (product, discounts = []) => {
    // Default: Return original product state
    let result = {
        finalPrice: parseFloat(product.price || 0),
        comparePrice: parseFloat(product.compare_price || product.comparePrice || 0),
        discountLabel: null,
        hasDiscount: false
    };

    // Normalize Compare Price (if 0 or null, it's same as price essentially, for calculation purposes)
    // But if we apply a discount, the OLD price becomes the comparePrice.

    if (!discounts || discounts.length === 0) {
        // Just standard static discount check
        if (result.comparePrice > result.finalPrice) {
            result.hasDiscount = true;
            result.discountPct = Math.round(((result.comparePrice - result.finalPrice) / result.comparePrice) * 100);
        }
        return result;
    }

    const now = new Date();
    let bestDiscountAmount = 0;
    let appliedRule = null;

    // Filter applicable discounts
    const validDiscounts = discounts.filter(d => {
        if (!d.is_active) return false;

        // Date Check
        const start = new Date(d.starts_at);
        if (now < start) return false;
        if (d.ends_at) {
            const end = new Date(d.ends_at);
            if (now > end) return false;
        }

        // Min Order Check (For Product Display, we generally ignore rules with Min Order > 0 unless we want to hint)
        // **DECISION**: For PDP Price Display, we strictly show UNCONDITIONAL discounts (Min Order <= 0).
        if (d.min_order_value > 0) return false;

        // Applicability Check
        if (d.applies_to === 'all') {
            // Check exclusions
            if (d.excluded_product_ids?.includes(product.id)) return false;
            if (d.excluded_category_ids?.includes(product.category_id)) return false;
            return true;
        }

        if (d.applies_to === 'specific_products') {
            return d.included_product_ids?.includes(product.id);
        }

        if (d.applies_to === 'specific_categories') {
            return d.included_category_ids?.includes(product.category_id);
        }

        return false;
    });

    // Priority Helper
    // We utilize the basePrice for calculations
    const basePrice = result.finalPrice;

    const getPriority = (d) => {
        if (d.applies_to === 'specific_products') return 1;
        if (d.applies_to === 'specific_categories') return 2;
        return 3;
    };

    // Group valid discounts by priority
    // We only want to consider the HIGHEST priority tier that has any matches.
    let bestPriority = 4;
    validDiscounts.forEach(d => {
        const p = getPriority(d);
        if (p < bestPriority) bestPriority = p;
    });

    // Filter to only the best tier
    const primaryCandidateDiscounts = validDiscounts.filter(d => getPriority(d) === bestPriority);

    // Now find the best VALID savings within this tier
    primaryCandidateDiscounts.forEach(d => {
        let savings = 0;
        if (d.discount_type === 'percentage') {
            savings = basePrice * (d.value / 100);
        } else if (d.discount_type === 'fixed_amount') {
            savings = d.value;
        }

        if (savings > bestDiscountAmount) {
            bestDiscountAmount = savings;
            appliedRule = d;
        }
    });

    // Apply Best Discount
    if (appliedRule && bestDiscountAmount > 0) {
        // If there was ALREADY a static discount (comparePrice > price), 
        // we usually apply the system discount ON TOP OF the current selling price? 
        // OR does system discount override?
        // Standard E-commerce: System discount usually applies to the Selling Price.
        // So New Price = Current Selling Price - System Discount.
        // New Compare Price = Original Compare Price OR Original Selling Price.

        const originalExposedPrice = result.finalPrice; // $100 (was $120)

        result.finalPrice = Math.max(0, originalExposedPrice - bestDiscountAmount);

        // If matched, we show the Previous Price as the Compare Price
        // If it already had a compare price ($120), we keep showing $120? 
        // Or do we show $100?
        // Let's use the HIGHEST visible price as the anchor.
        result.comparePrice = result.comparePrice > originalExposedPrice ? result.comparePrice : originalExposedPrice;

        result.hasDiscount = true;
        result.discountLabel = appliedRule.name;
        result.discountPct = Math.round(((result.comparePrice - result.finalPrice) / result.comparePrice) * 100);
    } else {
        // Fallback to static check again
        if (result.comparePrice > result.finalPrice) {
            result.hasDiscount = true;
            result.discountPct = Math.round(((result.comparePrice - result.finalPrice) / result.comparePrice) * 100);
        }
    }

    return result;
};
