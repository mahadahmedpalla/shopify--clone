
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import {
    X,
    Save,
    Eye,
    Smartphone,
    Monitor,
    Tablet,
    Plus,
    Settings2,
    Layers,
    ChevronLeft,
    Type,
    Image as ImageIcon,
    Layout,
    Box,
    Play,
    Undo2,
    Redo2,
    ChevronRight,
    Search
} from 'lucide-react';

const WIDGET_CATEGORIES = [
    {
        name: 'Basic',
        widgets: [
            { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text Block' },
            { type: 'heading', icon: <Type className="h-5 w-5" />, label: 'Heading' },
            { type: 'image', icon: <ImageIcon className="h-4 w-4" />, label: 'Image' },
            { type: 'button', icon: <Play className="h-4 w-4" />, label: 'Button' },
        ]
    },
    {
        name: 'Layout',
        widgets: [
            { type: 'section', icon: <Layout className="h-4 w-4" />, label: 'Section' },
            { type: 'grid', icon: <Layout className="h-4 w-4" />, label: 'Grid' },
            { type: 'spacer', icon: <Box className="h-4 w-4" />, label: 'Spacer' },
            { type: 'divider', icon: <Box className="h-4 w-4" />, label: 'Divider' },
        ]
    },
    {
        name: 'Shopify Core',
        widgets: [
            { type: 'product_grid', icon: <ShoppingBag className="h-4 w-4" />, label: 'Product List' },
            { type: 'featured_collection', icon: <ShoppingBag className="h-4 w-4" />, label: 'Featured Set' },
            { type: 'cart_btn', icon: <ShoppingCart className="h-4 w-4" />, label: 'Floating Cart' },
        ]
    }
];

export function StoreBuilder() {
    const { storeId, pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
    const [activeTab, setActiveTab] = useState('widgets'); // widgets, layers, settings
    const [canvasContent, setCanvasContent] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);

    useEffect(() => {
        fetchPage();
    }, [pageId]);

    const fetchPage = async () => {
        const { data, error } = await supabase
            .from('store_pages')
            .select('*')
            .eq('id', pageId)
            .single();

        if (error) {
            console.error('Builder fetch error:', error);
            navigate(`/store/${storeId}/customize`);
        } else {
            setPage(data);
            setCanvasContent(data.content || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('store_pages')
            .update({ content: canvasContent })
            .eq('id', pageId);

        if (error) alert('Failed to save: ' + error.message);
        else console.log('Saved successfully');
        setLoading(false);
    };

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Engine...</p>
        </div>
    );

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans select-none">
            {/* Top Bar */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/store/${storeId}/customize`)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-slate-800" />
                    <div>
                        <h1 className="text-sm font-bold text-white leading-tight">{page?.name}</h1>
                        <p className="text-[10px] text-slate-500 font-medium">/{page?.slug}</p>
                    </div>
                </div>

                <div className="flex items-center bg-slate-800/50 rounded-lg p-1 space-x-1">
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Monitor className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('tablet')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Tablet className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Smartphone className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-slate-500 mr-4">
                        <button className="p-1.5 hover:text-white transition-colors"><Undo2 className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:text-white transition-colors"><Redo2 className="h-4 w-4" /></button>
                    </div>
                    <Button variant="secondary" size="sm" className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                    <Button size="sm" onClick={handleSave} isLoading={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Publish
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Widgets */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search elements..."
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                        {WIDGET_CATEGORIES.map(cat => (
                            <div key={cat.name} className="space-y-3">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{cat.name}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {cat.widgets.map(w => (
                                        <div
                                            key={w.type}
                                            className="group p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10 transition-all"
                                        >
                                            <div className="p-3 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {w.icon}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">{w.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                        <button className="flex flex-col items-center p-2 rounded-xl text-indigo-600 bg-indigo-50">
                            <Plus className="h-5 w-5" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Add</span>
                        </button>
                        <button className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                            <Layers className="h-5 w-5" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Layers</span>
                        </button>
                        <button className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                            <Settings2 className="h-5 w-5" />
                            <span className="text-[8px] font-bold mt-1 uppercase">Styles</span>
                        </button>
                    </div>
                </aside>

                {/* Canvas Area */}
                <main className="flex-1 bg-slate-100 p-8 overflow-y-auto relative flex justify-center">
                    <div
                        className={`bg-white shadow-2xl transition-all duration-500 border border-slate-200 overflow-hidden relative
                            ${viewMode === 'desktop' ? 'w-full' : ''}
                            ${viewMode === 'tablet' ? 'w-[768px]' : ''}
                            ${viewMode === 'mobile' ? 'w-[375px]' : ''}
                        `}
                        style={{ minHeight: '100%' }}
                    >
                        {/* Canvas Content */}
                        {canvasContent.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <Layout className="h-12 w-12 text-slate-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-2">Build your masterpiece</h2>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">Drag and drop elements from the sidebar to start designing your **{page?.name}**.</p>
                                </div>
                                <Button variant="secondary" className="border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                                    Browse Templates
                                </Button>
                            </div>
                        ) : (
                            <div className="p-8">
                                {/* Elements will be rendered here */}
                            </div>
                        )}
                    </div>

                    {/* Quick Info Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800/90 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest flex items-center space-x-4 shadow-2xl z-40 border border-slate-700">
                        <span className="text-indigo-400">{viewMode} VIEW</span>
                        <div className="w-1 h-3 bg-slate-600 rounded-full" />
                        <span>{canvasContent.length} ELEMENTS</span>
                    </div>
                </main>

                {/* Right Sidebar - Properties */}
                <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Properties</h2>
                        <button className="text-slate-400"><X className="h-4 w-4" /></button>
                    </div>
                    {selectedElement ? (
                        <div className="p-4 overflow-y-auto">
                            {/* Property Editor for selected widget */}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <Settings2 className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Select an element <br /> on the canvas <br /> to edit its style
                            </p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

const ShoppingBag = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
);

const ShoppingCart = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);
