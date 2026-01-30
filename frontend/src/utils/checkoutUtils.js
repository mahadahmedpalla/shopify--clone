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
export const calculateOrderTotals = (items, shippingRate = null, discountAmount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const shippingCost = shippingRate ? parseFloat(shippingRate.rate) : 0;

    // Tax Calculation (placeholder - flat 0% or logic can be added later)
    const taxRate = 0;
    const taxTotal = subtotal * taxRate;

    const total = Math.max(0, subtotal + shippingCost + taxTotal - discountAmount);

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        taxTotal: parseFloat(taxTotal.toFixed(2)),
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
    // 1. Prepare payload matching schema
    const payload = {
        store_id: orderData.storeId,
        customer_email: orderData.customer.email,
        customer_name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
        customer_phone: orderData.shippingAddress.phone,

        shipping_address: orderData.shippingAddress,
        billing_address: orderData.billingAddress || orderData.shippingAddress, // Default to shipping

        items: orderData.items,

        currency: orderData.totals.currency,
        subtotal: orderData.totals.subtotal,
        shipping_cost: orderData.totals.shippingCost,
        shipping_rate_id: orderData.shippingRate?.id || null,
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
