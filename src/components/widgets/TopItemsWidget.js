'use client';

import { MdArrowUpward, MdArrowDownward, MdMenuBook } from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';

export default function TopItemsWidget({ title, data, isTutor }) {
    // Logic retained exactly as original: Check if data is missing or empty
    if (!data || data.length === 0) {
        return (
            <div className="p-14 text-center border border-dashed h-full flex flex-col justify-center items-center"
                style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                <div className="flex items-center justify-center mx-auto mb-4 shrink-0"
                    style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                </div>
                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                    {title || 'Top Performing Courses'}
                </h3>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>
                    No course data available yet.
                </p>
            </div>
        );
    }

    const displayItems = data;

    return (
        <div className="p-6 flex flex-col h-full" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, borderRadius: R['2xl'] }}>
            <h3 className="mb-6" style={{ color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold }}>
                {title || 'Browser Usage'}
            </h3>

            <div className="space-y-6">
                {displayItems.map((item, index) => {
                    const Icon = item.icon || MdMenuBook;
                    return (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <Icon style={{ width: 20, height: 20, color: C.iconColor }} />
                                </div>
                                <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                    {item.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.statValue }}>
                                    {item.count}
                                </span>
                                <div className="flex items-center justify-end w-20" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: item.trendUp ? C.success : C.danger }}>
                                    {item.trendUp ? <MdArrowUpward style={{ width: 14, height: 14, marginRight: 4 }} /> : <MdArrowDownward style={{ width: 14, height: 14, marginRight: 4 }} />}
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