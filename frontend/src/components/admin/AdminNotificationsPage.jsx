import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bell, Send, Users, UserCheck, AlertCircle, Info } from 'lucide-react';

export function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('all'); // 'all' or 'specific'
    const [targetIds, setTargetIds] = useState('');

    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

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
                p_target_ids: parsedIds
            });

            if (error) throw error;

            setStatus({ type: 'success', msg: `Successfully sent to ${data.count} users.` });
            // Reset form
            setTitle('');
            setMessage('');
            setTargetIds('');
        } catch (err) {
            console.error('Error sending notification:', err);
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Notifications Center</h1>
                <p className="text-slate-500">Send announcements and updates to store owners.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <form onSubmit={handleSend} className="space-y-6">
                            {status && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {status.type === 'success' ? <UserCheck className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                                    <div>
                                        <p className="font-bold">{status.type === 'success' ? 'Success' : 'Error'}</p>
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

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <Button size="lg" icon={Send} isLoading={sending}>
                                    Send Notification
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
        </div>
    );
}
