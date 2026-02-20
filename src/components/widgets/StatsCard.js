'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

export default function StatsCard({ title, value, subtext, trend, trendUp, color }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center flex flex-col items-center">
            <h3 className="text-slate-500 font-medium text-sm mb-3 uppercase tracking-wide">{title}</h3>

            <div className="mb-4">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
            </div>

            <div className={`flex items-center justify-center text-sm font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {trendUp ? (
                    <ArrowUp className="w-4 h-4 mr-1 stroke-[3]" />
                ) : (
                    <ArrowDown className="w-4 h-4 mr-1 stroke-[3]" />
                )}
                <span>{trend}</span>
                <span className="text-slate-400 font-normal ml-1 whitespace-nowrap">{subtext}</span>
            </div>
        </div>
    );
}
