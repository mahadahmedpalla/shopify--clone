import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, CreditCard } from 'lucide-react';

export function CheckoutForm({
    step,
    setStep,
    customerInfo,
    handleInput,
    errors,
    shippingRates,
    selectedRate,
    setSelectedRate,
    handleInfoSubmit,
    handleShippingSubmit,
    handlePaymentSubmit,
    placingOrder,
    cart,
    totals,
    storeName,
    storeSubUrl,
    settings = {},
    isEditor = false
}) {
    // Style Helpers
    const primaryColor = settings?.primaryColor || '#4f46e5'; // indigo-600
    const primaryText = settings?.primaryTextColor || '#ffffff';
    const bgColor = settings?.backgroundColor || '#ffffff';
    const textColor = settings?.textColor || '#0f172a'; // slate-900

    const buttonStyle = {
        backgroundColor: primaryColor,
        color: primaryText,
    };

    // Navigation handler for editor
    const onNavClick = (e, targetStep) => {
        if (isEditor) {
            e.preventDefault();
            // In editor we might want to just switch steps locally without validation
            setStep(targetStep);
        }
    };

    return (
        <div className="min-h-screen lg:flex font-sans" style={{ backgroundColor: bgColor, color: textColor }}>
            {/* Left Column: Flow */}
            <div className="flex-1 lg:w-[55%] flex flex-col">
                <div className="flex-1 p-6 lg:p-12 lg:max-w-2xl lg:ml-auto w-full">
                    {/* Header */}
                    <div className="mb-8">
                        {isEditor ? (
                            <span className="text-xl font-black tracking-tight mb-4 block" style={{ color: primaryColor }}>
                                {storeName}
                            </span>
                        ) : (
                            <Link to={`/s/${storeSubUrl}`} className="text-xl font-black tracking-tight mb-4 block" style={{ color: primaryColor }}>
                                {storeName}
                            </Link>
                        )}

                        <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                            <span className={isEditor ? '' : 'hover:text-indigo-600 transition'}>Cart</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step >= 1 ? 'font-bold' : ''} style={{ color: step >= 1 ? textColor : undefined }}>Information</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step >= 2 ? 'font-bold' : ''} style={{ color: step >= 2 ? textColor : undefined }}>Shipping</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step >= 3 ? 'font-bold' : ''} style={{ color: step >= 3 ? textColor : undefined }}>Payment</span>
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold">Contact Information</h2>
                                    <span className="text-sm text-slate-500">Already have an account? <span className="text-indigo-600 hover:underline cursor-pointer">Log in</span></span>
                                </div>
                                <div>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email address"
                                        className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none`}
                                        value={customerInfo.email}
                                        onChange={handleInput}
                                        readOnly={isEditor}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <h2 className="text-lg font-bold pt-4">Shipping Address</h2>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <input name="firstName" type="text" placeholder="First name" className={`w-full px-4 py-3 bg-white border ${errors.firstName ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.firstName} onChange={handleInput} readOnly={isEditor} />
                                            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <input name="lastName" type="text" placeholder="Last name" className={`w-full px-4 py-3 bg-white border ${errors.lastName ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.lastName} onChange={handleInput} readOnly={isEditor} />
                                            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <input name="address1" type="text" placeholder="Address" className={`w-full px-4 py-3 bg-white border ${errors.address1 ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.address1} onChange={handleInput} readOnly={isEditor} />
                                        {errors.address1 && <p className="text-red-500 text-xs mt-1">{errors.address1}</p>}
                                    </div>
                                    <input name="address2" type="text" placeholder="Apartment, suite, etc. (optional)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none" value={customerInfo.address2} onChange={handleInput} readOnly={isEditor} />
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <input name="city" type="text" placeholder="City" className={`w-full px-4 py-3 bg-white border ${errors.city ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.city} onChange={handleInput} readOnly={isEditor} />
                                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                        </div>
                                        <select
                                            name="country"
                                            className="col-span-1 px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none text-slate-500"
                                            value={customerInfo.country}
                                            onChange={handleInput}
                                            disabled={isEditor}
                                        >
                                            <option value="US">United States</option>
                                        </select>
                                        <div>
                                            <input name="zip" type="text" placeholder="Postal Code" className={`w-full px-4 py-3 bg-white border ${errors.zip ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none`} value={customerInfo.zip} onChange={handleInput} readOnly={isEditor} />
                                            {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                                        </div>
                                    </div>
                                    <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none" value={customerInfo.phone} onChange={handleInput} readOnly={isEditor} />
                                </div>

                                <div className="pt-6 flex items-center justify-between">
                                    <span className="text-sm text-indigo-600 flex items-center font-medium cursor-pointer" style={{ color: primaryColor }}>
                                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Return to cart
                                    </span>
                                    <button
                                        onClick={handleInfoSubmit}
                                        className="px-8 py-4 rounded-xl font-bold transition shadow-lg opacity-90 hover:opacity-100"
                                        style={buttonStyle}
                                        disabled={isEditor}
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
                                        <button onClick={() => setStep(1)} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>Change</button>
                                    </div>
                                    <div className="flex justify-between pt-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Ship to</span>
                                            <span className="font-medium">{customerInfo.address1}, {customerInfo.city}, {customerInfo.zip}</span>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>Change</button>
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold">Shipping Method</h2>
                                <div className="space-y-3">
                                    {shippingRates.map((rate) => (
                                        <label key={rate.id} className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'}`}>
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="shippingRate"
                                                    checked={selectedRate?.id === rate.id}
                                                    onChange={() => setSelectedRate(rate)}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                    disabled={isEditor}
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
                                    <button onClick={() => setStep(1)} className="text-sm hover:underline flex items-center font-medium" style={{ color: primaryColor }}>
                                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Return to Information
                                    </button>
                                    <button
                                        onClick={handleShippingSubmit}
                                        className="px-8 py-4 rounded-xl font-bold transition shadow-lg opacity-90 hover:opacity-100"
                                        style={buttonStyle}
                                        disabled={isEditor}
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
                                        <button onClick={() => setStep(1)} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>Change</button>
                                    </div>
                                    <div className="flex justify-between py-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Ship to</span>
                                            <span className="font-medium">{customerInfo.address1}, {customerInfo.city}, {customerInfo.zip}</span>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>Change</button>
                                    </div>
                                    <div className="flex justify-between pt-3">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">Method</span>
                                            <span className="font-medium">{selectedRate?.name} - ${selectedRate?.rate?.toFixed(2)}</span>
                                        </div>
                                        <button onClick={() => setStep(2)} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>Change</button>
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
                                    <button onClick={() => setStep(2)} className="text-sm hover:underline flex items-center font-medium" style={{ color: primaryColor }}>
                                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Return to Shipping
                                    </button>
                                    <button
                                        onClick={handlePaymentSubmit}
                                        disabled={placingOrder || isEditor}
                                        className="px-8 py-4 rounded-xl font-bold transition shadow-lg w-full max-w-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center opacity-90 hover:opacity-100"
                                        style={buttonStyle}
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
            <div className={`hidden lg:block lg:w-[45%] border-l border-slate-200 ${isEditor ? 'pointer-events-none' : ''}`} style={{ backgroundColor: '#f8fafc' }}>
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
                            <span className="text-2xl" style={{ color: primaryColor }}>${totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
