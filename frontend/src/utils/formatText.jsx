
import React from 'react';

/**
 * Advanced parser for nested formatting (*bold*, _italic_, ~underline~) with escaping support.
 * 
 * Rules:
 * - *text* -> Bold
 * - _text_ -> Italic
 * - ~text~ -> Underline
 * - \char -> Escaped char (e.g. \* -> *)
 * 
 * @param {string} content - The raw text content to format
 * @returns {React.ReactNode[]} - Array of React nodes
 */
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
                // We pass the FULL pipeline again to allow extensive nesting (e.g. *bold _italic_* and _italic *bold*_)
                // To prevent infinite recursion on the SAME string, the regex ensures we are consuming markers.

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
