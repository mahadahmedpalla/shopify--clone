import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function NotificationsModal({ isOpen, onClose, userId }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // 1. Fetch relevant notifications
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('store_owner_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);

            // 2. Mark unread as read (Side Effect)
            const unreadIds = (data || []).filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
                await supabase.rpc('mark_notifications_read', {
                    p_notification_ids: unreadIds
                });
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto -mx-2 px-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Bell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 rounded-xl border transition-all ${!notif.is_read ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5 flex-shrink-0">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-bold ${!notif.is_read ? 'text-indigo-900' : 'text-slate-900'}`}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 flex items-center flex-shrink-0 ml-2">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDate(notif.created_at)}
                                        </span>
                                    </div>
                                    <p className={`mt-1 text-sm ${!notif.is_read ? 'text-indigo-800' : 'text-slate-600'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                    onClick={onClose}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
}
