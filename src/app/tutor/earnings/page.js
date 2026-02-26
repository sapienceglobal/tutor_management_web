'use client';

import { useState, useEffect } from 'react';
import { 
    DollarSign, 
    ArrowUpRight, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Building2,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EarningsPage() {
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({ totalEarnings: 0, pendingPayouts: 0 });
    const [loading, setLoading] = useState(true);
    const [requestModal, setRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        amount: '',
        accountHolderName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        upiId: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const sumRes = await api.get('/tutor/stats');
            const [payoutsRes] = await Promise.all([
                api.get('/tutors/payouts')
            ]);
            
            setPayouts(payoutsRes.data.payouts || []);
            
            if (sumRes.data.success) {
                // Approximate existing stats
                const total = sumRes.data.stats.totalEarnings || 0;
                setStats({
                    totalEarnings: total,
                    pendingPayouts: payoutsRes.data.payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((acc, curr) => acc + curr.amount, 0)
                });
            }
        } catch (error) {
            console.error('Failed to load earnings data:', error);
            // Ignore failure toast here so it doesn't annoy the user on fresh load without data
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                amount: Number(requestForm.amount),
                bankDetails: {
                    accountHolderName: requestForm.accountHolderName,
                    accountNumber: requestForm.accountNumber,
                    bankName: requestForm.bankName,
                    ifscCode: requestForm.ifscCode,
                    upiId: requestForm.upiId
                }
            };
            const res = await api.post('/tutors/payouts/request', payload);
            if (res.data.success) {
                toast.success('Payout requested successfully!');
                setRequestModal(false);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request payout');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[400px]">
            <Clock className="w-6 h-6 animate-spin mr-2" /> Loading earnings data...
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Earnings & Payouts</h1>
                    <p className="text-sm text-slate-500">Manage your revenue and withdraw funds.</p>
                </div>
                <Button 
                    onClick={() => setRequestModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Withdrawal
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-indigo-100 font-medium">Total Lifetime Earnings</p>
                                <p className="text-4xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-slate-500 font-medium">Pending Payouts</p>
                                <p className="text-4xl font-bold text-amber-500">₹{stats.pendingPayouts.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl">
                                <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">Withdrawal History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Amount</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Bank Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payouts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        No payout requests found.
                                    </td>
                                </tr>
                            ) : payouts.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-sm text-slate-600">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                        <div className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-slate-800">₹{p.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {p.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {p.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                            {(p.status === 'pending' || p.status === 'processing') && <Clock className="w-3 h-3 mr-1" />}
                                            <span className="capitalize">{p.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                            <div>
                                                <div className="font-medium">{p.bankDetails?.bankName || 'UPI'} - {p.bankDetails?.accountNumber?.slice(-4) || p.bankDetails.upiId}</div>
                                                <div className="text-xs text-slate-400">{p.bankDetails?.accountHolderName}</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Payout Modal */}
            {requestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Request Withdrawal</h2>
                            <button onClick={() => setRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 text-sm">
                            <div>
                                <label className="block text-slate-700 font-medium mb-1">Amount to Withdraw (₹)</label>
                                <input 
                                    type="number" 
                                    required 
                                    min="500"
                                    placeholder="Enter amount (min. ₹500)"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={requestForm.amount}
                                    onChange={e => setRequestForm({...requestForm, amount: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Bank Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={requestForm.bankName}
                                        onChange={e => setRequestForm({...requestForm, bankName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Account Holder</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={requestForm.accountHolderName}
                                        onChange={e => setRequestForm({...requestForm, accountHolderName: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Account Number</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={requestForm.accountNumber}
                                        onChange={e => setRequestForm({...requestForm, accountNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">IFSC Code</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={requestForm.ifscCode}
                                        onChange={e => setRequestForm({...requestForm, ifscCode: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-700 font-medium mb-1">UPI ID (Optional)</label>
                                <input 
                                    type="text" 
                                    placeholder="yourname@bank"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={requestForm.upiId}
                                    onChange={e => setRequestForm({...requestForm, upiId: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setRequestModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
