import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { CheckoutForm } from '../components/checkout/CheckoutForm';

export function CheckoutPage() {
    const { storeSubUrl } = useParams();
    const { cart } = useCart();

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Info, 2: Shipping, 3: Payment
    const [placingOrder, setPlacingOrder] = useState(false);

    // Form State
    const [customerInfo, setCustomerInfo] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address1: '',
        address2: '',
        city: '',
        country: 'US', // Default
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

    useEffect(() => {
        const fetchStoreAndSettings = async () => {
            try {
                // 1. Fetch Store
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('sub_url', storeSubUrl)
                    .single();
                if (storeError) throw storeError;
                setStore(storeData);

                // 2. Fetch Checkout Page Settings
                const { data: pageData } = await supabase
                    .from('store_pages')
                    .select('content') // Assuming content stores the widgets
                    .eq('store_id', storeData.id)
                    .eq('slug', 'checkout') // System slug
                    .single();

                if (pageData?.content) {
                    // Find checkout_form widget
                    // Content is typically an array of widgets
                    const widgets = Array.isArray(pageData.content) ? pageData.content : [];
                    const checkoutWidget = widgets.find(w => w.type === 'checkout_form');
                    if (checkoutWidget && checkoutWidget.settings) {
                        setCheckoutSettings(checkoutWidget.settings);
                    }
                }

                // MOCK Shipping Rates for now (replace with DB fetch)
                setShippingRates([
                    { id: 'rate_standard', name: 'Standard Shipping', rate: 5.00, estimated_days: '3-5' },
                    { id: 'rate_express', name: 'Express Shipping', rate: 15.00, estimated_days: '1-2' }
                ]);
            } catch (err) {
                console.error("Error loading store/settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStoreAndSettings();
    }, [storeSubUrl]);

    // Recalculate totals when dependencies change
    useEffect(() => {
        if (cart.length > 0) {
            const newTotals = calculateOrderTotals(cart, selectedRate, 0); // 0 discount for now
            setTotals(newTotals);
        }
    }, [cart, selectedRate]);


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
                paymentMethod: 'credit_card' // Mock
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    // ... existing Store/Empty checks ...
    if (!store) return <div className="p-8 text-center text-red-500">Store not found</div>;
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
            // Future settings can take store specific checkout settings
            settings={{}}
        />
    );
}
