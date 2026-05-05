'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown,
    MdCreditCard, MdBusiness, MdFileDownload, MdOpenInNew, MdShowChart,
    MdCurrencyRupee, MdWarning, MdCheckCircle, MdAccessTime
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Section Header Component ─────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}>
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

export default function SuperAdminFinancePage() {
    const [loading, setLoading] = useState(true);
    const [financeData, setFinanceData] = useState({
        kpis: {
            totalRevenue: 0,
            mrr: 0,
            platformCommission: 0,
            pendingPayouts: 0,
            growth: 0
        },
        chartData: [],
        recentTransactions: [],
        pendingSettlements: []
    });

    useEffect(() => {
        fetchFinanceOverview();
    }, []);

    const fetchFinanceOverview = async () => {
        setLoading(true);
        try {
            const res = await api.get('/superadmin/finance/overview');
            if (res.data.success) {
                setFinanceData(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to sync live finance data. Backend route might be pending.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayout = async (instituteId, amount) => {
        if (!confirm(`Process payout of ₹${amount} to this institute?`)) return;
        try {
            const res = await api.post(`/superadmin/finance/payouts/${instituteId}`);
            if (res.data.success) {
                toast.success('Payout processed & recorded successfully!');
                fetchFinanceOverview(); 
            }
        } catch (error) {
            toast.error('Failed to process payout');
        }
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
                        Loading finance data...
                    </p>
                </div>
            </div>
        );
    }

    const { kpis, recentTransactions, pendingSettlements } = financeData;

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdAccountBalanceWallet style={{ width: 24, height: 24, color: C.success }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Revenue & Finance
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Real-time overview of platform earnings, subscriptions, and settlements.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 transition-colors cursor-pointer"
                        style={{
                            backgroundColor: C.btnViewAllBg,
                            color: C.btnViewAllText,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                    >
                        <MdFileDownload style={{ width: 18, height: 18, color: C.btnPrimary }}/> Export CSV
                    </button>
                </div>
            </div>

            {/* ── God Level KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdCurrencyRupee} 
                    value={`₹${(kpis.totalRevenue || 0).toLocaleString()}`} 
                    label="Total Platform Volume" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdShowChart} 
                    value={`₹${(kpis.mrr || 0).toLocaleString()}`} 
                    label="SaaS Earnings (MRR)" 
                    subtext={`${kpis.growth >= 0 ? '+' : '-'}${Math.abs(kpis.growth || 0)}%`}
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdAccessTime} 
                    value={`₹${(kpis.pendingPayouts || 0).toLocaleString()}`} 
                    label="Pending Settlements" 
                    iconBg="#FFF7ED" 
                    iconColor="#F59E0B" 
                />
                
                {/* Gateway Health - Custom Card to match original list UI */}
                <div className="p-6 flex flex-col justify-center relative overflow-hidden" 
                    style={{ backgroundColor: C.darkCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="absolute right-0 top-0 opacity-20 rounded-bl-full" style={{ width: 100, height: 100, background: `linear-gradient(to bottom right, ${C.btnPrimary}, transparent)` }}></div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textFaint, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                        Gateway Health
                    </p>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: '#ffffff' }}>
                                <MdCreditCard style={{ width: 16, height: 16, color: C.btnPrimary }}/> Stripe
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', backgroundColor: C.successBg, color: C.success }}>Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: '#ffffff' }}>
                                <MdCreditCard style={{ width: 16, height: 16, color: C.warning }}/> Razorpay
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', backgroundColor: C.successBg, color: C.success }}>Connected</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Left: Recent Global Transactions ── */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 pt-5 pb-1 flex justify-between items-start" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <SectionHeader icon={MdTrendingUp} title="Recent Platform Transactions" />
                        <button className="bg-transparent border-none cursor-pointer hover:underline" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                            View Ledger
                        </button>
                    </div>
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    {['Transaction ID', 'Institute / User', 'Type', 'Amount', 'Status'].map((header, idx) => (
                                        <th key={idx} style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            color: C.statLabel,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            padding: '16px 24px',
                                            borderBottom: `1px solid ${C.cardBorder}`,
                                            textAlign: header === 'Amount' ? 'right' : 'left'
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8">
                                            <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdTrendingUp style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Transactions</h3>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>No transactions available yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : recentTransactions.map((trx, idx) => (
                                    <tr key={idx} className="transition-colors"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td className="px-6 py-4">
                                            <span style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>{trx.transactionId}</span>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, margin: 0, marginTop: 4 }}>{new Date(trx.createdAt).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{trx.entityName}</span>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, margin: 0, marginTop: 2 }}>{trx.entityEmail}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                                textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                ...(trx.type === 'subscription' ? { backgroundColor: C.innerBg, color: C.btnPrimary } : { backgroundColor: C.warningBg, color: C.warning })
                                            }}>
                                                {trx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>
                                                ₹{trx.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {trx.status === 'successful' ? (
                                                <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success }}>
                                                    <MdCheckCircle style={{ width: 14, height: 14 }}/> Success
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.danger }}>
                                                    <MdWarning style={{ width: 14, height: 14 }}/> Failed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Right: Pending Institute Settlements ── */}
                <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 pt-5 pb-1" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <SectionHeader icon={MdAccessTime} title="Pending Payouts" />
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-[300px]">
                        {pendingSettlements.length === 0 ? (
                            <div className="p-14 text-center border border-dashed m-6" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.successBg, borderRadius: '10px' }}>
                                    <MdCheckCircle style={{ width: 28, height: 28, color: C.success, opacity: 0.8 }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>All Settled Up!</h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>No pending payouts to institutes.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {pendingSettlements.map((payout, idx) => (
                                    <div key={idx} className="p-4 transition-colors" 
                                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surfaceWhite} 
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center shrink-0" 
                                                    style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                                    <MdBusiness style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                                </div>
                                                <div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.2 }}>
                                                        {payout.instituteName}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.warning, margin: 0, marginTop: 4 }}>
                                                        ₹{payout.amount.toLocaleString()} Due
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleProcessPayout(payout.instituteId, payout.amount)}
                                                className="flex items-center justify-center transition-colors border-none cursor-pointer"
                                                style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.btnPrimary }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#ffffff'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.btnPrimary; }}
                                                title="Mark as Paid"
                                            >
                                                <MdOpenInNew style={{ width: 16, height: 16 }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}