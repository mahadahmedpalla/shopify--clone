import React, { useState } from 'react';
import { ShoppingCart, Share2, Minus, Plus, Box, ZoomIn } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';

export function ProductDetailRenderer({ settings, product, viewMode, isEditor, store }) {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    // Mock Product for Editor
    const displayProduct = product || {
        id: 'sample',
        name: 'Sample Product Title',
        price: 99.99,
        comparePrice: 129.99,
        description: 'This is a sample product description to demonstrate the layout and typography settings. You can customize the look and feel of this text.',
        images: [],
        quantity: 5
    };

    const isMobile = viewMode === 'mobile';

    // -- SETTINGS DEFAULTS --
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

    // -- HELPERS --
    const getAspectClass = () => {
        switch (aspectRatio) {
            case 'portrait': return 'aspect-[3/4]';
            case 'landscape': return 'aspect-[4/3]';
            case 'auto': return ''; // natural height
            default: return 'aspect-square';
        }
    };

    const getTitleClass = () => {
        let cls = `leading-tight mb-2 `;
        // Size
        if (titleSize === 'sm') cls += 'text-sm ';
        if (titleSize === 'md') cls += 'text-base ';
        if (titleSize === 'lg') cls += 'text-lg ';
        if (titleSize === 'xl') cls += 'text-xl ';
        if (titleSize === '2xl') cls += 'text-2xl ';
        if (titleSize === '3xl') cls += 'text-3xl ';
        if (titleSize === '4xl') cls += 'text-4xl ';

        // Weight
        if (titleWeight === 'normal') cls += 'font-normal ';
        if (titleWeight === 'medium') cls += 'font-medium ';
        if (titleWeight === 'bold') cls += 'font-bold ';
        if (titleWeight === 'extrabold') cls += 'font-extrabold ';

        return cls;
    };

    const getStockStatus = () => {
        const q = displayProduct.quantity || 0;
        if (q === 0) return { label: 'Out of Stock', color: outOfStockColor, bg: 'bg-red-50' };
        if (q <= lowStockThreshold) return { label: 'Low Stock', color: lowStockColor, bg: 'bg-orange-50' };
        return { label: 'In Stock', color: inStockColor, bg: 'bg-green-50' };
    };

    const stockInfo = getStockStatus();

    // Discount Calc
    const hasDiscount = displayProduct.comparePrice && displayProduct.comparePrice > displayProduct.price;
    const discountPct = hasDiscount ? Math.round(((displayProduct.comparePrice - displayProduct.price) / displayProduct.comparePrice) * 100) : 0;


    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isMobile ? 'py-6' : ''}`}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 ${isMobile ? 'gap-6' : ''}`}>

                {/* -- MEDIA SECTION -- */}
                <div className={`flex ${thumbPos === 'left' ? 'flex-row-reverse' : 'flex-col'} gap-4`}>
                    {/* Main Image */}
                    <div className={`
                        flex-1 relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group
                        ${getAspectClass()}
                    `}>
                        {displayProduct.images?.[selectedImage] ? (
                            <div className={`w-full h-full overflow-hidden ${enableZoom ? 'cursor-zoom-in' : ''}`}>
                                <img
                                    src={displayProduct.images[selectedImage]}
                                    alt={displayProduct.name}
                                    className={`w-full h-full object-cover transition-transform duration-500 ${enableZoom ? 'group-hover:scale-110' : ''}`}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Box className="h-16 w-16 opacity-50" />
                            </div>
                        )}

                        {/* Badges overlay could go here */}
                    </div>

                    {/* Thumbnails */}
                    {displayProduct.images?.length > 1 && thumbPos !== 'hide' && (
                        <div className={`
                            ${thumbPos === 'left' ? 'flex flex-col w-20' : 'grid grid-cols-4'} 
                            gap-4
                        `}>
                            {displayProduct.images.map((img, idx) => (
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

                {/* -- INFO SECTION -- */}
                <div className={`flex flex-col ${alignment === 'center' ? 'items-center text-center' : alignment === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div className="mb-6 w-full">

                        {/* Title */}
                        <TitleTag className={getTitleClass()} style={{ color: titleColor }}>
                            {displayProduct.name}
                        </TitleTag>

                        {/* Price Area */}
                        {showPrice && (
                            <div className={`flex items-center space-x-3 mb-4 flex-wrap ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : ''}`}>
                                <span className="text-2xl font-bold" style={{ color: priceColor }}>
                                    ${parseFloat(displayProduct.price).toFixed(2)}
                                </span>

                                {hasDiscount && (
                                    <span className="text-lg line-through" style={{ color: compareColor }}>
                                        ${parseFloat(displayProduct.comparePrice).toFixed(2)}
                                    </span>
                                )}

                                {hasDiscount && showDiscount && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Save {discountPct}%
                                    </span>
                                )}

                                {showStock && (
                                    <span
                                        className={`px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wide ml-2 ${stockInfo.bg}`}
                                        style={{ color: stockInfo.color }}
                                    >
                                        {stockInfo.label}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {showDesc && (
                            <div className={`w-full ${descWidth === 'compact' ? 'max-w-md' : 'max-w-full'} ${alignment === 'center' ? 'mx-auto' : ''}`}>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    {displayProduct.description || 'No description available.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 w-full mb-8" />

                    <div className={`space-y-6 w-full ${alignment === 'center' ? 'max-w-md mx-auto' : ''}`}>
                        {/* Quantity */}
                        <div className={`${alignment === 'center' ? 'flex flex-col items-center' : alignment === 'right' ? 'flex flex-col items-end' : ''}`}>
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Quantity</label>
                            <div className="flex items-center w-32 border border-slate-200 rounded-xl bg-white">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                    disabled={isEditor}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <div className="flex-1 text-center font-bold text-slate-900">{qty}</div>
                                <button
                                    onClick={() => setQty(Math.min(displayProduct.quantity || 99, qty + 1))}
                                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                    disabled={isEditor}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => !isEditor && addToCart(displayProduct, qty)}
                                disabled={displayProduct.quantity === 0 || isEditor}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                            >
                                <ShoppingCart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                {isEditor ? 'Add to Cart' : 'Add to Cart'}
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
    );
}
