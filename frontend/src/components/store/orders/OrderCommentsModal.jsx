import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { X, Send, Lock, Globe, MessageSquare, User, Loader2 } from 'lucide-react';

export function OrderCommentsModal({ order, isOpen, onClose }) {
    if (!isOpen || !order) return null;

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const commentsEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && order) {
            fetchComments();
        }
    }, [isOpen, order]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('order_comments')
                .select('*')
                .eq('order_id', order.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
            scrollToBottom();
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('order_comments')
                .insert({
                    store_id: order.store_id,
                    order_id: order.id,
                    message: newMessage.trim(),
                    is_customer_visible: isPublic,
                    author_role: 'owner'
                });

            if (error) throw error;

            setNewMessage('');
            setIsPublic(false); // Reset to internal by default
            fetchComments(); // Refresh list
        } catch (err) {
            console.error("Error sending comment:", err);
            alert("Failed to send comment");
        } finally {
            setSending(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            Order Comments
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No comments yet.</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className={`flex flex-col ${comment.author_role === 'owner' ? 'items-end' : 'items-start'}`}>
                                <div className={`relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${comment.author_role === 'owner'
                                        ? 'bg-white border border-slate-200 rounded-tr-sm'
                                        : 'bg-indigo-50 border border-indigo-100 rounded-tl-sm'
                                    }`}>
                                    {/* Header Badge */}
                                    <div className="flex items-center gap-2 mb-1 text-[10px] font-bold tracking-wider uppercase opacity-70">
                                        {comment.is_customer_visible ? (
                                            <span className="flex items-center gap-1 text-indigo-600">
                                                <Globe className="w-3 h-3" /> Public
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Lock className="w-3 h-3" /> Internal
                                            </span>
                                        )}
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-400">
                                            {new Date(comment.created_at).toLocaleString([], {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    {/* Message */}
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {comment.message}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
                    <div className="flex flex-col gap-3">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a comment..."
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none min-h-[80px]"
                            disabled={sending}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${isPublic ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isPublic ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="hidden"
                                />
                                <span className={`text-xs font-medium transition-colors ${isPublic ? 'text-indigo-700' : 'text-slate-500'}`}>
                                    {isPublic ? 'Visible to Customer' : 'Internal Note Only'}
                                </span>
                            </label>

                            <button
                                onClick={handleSend}
                                disabled={!newMessage.trim() || sending}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all active:scale-95 shadow-sm hover:shadow"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        , document.body);
}
