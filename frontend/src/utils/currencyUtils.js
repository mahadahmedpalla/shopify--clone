/**
 * Formats a number as a currency string.
 * Handles manual overrides for specific currencies (like PKR -> Rs).
 * 
 * @param {number|string} amount - The amount to format
 * @param {string} currency - The ISO currency code (e.g., 'USD', 'PKR')
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
    // Ensure amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return '';

    // Manual Overrides
    if (currency === 'PKR') {
        // "Rs 1,234.56"
        return `Rs ${numericAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    }

    if (currency === 'SAR') {
        // "SR 1,234.56" - Optional override if standard Intl is unsatisfactory
        // Standard Intl for 'en-US' might be 'SAR 100'
        return `SR ${numericAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    }

    if (currency === 'AED') {
        // "AED 1,234.56"
        return `AED ${numericAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    }

    // Default Intl Formatting
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(numericAmount);
    } catch (e) {
        // Fallback if currency code is invalid
        console.warn(`Invalid currency code: ${currency}`);
        return `$${numericAmount.toFixed(2)}`;
    }
};
