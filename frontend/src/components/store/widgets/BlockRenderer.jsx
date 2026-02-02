import React from 'react';
const NavbarRenderer = React.lazy(() => import('./navbar/NavbarRenderer').then(module => ({ default: module.NavbarRenderer })));
const HeroRenderer = React.lazy(() => import('./hero/HeroRenderer').then(module => ({ default: module.HeroRenderer })));
const ImageRenderer = React.lazy(() => import('./image/ImageRenderer').then(module => ({ default: module.ImageRenderer })));
const ProductGridRenderer = React.lazy(() => import('./product_grid/ProductGridRenderer').then(module => ({ default: module.ProductGridRenderer })));
const ProductDetailRenderer = React.lazy(() => import('./product_detail/ProductDetailRenderer').then(module => ({ default: module.ProductDetailRenderer })));
const ProductReviewsRenderer = React.lazy(() => import('./product_reviews/ProductReviewsRenderer').then(module => ({ default: module.ProductReviewsRenderer })));
const RelatedProductsRenderer = React.lazy(() => import('./related_products/RelatedProductsRenderer').then(module => ({ default: module.RelatedProductsRenderer })));
const CartListRenderer = React.lazy(() => import('./cart_list/CartListRenderer').then(module => ({ default: module.CartListRenderer })));
const CheckoutRenderer = React.lazy(() => import('./checkout/CheckoutRenderer').then(module => ({ default: module.CheckoutRenderer })));
const ContainerRenderer = React.lazy(() => import('./container/ContainerRenderer').then(module => ({ default: module.ContainerRenderer })));

// Lightweight Fallback Component clearly indicating loading state
const WidgetSkeleton = () => (
    <div className="w-full h-32 bg-slate-50 animate-pulse flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
        <span className="text-slate-300 text-xs font-medium">Loading Widget...</span>
    </div>
);

export function BlockRenderer({ id, type, settings, viewMode, store, products, product, categories, isEditor, storeDiscounts, children, onSelect, onDelete, selectedId }) {
    return (
        <React.Suspense fallback={<WidgetSkeleton />}>
            {(() => {
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
            })()}
        </React.Suspense>
    );
}
