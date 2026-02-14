import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { ShippingForm } from './ShippingForm';
import {
    Truck,
    Plus,
    Search,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    MapPin,
    DollarSign,
    Box,
    Globe
} from 'lucide-react';
import { getCountryName } from '../../../lib/countries';
import { AllowedCountriesModal } from './AllowedCountriesModal';
import { formatCurrency } from '../../../utils/currencyUtils';

export function ShippingPage() {
    const { storeId } = useParams();
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [showAllowedModal, setShowAllowedModal] = useState(false);
    const [allowedCountries, setAllowedCountries] = useState(null); // null = all allowed
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        if (storeId) {
            fetchRates();
        }
    }, [storeId]);

    const fetchRates = async () => {
        try {
            const { data, error } = await supabase
                .from('shipping_rates')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRates(data || []);

            // Fetch store allowed countries
            const { data: storeData } = await supabase
                .from('stores')
                .select('allowed_countries, currency')
                .eq('id', storeId)
                .single();

            if (storeData) {
                setAllowedCountries(storeData.allowed_countries);
                if (storeData.currency) setCurrency(storeData.currency);
            }
        } catch (err) {
            console.error('Error fetching shipping rates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (rate) => {
        try {
            const { error } = await supabase
                .from('shipping_rates')
                .update({ is_active: !rate.is_active })
                .eq('id', rate.id);

            if (error) throw error;
            fetchRates();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this shipping rate?')) return;

        try {
            const { error } = await supabase
                .from('shipping_rates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchRates();
        } catch (err) {
            console.error('Error deleting rate:', err);
        }
    };

    const handleEdit = (rate) => {
        setEditingRate(rate);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingRate(null);
        fetchRates();
    };

    const filteredRates = rates.filter(rate =>
        rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showAllowedModal) {
        return (
            <AllowedCountriesModal
                storeId={storeId}
                initialAllowed={allowedCountries}
                onSuccess={(newAllowed) => {
                    setAllowedCountries(newAllowed);
                    setShowAllowedModal(false);
                }}
                onCancel={() => setShowAllowedModal(false)}
            />
        );
    }

    if (showForm) {
        return (
            <ShippingForm
                storeId={storeId}
                rate={editingRate}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                    setShowForm(false);
                    setEditingRate(null);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Shipping Rates</h1>
                    <p className="text-sm text-slate-500">Manage shipping costs and delivery zones.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setShowAllowedModal(true)} className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Allowed Zones</span>
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Shipping Rate</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search rates by name or country..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            ) : filteredRates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No shipping rates found</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        Detailed shipping rates help customers understand delivery costs upfront.
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                        Create First Rate
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRates.map((rate) => (
                        <div
                            key={rate.id}
                            className={`group bg-white p-5 rounded-xl border transition-all hover:shadow-md ${rate.is_active ? 'border-slate-200' : 'border-slate-100 opacity-75'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-xl ${rate.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-bold text-slate-900 text-lg">{rate.name}</h3>
                                            {!rate.is_active && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>{getCountryName(rate.country)} {rate.region ? `(${rate.region})` : ''}</span>
                                            </div>
                                            <div className="flex items-center space-x-1 text-slate-900 font-medium">
                                                <span>{formatCurrency(rate.amount, currency)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {rate.min_order_value > 0 && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                    Min Order: {formatCurrency(rate.min_order_value, currency)}
                                                </span>
                                            )}
                                            {rate.applies_to !== 'all' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    <Box className="w-3 h-3 mr-1" />
                                                    {rate.applies_to === 'specific_products' ? 'Specific Products' : 'Specific Categories'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleToggleStatus(rate)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title={rate.is_active ? "Deactivate" : "Activate"}
                                    >
                                        {rate.is_active ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6" />}
                                    </button>
                                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                    <button
                                        onClick={() => handleEdit(rate)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rate.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
