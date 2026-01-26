import React from 'react';
import { Box } from 'lucide-react';

export function ProductGridRenderer({ settings, products, viewMode }) {
    // Filter products logic
    let displayProducts = products || [];
    if (settings.categoryId && settings.categoryId !== 'all') {
        displayProducts = displayProducts.filter(p => p.category_id === settings.categoryId);
    }
    if (settings.limit) {
        displayProducts = displayProducts.slice(0, parseInt(settings.limit));
    }

    // Layout (Columns) - Responsive default fallback
    const colsDesktop = settings.columns?.desktop || 4;
    const colsTablet = settings.columns?.tablet || 3;
    const colsMobile = settings.columns?.mobile || 2;

    const colsMap = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6'
    };

    const getColsClass = () => {
        let columns = 4;
        if (viewMode === 'mobile') columns = colsMobile;
        else if (viewMode === 'tablet') columns = colsTablet;
        else columns = colsDesktop;

        return colsMap[columns] || 'grid-cols-4';
    };

    return (
        <div className="p-12 space-y-8 bg-white">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{settings.title || 'Featured Products'}</h3>
                <span className="text-sm font-bold text-indigo-600 cursor-pointer hover:underline">View All</span>
            </div>
            {displayProducts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No products found in this collection.</p>
                </div>
            ) : (
                <div className={`grid gap-6 ${getColsClass()}`}>
                    {displayProducts.map(product => (
                        <div key={product.id} className="space-y-3 p-4 border border-transparent hover:border-slate-100 rounded-2xl hover:shadow-lg transition-all group cursor-pointer bg-white">
                            <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden relative">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Box className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1 line-clamp-2">{product.name}</h4>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-slate-900">${parseFloat(product.price).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
