'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, IndianRupee, Clock, CheckCircle2, XCircle, 
    Search, Building2, User, FileText, X, Landmark, ReceiptText
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminPayoutsPage() {
    const [payouts, setPayouts] = useState([]);
    const [kpis, setKpis] = useState({ pendingAmount: 0, pendingCount: 0, paidAmount: 0, paidCount: 0, processingCount: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [processData, setProcessData] = useState({ status: '', transactionId: '', adminNotes: '' });
    const [saving, setSaving] = useState(false);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchPayouts();
    }, [statusFilter]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/superadmin/payouts?status=${statusFilter}`);
            if (res.data.success) {
                setPayouts(res.data.data.payouts);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load payout requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Frontend filtering for simplicity on name/email
        if (!searchTerm) {
            fetchPayouts();
            return;
        }
        const filtered = payouts.filter(p => 
            p.tutorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tutorId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setPayouts(filtered);
    };

    const openProcessModal = (payout) => {
        setSelectedPayout(payout);
        setProcessData({
            status: payout.status,
            transactionId: payout.transactionId || '',
            adminNotes: payout.adminNotes || ''
        });
    };

    const handleProcessSubmit = async (e) => {
        e.preventDefault();
        if (processData.status === 'paid' && !processData.transactionId) {
            return toast.error('Transaction ID is required when marking as PAID.');
        }
        
        setSaving(true);
        try {
            const res = await api.patch(`/superadmin/payouts/${selectedPayout._id}/process`, processData);
            if (res.data.success) {
                toast.success(res.data.message);
                setSelectedPayout(null);
                fetchPayouts(); // Refresh data to update KPIs and lists
            }
        } catch (error) {
            toast.error('Failed to process payout');
        } finally {
            setSaving(false);
        }
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'paid': return { color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', border: 'border-[#D1FAE5]', icon: CheckCircle2, label: 'Paid' };
            case 'pending': return { color: 'text-[#E53E3E]', bg: 'bg-[#FEE2E2]', border: 'border-[#FECACA]', icon: Clock, label: 'Pending' };
            case 'processing': return { color: 'text-[#F59E0B]', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', icon: Loader2, label: 'Processing' };
            case 'rejected': return { color: 'text-[#7D8DA6]', bg: 'bg-[#F8F6FC]', border: 'border-[#E9DFFC]', icon: XCircle, label: 'Rejected' };
            default: return { color: 'text-[#7D8DA6]', bg: 'bg-[#F8F6FC]', border: 'border-[#E9DFFC]', icon: FileText, label: status };
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <IndianRupee className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Tutor Payouts & Settlements</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Review withdrawal requests, check bank details, and settle funds.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-[#27225B] rounded-[20px] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between border border-[#1e1a48]">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-[#EF4444] opacity-20 rounded-bl-full blur-xl animate-pulse"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center"><Clock size={16}/></div>
                        <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0">Pending Due</p>
                    </div>
                    <div className="relative z-10 flex items-end justify-between">
                        <h3 className="text-[26px] font-black text-white m-0">₹{kpis.pendingAmount.toLocaleString()}</h3>
                        <span className="text-[12px] font-bold text-[#EF4444]">{kpis.pendingCount} Req</span>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E9DFFC] flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center"><CheckCircle2 size={16}/></div>
                        <p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0">Total Paid Out</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[26px] font-black text-[#27225B] m-0">₹{kpis.paidAmount.toLocaleString()}</h3>
                        <span className="text-[12px] font-bold text-[#10B981]">{kpis.paidCount} Req</span>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E9DFFC] flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F59E0B] flex items-center justify-center"><Loader2 size={16}/></div>
                        <p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0">In Processing</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[26px] font-black text-[#27225B] m-0">{kpis.processingCount}</h3>
                        <span className="text-[12px] font-bold text-[#A0ABC0]">Requests</span>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E9DFFC] flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><ReceiptText size={16}/></div>
                        <p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0">Avg Payout Size</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[26px] font-black text-[#27225B] m-0">
                            ₹{((kpis.paidCount + kpis.pendingCount) > 0 ? (kpis.paidAmount + kpis.pendingAmount) / (kpis.paidCount + kpis.pendingCount) : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'pending', 'processing', 'paid', 'rejected'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Requests' : status}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search by tutor name..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
            </div>

            {/* ── Payouts Table ── */}
            <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
                ) : payouts.length === 0 ? (
                    <div className="p-16 text-center">
                        <IndianRupee className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                        <h3 className="text-[18px] font-black text-[#27225B] m-0">No requests found</h3>
                        <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">No payout requests match your current filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-[#FDFBFF] border-b border-[#F4F0FD]">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Tutor Info</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Request Date</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {payouts.map((payout) => {
                                    const statusData = getStatusConfig(payout.status);
                                    const StatusIcon = statusData.icon;

                                    return (
                                        <tr key={payout._id} className="hover:bg-[#F9F7FC] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#E9DFFC] flex items-center justify-center overflow-hidden shrink-0">
                                                        {payout.tutorId?.profileImage ? <img src={payout.tutorId.profileImage} className="w-full h-full object-cover"/> : <User size={16} className="text-[#6B4DF1]"/>}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-[#27225B] m-0">{payout.tutorId?.name || 'Unknown Tutor'}</p>
                                                        <p className="text-[11px] font-medium text-[#7D8DA6] m-0">{payout.tutorId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[16px] font-black text-[#27225B]">₹{payout.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] font-bold text-[#27225B] m-0">{new Date(payout.createdAt).toLocaleDateString('en-GB')}</p>
                                                <p className="text-[11px] font-medium text-[#7D8DA6] m-0">{new Date(payout.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${statusData.bg} ${statusData.color} ${statusData.border}`}>
                                                    <StatusIcon size={14} className={payout.status === 'processing' ? 'animate-spin' : ''}/> {statusData.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => openProcessModal(payout)}
                                                    className="px-4 py-2 bg-white border border-[#E9DFFC] text-[#6B4DF1] hover:bg-[#F4F0FD] hover:border-[#D5C2F6] font-bold text-[12px] rounded-xl transition-all shadow-sm cursor-pointer"
                                                >
                                                    {payout.status === 'pending' || payout.status === 'processing' ? 'Review & Process' : 'View Details'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── MODAL: Process Settlement ── */}
            {selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1a48]/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden border border-[#E9DFFC]">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF] flex justify-between items-center">
                            <h2 className="text-[18px] font-black text-[#27225B] flex items-center gap-2 m-0">
                                <Landmark className="w-5 h-5 text-[#6B4DF1]" /> Settlement Desk
                            </h2>
                            <button onClick={() => setSelectedPayout(null)} className="text-[#A0ABC0] hover:text-[#E53E3E] bg-transparent border-none cursor-pointer"><X size={20}/></button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleProcessSubmit}>
                            <div className="p-6 space-y-6">
                                
                                {/* Amount Card */}
                                <div className="bg-[#F9F7FC] rounded-xl p-5 border border-[#E9DFFC] flex items-center justify-between">
                                    <div>
                                        <p className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Requested Amount</p>
                                        <p className="text-[24px] font-black text-[#6B4DF1] m-0">₹{selectedPayout.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[12px] font-bold text-[#7D8DA6] m-0 mb-1">Requested By</p>
                                        <p className="text-[14px] font-bold text-[#27225B] m-0">{selectedPayout.tutorId?.name}</p>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div>
                                    <h4 className="text-[12px] font-black text-[#27225B] uppercase tracking-wider mb-3">Bank / UPI Details</h4>
                                    <div className="bg-white border border-[#E9DFFC] rounded-xl overflow-hidden text-[13px]">
                                        <div className="flex border-b border-[#F4F0FD]"><span className="w-1/3 p-3 bg-[#FDFBFF] font-bold text-[#7D8DA6]">Holder Name</span><span className="w-2/3 p-3 font-semibold text-[#27225B]">{selectedPayout.bankDetails?.accountHolderName || 'N/A'}</span></div>
                                        <div className="flex border-b border-[#F4F0FD]"><span className="w-1/3 p-3 bg-[#FDFBFF] font-bold text-[#7D8DA6]">Bank Name</span><span className="w-2/3 p-3 font-semibold text-[#27225B]">{selectedPayout.bankDetails?.bankName || 'N/A'}</span></div>
                                        <div className="flex border-b border-[#F4F0FD]"><span className="w-1/3 p-3 bg-[#FDFBFF] font-bold text-[#7D8DA6]">A/C Number</span><span className="w-2/3 p-3 font-mono font-bold text-[#27225B]">{selectedPayout.bankDetails?.accountNumber || 'N/A'}</span></div>
                                        <div className="flex border-b border-[#F4F0FD]"><span className="w-1/3 p-3 bg-[#FDFBFF] font-bold text-[#7D8DA6]">IFSC Code</span><span className="w-2/3 p-3 font-mono font-bold text-[#27225B]">{selectedPayout.bankDetails?.ifscCode || 'N/A'}</span></div>
                                        <div className="flex"><span className="w-1/3 p-3 bg-[#FDFBFF] font-bold text-[#7D8DA6]">UPI ID</span><span className="w-2/3 p-3 font-semibold text-[#6B4DF1]">{selectedPayout.bankDetails?.upiId || 'N/A'}</span></div>
                                    </div>
                                </div>

                                {/* Action Controls */}
                                <div className="space-y-4 border-t border-[#F4F0FD] pt-4">
                                    <div>
                                        <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Update Status</label>
                                        <select 
                                            value={processData.status} 
                                            onChange={(e) => setProcessData({...processData, status: e.target.value})}
                                            className="w-full p-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-bold text-[#27225B] outline-none"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing (Bank Transfer Initiated)</option>
                                            <option value="paid">Paid (Settled)</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>

                                    {processData.status === 'paid' && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Transaction Ref ID (Required)</label>
                                            <input 
                                                type="text" required
                                                value={processData.transactionId} 
                                                onChange={(e) => setProcessData({...processData, transactionId: e.target.value})}
                                                placeholder="e.g. UTR1234567890"
                                                className="w-full px-4 py-3 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                            />
                                        </div>
                                    )}

                                    {(processData.status === 'rejected' || processData.status === 'paid') && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Admin Notes (Optional)</label>
                                            <textarea 
                                                value={processData.adminNotes} 
                                                onChange={(e) => setProcessData({...processData, adminNotes: e.target.value})}
                                                placeholder={processData.status === 'rejected' ? 'Reason for rejection...' : 'Any internal notes...'}
                                                className="w-full px-4 py-3 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] min-h-[80px] resize-none"
                                            ></textarea>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-[#F4F0FD] bg-[#FDFBFF] flex justify-end gap-3">
                                <button type="button" onClick={() => setSelectedPayout(null)} className="px-5 py-2.5 bg-white border border-[#E9DFFC] text-[#7D8DA6] font-bold text-[13px] rounded-xl cursor-pointer hover:bg-[#F9F7FC]">Cancel</button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#6B4DF1] text-white font-bold text-[13px] rounded-xl hover:bg-[#5839D6] disabled:opacity-60 border-none cursor-pointer shadow-md">
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    Save & Update
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}