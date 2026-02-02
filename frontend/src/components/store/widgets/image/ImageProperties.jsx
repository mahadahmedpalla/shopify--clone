import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Image as ImageIcon, Maximize, Smartphone, Monitor, Tablet,
    AlignLeft, AlignCenter, AlignRight,
    MousePointer, PaintBucket, Upload, Link as LinkIcon
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export function ImageProperties({ settings, onChange, viewMode = 'desktop', storeId }) {
    const { storeId: paramStoreId } = useParams();
    const activeStoreId = storeId || paramStoreId;
    const [activeTab, setActiveTab] = useState('content'); // content, sizing, style, interaction
    const [uploading, setUploading] = useState(false);

    const updateSetting = (key, value) => {
        onChange({ ...settings, [key]: value });
    };

    const updateResponsiveSetting = (key, value) => {
        const current = settings[key] || {};
        onChange({
            ...settings,
            [key]: { ...current, [viewMode]: value }
        });
    };

    const getResponsiveValue = (key, fallback) => {
        return settings[key]?.[viewMode] || settings[key]?.['desktop'] || fallback;
    };

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            // Use standardized store-id isolation: storeId/filename
            const folder = activeStoreId ? `${activeStoreId}/widget-images` : `widget-images`;
            const filePath = `${folder}/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('store-images')
                .upload(filePath, file);

            if (uploadError) {
                // Try creating bucket if it doesn't exist (optional handling)
                console.error(uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('store-images')
                .getPublicUrl(filePath);

            updateSetting('src', data.publicUrl);
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* View Mode Indicator */}
            <div className="flex items-center justify-center p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-bold uppercase tracking-widest gap-2">
                {viewMode === 'mobile' && <Smartphone className="w-4 h-4" />}
                {viewMode === 'tablet' && <Tablet className="w-4 h-4" />}
                {viewMode === 'desktop' && <Monitor className="w-4 h-4" />}
                Editing {viewMode} Layout
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'content', label: 'Content', icon: ImageIcon },
                    { id: 'sizing', label: 'Size', icon: Maximize },
                    { id: 'style', label: 'Style', icon: PaintBucket },
                    { id: 'interaction', label: 'Action', icon: MousePointer }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center gap-1 ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {activeTab === 'content' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Image Source</label>

                            {/* Upload Button */}
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 peer-focus:border-indigo-500 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                                <p className="text-xs text-slate-500 font-semibold">Click to upload</p>
                                                <p className="text-[10px] text-slate-400">SVG, PNG, JPG (MAX. 2MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Or paste image URL..."
                                    value={settings.src || ''}
                                    onChange={(e) => updateSetting('src', e.target.value)}
                                    className="w-full p-2 pl-8 text-sm border border-slate-200 rounded-md"
                                />
                                <LinkIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alt Text</label>
                            <input
                                type="text"
                                placeholder="Describe the image..."
                                value={settings.alt || ''}
                                onChange={(e) => updateSetting('alt', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'sizing' && (
                    <div className="space-y-4">
                        {/* Aspect Ratio */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['auto', '1/1', '4/3', '16/9', '3/4', 'custom'].map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => updateResponsiveSetting('aspectRatio', ratio)}
                                        className={`px-2 py-1.5 text-xs border rounded-md capitalize ${getResponsiveValue('aspectRatio', 'auto') === ratio
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold'
                                            : 'border-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                            {getResponsiveValue('aspectRatio', 'auto') === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Ratio Value:</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={getResponsiveValue('customRatio', 1.5)}
                                        onChange={(e) => updateResponsiveSetting('customRatio', parseFloat(e.target.value))}
                                        className="w-full p-1.5 text-sm border border-slate-200 rounded-md"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Object Fit */}
                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Object Fit</label>
                            <select
                                value={settings.objectFit || 'cover'}
                                onChange={(e) => updateSetting('objectFit', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md bg-white"
                            >
                                <option value="cover">Cover (Fill Area)</option>
                                <option value="contain">Contain (No Crop)</option>
                                <option value="fill">Stretch</option>
                                <option value="scale-down">Scale Down</option>
                            </select>
                        </div>

                        {/* Width */}
                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Width</label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {['auto', 'full', 'custom'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => updateResponsiveSetting('widthMode', mode)}
                                        className={`px-2 py-1.5 text-xs border rounded-md capitalize ${getResponsiveValue('widthMode', 'auto') === mode
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold'
                                            : 'border-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            {getResponsiveValue('widthMode', 'auto') === 'custom' && (
                                <input
                                    type="text"
                                    placeholder="e.g. 300px or 50%"
                                    value={getResponsiveValue('width', '100%')}
                                    onChange={(e) => updateResponsiveSetting('width', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                />
                            )}
                        </div>

                        {/* Alignment */}
                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alignment</label>
                            <div className="flex bg-slate-100 rounded-md p-1">
                                {[
                                    { val: 'left', icon: AlignLeft },
                                    { val: 'center', icon: AlignCenter },
                                    { val: 'right', icon: AlignRight }
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => updateResponsiveSetting('alignment', opt.val)}
                                        className={`flex-1 flex items-center justify-center py-1.5 rounded transition-all ${getResponsiveValue('alignment', 'center') === opt.val
                                            ? 'bg-white shadow-sm text-indigo-600'
                                            : 'text-slate-500'
                                            }`}
                                    >
                                        <opt.icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="space-y-4">
                        {/* Border Radius */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                                Border Radius
                                <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">{settings.borderRadius || 0}px</span>
                            </label>
                            <input
                                type="range"
                                min="0" max="100"
                                value={settings.borderRadius || 0}
                                onChange={(e) => updateSetting('borderRadius', parseInt(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                        </div>

                        {/* Shadow */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shadow</label>
                            <select
                                value={settings.shadow || 'none'}
                                onChange={(e) => updateSetting('shadow', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md"
                            >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                            </select>
                        </div>

                        {/* Overlay */}
                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overlay</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={settings.overlayColor || '#000000'}
                                    onChange={(e) => updateSetting('overlayColor', e.target.value)}
                                    className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                                />
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 w-12 text-right">Opacity:</span>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={settings.overlayOpacity || 0}
                                        onChange={(e) => updateSetting('overlayOpacity', parseFloat(e.target.value))}
                                        className="flex-1 accent-indigo-600"
                                    />
                                    <span className="text-[10px] w-6">{settings.overlayOpacity || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'interaction' && (
                    <div className="space-y-4">
                        {/* Hover Effect */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hover Effect</label>
                            <select
                                value={settings.hoverEffect || 'none'}
                                onChange={(e) => updateSetting('hoverEffect', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md"
                            >
                                <option value="none">None</option>
                                <option value="zoom">Zoom In</option>
                                <option value="lift">Lift Up</option>
                                <option value="fade">Fade</option>
                                <option value="blur">Blur</option>
                                <option value="overlay">Reveal Overlay</option>
                            </select>
                        </div>

                        {/* Click Action */}
                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Click Action</label>
                            <select
                                value={settings.clickAction || 'none'}
                                onChange={(e) => updateSetting('clickAction', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md"
                            >
                                <option value="none">None</option>
                                <option value="link">Open Link</option>
                                <option value="lightbox">Open Lightbox (Fullscreen)</option>
                            </select>
                        </div>

                        {settings.clickAction === 'link' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">URL destination</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={settings.linkUrl || ''}
                                    onChange={(e) => updateSetting('linkUrl', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
