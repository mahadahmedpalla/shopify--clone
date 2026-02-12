/**
 * Helper to generate store paths that work for both:
 * 1. Sub-URL mode: /s/my-store/product/123
 * 2. Custom Domain mode: /product/123
 * 
 * @param {string} path - The relative path (e.g., '/checkout', '/p/123')
 * @param {string|null} storeSubUrl - The store's sub_url (if in sub-url mode)
 * @returns {string} The full path
 */
export const getStorePath = (path, storeSubUrl) => {
    // If no storeSubUrl is provided, valid assumption is we are on a custom domain root
    // OR we are calling this incorrectly.
    // If we are on custom domain, storeSubUrl should be null/undefined in the context of "prefix".

    // Clean path to ensure it starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    if (storeSubUrl) {
        return `/s/${storeSubUrl}${cleanPath}`;
    }

    return cleanPath;
};
