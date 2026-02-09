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

// Advanced parser for nested formatting (*bold*, _italic_, ~underline~) with escaping support
export const renderFormattedText = (content) => {
    if (!content) return null;

    // 1. Replace escaped characters with SAFE placeholders (no special chars)
    const safeContent = content
        .replace(/\\\*/g, '::AST::')
        .replace(/\\_/g, '::UND::')
        .replace(/\\~/g, '::TIL::');

    // Helper to restore escaped chars
    const restore = (str) => str
        .replace(/::AST::/g, '*')
        .replace(/::UND::/g, '_')
        .replace(/::TIL::/g, '~');

    // Recursive parser function
    const parse = (text, matchers) => {
        if (!matchers.length) return [restore(text)];

        const currentMatcher = matchers[0];
        const remainingMatchers = matchers.slice(1);

        // Regex for current marker
        const parts = text.split(currentMatcher.regex);

        return parts.map((part, index) => {
            // If it matches the full wrapper structure (e.g. *...*)
            if (currentMatcher.test(part)) {
                // Extract inner content and recurse with remaining matchers
                // To prevent infinite recursion on the SAME string, we strip markers.
                const innerContent = part.slice(1, -1);
                // Recurse on inner content
                return currentMatcher.wrapper(parse(innerContent, matchers), index);
            }

            // Not a match, process with next matcher
            return parse(part, remainingMatchers);
        }).flat();
    };

    // Matchers Pipeline
    const matchers = [
        {
            regex: /(\*[\s\S]+?\*)/g, // Bold
            test: s => s.startsWith('*') && s.endsWith('*') && s.length >= 2,
            wrapper: (children, key) => <strong key={key} className="font-bold">{children}</strong>
        },
        {
            regex: /(_{1}[\s\S]+?_{1})/g, // Italic
            test: s => s.startsWith('_') && s.endsWith('_') && s.length >= 2,
            wrapper: (children, key) => <em key={key} className="italic">{children}</em>
        },
        {
            regex: /(~[\s\S]+?~)/g, // Underline
            test: s => s.startsWith('~') && s.endsWith('~') && s.length >= 2,
            wrapper: (children, key) => <u key={key} className="underline underline-offset-2">{children}</u>
        }
    ];

    return parse(safeContent, matchers);
};
