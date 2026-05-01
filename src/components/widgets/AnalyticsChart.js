'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C, T, S, R } from '@/constants/studentTokens';

export default function AnalyticsChart({ data, title = "Course Performance" }) {
    const [activeRange, setActiveTab] = useState('weekly');

    // Mapped to studentTokens C variables where possible, others retained for chart aesthetics
    const colors = { 
        enrollments: C.btnPrimary, // Purple (#7573E8)
        completions: C.success,    // Green (#10B981)
        revenue: C.warning         // Orange (#F59E0B)
    };

    const chartData = data || [
        { name: 'Week 1', enrollments: 10, completions: 10, revenue: 15 },
        { name: 'Week 2', enrollments: 80, completions: 80, revenue: 140 },
        { name: 'Week 3', enrollments: 180, completions: 120, revenue: 120 },
        { name: 'Week 4', enrollments: 280, completions: 200, revenue: 280 },
    ];

    return (
        <div className="p-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            
            {/* Top Row: Title + Toggle (Following Institute/Global Switcher Pattern) */}
            <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                    {title}
                </h3>
                
                {/* Switcher Pattern */}
                <div className="relative flex items-center p-1"
                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                    <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] transition-transform duration-300 ease-in-out z-0"
                        style={{ 
                            backgroundColor: C.btnPrimary, 
                            transform: activeRange === 'weekly' ? 'translateX(0)' : 'translateX(100%)',
                            boxShadow: `0 2px 10px ${C.btnPrimary}40`,
                            borderRadius: '8px'
                        }} />
                    {['weekly', 'monthly'].map(range => (
                        <button key={range} onClick={() => setActiveTab(range)}
                            className="relative z-10 px-4 py-1.5 capitalize transition-colors duration-300 border-none cursor-pointer"
                            style={{ 
                                fontFamily: T.fontFamily, 
                                fontSize: T.size.xs, 
                                fontWeight: T.weight.bold,
                                color: activeRange === range ? '#ffffff' : C.text, 
                                background: 'transparent' 
                            }}>
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Second Row: Legend (Aligned Left) */}
            <div className="flex items-center gap-6 mb-6 pl-1">
                {Object.keys(colors).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[key] }}></span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'capitalize' }}>
                            {key}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.enrollments} stopOpacity={0.25}/>
                                <stop offset="95%" stopColor={colors.enrollments} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.completions} stopOpacity={0.25}/>
                                <stop offset="95%" stopColor={colors.completions} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.revenue} stopOpacity={0.15}/>
                                <stop offset="95%" stopColor={colors.revenue} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.cardBorder} />
                        
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 600, fontFamily: T.fontFamily }} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 600, fontFamily: T.fontFamily }} 
                            dx={-10} 
                        />
                        
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '10px', 
                                border: `1px solid ${C.cardBorder}`, 
                                boxShadow: S.card, 
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: 'bold' 
                            }}
                            cursor={{ stroke: C.cardBorder, strokeWidth: 1, strokeDasharray: '3 3' }} 
                        />
                        
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={colors.revenue} 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            dot={{ r: 4, stroke: colors.revenue, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, stroke: colors.revenue, strokeWidth: 2, fill: '#fff' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="completions" 
                            stroke={colors.completions} 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorCompletions)" 
                            dot={{ r: 4, stroke: colors.completions, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, stroke: colors.completions, strokeWidth: 2, fill: '#fff' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="enrollments" 
                            stroke={colors.enrollments} 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorEnrollments)" 
                            dot={{ r: 4, stroke: colors.enrollments, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, stroke: colors.enrollments, strokeWidth: 2, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}