import React from 'react';
const NavbarRenderer = React.lazy(() => import('./navbar/NavbarRenderer').then(module => ({ default: module.NavbarRenderer })));
const HeroRenderer = React.lazy(() => import('./hero/HeroRenderer').then(module => ({ default: module.HeroRenderer })));
const HeroSlideshowRenderer = React.lazy(() => import('./hero/HeroSlideshowRenderer').then(module => ({ default: module.HeroSlideshowRenderer })));
const ImageRenderer = React.lazy(() => import('./image/ImageRenderer').then(module => ({ default: module.ImageRenderer })));
const ProductGridRenderer = React.lazy(() => import('./product_grid/ProductGridRenderer').then(module => ({ default: module.ProductGridRenderer })));
const ProductDetailRenderer = React.lazy(() => import('./product_detail/ProductDetailRenderer').then(module => ({ default: module.ProductDetailRenderer })));
const ProductReviewsRenderer = React.lazy(() => import('./product_reviews/ProductReviewsRenderer').then(module => ({ default: module.ProductReviewsRenderer })));
const RelatedProductsRenderer = React.lazy(() => import('./related_products/RelatedProductsRenderer').then(module => ({ default: module.RelatedProductsRenderer })));
const CartListRenderer = React.lazy(() => import('./cart_list/CartListRenderer').then(module => ({ default: module.CartListRenderer })));
const CheckoutRenderer = React.lazy(() => import('./checkout/CheckoutRenderer').then(module => ({ default: module.CheckoutRenderer })));
const ContainerRenderer = React.lazy(() => import('./container/ContainerRenderer').then(module => ({ default: module.ContainerRenderer })));
const CategoryListRenderer = React.lazy(() => import('./category_list/CategoryListRenderer').then(module => ({ default: module.CategoryListRenderer })));
const HeadingRenderer = React.lazy(() => import('./heading/HeadingRenderer').then(module => ({ default: module.HeadingRenderer })));

// Smart Fallback Component with Layout-aware Skeletons
const WidgetSkeleton = ({ type }) => {
    // Base classes for the skeleton animation
    const baseClass = "w-full bg-slate-100 animate-pulse rounded-none";

    // Navbar: Thin top strip
    if (type === 'navbar') {
        return <div className={`${baseClass} h-16 border-b border-slate-200`} />;
    }

    // Hero: Large immersive banner
    if (type === 'hero') {
        return <div className={`${baseClass} h-[60vh] md:h-[80vh]`} />;
    }

    // Product Grid: Grid of cards
    if (type === 'product_grid') {
        return (
            <div className="p-12 space-y-8">
                <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" /> {/* Title */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse" />
                            <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                            <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Text/Heading content
    if (type === 'heading' || type === 'rich_text') {
        return (
            <div className="px-12 py-12 flex justify-center">
                <div className="h-12 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
            </div>
        );
    }

    // Default/Generic Block (Image, etc)
    return <div className={`${baseClass} h-64 md:h-96`} />;
};

export function BlockRenderer({ id, type, settings, viewMode, store, products, product, categories, categorySlug, categoryPath, isEditor, storeDiscounts, children, onSelect, onDelete, selectedId }) {
    return (
        <React.Suspense fallback={<WidgetSkeleton type={type} />}>
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
                        return <NavbarRenderer settings={settings} viewMode={viewMode} store={store} products={products} categories={categories} />;
                    case 'hero':
                        return <HeroRenderer settings={settings} viewMode={viewMode} />;
                    case 'hero_slideshow':
                        return <HeroSlideshowRenderer settings={settings} viewMode={viewMode} isEditor={isEditor} />;
                    case 'image':
                        return <ImageRenderer settings={settings} viewMode={viewMode} />;
                    case 'product_grid':
                        return <ProductGridRenderer settings={settings} products={products} viewMode={viewMode} store={store} isEditor={isEditor} storeDiscounts={storeDiscounts} categories={categories} categoryPath={categoryPath} />;
                    case 'product_reviews':
                        return <ProductReviewsRenderer style={settings} productId={product?.id} storeId={store?.id} />;
                    case 'related_products':
                        return <RelatedProductsRenderer style={settings} productId={product?.id} product={product} storeId={store?.id} isEditor={isEditor} storeDiscounts={storeDiscounts} />;
                    case 'heading':
                        return <HeadingRenderer settings={settings} viewMode={viewMode} isEditor={isEditor} />;
                    case 'cart_list':
                        return <CartListRenderer settings={settings} isEditor={isEditor} viewMode={viewMode} />;
                    case 'checkout_form':
                        return <CheckoutRenderer settings={settings} isEditor={isEditor} store={store} />;
                    case 'product_detail':
                        return <ProductDetailRenderer settings={settings} product={product} viewMode={viewMode} isEditor={isEditor} store={store} storeDiscounts={storeDiscounts} />;
                    case 'category_list':
                        return <CategoryListRenderer settings={settings} categories={categories} viewMode={viewMode} store={store} isEditor={isEditor} />;

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
