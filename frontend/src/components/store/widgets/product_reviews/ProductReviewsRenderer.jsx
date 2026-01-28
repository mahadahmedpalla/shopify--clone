import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
    const [summary, setSummary] = useState({ avg: 0, count: 0 });

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', rating: 5, text: '', orderId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Settings
    const allowVerifiedOnly = style?.allowVerifiedOnly || false;
    const starColor = style?.starColor || '#FACC15'; // Yellow-400
    const buttonColor = style?.buttonColor || '#4F46E5'; // Indigo-600
    const textColor = style?.textColor || '#1F2937'; // Gray-800
    const hideIfEmpty = style?.hideIfEmpty || false;
    const sortOrder = style?.sortOrder || 'newest';

    useEffect(() => {
        if (productId) fetchReviews();
    }, [productId, sortOrder]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('product_reviews')
                .select('*')
                .eq('product_id', productId);

            if (sortOrder === 'highest') query = query.order('rating', { ascending: false });
            else if (sortOrder === 'lowest') query = query.order('rating', { ascending: true });
            else query = query.order('created_at', { ascending: false }); // Newest

            const { data, error } = await query;
            if (error) throw error;

            setReviews(data || []);

            // Calc summary
            if (data && data.length > 0) {
                const total = data.reduce((acc, r) => acc + r.rating, 0);
                setSummary({ avg: total / data.length, count: data.length });
            } else {
                setSummary({ avg: 0, count: 0 });
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (allowVerifiedOnly && !formData.orderId.trim()) {
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
                order_id: allowVerifiedOnly ? formData.orderId : null,
                is_verified: !!formData.orderId // Simple logic for now
            });

            if (error) throw error;

            // Reset and refresh
            setFormData({ name: '', rating: 5, text: '', orderId: '' });
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

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
                        <div className="flex items-center space-x-2">
                            <StarRating rating={Math.round(summary.avg)} color={`text-[${starColor}]`} />
                            <span className="text-sm opacity-80">Based on {summary.count} reviews</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-2 rounded-full font-bold text-white transition-all transform hover:scale-105"
                        style={{ backgroundColor: buttonColor }}
                    >
                        Write a Review
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4">
                        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-bold mb-1">Rating</label>
                                <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${formData.rating >= star ? 'fill-current' : 'text-gray-300'}`}
                                                style={{ color: formData.rating >= star ? starColor : undefined }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {allowVerifiedOnly && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">Order ID <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your Order ID to verify purchase"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.orderId}
                                        onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Required for verification.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-1">Review</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.text}
                                    onChange={e => setFormData({ ...formData, text: e.target.value })}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 rounded-xl font-bold text-white opacity-90 hover:opacity-100 disabled:opacity-50"
                                style={{ backgroundColor: buttonColor }}
                            >
                                {submitting ? 'Submitting...' : 'Post Review'}
                            </button>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center font-bold text-slate-500 uppercase">
                                        {review.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{review.customer_name}</p>
                                        <div className="flex items-center space-x-2">
                                            <StarRating rating={review.rating} size="w-3 h-3" color={`text-[${starColor}]`} />
                                            {review.is_verified && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm pl-13 ml-13">
                                {review.review_text}
                            </p>
                        </div>
                    ))}

                    {reviews.length === 0 && !loading && (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No reviews yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
