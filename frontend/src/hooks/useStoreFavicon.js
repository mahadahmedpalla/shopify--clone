import { useEffect } from 'react';

export function useStoreFavicon(store) {
    useEffect(() => {
        if (!store?.favicon_url) return;

        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        // Store original href to revert later
        const originalHref = link.href;

        // Update favicon
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = store.favicon_url;

        // Ensure it's in head
        if (!link.parentNode) {
            document.getElementsByTagName('head')[0].appendChild(link);
        }

        // Cleanup: Revert to original on unmount or when store changes
        return () => {
            link.href = originalHref;
        };
    }, [store?.favicon_url]);
}
