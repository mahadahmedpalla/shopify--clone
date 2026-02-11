import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquare, Filter, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

// Helper to render stars
const StarRating = ({ rating, max = 5, size = "w-4 h-4", color = "text-yellow-400", fill = true }) => {
    return (
        <div className="flex">
            {[...Array(max)].map((_, i) => (
                <Star
                    key={i}
                    className={`${size} ${i < rating ? `${color} ${fill ? 'fill-current' : ''}` : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
};

export const ProductReviewsRenderer = ({ style, content, productId, storeId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    const [filterRating, setFilterRating] = useState(null); // null = all

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', rating: 5, text: '', orderId: '', media: [] });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Settings
    const allowVerifiedOnly = style?.allowVerifiedOnly || false;
    const allowMedia = style?.allowMedia || false;
    const layoutMode = style?.layoutMode || 'simple'; // 'simple' | 'chart'

    // Design Settings
    const starColor = style?.starColor || '#FACC15';
    const buttonColor = style?.buttonColor || '#4F46E5';
    const textColor = style?.textColor || '#1F2937';
    const hideIfEmpty = style?.hideIfEmpty || false;
    const sortOrder = style?.sortOrder || 'newest';

    // Pagination Settings
    const enablePagination = style?.enablePagination || false;
    const reviewsPerPage = style?.reviewsPerPage || 6;

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (productId) fetchReviews();
        setCurrentPage(1); // Reset page on filter/sort change
    }, [productId, sortOrder, filterRating]);

    // PAGINATION LOGIC
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);
    const displayReviews = enablePagination
        ? reviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage)
        : reviews;

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('product_reviews')
                .select('*')
                .eq('product_id', productId);

            if (filterRating) {
                query = query.eq('rating', filterRating);
            }

            if (sortOrder === 'highest') query = query.order('rating', { ascending: false });
            else if (sortOrder === 'lowest') query = query.order('rating', { ascending: true });
            else query = query.order('created_at', { ascending: false }); // Newest

            const { data, error } = await query;
            if (error) throw error;

            setReviews(data || []);

            // Recalculate summary 
            if (data && data.length > 0) {
                const total = data.reduce((acc, r) => acc + r.rating, 0);
                const distinct = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                data.forEach(r => { if (distinct[r.rating] !== undefined) distinct[r.rating]++ });

                setSummary({
                    avg: (data.length > 0 ? (total / data.length) : 0),
                    count: data.length,
                    distribution: distinct
                });
            } else {
                setSummary({ avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const newMediaUrls = [];

            for (const file of files) {
                // Validate size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`File ${file.name} is too large (max 5MB)`);
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${productId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('review-media')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('review-media')
                    .getPublicUrl(filePath);

                newMediaUrls.push(publicUrl);
            }

            setFormData(prev => ({ ...prev, media: [...prev.media, ...newMediaUrls] }));

        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message || "Failed to upload media");
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const removeMedia = (index) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // LOGIC FIX: Enforce Order ID
        if (allowVerifiedOnly && (!formData.orderId || !formData.orderId.trim())) {
            setError("Order ID is required for verification.");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('product_reviews').insert({
                store_id: storeId,
                product_id: productId,
                customer_name: formData.name,
                rating: formData.rating,
                review_text: formData.text,
                order_id: (allowVerifiedOnly || formData.orderId) ? formData.orderId : null,
                is_verified: !!formData.orderId,
                media_urls: formData.media
            });

            if (error) throw error;

            setFormData({ name: '', rating: 5, text: '', orderId: '', media: [] });
            setShowForm(false);
            fetchReviews();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (hideIfEmpty && reviews.length === 0 && !loading) return null;

    return (
        <div className="w-full py-12" style={{ color: textColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-10 gap-8">

                    {/* Left: Score */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>

                        <div className="flex items-center space-x-4 mb-6">
                            <span className="text-5xl font-bold">{summary.avg.toFixed(1)}</span>
                            <div>
                                <StarRating rating={Math.round(summary.avg)} size="w-5 h-5" color={`text-[${starColor}]`} />
                                <p className="text-sm opacity-60 mt-1">{summary.count} Reviews</p>
                            </div>
                        </div>

                        {/* Chart Mode */}
                        {layoutMode === 'chart' && (
                            <div className="space-y-2 max-w-sm">
                                {[5, 4, 3, 2, 1].map(stars => {
                                    const count = summary.distribution[stars] || 0;
                                    const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
                                    return (
                                        <button
                                            key={stars}
                                            onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                                            className="group flex items-center w-full text-xs hover:bg-slate-50 p-1 rounded transition-colors"
                                        >
                                            <div className="w-12 font-medium flex items-center space-x-1">
                                                <span>{stars}</span> <Star className="w-3 h-3 text-slate-300" />
                                            </div>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-3">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%`, backgroundColor: starColor }}
                                                />
                                            </div>
                                            <div className={`w-8 text-right opacity-60 ${filterRating === stars ? 'text-indigo-600 font-bold' : ''}`}>
                                                {count}
                                            </div>
                                        </button>
                                    );
                                })}
                                {filterRating && (
                                    <button onClick={() => setFilterRating(null)} className="text-xs text-indigo-600 hover:underline mt-2 flex items-center">
                                        <X className="w-3 h-3 mr-1" /> Clear Filter
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end space-y-4">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-8 py-3 rounded-full font-bold text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
                            style={{ backgroundColor: buttonColor }}
                        >
                            Write a Review
                        </button>

                        {/* Filter Dropdown if simple mode */}
                        {layoutMode === 'simple' && (
                            <div className="flex items-center space-x-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <Filter className="w-4 h-4 text-slate-400 ml-2" />
                                <select
                                    value={filterRating || ''}
                                    onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                                    className="bg-transparent border-0 text-sm focus:ring-0 text-slate-600"
                                >
                                    <option value="">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="mb-12 bg-slate-50 p-8 rounded-3xl border border-slate-100 animate-in slide-in-from-top-4 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Write your review</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-bold mb-2">Rating</label>
                                <div className="flex space-x-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${formData.rating >= star ? 'fill-current' : 'text-slate-300'}`}
                                                style={{ color: formData.rating >= star ? starColor : undefined }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {allowVerifiedOnly && (
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Order ID <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="#1001"
                                            value={formData.orderId}
                                            onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Required for verification.</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Review</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    placeholder="Share your experience..."
                                    value={formData.text}
                                    onChange={e => setFormData({ ...formData, text: e.target.value })}
                                />
                            </div>

                            {allowMedia && (
                                <div>
                                    <label className="block text-sm font-bold mb-2">Add Photos/Video</label>

                                    {/* PREVIEW AREA */}
                                    {formData.media.length > 0 && (
                                        <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                                            {formData.media.map((url, idx) => (
                                                <div key={idx} className="relative group shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={url} alt="Review" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedia(idx)}
                                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <label className={`border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-slate-100 transition-colors cursor-pointer group flex flex-col items-center justify-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            disabled={uploading}
                                        />
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                        ) : (
                                            <ImageIcon className="w-8 h-8 mx-auto text-slate-300 group-hover:text-indigo-500 mb-2" />
                                        )}
                                        <p className="text-sm text-slate-500 group-hover:text-indigo-600 font-medium">
                                            {uploading ? 'Uploading...' : 'Click to upload images'}
                                        </p>
                                    </label>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg flex items-center">
                                    <span className="mr-2">⚠️</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || uploading}
                                className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: buttonColor }}
                            >
                                {submitting ? 'Submitting...' : 'Post Review'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Reviews List */}
                <div className="space-y-8">
                    {displayReviews.map(review => (
                        <div key={review.id} className="group border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg text-white shadow-md uppercase"
                                        style={{ backgroundColor: buttonColor }} // Use brand color for avatar bg
                                    >
                                        {review.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{review.customer_name}</p>
                                        <div className="flex items-center space-x-3 mt-0.5">
                                            <StarRating rating={review.rating} size="w-3.5 h-3.5" color={`text-[${starColor}]`} />
                                            {review.is_verified && (
                                                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center uppercase tracking-wide">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Verified Purchase
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="pl-16">
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {review.review_text}
                                </p>

                                {review.media_urls && review.media_urls.length > 0 && (
                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        {review.media_urls.map((url, idx) => (
                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block h-20 w-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                                                <img src={url} alt="Review media" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {reviews.length === 0 && !loading && (
                        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <MessageSquare className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="font-bold text-slate-900">No reviews yet</h3>
                            <p className="text-sm text-slate-500 mt-1">Be the first to share your thoughts!</p>
                        </div>
                    )}

                    {/* PAGINATION CONTROLS */}
                    {enablePagination && totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-4 pt-8">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-slate-500">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
