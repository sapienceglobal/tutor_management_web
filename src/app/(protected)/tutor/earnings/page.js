'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign, Clock, CheckCircle, XCircle,
    Building2, Plus, Loader2, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

// ─── Shared input class ────────────────────────────────────────────────────────
const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors";

export default function EarningsPage() {
    const [payouts, setPayouts]       = useState([]);
    const [stats, setStats]           = useState({ totalEarnings: 0, pendingPayouts: 0 });
    const [loading, setLoading]       = useState(true);
    const [requestModal, setRequestModal] = useState(false);
    const [requestForm, setRequestForm]   = useState({
        amount: '', accountHolderName: '', accountNumber: '',
        bankName: '', ifscCode: '', upiId: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [sumRes, payoutsRes] = await Promise.all([
                api.get('/tutor/stats'),
                api.get('/tutors/payouts'),
            ]);
            const payoutList = payoutsRes.data.payouts || [];
            setPayouts(payoutList);
            if (sumRes.data.success) {
                setStats({
                    totalEarnings: sumRes.data.stats.totalEarnings || 0,
                    pendingPayouts: payoutList
                        .filter(p => p.status === 'pending' || p.status === 'processing')
                        .reduce((acc, p) => acc + p.amount, 0),
                });
            }
        } catch { /* silent on fresh load */ }
        finally { setLoading(false); }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post('/tutors/payouts/request', {
                amount: Number(requestForm.amount),
                bankDetails: {
                    accountHolderName: requestForm.accountHolderName,
                    accountNumber:     requestForm.accountNumber,
                    bankName:          requestForm.bankName,
                    ifscCode:          requestForm.ifscCode,
                    upiId:             requestForm.upiId,
                },
            });
            if (res.data.success) {
                toast.success('Payout requested successfully!');
                setRequestModal(false);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request payout');
        } finally { setSubmitting(false); }
    };

    const field = (key) => ({
        value: requestForm[key],
        onChange: (e) => setRequestForm(f => ({ ...f, [key]: e.target.value })),
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading earnings data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <DollarSign className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Earnings & Payouts</h1>
                        <p className="text-xs text-slate-400">Manage your revenue and withdraw funds</p>
                    </div>
                </div>
                <button onClick={() => setRequestModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity"
                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                    <Plus className="w-4 h-4" /> Request Withdrawal
                </button>
            </div>

            {/* ── Stat cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Earnings — dark themed */}
                <div className="rounded-xl overflow-hidden relative p-6"
                    style={{ backgroundColor: 'var(--theme-sidebar)' }}>
                    {/* Glow */}
                    <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full blur-3xl opacity-30"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 60%, transparent)' }} />
                    <div className="relative flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Total Lifetime Earnings</p>
                            <p className="text-4xl font-black text-white">₹{stats.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Pending Payouts */}
                <div className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payouts</p>
                            <p className="text-4xl font-black text-amber-500">₹{stats.pendingPayouts.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Withdrawal history ────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800">Withdrawal History</h2>
                </div>

                {/* Head */}
                <div className="grid grid-cols-[1fr_100px_120px_2fr] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                    {['Date', 'Amount', 'Status', 'Bank Details'].map(h => (
                        <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                    ))}
                </div>

                {payouts.length === 0 ? (
                    <div className="text-center py-14">
                        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}>
                            <DollarSign className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mb-1">No payout requests yet</p>
                        <p className="text-xs text-slate-400">Your withdrawal history will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {payouts.map(p => (
                            <div key={p._id}
                                className="grid grid-cols-[1fr_100px_120px_2fr] gap-4 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors">
                                {/* Date */}
                                <div>
                                    <p className="text-sm text-slate-700 font-medium">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    <p className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleTimeString()}</p>
                                </div>
                                {/* Amount */}
                                <span className="text-sm font-black text-slate-800">₹{p.amount.toLocaleString()}</span>
                                {/* Status */}
                                <div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border capitalize
                                        ${p.status === 'paid'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          p.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {p.status === 'paid'     && <CheckCircle className="w-3 h-3" />}
                                        {p.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                        {(p.status === 'pending' || p.status === 'processing') && <Clock className="w-3 h-3" />}
                                        {p.status}
                                    </span>
                                </div>
                                {/* Bank */}
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Building2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-700 truncate">
                                            {p.bankDetails?.bankName || 'UPI'} — {p.bankDetails?.accountNumber?.slice(-4) || p.bankDetails?.upiId}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">{p.bankDetails?.accountHolderName}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Request Payout Modal ───────────────────────────────────────── */}
            {requestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <DollarSign className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h2 className="text-base font-bold text-slate-800">Request Withdrawal</h2>
                            </div>
                            <button onClick={() => setRequestModal(false)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Amount to Withdraw (₹)</label>
                                <input type="number" required min="500"
                                    placeholder="Enter amount (min. ₹500)"
                                    className={inp} {...field('amount')} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Bank Name</label>
                                    <input type="text" required className={inp} {...field('bankName')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Account Holder</label>
                                    <input type="text" required className={inp} {...field('accountHolderName')} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Account Number</label>
                                    <input type="text" required className={inp} {...field('accountNumber')} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">IFSC Code</label>
                                    <input type="text" required className={inp} {...field('ifscCode')} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">UPI ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <input type="text" placeholder="yourname@bank" className={inp} {...field('upiId')} />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setRequestModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}