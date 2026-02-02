import React from 'react';
import { NavbarRenderer } from './navbar/NavbarRenderer';
import { HeroRenderer } from './hero/HeroRenderer';
import { ImageRenderer } from './image/ImageRenderer';

import { ProductGridRenderer } from './product_grid/ProductGridRenderer';
import { ProductDetailRenderer } from './product_detail/ProductDetailRenderer';
import { ProductReviewsRenderer } from './product_reviews/ProductReviewsRenderer';
import { RelatedProductsRenderer } from './related_products/RelatedProductsRenderer';
import { CartListRenderer } from './cart_list/CartListRenderer';
import { CheckoutRenderer } from './checkout/CheckoutRenderer';
import { ContainerRenderer } from './container/ContainerRenderer';

export function BlockRenderer({ id, type, settings, viewMode, store, products, product, categories, isEditor, storeDiscounts, children, onSelect, onDelete, selectedId }) {
    switch (type) {
        case 'container':
            return (
                <ContainerRenderer
                    id={id}
                    settings={settings}
                    viewMode={viewMode}
                    store={store}
                    products={products}
                    categories={categories}
                    isEditor={isEditor}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    selectedId={selectedId}
                >
                    {/* If the block has 'children' property (nested blocks), ContainerRenderer handles it via settings.children */}
                </ContainerRenderer>
            );
        case 'navbar':
            return <NavbarRenderer settings={settings} viewMode={viewMode} store={store} />;
        case 'hero':
            return <HeroRenderer settings={settings} viewMode={viewMode} />;
        case 'image':
            return <ImageRenderer settings={settings} viewMode={viewMode} />;
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
