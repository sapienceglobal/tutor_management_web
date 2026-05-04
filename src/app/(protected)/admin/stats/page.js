'use client';

import { useState, useEffect } from 'react';
import { MdPeople, MdMenuBook, MdTrendingUp, MdFilterList } from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { C, T, S, R } from '@/constants/studentTokens';

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

// Tooltip style mapping to design system
const CustomTooltipStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    boxShadow: S.card,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.bold,
    color: C.heading
};

export default function AdminStatsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        userGrowth: [],
        courseCategories: [],
        userDistribution: []
    });

    const CHART_COLORS = [C.btnPrimary, C.chartLine, C.warning, C.danger, C.success];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats/detailed');
                if (res.data.success) {
                    setData(res.data.charts);
                }
            } catch (error) {
                console.error('Failed to fetch detailed stats:', error);
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                    Analytics Overview
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, margin: 0 }}>
                    Deep dive into platform performance metrics
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* User Growth Chart */}
                <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 24 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdPeople style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                User Growth
                            </h2>
                        </div>
                        <select style={{ ...baseInputStyle, width: 'auto', padding: '8px 16px' }}>
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.cardBorder} />
                                <XAxis
                                    dataKey="_id"
                                    stroke={C.textMuted}
                                    tickLine={false}
                                    axisLine={false}
                                    padding={{ left: 20, right: 20 }}
                                    tick={{ fontFamily: T.fontFamily, fontSize: 11, fontWeight: 'bold' }}
                                />
                                <YAxis
                                    stroke={C.textMuted}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontFamily: T.fontFamily, fontSize: 11, fontWeight: 'bold' }}
                                />
                                <Tooltip contentStyle={CustomTooltipStyle} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="New Users"
                                    stroke={C.btnPrimary}
                                    strokeWidth={3}
                                    dot={{ stroke: C.btnPrimary, strokeWidth: 2, r: 4, fill: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0, fill: C.btnPrimary }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Course Categories Distribution */}
                <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 24 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdMenuBook style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                Course Distribution
                            </h2>
                        </div>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.courseCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                    stroke="none"
                                >
                                    {data.courseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={CustomTooltipStyle} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    wrapperStyle={{ fontFamily: T.fontFamily, fontSize: '12px', fontWeight: T.weight.semibold, color: C.text }} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Role Distribution Bar Chart */}
            <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 24 }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center shrink-0"
                            style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdTrendingUp style={{ width: 16, height: 16, color: C.iconColor }} />
                        </div>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                            User Distribution by Role
                        </h2>
                    </div>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.userDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={C.cardBorder} />
                            <XAxis 
                                type="number" 
                                stroke={C.textMuted} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fontFamily: T.fontFamily, fontSize: 11, fontWeight: 'bold' }} 
                            />
                            <YAxis
                                dataKey="_id"
                                type="category"
                                stroke={C.textMuted}
                                width={100}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontFamily: T.fontFamily, fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' }}
                            />
                            <Tooltip
                                cursor={{ fill: C.innerBg }}
                                contentStyle={CustomTooltipStyle}
                            />
                            <Bar
                                dataKey="count"
                                name="Users"
                                fill={C.success}
                                radius={[0, 4, 4, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}