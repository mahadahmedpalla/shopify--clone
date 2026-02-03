import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus, Trash2, ChevronUp, ChevronDown, Image, Type, MousePointer,
    Play, Pause, Clock, MoveHorizontal, Layout, Monitor, Smartphone, Tablet,
    AlignLeft, AlignCenter, AlignRight, ArrowUp, Move, ArrowDown
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { ColorInput } from '../Shared';

export function HeroSlideshowProperties({ settings, onUpdate, storeId }) {
    const { storeId: paramStoreId } = useParams();
    const activeStoreId = storeId || paramStoreId;
    const [activeTab, setActiveTab] = useState('slides'); // slides, settings, style
    const [expandedSlide, setExpandedSlide] = useState(0); // Index of expanded slide in Slides tab
    const [expandedStyleSlide, setExpandedStyleSlide] = useState(0); // Index of expanded slide in Style tab

    const slides = settings.slides || [];

    const handleUpdate = (updatedSettings) => {
        onUpdate({ ...settings, ...updatedSettings });
    };

    const handleSlideUpdate = (index, key, value) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], [key]: value };
        handleUpdate({ slides: newSlides });
    };

    // Slide Management
    const addSlide = () => {
        const newSlide = {
            id: Date.now(),
            image: '',
            title: 'New Slide',
            subtitle: 'Slide Description',
            buttons: [{ id: Date.now(), text: 'Shop Now', link: '#', variant: 'primary' }],
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
        const folder = activeStoreId ? `${activeStoreId}/slideshow` : 'slideshow';
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage.from('store-assets').upload(filePath, file);
        if (error) {
            console.error('Upload error:', error);
            return;
        }

        const { data } = supabase.storage.from('store-assets').getPublicUrl(filePath);
        handleSlideUpdate(slideIndex, 'image', data.publicUrl);
    };

    // Button Management
    const updateButton = (slideIndex, btnIndex, key, value) => {
        const newSlides = [...slides];
        const buttons = [...(newSlides[slideIndex].buttons || [])];
        buttons[btnIndex] = { ...buttons[btnIndex], [key]: value };
        newSlides[slideIndex].buttons = buttons;
        handleUpdate({ slides: newSlides });
    };

    const addButton = (slideIndex) => {
        const newSlides = [...slides];
        const buttons = [...(newSlides[slideIndex].buttons || [])];
        if (buttons.length >= 3) return;
        buttons.push({ id: Date.now(), text: 'New Button', link: '#', variant: buttons.length === 0 ? 'primary' : 'secondary' });
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
                                            {slide.image ? (
                                                <img src={slide.image} className="w-full h-full object-cover" />
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
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slide Image</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={slide.image || ''}
                                                    onChange={(e) => handleSlideUpdate(index, 'image', e.target.value)}
                                                    className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                    placeholder="https://..."
                                                />
                                                <label className="cursor-pointer p-1.5 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200">
                                                    <Image className="h-4 w-4 text-slate-500" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], index)} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Texts */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Heading</label>
                                                <input
                                                    type="text"
                                                    value={slide.title || ''}
                                                    onChange={(e) => handleSlideUpdate(index, 'title', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subheading</label>
                                                <input
                                                    type="text"
                                                    value={slide.subtitle || ''}
                                                    onChange={(e) => handleSlideUpdate(index, 'subtitle', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* Buttons Manager */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block">Buttons (Max 3)</label>
                                                {(slide.buttons?.length || 0) < 3 && (
                                                    <button onClick={() => addButton(index)} className="text-[10px] font-bold text-indigo-600 hover:underline">+ Add</button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {(slide.buttons || []).map((btn, btnIdx) => (
                                                    <div key={btn.id || btnIdx} className="flex gap-2 items-start bg-slate-50 p-2 rounded border border-slate-100">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Label"
                                                                    value={btn.text}
                                                                    onChange={(e) => updateButton(index, btnIdx, 'text', e.target.value)}
                                                                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                                                />
                                                                <select
                                                                    value={btn.variant}
                                                                    onChange={(e) => updateButton(index, btnIdx, 'variant', e.target.value)}
                                                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-24"
                                                                >
                                                                    <option value="primary">Primary</option>
                                                                    <option value="secondary">Secondary</option>
                                                                    <option value="outline">Outline</option>
                                                                </select>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Link URL"
                                                                value={btn.link}
                                                                onChange={(e) => updateButton(index, btnIdx, 'link', e.target.value)}
                                                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                                            />
                                                        </div>
                                                        <button onClick={() => removeButton(index, btnIdx)} className="p-1 text-slate-400 hover:text-red-500 mt-1">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
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
                        {slides.map((slide, index) => (
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
                                            <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Alignment</h5>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horizontal</label>
                                                    <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                        <button onClick={() => handleSlideUpdate(index, 'hAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${slide.hAlignment === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignLeft className="h-4 w-4" /></button>
                                                        <button onClick={() => handleSlideUpdate(index, 'hAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${!slide.hAlignment || slide.hAlignment === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignCenter className="h-4 w-4" /></button>
                                                        <button onClick={() => handleSlideUpdate(index, 'hAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${slide.hAlignment === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><AlignRight className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vertical</label>
                                                    <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                        <button onClick={() => handleSlideUpdate(index, 'vAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${slide.vAlignment === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><ArrowUp className="h-4 w-4" /></button>
                                                        <button onClick={() => handleSlideUpdate(index, 'vAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${!slide.vAlignment || slide.vAlignment === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Move className="h-4 w-4" /></button>
                                                        <button onClick={() => handleSlideUpdate(index, 'vAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${slide.vAlignment === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><ArrowDown className="h-4 w-4" /></button>
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
                                                    <input type="number" placeholder="48px" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.headingSize || '48')} onChange={(e) => handleSlideUpdate(index, 'headingSize', e.target.value + 'px')} />
                                                    <ColorInput value={slide.headingColor || '#ffffff'} onChange={(v) => handleSlideUpdate(index, 'headingColor', v)} />
                                                </div>
                                                <select
                                                    className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                                                    value={slide.headingFontFamily || 'Inter, sans-serif'}
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
                                                    <input type="number" placeholder="18px" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.subheadingSize || '18')} onChange={(e) => handleSlideUpdate(index, 'subheadingSize', e.target.value + 'px')} />
                                                    <ColorInput value={slide.subheadingColor || '#e2e8f0'} onChange={(v) => handleSlideUpdate(index, 'subheadingColor', v)} />
                                                </div>
                                                <select
                                                    className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                                                    value={slide.subheadingFontFamily || 'Inter, sans-serif'}
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
                                                <ColorInput label="Primary Bg" value={slide.btnBgColor || '#ffffff'} onChange={v => handleSlideUpdate(index, 'btnBgColor', v)} />
                                                <ColorInput label="Primary Text" value={slide.btnTextColor || '#000000'} onChange={v => handleSlideUpdate(index, 'btnTextColor', v)} />
                                                <ColorInput label="Secondary Text" value={slide.secondaryBtnTextColor || '#ffffff'} onChange={v => handleSlideUpdate(index, 'secondaryBtnTextColor', v)} />
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Structure</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <input type="number" placeholder="Pad X" title="Padding X" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.btnPaddingX || '32')} onChange={e => handleSlideUpdate(index, 'btnPaddingX', e.target.value + 'px')} />
                                                        <input type="number" placeholder="Pad Y" title="Padding Y" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.btnPaddingY || '16')} onChange={e => handleSlideUpdate(index, 'btnPaddingY', e.target.value + 'px')} />
                                                        <input type="number" placeholder="Radius" title="Border Radius" className="px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.btnBorderRadius || '99')} onChange={e => handleSlideUpdate(index, 'btnBorderRadius', e.target.value + 'px')} />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Font Size (px)</label>
                                                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.btnFontSize || '16')} onChange={e => handleSlideUpdate(index, 'btnFontSize', e.target.value + 'px')} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Margin Top (px)</label>
                                                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(slide.btnMarginTop || '24')} onChange={e => handleSlideUpdate(index, 'btnMarginTop', e.target.value + 'px')} />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
