import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function CheckoutSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column (Forms) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>

                {/* Right Column (Summary) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6 h-fit">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-8 w-full rounded-lg mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
