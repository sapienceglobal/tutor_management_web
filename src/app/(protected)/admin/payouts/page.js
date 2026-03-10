'use client';

import { useState, useEffect } from 'react';
import { 
    CreditCard, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Search,
    Building2,
    History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payoutRouteBase, setPayoutRouteBase] = useState('/admin/payouts');
    const [actionModal, setActionModal] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            let res;
            try {
                res = await api.get('/admin/payouts');
                setPayoutRouteBase('/admin/payouts');
            } catch (error) {
                if (error.response?.status === 404) {
                    // Backward compatibility for older backend route naming
                    res = await api.get('/admin/payout-requests');
                    setPayoutRouteBase('/admin/payout-requests');
                } else {
                    throw error;
                }
            }

            if (res.data.success) {
                setPayouts(res.data.payouts || []);
            }
        } catch (error) {
            console.error('Failed to load payouts:', error);
            toast.error('Failed to load payout requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                status: actionModal.type,
                adminNotes
            };
            if (actionModal.type === 'paid') {
                payload.transactionId = transactionId;
            }

            const res = await api.put(`${payoutRouteBase}/${actionModal.payout._id}`, payload);
            
            if (res.data.success) {
                toast.success(`Payout marked as ${actionModal.type}`);
                setActionModal(null);
                setAdminNotes('');
                setTransactionId('');
                fetchPayouts();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update payout');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPayouts = payouts.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'pending') return p.status === 'pending' || p.status === 'processing';
        return p.status === filter;
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[400px]">
            <Clock className="w-6 h-6 animate-spin mr-2" /> Loading payout requests...
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payout Management</h1>
                    <p className="text-sm text-slate-500">Review and process tutor withdrawal requests.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['pending', 'paid', 'rejected', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                                filter === f 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                <th className="p-4 font-medium">Tutor</th>
                                <th className="p-4 font-medium">Amount & Date</th>
                                <th className="p-4 font-medium">Bank Details</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No {filter !== 'all' ? filter : ''} payout requests found.
                                    </td>
                                </tr>
                            ) : filteredPayouts.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                {p.tutorId?.userId?.profileImage ? (
                                                    <img src={p.tutorId.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-slate-500 font-bold">{p.tutorId?.userId?.name?.charAt(0) || 'T'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{p.tutorId?.userId?.name || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500">{p.tutorId?.userId?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 text-lg">₹{p.amount.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start text-sm text-slate-700">
                                            <Building2 className="w-4 h-4 mr-2 text-slate-400 mt-0.5" />
                                            <div>
                                                {p.bankDetails?.bankName ? (
                                                    <>
                                                        <div className="font-medium">{p.bankDetails.bankName}</div>
                                                        <div className="text-slate-500">{p.bankDetails.accountNumber} ({p.bankDetails.ifscCode})</div>
                                                        <div className="text-xs text-slate-400">Holder: {p.bankDetails.accountHolderName}</div>
                                                    </>
                                                ) : p.bankDetails?.upiId ? (
                                                    <div className="font-medium">UPI: {p.bankDetails.upiId}</div>
                                                ) : <span className="text-slate-400">No Details</span>}
                                            </div>
                                        </div>
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
                                        {p.status === 'paid' && p.transactionId && (
                                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]" title={p.transactionId}>
                                                Txn: {p.transactionId}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {(p.status === 'pending' || p.status === 'processing') && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    onClick={() => setActionModal({ type: 'paid', payout: p })}
                                                >
                                                    Mark Paid
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => setActionModal({ type: 'rejected', payout: p })}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className={`p-6 border-b flex justify-between items-center ${
                            actionModal.type === 'paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                        }`}>
                            <h2 className={`text-xl font-bold ${actionModal.type === 'paid' ? 'text-emerald-800' : 'text-red-800'}`}>
                                {actionModal.type === 'paid' ? 'Confirm Payment' : 'Reject Request'}
                            </h2>
                            <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 font-medium">Amount:</span>
                                <span className="text-xl font-bold text-slate-900">₹{actionModal.payout.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-slate-600 font-medium">Tutor:</span>
                                <span className="text-slate-900">{actionModal.payout.tutorId?.userId?.name}</span>
                            </div>
                        </div>

                        <form onSubmit={handleAction} className="p-6 space-y-4 text-sm">
                            {actionModal.type === 'paid' && (
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Transaction ID / Reference No.</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. UTR12345678"
                                        className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={transactionId}
                                        onChange={e => setTransactionId(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Provide this as proof of bank transfer.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-slate-700 font-medium mb-1">Admin Note {actionModal.type === 'rejected' && '(Required)'}</label>
                                <textarea 
                                    required={actionModal.type === 'rejected'}
                                    rows="3"
                                    placeholder={actionModal.type === 'rejected' ? 'Reason for rejection...' : 'Optional comment for tutor...'}
                                    className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${
                                        actionModal.type === 'paid' ? 'border-emerald-200 focus:ring-emerald-500' : 'border-red-200 focus:ring-red-500'
                                    }`}
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
                                <Button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className={actionModal.type === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                                >
                                    {submitting ? 'Processing...' : actionModal.type === 'paid' ? 'Confirm Transfer' : 'Reject Request'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
