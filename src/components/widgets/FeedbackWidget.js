'use client';
import { C, T, S } from '@/constants/tutorTokens';

export default function FeedbackWidget({ title, data, isTutor }) {
    const defaultData = [
        { label: 'Good', value: 78, color: 'bg-green-500' },
        { label: 'Satisfied', value: 82, color: 'bg-blue-600' },
        { label: 'Excellent', value: 89, color: 'bg-orange-500' },
        { label: 'Average', value: 40, color: 'bg-yellow-500' },
        { label: 'Unsatisfied', value: 20, color: 'bg-cyan-400' },
    ];

    const displayData = data || defaultData;
    const wrapperClass = isTutor ? "p-6 rounded-2xl h-full flex flex-col justify-center" : "bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center h-full";
    const wrapperStyle = isTutor ? { backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card } : {};

    return (
        <div className={wrapperClass} style={wrapperStyle}>
            <h3 className={isTutor ? "mb-8": "text-lg font-semibold text-slate-800 mb-8"} style={isTutor ? { color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold } : {}}>{title || 'Customer Satisfaction'}</h3>

            <div className="space-y-6">
                {displayData.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className={isTutor ? "font-semibold" : "text-slate-600 font-medium"} style={isTutor ? { fontFamily: T.fontFamily, color: C.heading } : {}}>{item.label}</span>
                            <span className={isTutor ? "font-bold" : "text-slate-500"} style={isTutor ? { fontFamily: T.fontFamily, color: C.statValue } : {}}>{item.value}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: isTutor ? C.innerBg : '#f1f5f9' }}>
                            <div
                                className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                                style={{ width: `${item.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
