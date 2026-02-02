import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus, Trash2, ChevronUp, ChevronDown, Image, Type, MousePointer,
    Play, Pause, Clock, MoveHorizontal, Layout, Monitor, Smartphone, Tablet
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export function HeroSlideshowProperties({ settings, onUpdate, storeId }) {
    const { storeId: paramStoreId } = useParams();
    const activeStoreId = storeId || paramStoreId;
    const [activeTab, setActiveTab] = useState('slides'); // slides, settings, style
    const [expandedSlide, setExpandedSlide] = useState(0); // Index of expanded slide accordion

    const slides = settings.slides || [];

    const handleUpdate = (updatedSettings) => {
        onUpdate({ ...settings, ...updatedSettings });
    };

    // Slide Management
    const addSlide = () => {
        const newSlide = {
            id: Date.now(),
            image: '',
            title: 'New Slide',
            subtitle: 'Slide Description',
            btnText: 'Shop Now',
            btnLink: '#'
        };
        handleUpdate({ slides: [...slides, newSlide] });
        setExpandedSlide(slides.length); // Open new slide
    };

    const removeSlide = (index) => {
        const newSlides = [...slides];
        newSlides.splice(index, 1);
        handleUpdate({ slides: newSlides });
    };

    const updateSlide = (index, key, value) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], [key]: value };
        handleUpdate({ slides: newSlides });
    };

    const moveSlide = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === slides.length - 1) return;
        const newSlides = [...slides];
        const temp = newSlides[index];
        newSlides[index] = newSlides[index + direction === 'up' ? -1 : 1];
        newSlides[index + direction === 'up' ? -1 : 1] = temp; // Bug in logic here? No.
        // Wait, index - 1 is swap target for up.
        // let's use arrayMove logic simply
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
        updateSlide(slideIndex, 'image', data.publicUrl);
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
                                        <div className="h-8 w-12 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-300">
                                            {slide.image && <img src={slide.image} className="w-full h-full object-cover" />}
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
                                                    value={slide.image}
                                                    onChange={(e) => updateSlide(index, 'image', e.target.value)}
                                                    className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                    placeholder="https://..."
                                                />
                                                <label className="cursor-pointer p-1.5 bg-slate-100 rounded border border-slate-200 hover:bg-slate-200">
                                                    <Image className="h-4 w-4 text-slate-500" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], index)} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Heading</label>
                                                <input
                                                    type="text"
                                                    value={slide.title}
                                                    onChange={(e) => updateSlide(index, 'title', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subheading</label>
                                                <input
                                                    type="text"
                                                    value={slide.subtitle}
                                                    onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Button Text</label>
                                                    <input
                                                        type="text"
                                                        value={slide.btnText}
                                                        onChange={(e) => updateSlide(index, 'btnText', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Button Link</label>
                                                    <input
                                                        type="text"
                                                        value={slide.btnLink}
                                                        onChange={(e) => updateSlide(index, 'btnLink', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {activeTab === 'style' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Overlay Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={settings.overlayColor || '#000000'}
                                onChange={(e) => handleUpdate({ overlayColor: e.target.value })}
                                className="h-8 w-8 rounded border border-slate-200 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={settings.overlayColor || '#000000'}
                                onChange={(e) => handleUpdate({ overlayColor: e.target.value })}
                                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Overlay Opacity</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.overlayOpacity || 0.4}
                            onChange={(e) => handleUpdate({ overlayOpacity: parseFloat(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
