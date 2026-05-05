'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdCurrencyRupee, MdAccessTime, MdCheckCircle, MdCancel, 
    MdSearch, MdBusiness, MdPerson, MdArticle, MdClose, MdAccountBalance, MdReceipt, MdOpenInNew
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
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
            case 'paid': return { color: C.success, bg: C.successBg, border: `1px solid ${C.successBorder}`, icon: MdCheckCircle, label: 'Paid' };
            case 'pending': return { color: C.danger, bg: C.dangerBg, border: `1px solid ${C.dangerBorder}`, icon: MdAccessTime, label: 'Pending' };
            case 'processing': return { color: C.warning, bg: C.warningBg, border: `1px solid ${C.warningBorder}`, icon: MdHourglassEmpty, label: 'Processing' };
            case 'rejected': return { color: C.textMuted, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdCancel, label: 'Rejected' };
            default: return { color: C.textMuted, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdArticle, label: status };
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
                        Loading payouts...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdCurrencyRupee style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Tutor Payouts & Settlements
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Review withdrawal requests, check bank details, and settle funds.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdAccessTime} 
                    value={`₹${kpis.pendingAmount.toLocaleString()}`} 
                    label="Pending Due" 
                    subtext={`${kpis.pendingCount} Req`}
                    iconBg={C.dangerBg} 
                    iconColor={C.danger} 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={`₹${kpis.paidAmount.toLocaleString()}`} 
                    label="Total Paid Out" 
                    subtext={`${kpis.paidCount} Req`}
                    iconBg={C.successBg} 
                    iconColor={C.success} 
                />
                <StatCard 
                    icon={MdHourglassEmpty} 
                    value={kpis.processingCount} 
                    label="In Processing" 
                    subtext="Requests"
                    iconBg={C.warningBg} 
                    iconColor={C.warning} 
                />
                <StatCard 
                    icon={MdReceipt} 
                    value={`₹${((kpis.paidCount + kpis.pendingCount) > 0 ? (kpis.paidAmount + kpis.pendingAmount) / (kpis.paidCount + kpis.pendingCount) : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
                    label="Avg Payout Size" 
                    iconBg={C.iconBg} 
                    iconColor={C.iconColor} 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'pending', 'processing', 'paid', 'rejected'].map(status => (
                        <button 
                            key={status} 
                            onClick={() => setStatusFilter(status)} 
                            className="transition-all capitalize whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: statusFilter === status ? C.surfaceWhite : 'transparent',
                                color: statusFilter === status ? C.btnPrimary : C.textFaint,
                                boxShadow: statusFilter === status ? S.active : 'none'
                            }}
                        >
                            {status === 'all' ? 'All Requests' : status}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[320px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search by tutor name or email..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Payouts Table ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="overflow-x-auto min-h-[400px]">
                    {payouts.length === 0 ? (
                        <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                            <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdCurrencyRupee style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No requests found</h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>No payout requests match your current filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    {['Tutor Info', 'Amount', 'Request Date', 'Status', 'Action'].map((header, idx) => (
                                        <th key={idx} style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            color: C.statLabel,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            padding: '16px 24px',
                                            borderBottom: `1px solid ${C.cardBorder}`,
                                            textAlign: header === 'Action' ? 'right' : 'left'
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.map((payout) => {
                                    const statusData = getStatusConfig(payout.status);
                                    const StatusIcon = statusData.icon;

                                    return (
                                        <tr key={payout._id} className="transition-colors"
                                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                        style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                        {payout.tutorId?.profileImage ? (
                                                            <img src={payout.tutorId.profileImage} className="w-full h-full object-cover"/>
                                                        ) : (
                                                            <MdPerson style={{ width: 16, height: 16, color: C.btnPrimary }}/>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{payout.tutorId?.name || 'Unknown Tutor'}</p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>{payout.tutorId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                                    ₹{payout.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{new Date(payout.createdAt).toLocaleDateString('en-GB')}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>{new Date(payout.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5" 
                                                    style={{ 
                                                        padding: '6px 12px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                        backgroundColor: statusData.bg, color: statusData.color, border: statusData.border 
                                                    }}
                                                >
                                                    <StatusIcon style={{ width: 14, height: 14 }} className={payout.status === 'processing' ? 'animate-spin' : ''}/> {statusData.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => openProcessModal(payout)}
                                                    className="transition-colors cursor-pointer"
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderRadius: '10px',
                                                        backgroundColor: C.surfaceWhite,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        color: C.btnPrimary,
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.xs,
                                                        fontWeight: T.weight.bold,
                                                        boxShadow: S.cardHover
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; }}
                                                >
                                                    {payout.status === 'pending' || payout.status === 'processing' ? 'Review & Process' : 'View Details'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── MODAL: Process Settlement ── */}
            {selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="flex flex-col w-full max-w-lg overflow-hidden" style={{ backgroundColor: C.pageBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        
                        {/* Modal Header */}
                        <div className="px-6 py-5 flex justify-between items-center shrink-0" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <MdAccountBalance style={{ width: 20, height: 20, color: C.btnPrimary }} /> Settlement Desk
                            </h2>
                            <button onClick={() => setSelectedPayout(null)} className="bg-transparent border-none cursor-pointer p-1 transition-colors"
                                style={{ color: C.textMuted, borderRadius: '10px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
                            >
                                <MdClose style={{ width: 24, height: 24 }}/>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleProcessSubmit}>
                            <div className="p-6 space-y-6">
                                
                                {/* Amount Card */}
                                <div className="flex items-center justify-between" style={{ backgroundColor: C.innerBg, borderRadius: R.xl, padding: '20px', border: `1px solid ${C.cardBorder}` }}>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px' }}>Requested Amount</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.btnPrimary, margin: 0 }}>₹{selectedPayout.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px' }}>Requested By</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{selectedPayout.tutorId?.name}</p>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div>
                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '12px', margin: 0 }}>Bank / UPI Details</h4>
                                    <div className="overflow-hidden" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.base }}>
                                        <div className="flex" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <span className="w-1/3 p-3 font-bold" style={{ backgroundColor: C.innerBg, color: C.statLabel }}>Holder Name</span>
                                            <span className="w-2/3 p-3 font-semibold" style={{ color: C.heading }}>{selectedPayout.bankDetails?.accountHolderName || 'N/A'}</span>
                                        </div>
                                        <div className="flex" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <span className="w-1/3 p-3 font-bold" style={{ backgroundColor: C.innerBg, color: C.statLabel }}>Bank Name</span>
                                            <span className="w-2/3 p-3 font-semibold" style={{ color: C.heading }}>{selectedPayout.bankDetails?.bankName || 'N/A'}</span>
                                        </div>
                                        <div className="flex" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <span className="w-1/3 p-3 font-bold" style={{ backgroundColor: C.innerBg, color: C.statLabel }}>A/C Number</span>
                                            <span className="w-2/3 p-3 font-semibold" style={{ fontFamily: T.fontFamilyMono, color: C.heading }}>{selectedPayout.bankDetails?.accountNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <span className="w-1/3 p-3 font-bold" style={{ backgroundColor: C.innerBg, color: C.statLabel }}>IFSC Code</span>
                                            <span className="w-2/3 p-3 font-semibold" style={{ fontFamily: T.fontFamilyMono, color: C.heading }}>{selectedPayout.bankDetails?.ifscCode || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-1/3 p-3 font-bold" style={{ backgroundColor: C.innerBg, color: C.statLabel }}>UPI ID</span>
                                            <span className="w-2/3 p-3 font-semibold" style={{ color: C.btnPrimary }}>{selectedPayout.bankDetails?.upiId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Controls */}
                                <div className="space-y-4 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>Update Status</label>
                                        <select 
                                            value={processData.status} 
                                            onChange={(e) => setProcessData({...processData, status: e.target.value})}
                                            style={{ ...baseInputStyle, cursor: 'pointer' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing (Bank Transfer Initiated)</option>
                                            <option value="paid">Paid (Settled)</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>

                                    {processData.status === 'paid' && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>Transaction Ref ID (Required)</label>
                                            <input 
                                                type="text" required
                                                value={processData.transactionId} 
                                                onChange={(e) => setProcessData({...processData, transactionId: e.target.value})}
                                                placeholder="e.g. UTR1234567890"
                                                style={{ ...baseInputStyle, fontFamily: T.fontFamilyMono }}
                                            />
                                        </div>
                                    )}

                                    {(processData.status === 'rejected' || processData.status === 'paid') && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>Admin Notes (Optional)</label>
                                            <textarea 
                                                value={processData.adminNotes} 
                                                onChange={(e) => setProcessData({...processData, adminNotes: e.target.value})}
                                                placeholder={processData.status === 'rejected' ? 'Reason for rejection...' : 'Any internal notes...'}
                                                style={{ ...baseInputStyle, minHeight: '80px', resize: 'none' }}
                                            ></textarea>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-5 flex justify-end gap-3 shrink-0" style={{ backgroundColor: C.cardBg, borderTop: `1px solid ${C.cardBorder}` }}>
                                <button type="button" onClick={() => setSelectedPayout(null)} 
                                    className="transition-colors cursor-pointer"
                                    style={{
                                        backgroundColor: C.btnViewAllBg,
                                        color: C.btnViewAllText,
                                        border: `1px solid ${C.cardBorder}`,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        borderRadius: '10px',
                                        padding: '10px 24px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                >Cancel</button>
                                <button type="submit" disabled={saving} 
                                    className="flex items-center gap-2 transition-opacity cursor-pointer border-none"
                                    style={{
                                        background: saving ? C.cardBorder : C.gradientBtn,
                                        color: '#ffffff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        borderRadius: '10px',
                                        padding: '10px 24px',
                                        boxShadow: saving ? 'none' : S.btn
                                    }}
                                >
                                    {saving && <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />}
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