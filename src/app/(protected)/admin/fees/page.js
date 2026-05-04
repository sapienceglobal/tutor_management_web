'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdHourglassEmpty, 
    MdAttachMoney, 
    MdAdd, 
    MdCheckCircle, 
    MdAccessTime, 
    MdClose, 
    MdSearch, 
    MdArticle, 
    MdChevronLeft, 
    MdChevronRight,
    MdFilterList,
    MdOutlineAccountBalanceWallet,
    MdCancel
} from 'react-icons/md';
import { format } from 'date-fns';
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
    padding: '12px 16px',
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

export default function AdminFeesPage() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isIssuing, setIsIssuing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetType, setTargetType] = useState('student');
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({
        targetId: '',
        title: '',
        amount: '',
        dueDate: ''
    });

    useEffect(() => {
        fetchFees();
        fetchResources();
    }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/fees');
            if (res.data.success) {
                setFees(res.data.fees || []);
            } else {
                setFees([
                    { _id: '1', studentId: { name: 'Rahul Gupta', email: 'rahul.gupta@example.com' }, title: 'Term 1 Tuition Fee', amount: 15000, status: 'paid', dueDate: new Date(Date.now() - 864000000).toISOString() },
                    { _id: '2', studentId: { name: 'Priya Mehta', email: 'priya@example.com' }, title: 'Lab Materials Fee', amount: 2500, status: 'created', dueDate: new Date(Date.now() + 864000000).toISOString() },
                    { _id: '3', studentId: { name: 'Amit Sharma', email: 'amit@example.com' }, title: 'Term 1 Tuition Fee', amount: 15000, status: 'failed', dueDate: new Date(Date.now() - 172800000).toISOString() },
                ]);
            }
        } catch (error) {
            toast.error('Failed to load fees');
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const [stdRes, batRes] = await Promise.all([
                api.get('/admin/students').catch(() => ({ data: { success: false } })),
                api.get('/batches').catch(() => ({ data: { success: false } }))
            ]);
            if (stdRes.data.success) setStudents(stdRes.data.students || []);
            if (batRes.data.success) setBatches(batRes.data.batches || batRes.data.data || []);
            if (!stdRes.data.success) setStudents([{ _id: 's1', name: 'Mock Student 1', email: 's1@mock.com' }]);
            if (!batRes.data.success) setBatches([{ _id: 'b1', name: 'Mock Batch Alpha' }]);
        } catch (error) {
            console.error('Error fetching resources for fee form');
        }
    };

    const handleIssueFee = async (e) => {
        e.preventDefault();
        setIsIssuing(true);
        try {
            const res = await api.post('/admin/fees/issue', {
                targetType,
                ...formData
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setIsModalOpen(false);
                setFormData({ targetId: '', title: '', amount: '', dueDate: '' });
                fetchFees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to issue fee');
        } finally {
            setIsIssuing(false);
        }
    };

    const filteredFees = fees.filter(fee => {
        const matchesSearch = fee.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              fee.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'pending' ? (fee.status === 'created' || fee.status === 'failed') : fee.status === statusFilter);
        return matchesSearch && matchesStatus;
    });

    const totalCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'created' || f.status === 'failed').reduce((s, f) => s + f.amount, 0);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen" style={{ ...pageStyle, backgroundColor: C.pageBg }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Fee Management</h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, marginTop: 4, margin: 0 }}>Issue and track institute fee collections</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} 
                    className="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer border-none"
                    style={{ backgroundColor: C.btnPrimary, color: '#ffffff', padding: '12px 24px', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                    <MdAdd style={{ width: 18, height: 18 }} /> Issue New Fee
                </button>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <StatCard 
                    icon={MdCheckCircle}
                    value={`₹${totalCollected.toLocaleString('en-IN')}`}
                    label="Collected Dues"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdAccessTime}
                    value={`₹${totalPending.toLocaleString('en-IN')}`}
                    label="Pending Dues"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="flex flex-col overflow-hidden mb-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                
                {/* Table Toolbar */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="relative w-full md:w-96 group">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ width: 18, height: 18, color: C.textMuted }} />
                        <input 
                            type="text" 
                            placeholder="Search by student or fee title..." 
                            style={{ ...baseInputStyle, paddingLeft: '36px' }}
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ ...baseInputStyle, minWidth: '140px', padding: '10px 16px', cursor: 'pointer' }}
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending/Failed</option>
                        </select>
                        <select style={{ ...baseInputStyle, minWidth: '140px', padding: '10px 16px', cursor: 'pointer' }}
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}>
                            <option>All Batches</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Student</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Fee Details</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Amount</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Due Date</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdOutlineAccountBalanceWallet style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Records</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No fees found matching your filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredFees.map((fee) => (
                                    <tr key={fee._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.iconBg, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontFamily, fontWeight: T.weight.bold, fontSize: T.size.base, overflow: 'hidden' }}>
                                                    {fee.studentId?.profileImage ? (
                                                        <img src={fee.studentId.profileImage} className="w-full h-full object-cover" alt="Student" />
                                                    ) : (
                                                        fee.studentId?.name?.charAt(0).toUpperCase() || 'S'
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{fee.studentId?.name || 'Unknown Student'}</p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: '2px 0 0 0' }}>{fee.studentId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex items-center gap-2">
                                                <MdArticle style={{ width: 16, height: 16, color: C.textMuted }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>{fee.title}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>₹{fee.amount.toLocaleString('en-IN')}</span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                                {fee.dueDate ? format(new Date(fee.dueDate), 'dd MMM, yyyy') : 'No Due Date'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
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
                                                backgroundColor: fee.status === 'paid' ? C.successBg : fee.status === 'failed' ? C.dangerBg : C.warningBg,
                                                color: fee.status === 'paid' ? C.success : fee.status === 'failed' ? C.danger : C.warning,
                                                border: `1px solid ${fee.status === 'paid' ? C.successBorder : fee.status === 'failed' ? C.dangerBorder : C.warningBorder}`
                                            }}>
                                                {fee.status === 'paid' ? <MdCheckCircle style={{ width: 14, height: 14 }} /> : fee.status === 'failed' ? <MdCancel style={{ width: 14, height: 14 }} /> : <MdAccessTime style={{ width: 14, height: 14 }} />}
                                                {fee.status === 'created' ? 'pending' : fee.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}` }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Showing {filteredFees.length} of {fees.length} Fees</span>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center justify-center transition-colors cursor-pointer border-none"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>
                            <MdChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center border-none"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                            1
                        </button>
                        <button className="flex items-center justify-center transition-colors cursor-pointer border-none"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>
                            <MdChevronRight style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── ISSUE FEE MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="animate-in fade-in zoom-in duration-200 w-full max-w-lg overflow-hidden"
                         style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        
                        <div className="px-6 py-5 flex justify-between items-center" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Issue New Fee</h2>
                            <button onClick={() => setIsModalOpen(false)} className="bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70">
                                <MdClose style={{ width: 20, height: 20, color: C.textMuted }} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleIssueFee} className="p-6 space-y-5">
                            <div style={{ backgroundColor: C.innerBg, padding: 16, borderRadius: '16px', border: `1px solid ${C.cardBorder}` }}>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 12 }}>Issue To:</label>
                                <div className="flex gap-6 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                                            <input type="radio" name="targetType" checked={targetType === 'student'} onChange={() => { setTargetType('student'); setFormData({...formData, targetId: ''}) }} className="opacity-0 absolute w-full h-full cursor-pointer z-10" />
                                            <div style={{ width: 20, height: 20, borderRadius: R.full, border: `2px solid ${targetType === 'student' ? C.btnPrimary : C.cardBorder}`, backgroundColor: C.surfaceWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                {targetType === 'student' && <div style={{ width: 10, height: 10, borderRadius: R.full, backgroundColor: C.btnPrimary }}></div>}
                                            </div>
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: targetType === 'student' ? C.btnPrimary : C.text }}>Individual Student</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                                            <input type="radio" name="targetType" checked={targetType === 'batch'} onChange={() => { setTargetType('batch'); setFormData({...formData, targetId: ''}) }} className="opacity-0 absolute w-full h-full cursor-pointer z-10" />
                                            <div style={{ width: 20, height: 20, borderRadius: R.full, border: `2px solid ${targetType === 'batch' ? C.btnPrimary : C.cardBorder}`, backgroundColor: C.surfaceWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                {targetType === 'batch' && <div style={{ width: 10, height: 10, borderRadius: R.full, backgroundColor: C.btnPrimary }}></div>}
                                            </div>
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: targetType === 'batch' ? C.btnPrimary : C.text }}>Entire Batch</span>
                                    </label>
                                </div>
                                
                                <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} 
                                    style={{ ...modalInputStyle, padding: '10px 16px' }}
                                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}>
                                    <option value="">{targetType === 'student' ? 'Select a student...' : 'Select a batch...'}</option>
                                    {targetType === 'student' 
                                        ? students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)
                                        : batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)
                                    }
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>Fee Title / Description <span style={{ color: C.danger }}>*</span></label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                                        style={modalInputStyle} placeholder="E.g. Term 1 Tuition Fee" 
                                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>Amount (₹) <span style={{ color: C.danger }}>*</span></label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors" style={{ color: C.textMuted }}>₹</span>
                                            <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} 
                                                style={{ ...modalInputStyle, paddingLeft: '32px' }} placeholder="5000" 
                                                onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>Due Date</label>
                                        <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                                            style={modalInputStyle}
                                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} 
                                    className="transition-colors cursor-pointer"
                                    style={{ padding: '10px 24px', backgroundColor: C.btnViewAllBg, color: C.text, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={isIssuing} 
                                    className="flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-70 shadow-md"
                                    style={{ padding: '10px 24px', backgroundColor: C.btnPrimary, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                                    {isIssuing ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" /> : <MdAttachMoney style={{ width: 18, height: 18 }} />}
                                    Issue Fee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}