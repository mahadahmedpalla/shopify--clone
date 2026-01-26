import React from 'react';

// Helper to generate IDs
export const genId = () => Math.random().toString(36).substr(2, 9);

export function ColorInput({ label, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
            <div className="flex items-center space-x-2 bg-slate-50 border rounded p-1">
                <input type="color" className="h-4 w-4 rounded cursor-pointer border-none bg-transparent" value={value} onChange={e => onChange(e.target.value)} />
                <span className="text-[9px] font-mono text-slate-500 uppercase">{value}</span>
            </div>
        </div>
    );
}

export function getResponsiveValue(settings, viewMode, key, defaultVal) {
    if (!settings.responsive || !settings.responsive[viewMode]) return settings[key] || defaultVal;
    return settings.responsive[viewMode][key] !== undefined ? settings.responsive[viewMode][key] : (settings[key] || defaultVal);
}

export function Loader() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Engine...</p>
        </div>
    );
}

export function ViewModeBtn({ active, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 rounded-md transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
            {icon}
        </button>
    );
}
