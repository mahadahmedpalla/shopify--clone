/**
 * Formats a number as a currency string.
 * Handles extensive manual overrides for specific currencies where Intl.NumberFormat
 * might not provide the desired symbol (e.g., PKR -> Rs).
 *
 * @param {number|string} amount - The amount to format.
 * @param {string} currency - The ISO 4217 currency code (e.g., 'USD', 'PKR').
 * @param {string} locale - The locale to use for formatting (default: 'en-US').
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return '';

    // Manual Overrides
    if (currency === 'PKR') {
        // Enforce 2 decimal places for consistency
        return `Rs ${numericAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Add other overrides here if needed (e.g. if user wants 'SR' for SAR instead of SAR/﷼)
    // if (currency === 'SAR') return `SR ${numericAmount.toFixed(2)}`;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(numericAmount);
    } catch (error) {
        console.warn(`Error formatting currency ${currency}:`, error);
        // Fallback
        return `${currency} ${numericAmount.toFixed(2)}`;
    }
};
