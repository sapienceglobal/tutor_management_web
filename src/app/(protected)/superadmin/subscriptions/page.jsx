'use client';

import React, { useState, useEffect } from 'react';
import { 
    MdSearch, MdFileDownload, MdMoreHoriz, MdKeyboardArrowDown, MdCheckCircle, 
    MdCancel, MdChevronLeft, MdChevronRight, MdTrendingUp, MdBusiness, 
    MdArticle, MdAdd, MdContentCopy, MdHourglassEmpty, MdDashboard
} from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getSubscriptionsOverview } from '@/services/superadminService';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
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

// ─── Section Header Component ─────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
            </div>
            <h2 style={{
                fontFamily: T.fontFamily, fontSize: T.size.xl,
                fontWeight: T.weight.semibold, color: C.heading, margin: 0
            }}>
                {title}
            </h2>
        </div>
    );
}

export default function SubscriptionsDashboard() {
    const [selectedRows, setSelectedRows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Dynamic States for API Data
    const [subscriptions, setSubscriptions] = useState([]);
    const [kpis, setKpis] = useState({ totalSubscriptions: 0, monthlyRevenue: 0, newThisMonth: 0 });
    const [distribution, setDistribution] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const data = await getSubscriptionsOverview();

            if (data.success) {
                setSubscriptions(data.subscriptions);
                setKpis(data.kpis);
                setDistribution(data.distribution);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load subscriptions data');
            console.error('Dashboard Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const toggleAll = () => {
        if (selectedRows.length === subscriptions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(subscriptions.map(s => s.id));
        }
    };

    const getPlanBadge = (plan) => {
        const lower = plan.toLowerCase();
        if (lower.includes('basic')) return { bg: C.innerBg, color: C.btnPrimary };
        if (lower.includes('pro')) return { bg: '#F3E8FF', color: '#9333EA' };
        if (lower.includes('enterprise')) return { bg: C.warningBg, color: C.warning };
        return { bg: C.surfaceWhite, color: C.textMuted };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading subscriptions...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div>
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                    Total Subscriptions
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                    Track and manage all subscriptions across institutes.
                </p>
            </div>

            {/* ── KPI Cards (REAL DATA) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <StatCard 
                    icon={MdBusiness} 
                    value={kpis.totalSubscriptions.toLocaleString()} 
                    label="Total Subscriptions" 
                    iconBg="#F3E8FF" 
                    iconColor="#8B5CF6" 
                />
                <StatCard 
                    icon={MdTrendingUp} 
                    value={`₹${kpis.monthlyRevenue.toLocaleString()}`} 
                    label="Monthly Revenue" 
                    iconBg="#DCFCE7" 
                    iconColor="#16A34A" 
                />
                <StatCard 
                    icon={MdAdd} 
                    value={kpis.newThisMonth.toLocaleString()} 
                    label="New Subscriptions (This Month)" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
            </div>

            {/* ── Main Layout: Table Area (Left) + Sidebar (Right) ── */}
            <div className="flex flex-col xl:flex-row gap-6">
                
                {/* ── Left Area: Table ── */}
                <div className="flex-1 flex flex-col overflow-hidden" 
                    style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    {/* Toolbar */}
                    <div className="p-5 border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 transition-colors cursor-pointer"
                                style={{
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: '10px',
                                    padding: '10px 16px',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold
                                }}
                            >
                                <MdCheckCircle style={{ width: 16, height: 16, color: C.success }}/> Approve
                            </button>
                            <button className="flex items-center gap-2 transition-colors cursor-pointer"
                                style={{
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: '10px',
                                    padding: '10px 16px',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold
                                }}
                            >
                                <MdFileDownload style={{ width: 16, height: 16, color: C.btnPrimary }} /> Export <MdKeyboardArrowDown style={{ width: 16, height: 16 }}/>
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-full sm:w-[250px]">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                                <input 
                                    type="text" 
                                    placeholder="Search subscriptions..." 
                                    style={{ ...baseInputStyle, paddingLeft: '44px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    <th className="py-4 px-6 w-12" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <input type="checkbox" onChange={toggleAll} checked={selectedRows.length === subscriptions.length && subscriptions.length > 0} 
                                            style={{ cursor: 'pointer', width: 16, height: 16, accentColor: C.btnPrimary }} />
                                    </th>
                                    {['Institute Name / ID', 'Subscription Plan', 'Students', 'Revenue', 'Start Date', 'Status'].map((header, idx) => (
                                        <th key={idx} style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            color: C.statLabel,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            padding: '16px',
                                            borderBottom: `1px solid ${C.cardBorder}`
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8">
                                            <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdArticle style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Subscriptions</h3>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4, margin: 0 }}>There are no active subscriptions found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((sub) => {
                                        const badgeData = getPlanBadge(sub.plan);
                                        return (
                                            <tr key={sub.id} className="transition-colors"
                                                style={{ backgroundColor: selectedRows.includes(sub.id) ? C.innerBg : 'transparent', borderBottom: `1px solid ${C.cardBorder}` }}
                                                onMouseEnter={(e) => { if(!selectedRows.includes(sub.id)) e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                onMouseLeave={(e) => { if(!selectedRows.includes(sub.id)) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                <td className="py-4 px-6">
                                                    <input type="checkbox" checked={selectedRows.includes(sub.id)} onChange={() => toggleRow(sub.id)} 
                                                        style={{ cursor: 'pointer', width: 16, height: 16, accentColor: C.btnPrimary }} />
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center shrink-0" 
                                                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.iconBg }}>
                                                            <MdArticle style={{ width: 18, height: 18, color: C.iconColor }} />
                                                        </div>
                                                        <div>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{sub.name}</p>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 2 }}>{sub.displayId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span style={{ 
                                                        padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, 
                                                        textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                        backgroundColor: badgeData.bg, color: badgeData.color, border: `1px solid ${C.cardBorder}`
                                                    }}>
                                                        {sub.plan}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {sub.students.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.btnPrimary }}>
                                                    ₹{sub.revenue.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                                    {sub.date}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {sub.status === 'Active' ? (
                                                        <span className="flex items-center gap-1.5 w-max" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.successBg, color: C.success, textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.successBorder}` }}>
                                                            <MdCheckCircle style={{ width: 14, height: 14 }} /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 w-max" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.dangerBg, color: C.danger, textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.dangerBorder}` }}>
                                                            <MdCancel style={{ width: 14, height: 14 }} /> Expired
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Right Area: Sidebar Charts & Info (REAL DATA) ── */}
                <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">
                    
                    {/* Plan Distribution Chart Card */}
                    <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
                        <SectionHeader icon={MdDashboard} title="Plan Distribution" />
                        <div className="flex flex-col items-center">
                            <div className="w-full space-y-3 mt-2">
                                {distribution.length > 0 ? distribution.map((item, idx) => {
                                    let dotColor = C.textMuted;
                                    if (item.name.toLowerCase().includes('basic')) dotColor = C.btnPrimary;
                                    else if (item.name.toLowerCase().includes('pro')) dotColor = '#8B5CF6';
                                    else if (item.name.toLowerCase().includes('enterprise')) dotColor = C.warning;
                                    
                                    return (
                                        <div key={idx} className="flex items-center justify-between" style={{ padding: '10px', backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                <span style={{ width: 12, height: 12, borderRadius: R.full, backgroundColor: dotColor }}></span> {item.name}
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading }}>{item.percentage}%</span>
                                        </div>
                                    )
                                }) : (
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textAlign: 'center', margin: 0 }}>No active plans data</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Revenue Overview Card */}
                    <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
                        <SectionHeader icon={MdTrendingUp} title="Revenue Overview" />
                        <div style={{ backgroundColor: C.innerBg, borderRadius: '10px', padding: '16px', border: `1px solid ${C.cardBorder}`, marginBottom: '20px' }}>
                            <div className="flex justify-between items-center">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>This Month</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.btnPrimary }}>₹{kpis.monthlyRevenue.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                style={{
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: '10px',
                                    padding: '14px 16px',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            >
                                <MdContentCopy style={{ width: 18, height: 18 }} />
                                Export Subscriptions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}