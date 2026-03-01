'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Receipt,
    Download,
    ArrowLeft,
    CreditCard,
    CheckCircle,
    BookOpen,
    Calendar,
    Search,
    FileText,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function PaymentsPage() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [retrying, setRetrying] = useState(null); // payment ID being retried

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await api.get('/payments/my-payments');
                if (res.data.success) {
                    setPayments(res.data.payments);
                }
            } catch (error) {
                console.error('Failed to load payments:', error);
                toast.error('Failed to load payment history');
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const handleDownloadInvoice = async (paymentId, invoiceNumber) => {
        try {
            const res = await api.get(`/payments/${paymentId}/invoice`, {
                responseType: 'blob',
            });

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
            console.error('Download invoice error:', error);
            toast.error('Failed to download invoice');
        }
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
                            toast.success('Payment successful! 🎉');
                            window.location.reload();
                        } catch (err) {
                            toast.error('Payment verification failed');
                        }
                    },
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Retry failed. Max attempts may have been reached.');
        } finally {
            setRetrying(null);
        }
    };

    const filteredPayments = payments.filter(p =>
        p.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
                                <p className="text-sm text-slate-500 mt-0.5">All your transactions and invoices</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Card className="border-slate-200">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Spent</p>
                                <p className="text-2xl font-bold text-slate-900">₹{totalSpent.toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Transactions</p>
                                <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Courses Purchased</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {payments.filter(p => p.type === 'course_purchase').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by course name or invoice number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    />
                </div>

                {/* Payment List */}
                {filteredPayments.length === 0 ? (
                    <div className="text-center py-16">
                        <Receipt className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No payments yet</h3>
                        <p className="text-slate-400 mt-1">Your payment history will appear here once you make a purchase.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPayments.map((payment) => (
                            <Card key={payment._id} className="border-slate-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0">
                                                {payment.courseId?.thumbnail && payment.courseId.thumbnail !== 'https://via.placeholder.com/400x250' ? (
                                                    <img src={payment.courseId.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <BookOpen className="w-5 h-5 text-indigo-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">
                                                    {payment.courseId?.title || 'Subscription Renewal'}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {payment.paidAt ? format(new Date(payment.paidAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {payment.invoiceNumber || 'N/A'}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payment.status === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : payment.status === 'failed'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {payment.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="text-lg font-bold text-slate-900">₹{payment.amount?.toFixed(2)}</span>
                                            {payment.status === 'paid' && payment.invoiceNumber && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(payment._id, payment.invoiceNumber)}
                                                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-1.5"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Invoice
                                                </Button>
                                            )}
                                            {payment.status === 'failed' && (payment.retryCount || 0) < 3 && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRetryPayment(payment._id)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                                                    disabled={retrying === payment._id}
                                                >
                                                    {retrying === payment._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="w-4 h-4" />
                                                    )}
                                                    Retry ({3 - (payment.retryCount || 0)} left)
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
