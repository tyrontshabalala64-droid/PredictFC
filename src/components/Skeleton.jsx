import React from 'react'

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 mb-3">
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mt-2"></div>
            </div>
            <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
    )
}

export function SkeletonMatch() {
    return (
        <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
            <div className="flex justify-between items-center mb-3">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
                <div className="flex items-center gap-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
            </div>
            <div className="mt-3 bg-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
            </div>
        </div>
    )
}

export function SkeletonFeed() {
    return (
        <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    )
}