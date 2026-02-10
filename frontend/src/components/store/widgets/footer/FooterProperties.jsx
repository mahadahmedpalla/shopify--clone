import React, { useState } from 'react';
import {
    Layout, Grid, Type, PaintBucket, Plus, Trash2, ChevronDown, ChevronUp,
    Link, AlignLeft, AlignCenter, AlignRight, Copy
} from 'lucide-react';
import { ColorInput } from '../Shared';

export function FooterProperties({ settings, onUpdate, viewMode = 'desktop' }) {
    const [activeTab, setActiveTab] = useState('structure'); // structure, layout, style, typography
    const [expandedColumn, setExpandedColumn] = useState(0);

    const columns = settings.columns || [];

    const handleUpdate = (updates) => {
        onUpdate({ ...settings, ...updates });
    };

    // --- Column Management ---
    const addColumn = () => {
        const newCol = {
            id: Date.now(),
            title: 'New Column',
            type: 'text', // text, links, newsletter
            content: 'Add content here...',
            links: [{ text: 'Link 1', url: '#' }, { text: 'Link 2', url: '#' }],
            width: 'auto' // auto, full
        };
        handleUpdate({ columns: [...columns, newCol] });
        setExpandedColumn(columns.length);
    };

    const updateColumn = (index, key, value) => {
        const newCols = [...columns];
        newCols[index] = { ...newCols[index], [key]: value };
        handleUpdate({ columns: newCols });
    };

    const removeColumn = (index) => {
        const newCols = [...columns];
        newCols.splice(index, 1);
        handleUpdate({ columns: newCols });
    };

    const moveColumn = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === columns.length - 1) return;
        const newCols = [...columns];
        const target = direction === 'up' ? index - 1 : index + 1;
        [newCols[index], newCols[target]] = [newCols[target], newCols[index]];
        handleUpdate({ columns: newCols });
        setExpandedColumn(target);
    };

    const addLinkToColumn = (colIndex) => {
        const newCols = [...columns];
        newCols[colIndex].links = [...(newCols[colIndex].links || []), { text: 'New Link', url: '#' }];
        handleUpdate({ columns: newCols });
    };

    const updateLink = (colIndex, linkIndex, key, value) => {
        const newCols = [...columns];
        const newLinks = [...newCols[colIndex].links];
        newLinks[linkIndex] = { ...newLinks[linkIndex], [key]: value };
        newCols[colIndex].links = newLinks;
        handleUpdate({ columns: newCols });
    };

    const removeLink = (colIndex, linkIndex) => {
        const newCols = [...columns];
        newCols[colIndex].links.splice(linkIndex, 1);
        handleUpdate({ columns: newCols });
    };

    // --- Apply To Global ---
    const applyToGlobal = (sourceColIndex) => {
        if (!confirm("Apply styles from this column to ALL columns? This will overwrite local styles.")) return;
        const source = columns[sourceColIndex];
        const newCols = columns.map(col => ({
            ...col,
            alignment: source.alignment,
            padding: source.padding,
            // Add other style properties here to sync
        }));
        handleUpdate({ columns: newCols });
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'structure', label: 'Structure', icon: Grid },
                    { id: 'layout', label: 'Layout', icon: Layout },
                    { id: 'typography', label: 'Text', icon: Type },
                    { id: 'style', label: 'Style', icon: PaintBucket }
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

            {/* STRUCTURE TAB */}
            {activeTab === 'structure' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Columns ({columns.length})</span>
                        <button onClick={addColumn} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex items-center gap-1 text-xs font-bold">
                            <Plus className="h-3 w-3" /> Add Column
                        </button>
                    </div>

                    <div className="space-y-2">
                        {columns.map((col, index) => (
                            <div key={col.id || index} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                                <div
                                    className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                                    onClick={() => setExpandedColumn(expandedColumn === index ? -1 : index)}
                                >
                                    <span className="text-sm font-medium text-slate-700">{col.title || 'Untitled Column'}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); moveColumn(index, 'up'); }} disabled={index === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveColumn(index, 'down'); }} disabled={index === columns.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); removeColumn(index); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                </div>

                                {expandedColumn === index && (
                                    <div className="p-4 space-y-4 border-t border-slate-200">
                                        {/* Basic Props */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={col.title}
                                                    onChange={(e) => updateColumn(index, 'title', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type</label>
                                                <select
                                                    value={col.type}
                                                    onChange={(e) => updateColumn(index, 'type', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                >
                                                    <option value="text">Text / HTML</option>
                                                    <option value="links">Link List</option>
                                                    <option value="newsletter">Newsletter</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Width & Align */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Width</label>
                                                <select
                                                    value={col.width || 'auto'}
                                                    onChange={(e) => updateColumn(index, 'width', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                >
                                                    <option value="auto">Auto (Share space)</option>
                                                    <option value="full">Full Width (New Row)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Align</label>
                                                <div className="flex bg-slate-50 border border-slate-200 rounded">
                                                    {['left', 'center', 'right'].map(align => (
                                                        <button
                                                            key={align}
                                                            onClick={() => updateColumn(index, 'alignment', align)}
                                                            className={`flex-1 p-1 flex justify-center ${col.alignment === align ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                                        >
                                                            {align === 'left' && <AlignLeft className="h-3 w-3" />}
                                                            {align === 'center' && <AlignCenter className="h-3 w-3" />}
                                                            {align === 'right' && <AlignRight className="h-3 w-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Editors */}
                                        {col.type === 'text' && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Text Content</label>
                                                <textarea
                                                    value={col.content}
                                                    onChange={(e) => updateColumn(index, 'content', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs min-h-[80px]"
                                                />
                                            </div>
                                        )}

                                        {col.type === 'links' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block">Links</label>
                                                {(col.links || []).map((link, lIdx) => (
                                                    <div key={lIdx} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Label"
                                                            value={link.text}
                                                            onChange={(e) => updateLink(index, lIdx, 'text', e.target.value)}
                                                            className="w-1/3 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="URL"
                                                            value={link.url}
                                                            onChange={(e) => updateLink(index, lIdx, 'url', e.target.value)}
                                                            className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                                        />
                                                        <button onClick={() => removeLink(index, lIdx)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addLinkToColumn(index)} className="text-xs text-indigo-600 font-bold hover:underline">+ Add Link</button>
                                            </div>
                                        )}

                                        {col.type === 'newsletter' && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description Text</label>
                                                <textarea
                                                    value={col.content}
                                                    onChange={(e) => updateColumn(index, 'content', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                                    placeholder="Subscribe to our news..."
                                                />
                                            </div>
                                        )}

                                        {/* Action: Apply To Global */}
                                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                                            <button
                                                onClick={() => applyToGlobal(index)}
                                                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                                title="Copy this column's style (Padding/Align) to all other columns"
                                            >
                                                <Copy className="h-3 w-3" /> Apply Style to All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LAYOUT TAB */}
            {activeTab === 'layout' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cols Per Row</label>
                            <input
                                type="number"
                                min="1" max="6"
                                value={settings.columnsPerRow || 4}
                                onChange={(e) => handleUpdate({ columnsPerRow: parseInt(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mobile Type</label>
                            <select
                                value={settings.mobileLayout || 'accordion'}
                                onChange={(e) => handleUpdate({ mobileLayout: e.target.value })}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                            >
                                <option value="accordion">Accordion</option>
                                <option value="stack">Stack (Open)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Col Gap (px)</label>
                            <input
                                type="number"
                                value={settings.columnGap || 32}
                                onChange={(e) => handleUpdate({ columnGap: parseInt(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Row Gap (px)</label>
                            <input
                                type="number"
                                value={settings.rowGap || 32}
                                onChange={(e) => handleUpdate({ rowGap: parseInt(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Width</label>
                        <input
                            type="text"
                            placeholder="1280px"
                            value={settings.maxWidth || '1280px'}
                            onChange={(e) => handleUpdate({ maxWidth: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                        />
                    </div>
                </div>
            )}

            {/* STYLE TAB */}
            {activeTab === 'style' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Background</label>
                        <ColorInput value={settings.backgroundColor || '#f8fafc'} onChange={(v) => handleUpdate({ backgroundColor: v })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Padding Y</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Top (64px)" value={settings.paddingTop || ''} onChange={(e) => handleUpdate({ paddingTop: e.target.value })} className="px-2 py-1 bg-slate-50 border rounded text-xs" />
                            <input type="text" placeholder="Bottom (64px)" value={settings.paddingBottom || ''} onChange={(e) => handleUpdate({ paddingBottom: e.target.value })} className="px-2 py-1 bg-slate-50 border rounded text-xs" />
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input type="checkbox" checked={settings.borderTop || false} onChange={(e) => handleUpdate({ borderTop: e.target.checked })} />
                            Show Top Border
                        </label>
                        {settings.borderTop && (
                            <div className="mt-2">
                                <ColorInput label="Border Color" value={settings.borderColor || '#e2e8f0'} onChange={(v) => handleUpdate({ borderColor: v })} />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input type="checkbox" checked={settings.showCopyright || false} onChange={(e) => handleUpdate({ showCopyright: e.target.checked })} />
                            Show Copyright Bar
                        </label>
                        {settings.showCopyright && (
                            <input
                                type="text"
                                placeholder="Store Name"
                                value={settings.storeName || ''}
                                onChange={(e) => handleUpdate({ storeName: e.target.value })}
                                className="mt-2 w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">Headings</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorInput label="Color" value={settings.headingColor || '#1e293b'} onChange={(v) => handleUpdate({ headingColor: v })} />
                            <input type="text" placeholder="Size (16px)" value={settings.headingSize || ''} onChange={(e) => handleUpdate({ headingSize: e.target.value })} className="px-2 py-1 bg-slate-50 border rounded text-xs" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">Text</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorInput label="Color" value={settings.textColor || '#64748b'} onChange={(v) => handleUpdate({ textColor: v })} />
                            <input type="text" placeholder="Size (14px)" value={settings.textSize || ''} onChange={(e) => handleUpdate({ textSize: e.target.value })} className="px-2 py-1 bg-slate-50 border rounded text-xs" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">Links</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorInput label="Color" value={settings.linkColor || '#64748b'} onChange={(v) => handleUpdate({ linkColor: v })} />
                            <ColorInput label="Hover Color" value={settings.linkHoverColor || '#4f46e5'} onChange={(v) => handleUpdate({ linkHoverColor: v })} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
