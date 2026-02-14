import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, CreditCard, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { countries } from '../../lib/countries';

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
    isEditor = false,
    allowedCountries = null,
    paymentMethod,
    setPaymentMethod,
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    handleRemoveCoupon,
    appliedCoupon,
    couponError,
    couponSuccess,
    isApplyingCoupon,
    isCustomDomain
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: totals?.currency || 'USD',
        }).format(price);
    };

    const [showOrderSummary, setShowOrderSummary] = useState(false);

    // Reusable Coupon Section
    const CouponSection = (
        <div className="border-t border-slate-200 mt-6 pt-6 mb-6">
            {!appliedCoupon ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Discount code"
                        className={`flex-1 px-4 py-3 bg-white border ${couponError ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase placeholder:normal-case`}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={isApplyingCoupon || isEditor}
                    />
                    <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode || isApplyingCoupon || isEditor}
                        className="px-6 py-3 font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition text-white"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-slate-700">{appliedCoupon.coupon.code}</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-xs font-bold text-red-500 hover:text-red-700">
                        Remove
                    </button>
                </div>
            )}
            {couponError && <p className="text-xs text-red-500 mt-2 font-medium">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-green-600 mt-2 font-medium">{couponSuccess}</p>}
        </div>
    );



    // Tax Display Helper
    const TaxDisplay = useMemo(() => {
        if (totals.taxBreakdown && Object.keys(totals.taxBreakdown).length > 0) {
            return Object.entries(totals.taxBreakdown).map(([code, data]) => {
                // Handle new object structure or legacy number
                const amount = typeof data === 'number' ? data : data.amount;
                const rate = typeof data === 'object' ? data.rate : null;
                const type = typeof data === 'object' ? data.type : null;
                const count = typeof data === 'object' ? data.count : 0;
                const applyPerItem = typeof data === 'object' && data.apply_per_item !== undefined ? data.apply_per_item : true;

                let label = code;
                if (rate !== null && type) {
                    if (type === 'percentage') {
                        label = `${code} (${rate}%)`;
                    } else {
                        // Fixed Amount Logic
                        if (applyPerItem === false) {
                            label = `${code} (${formatPrice(Number(rate))} fixed)`;
                        } else {
                            // Show quantity multiplier for fixed taxes if > 1
                            if (count > 1) {
                                label = `${code} (${count} x ${formatPrice(Number(rate))})`;
                            } else {
                                label = `${code} (${formatPrice(Number(rate))} ea)`;
                            }
                        }
                    }
                }

                return (
                    <div key={code} className="flex justify-between text-sm text-slate-600">
                        <span>{label}</span>
                        <span className="font-medium text-slate-900">{formatPrice(amount)}</span>
                    </div>
                );
            });
        }
        if (totals.taxTotal > 0) {
            return (
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Taxes</span>
                    <span className="font-medium text-slate-900">{formatPrice(totals.taxTotal)}</span>
                </div>
            );
        }
        return null;
    }, [totals.taxBreakdown, totals.taxTotal, totals.currency]);

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
                            <Link to={isCustomDomain ? '/' : (storeSubUrl ? `/s/${storeSubUrl}` : '/')} className="text-xl font-black tracking-tight mb-4 block" style={{ color: primaryColor }}>
                                {storeName}
                            </Link>
                        )}

                        {/* Mobile Order Summary Toggle */}
                        <div className="lg:hidden border-y border-slate-200 -mx-6 px-6 py-4 bg-slate-50 mb-6">
                            <button
                                type="button"
                                onClick={() => setShowOrderSummary(!showOrderSummary)}
                                className="flex w-full items-center justify-between font-medium transition-colors"
                                style={{ color: primaryColor }}
                            >
                                <span className="flex items-center text-sm">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    <span className="mr-1">{showOrderSummary ? 'Hide' : 'Show'} order summary</span>
                                    {showOrderSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </span>
                                <span className="font-bold text-slate-900 text-lg">{formatPrice(totals.total)}</span>
                            </button>

                            {showOrderSummary && (
                                <div className="pt-6 space-y-6 animate-in slide-in-from-top-2 border-t border-slate-200 mt-4">
                                    <div className="space-y-4">
                                        {cart.map((item, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="relative h-16 w-16 bg-white border border-slate-200 rounded-lg items-center justify-center flex overflow-hidden shrink-0">
                                                    <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full z-10 shadow-sm">{item.quantity}</span>
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="h-6 w-6 text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                                    {item.variantTitle && <p className="text-xs text-slate-500 truncate">{item.variantTitle}</p>}
                                                    <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mobile Coupon Section */}
                                    {CouponSection}

                                    <div className="border-t border-slate-200 pt-4 space-y-3">
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Subtotal</span>
                                            <span className="font-bold text-slate-900">{formatPrice(totals.subtotal)}</span>
                                        </div>

                                        {totals.discountTotal > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                                <span>Discount</span>
                                                <span>-{formatPrice(totals.discountTotal)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Shipping {selectedRate ? `(${selectedRate.name})` : ''}</span>
                                            {selectedRate ? (
                                                <span className="font-bold text-slate-900">{formatPrice(selectedRate.rate)}</span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Calculated at next step</span>
                                            )}
                                        </div>

                                        {TaxDisplay}


                                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200">
                                            <span>Total</span>
                                            <span className="text-xl" style={{ color: primaryColor }}>{formatPrice(totals.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                            <option value="" disabled>Select Country</option>
                                            {countries
                                                .filter(c => !allowedCountries || allowedCountries.length === 0 || allowedCountries.includes(c.code) || allowedCountries.includes(c.name))
                                                .map(c => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                ))
                                            }
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
                                    {shippingRates.length === 0 && (
                                        <div className="p-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm flex items-start">
                                            <Info className="h-5 w-5 mr-2 shrink-0" />
                                            <div>
                                                <p className="font-bold">No shipping methods found.</p>
                                                <p>Unfortunately, we do not ship to this location or your cart total does not meet the requirements.</p>
                                            </div>
                                        </div>
                                    )}

                                    {shippingRates.map((rate) => (
                                        <div key={rate.id} className={`border rounded-lg p-4 transition-all ${rate.is_auto_applied || selectedRate?.id === rate.id ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'}`}>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center">
                                                    {!rate.is_auto_applied && (
                                                        <input
                                                            type="radio"
                                                            name="shippingRate"
                                                            checked={selectedRate?.id === rate.id}
                                                            onChange={() => setSelectedRate(rate)}
                                                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-3"
                                                            disabled={isEditor}
                                                        />
                                                    )}
                                                    {rate.is_auto_applied && (
                                                        <div className="mr-3 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center">
                                                            <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="block text-sm font-bold text-slate-900">{rate.name}</span>
                                                        {rate.estimated_days && <span className="block text-xs text-slate-500">{rate.estimated_days} business days</span>}
                                                    </div>
                                                </div>
                                                <span className="font-bold text-sm text-slate-900">
                                                    {rate.rate === 0 ? 'Free' : formatPrice(rate.rate)}
                                                </span>
                                            </label>

                                            {/* Additive Breakdown */}
                                            {rate.breakdown && rate.breakdown.length > 0 && (
                                                <div className="mt-3 pl-7 pt-3 border-t border-indigo-200/50 space-y-2">
                                                    {rate.breakdown.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs text-slate-600">
                                                            <span>
                                                                <span className="font-medium text-slate-800">{item.name}</span>
                                                                {item.items && <span className="block text-slate-400 truncate max-w-[200px]">{item.items}</span>}
                                                            </span>
                                                            <span className="font-medium">{formatPrice(item.cost)}</span>
                                                        </div>
                                                    ))}
                                                    {rate.warning && (
                                                        <p className="text-xs text-orange-600 mt-2 font-medium">{rate.warning}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
                                            <span className="font-medium">{selectedRate?.name} - {selectedRate?.rate === 0 ? 'Free' : formatPrice(selectedRate?.rate || 0)}</span>
                                        </div>
                                        <button onClick={() => setStep(2)} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>Change</button>
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold">Payment</h2>
                                <p className="text-sm text-slate-500">All transactions are secure and encrypted.</p>

                                <div className="space-y-4">
                                    {/* Credit Card Option */}
                                    <div className={`border rounded-lg overflow-hidden transition-all ${paymentMethod === 'credit_card' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200'}`}>
                                        <label className="flex items-center p-4 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="credit_card"
                                                checked={paymentMethod === 'credit_card'}
                                                onChange={() => setPaymentMethod('credit_card')}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 font-bold text-slate-900">Credit Card</span>
                                            <div className="ml-auto flex gap-2">
                                                <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">VISA</div>
                                                <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">MC</div>
                                            </div>
                                        </label>

                                        {paymentMethod === 'credit_card' && (
                                            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4 animate-in fade-in slide-in-from-top-2">
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
                                        )}
                                    </div>

                                    {/* COD Option */}
                                    <div className={`border rounded-lg overflow-hidden transition-all ${selectedRate?.accepts_cod === false
                                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                                        : paymentMethod === 'cod' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'
                                        }`}>
                                        <label className={`flex items-start p-4 ${selectedRate?.accepts_cod === false ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                disabled={selectedRate?.accepts_cod === false}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-1"
                                            />
                                            <div className="ml-3">
                                                <span className="font-bold text-slate-900 block">Cash on Delivery (COD)</span>
                                                <span className="text-sm text-slate-500 block">Pay with cash upon delivery.</span>
                                                {selectedRate?.accepts_cod === false && (
                                                    <p className="text-xs text-red-600 font-bold mt-1 inline-flex items-center">
                                                        <Info className="w-3 h-3 mr-1" />
                                                        Not available for selected shipping method.
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Coupon Section (Payment Phase) */}
                                <div className="pt-6 lg:hidden">
                                    <h3 className="text-sm font-medium mb-2 text-slate-700">Discount Code</h3>
                                    {CouponSection}
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
                                        {placingOrder ? 'Processing...' : `Pay ${formatPrice(totals.total)}`}
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
                                    <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-slate-700 text-sm">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Coupon Input (Desktop) */}
                    {CouponSection}

                    <div className="border-t border-slate-200 my-8 pt-6 space-y-4">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-900">{formatPrice(totals.subtotal)}</span>
                        </div>

                        {totals.discountTotal > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Discount</span>
                                <span>-{formatPrice(totals.discountTotal)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Shipping {selectedRate ? `(${selectedRate.name})` : ''}</span>
                            {selectedRate ? (
                                <span className="font-bold text-slate-900">{formatPrice(selectedRate.rate)}</span>
                            ) : (
                                <span className="text-xs text-slate-400">Calculated at next step</span>
                            )}
                        </div>

                        {TaxDisplay}
                        <div className="flex items-center justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-200 mt-4">
                            <span>Total</span>
                            <span className="text-2xl" style={{ color: primaryColor }}>{formatPrice(totals.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
