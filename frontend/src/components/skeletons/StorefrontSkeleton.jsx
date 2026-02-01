import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function StorefrontSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar Skeleton */}
            <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 md:px-12">
                <div className="flex items-center gap-8">
                    <Skeleton className="h-8 w-32" />
                    <div className="hidden md:flex gap-8">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Hero Skeleton */}
            <div className="w-full h-[500px] bg-slate-50 flex items-center justify-center mb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/50 to-white/50" />
                <div className="relative space-y-6 text-center z-10 p-6">
                    <Skeleton className="h-16 w-64 md:w-96 mx-auto rounded-xl" />
                    <Skeleton className="h-6 w-48 mx-auto rounded-lg" />
                    <Skeleton className="h-12 w-40 mx-auto rounded-full mt-4" />
                </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <div className="flex justify-between items-end mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-4 group">
                            <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-slate-100" />
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-5 w-12" />
                                </div>
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
