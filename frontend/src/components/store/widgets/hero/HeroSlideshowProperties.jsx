import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus, Trash2, ChevronUp, ChevronDown, Image, Type, MousePointer,
    Play, Pause, Clock, MoveHorizontal, Layout, Monitor, Smartphone, Tablet,
    AlignLeft, AlignCenter, AlignRight, ArrowUp, Move, ArrowDown
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { deleteStoreFiles, extractPathFromUrl, trackStorageUpload, validateStorageAllowance } from '../../../../lib/storageHelper';
import { ColorInput } from '../Shared';

export function HeroSlideshowProperties({ settings, onUpdate, storeId, viewMode = 'desktop', storePages = [], isTheme = false, developerId = null }) {
    const { storeId: paramStoreId } = useParams();
    const activeStoreId = storeId || paramStoreId;
    const [activeTab, setActiveTab] = useState('slides'); // slides, settings, style
    const [expandedSlide, setExpandedSlide] = useState(0); // Index of expanded slide in Slides tab
    const [expandedStyleSlide, setExpandedStyleSlide] = useState(0); // Index of expanded slide in Style tab

    const slides = settings.slides || [];

    const handleUpdate = (updatedSettings) => {
        onUpdate({ ...settings, ...updatedSettings });
    };

    // Responsive Helpers
    const getResponsiveKey = (key) => {
        if (viewMode === 'desktop') return key;
        return `${key}_${viewMode}`;
    };

    const getSlideValue = (slide, key) => {
        const respKey = getResponsiveKey(key);
        return slide[respKey];
    };

    // Fallback getter for placeholders to show inheritance
    const getSlideInheritedValue = (slide, key) => {
        // Simple fallback chain: mobile -> tablet -> desktop (simplified, usually inherit from desktop)
        // If we are editing mobile, and value is unset, the renderer will use desktop.
        // So placeholder should show desktop value.
        if (viewMode === 'desktop') return '';
        return slide[key];
    };

    const handleSlideUpdate = (index, key, value) => {
        const newSlides = [...slides];
        const targetKey = getResponsiveKey(key);
        newSlides[index] = { ...newSlides[index], [targetKey]: value };
        handleUpdate({ slides: newSlides });
    };

    // Slide Management
    const addSlide = () => {
        const newSlide = {
            id: Date.now(),
            image: '',
            title: 'New Slide',
            subtitle: 'Slide Description',
            buttons: [{ id: Date.now(), text: 'Shop Now', link: '#', variant: 'primary', linkType: 'url' }],
            // Defaults for style
            hAlignment: 'center',
            vAlignment: 'center',
            headingColor: '#ffffff',
            subheadingColor: '#e2e8f0',
            btnBgColor: '#ffffff',
            btnTextColor: '#000000'
        };
        handleUpdate({ slides: [...slides, newSlide] });
        setExpandedSlide(slides.length);
    };

    const removeSlide = (index) => {
        const newSlides = [...slides];
        newSlides.splice(index, 1);
        handleUpdate({ slides: newSlides });
    };

    const moveSlide = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === slides.length - 1) return;
        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
        handleUpdate({ slides: newSlides });
        setExpandedSlide(targetIndex);
    };

    const handleImageUpload = async (file, slideIndex) => {
        if (!file) return;
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

        let bucketName = 'store-assets';
        let folder = '';

        if (isTheme) {
            if (!developerId) throw new Error("Developer ID missing");
            bucketName = 'themes';
            folder = `${developerId}/${activeStoreId}`;
        } else {
            bucketName = 'store-assets';
            folder = activeStoreId ? `${activeStoreId}/slideshow` : 'slideshow';
        }

        const filePath = `${folder}/${fileName}`;


        if (activeStoreId && !isTheme) {
            const allowed = await validateStorageAllowance(activeStoreId, file.size);
            if (!allowed) {
                alert("Storage limit exceeded. Please upgrade your plan or delete some files.");
                return;
            }
        }

        const { error } = await supabase.storage.from(bucketName).upload(filePath, file);
        if (error) {
            console.error('Upload error:', error);
            return;
        }

        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

        if (activeStoreId && !isTheme) {
            await trackStorageUpload(activeStoreId, file.size);
        }

        // Uses the responsive key logic to upload per-device image if needed
        handleSlideUpdate(slideIndex, 'image', data.publicUrl);
    };

    const handleImageDelete = async (slideIndex) => {
        const slide = slides[slideIndex];
        const imageUrl = getSlideValue(slide, 'image') || slide.image;

        if (!imageUrl) return;

        if (!confirm('Are you sure you want to delete this image? This will remove it from storage permanently.')) return;

        try {
            const bucketName = isTheme ? 'themes' : 'store-assets';
            // Correctly call the helper with bucket, array of URLs, and storeId for tracking (null for themes)
            await deleteStoreFiles(bucketName, [imageUrl], isTheme ? null : activeStoreId);

            if (isTheme) {
                const urlObj = new URL(imageUrl);
                const pathPart = urlObj.pathname.split(`/${bucketName}/`)[1];
                if (pathPart) {
                    await supabase.storage.from(bucketName).remove([decodeURIComponent(pathPart)]);
                }
            }

            // Clear from state
            handleSlideUpdate(slideIndex, 'image', '');
        } catch (err) {
            console.error('Error deleting image:', err);
            alert('Failed to delete image from storage.');
        }
    };

    // Button Management
    const updateButton = (slideIndex, btnIndex, key, value) => {
        const newSlides = [...slides];
        const buttons = [...(newSlides[slideIndex].buttons || [])];
        // Buttons content (text/link) is global for now as per usual pattern, 
        // unless specified otherwise. We'll keep content global, styling responsive.
        buttons[btnIndex] = { ...buttons[btnIndex], [key]: value };
        newSlides[slideIndex].buttons = buttons;
        handleUpdate({ slides: newSlides });
    };

    const addButton = (slideIndex) => {
        const newSlides = [...slides];
        const buttons = [...(newSlides[slideIndex].buttons || [])];
        if (buttons.length >= 3) return;
        buttons.push({ id: Date.now(), text: 'New Button', link: '#', variant: buttons.length === 0 ? 'primary' : 'secondary', linkType: 'url' });
        newSlides[slideIndex].buttons = buttons;
        handleUpdate({ slides: newSlides });
    };

    const removeButton = (slideIndex, btnIndex) => {
        const newSlides = [...slides];
        const buttons = [...(newSlides[slideIndex].buttons || [])];
        buttons.splice(btnIndex, 1);
        newSlides[slideIndex].buttons = buttons;
        handleUpdate({ slides: newSlides });
    };

    return (
        <div className="space-y-6">
            {/* View Mode Indicator */}
            {viewMode !== 'desktop' && (
                <div className="bg-indigo-50 p-2 rounded text-xs font-bold text-indigo-700 flex items-center gap-2 border border-indigo-100">
                    {viewMode === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Tablet className="h-3 w-3" />}
                    <span>Editing for {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
                {['slides', 'settings', 'style'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* SLIDES TAB */}
            {activeTab === 'slides' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Slides ({slides.length})</span>
                        <button onClick={addSlide} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex items-center gap-1 text-xs font-bold">
                            <Plus className="h-3 w-3" /> Add Slide
                        </button>
                    </div>

                    <div className="space-y-2">
                        {slides.map((slide, index) => (
                            <div key={slide.id || index} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <div
                                    className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => setExpandedSlide(expandedSlide === index ? -1 : index)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-12 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-300 relative">
                                            {getSlideValue(slide, 'image') || slide.image ? (
                                                <img src={getSlideValue(slide, 'image') || slide.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Image className="h-4 w-4" /></div>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{slide.title || 'Untitled'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); moveSlide(index, 'up'); }} disabled={index === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveSlide(index, 'down'); }} disabled={index === slides.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); removeSlide(index); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                </div>

                                {expandedSlide === index && (
                                    <div className="p-3 space-y-4 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                        {/* Image Upload */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                                Slide Image {viewMode !== 'desktop' && '(Override)'}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={getSlideValue(slide, 'image') || ''}
                                                    onChange={(e) => handleSlideUpdate(index, 'image', e.target.value)}
                                                    className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                    placeholder={getSlideInheritedValue(slide, 'image') || "https://..."}
                                                />
                                                <label className="cursor-pointer p-1.5 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200" title="Upload Image">
                                                    <Image className="h-4 w-4 text-slate-500" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], index)} />
                                                </label>
                                                {(getSlideValue(slide, 'image') || slide.image) && (
                                                    <button
                                                        onClick={() => handleImageDelete(index)}
                                                        className="p-1.5 bg-red-50 text-red-500 rounded border border-red-100 hover:bg-red-100"
                                                        title="Delete Image & File"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Texts - Changed to Textarea for Preformatted Text Support */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={getSlideValue(slide, 'showText') !== false}
                                                    onChange={(e) => handleSlideUpdate(index, 'showText', e.target.checked)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                                />
                                                Show Content
                                            </label>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Heading</label>
                                                <textarea
                                                    value={getSlideValue(slide, 'title') || ''}
                                                    onChange={(e) => handleSlideUpdate(index, 'title', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs min-h-[60px]"
                                                    placeholder={getSlideInheritedValue(slide, 'title')}
                                                    rows={2}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subheading</label>
                                                <textarea
                                                    value={getSlideValue(slide, 'subtitle') || ''}
                                                    onChange={(e) => handleSlideUpdate(index, 'subtitle', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs min-h-[60px]"
                                                    placeholder={getSlideInheritedValue(slide, 'subtitle')}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        {/* Buttons Manager */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Buttons (Max 3)</label>
                                                    <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer ml-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={getSlideValue(slide, 'showButtons') !== false}
                                                            onChange={(e) => handleSlideUpdate(index, 'showButtons', e.target.checked)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                                        />
                                                        Visible
                                                    </label>
                                                </div>
                                                {(slide.buttons?.length || 0) < 3 && viewMode === 'desktop' && (
                                                    <button onClick={() => addButton(index)} className="text-[10px] font-bold text-indigo-600 hover:underline">+ Add</button>
                                                )}
                                            </div>

                                            <div className="space-y-4 pt-1">
                                                {(slide.buttons || []).map((btn, btnIdx) => (
                                                    <div key={btn.id || btnIdx} className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
                                                        {/* Top Row: Label & Variant & Delete */}
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                placeholder="Label"
                                                                value={btn.text}
                                                                onChange={(e) => updateButton(index, btnIdx, 'text', e.target.value)}
                                                                className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                                                                disabled={viewMode !== 'desktop'}
                                                            />
                                                            <select
                                                                value={btn.variant}
                                                                onChange={(e) => updateButton(index, btnIdx, 'variant', e.target.value)}
                                                                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-20"
                                                                disabled={viewMode !== 'desktop'}
                                                            >
                                                                <option value="primary">Fill</option>
                                                                <option value="secondary">Light</option>
                                                                <option value="outline">Outline</option>
                                                            </select>
                                                            {viewMode === 'desktop' && (
                                                                <button onClick={() => removeButton(index, btnIdx)} className="p-1 text-slate-400 hover:text-red-500">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Link Type Selection */}
                                                        <div className="flex gap-4 text-xs">
                                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name={`linkType-${index}-${btnIdx}`}
                                                                    checked={!btn.linkType || btn.linkType === 'url'}
                                                                    onChange={() => updateButton(index, btnIdx, 'linkType', 'url')}
                                                                    className="text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                                                />
                                                                <span className="text-slate-600">External URL</span>
                                                            </label>
                                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name={`linkType-${index}-${btnIdx}`}
                                                                    checked={btn.linkType === 'page'}
                                                                    onChange={() => updateButton(index, btnIdx, 'linkType', 'page')}
                                                                    className="text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                                                />
                                                                <span className="text-slate-600">Store Page</span>
                                                            </label>
                                                        </div>

                                                        {/* Link Input (Conditional) */}
                                                        {(!btn.linkType || btn.linkType === 'url') ? (
                                                            <input
                                                                type="text"
                                                                placeholder="https://google.com"
                                                                value={btn.link || ''}
                                                                onChange={(e) => updateButton(index, btnIdx, 'link', e.target.value)}
                                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-600"
                                                                disabled={viewMode !== 'desktop'}
                                                            />
                                                        ) : (
                                                            <select
                                                                value={btn.targetPage || ''}
                                                                onChange={(e) => updateButton(index, btnIdx, 'targetPage', e.target.value)}
                                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700"
                                                                disabled={viewMode !== 'desktop'}
                                                            >
                                                                <option value="">-- Select Page --</option>
                                                                <option value="home">Home Page</option>
                                                                <option value="cart">Cart Page</option>
                                                                <option value="checkout">Checkout Page</option>
                                                                {(storePages || []).map(p => (
                                                                    <option key={p.id} value={p.slug}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!slide.buttons || slide.buttons.length === 0) && (
                                                    <div className="text-xs text-slate-400 italic text-center py-2">No buttons added</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SETTINGS TAB -> GLOBAL SETTINGS ONLY */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    {/* Controls */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2"><MoveHorizontal className="h-3 w-3" /> Controls</h4>
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs font-medium cursor-pointer">
                                <span>Show Arrows</span>
                                <input type="checkbox" checked={settings.showArrows} onChange={(e) => handleUpdate({ showArrows: e.target.checked })} />
                            </label>
                            <label className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs font-medium cursor-pointer">
                                <span>Show Dots</span>
                                <input type="checkbox" checked={settings.showDots} onChange={(e) => handleUpdate({ showDots: e.target.checked })} />
                            </label>
                        </div>
                    </div>

                    {/* Autoplay */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2"><Play className="h-3 w-3" /> Autoplay</h4>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs font-medium cursor-pointer">
                                <span>Enable Autoplay</span>
                                <input type="checkbox" checked={settings.autoplay} onChange={(e) => handleUpdate({ autoplay: e.target.checked })} />
                            </label>
                            {settings.autoplay && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Duration (ms)</label>
                                    <input
                                        type="number"
                                        value={settings.autoplayDuration || 5000}
                                        onChange={(e) => handleUpdate({ autoplayDuration: parseInt(e.target.value) })}
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Layout */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2"><Layout className="h-3 w-3" /> Layout</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Height Mode</label>
                                <select
                                    value={settings.heightMode || 'full'}
                                    onChange={(e) => handleUpdate({ heightMode: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                >
                                    <option value="full">Full Screen</option>
                                    <option value="large">Large (80vh)</option>
                                    <option value="medium">Medium (60vh)</option>
                                    <option value="small">Small (40vh)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STYLE TAB -> PER SLIDE STYLING */}
            {activeTab === 'style' && (
                <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold text-center mb-2">Per-Slide Styling</p>
                    <div className="space-y-2">
                        {slides.map((slide, index) => {
                            // Display Logic: Show active override or fallback to inherited for UI state check
                            const hAlign = getSlideValue(slide, 'hAlignment') || slide.hAlignment;
                            const vAlign = getSlideValue(slide, 'vAlignment') || slide.vAlignment;

                            return (
                                <div key={slide.id || index} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                    <div
                                        className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => setExpandedStyleSlide(expandedStyleSlide === index ? -1 : index)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-10 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-300 relative">
                                                {slide.image && <img src={slide.image} className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">#{index + 1} {slide.title || 'Untitled'}</span>
                                        </div>
                                        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${expandedStyleSlide === index ? 'rotate-180' : ''}`} />
                                    </div>

                                    {expandedStyleSlide === index && (
                                        <div className="p-3 space-y-6 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">

                                            {/* 1. Layout / Alignment */}
                                            <section className="space-y-3">
                                                <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Alignment {viewMode !== 'desktop' && '(Override)'}</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horizontal</label>
                                                        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                            <button onClick={() => handleSlideUpdate(index, 'hAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${hAlign === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignLeft className="h-4 w-4" /></button>
                                                            <button onClick={() => handleSlideUpdate(index, 'hAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${!hAlign || hAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignCenter className="h-4 w-4" /></button>
                                                            <button onClick={() => handleSlideUpdate(index, 'hAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${hAlign === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignRight className="h-4 w-4" /></button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vertical</label>
                                                        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                            <button onClick={() => handleSlideUpdate(index, 'vAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${vAlign === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><ArrowUp className="h-4 w-4" /></button>
                                                            <button onClick={() => handleSlideUpdate(index, 'vAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${!vAlign || vAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Move className="h-4 w-4" /></button>
                                                            <button onClick={() => handleSlideUpdate(index, 'vAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${vAlign === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><ArrowDown className="h-4 w-4" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* 2. Typography */}
                                            <section className="space-y-3 pt-3 border-t border-slate-100">
                                                <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Typography</h5>

                                                {/* Heading */}
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Heading</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'headingSize') || '48')} className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'headingSize') || '') || ''} onChange={(e) => handleSlideUpdate(index, 'headingSize', e.target.value + 'px')} />
                                                        <ColorInput value={getSlideValue(slide, 'headingColor') || getSlideInheritedValue(slide, 'headingColor') || '#ffffff'} onChange={(v) => handleSlideUpdate(index, 'headingColor', v)} />
                                                    </div>
                                                    <select
                                                        className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                                                        value={getSlideValue(slide, 'headingFontFamily') || getSlideInheritedValue(slide, 'headingFontFamily') || 'Inter, sans-serif'}
                                                        onChange={(e) => handleSlideUpdate(index, 'headingFontFamily', e.target.value)}
                                                    >
                                                        <option value="Inter, sans-serif">Inter</option>
                                                        <option value="'Outfit', sans-serif">Outfit</option>
                                                        <option value="'Playfair Display', serif">Playfair Display</option>
                                                        <option value="'Montserrat', sans-serif">Montserrat</option>
                                                    </select>
                                                </div>

                                                {/* Subheading */}
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Subheading</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'subheadingSize') || '18')} className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'subheadingSize') || '') || ''} onChange={(e) => handleSlideUpdate(index, 'subheadingSize', e.target.value + 'px')} />
                                                        <ColorInput value={getSlideValue(slide, 'subheadingColor') || getSlideInheritedValue(slide, 'subheadingColor') || '#e2e8f0'} onChange={(v) => handleSlideUpdate(index, 'subheadingColor', v)} />
                                                    </div>
                                                    <select
                                                        className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                                                        value={getSlideValue(slide, 'subheadingFontFamily') || getSlideInheritedValue(slide, 'subheadingFontFamily') || 'Inter, sans-serif'}
                                                        onChange={(e) => handleSlideUpdate(index, 'subheadingFontFamily', e.target.value)}
                                                    >
                                                        <option value="Inter, sans-serif">Inter</option>
                                                        <option value="'Outfit', sans-serif">Outfit</option>
                                                        <option value="'Playfair Display', serif">Playfair Display</option>
                                                        <option value="'Montserrat', sans-serif">Montserrat</option>
                                                    </select>
                                                </div>
                                            </section>

                                            {/* 3. Button Config */}
                                            <section className="space-y-3 pt-3 border-t border-slate-100">
                                                <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Button Styling</h5>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <ColorInput label="Primary Bg" value={getSlideValue(slide, 'btnBgColor') || getSlideInheritedValue(slide, 'btnBgColor') || '#ffffff'} onChange={v => handleSlideUpdate(index, 'btnBgColor', v)} />
                                                    <ColorInput label="Primary Text" value={getSlideValue(slide, 'btnTextColor') || getSlideInheritedValue(slide, 'btnTextColor') || '#000000'} onChange={v => handleSlideUpdate(index, 'btnTextColor', v)} />
                                                    <ColorInput label="Secondary Text" value={getSlideValue(slide, 'secondaryBtnTextColor') || getSlideInheritedValue(slide, 'secondaryBtnTextColor') || '#ffffff'} onChange={v => handleSlideUpdate(index, 'secondaryBtnTextColor', v)} />
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Structure</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'btnPaddingX') || '32')} title="Padding X" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'btnPaddingX') || '') || ''} onChange={e => handleSlideUpdate(index, 'btnPaddingX', e.target.value + 'px')} />
                                                            <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'btnPaddingY') || '16')} title="Padding Y" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'btnPaddingY') || '') || ''} onChange={e => handleSlideUpdate(index, 'btnPaddingY', e.target.value + 'px')} />
                                                            <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'btnBorderRadius') || '99')} title="Border Radius" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'btnBorderRadius') || '') || ''} onChange={e => handleSlideUpdate(index, 'btnBorderRadius', e.target.value + 'px')} />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Font Size (px)</label>
                                                        <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'btnFontSize') || '16')} className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'btnFontSize') || '') || ''} onChange={e => handleSlideUpdate(index, 'btnFontSize', e.target.value + 'px')} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Margin Top (px)</label>
                                                        <input type="number" placeholder={parseInt(getSlideInheritedValue(slide, 'btnMarginTop') || '24')} className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getSlideValue(slide, 'btnMarginTop') || '') || ''} onChange={e => handleSlideUpdate(index, 'btnMarginTop', e.target.value + 'px')} />
                                                    </div>
                                                </div>
                                            </section>

                                            {/* 4. Overlay Config */}
                                            <section className="space-y-3 pt-3 border-t border-slate-100">
                                                <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Overlay {viewMode !== 'desktop' && '(Override)'}</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <ColorInput
                                                        label="Overlay Color"
                                                        value={getSlideValue(slide, 'overlayColor') || getSlideInheritedValue(slide, 'overlayColor') || '#000000'}
                                                        onChange={(v) => handleSlideUpdate(index, 'overlayColor', v)}
                                                    />
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Opacity (%)</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={parseInt(getSlideValue(slide, 'overlayOpacity') || getSlideInheritedValue(slide, 'overlayOpacity') || '40')}
                                                                onChange={(e) => handleSlideUpdate(index, 'overlayOpacity', e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <span className="text-xs font-mono text-slate-600 w-8 text-right">
                                                                {getSlideValue(slide, 'overlayOpacity') || getSlideInheritedValue(slide, 'overlayOpacity') || '40'}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
