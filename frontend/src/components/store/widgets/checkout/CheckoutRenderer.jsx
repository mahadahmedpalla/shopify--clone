import React, { useState } from 'react';
import { CheckoutForm } from '../../../checkout/CheckoutForm';
import { useCart } from '../../../../context/CartContext';
import { calculateOrderTotals } from '../../../../utils/checkoutUtils';

export function CheckoutRenderer({ settings, isEditor, store }) {
    const { cart } = useCart();

    // Mock State for Editor
    const [step, setStep] = useState(1);
    const [customerInfo, setCustomerInfo] = useState({
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        address2: '',
        city: 'Beverly Hills',
        country: 'US',
        zip: '90210',
        phone: '555-0199'
    });

    // Mock Shipping Rates
    const shippingRates = [
        { id: 'rate_standard', name: 'Standard Shipping', rate: 5.00, estimated_days: '3-5' },
        { id: 'rate_express', name: 'Express Shipping', rate: 15.00, estimated_days: '1-2' }
    ];
    const [selectedRate, setSelectedRate] = useState(shippingRates[0]);

    // Use utility for totals if possible, else simplified calc
    // We can use calculateOrderTotals from utils if imported, but simplify for now to avoid dependency issues if cart structure varies slightly in editor mock
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totals = {
        subtotal: subtotal,
        shippingCost: selectedRate?.rate || 0,
        taxTotal: 0,
        discountTotal: 0,
        total: subtotal + (selectedRate?.rate || 0),
        currency: 'USD'
    };

    return (
        <div className="w-full relative">
            {isEditor && (
                <div className="absolute inset-0 z-10 pointer-events-none border-2 border-transparent hover:border-indigo-500 transition-colors" />
            )}
            <CheckoutForm
                step={step}
                setStep={setStep}
                customerInfo={customerInfo}
                handleInput={() => { }} // No-op in editor
                errors={{}}
                shippingRates={shippingRates}
                selectedRate={selectedRate}
                setSelectedRate={setSelectedRate}
                handleInfoSubmit={() => setStep(2)}
                handleShippingSubmit={() => setStep(3)}
                handlePaymentSubmit={() => { }}
                placingOrder={false}
                cart={cart}
                totals={totals}
                storeName={store?.name || 'Your Store'}
                storeSubUrl={store?.sub_url || 'demo'}
                settings={settings}
                isEditor={true} // Always treated as editor mode in renderer
            />
        </div>
    );
}
