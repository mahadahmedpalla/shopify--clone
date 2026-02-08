import React, { useState } from 'react';
import { X, Settings2, Save } from 'lucide-react';
import { NavbarProperties } from '../widgets/navbar/NavbarProperties';
import { HeroProperties } from '../widgets/hero/HeroProperties';
import { HeroSlideshowProperties } from '../widgets/hero/HeroSlideshowProperties';
import { ProductGridProperties } from '../widgets/product_grid/ProductGridProperties';
import { ProductDetailProperties } from '../widgets/product_detail/ProductDetailProperties';
import { ProductReviewsProperties } from '../widgets/product_reviews/ProductReviewsProperties';
import { RelatedProductsProperties } from '../widgets/related_products/RelatedProductsProperties';
import { CartListProperties } from '../widgets/cart_list/CartListProperties';
import { CategoryListProperties } from '../widgets/category_list/CategoryListProperties';
import { CheckoutProperties } from '../widgets/checkout/CheckoutProperties';
import { ContainerProperties } from '../widgets/container/ContainerProperties';
import { ImageProperties } from '../widgets/image/ImageProperties';

export function PropertiesPanel({
    previewMode,
    selectedElement,
    onClose,
    onUpdate,
    products,
    categories,
    viewMode,
    storePages,
    onSaveCustom,
    storeId
}) {
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [presetName, setPresetName] = useState('');

    const handleSaveClick = () => {
        setPresetName('');
        setIsSaveModalOpen(true);
    };

    const handleConfirmSave = () => {
        if (!selectedElement || !presetName.trim()) return;
        onSaveCustom(presetName.trim(), selectedElement.type, selectedElement.settings);
        setIsSaveModalOpen(false);
    };

    return (
        <aside
            className={`bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative
            ${previewMode ? 'w-0 border-l-0 opacity-0' : 'w-72 opacity-100'}
        `}
        >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 gap-2">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Properties</h2>
                <div className="flex items-center gap-1">
                    {selectedElement && onSaveCustom && (
                        <button
                            onClick={handleSaveClick}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Save as Preset"
                        >
                            <Save className="h-4 w-4" />
                        </button>
                    )}
                    {selectedElement && <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>}
                </div>
            </div>

            {/* Save Preset Modal Overlay */}
            {isSaveModalOpen && (
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-4 w-full border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Save Custom Widget</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Widget Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="e.g., Summer Hero"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                                <button
                                    onClick={() => setIsSaveModalOpen(false)}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    disabled={!presetName.trim()}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedElement ? (
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Editing</p>
                        <p className="text-xs font-bold text-slate-800">{selectedElement.type.replace('_', ' ')}</p>
                    </div>

                    {selectedElement.type === 'container' ? (
                        <ContainerProperties
                            settings={selectedElement.settings}
                            onChange={onUpdate}
                            viewMode={viewMode}
                        />
                    ) : selectedElement.type === 'image' ? (
                        <ImageProperties
                            settings={selectedElement.settings}
                            onChange={onUpdate}
                            viewMode={viewMode}
                            storeId={storeId}
                        />
                    ) : selectedElement.type === 'navbar' ? (
                        <NavbarProperties
                            settings={selectedElement.settings}
                            viewMode={viewMode}
                            categories={categories}
                            products={products}
                            storePages={storePages}
                            onUpdate={onUpdate}
                            storeId={storeId}
                        />
                    ) : selectedElement.type === 'hero' ? (
                        <HeroProperties
                            settings={selectedElement.settings}
                            viewMode={viewMode}
                            onUpdate={onUpdate}
                            storeId={storeId}
                        />
                    ) : selectedElement.type === 'hero_slideshow' ? (
                        <HeroSlideshowProperties
                            settings={selectedElement.settings}
                            onUpdate={onUpdate}
                            storeId={storeId}
                            viewMode={viewMode}
                            storePages={storePages}
                        />
                    ) : selectedElement.type === 'product_grid' ? (
                        <ProductGridProperties
                            settings={selectedElement.settings}
                            categories={categories}
                            products={products}
                            viewMode={viewMode}
                            onUpdate={onUpdate}
                        />
                    ) : selectedElement.type === 'product_detail' ? (
                        <ProductDetailProperties
                            settings={selectedElement.settings}
                            onUpdate={onUpdate}
                        />
                    ) : selectedElement.type === 'product_reviews' ? (
                        <ProductReviewsProperties
                            settings={selectedElement.settings}
                            onUpdate={onUpdate}
                        />
                    ) : selectedElement.type === 'related_products' ? (
                        <RelatedProductsProperties
                            settings={selectedElement.settings}
                            categories={categories}
                            onUpdate={onUpdate}
                        />
                    ) : selectedElement.type === 'cart_list' ? (
                        <CartListProperties
                            settings={selectedElement.settings}
                            onUpdate={onUpdate}
                        />
                    ) : selectedElement.type === 'category_list' ? (
                        <CategoryListProperties
                            settings={selectedElement.settings}
                            categories={categories}
                            viewMode={viewMode}
                            onUpdate={onUpdate}
                        />
                    ) : selectedElement.type === 'checkout_form' ? (
                        <CheckoutProperties
                            settings={selectedElement.settings}
                            onUpdate={onUpdate}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title Text</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={selectedElement.settings.title || ''}
                                    onChange={(e) => onUpdate({ ...selectedElement.settings, title: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
                    <Settings2 className="h-8 w-8 text-slate-200" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Select an element to edit</p>
                </div>
            )}
        </aside>
    );
}
