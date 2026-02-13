import React, { useState, useEffect, useRef } from 'react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { calculateBestPrice } from '../../../../utils/discountUtils';

export const RelatedProductsRenderer = ({ style, content, productId, product, storeId, currency = 'USD', isEditor, storeDiscounts, isCustomDomain }) => {
    // ... (rest of the component)

    return (
        // ...
        {
            displayProducts.map((p, i) => (
                <div key={p.id === 'mock' ? i : p.id} className="group cursor-pointer">
                    <ProductCard
                        p={p}
                        showPrice={showPrice}
                        showDiscount={showDiscount}
                        showRating={showRating}
                        showDescription={showDescription}
                        isEditor={isEditor}
                        storeId={storeId}
                        currency={currency}
                        storeDiscounts={storeDiscounts}
                        isCustomDomain={isCustomDomain}
                    />
                </div>
            ))
        }
        // ...
    );
};

const ProductCard = ({ p, showPrice, showDiscount, showRating, showDescription, isEditor, storeId, currency, storeDiscounts, isCustomDomain }) => {
    // ...

    // Format Price Helper
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <Wrapper
        // ...
        >
            {/* ... */}

            {/* PRICE */}
            {showPrice && (
                <div className="flex items-center space-x-2">
                    <p className={`font-bold text-sm ${hasDiscount ? 'text-red-600' : 'text-slate-500'}`}>
                        {formatPrice(price)}
                    </p>
                    {hasDiscount && (
                        <p className="text-xs text-slate-400 line-through decoration-slate-300">
                            {formatPrice(comparePrice)}
                        </p>
                    )}
                </div>
            )}

            {/* ... */}
        </Wrapper>
    );
};
