import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        console.warn('useCart used outside of CartProvider');
        return {
            cart: [],
            addToCart: () => { },
            removeFromCart: () => { },
            updateQuantity: () => { },
            clearCart: () => { },
            isOpen: false,
            setIsOpen: () => { },
            cartTotal: 0,
            cartCount: 0
        };
    }
    return context;
};

export const CartProvider = ({ children, storeKey = 'default' }) => {
    const [cart, setCart] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const storageKey = `shopping-cart-${storeKey}`;

    // Load from local storage
    useEffect(() => {
        // Reset state when storeKey changes
        setHydrated(false);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                setCart(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse cart', e);
                setCart([]);
            }
        } else {
            setCart([]);
        }
        setHydrated(true);
    }, [storageKey]);

    // Save to local storage
    useEffect(() => {
        if (hydrated) {
            localStorage.setItem(storageKey, JSON.stringify(cart));
        }
    }, [cart, hydrated, storageKey]);

    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            // Find existing item with matching ID AND Variant ID
            const existing = prev.find(item =>
                item.id === product.id &&
                item.variantId === product.variantId
            );

            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.variantId === product.variantId)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity }];
        });
        setIsOpen(true); // Auto-open drawer
    };

    const removeFromCart = (id, variantId) => {
        setCart(prev => prev.filter(item => !(item.id === id && item.variantId === variantId)));
    };

    const updateQuantity = (id, variantId, quantity) => {
        if (quantity < 1) return;
        setCart(prev => prev.map(item => (item.id === id && item.variantId === variantId) ? { ...item, quantity } : item));
    }

    const clearCart = () => {
        setCart([]);
    }

    const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.price || 0) * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isOpen,
            setIsOpen,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
