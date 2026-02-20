'use client';

import { ArrowUp, ArrowDown, Chrome, Globe, Monitor, Smartphone, BookOpen } from 'lucide-react';

export default function TopItemsWidget({ title, data }) {
    // If data is provided but empty, show empty state. If data is null/undefined, we could show default or loading, but user wants NO dummy data.
    // So if data is missing or empty, we show empty state.

    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title || 'Top Performing Courses'}</h3>
                <div className="p-4 bg-slate-50 rounded-full mb-3">
                    <BookOpen className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No course data available yet.</p>
            </div>
        )
    }

    const displayItems = data;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">{title || 'Browser Usage'}</h3>

            <div className="space-y-6">
                {displayItems.map((item, index) => {
                    const Icon = item.icon || BookOpen;
                    return (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg}`}>
                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <span className="font-medium text-slate-700">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className="text-slate-600 font-bold">{item.count}</span>
                                <div className={`flex items-center text-sm font-bold w-20 justify-end ${item.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {item.trendUp ? <ArrowUp className="w-3.5 h-3.5 mr-1" /> : <ArrowDown className="w-3.5 h-3.5 mr-1" />}
                                    {Math.abs(item.trend)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
