import React from 'react';
import { NavbarRenderer } from './navbar/NavbarRenderer';
import { HeroRenderer } from './hero/HeroRenderer';

import { ProductGridRenderer } from './product_grid/ProductGridRenderer';
import { ProductDetailRenderer } from './product_detail/ProductDetailRenderer';
import { ProductReviewsRenderer } from './product_reviews/ProductReviewsRenderer';

export function BlockRenderer({ type, settings, viewMode, store, products, product, categories, isEditor }) {
    switch (type) {
        case 'navbar':
            return <NavbarRenderer settings={settings} viewMode={viewMode} store={store} />;
        case 'hero':
            return <HeroRenderer settings={settings} viewMode={viewMode} />;
        case 'product_grid':
            return <ProductGridRenderer settings={settings} products={products} viewMode={viewMode} store={store} isEditor={isEditor} />;
        case 'product_reviews':
            return <ProductReviewsRenderer style={settings} productId={product?.id} storeId={store?.id} />;
        case 'heading':
            return (
                <div className="px-12 py-8 bg-white">
                    <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">{settings.text || 'Heading'}</h2>
                </div>
            );
        case 'cart_list':
            return (
                <div className="p-12 max-w-4xl mx-auto bg-white border-y border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-100">Review Items</h3>
                    <div className="space-y-6">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center space-x-6 pb-6 border-b border-slate-100 last:border-0 opacity-60">
                                <div className="h-24 w-24 bg-slate-100 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                                    <div className="h-3 w-1/4 bg-slate-100 rounded-full" />
                                </div>
                                <div className="text-right font-bold text-slate-900">$299.00</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'product_detail':
            return <ProductDetailRenderer settings={settings} product={product} viewMode={viewMode} isEditor={isEditor} store={store} />;
        default:
            return (
                <div className="p-8 border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400 text-xs italic">
                    {type.toUpperCase()} Component Placeholder
                </div>
            );
    }
}
