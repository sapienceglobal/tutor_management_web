'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    MdArticle,
    MdDownload,
    MdAttachMoney,
    MdAccountBalanceWallet,
    MdCheckCircle,
    MdAccessTime,
    MdMoreVert,
    MdCalendarToday,
    MdHourglassEmpty,
    MdRefresh,
    MdChevronLeft,
    MdChevronRight
} from 'react-icons/md';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx } from '@/constants/studentTokens';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'due', label: 'Due' },
];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

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

// Format payment ID for display (e.g. #SAP9324)
function formatPaymentId(payment) {
    if (payment.invoiceNumber) {
        const digits = payment.invoiceNumber.replace(/\D/g, '');
        return `#SAP${digits.slice(-4)}`;
    }
    const id = payment._id?.toString() || '';
    return `#SAP${id.slice(-4)}`;
}

function getDescription(payment) {
    if (payment.type === 'institute_fee') return payment.title || 'Institute Fee';
    if (payment.courseId?.title) return payment.courseId.title;
    if (payment.type === 'subscription_renewal') return 'Subscription Renewal';
    return 'Course Payment';
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [retrying, setRetrying] = useState(null);
    const [downloadingAll, setDownloadingAll] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payments/all');
            if (res.data.success) setPayments(res.data.payments || []);
        } catch (error) {
            console.error('Failed to load payments:', error);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (paymentId, invoiceNumber) => {
        try {
            const res = await api.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Invoice downloaded!');
        } catch (error) {
            toast.error('Failed to download invoice');
        }
    };

    const handleDownloadAllInvoices = async () => {
        const paidOnPage = filteredPayments
            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            .filter((p) => p.status === 'paid' && p.invoiceNumber);
        if (paidOnPage.length === 0) {
            toast('No paid invoices on this page to download');
            return;
        }
        setDownloadingAll(true);
        for (let i = 0; i < paidOnPage.length; i++) {
            await handleDownloadInvoice(paidOnPage[i]._id, paidOnPage[i].invoiceNumber);
            if (i < paidOnPage.length - 1) await new Promise((r) => setTimeout(r, 400));
        }
        setDownloadingAll(false);
        toast.success(`Downloaded ${paidOnPage.length} invoice(s)`);
    };

    const handleRetryPayment = async (paymentId) => {
        setRetrying(paymentId);
        try {
            const res = await api.post(`/payments/${paymentId}/retry`);
            if (res.data.success && res.data.razorpayOrder) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: res.data.razorpayOrder.amount,
                    currency: res.data.razorpayOrder.currency,
                    name: 'Sapience LMS',
                    description: 'Payment Retry',
                    order_id: res.data.razorpayOrder.id,
                    handler: async function (response) {
                        try {
                            await api.post('/payments/verify', {
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            });
                            toast.success('Payment successful!');
                            fetchPayments();
                        } catch (err) {
                            toast.error('Payment verification failed');
                        }
                    },
                };
                if (typeof window !== 'undefined' && window.Razorpay) {
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                } else toast.error('Payment gateway not loaded');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Retry failed');
        } finally {
            setRetrying(null);
        }
    };

    const isDue = (p) => p.status === 'created' || p.status === 'failed';
    const totalDue = payments.filter(isDue).reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
    const paymentsCompleted = payments.filter((p) => p.status === 'paid').length;
    const paymentsPending = payments.filter(isDue).length;

    let filteredPayments = payments.filter((p) => {
        const matchSearch =
            !searchTerm ||
            getDescription(p).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            formatPaymentId(p).toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (statusFilter === 'paid' && p.status !== 'paid') return false;
        if (statusFilter === 'due' && !isDue(p)) return false;
        if (dateFrom || dateTo) {
            const d = p.paidAt ? parseISO(p.paidAt) : parseISO(p.createdAt);
            const date = startOfDay(d);
            if (dateFrom && date < startOfDay(new Date(dateFrom))) return false;
            if (dateTo && date > endOfDay(new Date(dateTo))) return false;
        }
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
    const pagePayments = filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const showDueOnly = statusFilter === 'due';

    const applyFilter = () => {
        setCurrentPage(1);
    };
    const resetFilter = () => {
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
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
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBox, borderRadius: '10px' }}>
                        <MdArticle style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: '0 0 4px 0' }}>
                            Payments
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>
                            View your payment history and download invoices
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Payments Overview */}
                    <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                            <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Payments Overview</h2>
                            <button
                                onClick={handleDownloadAllInvoices}
                                disabled={downloadingAll || paymentsCompleted === 0}
                                className="flex items-center gap-2 px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
                                style={{ ...cx.btnSecondary(), borderRadius: '10px', fontSize: T.size.xs }}
                            >
                                {downloadingAll ? <MdHourglassEmpty className="w-4 h-4 animate-spin" /> : <MdDownload className="w-4 h-4" />}
                                Download All
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                                <div className="p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: C.dangerBg, borderRadius: '10px' }}>
                                            <MdAttachMoney className="w-5 h-5" style={{ color: C.danger }} />
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted }}>Total Due</span>
                                    </div>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.danger, margin: 0 }}>₹{totalDue.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: C.successBg, borderRadius: '10px' }}>
                                            <MdAccountBalanceWallet className="w-5 h-5" style={{ color: C.success }} />
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted }}>Total Paid</span>
                                    </div>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.success, margin: 0 }}>₹{totalPaid.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: '#EEF2FF', borderRadius: '10px' }}>
                                            <MdCheckCircle className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted }}>Payments Completed</span>
                                    </div>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{paymentsCompleted}</p>
                                </div>
                                <div className="p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: C.warningBg, borderRadius: '10px' }}>
                                            <MdAccessTime className="w-5 h-5" style={{ color: C.warning }} />
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted }}>Payments Pending</span>
                                    </div>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{paymentsPending}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => { setStatusFilter(showDueOnly ? '' : 'due'); setCurrentPage(1); }}
                                    className="px-5 py-2.5 cursor-pointer transition-opacity hover:opacity-90 border-none"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', boxShadow: S.btn, fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                                >
                                    View Due Payments
                                </button>
                                <button type="button" className="inline-flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80 bg-transparent border-none"
                                    style={{ color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.semibold, fontFamily: T.fontFamily }}>
                                    <MdDownload className="w-4 h-4" /> Save filter
                                </button>
                                <button type="button" className="p-1.5 cursor-pointer border-none transition-colors"
                                    style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '8px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <MdMoreVert className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                            <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Payment History</h2>
                            <button
                                onClick={handleDownloadAllInvoices}
                                disabled={downloadingAll || paymentsCompleted === 0}
                                className="flex items-center gap-2 px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
                                style={{ ...cx.btnSecondary(), borderRadius: '10px', fontSize: T.size.xs }}
                            >
                                {downloadingAll ? <MdHourglassEmpty className="w-4 h-4 animate-spin" /> : <MdDownload className="w-4 h-4" />}
                                Download All
                            </button>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                        {['ID', 'Description', 'Amount', 'Status', 'Date', 'Invoice'].map(h => (
                                            <th key={h} className="py-3 px-4" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagePayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center" style={{ fontSize: T.size.base, color: C.textMuted, fontWeight: T.weight.semibold }}>
                                                No payments found.
                                            </td>
                                        </tr>
                                    ) : (
                                        pagePayments.map((payment) => (
                                            <tr key={payment._id} className="transition-colors hover:bg-slate-50" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <td className="py-3 px-4" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>{formatPaymentId(payment)}</td>
                                                <td className="py-3 px-4" style={{ fontSize: T.size.sm, color: C.text }}>{getDescription(payment)}</td>
                                                <td className="py-3 px-4" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-wider`}
                                                        style={{
                                                            backgroundColor: payment.status === 'paid' ? C.successBg : C.dangerBg,
                                                            color: payment.status === 'paid' ? C.success : C.danger,
                                                            border: `1px solid ${payment.status === 'paid' ? C.successBorder : C.dangerBorder}`,
                                                            fontWeight: T.weight.bold,
                                                            borderRadius: '8px'
                                                        }}
                                                    >
                                                        {payment.status === 'paid' ? 'Paid' : 'Due'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4" style={{ fontSize: T.size.sm, color: C.text }}>
                                                    {payment.paidAt ? format(new Date(payment.paidAt), 'dd MMM yyyy') : format(new Date(payment.createdAt), 'dd MMM yyyy')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {payment.status === 'paid' && payment.invoiceNumber ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadInvoice(payment._id, payment.invoiceNumber)}
                                                            className="p-2 transition-colors cursor-pointer border-none bg-transparent"
                                                            style={{ color: C.textMuted, borderRadius: '8px' }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.btnPrimary; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
                                                            title="Download invoice"
                                                        >
                                                            <MdDownload className="w-4 h-4" />
                                                        </button>
                                                    ) : isDue(payment) ? (
                                                        <button
                                                            className="flex items-center gap-1.5 px-4 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: '11px', fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                                                            disabled={retrying === payment._id}
                                                            onClick={() => handleRetryPayment(payment._id)}
                                                        >
                                                            {retrying === payment._id ? <MdHourglassEmpty className="w-4 h-4 animate-spin" /> : <MdAccountBalanceWallet className="w-4 h-4" />}
                                                            Pay
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: C.textMuted }}>—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {filteredPayments.length > 0 && (
                            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                                <p style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.semibold, margin: 0 }}>
                                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPayments.length)} out of {filteredPayments.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex items-center justify-center w-8 h-8 cursor-pointer disabled:opacity-40 transition-colors"
                                        style={{ ...cx.btnSecondary(), borderRadius: '10px' }}
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    >
                                        <MdChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                                        if (p < 1 || p > totalPages) return null;
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setCurrentPage(p)}
                                                className="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors border-none"
                                                style={currentPage === p
                                                    ? { backgroundColor: C.btnPrimary, color: '#fff', fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', boxShadow: S.card }
                                                    : { backgroundColor: 'transparent', color: C.textMuted, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px' }}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                    <button
                                        className="flex items-center justify-center w-8 h-8 cursor-pointer disabled:opacity-40 transition-colors"
                                        style={{ ...cx.btnSecondary(), borderRadius: '10px' }}
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    >
                                        <MdChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right sidebar - Filter */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Filter Payments</h3>
                            <button type="button" className="p-1.5 cursor-pointer border-none transition-colors bg-transparent"
                                style={{ color: C.textMuted, borderRadius: '8px' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <MdRefresh className="w-5 h-5" onClick={resetFilter} title="Reset Filter" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label style={{ display: 'block', fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ ...baseInputStyle, cursor: 'pointer', height: '44px' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                >
                                    {STATUS_OPTIONS.map((o) => (
                                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Date Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, display: 'block', marginBottom: '2px' }}>From</span>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            style={{ ...baseInputStyle, paddingRight: '12px', height: '44px' }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        />
                                    </div>
                                    <div className="relative">
                                        <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, display: 'block', marginBottom: '2px' }}>To</span>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            style={{ ...baseInputStyle, paddingRight: '12px', height: '44px' }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <button className="w-full py-3 cursor-pointer transition-opacity hover:opacity-90 border-none"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', boxShadow: S.btn, fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                                onClick={applyFilter}>
                                Apply Filter
                            </button>
                            <button className="w-full py-3 cursor-pointer transition-all hover:opacity-80"
                                style={{ ...cx.btnSecondary(), borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                onClick={resetFilter}>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}