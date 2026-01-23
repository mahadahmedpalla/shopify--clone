
import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge('bg-white overflow-hidden shadow rounded-lg border border-gray-100', className)}
            {...props}
        >
            <div className="px-4 py-5 sm:p-6">
                {children}
            </div>
        </div>
    );
}
