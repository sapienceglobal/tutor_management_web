'use client';

import { useState, useEffect } from 'react';
import { MdAttachMoney, MdCreditCard, MdTrendingUp, MdChevronRight, MdShowChart, MdFactCheck } from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import StatCard from '@/components/StatCard';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

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
    padding: '8px 16px',
    transition: 'all 0.2s ease',
};

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

export default function AdminEarningsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalRevenue: 0,
        revenueChart: [],
        recentTransactions: []
    });

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const res = await api.get('/admin/earnings');
                if (res.data?.success) {
                    setData(res.data.financials || res.data.data || { totalRevenue: 0, revenueChart: [], recentTransactions: [] });
                }
            } catch (error) {
                console.error('Failed to fetch financials:', error);
                toast.error('Failed to load financial data');
            } finally {
                setLoading(false);
            }
        };

        fetchFinancials();
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

    const displayRevenue = data.totalRevenue || 0;
    const avgOrderValue = data.recentTransactions?.length > 0 
        ? (data.totalRevenue / data.recentTransactions.length).toFixed(2) 
        : '0.00';
    
    const chartData = data.revenueChart || [];
    const txnsData = data.recentTransactions || [];

    return (
        <div className="space-y-6 min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="mb-2">
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                    Financial Overview
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                    Track platform revenue, average values, and recent transactions
                </p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { title: 'Total Revenue', value: `$${displayRevenue.toLocaleString()}`, bg: C.btnViewAllBg, iconColor: C.btnPrimary, icon: MdAttachMoney },
                    { title: 'Avg Order Value', value: `$${avgOrderValue}`, bg: C.successBg, iconColor: C.success, icon: MdTrendingUp },
                    { title: 'Total Transactions', value: `${data.recentTransactions?.length || 0}`, bg: C.warningBg, iconColor: C.warning, icon: MdCreditCard }
                ].map((stat, i) => (
                    <StatCard 
                        key={i}
                        icon={stat.icon}
                        value={stat.value}
                        label={stat.title}
                        iconBg={stat.bg}
                        iconColor={stat.iconColor}
                    />
                ))}
            </div>

            {/* ── Main Grid: Chart & Quick Stats ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Chart */}
                <div className="lg:col-span-2 flex flex-col p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdTrendingUp style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                Monthly Revenue
                            </h2>
                        </div>
                        <select style={{ ...baseInputStyle, width: 'auto' }}>
                            <option>This Year</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.cardBorder} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke={C.textMuted} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fontFamily: T.fontFamily, fill: C.textMuted, fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis 
                                    stroke={C.textMuted} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `$${value}`}
                                    tick={{ fontFamily: T.fontFamily, fill: C.textMuted, fontSize: 12, fontWeight: 600 }}
                                    dx={-10}
                                />
                                <Tooltip 
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                    contentStyle={CustomTooltipStyle}
                                    cursor={{ fill: C.innerBg }}
                                />
                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? C.btnPrimary : C.btnViewAllBg} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Reports Widget */}
                <div className="flex flex-col p-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}>
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="flex items-center justify-center shrink-0"
                            style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdFactCheck style={{ width: 16, height: 16, color: C.iconColor }} />
                        </div>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Financial Reports
                        </h2>
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="p-4 transition-colors cursor-pointer group"
                             style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                             onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                             onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.surfaceWhite, borderRadius: '10px' }}>
                                    <MdShowChart style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Earnings Statement</span>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Download your detailed monthly profit and loss statement.</p>
                        </div>
                        <div className="p-4 transition-colors cursor-pointer group"
                             style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: '10px' }}
                             onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.8; }}
                             onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.surfaceWhite, borderRadius: '10px' }}>
                                    <MdAttachMoney style={{ width: 16, height: 16, color: C.success }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Payout History</span>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>View all successful transfers to your connected bank account.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recent Transactions Table ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}>
                <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center shrink-0"
                            style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdCreditCard style={{ width: 16, height: 16, color: C.iconColor }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Recent Transactions
                        </h3>
                    </div>
                    <button className="flex items-center justify-center transition-colors border-none cursor-pointer"
                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, padding: '8px 16px', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Transaction ID</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Student</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Course</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Date</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Amount</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {txnsData.map((txn, i) => (
                                <tr key={txn.id || i} className="transition-colors" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, backgroundColor: C.btnViewAllBg, padding: '4px 8px', borderRadius: '10px' }}>
                                            #{txn.id.slice(-6).toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{txn.student}</div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div className="truncate max-w-[200px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{txn.course}</div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted }}>
                                            {new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                            ${Number(txn.amount).toFixed(2)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        {txn.status?.toLowerCase() === 'success' || txn.status?.toLowerCase() === 'completed' ? (
                                            <span style={{ display: 'inline-flex', padding: '4px 10px', backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', border: `1px solid ${C.successBorder}`, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                Success
                                            </span>
                                        ) : txn.status?.toLowerCase() === 'pending' ? (
                                            <span style={{ display: 'inline-flex', padding: '4px 10px', backgroundColor: C.warningBg, color: C.warning, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', border: `1px solid ${C.warningBorder}`, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                Pending
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', padding: '4px 10px', backgroundColor: C.dangerBg, color: C.danger, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', border: `1px solid ${C.dangerBorder}`, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                Failed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}