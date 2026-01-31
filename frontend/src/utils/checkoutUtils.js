import { supabase } from '../lib/supabase';

/**
 * Validates a shipping address object.
 * @param {Object} address 
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateAddress = (address) => {
    const errors = {};
    if (!address.firstName?.trim()) errors.firstName = "First name is required";
    if (!address.lastName?.trim()) errors.lastName = "Last name is required";
    if (!address.address1?.trim()) errors.address1 = "Address is required";
    if (!address.city?.trim()) errors.city = "City is required";
    if (!address.zip?.trim()) errors.zip = "Postal code is required";
    // basic email validation if passed
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
        errors.email = "Invalid email address";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Calculates order totals including shipping, tax, and discounts.
 * @param {Array} items - Cart items
 * @param {Object} shippingRate - Selected shipping rate object (optional)
 * @param {Number} discountAmount - Applied discount amount (optional)
 */
/**
 * Calculates order totals including shipping, tax, and discounts.
 * @param {Array} items - Cart items
 * @param {Object} shippingRate - Selected shipping rate object (optional)
 * @param {Number} discountAmount - Applied discount amount (optional)
 * @param {Array} taxes - List of available taxes (optional)
 * @param {String} country - Customer country (optional)
 */
export const calculateOrderTotals = (items, shippingRate = null, discountAmount = 0, taxes = [], country = null) => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const shippingCost = shippingRate ? parseFloat(shippingRate.rate) : 0;

    // Tax Calculation
    let taxTotal = 0;
    const taxesBreakdown = {}; // { 'VAT': 12.50, 'GST': 5.00 }

    if (country && taxes && taxes.length > 0) {
        // Filter taxes for this country
        const applicableTaxes = taxes.filter(t => t.is_active && t.country === country);

        items.forEach(item => {
            const itemTotal = parseFloat(item.price) * item.quantity;

            applicableTaxes.forEach(tax => {
                let applies = false;

                // Check Inclusion
                if (tax.applies_to === 'all') {
                    applies = true;
                } else if (tax.applies_to === 'specific_products') {
                    if (tax.included_product_ids?.includes(item.id)) applies = true;
                } else if (tax.applies_to === 'specific_categories') {
                    if (tax.included_category_ids?.includes(item.category_id)) applies = true;
                }

                // Check Exclusion
                if (applies) {
                    if (tax.excluded_product_ids?.includes(item.id)) applies = false;
                    // Note: Category exclusion schema exists but simple logic for now:
                    if (tax.excluded_category_ids?.includes(item.category_id)) applies = false;
                }

                if (applies) {
                    let taxAmount = 0;
                    if (tax.type === 'percentage') {
                        taxAmount = itemTotal * (tax.value / 100);
                    } else {
                        // Fixed amount per item
                        taxAmount = (tax.value * item.quantity);
                    }

                    taxTotal += taxAmount;

                    // Accumulate breakdown
                    if (!taxesBreakdown[tax.code]) {
                        taxesBreakdown[tax.code] = 0;
                    }
                    taxesBreakdown[tax.code] += taxAmount;
                }
            });
        });
    }

    const total = Math.max(0, subtotal + shippingCost + taxTotal - discountAmount);

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        taxTotal: parseFloat(taxTotal.toFixed(2)),
        taxBreakdown: taxesBreakdown, // Return the breakdown
        discountTotal: parseFloat(discountAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        currency: 'USD'
    };
};

/**
 * Creates a new order in Supabase.
 * @param {Object} orderData 
 */
export const createOrder = async (orderData) => {
    // Sanitize Shipping Rate ID
    let finalShippingRateId = orderData.shippingRate?.id;
    // Check if it's a valid UUID (simple check or length)
    // If it's a custom ID like 'combined_specific' or 'free', set to null
    if (finalShippingRateId && (finalShippingRateId.length < 30 || !finalShippingRateId.includes('-'))) {
        finalShippingRateId = null;
    }

    // 1. Prepare payload matching schema
    const payload = {
        store_id: orderData.storeId,
        customer_email: orderData.customer.email,
        customer_name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
        customer_phone: orderData.shippingAddress.phone,

        shipping_address: orderData.shippingAddress,
        billing_address: {
            ...(orderData.billingAddress || orderData.shippingAddress),
            coupon_code: orderData.couponCode // Hack: Store coupon in billing_address JSONB
        },

        items: orderData.items,

        currency: orderData.totals.currency,
        subtotal: orderData.totals.subtotal,
        shipping_cost: orderData.totals.shippingCost,
        shipping_rate_id: finalShippingRateId,
        discount_total: orderData.totals.discountTotal,
        tax_total: orderData.totals.taxTotal,
        total: orderData.totals.total,

        payment_method: orderData.paymentMethod || 'manual',
        status: 'pending'
    };

    const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Calculates available shipping options based on cart items and active rates.
 * Supports "Additive Shipping": sums specific product rates + general cart rates.
 * 
 * @param {Array} cartItems 
 * @param {Array} availableRates - Raw rates from DB for the country
 * @returns {Array} options - [{ id, name, rate, breakdown: [] }]
 */
export const calculateShippingOptions = (cartItems, availableRates) => {
    // 1. Separate Specific Rules vs General Rules
    const specificproductRates = availableRates.filter(r => r.applies_to === 'specific_products');
    const specificCategoryRates = availableRates.filter(r => r.applies_to === 'specific_categories');
    const generalRates = availableRates.filter(r => r.applies_to === 'all');

    // 0. Calculate Total Cart Value (used for Min Order Thresholds)
    const cartTotal = cartItems.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);

    // 2. Classify Items
    let lockedShippingCost = 0;
    let lockedBreakdown = [];

    // 2b. Refined Grouping Logic
    const specificGroups = {}; // { rateId: { rate, items: [] } }
    const generalItemsList = [];

    cartItems.forEach(item => {
        // A. Product Specific
        const productRate = specificproductRates.find(r => r.included_product_ids?.some(id => String(id) === String(item.id)));
        if (productRate) {
            if (!specificGroups[productRate.id]) specificGroups[productRate.id] = { rate: productRate, items: [] };
            specificGroups[productRate.id].items.push(item);
            return;
        }

        // B. Category Specific
        // Robust check: Convert both to string to avoid type mismatches
        const categoryRate = specificCategoryRates.find(r => r.included_category_ids?.some(id => String(id) === String(item.category_id)));
        if (categoryRate) {
            if (!specificGroups[categoryRate.id]) specificGroups[categoryRate.id] = { rate: categoryRate, items: [] };
            specificGroups[categoryRate.id].items.push(item);
            return;
        }

        // C. General
        generalItemsList.push(item);
    });

    // 3. Calculate Locked Cost
    // 3. Calculate Locked Cost
    Object.values(specificGroups).forEach(group => {
        let cost = parseFloat(group.rate.amount || 0);
        let note = '';

        // APPLY MIN ORDER THRESHOLD LOGIC (Legacy "Free Shipping" behavior)
        if (group.rate.min_order_value !== null && group.rate.min_order_value !== undefined && group.rate.min_order_value !== '') {
            const minVal = parseFloat(group.rate.min_order_value);
            if (!isNaN(minVal) && minVal > 0) {
                if (cartTotal >= minVal) {
                    cost = 0;
                    note = 'Free Shipping Applied';
                }
            }
        }

        lockedShippingCost += cost;
        lockedBreakdown.push({
            name: group.rate.name,
            cost: cost,
            items: group.items.map(i => i.name).join(', '),
            note: note
        });
    });

    // 4. Generate Options based on General Items
    // If NO general items, mapped options is just ONE (Locked Cost)
    // If YES general items, mapped options is (Locked + General Option 1), (Locked + General Option 2)...

    let options = [];

    if (generalItemsList.length === 0) {
        if (lockedBreakdown.length > 0) {
            options.push({
                id: 'combined_specific',
                name: 'Shipping', // Generic name, breakdown shows details
                rate: lockedShippingCost,
                breakdown: lockedBreakdown,
                is_auto_applied: true
            });
        } else {
            // No items? Free?
            options.push({ id: 'free', name: 'Free Shipping', rate: 0, breakdown: [] });
        }
    } else {
        // We have general items, we need to find applicable general rates
        // Filter by min_order_value based on TOTAL cart value (standard behavior)
        const cartTotal = cartItems.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);

        const validGeneralRates = generalRates.map(r => {
            // Logic Change: min_order_value acts as a "Free Shipping Threshold"
            // If Total >= min_order_value, price becomes 0.
            // If Total < min_order_value, price remains as is.
            // Rate is ALWAYS valid (unless we want to support exclusion too? user implied strict free threshold)

            let finalAmount = parseFloat(r.amount || 0);
            let isFreeApplied = false;

            if (r.min_order_value !== null && r.min_order_value !== undefined && r.min_order_value !== '') {
                const minVal = parseFloat(r.min_order_value);
                if (!isNaN(minVal) && minVal > 0) {
                    if (cartTotal >= minVal) {
                        finalAmount = 0;
                        isFreeApplied = true;
                    }
                    // If cartTotal < minVal, we typically STILL show the rate at full price 
                    // per user request "under 14000 there will be shipping options available"
                }
            }

            return { ...r, finalAmount, isFreeApplied };
        });

        if (validGeneralRates.length === 0) {
            // Fallback logic
            if (lockedBreakdown.length > 0) {
                options.push({
                    id: 'combined_specific_partial',
                    name: 'Shipping (Partial)',
                    rate: lockedShippingCost,
                    breakdown: [...lockedBreakdown, { name: 'Standard Items', cost: 0, note: 'Rate not found' }],
                    warning: "Some items do not have eligible shipping rates."
                });
            }
        } else {
            options = validGeneralRates.map(genRate => {
                const genCost = genRate.finalAmount;
                const totalCost = lockedShippingCost + genCost;

                const breakdown = [...lockedBreakdown];

                let rateName = genRate.name;
                // Optional: Append info about free shipping
                // if (genRate.isFreeApplied) rateName += " (Free Shipping Qualified)";

                breakdown.push({
                    name: rateName,
                    cost: genCost,
                    items: generalItemsList.map(i => i.name).join(', ')
                });

                return {
                    id: genRate.id,
                    name: rateName,
                    rate: totalCost,
                    breakdown: breakdown,
                    original_rate_obj: genRate,
                    // Propagate strict COD restriction if ANY locked rate or the general rate forbids it
                    accepts_cod: genRate.accepts_cod !== false // Default true, only false if explicitly false
                };
            });
        }
    }

    // Final Pass: If we have specific groups (lockedShippingCost > 0 or lockedBreakdown), check their COD status too.
    // However, the structure above returns distinct OPTIONS.
    // Each option (which represents a "Shipping Method" the user selects) needs to know if it allows COD.
    // For "Combined Specific" (fallback option), we need to check ALL locked rates.

    options = options.map(opt => {
        // Gather all involved rates
        // 1. General Rate (if exists) -> opt.original_rate_obj
        // 2. Specific Rates -> found in `specificGroups` (which is closure scope here)

        let allRatesAllowCod = true;

        // Check General Rate
        if (opt.original_rate_obj && opt.original_rate_obj.accepts_cod === false) {
            allRatesAllowCod = false;
        }

        // Check Specific Locked Rates (These apply to ALL options effectively because they are locked)
        Object.values(specificGroups).forEach(g => {
            if (g.rate.accepts_cod === false) {
                allRatesAllowCod = false;
            }
        });

        return { ...opt, accepts_cod: allRatesAllowCod };
    });

    return options;
};
