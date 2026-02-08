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

// Helper to flatten categories for MultiSelect
export const getFlattenedOptions = (categories, depth = 0) => {
    let options = [];
    categories.forEach(cat => {
        options.push({
            value: cat.id,
            label: `${'—'.repeat(depth)} ${cat.name}`,
            original: cat
        });
        if (cat.children && cat.children.length > 0) {
            options = [...options, ...getFlattenedOptions(cat.children, depth + 1)];
        }
    });
    return options;
};

// MultiSelect Dropdown Component
export function MultiSelect({ options, selected, onChange, label }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.value));
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
            <div
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs cursor-pointer flex justify-between items-center hover:border-slate-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {selected.length === 0
                        ? 'Select Categories...'
                        : `${selected.length} Selected`}
                </div>
                <div className="text-slate-400 text-[10px]">▼</div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-xl max-h-60 overflow-y-auto">
                    <div
                        className="px-3 py-2 text-xs font-bold text-indigo-600 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                        onClick={handleSelectAll}
                    >
                        {selected.length === options.length ? 'Deselect All' : 'Select All'}
                    </div>
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`px-3 py-2 text-xs cursor-pointer flex items-center hover:bg-slate-50 ${selected.includes(option.value) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600'}`}
                            onClick={() => toggleOption(option.value)}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option.value)}
                                readOnly
                                className="mr-2 h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
