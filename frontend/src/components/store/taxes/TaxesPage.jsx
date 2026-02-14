import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
// import { Button } from '../../ui/Button'; -- Check path, user uses ../../ui/Button in CouponsPage
import { Button } from '../../ui/Button';
import { CreateTaxModal } from './CreateTaxModal';
import { formatCurrency } from '../../../utils/currencyUtils';
import {
    Activity, // Replacement for generic icon
    Plus,
    Search,
    Edit2,
    Trash2,
    Power,
    Check,
    Copy,
    Landmark
} from 'lucide-react';

export function TaxesPage() {
    const { storeId } = useParams();
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        fetchTaxes();
    }, [storeId]);

    const fetchTaxes = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('taxes')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (data) setTaxes(data);
        if (data) setTaxes(data);
        setLoading(false);
    };

    useEffect(() => {
        if (storeId) {
            const fetchStoreSettings = async () => {
                const { data } = await supabase
                    .from('stores')
                    .select('currency')
                    .eq('id', storeId)
                    .single();
                if (data) setCurrency(data.currency || 'USD');
            };
            fetchStoreSettings();
        }
    }, [storeId]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tax?')) return;

        const { error } = await supabase.from('taxes').delete().eq('id', id);
        if (error) {
            alert('Error deleting tax');
        } else {
            setTaxes(taxes.filter(t => t.id !== id));
        }
    };

    const handleToggleStatus = async (tax) => {
        const newStatus = !tax.is_active;
        const { error } = await supabase
            .from('taxes')
            .update({ is_active: newStatus })
            .eq('id', tax.id);

        if (error) {
            alert('Error updating status');
        } else {
            setTaxes(taxes.map(t => t.id === tax.id ? { ...t, is_active: newStatus } : t));
        }
    };

    const filteredTaxes = taxes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Taxes</h1>
                    <p className="text-slate-500 mt-1">Manage tax rates by country and product type</p>
                </div>
                <Button onClick={() => { setEditingTax(null); setIsFormOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tax
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or code..."
                    className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading taxes...</div>
            ) : filteredTaxes.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Landmark className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No taxes configured</h3>
                    <p className="text-slate-500 mb-6">Create your first tax rule to handle payments correctly.</p>
                    <Button onClick={() => { setEditingTax(null); setIsFormOpen(true); }}>
                        Create Tax
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTaxes.map(tax => (
                        <div key={tax.id} className={`bg-white p-6 rounded-xl border hover:shadow-md transition-all group ${!tax.is_active ? 'border-slate-100 opacity-75' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tax.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Landmark className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            {tax.name}
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-xs rounded border border-slate-200">
                                                {tax.code}
                                            </span>
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {tax.country} • {tax.type === 'percentage' ? `${tax.value}%` : `${formatCurrency(tax.value, currency)} Fixed`}
                                            {' • '}
                                            {tax.applies_to === 'all' ? 'All Products' :
                                                tax.applies_to === 'specific_products' ? `${tax.included_product_ids?.length || 0} Products` :
                                                    `${tax.included_category_ids?.length || 0} Categories`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleToggleStatus(tax)}
                                            className={`p-2 rounded-lg transition-colors ${tax.is_active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                                            title={tax.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setEditingTax(tax); setIsFormOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tax.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <CreateTaxModal
                    storeId={storeId}
                    tax={editingTax}
                    onSuccess={() => { setIsFormOpen(false); fetchTaxes(); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}
