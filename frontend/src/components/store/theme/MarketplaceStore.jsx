import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Search, ShoppingBag, Download, Globe, Check } from 'lucide-react';

export function MarketplaceStore({ storeId }) {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(null);

    useEffect(() => {
        fetchThemes();
    }, []);

    const fetchThemes = async () => {
        setLoading(true);
        // Fetch published themes
        const { data, error } = await supabase
            .from('themes')
            .select('*, theme_developers(developer_name)')
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching themes:', error);
        else setThemes(data || []);
        setLoading(false);
    };

    const handleInstall = async (theme) => {
        setInstalling(theme.id);

        // Check if already installed
        const { data: existing } = await supabase
            .from('store_themes')
            .select('id')
            .eq('store_id', storeId)
            .eq('theme_id', theme.id)
            .single();

        if (existing) {
            alert('Theme already in library!');
            setInstalling(null);
            return;
        }

        // Install (Insert into store_themes)
        const { error } = await supabase
            .from('store_themes')
            .insert({
                store_id: storeId,
                theme_id: theme.id,
                is_active: false,
                settings: {}
            });

        if (error) {
            alert('Failed to install theme: ' + error.message);
        } else {
            alert('Theme added to your library! 📚');
        }
        setInstalling(null);
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading themes...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search themes..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex space-x-2">
                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                        <option>All Categories</option>
                        <option>Fashion</option>
                        <option>Electronics</option>
                    </select>
                    <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                        <option>Most Popular</option>
                        <option>Newest</option>
                        <option>Price: Low to High</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(theme => (
                    <Card key={theme.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200">
                        <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center text-slate-300">
                            {theme.thumbnail_url ? (
                                <img
                                    src={theme.thumbnail_url}
                                    alt={theme.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                    <Globe className="h-12 w-12 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button size="sm" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
                                    Preview
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-800">{theme.name}</h3>
                                    <p className="text-xs text-slate-500">by {theme.theme_developers?.developer_name || 'Unknown'}</p>
                                </div>
                                <div className="text-sm font-bold text-indigo-600">
                                    {theme.price_credits > 0 ? `${theme.price_credits} Credits` : 'Free'}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">{theme.description || 'No description available.'}</p>

                            {/* Tags */}
                            {theme.tags && theme.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                                    {theme.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                    {theme.tags.length > 3 && (
                                        <span className="text-[10px] text-slate-400 px-1">+{theme.tags.length - 3}</span>
                                    )}
                                </div>
                            )}

                            <Button
                                className="w-full"
                                onClick={() => handleInstall(theme)}
                                isLoading={installing === theme.id}
                                disabled={installing === theme.id}
                            >
                                {installing === theme.id ? 'Adding...' : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        add to library
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {themes.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-500 font-medium">No themes found</h3>
                    <p className="text-slate-400 text-sm">Be the first to publish a theme!</p>
                </div>
            )}
        </div>
    );
}
