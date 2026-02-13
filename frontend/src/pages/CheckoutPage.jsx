import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart, CartProvider } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { CheckoutForm } from '../components/checkout/CheckoutForm';
import { validateAddress, calculateOrderTotals, createOrder, calculateShippingOptions } from '../utils/checkoutUtils';
import { calculateOrderDiscount } from '../utils/discountUtils';
import { validateCoupon, incrementCouponUsage } from '../utils/couponUtils';
import { ShoppingBag } from 'lucide-react';
import { getCountryName } from '../lib/countries';
import { Skeleton } from '../components/ui/Skeleton';

import { useStoreFavicon } from '../hooks/useStoreFavicon';

export function CheckoutPage({ customDomainStore }) {
    const { storeSubUrl } = useParams();
    const [store, setStore] = useState(customDomainStore || null);
    const [loading, setLoading] = useState(!customDomainStore);

    // Favicon
    useStoreFavicon(store);

    useEffect(() => {
        if (customDomainStore) {
            setStore(customDomainStore);
            setLoading(false);
            return;
        }

        const fetchStore = async () => {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('sub_url', storeSubUrl)
                    .single();
                if (error) throw error;
                setStore(data);
            } catch (err) {
                console.error("Error loading store:", err);
            } finally {
                setLoading(false);
            }
        };

        if (storeSubUrl) fetchStore();
    }, [storeSubUrl, customDomainStore]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column (Forms) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>

                {/* Right Column (Summary) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6 h-fit">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-8 w-full rounded-lg mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (!store) return <div className="p-8 text-center text-red-500">Store not found</div>;

    return (
        <CartProvider storeKey={store.id}>
            <CheckoutContent store={store} storeSubUrl={storeSubUrl} customDomainStore={customDomainStore} />
        </CartProvider>
    );
}

function CheckoutContent({ store, storeSubUrl, customDomainStore }) {
    const { cart, clearCart } = useCart();
    const [step, setStep] = useState(1);
    const [placingOrder, setPlacingOrder] = useState(false);

    // Form State
    // Form State
    const [customerInfo, setCustomerInfo] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address1: '',
        address2: '',
        city: '',
        country: '', // Will be set after store loads
        zip: '',
        phone: ''
    });

    const [errors, setErrors] = useState({});

    // Shipping State
    const [shippingRates, setShippingRates] = useState([]); // Fetch from DB later
    const [selectedRate, setSelectedRate] = useState(null);

    // Order Totals
    const [totals, setTotals] = useState({
        subtotal: 0,
        shippingCost: 0,
        taxTotal: 0,
        discountTotal: 0,
        total: 0,
        currency: store.currency || 'USD'
    });

    const [checkoutSettings, setCheckoutSettings] = useState({});

    // Store Discounts (Automatic)
    const [storeDiscounts, setStoreDiscounts] = useState([]);

    // Store Taxes
    const [storeTaxes, setStoreTaxes] = useState([]);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState(null);
    const [couponSuccess, setCouponSuccess] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('cod');

    // Allowed Countries
    const allowedCountries = store.allowed_countries || null; // null means all

    // ... (existing effects)

    // Enforce COD Restriction
    useEffect(() => {
        if (selectedRate && selectedRate.accepts_cod === false) {
            if (paymentMethod === 'cod') {
                setPaymentMethod('credit_card');
            }
        }
    }, [selectedRate, paymentMethod]);

    // ... (existing fetchRates effect) ...

    // ... (existing fetchRates effect) ...

    // Fetch Store Discounts (Independent of Country)
    useEffect(() => {
        const fetchDiscounts = async () => {
            try {
                const { data: discounts } = await supabase
                    .from('discounts')
                    .select('*')
                    .eq('store_id', store.id)
                    .eq('is_active', true);

                if (discounts) setStoreDiscounts(discounts);
            } catch (err) {
                console.error("Error fetching discounts:", err);
            }
        };

        fetchDiscounts();
    }, [store.id]);

    // Set Default Country if not set
    useEffect(() => {
        if (!customerInfo.country && allowedCountries) {
            // Default to first allowed country, or US if allowed, or just first one
            // If allowedCountries is null (all allowed), default to US
            let defaultCountry = 'US';
            if (allowedCountries && allowedCountries.length > 0) {
                // specific list
                if (allowedCountries.includes('US')) {
                    defaultCountry = 'US';
                } else {
                    defaultCountry = allowedCountries[0];
                }
            }
            setCustomerInfo(prev => ({ ...prev, country: defaultCountry }));
        } else if (!customerInfo.country && !allowedCountries) {
            // Null allowedCountries means ALL are allowed. Default to US.
            setCustomerInfo(prev => ({ ...prev, country: 'US' }));
        }
    }, [allowedCountries]);

    // Fetch Store Taxes
    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const { data: taxes } = await supabase
                    .from('taxes')
                    .select('*')
                    .eq('store_id', store.id)
                    .eq('is_active', true);

                if (taxes) setStoreTaxes(taxes);
            } catch (err) {
                console.error("Error fetching taxes:", err);
            }
        };

        fetchTaxes();
    }, [store.id]);

    // Fetch Shipping Rates when Country Changes or Cart Changes
    useEffect(() => {
        const fetchRates = async () => {
            if (!customerInfo.country) return;

            try {
                // Fetch active rates for this store
                // Filter by Country (Specific OR All)
                // Filter by Min Order Value is handled in utility or here?
                // Lets fetch all active candidates for the country first.

                const { data: rates, error } = await supabase
                    .from('shipping_rates')
                    .select('*')
                    .eq('store_id', store.id)
                    .eq('is_active', true)
                    .or(`country.eq.All,country.eq.${customerInfo.country}`);

                if (error) throw error;

                // Calculate Options based on Cart
                const options = calculateShippingOptions(cart, rates || []);
                setShippingRates(options);

                // Auto-select logic (Only applies if user is on Shipping step or later)
                if (options.length > 0 && step >= 2) {
                    // 1. If only 1 option, select it
                    if (options.length === 1) {
                        setSelectedRate(options[0]);
                    }
                    // 2. If previously selected option is still valid, keep it
                    else if (selectedRate) {
                        const stillValid = options.find(r => r.id === selectedRate.id);
                        if (stillValid) {
                            setSelectedRate(stillValid);
                        } else {
                            // Previous selection invalid, select cheapest
                            const cheapest = options.reduce((prev, curr) => prev.rate < curr.rate ? prev : curr);
                            setSelectedRate(cheapest);
                        }
                    }
                    // 3. If no selection, select cheapest (Better UX)
                    else {
                        const cheapest = options.reduce((prev, curr) => prev.rate < curr.rate ? prev : curr);
                        setSelectedRate(cheapest);
                    }
                } else if (options.length > 0 && step < 2) {
                    // Start fresh if going back? Or keep selection if exists?
                    // Usually we don't want to clear it if they just went back to edit info.
                    // But we don't want to AUTO select if they haven't been there.
                    if (!selectedRate) {
                        // Do nothing, let user select when they get there.
                    }
                } else {
                    setSelectedRate(null);
                }

            } catch (err) {
                console.error("Error fetching rates:", err);
            }
        };

        if (step >= 1) { // Fetch if on info step or later
            fetchRates();
        }
    }, [store.id, customerInfo.country, cart, step]);

    // Recalculate totals when dependencies change
    useEffect(() => {
        if (cart.length > 0) {
            // 1. Calculate Item-Level total
            const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

            // 2. Calculate Order-Level Automatic Discount (MOV)
            const autoDiscount = calculateOrderDiscount(subtotal, storeDiscounts);

            // 3. Calculate Coupon Discount
            // Note: If we had a coupon applied, we need to Re-Validate it just in case cart changed
            // For now, we'll assume the fixed amount stored in appliedCoupon is valid OR we could store the coupon OBJECT and re-calc.
            // Let's rely on the `appliedCoupon.amount` for now, but strictly we should re-run validation if cart changes.
            // Simplified: If cart changes, we might want to remove coupon or re-validate. 
            // Better UX: Re-validate silently.
            // For MVP: We will just use the value if it exists, but realize it might become invalid if items are removed.
            // TODO: Re-validate coupon on cart change.

            let totalDiscountAmount = autoDiscount.discountAmount;
            let couponDiscount = 0;

            if (appliedCoupon) {
                const coupon = appliedCoupon.coupon;
                // If percentage based AND applies to all, apply to the remaining balance (Compound)
                // This prevents 50% coupon + 30% auto discount = 80% total discount.
                // Instead: 30% auto triggers first, then 50% of the REMAINING.
                if (coupon.discount_type === 'percentage' && coupon.applies_to === 'all') {
                    const remainingSubtotal = Math.max(0, subtotal - autoDiscount.discountAmount);
                    couponDiscount = remainingSubtotal * (coupon.value / 100);
                } else {
                    // Start with the amount calculated by validateCoupon (based on item prices)
                    couponDiscount = appliedCoupon.discountAmount;
                }

                // Cap discount at remaining total to avoid negative
                if (totalDiscountAmount + couponDiscount > subtotal) {
                    couponDiscount = Math.max(0, subtotal - totalDiscountAmount);
                }

                totalDiscountAmount += couponDiscount;
            }

            const countryName = getCountryName(customerInfo.country); // Convert Code (US) to Name (United States) for Tax matching
            const newTotals = calculateOrderTotals(cart, selectedRate, totalDiscountAmount, storeTaxes, countryName);
            setTotals(newTotals);
        }
    }, [cart, selectedRate, storeDiscounts, appliedCoupon, storeTaxes, customerInfo.country]);

    // Coupon Handlers
    const handleApplyCoupon = async () => {
        setCouponError(null);
        setCouponSuccess(null);
        setIsApplyingCoupon(true);

        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

        const result = await validateCoupon(couponCode, store.id, cart, subtotal);

        if (result.isValid) {
            setAppliedCoupon(result);
            setCouponSuccess(`Coupon "${result.coupon.code}" applied!`);
            setCouponCode('');
        } else {
            setCouponError(result.error);
            setAppliedCoupon(null);
        }
        setIsApplyingCoupon(false);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponSuccess(null);
        setCouponError(null);
    };


    const handleInfoSubmit = () => {
        const validation = validateAddress(customerInfo);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }
        setErrors({});
        setStep(2);
    };

    const handleShippingSubmit = () => {
        if (!selectedRate) {
            alert("Please select a shipping method");
            return;
        }
        setStep(3);
    };

    const handlePaymentSubmit = async () => {
        setPlacingOrder(true);
        try {
            const orderPayload = {
                storeId: store.id,
                customer: { email: customerInfo.email },
                shippingAddress: customerInfo,
                billingAddress: customerInfo, // Same for now
                items: cart,
                totals: totals, // Use calculated totals
                shippingRate: selectedRate,
                paymentMethod: paymentMethod,
                couponCode: appliedCoupon ? appliedCoupon.coupon.code : null // Track used coupon
            };

            const newOrder = await createOrder(orderPayload);
            console.log("Order Created:", newOrder);

            // Increment Coupon Usage
            if (appliedCoupon) {
                await incrementCouponUsage(appliedCoupon.coupon.code, store.id);
            }

            alert(`Order #${newOrder.id.slice(0, 8)} placed successfully! Redirecting...`);

            // Clear cart before redirecting
            clearCart();

            // Redirect to success page
            // Redirect to success page
            const redirectUrl = customDomainStore
                ? `/order/${newOrder.id}?token=${newOrder.successToken}`
                : `/s/${storeSubUrl}/order/${newOrder.id}?token=${newOrder.successToken}`;

            window.location.href = redirectUrl;
        } catch (error) {
            console.error("Order Failed:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setPlacingOrder(false);
        }
    };

    // Input Helper
    const handleInput = (e) => {
        const { name, value } = e.target;
        setCustomerInfo(prev => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    if (cart.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Cart is empty</h2>
                <p className="text-slate-500 mb-8">Add items to your cart to proceed to checkout.</p>
                <Link
                    to={customDomainStore ? '/' : `/s/${storeSubUrl}`}
                    className="inline-block w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                >
                    Return to Store
                </Link>
            </div>
        </div>
    );

    return (
        <CheckoutForm
            step={step}
            setStep={setStep}
            customerInfo={customerInfo}
            handleInput={handleInput}
            errors={errors}
            shippingRates={shippingRates}
            selectedRate={selectedRate}
            setSelectedRate={setSelectedRate}
            handleInfoSubmit={handleInfoSubmit}
            handleShippingSubmit={handleShippingSubmit}
            handlePaymentSubmit={handlePaymentSubmit}
            placingOrder={placingOrder}
            cart={cart}
            totals={totals}
            storeName={store.name}
            storeSubUrl={storeSubUrl}
            settings={checkoutSettings}
            allowedCountries={allowedCountries}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isCustomDomain={!!customDomainStore}

            // Coupon Props
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            handleApplyCoupon={handleApplyCoupon}
            handleRemoveCoupon={handleRemoveCoupon}
            appliedCoupon={appliedCoupon}
            couponError={couponError}
            couponSuccess={couponSuccess}
            isApplyingCoupon={isApplyingCoupon}
        />
    );
}
