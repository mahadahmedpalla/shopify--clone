import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { trackStorageUpload, validateStorageAllowance } from '../../../../lib/storageHelper';
import { deleteStoreFiles } from '../../../../lib/storageHelper';
import { ColorInput } from '../Shared';
import {
    Trash2, Upload, AlignLeft, AlignCenter, AlignRight,
    ArrowUp, ArrowDown, Move, Smartphone, Tablet
} from 'lucide-react';

export function HeroProperties({ settings, onUpdate, viewMode, storeId, isTheme = false, developerId = null }) {
    const { storeId: paramStoreId } = useParams();
    // For Themes, storeId might be the themeId passed down. 
    // If isTheme is true, activeStoreId acts as the Theme ID for paths.
    const activeStoreId = storeId || paramStoreId;

    const update = (key, val) => {
        if (viewMode === 'desktop') {
            onUpdate({ ...settings, [key]: val });
        } else {
            const responsive = { ...(settings.responsive || {}) };
            responsive[viewMode] = { ...(responsive[viewMode] || {}), [key]: val };
            onUpdate({ ...settings, responsive });
        }
    };

    const getV = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        const override = settings.responsive?.[viewMode]?.[key];
        return override !== undefined ? override : (settings[key] !== undefined ? settings[key] : defaultVal);
    };

    const isO = (key) => viewMode !== 'desktop' && settings.responsive?.[viewMode]?.[key] !== undefined;

    const handleDeleteBackground = async () => {
        const imageUrl = getV('backgroundImage');
        if (!imageUrl) return;

        if (!confirm('Are you sure you want to delete this banner image? This will remove it from storage permanently.')) return;

        try {
            // Determine Bucket
            const bucketName = isTheme ? 'themes' : 'store-assets';

            // Delete from storage bucket
            // If isTheme, pass null for storeId to skip storage tracking
            await deleteStoreFiles(bucketName, [imageUrl], isTheme ? null : activeStoreId);

            // Manual cleanup for themes bucket if helper doesn't cover it (helper covers if path is correct)
            if (isTheme) {
                const urlObj = new URL(imageUrl);
                const pathPart = urlObj.pathname.split(`/${bucketName}/`)[1];
                if (pathPart) {
                    await supabase.storage.from(bucketName).remove([decodeURIComponent(pathPart)]);
                }
            }

            // Clear from state
            update('backgroundImage', '');
        } catch (err) {
            console.error('Error deleting banner:', err);
            alert('Failed to delete banner from storage.');
        }
    };

    const ResponsiveIndicator = ({ k }) => isO(k) ? (
        <span className="ml-1.5 px-1 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase flex items-center inline-flex">
            {viewMode === 'mobile' ? <Smartphone className="h-2 w-2 mr-0.5" /> : <Tablet className="h-2 w-2 mr-0.5" />} Override
        </span>
    ) : null;

    return (
        <div className="space-y-6 pb-20">
            {/* 1. Content */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</h3>

                <div className="pt-2">
                    <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <span className="font-bold uppercase tracking-widest text-[9px] flex items-center">
                            Show Content Above Image <ResponsiveIndicator k="showContentAboveImage" />
                        </span>
                        <input
                            type="checkbox"
                            checked={getV('showContentAboveImage')}
                            onChange={e => update('showContentAboveImage', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">
                        Background Image <ResponsiveIndicator k="backgroundImage" />
                    </label>
                    {getV('backgroundImage') ? (
                        <div className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                            <img src={getV('backgroundImage')} className="max-h-full w-full object-cover" alt="Hero BG" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={handleDeleteBackground} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl h-32 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group">
                            <Upload className="h-8 w-8 text-slate-300 group-hover:text-indigo-400 mb-2 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Banner</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (activeStoreId && !isTheme) {
                                        try {
                                            await validateStorageAllowance(activeStoreId, file.size);
                                        } catch (err) {
                                            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                                            alert(`Storage Limit Exceeded. Cannot upload ${fileSizeMB}MB file.\nPlease check your storage in store settings`);
                                            return;
                                        }
                                    }

                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${Math.random()}.${fileExt}`;

                                    // Determine Bucket and Path
                                    let bucketName = 'store-assets';
                                    let folder = '';

                                    if (isTheme) {
                                        if (!developerId) throw new Error("Developer ID missing");
                                        bucketName = 'themes';
                                        folder = `${developerId}/${activeStoreId}`;
                                    } else {
                                        bucketName = 'store-assets';
                                        folder = activeStoreId ? `${activeStoreId}` : ``;
                                    }

                                    const filePath = folder ? `${folder}/${fileName}` : fileName;

                                    const { error } = await supabase.storage
                                        .from(bucketName)
                                        .upload(filePath, file);

                                    if (error) return alert('Upload failed: ' + error.message);

                                    if (activeStoreId && !isTheme) {
                                        await trackStorageUpload(activeStoreId, file.size);
                                    }

                                    const { data: { publicUrl } } = supabase.storage
                                        .from(bucketName)
                                        .getPublicUrl(filePath);

                                    update('backgroundImage', publicUrl);
                                }}
                            />
                        </label>
                    )}

                    {/* Background Position Control */}
                    {getV('backgroundImage') && (
                        <div className="flex items-center justify-between pt-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Image Position <ResponsiveIndicator k="backgroundPosition" /></label>
                            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                <button onClick={() => update('backgroundPosition', 'top')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${getV('backgroundPosition', 'center') === 'top' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Top</button>
                                <button onClick={() => update('backgroundPosition', 'center')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${getV('backgroundPosition', 'center') === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Mid</button>
                                <button onClick={() => update('backgroundPosition', 'bottom')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${getV('backgroundPosition', 'center') === 'bottom' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Bot</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block flex items-center">
                        Texts <ResponsiveIndicator k="title" />
                    </label>
                    <input type="text" placeholder="Heading..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={getV('title', '')} onChange={e => update('title', e.target.value)} />
                    <textarea rows={3} placeholder="Subheading..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={getV('subtitle', '')} onChange={e => update('subtitle', e.target.value)} />
                </div>
            </section>

            {/* 2. Layout */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout</h3>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Hero Height <ResponsiveIndicator k="heightMode" /></label>
                    <div className="grid grid-cols-2 gap-2">
                        {['small', 'medium', 'large', 'full', 'custom'].map(m => (
                            <button
                                key={m}
                                onClick={() => update('heightMode', m)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${getV('heightMode') === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    {getV('heightMode') === 'custom' && (
                        <input type="text" className="w-full mt-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={getV('customHeight', '')} onChange={e => update('customHeight', e.target.value)} placeholder="e.g. 500px or 70vh" />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">H-Alignment <ResponsiveIndicator k="hAlignment" /></label>
                        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                            <button onClick={() => update('hAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('hAlignment') === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft className="h-4 w-4" /></button>
                            <button onClick={() => update('hAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('hAlignment') === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter className="h-4 w-4" /></button>
                            <button onClick={() => update('hAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('hAlignment') === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">V-Alignment <ResponsiveIndicator k="vAlignment" /></label>
                        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                            <button onClick={() => update('vAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('vAlignment') === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><ArrowUp className="h-4 w-4" /></button>
                            <button onClick={() => update('vAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('vAlignment') === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Move className="h-4 w-4" /></button>
                            <button onClick={() => update('vAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('vAlignment') === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><ArrowDown className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Style */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Style</h3>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Overlay Color" value={getV('overlayColor')} onChange={v => update('overlayColor', v)} />
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Opacity <ResponsiveIndicator k="overlayOpacity" /></label>
                        <input type="range" min="0" max="1" step="0.1" className="w-full accent-indigo-600" value={getV('overlayOpacity', 0.4)} onChange={e => update('overlayOpacity', parseFloat(e.target.value))} />
                    </div>
                </div>
                <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer">
                    <span className="font-bold uppercase tracking-widest text-[9px] flex items-center">Use Gradient Overlay <ResponsiveIndicator k="useGradient" /></span>
                    <input type="checkbox" checked={getV('useGradient')} onChange={e => update('useGradient', e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                </label>
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Border Radius (px) <ResponsiveIndicator k="borderRadius" /></label>
                    <input type="number" className="w-20 px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('borderRadius', '0px'))} onChange={e => update('borderRadius', e.target.value + 'px')} />
                </div>
            </section>

            {/* 4. Typography */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Typography</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Heading Font <ResponsiveIndicator k="headingFontFamily" /></label>
                        <select
                            className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                            value={getV('headingFontFamily', 'Inter, sans-serif')}
                            onChange={e => update('headingFontFamily', e.target.value)}
                        >
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Outfit', sans-serif">Outfit</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Subheading Font <ResponsiveIndicator k="subheadingFontFamily" /></label>
                        <select
                            className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                            value={getV('subheadingFontFamily', 'Inter, sans-serif')}
                            onChange={e => update('subheadingFontFamily', e.target.value)}
                        >
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Outfit', sans-serif">Outfit</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Heading Color" value={getV('headingColor')} onChange={v => update('headingColor', v)} />
                    <ColorInput label="Text Color" value={getV('subheadingColor')} onChange={v => update('subheadingColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Heading Size (px) <ResponsiveIndicator k="headingSize" /></label>
                        <input type="number" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={parseInt(getV('headingSize', '48px'))} onChange={e => update('headingSize', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Subheading Size (px) <ResponsiveIndicator k="subheadingSize" /></label>
                        <input type="number" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={parseInt(getV('subheadingSize', '18px'))} onChange={e => update('subheadingSize', e.target.value + 'px')} />
                    </div>
                </div>
            </section>

            {/* 5. Button Configuration */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button Configuration</h3>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block flex items-center">Button Labels <ResponsiveIndicator k="primaryBtnText" /></label>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Primary Label..." className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" value={getV('primaryBtnText', '')} onChange={e => update('primaryBtnText', e.target.value)} />
                        <input type="text" placeholder="Secondary Label..." className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" value={getV('secondaryBtnText', '')} onChange={e => update('secondaryBtnText', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Button Bg" value={getV('btnBgColor')} onChange={v => update('btnBgColor', v)} />
                    <ColorInput label="Button Text" value={getV('btnTextColor')} onChange={v => update('btnTextColor', v)} />
                    <ColorInput label="2nd Btn Color" value={getV('secondaryBtnTextColor')} onChange={v => update('secondaryBtnTextColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Padding X (px) <ResponsiveIndicator k="btnPaddingX" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnPaddingX', '32px'))} onChange={e => update('btnPaddingX', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Padding Y (px) <ResponsiveIndicator k="btnPaddingY" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnPaddingY', '16px'))} onChange={e => update('btnPaddingY', e.target.value + 'px')} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Font Size <ResponsiveIndicator k="btnFontSize" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnFontSize', '16px'))} onChange={e => update('btnFontSize', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Radius (px) <ResponsiveIndicator k="btnBorderRadius" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnBorderRadius', '9999px'))} onChange={e => update('btnBorderRadius', e.target.value + 'px')} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Margin Top (px) <ResponsiveIndicator k="btnMarginTop" /></label>
                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnMarginTop', '24px'))} onChange={e => update('btnMarginTop', e.target.value + 'px')} />
                </div>
            </section>
        </div>
    );
}
//just a comment