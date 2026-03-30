'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    DollarSign, Wallet, Clock, CheckCircle2, XCircle, Loader2,
    Plus, Download, TrendingUp, CircleAlert, Building2, RefreshCw, Ban,
    CreditCard, CalendarDays, TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R, FX } from '@/constants/tutorTokens';

const MIN_WITHDRAWAL = 500;
const CURRENCY = 'INR';

const fmtCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: CURRENCY,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const fmtDate = (value) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '-';
    }
};

const statusPillStyle = (status) => {
    if (status === 'paid') return { backgroundColor: C.successBg, borderColor: C.successBorder, color: C.success };
    if (status === 'rejected') return { backgroundColor: C.dangerBg, borderColor: C.dangerBorder, color: C.danger };
    if (status === 'processing') return { backgroundColor: FX.primary08, borderColor: FX.primary20, color: C.btnPrimary };
    return { backgroundColor: C.warningBg, borderColor: C.warningBorder, color: C.warning };
};

// Focus Handlers for Input
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

function StatCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
    const toneMap = {
        default: { bg: '#E3DFF8', color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const style = toneMap[tone] || toneMap.default;

    return (
        <div className="p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5" 
            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '120px' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', margin: 0 }}>
                    {title}
                </p>
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg, borderRadius: R.xl }}>
                    <Icon size={20} color={style.color} />
                </div>
            </div>
            <div className="mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: style.color === C.btnPrimary ? C.heading : style.color, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                {subtext && (
                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '6px 0 0 0' }}>
                        {subtext}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function EarningsPage() {
    const { confirmDialog } = useConfirm();

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payouts'
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [months, setMonths] = useState(6);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [payoutMethod, setPayoutMethod] = useState('bank');

    const [summary, setSummary] = useState({
        totalEarnings: 0, totalTransactions: 0, pendingAmount: 0, paidAmount: 0,
        rejectedAmount: 0, withdrawableBalance: 0, activeRequests: 0, minimumPayoutAmount: MIN_WITHDRAWAL,
    });
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [courseRevenue, setCourseRevenue] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [payouts, setPayouts] = useState([]);

    const [requestForm, setRequestForm] = useState({
        amount: '', accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', upiId: '',
    });

    useEffect(() => {
        fetchReport(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [months, statusFilter]);

    const fetchReport = async (initial = false) => {
        try {
            if (initial) setLoading(true);
            else setRefreshing(true);

            const res = await api.get('/tutors/payouts/report', {
                params: { months, status: statusFilter !== 'all' ? statusFilter : undefined },
            });

            if (!res.data?.success) {
                toast.error('Failed to load earnings report');
                return;
            }

            setSummary(res.data.summary || {});
            setMonthlyRevenue(res.data.monthlyRevenue || []);
            setCourseRevenue(res.data.courseRevenue || []);
            setRecentPayments(res.data.recentPayments || []);
            setPayouts(res.data.payouts || []);
        } catch (error) {
            console.error('Load earnings report error:', error);
            toast.error(error.response?.data?.message || 'Failed to load earnings report');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRequestPayout = async (e) => {
        e.preventDefault();
        const amount = Number(requestForm.amount);
        const minimum = summary.minimumPayoutAmount || MIN_WITHDRAWAL;
        if (!Number.isFinite(amount) || amount <= 0) return toast.error('Enter a valid amount');
        if (amount < minimum) return toast.error(`Minimum withdrawal amount is ${fmtCurrency(minimum)}`);
        if (amount > Number(summary.withdrawableBalance || 0)) return toast.error(`Amount exceeds withdrawable balance (${fmtCurrency(summary.withdrawableBalance)})`);

        const payload = {
            amount,
            bankDetails: payoutMethod === 'upi'
                ? { upiId: requestForm.upiId.trim() }
                : {
                    accountHolderName: requestForm.accountHolderName.trim(),
                    accountNumber: requestForm.accountNumber.trim(),
                    bankName: requestForm.bankName.trim(),
                    ifscCode: requestForm.ifscCode.trim().toUpperCase(),
                    upiId: requestForm.upiId.trim(),
                },
        };

        setSubmitting(true);
        try {
            const res = await api.post('/tutors/payouts/request', payload);
            if (!res.data?.success) return toast.error('Failed to submit payout request');

            toast.success('Payout request submitted');
            setRequestModalOpen(false);
            setRequestForm({ amount: '', accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', upiId: '' });
            fetchReport(false);
        } catch (error) {
            console.error('Request payout error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit payout request');
        } finally { setSubmitting(false); }
    };

    const handleCancelPayout = async (payout) => {
        const ok = await confirmDialog('Cancel Payout Request', `Cancel payout request of ${fmtCurrency(payout.amount)}?`, { variant: 'destructive' });
        if (!ok) return;
        try {
            const res = await api.patch(`/tutors/payouts/${payout._id}/cancel`);
            if (!res.data?.success) return toast.error('Failed to cancel request');
            toast.success('Payout request cancelled');
            fetchReport(false);
        } catch (error) {
            console.error('Cancel payout error:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel request');
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/tutors/payouts/export', { params: { months }, responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tutor-payout-report-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export payout report error:', error);
            toast.error(error.response?.data?.message || 'Failed to export report');
        } finally { setExporting(false); }
    };

    const revenueTrend = useMemo(() => {
        if (monthlyRevenue.length < 2) return null;
        const prev = Number(monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0);
        const curr = Number(monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0);
        if (prev <= 0) return null;
        return Number((((curr - prev) / prev) * 100).toFixed(1));
    }, [monthlyRevenue]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading financial data...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* ── Page Header & Action Bar ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Wallet size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Earnings & Payouts</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Manage revenue, withdrawals, and payment reports</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select value={months} onChange={(e) => setMonths(Number(e.target.value))} 
                        style={{ ...baseInputStyle, width: '160px', height: '40px', backgroundColor: '#E3DFF8' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value={6}>Last 6 months</option>
                        <option value={12}>Last 12 months</option>
                        <option value={18}>Last 18 months</option>
                    </select>

                    <button onClick={() => fetchReport(false)} disabled={refreshing} className="flex items-center justify-center w-10 h-10 cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                        <RefreshCw size={16} color={C.heading} className={refreshing ? "animate-spin" : ""} />
                    </button>

                    <button onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm shrink-0"
                        style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export Report
                    </button>
                </div>
            </div>

            {/* ── Main Tabs ────────────────────────────────────────────────────── */}
            <div className="flex gap-2 p-1 w-full sm:w-max" style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                {[{ id: 'overview', label: 'Earnings Overview', icon: TrendingUp }, { id: 'payouts', label: 'Payout Requests', icon: CreditCard }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-all"
                        style={{
                            backgroundColor: activeTab === tab.id ? C.surfaceWhite : 'transparent',
                            color: activeTab === tab.id ? C.btnPrimary : C.textMuted,
                            borderRadius: R.lg, boxShadow: activeTab === tab.id ? S.card : 'none',
                            fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily
                        }}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                TAB 1: EARNINGS OVERVIEW
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Earnings" value={fmtCurrency(summary.totalEarnings)} subtext={`${summary.totalTransactions || 0} successful payments`} icon={DollarSign} />
                        <StatCard title="Withdrawable Balance" value={fmtCurrency(summary.withdrawableBalance)} subtext={`Min payout: ${fmtCurrency(summary.minimumPayoutAmount || MIN_WITHDRAWAL)}`} icon={Wallet} tone="success" />
                        <StatCard title="Pending Payouts" value={fmtCurrency(summary.pendingAmount)} subtext={`${summary.activeRequests || 0} active request(s)`} icon={Clock} tone={(summary.pendingAmount || 0) > 0 ? 'warning' : 'default'} />
                        <StatCard title="Total Paid Out" value={fmtCurrency(summary.paidAmount)} subtext="Successfully transferred" icon={CheckCircle2} tone="success" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Revenue Trend / Bar Chart Approximation */}
                        <div className="lg:col-span-2 overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                                <div>
                                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Earnings Trend</h2>
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Revenue over selected period</p>
                                </div>
                                {revenueTrend !== null && (
                                    <span style={{ 
                                        backgroundColor: revenueTrend >= 0 ? C.successBg : C.dangerBg, color: revenueTrend >= 0 ? C.success : C.danger, 
                                        border: `1px solid ${revenueTrend >= 0 ? C.successBorder : C.dangerBorder}`,
                                        padding: '4px 10px', borderRadius: R.full, fontSize: '10px', fontWeight: T.weight.black, display: 'flex', alignItems: 'center', gap: '4px' 
                                    }}>
                                        {revenueTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {Math.abs(revenueTrend)}% vs Last Month
                                    </span>
                                )}
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-end min-h-[300px]">
                                {monthlyRevenue.length > 0 ? (
                                    <div className="flex items-end justify-between gap-2 h-full pt-8 relative">
                                        {/* Simple CSS Bar Chart implementation */}
                                        {monthlyRevenue.map((row) => {
                                            const maxRev = Math.max(...monthlyRevenue.map(r => Number(r.revenue || 0)), 1);
                                            const heightPct = Math.max(5, (Number(row.revenue || 0) / maxRev) * 100);
                                            return (
                                                <div key={row.monthKey} className="flex flex-col items-center gap-2 w-full group">
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, position: 'absolute', top: 0 }}>{fmtCurrency(row.revenue)}</span>
                                                    <div className="w-full max-w-[40px] rounded-t-xl transition-all duration-500 hover:opacity-80" 
                                                        style={{ height: `${heightPct}%`, background: C.gradientBtn, minHeight: '10px' }} />
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>{row.monthLabel.split(' ')[0]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No revenue data available.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Payments (Students) */}
                        <div className="lg:col-span-1 overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Recent Payments</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Latest student transactions</p>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[300px] custom-scrollbar space-y-3">
                                {recentPayments.length > 0 ? (
                                    recentPayments.slice(0, 10).map((payment) => (
                                        <div key={payment._id} className="flex items-center justify-between p-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ backgroundColor: C.btnPrimary }}>
                                                    {payment.student?.name?.[0]?.toUpperCase() || 'S'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{payment.student?.name || 'Student'}</p>
                                                    <p className="truncate" style={{ fontSize: '10px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{fmtDate(payment.paidAt)}</p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.success }}>+{fmtCurrency(payment.amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No recent payments.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                TAB 2: PAYOUT REQUESTS
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'payouts' && (
                <div className="space-y-6">
                    {/* Action Bar for Payouts */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                            {['all', 'pending', 'processing', 'paid', 'rejected'].map(status => (
                                <button key={status} onClick={() => setStatusFilter(status)}
                                    className="px-4 py-2 cursor-pointer border-none transition-all shrink-0 capitalize"
                                    style={{
                                        backgroundColor: statusFilter === status ? C.btnPrimary : '#E3DFF8',
                                        color: statusFilter === status ? '#fff' : C.textMuted,
                                        borderRadius: R.xl,
                                        fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily,
                                        boxShadow: statusFilter === status ? S.card : 'none'
                                    }}>
                                    {status}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setRequestModalOpen(true)} disabled={Number(summary.withdrawableBalance || 0) < (summary.minimumPayoutAmount || MIN_WITHDRAWAL)}
                            className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto disabled:opacity-50"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <Plus size={16} /> Request Payout
                        </button>
                    </div>

                    {/* Payouts List Table */}
                    <div className="overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="min-w-[900px]">
                            <div className="grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1.5fr_1fr] gap-4 px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                                {['Date Requested', 'Payment Method', 'Amount', 'Status', 'Details', 'Action'].map((h, i) => (
                                    <span key={i} className={i === 5 ? 'text-right' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                                ))}
                            </div>

                            {payouts.length > 0 ? (
                                <div className="flex flex-col">
                                    {payouts.map((payout, idx) => (
                                        <div key={payout._id} className="grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1.5fr_1fr] gap-4 px-6 py-4 items-center transition-colors hover:bg-white/50" 
                                            style={{ borderBottom: idx !== payouts.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                            
                                            <div className="flex items-center gap-2">
                                                <CalendarDays size={16} color={C.textMuted} />
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{fmtDate(payout.createdAt)}</span>
                                            </div>

                                            <div>
                                                <span className="flex items-center gap-2 px-3 py-1.5 w-fit" style={{ backgroundColor: '#E3DFF8', borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, border: `1px solid ${C.cardBorder}` }}>
                                                    <CreditCard size={14} color={C.btnPrimary} />
                                                    {payout.bankDetails?.upiId ? 'UPI Transfer' : 'Bank Transfer'}
                                                </span>
                                            </div>

                                            <div>
                                                <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>{fmtCurrency(payout.amount)}</span>
                                            </div>

                                            <div>
                                                <span style={{ ...statusPillStyle(payout.status), padding: '4px 10px', borderRadius: R.md, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase' }}>
                                                    {payout.status}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="truncate" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                                    {payout.bankDetails?.upiId ? `UPI: ${payout.bankDetails.upiId}` : `A/C: ****${String(payout.bankDetails?.accountNumber || '').slice(-4)}`}
                                                </p>
                                                {payout.transactionId && (
                                                    <p className="truncate" style={{ fontSize: '10px', fontWeight: T.weight.medium, color: C.success, margin: 0 }}>Txn: {payout.transactionId}</p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                {payout.status === 'pending' ? (
                                                    <button onClick={() => handleCancelPayout(payout)} className="h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                                        style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.dangerBorder}` }}>
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <span style={{ color: C.textMuted }}>—</span>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <Building2 size={40} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No payout requests found</p>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Adjust filters or request a new payout.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Request Payout Modal ────────────────────────────────────────── */}
            {requestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-lg p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h3 className="flex items-center gap-2" style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                <Wallet size={20} color={C.btnPrimary} /> Request Payout
                            </h3>
                            <button onClick={() => setRequestModalOpen(false)} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center" style={{ width: '32px', height: '32px', backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                <XCircle size={16} color={C.heading} />
                            </button>
                        </div>

                        <form onSubmit={handleRequestPayout} className="space-y-5">
                            <div className="p-4 flex items-center justify-between" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Available Balance</p>
                                    <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.success, margin: 0 }}>{fmtCurrency(summary.withdrawableBalance)}</p>
                                </div>
                                <div className="text-right">
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Min. Withdrawal</p>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{fmtCurrency(summary.minimumPayoutAmount || MIN_WITHDRAWAL)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Amount to Withdraw (INR) *</label>
                                <input type="number" min={summary.minimumPayoutAmount || MIN_WITHDRAWAL} max={Math.floor(Number(summary.withdrawableBalance || 0))} step="0.01" required
                                    value={requestForm.amount} onChange={(e) => setRequestForm(p => ({ ...p, amount: e.target.value }))}
                                    placeholder="Enter amount" style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.btnPrimary }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>

                            <div className="space-y-3">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Payout Method *</label>
                                <div className="flex items-center gap-3">
                                    {['bank', 'upi'].map(method => (
                                        <button key={method} type="button" onClick={() => setPayoutMethod(method)} className="flex-1 h-12 cursor-pointer border-none transition-all uppercase"
                                            style={{
                                                backgroundColor: payoutMethod === method ? C.btnPrimary : '#E3DFF8',
                                                color: payoutMethod === method ? '#fff' : C.textMuted,
                                                borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily,
                                                boxShadow: payoutMethod === method ? S.card : 'none'
                                            }}>
                                            {method === 'bank' ? 'Bank Transfer' : 'UPI'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 space-y-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                {payoutMethod === 'bank' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1"><label style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Bank Name *</label><input required placeholder="e.g. HDFC Bank" value={requestForm.bankName} onChange={e => setRequestForm(p => ({ ...p, bankName: e.target.value }))} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} /></div>
                                        <div className="space-y-1"><label style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Account Holder *</label><input required placeholder="Name on account" value={requestForm.accountHolderName} onChange={e => setRequestForm(p => ({ ...p, accountHolderName: e.target.value }))} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} /></div>
                                        <div className="space-y-1"><label style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Account Number *</label><input required placeholder="Account No." value={requestForm.accountNumber} onChange={e => setRequestForm(p => ({ ...p, accountNumber: e.target.value }))} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} /></div>
                                        <div className="space-y-1"><label style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>IFSC Code *</label><input required placeholder="IFSC Code" value={requestForm.ifscCode} onChange={e => setRequestForm(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} /></div>
                                        <div className="sm:col-span-2 space-y-1"><label style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>UPI ID (Optional)</label><input placeholder="example@bank" value={requestForm.upiId} onChange={e => setRequestForm(p => ({ ...p, upiId: e.target.value }))} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} /></div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>UPI ID *</label>
                                        <input required placeholder="example@bank" value={requestForm.upiId} onChange={e => setRequestForm(p => ({ ...p, upiId: e.target.value }))} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button type="button" onClick={() => setRequestModalOpen(false)} className="px-6 py-2.5 cursor-pointer bg-transparent border-none hover:opacity-70" style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>Cancel</button>
                                <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md" style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}