import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bell, Send, Users, UserCheck, AlertCircle, Info, History, RotateCw, CheckSquare, Square } from 'lucide-react';

export function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState('compose'); // 'compose' or 'history'

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('all'); // 'all' or 'specific'
    const [targetIds, setTargetIds] = useState('');

    // Resend Logic State
    const [excludeBroadcastId, setExcludeBroadcastId] = useState(null);
    const [excludeChecked, setExcludeChecked] = useState(true);

    // Request State
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

    // History State
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('admin_broadcasts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleResend = (broadcast) => {
        setTitle(broadcast.title);
        setMessage(broadcast.message);
        setTargetType(broadcast.target_type);
        setTargetIds(broadcast.target_ids_snapshot ? broadcast.target_ids_snapshot.join(', ') : '');

        // Setup exclusion logic
        setExcludeBroadcastId(broadcast.id);
        setExcludeChecked(true);

        setActiveTab('compose');
        setStatus({ type: 'info', msg: 'Draft restored from history. Review before sending.' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            // Parse IDs if specific
            let parsedIds = null;
            if (targetType === 'specific') {
                parsedIds = targetIds.split(',').map(id => id.trim()).filter(Boolean);
                if (parsedIds.length === 0) throw new Error('Please enter at least one Store Owner ID');
            }

            const { data, error } = await supabase.rpc('send_admin_notification', {
                p_title: title,
                p_message_template: message,
                p_target_type: targetType,
                p_target_ids: parsedIds,
                p_exclude_broadcast_id: (excludeBroadcastId && excludeChecked) ? excludeBroadcastId : null
            });

            if (error) throw error;

            setStatus({ type: 'success', msg: `Successfully sent to ${data.count} users.` });

            // Reset form completely
            setTitle('');
            setMessage('');
            setTargetIds('');
            setExcludeBroadcastId(null);
            setExcludeChecked(true);
        } catch (err) {
            console.error('Error sending notification:', err);
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications Center</h1>
                    <p className="text-slate-500">Send announcements and updates to store owners.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'compose' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Compose
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'compose' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <form onSubmit={handleSend} className="space-y-6">
                                {status && (
                                    <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' :
                                            status.type === 'error' ? 'bg-red-50 text-red-700' :
                                                'bg-blue-50 text-blue-700'
                                        }`}>
                                        {status.type === 'success' ? <UserCheck className="w-5 h-5 mt-0.5" /> :
                                            status.type === 'error' ? <AlertCircle className="w-5 h-5 mt-0.5" /> :
                                                <Info className="w-5 h-5 mt-0.5" />}
                                        <div>
                                            <p className="font-bold capitalize">{status.type}</p>
                                            <p className="text-sm">{status.msg}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Notification Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. System Maintenance Update"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Message Content
                                        <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-normal">Supports {'{name}'} placeholder</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={5}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Hello {name}, we are updating our servers..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                                        <div className="flex gap-4">
                                            <label className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${targetType === 'all' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <input type="radio" className="hidden" checked={targetType === 'all'} onChange={() => setTargetType('all')} />
                                                <Users className="w-5 h-5 mr-2" />
                                                <span className="font-medium">All Stores</span>
                                            </label>
                                            <label className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${targetType === 'specific' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <input type="radio" className="hidden" checked={targetType === 'specific'} onChange={() => setTargetType('specific')} />
                                                <UserCheck className="w-5 h-5 mr-2" />
                                                <span className="font-medium">Specific IDs</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {targetType === 'specific' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Store Owner IDs (Comma Separated)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder="uuid-1, uuid-2, uuid-3"
                                            value={targetIds}
                                            onChange={e => setTargetIds(e.target.value)}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Found in store_owners table.</p>
                                    </div>
                                )}

                                {/* Exclusion Checkbox for Resend */}
                                {excludeBroadcastId && (
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-start space-x-3 animate-in fade-in">
                                        <button
                                            type="button"
                                            onClick={() => setExcludeChecked(!excludeChecked)}
                                            className={`mt-0.5 ${excludeChecked ? 'text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            {excludeChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                        </button>
                                        <div>
                                            <p className="font-bold text-orange-800 text-sm">Resending Logic Active</p>
                                            <p className="text-orange-700 text-sm mt-0.5">
                                                Exclude users who already received the original broadcast?
                                            </p>
                                            <p className="text-orange-600 text-xs mt-1 font-mono">
                                                Original Broadcast ID: {excludeBroadcastId}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <Button size="lg" icon={Send} isLoading={sending}>
                                        {excludeBroadcastId ? 'Resend Notification' : 'Send Notification'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Preview Column */}
                    <div className="space-y-6">
                        <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Bell className="w-32 h-32 transform rotate-12" />
                            </div>
                            <h3 className="font-bold text-lg mb-2 relative z-10">Pro Tip</h3>
                            <p className="text-indigo-200 text-sm relative z-10 leading-relaxed">
                                Use the <strong>{'{name}'}</strong> placeholder to automatically insert the store owner's full name.
                                <br /><br />
                                Example: <br />
                                "Hi {'{name}'}!" becomes "Hi John Doe!"
                            </p>
                        </div>

                        <Card className="p-6 bg-slate-50 border-dashed border-2 border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center">
                                <Info className="w-4 h-4 mr-1.5" /> Live Preview
                            </h3>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-1">{title || 'No Title'}</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                    {(message || 'Start typing to see preview...').replace(/{name}/g, 'John Doe')}
                                </p>
                                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                                    Just now
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                // History Tab
                <div className="space-y-6">
                    <Card className="overflow-hidden">
                        {loadingHistory ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <History className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                <p>No broadcast history found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Title</th>
                                            <th className="px-6 py-4 font-medium">Message</th>
                                            <th className="px-6 py-4 font-medium">Target</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {history.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                    {item.title}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                                    {item.message}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.target_type === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {item.target_type === 'all' ? 'All Stores' : 'Specific'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        onClick={() => handleResend(item)}
                                                    >
                                                        <RotateCw className="w-4 h-4 mr-1.5" />
                                                        Resend
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
