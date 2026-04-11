'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

export default function StatsCard({ title, value, trend, trendUp, icon: Icon, iconColor, iconBg, valueColor }) {
    const softShadow = '0px 10px 40px -10px rgba(112, 128, 176, 0.12)';

    return (
        <div className="bg-white p-5 rounded-2xl flex flex-col gap-4 transition-transform hover:-translate-y-1"
             style={{ boxShadow: softShadow }}>
            
            {/* Top Row: Icon + Title */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center shrink-0 rounded-[10px]"
                     style={{ width: 38, height: 38, backgroundColor: iconBg }}>
                    {Icon && <Icon size={20} color={iconColor} strokeWidth={2.5} />}
                </div>
                {/* Title ab dark blue/navy color me hai image ke hisaab se */}
                <h3 className="text-[#27225B] font-bold text-[15px] m-0">{title}</h3>
            </div>

            {/* Bottom Row: Value + Trend Badge */}
            <div className="flex items-center gap-3">
                <span className="text-[32px] font-black leading-none tracking-tight"
                      style={{ color: valueColor || '#1A1549', fontFamily: "'Inter', sans-serif" }}>
                    {value}
                </span>

                {trend && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                         style={{ 
                             backgroundColor: trendUp ? '#E6F5EF' : '#FEE2E2',
                             color: trendUp ? '#207B5F' : '#DC2626'
                         }}>
                        {trendUp ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
                        <span className="text-[13px] font-bold pr-0.5">{trend}</span>
                    </div>
                )}
            </div>
        </div>
    );
}