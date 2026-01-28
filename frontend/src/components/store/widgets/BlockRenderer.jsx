import React from 'react';
import { NavbarRenderer } from './navbar/NavbarRenderer';
import { HeroRenderer } from './hero/HeroRenderer';

import { ProductGridRenderer } from './product_grid/ProductGridRenderer';
import { ProductDetailRenderer } from './product_detail/ProductDetailRenderer';
import { ProductReviewsRenderer } from './product_reviews/ProductReviewsRenderer';
import { RelatedProductsRenderer } from './related_products/RelatedProductsRenderer';
import { CartListRenderer } from './cart_list/CartListRenderer';

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
        case 'related_products':
            return <RelatedProductsRenderer style={settings} productId={product?.id} product={product} storeId={store?.id} store={store} isEditor={isEditor} />;
        case 'heading':
            return (
                <div className="px-12 py-8 bg-white">
                    <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">{settings.text || 'Heading'}</h2>
                </div>
            );
        case 'cart_list':
            return <CartListRenderer style={settings} isEditor={isEditor} />;
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
