import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Plus, Paintbrush, Globe, Layout, Edit } from 'lucide-react';
import { CreateThemeModal } from '../components/theme/CreateThemeModal';
import { ThemeAssetsModal } from '../components/theme/ThemeAssetsModal';
import { useNavigate } from 'react-router-dom';

export function ThemeDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [developer, setDeveloper] = useState(null);
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState(null);
    const [mockSettings, setMockSettings] = useState({ enableDiscounts: false, enableRatings: false }); // Mock settings for dashboard too (visual only for now)

    // Registration Form State
    const [regForm, setRegForm] = useState({ developer_name: '', website: '' });
    const [regError, setRegError] = useState(null);
    const [regLoading, setRegLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Check if user is a theme developer
                const { data: devProfile } = await supabase
                    .from('theme_developers')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setDeveloper(devProfile);

                if (devProfile) {
                    // Fetch Themes
                    const { data: themesData } = await supabase
                        .from('themes')
                        .select('*')
                        .eq('developer_id', devProfile.id)
                        .order('updated_at', { ascending: false });
                    setThemes(themesData || []);
                }
            }
        } catch (error) {
            console.error('Error fetching theme data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegLoading(true);
        setRegError(null);

        try {
            const { data, error } = await supabase
                .from('theme_developers')
                .insert([{
                    id: user.id,
                    developer_name: regForm.developer_name,
                    website: regForm.website
                }])
                .select()
                .single();

            if (error) throw error;

            setDeveloper(data);
            setThemes([]); // Initialize empty themes list
        } catch (err) {
            console.error("Registration error:", err);
            setRegError(err.message.includes('unique') ? 'Developer name already taken.' : err.message);
        } finally {
            setRegLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // 1. Unregistered View
    if (!developer) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar user={user} />
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <div className="text-center mb-12">
                        <Paintbrush className="mx-auto h-16 w-16 text-indigo-600" />
                        <h1 className="mt-4 text-3xl font-extrabold text-gray-900">Become a Theme Developer</h1>
                        <p className="mt-2 text-lg text-gray-500">
                            Create stunning themes and sell them to thousands of store owners.
                        </p>
                    </div>

                    <Card className="p-8">
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Developer Profile</h3>
                                <p className="text-sm text-gray-500">This information will be public on your theme listings.</p>
                            </div>

                            <Input
                                label="Developer Name / Brand"
                                value={regForm.developer_name}
                                onChange={(e) => setRegForm({ ...regForm, developer_name: e.target.value })}
                                placeholder="e.g. PixelCrafters"
                                required
                            />

                            <Input
                                label="Website (Optional)"
                                value={regForm.website}
                                onChange={(e) => setRegForm({ ...regForm, website: e.target.value })}
                                placeholder="https://yourportfolio.com"
                                icon={<Globe className="h-4 w-4 text-gray-400" />}
                            />

                            {regError && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">{regError}</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full" isLoading={regLoading}>
                                Register and Start Building
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    // 2. Dashboard View
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Theme Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Welcome back, {developer.developer_name}. Manage your themes here.
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="h-5 w-5 mr-2" />
                            Create Theme
                        </Button>
                    </div>
                </div>

                {/* Themes Grid */}
                {themes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <Layout className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No themes yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Create your first theme to get started.</p>
                        <div className="mt-6">
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="h-5 w-5 mr-2" />
                                Create Theme
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {themes.map((theme) => (
                            <Card
                                key={theme.id}
                                className="hover:shadow-md transition-all group flex flex-col h-full"
                            >
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {theme.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                        {theme.description || "No description provided."}
                                    </p>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <span className="font-medium text-gray-900 mr-2">Price:</span>
                                        {theme.price_credits === 0 ? 'Free' : `${theme.price_credits} Credits`}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="text-xs text-gray-400">
                                        Updated: {new Date(theme.updated_at).toLocaleDateString()}
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedThemeId(theme.id);
                                            setIsAssetsModalOpen(true);
                                        }}
                                        className="mr-2"
                                    >
                                        <div className="flex items-center">
                                            {/* We can use an icon here if desired, e.g. Database or Layers */}
                                            Manage Mock Data
                                        </div>
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/theme-builder/${theme.id}`)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Theme
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <CreateThemeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                developerId={developer?.id}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchData(); // Refresh list
                }}
            />

            <ThemeAssetsModal
                isOpen={isAssetsModalOpen}
                onClose={() => {
                    setIsAssetsModalOpen(false);
                    setSelectedThemeId(null);
                }}
                themeId={selectedThemeId}
                mockSettings={mockSettings}
                onUpdateMockSettings={setMockSettings}
            />
        </div>
    );
}
