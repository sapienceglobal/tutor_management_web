'use client';

import { useState, useEffect } from 'react';
import { 
    CreditCard, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Search,
    Building2,
    Wallet,
    CheckCircle2,
    X,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payoutRouteBase, setPayoutRouteBase] = useState('/admin/payouts');
    const [actionModal, setActionModal] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('pending');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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

            if (res.data?.success) {
                setPayouts(res.data.payouts || []);
            } else {
                // Mock Data for UI testing if DB is empty
                setPayouts([
                    { _id: '1', tutorId: { userId: { name: 'Rahul Sharma', email: 'rahul@example.com' } }, amount: 12500, status: 'pending', createdAt: new Date(), bankDetails: { bankName: 'HDFC Bank', accountNumber: 'XXXX1234', ifscCode: 'HDFC0001', accountHolderName: 'Rahul Sharma' } },
                    { _id: '2', tutorId: { userId: { name: 'Priya Verma', email: 'priya@example.com' } }, amount: 8400, status: 'paid', createdAt: new Date(Date.now() - 86400000), transactionId: 'UTR987654321', bankDetails: { upiId: 'priya@okhdfc' } },
                    { _id: '3', tutorId: { userId: { name: 'Amit Singh', email: 'amit@example.com' } }, amount: 4200, status: 'rejected', createdAt: new Date(Date.now() - 172800000), bankDetails: { bankName: 'SBI Bank', accountNumber: 'XXXX9876', ifscCode: 'SBIN0002', accountHolderName: 'Amit Singh' } },
                ]);
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

    // Stats Calculations
    const totalPending = payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((acc, curr) => acc + curr.amount, 0);
    const totalPaid = payouts.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

    if (loading) {
        return (
            <div className="flex bg-[#F1EAFB] min-h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="mb-2">
                <h1 className="text-[22px] font-black text-[#27225B] m-0">Payout Management</h1>
                <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Review and process instructor withdrawal requests</p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="w-[52px] h-[52px] bg-[#FFF7ED] rounded-xl flex items-center justify-center text-[#FC8730] shrink-0 border border-[#FDBA74]">
                        <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-1">Pending Requests</span>
                        <h2 className="text-[28px] font-black text-[#27225B] m-0 leading-none">₹{totalPending.toLocaleString('en-IN')}</h2>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="w-[52px] h-[52px] bg-[#ECFDF5] rounded-xl flex items-center justify-center text-[#4ABCA8] shrink-0 border border-[#A7F3D0]">
                        <CheckCircle2 size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-1">Total Paid Out</span>
                        <h2 className="text-[28px] font-black text-[#27225B] m-0 leading-none">₹{totalPaid.toLocaleString('en-IN')}</h2>
                    </div>
                </div>
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="bg-white rounded-3xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                
                {/* Table Toolbar & Filters */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                        <input 
                            type="text" 
                            placeholder="Search by instructor name..." 
                            className="pl-10 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]" 
                        />
                    </div>
                    
                    {/* Custom Styled Filter Tabs */}
                    <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
                        {['pending', 'paid', 'rejected', 'all'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 text-[13px] font-bold rounded-lg capitalize transition-all whitespace-nowrap border-none cursor-pointer ${
                                    filter === f 
                                    ? 'bg-white text-[#6B4DF1] shadow-sm' 
                                    : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto px-6 pb-2">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-[#F4F0FD] rounded-xl">
                            <tr>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase first:rounded-l-xl">Instructor</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Amount & Date</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Bank Details</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Status</th>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase text-center last:rounded-r-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {filteredPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <Wallet className="w-12 h-12 text-[#D1C4F9] mx-auto mb-3" />
                                        <p className="text-[14px] font-bold text-[#7D8DA6] m-0">
                                            No {filter !== 'all' ? filter : ''} payout requests found.
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredPayouts.map(p => (
                                <tr key={p._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-[10px] bg-[#E9DFFC] text-[#6B4DF1] flex items-center justify-center font-bold text-[14px] shrink-0 border border-[#D1C4F9] overflow-hidden">
                                                {p.tutorId?.userId?.profileImage ? (
                                                    <img src={p.tutorId.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    p.tutorId?.userId?.name?.charAt(0).toUpperCase() || 'T'
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[14px] font-bold text-[#27225B] m-0">{p.tutorId?.userId?.name || 'Unknown'}</p>
                                                <p className="text-[12px] font-medium text-[#A0ABC0] m-0 mt-0.5">{p.tutorId?.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[16px] font-black text-[#27225B]">₹{p.amount.toLocaleString('en-IN')}</span>
                                            <span className="text-[12px] font-medium text-[#7D8DA6] mt-0.5">{new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-start gap-2 bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC] w-fit">
                                            <Building2 className="w-4 h-4 text-[#6B4DF1] shrink-0 mt-0.5" />
                                            <div className="flex flex-col">
                                                {p.bankDetails?.bankName ? (
                                                    <>
                                                        <span className="text-[13px] font-bold text-[#27225B] leading-tight">{p.bankDetails.bankName}</span>
                                                        <span className="text-[11px] font-semibold text-[#7D8DA6] leading-tight mt-0.5">A/C: {p.bankDetails.accountNumber}</span>
                                                        <span className="text-[10px] font-medium text-[#A0ABC0] leading-tight mt-0.5">IFSC: {p.bankDetails.ifscCode}</span>
                                                    </>
                                                ) : p.bankDetails?.upiId ? (
                                                    <span className="text-[13px] font-bold text-[#27225B] leading-tight">UPI: {p.bankDetails.upiId}</span>
                                                ) : (
                                                    <span className="text-[12px] font-medium text-[#FC8730] italic">No Details Provided</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider border ${
                                                p.status === 'paid' ? 'bg-[#ECFDF5] text-[#4ABCA8] border-[#A7F3D0]' :
                                                p.status === 'rejected' ? 'bg-[#FEE2E2] text-[#E53E3E] border-[#FECACA]' :
                                                'bg-[#FFF7ED] text-[#FC8730] border-[#FDBA74]'
                                            }`}>
                                                {p.status === 'paid' && <CheckCircle size={14} strokeWidth={3} />}
                                                {p.status === 'rejected' && <XCircle size={14} strokeWidth={3} />}
                                                {(p.status === 'pending' || p.status === 'processing') && <Clock size={14} strokeWidth={3} />}
                                                {p.status}
                                            </span>
                                            {p.status === 'paid' && p.transactionId && (
                                                <span className="text-[10px] font-bold text-[#A0ABC0] bg-[#F4F0FD] px-2 py-0.5 rounded" title={p.transactionId}>
                                                    Txn: {p.transactionId.length > 10 ? p.transactionId.substring(0, 10) + '...' : p.transactionId}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(p.status === 'pending' || p.status === 'processing') ? (
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setActionModal({ type: 'paid', payout: p })}
                                                    className="px-3 py-1.5 bg-[#ECFDF5] text-[#4ABCA8] hover:bg-[#4ABCA8] hover:text-white border border-[#4ABCA8] rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
                                                >
                                                    Pay
                                                </button>
                                                <button 
                                                    onClick={() => setActionModal({ type: 'rejected', payout: p })}
                                                    className="px-3 py-1.5 bg-[#FEE2E2] text-[#E53E3E] hover:bg-[#E53E3E] hover:text-white border border-[#E53E3E] rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[12px] font-semibold text-[#A0ABC0] italic">— Processed —</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── ACTION MODAL ── */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e103c]/40 backdrop-blur-md">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#D5C2F6]">
                        
                        <div className={`px-6 py-5 border-b flex justify-between items-center ${
                            actionModal.type === 'paid' ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-[#FEE2E2] border-[#FECACA]'
                        }`}>
                            <h2 className={`text-[18px] font-black m-0 ${actionModal.type === 'paid' ? 'text-[#2F855A]' : 'text-[#C53030]'}`}>
                                {actionModal.type === 'paid' ? 'Confirm Payment' : 'Reject Request'}
                            </h2>
                            <button onClick={() => setActionModal(null)} className="text-[#A0ABC0] hover:text-[#27225B] bg-transparent border-none cursor-pointer">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        <div className="px-6 py-5 bg-[#FAFAFA] border-b border-[#F4F0FD]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[13px] font-bold text-[#7D8DA6]">Payout Amount:</span>
                                <span className="text-[22px] font-black text-[#27225B]">₹{actionModal.payout.amount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] font-bold text-[#7D8DA6]">Instructor:</span>
                                <span className="text-[14px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1 rounded-lg">
                                    {actionModal.payout.tutorId?.userId?.name}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleAction} className="p-6 space-y-5 bg-white">
                            {actionModal.type === 'paid' && (
                                <div>
                                    <label className="block text-[13px] font-bold text-[#27225B] mb-2">Transaction ID / Reference No. <span className="text-[#E53E3E]">*</span></label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. UTR12345678"
                                        className="w-full px-4 py-2.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:border-[#4ABCA8] focus:ring-1 focus:ring-[#4ABCA8] transition-all placeholder-[#A0ABC0]"
                                        value={transactionId}
                                        onChange={e => setTransactionId(e.target.value)}
                                    />
                                    <p className="text-[11px] font-medium text-[#A0ABC0] mt-1.5 m-0">Provide this as proof of successful bank transfer.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[13px] font-bold text-[#27225B] mb-2">Admin Note {actionModal.type === 'rejected' && <span className="text-[#E53E3E]">*</span>}</label>
                                <textarea 
                                    required={actionModal.type === 'rejected'}
                                    rows="3"
                                    placeholder={actionModal.type === 'rejected' ? 'Provide a reason for rejection...' : 'Optional comment for the instructor...'}
                                    className={`w-full px-4 py-3 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-medium text-[#27225B] outline-none transition-all placeholder-[#A0ABC0] resize-none focus:ring-1 ${
                                        actionModal.type === 'paid' ? 'focus:border-[#4ABCA8] focus:ring-[#4ABCA8]' : 'focus:border-[#E53E3E] focus:ring-[#E53E3E]'
                                    }`}
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setActionModal(null)} className="px-6 py-2.5 bg-white border border-[#E9DFFC] text-[#7A6C9B] font-bold text-[13px] rounded-xl cursor-pointer hover:bg-[#F9F7FC] transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className={`px-6 py-2.5 text-white font-bold text-[13px] rounded-xl cursor-pointer transition-colors border-none shadow-md flex items-center gap-2 disabled:opacity-70 ${
                                        actionModal.type === 'paid' ? 'bg-[#4ABCA8] hover:bg-[#389E8D]' : 'bg-[#E53E3E] hover:bg-[#C53030]'
                                    }`}
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    {submitting ? 'Processing...' : actionModal.type === 'paid' ? 'Confirm Transfer' : 'Reject Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}