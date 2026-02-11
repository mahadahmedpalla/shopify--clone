import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Layout, Check, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeApplyModal } from './ThemeApplyModal';

export function MarketplaceLibrary({ storeId }) {
    const navigate = useNavigate();
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState(null); // For apply modal

    useEffect(() => {
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        setLoading(true);
        // Fetch themes installed by this store
        const { data, error } = await supabase
            .from('store_themes')
            .select(`
                id,
                is_active,
                theme:themes (
                    id,
                    name,
                    description,
                    developer:theme_developers (developer_name)
                )
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching library:', error);
        else setThemes(data || []);
        setLoading(false);
    };

    const handleActivate = async (storeThemeId) => {
        // Deactivate all others
        await supabase
            .from('store_themes')
            .update({ is_active: false })
            .eq('store_id', storeId);

        // Activate selected
        const { error } = await supabase
            .from('store_themes')
            .update({ is_active: true })
            .eq('id', storeThemeId);

        if (error) alert('Failed to activate theme');
        else fetchLibrary();
    };

    const handleApplyClick = (themeItem) => {
        setSelectedTheme(themeItem);
    };

    const handleRemove = async (id) => {
        if (!confirm('Remove this theme from your library?')) return;

        const { error } = await supabase
            .from('store_themes')
            .delete()
            .eq('id', id);

        if (error) alert('Failed to remove theme');
        else fetchLibrary();
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading library...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(item => (
                    <Card key={item.id} className={`overflow-hidden border-2 transition-all ${item.is_active ? 'border-indigo-500 shadow-md bg-indigo-50/10' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-300 relative">
                            <Layout className="h-12 w-12 opacity-50" />
                            {item.is_active && (
                                <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                                    <Check className="h-3 w-3 mr-1" />
                                    ACTIVE
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-slate-800">{item.theme.name}</h3>
                            <p className="text-xs text-slate-500 mb-4">by {item.theme.developer?.developer_name || 'Unknown'}</p>

                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant={item.is_active ? "secondary" : "primary"}
                                    onClick={() => handleApplyClick(item)}
                                    className="flex-1"
                                >
                                    {item.is_active ? 'Reapply Theme' : 'Apply Theme'}
                                </Button>
                                {/* Future: Add Customize Button 
                                <Button size="sm" variant="secondary" className="px-3" title="Customize">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                */}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-3 text-red-500 hover:bg-red-50 border-slate-200"
                                    onClick={() => handleRemove(item.id)}
                                    title="Remove"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {themes.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Layout className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-500 font-medium">Library is empty</h3>
                    <p className="text-slate-400 text-sm mb-4">Visit the Store tab to browse themes.</p>
                </div>
            )}

            <ThemeApplyModal
                isOpen={!!selectedTheme}
                onClose={() => setSelectedTheme(null)}
                theme={selectedTheme}
                storeId={storeId}
                onSuccess={() => {
                    fetchLibrary();
                    // Optionally navigate to customize dashboard
                }}
            />
        </div>
    );
}
