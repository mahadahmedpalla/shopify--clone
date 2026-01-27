import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Share2, Minus, Plus, Box, ZoomIn, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';
import { supabase } from '../../../../lib/supabase';


export function ProductDetailRenderer({ settings, product, viewMode, isEditor, store }) {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedAttrs, setSelectedAttrs] = useState({});
    const [relatedProducts, setRelatedProducts] = useState([]);

    // -- SETTINGS --
    const isMobile = viewMode === 'mobile';

    // Media
    const mediaLayout = settings?.mediaLayout || 'grid';
    const aspectRatio = settings?.aspectRatio || 'square';
    const thumbPos = settings?.thumbPosition || 'bottom';
    const enableZoom = settings?.enableZoom !== false;

    // Title
    const TitleTag = settings?.titleTag || 'h1';
    const titleSize = settings?.titleSize || '3xl';
    const titleWeight = settings?.titleWeight || 'bold';
    const titleColor = settings?.titleColor || '#0f172a';
    const alignment = settings?.alignment || 'left';

    // Price
    const showPrice = settings?.showPrice !== false;
    const showDiscount = settings?.showDiscount !== false;
    const priceColor = settings?.priceColor || '#4f46e5';
    const compareColor = settings?.compareColor || '#94a3b8';

    // Description
    const showDesc = settings?.showDescription !== false;
    const descWidth = settings?.descWidth || 'full';

    // Stock
    const showStock = settings?.showStock !== false;
    const lowStockThreshold = settings?.lowStockThreshold || 5;
    const inStockColor = settings?.inStockColor || '#15803d';
    const lowStockColor = settings?.lowStockColor || '#b45309';
    const outOfStockColor = settings?.outOfStockColor || '#b91c1c';

    // Related
    const showRelated = settings?.showRelated !== false;
    const relatedLimit = settings?.relatedLimit || 4;
    const relatedTitle = settings?.relatedTitle || 'You might also like';


    // -- MOCK --
    const displayProduct = product || {
        id: 'sample',
        name: 'Sample Product Title',
        price: 99.99,
        comparePrice: 129.99,
        description: 'This is a sample product description to demonstrate the layout and typography settings.',
        images: [],
        quantity: 5,
        product_variants: []
    };

    // -- VARIANT LOGIC --

    // 1. Extract Attributes
    const attributeKeys = useMemo(() => {
        if (!displayProduct.product_variants) return [];
        const keys = new Set();
        displayProduct.product_variants.forEach(v => {
            if (v.combination) Object.keys(v.combination).forEach(k => keys.add(k));
        });
        return Array.from(keys);
    }, [displayProduct]);

    // 2. Find Current Variant
    const foundVariant = useMemo(() => {
        if (!displayProduct.product_variants || attributeKeys.length === 0) return null;
        return displayProduct.product_variants.find(v => {
            return Object.entries(v.combination).every(([key, val]) => selectedAttrs[key] === val);
        });
    }, [displayProduct, selectedAttrs, attributeKeys]);

    // 3. Derived Data (Price, Stock, Images)
    const currentPrice = foundVariant ? (foundVariant.use_base_price ? displayProduct.price : foundVariant.price) : displayProduct.price;
    const currentQty = foundVariant ? foundVariant.quantity : displayProduct.quantity;

    // Image Logic: If variant has images, use them. Else base.
    const currentImages = (foundVariant && foundVariant.image_urls && foundVariant.image_urls.length > 0)
        ? foundVariant.image_urls
        : (displayProduct.image_urls || []);

    // Effect: Reset selection on product change
    useEffect(() => {
        setSelectedAttrs({});
        setSelectedImage(0);
        setQty(1);
    }, [displayProduct.id]);

    // Effect: Fetch Related
    useEffect(() => {
        if (showRelated && displayProduct.id !== 'sample' && !isEditor) {
            fetchRelated();
        }
    }, [displayProduct.id, showRelated]);

    const fetchRelated = async () => {
        // Simple related: same store, exclude current
        // In future: same category
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', displayProduct.store_id)
            .neq('id', displayProduct.id)
            .limit(relatedLimit);
        if (data) setRelatedProducts(data);
    };


    // -- HELPER STYLES --
    const getAspectClass = () => {
        switch (aspectRatio) {
            case 'portrait': return 'aspect-[3/4]';
            case 'landscape': return 'aspect-[4/3]';
            case 'auto': return '';
            default: return 'aspect-square';
        }
    };

    const getStockStatus = () => {
        const q = currentQty || 0;
        if (q === 0) return { label: 'Out of Stock', color: outOfStockColor, bg: 'bg-red-50' };
        if (q <= lowStockThreshold) return { label: 'Low Stock', color: lowStockColor, bg: 'bg-orange-50' };
        return { label: 'In Stock', color: inStockColor, bg: 'bg-green-50' };
    };

    const stockInfo = getStockStatus();

    const hasDiscount = displayProduct.comparePrice && displayProduct.comparePrice > currentPrice;
    const discountPct = hasDiscount ? Math.round(((displayProduct.comparePrice - currentPrice) / displayProduct.comparePrice) * 100) : 0;

    // -- HANDLERS --
    const handleAttributeSelect = (key, value) => {
        const newAttrs = { ...selectedAttrs, [key]: value };
        setSelectedAttrs(newAttrs);

        // Auto-switch image if we find a variant with this exact partial match that has an image? 
        // For complexity, let's keep it simple: we wait for full match or just rely on 'foundVariant'.
        // BUT, user asked for "jump to that specific media gallery". 
        // If the NEW variant (foundVariant) changes, we reset image index.
        setSelectedImage(0);
    };

    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isMobile ? 'py-6' : ''}`}>

            {/* PRODUCT DETAILS */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 ${isMobile ? 'gap-6' : ''} mb-24`}>

                {/* -- MEDIA -- */}
                <div className={`flex ${thumbPos === 'left' ? 'flex-row-reverse' : 'flex-col'} gap-4`}>
                    <div className={`
                        flex-1 relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group
                        ${getAspectClass()}
                    `}>
                        {currentImages[selectedImage] ? (
                            <div className={`w-full h-full overflow-hidden ${enableZoom ? 'cursor-zoom-in' : ''}`}>
                                <img
                                    src={currentImages[selectedImage]}
                                    alt={displayProduct.name}
                                    className={`w-full h-full object-cover transition-transform duration-500 ${enableZoom ? 'group-hover:scale-110' : ''}`}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Box className="h-16 w-16 opacity-50" />
                            </div>
                        )}

                        {/* Mobile slider dots could go here */}
                    </div>

                    {/* Thumbnails */}
                    {currentImages.length > 1 && thumbPos !== 'hide' && (
                        <div className={`
                            ${thumbPos === 'left' ? 'flex flex-col w-20' : 'grid grid-cols-4'} 
                            gap-4
                        `}>
                            {currentImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`
                                        rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-square
                                        ${selectedImage === idx ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-slate-200'}
                                    `}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* -- INFO -- */}
                <div className={`flex flex-col ${alignment === 'center' ? 'items-center text-center' : alignment === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div className="mb-6 w-full">

                        {/* Tag & Title */}
                        <div className="mb-2">
                            {/* Optional Category or Eyebrow text could go here */}
                        </div>
                        <TitleTag
                            className={`leading-tight mb-4 font-${titleWeight} text-${titleSize}`}
                            style={{
                                color: titleColor,
                                fontSize: titleSize === 'sm' ? '0.875rem' :
                                    titleSize === 'md' ? '1rem' :
                                        titleSize === 'lg' ? '1.125rem' :
                                            titleSize === 'xl' ? '1.25rem' :
                                                titleSize === '2xl' ? '1.5rem' :
                                                    titleSize === '3xl' ? '1.875rem' : '2.25rem',
                                fontWeight: titleWeight === 'normal' ? 400 : titleWeight === 'medium' ? 500 : titleWeight === 'bold' ? 700 : 900
                            }}
                        >
                            {displayProduct.name}
                        </TitleTag>

                        {/* Price */}
                        {showPrice && (
                            <div className={`flex items-center space-x-3 mb-6 flex-wrap ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : ''}`}>
                                <span className="text-3xl font-bold" style={{ color: priceColor }}>
                                    ${parseFloat(currentPrice).toFixed(2)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-xl line-through opacity-60" style={{ color: compareColor }}>
                                        ${parseFloat(displayProduct.comparePrice).toFixed(2)}
                                    </span>
                                )}
                                {hasDiscount && showDiscount && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                                        Save {discountPct}%
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Stock Label */}
                        {showStock && (
                            <div className={`mb-6 ${alignment === 'center' ? 'flex justify-center' : alignment === 'right' ? 'flex justify-end' : ''}`}>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockInfo.bg}`}
                                    style={{ color: stockInfo.color }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: stockInfo.color }}></div>
                                    {stockInfo.label}
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        {showDesc && (
                            <div className={`mb-8 w-full ${descWidth === 'compact' ? 'max-w-md' : 'max-w-full'} ${alignment === 'center' ? 'mx-auto' : ''}`}>
                                <p className="text-slate-600 leading-relaxed text-base">
                                    {displayProduct.description || 'No description available.'}
                                </p>
                            </div>
                        )}

                        <div className="h-px bg-slate-100 w-full mb-8" />

                        {/* ATTR SELECTORS */}
                        {attributeKeys.length > 0 && (
                            <div className={`space-y-6 mb-8 w-full ${alignment === 'center' ? 'max-w-md mx-auto' : ''}`}>
                                {attributeKeys.map(key => {
                                    // Get all possible values for this key
                                    // Simplification: showing all values that exist in any variant
                                    const values = new Set();
                                    displayProduct.product_variants.forEach(v => {
                                        if (v.combination?.[key]) values.add(v.combination[key]);
                                    });

                                    return (
                                        <div key={key} className={`${alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'}`}>
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">{key}: <span className="text-slate-500 font-normal">{selectedAttrs[key]}</span></p>
                                            <div className={`flex flex-wrap gap-2 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : ''}`}>
                                                {Array.from(values).map(val => {
                                                    const isSelected = selectedAttrs[key] === val;
                                                    return (
                                                        <button
                                                            key={val}
                                                            onClick={() => handleAttributeSelect(key, val)}
                                                            className={`
                                                                px-4 py-2 rounded-lg text-sm font-medium transition-all border
                                                                ${isSelected
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-105'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                }
                                                            `}
                                                        >
                                                            {val}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* CART ACTIONS */}
                        <div className={`space-y-6 w-full ${alignment === 'center' ? 'max-w-md mx-auto' : ''}`}>
                            <div className={`${alignment === 'center' ? 'flex flex-col items-center' : alignment === 'right' ? 'flex flex-col items-end' : ''}`}>
                                <div className="flex items-center w-32 border border-slate-200 rounded-xl bg-white shadow-sm">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                        disabled={isEditor}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <div className="flex-1 text-center font-bold text-slate-900">{qty}</div>
                                    <button
                                        onClick={() => setQty(Math.min(currentQty || 99, qty + 1))}
                                        className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                        disabled={isEditor}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={() => !isEditor && addToCart(foundVariant || displayProduct, qty)}
                                    disabled={currentQty === 0 || isEditor}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                                >
                                    <ShoppingCart className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                                    {currentQty === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button
                                    className="p-4 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-colors"
                                    disabled={isEditor}
                                >
                                    <Share2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* RELATED PRODUCTS */}
            {showRelated && (relatedProducts.length > 0 || isEditor) && (
                <div className="border-t border-slate-100 pt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">{relatedTitle}</h2>
                    </div>
                    {/* Reuse Grid Renderer Logic or separate Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
                        {(isEditor && relatedProducts.length === 0 ? [1, 2, 3, 4] : relatedProducts).map((p, i) => (
                            <div key={p.id || i} className="group cursor-pointer">
                                <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                    {p.id ? (
                                        <img src={p.image_urls?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Box className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">{p.name || 'Related Product'}</h3>
                                <p className="text-slate-500 text-sm">${p.price || '99.99'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
