import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBestPrice } from '../utils/discountUtils';

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
            cartCount: 0,
            refreshCart: async () => { }
        };
    }
    return context;
};

export const CartProvider = ({ children, storeKey = 'default' }) => {
    const [cart, setCart] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [storeDiscounts, setStoreDiscounts] = useState([]); // Store active discounts
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

    // Refresh Cart Prices on Load
    useEffect(() => {
        if (hydrated && cart.length > 0) {
            refreshCart();
        }
    }, [hydrated, storeKey]); // Only run once on hydration/store change

    const refreshCart = async () => {
        if (!cart || cart.length === 0) return;

        try {
            const productIds = [...new Set(cart.map(item => item.id))];

            // Fetch fresh product data
            const { data: products } = await supabase
                .from('products')
                .select('*')
                .in('id', productIds);

            if (!products) return;

            // Fetch fresh variant data
            const { data: variants } = await supabase
                .from('product_variants')
                .select('*')
                .in('product_id', productIds);

            // Fetch active discounts
            const now = new Date().toISOString();
            const { data: discounts } = await supabase
                .from('discounts')
                .select('*')
                .eq('store_id', storeKey)
                .eq('is_active', true)
                .eq('is_active', true)
                .lte('starts_at', now);

            setStoreDiscounts(discounts || []);


            setCart(prevCart => {
                return prevCart.map(item => {
                    const product = products.find(p => p.id === item.id);
                    if (!product) return null; // Product no longer exists

                    let newPrice = product.price;
                    let newCompareAt = product.compare_at_price;
                    let newName = product.name;
                    let newImage = product.images?.[0] || item.image;

                    // Determine base price/compare from variant if applicable
                    let basePrice = product.price;
                    let baseCompare = product.compare_at_price;

                    if (item.variantId && variants) {
                        const variant = variants.find(v => v.id === item.variantId);
                        if (variant) {
                            basePrice = variant.use_base_price ? product.price : variant.price;
                            baseCompare = variant.compare_at_price;
                            newName = product.name;
                        } else {
                            return null;
                        }
                    }

                    // Calculate Best Price with Discounts
                    const calcProduct = {
                        ...product,
                        price: basePrice,
                        comparePrice: baseCompare,
                        category_id: product.category_id
                    };

                    const { finalPrice, comparePrice } = calculateBestPrice(calcProduct, discounts || []);

                    return {
                        ...item,
                        // Ensure category_id is updated/present
                        category_id: product.category_id,
                        price: finalPrice,
                        compareAtPrice: comparePrice,
                        compare_at_price: comparePrice,
                        name: newName,
                        image: newImage
                    };
                }).filter(Boolean);
            });

        } catch (error) {
            console.error("Failed to refresh cart prices:", error);
        }
    };

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
            cartCount,
            storeDiscounts,
            refreshCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
