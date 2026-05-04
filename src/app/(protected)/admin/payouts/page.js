'use client';

import { useState, useEffect } from 'react';
import { 
    MdAccountBalanceWallet, 
    MdCheckCircle, 
    MdCancel, 
    MdAccessTime, 
    MdSearch,
    MdAccountBalance,
    MdCheckCircleOutline,
    MdClose,
    MdHourglassEmpty
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import StatCard from '@/components/StatCard';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px 12px 40px', // Extra left padding for the icon
    transition: 'all 0.2s ease',
};

const modalInputStyle = {
    backgroundColor: C.surfaceWhite,
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
        <div className="space-y-6 min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="mb-2">
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                    Payout Management
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                    Review and process instructor withdrawal requests
                </p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <StatCard 
                    icon={MdAccessTime}
                    value={`₹${totalPending.toLocaleString('en-IN')}`}
                    label="Pending Requests"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdCheckCircleOutline}
                    value={`₹${totalPaid.toLocaleString('en-IN')}`}
                    label="Total Paid Out"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="flex flex-col overflow-hidden mb-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                
                {/* Table Toolbar & Filters */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="relative w-full md:w-96 group">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" 
                            style={{ width: 18, height: 18, color: C.textMuted }} />
                        <input 
                            type="text" 
                            placeholder="Search by instructor name..." 
                            style={baseInputStyle}
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; e.target.style.backgroundColor = C.cardBg; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = C.surfaceWhite; }}
                        />
                    </div>
                    
                    {/* Custom Styled Filter Tabs */}
                    <div className="flex p-1 w-full md:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '12px' }}>
                        {['pending', 'paid', 'rejected', 'all'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="capitalize transition-colors duration-300 whitespace-nowrap cursor-pointer border-none"
                                style={{
                                    padding: '8px 20px',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold,
                                    borderRadius: '10px',
                                    backgroundColor: filter === f ? C.surfaceWhite : 'transparent',
                                    color: filter === f ? C.btnPrimary : C.text,
                                    boxShadow: filter === f ? S.active : 'none'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Instructor</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Amount & Date</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Bank Details</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdAccountBalanceWallet style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Payouts</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No {filter !== 'all' ? filter : ''} payout requests found.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPayouts.map(p => (
                                <tr key={p._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                 style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.iconBg, color: C.iconColor, fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold }}>
                                                {p.tutorId?.userId?.profileImage ? (
                                                    <img src={p.tutorId.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    p.tutorId?.userId?.name?.charAt(0).toUpperCase() || 'T'
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{p.tutorId?.userId?.name || 'Unknown'}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: '2px 0 0 0' }}>{p.tutorId?.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div className="flex flex-col">
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>₹{p.amount.toLocaleString('en-IN')}</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 4 }}>{new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div className="flex items-start gap-2 w-fit" style={{ backgroundColor: C.surfaceWhite, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                            <MdAccountBalance style={{ width: 16, height: 16, color: C.btnPrimary, shrink: 0, marginTop: 2 }} />
                                            <div className="flex flex-col">
                                                {p.bankDetails?.bankName ? (
                                                    <>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.2 }}>{p.bankDetails.bankName}</span>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, lineHeight: 1.2, marginTop: 4 }}>A/C: {p.bankDetails.accountNumber}</span>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: C.textMuted, lineHeight: 1.2, marginTop: 2 }}>IFSC: {p.bankDetails.ifscCode}</span>
                                                    </>
                                                ) : p.bankDetails?.upiId ? (
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.2 }}>UPI: {p.bankDetails.upiId}</span>
                                                ) : (
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.warning, fontStyle: 'italic' }}>No Details Provided</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div className="flex flex-col items-start gap-1">
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                borderRadius: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                                backgroundColor: p.status === 'paid' ? C.successBg : p.status === 'rejected' ? C.dangerBg : C.warningBg,
                                                color: p.status === 'paid' ? C.success : p.status === 'rejected' ? C.danger : C.warning,
                                                border: `1px solid ${p.status === 'paid' ? C.successBorder : p.status === 'rejected' ? C.dangerBorder : C.warningBorder}`
                                            }}>
                                                {p.status === 'paid' && <MdCheckCircle style={{ width: 14, height: 14 }} />}
                                                {p.status === 'rejected' && <MdCancel style={{ width: 14, height: 14 }} />}
                                                {(p.status === 'pending' || p.status === 'processing') && <MdAccessTime style={{ width: 14, height: 14 }} />}
                                                {p.status}
                                            </span>
                                            {p.status === 'paid' && p.transactionId && (
                                                <span style={{ fontFamily: T.fontFamilyMono, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, backgroundColor: C.btnViewAllBg, padding: '2px 6px', borderRadius: '4px', marginTop: 4 }} title={p.transactionId}>
                                                    Txn: {p.transactionId.length > 10 ? p.transactionId.substring(0, 10) + '...' : p.transactionId}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                        {(p.status === 'pending' || p.status === 'processing') ? (
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setActionModal({ type: 'paid', payout: p })}
                                                    className="transition-colors cursor-pointer border-none"
                                                    style={{ padding: '6px 12px', backgroundColor: C.successBg, color: C.success, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.success; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.successBg; e.currentTarget.style.color = C.success; }}
                                                >
                                                    Pay
                                                </button>
                                                <button 
                                                    onClick={() => setActionModal({ type: 'rejected', payout: p })}
                                                    className="transition-colors cursor-pointer border-none"
                                                    style={{ padding: '6px 12px', backgroundColor: C.dangerBg, color: C.danger, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.danger; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, fontStyle: 'italic' }}>— Processed —</span>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="animate-in fade-in zoom-in duration-200 w-full max-w-md overflow-hidden" 
                         style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        
                        <div className="px-6 py-5 flex justify-between items-center" style={{ backgroundColor: actionModal.type === 'paid' ? C.successBg : C.dangerBg, borderBottom: `1px solid ${actionModal.type === 'paid' ? C.successBorder : C.dangerBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, margin: 0, color: actionModal.type === 'paid' ? C.success : C.danger }}>
                                {actionModal.type === 'paid' ? 'Confirm Payment' : 'Reject Request'}
                            </h2>
                            <button onClick={() => setActionModal(null)} className="bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70">
                                <MdClose style={{ width: 20, height: 20, color: actionModal.type === 'paid' ? C.success : C.danger }} />
                            </button>
                        </div>
                        
                        <div className="px-6 py-5" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex justify-between items-center mb-3">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Payout Amount:</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading }}>₹{actionModal.payout.amount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Instructor:</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.btnPrimary, backgroundColor: C.btnViewAllBg, padding: '4px 12px', borderRadius: '10px' }}>
                                    {actionModal.payout.tutorId?.userId?.name}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleAction} className="p-6 space-y-5" style={{ backgroundColor: C.cardBg }}>
                            {actionModal.type === 'paid' && (
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>
                                        Transaction ID / Reference No. <span style={{ color: C.danger }}>*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. UTR12345678"
                                        style={modalInputStyle}
                                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                        value={transactionId}
                                        onChange={e => setTransactionId(e.target.value)}
                                    />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: '6px 0 0 0' }}>Provide this as proof of successful bank transfer.</p>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>
                                    Admin Note {actionModal.type === 'rejected' && <span style={{ color: C.danger }}>*</span>}
                                </label>
                                <textarea 
                                    required={actionModal.type === 'rejected'}
                                    rows="3"
                                    placeholder={actionModal.type === 'rejected' ? 'Provide a reason for rejection...' : 'Optional comment for the instructor...'}
                                    style={{ ...modalInputStyle, resize: 'none' }}
                                    onFocus={e => { e.target.style.borderColor = actionModal.type === 'paid' ? C.success : C.danger; e.target.style.boxShadow = `0 0 0 3px ${actionModal.type === 'paid' ? C.successBg : C.dangerBg}`; }}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setActionModal(null)} className="transition-colors cursor-pointer"
                                    style={{ padding: '10px 24px', backgroundColor: C.btnViewAllBg, color: C.text, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-70 shadow-md"
                                    style={{ padding: '10px 24px', backgroundColor: actionModal.type === 'paid' ? C.success : C.danger, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                >
                                    {submitting && <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />}
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