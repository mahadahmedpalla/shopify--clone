import React from 'react';
import { Settings, Info } from 'lucide-react';

export const ProductReviewsProperties = ({ settings, onUpdate }) => {

    const handleChange = (key, value) => {
        onUpdate({
            ...settings,
            [key]: value
        });
    };

    return (
        <div className="space-y-6">
            {/* FUNCTIONALITY */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Settings className="w-3 h-3 mr-2" />
                    Functionality
                </h4>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Layout Style</label>
                    <select
                        value={settings.layoutMode || 'simple'}
                        onChange={(e) => handleChange('layoutMode', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="simple">Simple List</option>
                        <option value="chart">Summary Chart (Pro)</option>
                    </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.allowVerifiedOnly || false}
                            onChange={(e) => handleChange('allowVerifiedOnly', e.target.checked)}
                            className="mt-0.5 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-bold text-slate-700 block">Verified Purchasers Only</span>
                            <span className="text-xs text-slate-500 leading-tight block mt-0.5">
                                User must enter their generated Order ID to leave a review.
                            </span>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.allowMedia || false}
                            onChange={(e) => handleChange('allowMedia', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Allow Media Uploads</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.hideIfEmpty || false}
                            onChange={(e) => handleChange('hideIfEmpty', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Hide if no reviews</span>
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Sorting</label>
                    <select
                        value={settings.sortOrder || 'newest'}
                        onChange={(e) => handleChange('sortOrder', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                    </select>
                </div>
            </div>

            <div className="border-t border-slate-100 my-4" />

            {/* DESIGN */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Design
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Star Color</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={settings.starColor || '#FACC15'}
                                onChange={(e) => handleChange('starColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-400 font-mono">{settings.starColor || '#FACC15'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Button Color</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={settings.buttonColor || '#4F46E5'}
                                onChange={(e) => handleChange('buttonColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-400 font-mono">{settings.buttonColor || '#4F46E5'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Text Color</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={settings.textColor || '#1F2937'}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-400 font-mono">{settings.textColor || '#1F2937'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
