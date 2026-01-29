import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { X, Globe, Search, CheckCircle2, Circle } from 'lucide-react';
import { countries } from '../../../lib/countries';

export function AllowedCountriesModal({ storeId, initialAllowed, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (initialAllowed === null) {
            // User requested default to be deselecting all? 
            // "moreover by default all countries will be de selected"
            // If the user meant "Please make them deselected", then [] is correct.
            // If the user meant "They ARE deselected and I hate it", then select all.
            // Given "make it mandatory to search... in order to select them", implies they WANT to select specific ones.
            // So a clean slate (empty) is better for whitelisting.
            setSelectedCountries([]);
        } else {
            setSelectedCountries(initialAllowed || []);
        }
    }, [initialAllowed]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // If all countries are selected, maybe set to NULL for optimization? 
            // Or just store the array. Let's store the array explicitly for clarity.
            // Actually, if array is empty, it might mean "No Shipping". 

            const payload = selectedCountries.length === countries.length ? null : selectedCountries;

            const { error } = await supabase
                .from('stores')
                .update({ allowed_countries: payload })
                .eq('id', storeId);

            if (error) throw error;
            onSuccess(payload);
        } catch (err) {
            console.error('Error saving allowed countries:', err);
            alert('Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    const toggleCountry = (code) => {
        setSelectedCountries(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const toggleAll = (shouldSelect) => {
        if (shouldSelect) {
            setSelectedCountries(countries.map(c => c.code));
        } else {
            setSelectedCountries([]);
        }
    };

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAllSelected = selectedCountries.length === countries.length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white p-0 shadow-2xl rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Allowed Shipping Zones</h2>
                        <p className="text-sm text-slate-500">Select supported shipping countries</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search countries..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => toggleAll(true)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleAll(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 hover:bg-slate-100 rounded-lg"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                    <div className="grid grid-cols-1 gap-1">
                        {filteredCountries.map(country => {
                            const isSelected = selectedCountries.includes(country.code);
                            return (
                                <label
                                    key={country.code}
                                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected
                                        ? 'bg-indigo-50 border-indigo-200'
                                        : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-slate-300 bg-white'
                                        }`}>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isSelected}
                                        onChange={() => toggleCountry(country.code)}
                                    />
                                    <span className="text-2xl">{getFlagEmoji(country.code)}</span>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                        {country.name}
                                    </span>
                                </label>
                            );
                        })}
                        {filteredCountries.length === 0 && (
                            <p className="text-center text-slate-400 py-8">No countries found.</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl flex-shrink-0">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-900">{selectedCountries.length}</span> countries enabled
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Utility to verify flag emoji usage if possible, else rely on text.
function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}
