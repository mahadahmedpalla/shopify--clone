import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export function ThemeMetadataModal({ isOpen, onClose, onSuccess, developerId, theme = null }) {
    const isEditing = !!theme;
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_credits: 0,
        thumbnail_url: '',
        thumbnail_url: '',
        tags: '',
        built_on_link: '',
    });

    useEffect(() => {
        if (isOpen && theme) {
            setFormData({
                name: theme.name || '',
                description: theme.description || '',
                price_credits: theme.price_credits || 0,
                thumbnail_url: theme.thumbnail_url || '',
                thumbnail_url: theme.thumbnail_url || '',
                tags: theme.tags ? theme.tags.join(', ') : '',
                built_on_link: theme.built_on_link || '',
            });
        } else if (isOpen) {
            // Reset for create mode
            setFormData({
                name: '',
                description: '',
                price_credits: 0,
                thumbnail_url: '',
                tags: '',
                built_on_link: '',
            });
        }
    }, [isOpen, theme]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            // Use 'themes' bucket. Structure: developerId/themeId (if exists) or temp/fileName
            // Since we might not have themeId yet (creation), we can store in developerId/thumbnails/
            const filePath = `${developerId}/thumbnails/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('themes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('themes')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload thumbnail: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!developerId) throw new Error("Developer ID not found.");

            // Parse tags
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            const payload = {
                name: formData.name,
                description: formData.description,
                price_credits: parseInt(formData.price_credits) || 0,
                thumbnail_url: formData.thumbnail_url,
                tags: tagsArray,
                tags: tagsArray,
                built_on_link: formData.built_on_link,
                updated_at: new Date().toISOString(),
            };

            let result;

            if (isEditing) {
                // Update
                result = await supabase
                    .from('themes')
                    .update(payload)
                    .eq('id', theme.id);
            } else {
                // Create
                result = await supabase
                    .from('themes')
                    .insert([{
                        ...payload,
                        developer_id: developerId,
                        status: 'draft',
                    }]);
            }

            if (result.error) throw result.error;

            onSuccess();
        } catch (err) {
            console.error("Theme save error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} type="button" className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start w-full">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {isEditing ? 'Edit Theme Details' : 'Create New Theme'}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-6">
                                    {isEditing ? 'Update your theme information.' : 'Start building a new theme for the marketplace.'}
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Thumbnail Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition-colors">
                                            <div className="space-y-1 text-center">
                                                {formData.thumbnail_url ? (
                                                    <div className="relative">
                                                        <img
                                                            src={formData.thumbnail_url}
                                                            alt="Thumbnail preview"
                                                            className="mx-auto h-32 object-cover rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                                                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {uploading ? (
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                                        ) : (
                                                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        )}
                                                        <div className="flex text-sm text-gray-600 justify-center mt-2">
                                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                                <span>Upload a file</span>
                                                                <input
                                                                    type="file"
                                                                    className="sr-only"
                                                                    accept="image/*"
                                                                    onChange={handleThumbnailUpload}
                                                                    disabled={uploading}
                                                                />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Fallback URL Input */}
                                        <div className="mt-2">
                                            <Input
                                                placeholder="Or enter image URL..."
                                                name="thumbnail_url"
                                                value={formData.thumbnail_url}
                                                onChange={handleChange}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>

                                    <Input
                                        label="Theme Name"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Modern Dark"
                                    />

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Describe your theme features..."
                                        />
                                    </div>

                                    <Input
                                        label="Theme Built On Link (Optional)"
                                        id="built_on_link"
                                        name="built_on_link"
                                        value={formData.built_on_link}
                                        onChange={handleChange}
                                        placeholder="e.g. https://www.figma.com/..."
                                    />

                                    <Input
                                        label="Tags (comma separated)"
                                        id="tags"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        placeholder="e.g. dark, minimalist, fashion"
                                    />

                                    <Input
                                        label="Price (Credits)"
                                        id="price_credits"
                                        name="price_credits"
                                        type="number"
                                        min="0"
                                        value={formData.price_credits}
                                        onChange={handleChange}
                                        required
                                    />

                                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <Button type="submit" className="w-full sm:ml-3 sm:w-auto" isLoading={loading}>
                                            {isEditing ? 'Save Changes' : 'Create Theme'}
                                        </Button>
                                        <Button type="button" variant="secondary" className="mt-3 w-full sm:mt-0 sm:w-auto" onClick={onClose}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
