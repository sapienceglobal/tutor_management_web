'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Download,
    CircleDollarSign,
    Wallet,
    CheckCircle,
    Clock,
    MoreVertical,
    Calendar,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'due', label: 'Due' },
];

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
            <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Link href="/student/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">Payments</span>
                </nav>

                {/* Page title */}
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-7 h-7 text-indigo-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payments Overview */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">Payments Overview</h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadAllInvoices}
                                    disabled={downloadingAll || paymentsCompleted === 0}
                                    className="border-slate-200 gap-2"
                                >
                                    {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Download All
                                </Button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <CircleDollarSign className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Total Due</span>
                                        </div>
                                        <p className="text-xl font-bold text-red-600">₹{totalDue.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <Wallet className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Total Paid</span>
                                        </div>
                                        <p className="text-xl font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Payments Completed</span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900">{paymentsCompleted}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">Payments</span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900">{paymentsPending}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => { setStatusFilter(showDueOnly ? '' : 'due'); setCurrentPage(1); }}
                                    >
                                        View Due Payments
                                    </Button>
                                    <button type="button" className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1">
                                        <Download className="w-4 h-4" /> Save filter
                                    </button>
                                    <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-500">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">Payment History</h2>
                                <Button variant="outline" size="sm" onClick={handleDownloadAllInvoices} disabled={downloadingAll || paymentsCompleted === 0} className="border-slate-200 gap-2">
                                    {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Download All
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagePayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-slate-500">
                                                    No payments found.
                                                </td>
                                            </tr>
                                        ) : (
                                            pagePayments.map((payment) => (
                                                <tr key={payment._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="py-3 px-4 text-sm font-medium text-slate-800">{formatPaymentId(payment)}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-700">{getDescription(payment)}</td>
                                                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                            }`}
                                                        >
                                                            {payment.status === 'paid' ? 'Paid' : 'Due'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-600">
                                                        {payment.paidAt ? format(new Date(payment.paidAt), 'dd MMM yyyy') : format(new Date(payment.createdAt), 'dd MMM yyyy')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {payment.status === 'paid' && payment.invoiceNumber ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadInvoice(payment._id, payment.invoiceNumber)}
                                                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600"
                                                                title="Download invoice"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        ) : isDue(payment) && (payment.retryCount || 0) < 3 ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                                                disabled={retrying === payment._id}
                                                                onClick={() => handleRetryPayment(payment._id)}
                                                            >
                                                                {retrying === payment._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                            </Button>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredPayments.length > 0 && (
                                <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-sm text-slate-500">
                                        Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPayments.length)} out of {filteredPayments.length}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-200"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        >
                                            Prev
                                        </Button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                                            if (p < 1 || p > totalPages) return null;
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium ${
                                                        currentPage === p ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-200"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right sidebar - Filter */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900">Filter Payments</h3>
                                <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-500">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {STATUS_OPTIONS.map((o) => (
                                            <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <span className="text-xs text-slate-500">From</span>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="w-full mt-0.5 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <Calendar className="absolute right-2 bottom-2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        <div className="relative">
                                            <span className="text-xs text-slate-500">To</span>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="w-full mt-0.5 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <Calendar className="absolute right-2 bottom-2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={applyFilter}>
                                    Apply Filter
                                </Button>
                                <Button variant="outline" className="w-full border-slate-200" onClick={resetFilter}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
