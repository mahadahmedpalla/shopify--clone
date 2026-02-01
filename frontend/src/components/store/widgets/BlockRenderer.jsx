import React, { lazy } from 'react';

// Lazy Load Widgets
const NavbarRenderer = lazy(() => import('./navbar/NavbarRenderer').then(module => ({ default: module.NavbarRenderer })));
const HeroRenderer = lazy(() => import('./hero/HeroRenderer').then(module => ({ default: module.HeroRenderer })));
const ProductGridRenderer = lazy(() => import('./product_grid/ProductGridRenderer').then(module => ({ default: module.ProductGridRenderer })));
const ProductDetailRenderer = lazy(() => import('./product_detail/ProductDetailRenderer').then(module => ({ default: module.ProductDetailRenderer })));
const ProductReviewsRenderer = lazy(() => import('./product_reviews/ProductReviewsRenderer').then(module => ({ default: module.ProductReviewsRenderer })));
const RelatedProductsRenderer = lazy(() => import('./related_products/RelatedProductsRenderer').then(module => ({ default: module.RelatedProductsRenderer })));
const CartListRenderer = lazy(() => import('./cart_list/CartListRenderer').then(module => ({ default: module.CartListRenderer })));
const CheckoutRenderer = lazy(() => import('./checkout/CheckoutRenderer').then(module => ({ default: module.CheckoutRenderer })));

export function BlockRenderer({ type, settings, viewMode, store, products, product, categories, isEditor, storeDiscounts }) {
    switch (type) {
        case 'navbar':
            return <NavbarRenderer settings={settings} viewMode={viewMode} store={store} />;
        case 'hero':
            return <HeroRenderer settings={settings} viewMode={viewMode} />;
        case 'product_grid':
            return <ProductGridRenderer settings={settings} products={products} viewMode={viewMode} store={store} isEditor={isEditor} storeDiscounts={storeDiscounts} />;
        case 'product_reviews':
            return <ProductReviewsRenderer style={settings} productId={product?.id} storeId={store?.id} />;
        case 'related_products':
            return <RelatedProductsRenderer style={settings} productId={product?.id} product={product} storeId={store?.id} isEditor={isEditor} storeDiscounts={storeDiscounts} />;
        case 'heading':
            return (
                <div className="px-12 py-8 bg-white">
                    <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">{settings.text || 'Heading'}</h2>
                </div>
            );
        case 'cart_list':
            return <CartListRenderer settings={settings} isEditor={isEditor} viewMode={viewMode} />;
        case 'checkout_form':
            return <CheckoutRenderer settings={settings} isEditor={isEditor} store={store} />;
        case 'product_detail':
            return <ProductDetailRenderer settings={settings} product={product} viewMode={viewMode} isEditor={isEditor} store={store} storeDiscounts={storeDiscounts} />;
        default:
            return (
                <div className="p-8 border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400 text-xs italic">
                    {type.toUpperCase()} Component Placeholder
                </div>
            );
    }
}
