import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart, CartProvider } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { CheckoutForm } from '../components/checkout/CheckoutForm';
import { validateAddress, calculateOrderTotals, createOrder, calculateShippingOptions } from '../utils/checkoutUtils';
import { calculateOrderDiscount } from '../utils/discountUtils';
import { ShoppingBag } from 'lucide-react';

export function CheckoutPage() {
    const { storeSubUrl } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchStore();
    }, [storeSubUrl]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!store) return <div className="p-8 text-center text-red-500">Store not found</div>;

    return (
        <CartProvider storeKey={store.id}>
            <CheckoutContent store={store} storeSubUrl={storeSubUrl} />
        </CartProvider>
    );
}

function CheckoutContent({ store, storeSubUrl }) {
    const { cart } = useCart();
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
        currency: 'USD'
    });

    const [checkoutSettings, setCheckoutSettings] = useState({});

    // Store Discounts
    const [storeDiscounts, setStoreDiscounts] = useState([]);

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
            // Calculate Item-Level total
            const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

            // Calculate Order-Level Discount (Min Order Value)
            const { discountAmount } = calculateOrderDiscount(subtotal, storeDiscounts);

            const newTotals = calculateOrderTotals(cart, selectedRate, discountAmount);
            setTotals(newTotals);
        }
    }, [cart, selectedRate, storeDiscounts]);


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
                paymentMethod: paymentMethod
            };

            const newOrder = await createOrder(orderPayload);
            console.log("Order Created:", newOrder);
            alert(`Order #${newOrder.id.slice(0, 8)} placed successfully! Redirecting...`);
            // Clear cart and redirect to success page
            window.location.href = `/s/${storeSubUrl}/order/${newOrder.id}`;
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
                    to={`/s/${storeSubUrl}`}
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
        />
    );
}
