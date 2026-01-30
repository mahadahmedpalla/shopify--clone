import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { ChevronRight, ShoppingBag, CreditCard, Truck, MapPin } from 'lucide-react';
import { validateAddress, calculateOrderTotals, createOrder } from '../utils/checkoutUtils';

export function CheckoutPage() {
    const { storeSubUrl } = useParams();
    const { cart, cartTotal } = useCart();

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

                // MOCK Shipping Rates for now (replace with DB fetch)
                setShippingRates([
                    { id: 'rate_standard', name: 'Standard Shipping', rate: 5.00, estimated_days: '3-5' },
                    { id: 'rate_express', name: 'Express Shipping', rate: 15.00, estimated_days: '1-2' }
                ]);
            } catch (err) {
                console.error("Error loading store:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
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
        <div className="min-h-screen bg-white lg:flex text-slate-900 font-sans">
            {/* Left Column: Flow */}
            <div className="flex-1 lg:w-[55%] flex flex-col">
                <div className="flex-1 p-6 lg:p-12 lg:max-w-2xl lg:ml-auto w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <Link to={`/s/${storeSubUrl}`} className="text-xl font-black tracking-tight text-indigo-600 mb-4 block">
                            {store.name}
                        </Link>
                        <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                            <Link to={`/s/${storeSubUrl}`} className="hover:text-indigo-600 transition">Cart</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step >= 1 ? 'text-slate-900' : ''}>Information</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step >= 2 ? 'text-slate-900' : ''}>Shipping</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step >= 3 ? 'text-slate-900' : ''}>Payment</span>
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold">Contact Information</h2>
                                    <span className="text-sm text-slate-500">Already have an account? <a href="#" className="text-indigo-600 hover:underline">Log in</a></span>
                                </div>
                                <div>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email address"
                                        className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none`}
                                        value={customerInfo.email}
                                        onChange={handleInput}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <h2 className="text-lg font-bold pt-4">Shipping Address</h2>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <input name="firstName" type="text" placeholder="First name" className={`w-full px-4 py-3 bg-white border ${errors.firstName ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.firstName} onChange={handleInput} />
                                            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <input name="lastName" type="text" placeholder="Last name" className={`w-full px-4 py-3 bg-white border ${errors.lastName ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.lastName} onChange={handleInput} />
                                            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <input name="address1" type="text" placeholder="Address" className={`w-full px-4 py-3 bg-white border ${errors.address1 ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.address1} onChange={handleInput} />
                                        {errors.address1 && <p className="text-red-500 text-xs mt-1">{errors.address1}</p>}
                                    </div>
                                    <input name="address2" type="text" placeholder="Apartment, suite, etc. (optional)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none" value={customerInfo.address2} onChange={handleInput} />
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <input name="city" type="text" placeholder="City" className={`w-full px-4 py-3 bg-white border ${errors.city ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.city} onChange={handleInput} />
                                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                        </div>
                                        <select
                                            name="country"
                                            className="col-span-1 px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-500"
                                            value={customerInfo.country}
                                            onChange={handleInput}
                                        >
                                            <option value="US">United States</option>
                                        </select>
                                        <div>
                                            <input name="zip" type="text" placeholder="Postal Code" className={`w-full px-4 py-3 bg-white border ${errors.zip ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.zip} onChange={handleInput} />
                                            {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                                        </div>
                                    </div>
                                    <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none" value={customerInfo.phone} onChange={handleInput} />
                                </div>

                                <div className="pt-6 flex items-center justify-between">
                                    <Link to={`/s/${storeSubUrl}`} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
                                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Return to cart
                                    </Link>
                                    <button
                                        onClick={handleInfoSubmit}
                                        className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                                    >
                                        Continue to Shipping
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="border border-slate-200 rounded-lg p-4 text-sm divide-y divide-slate-200">
                                    <div className="flex justify-between pb-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Contact</span>
                                            <span className="font-medium">{customerInfo.email}</span>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-indigo-600 text-xs font-bold hover:underline">Change</button>
                                    </div>
                                    <div className="flex justify-between pt-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Ship to</span>
                                            <span className="font-medium">{customerInfo.address1}, {customerInfo.city}, {customerInfo.zip}</span>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-indigo-600 text-xs font-bold hover:underline">Change</button>
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold">Shipping Method</h2>
                                <div className="space-y-3">
                                    {shippingRates.map((rate) => (
                                        <label key={rate.id} className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="shippingRate"
                                                    checked={selectedRate?.id === rate.id}
                                                    onChange={() => setSelectedRate(rate)}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                />
                                                <div className="ml-3 flex flex-col">
                                                    <span className="block text-sm font-medium text-slate-900">{rate.name}</span>
                                                    <span className="block text-xs text-slate-500">{rate.estimated_days} business days</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-sm text-slate-900">${rate.rate.toFixed(2)}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="pt-6 flex items-center justify-between">
                                    <button onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
                                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Return to Information
                                    </button>
                                    <button
                                        onClick={handleShippingSubmit}
                                        className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="border border-slate-200 rounded-lg p-4 text-sm divide-y divide-slate-200">
                                    <div className="flex justify-between pb-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Contact</span>
                                            <span className="font-medium">{customerInfo.email}</span>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-indigo-600 text-xs font-bold hover:underline">Change</button>
                                    </div>
                                    <div className="flex justify-between py-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Ship to</span>
                                            <span className="font-medium">{customerInfo.address1}, {customerInfo.city}, {customerInfo.zip}</span>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-indigo-600 text-xs font-bold hover:underline">Change</button>
                                    </div>
                                    <div className="flex justify-between pt-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Method</span>
                                            <span className="font-medium">{selectedRate?.name} - ${selectedRate?.rate?.toFixed(2)}</span>
                                        </div>
                                        <button onClick={() => setStep(2)} className="text-indigo-600 text-xs font-bold hover:underline">Change</button>
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold">Payment</h2>
                                <p className="text-sm text-slate-500">All transactions are secure and encrypted.</p>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="h-4 w-4 rounded-full border-[5px] border-indigo-600 bg-white mr-3"></div>
                                            <span className="text-sm font-bold text-slate-900">Credit Card (Mock)</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            {/* Icons */}
                                            <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">VISA</div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 space-y-4">
                                        <div className="relative">
                                            <CreditCard className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                                            <input type="text" placeholder="Card number" defaultValue="4242 4242 4242 4242 (Test)" className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" readOnly />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="Expiration date (MM / YY)" defaultValue="12 / 28" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" readOnly />
                                            <input type="text" placeholder="Security code" defaultValue="123" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" readOnly />
                                        </div>
                                        <input type="text" placeholder="Name on card" defaultValue={customerInfo.firstName + ' ' + customerInfo.lastName} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" readOnly />
                                    </div>
                                </div>

                                <div className="pt-6 flex items-center justify-between">
                                    <button onClick={() => setStep(2)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
                                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Return to Shipping
                                    </button>
                                    <button
                                        onClick={handlePaymentSubmit}
                                        disabled={placingOrder}
                                        className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg w-full max-w-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {placingOrder ? 'Processing...' : `Pay $${totals.total.toFixed(2)}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="hidden lg:block lg:w-[45%] bg-slate-50 border-l border-slate-200">
                <div className="p-12 max-w-lg w-full sticky top-0">
                    <div className="space-y-6">
                        {cart.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="relative h-16 w-16 bg-white border border-slate-200 rounded-lg items-center justify-center flex overflow-hidden">
                                    <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full z-10 shadow-sm">{item.quantity}</span>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <ShoppingBag className="h-6 w-6 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                    {item.variantTitle && <p className="text-xs text-slate-500">{item.variantTitle}</p>}
                                </div>
                                <p className="font-bold text-slate-700 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-200 my-8 pt-6 space-y-4">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-900">${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Shipping {selectedRate ? `(${selectedRate.name})` : ''}</span>
                            {selectedRate ? (
                                <span className="font-bold text-slate-900">${selectedRate.rate.toFixed(2)}</span>
                            ) : (
                                <span className="text-xs text-slate-400">Calculated at next step</span>
                            )}
                        </div>
                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200 mt-4">
                            <span>Total</span>
                            <span className="text-2xl">${totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
