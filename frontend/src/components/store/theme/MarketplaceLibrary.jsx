import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Modal } from '../../ui/Modal';
import { Layout, Check, Trash2, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeApplyModal } from './ThemeApplyModal';
import { renderFormattedText } from '../../../utils/formatText';

export function MarketplaceLibrary({ storeId }) {
    const navigate = useNavigate();
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState(null); // For apply modal
    const [selectedDescriptionTheme, setSelectedDescriptionTheme] = useState(null); // For description modal
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    useEffect(() => {
        fetchLibrary();
    }, [storeId]);

    const fetchLibrary = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('store_themes')
                .select(`
                    id,
                    is_active,
                    theme:themes (
                        id,
                        name,
                        description,
                        thumbnail_url,
                        tags,
                        status,
                        developer:theme_developers(developer_name)
                    )
                `)
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setThemes(data || []);
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyClick = (themeItem) => {
        setSelectedTheme(themeItem);
        setIsApplyModalOpen(true);
    };

    const handleRemove = async (id) => {
        if (!confirm('Are you sure you want to remove this theme from your library?')) return;

        const { error } = await supabase
            .from('store_themes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error removing theme:', error);
            alert('Failed to remove theme');
        } else {
            fetchLibrary();
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading library...</div>;

    if (themes.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Layout className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-500 font-medium">Your library is empty</h3>
                <p className="text-slate-400 text-sm mb-4">Browse the marketplace to find themes.</p>
                <Button onClick={() => navigate('/store/themes')}>
                    Browse Themes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(item => {
                    const isDraft = item.theme?.status === 'draft';
                    return (
                        <Card key={item.id} className={`overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200 ${isDraft ? 'opacity-75' : ''}`}>
                            <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center text-slate-300">
                                {item.theme?.thumbnail_url ? (
                                    <img
                                        src={item.theme.thumbnail_url}
                                        alt={item.theme.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Layout className="h-12 w-12 opacity-50" />
                                )}
                                {item.is_active && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                                        <Check className="h-3 w-3 mr-1" />
                                        Active
                                    </div>
                                )}
                                {isDraft && (
                                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                        DRAFT
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800">{item.theme?.name || 'Unknown Theme'}</h3>
                                <p className="text-xs text-slate-500 mb-2">by {item.theme?.developer?.developer_name || 'Unknown'}</p>
                                <div className="mb-3">
                                    <p className="text-xs text-slate-500 line-clamp-2 h-8 whitespace-pre-wrap">{renderFormattedText(item.theme?.description || 'No description available.')}</p>
                                    {(item.theme?.description && item.theme.description.length > 100) && (
                                        <button
                                            onClick={() => setSelectedDescriptionTheme(item.theme)}
                                            className="inline-flex items-center text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors mt-1"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Read full description
                                        </button>
                                    )}
                                </div>

                                {/* Tags */}
                                {item.theme?.tags && item.theme.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                                        {item.theme.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex space-x-2">
                                    <Button
                                        className="flex-1"
                                        variant={item.is_active ? "secondary" : "primary"}
                                        onClick={() => handleApplyClick(item)}
                                        disabled={item.is_active || isDraft}
                                        title={isDraft ? "Draft themes cannot be applied to store" : ""}
                                    >
                                        {item.is_active ? 'Reapply Theme' : 'Apply Theme'}
                                    </Button>
                                    {!item.is_active && (
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Remove from library"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {selectedTheme && (
                <ThemeApplyModal
                    isOpen={isApplyModalOpen}
                    onClose={() => {
                        setIsApplyModalOpen(false);
                        setSelectedTheme(null);
                    }}
                    theme={selectedTheme}
                    storeId={storeId}
                    onSuccess={() => {
                        setIsApplyModalOpen(false);
                        fetchLibrary();
                        // Optionally navigate to customize dashboard
                    }}
                />
            )}

            {/* Description Modal */}
            <Modal
                isOpen={!!selectedDescriptionTheme}
                onClose={() => setSelectedDescriptionTheme(null)}
                title={selectedDescriptionTheme?.name || 'Theme Details'}
            >
                <div className="space-y-4">
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {renderFormattedText(selectedDescriptionTheme?.description || '')}
                        </p>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setSelectedDescriptionTheme(null)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
