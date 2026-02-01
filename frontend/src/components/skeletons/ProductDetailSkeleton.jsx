import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar Skeleton */}
            <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 md:px-12">
                <Skeleton className="h-8 w-32" />
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>

            {/* Product Details Skeleton */}
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Image Column */}
                    <Skeleton className="w-full aspect-square rounded-2xl bg-slate-100" />

                    {/* Info Column */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-8 w-32" />
                        </div>

                        <div className="space-y-6 border-t border-slate-100 pt-8">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-16" />
                                <div className="flex gap-3">
                                    <Skeleton className="h-10 w-24 rounded-lg" />
                                    <Skeleton className="h-10 w-24 rounded-lg" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Skeleton className="h-12 w-32 rounded-lg" />
                                <Skeleton className="h-12 flex-1 rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-8">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
