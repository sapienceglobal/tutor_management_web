'use client';

import { ArrowUp, ArrowDown, Chrome, Globe, Monitor, Smartphone, BookOpen } from 'lucide-react';
import { C, T, S } from '@/constants/tutorTokens';

export default function TopItemsWidget({ title, data, isTutor }) {
    // If data is provided but empty, show empty state. If data is null/undefined, we could show default or loading, but user wants NO dummy data.
    // So if data is missing or empty, we show empty state.

    const wrapperClass = isTutor ? "p-6 rounded-2xl h-full flex flex-col justify-center items-center text-center" : "bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col justify-center items-center text-center";
    const wrapperStyle = isTutor ? { backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card } : {};

    if (!data || data.length === 0) {
        return (
            <div className={wrapperClass} style={wrapperStyle}>
                <h3 className="mb-2" style={isTutor ? { color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold } : { className: "text-lg font-semibold text-slate-800" }}>{title || 'Top Performing Courses'}</h3>
                <div className="p-4 rounded-full mb-3" style={{ backgroundColor: isTutor ? C.innerBg : '#f8fafc' }}>
                    <BookOpen className="w-6 h-6" style={{ color: isTutor ? C.iconColor : '#94a3b8' }} />
                </div>
                <p style={{ color: isTutor ? C.text : '#64748b', opacity: isTutor ? 0.6 : 1, fontFamily: isTutor ? T.fontFamily : 'inherit' }} className={isTutor ? "text-sm" : "text-sm"}>No course data available yet.</p>
            </div>
        )
    }

    const displayItems = data;

    const activeWrapperClass = isTutor ? "p-6 rounded-2xl h-full" : "bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full";

    return (
        <div className={activeWrapperClass} style={wrapperStyle}>
            <h3 className={isTutor ? "mb-6" : "text-lg font-semibold text-slate-800 mb-6"} style={isTutor ? { color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold } : {}}>{title || 'Browser Usage'}</h3>

            <div className="space-y-6">
                {displayItems.map((item, index) => {
                    const Icon = item.icon || BookOpen;
                    return (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: isTutor ? C.iconBg : item.bg }}>
                                    <Icon className={isTutor ? "w-5 h-5" : `w-5 h-5 ${item.color}`} style={isTutor ? { color: C.iconColor } : {}} />
                                </div>
                                <span className={isTutor ? "truncate" : "font-medium text-slate-700"} style={isTutor ? { fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading } : {}}>{item.name}</span>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className={isTutor ? "" : "text-slate-600 font-bold"} style={isTutor ? { fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.statValue } : {}}>{item.count}</span>
                                <div className={`flex items-center justify-end w-20`} style={isTutor ? { fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: item.trendUp ? C.success : C.danger } : { className: `text-sm font-bold ${item.trendUp ? 'text-green-500' : 'text-red-500'}` }}>
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
