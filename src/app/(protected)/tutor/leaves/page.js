'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdCalendarMonth, MdAdd, MdAccessTime, MdCheckCircle, MdCancel, 
    MdDelete, MdChevronLeft, MdChevronRight, MdAssignment, MdHourglassEmpty, 
    MdClose, MdSearch, MdEdit, MdSubject, MdAttachFile, MdPerson 
} from 'react-icons/md';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/studentTokens';

const LEAVE_TYPES = [
    'Sick Leave', 'Medical Appointment', 'Personal Reasons',
    'Family Emergency', 'Family Function', 'Conference / Training', 'Vacation', 'Other',
];
const ITEMS_PER_PAGE = 10;

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

function StatusBadge({ status }) {
    const map = {
        pending:  { bg: C.warningBg, color: C.warning, border: C.warningBorder },
        approved: { bg: C.successBg, color: C.success, border: C.successBorder },
        rejected: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
    };
    const style = map[status?.toLowerCase()] || map.pending;
    
    return (
        <span style={{ 
            fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: '8px', 
            textTransform: 'uppercase', letterSpacing: T.tracking.wider,
            backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`
        }}>
            {status}
        </span>
    );
}

export default function TutorLeavesPage() {
    const [leaves, setLeaves]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [showForm, setShowForm]       = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const [tutors, setTutors]           = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { confirmDialog }             = useConfirm();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave', startDate: '', endDate: '',
        reason: '', documentUrl: '', substituteId: '',
    });

    useEffect(() => { fetchMyLeaves(); fetchTutors(); }, []);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaves/my');
            if (res?.data?.success) setLeaves(res.data.leaves || []);
        } catch { toast.error('Failed to load leave history'); }
        finally { setLoading(false); }
    };

    const fetchTutors = async () => {
        try {
            const res = await api.get('/tutors');
            if (res?.data?.success) setTutors(res.data.data || res.data.tutors || []);
        } catch { /* silent */ }
    };

    const stats = useMemo(() => ({
        pending:  leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        total:    leaves.length,
    }), [leaves]);

    const searchedLeaves = useMemo(() => {
        if (!searchQuery.trim()) return leaves;
        const q = searchQuery.toLowerCase();
        return leaves.filter(l => 
            l.reason?.toLowerCase().includes(q) || 
            l.status?.toLowerCase().includes(q)
        );
    }, [leaves, searchQuery]);

    const filteredLeaves = useMemo(() =>
        activeFilter === 'all' ? searchedLeaves : searchedLeaves.filter(l => l.status === activeFilter),
        [searchedLeaves, activeFilter]
    );

    const totalPages     = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
    const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getDuration = (start, end) => {
        const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
        return `${diff} Day${diff !== 1 ? 's' : ''}`;
    };
    const getLeaveType   = (r) => r?.match(/^\[(.+?)\]/)?.[1] || 'Leave';
    const getLeaveReason = (r) => r?.match(/^\[.+?\]\s*(.*)/s)?.[1] || r;

    const resetForm = () => {
        setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '', substituteId: '' });
        setEditingLeave(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('End date cannot be before start date'); return;
        }
        setSubmitting(true);
        try {
            const payload = {
                startDate: formData.startDate,
                endDate:   formData.endDate,
                reason:    `[${formData.leaveType}] ${formData.reason}`,
                documents: formData.documentUrl ? [{ name: 'Supporting Document', url: formData.documentUrl, type: 'url' }] : [],
                substituteId: formData.substituteId || null,
            };
            if (editingLeave) {
                const res = await api.put(`/leaves/${editingLeave._id}`, payload);
                if (res?.data?.success) toast.success('Leave request updated!');
            } else {
                const res = await api.post('/leaves', payload);
                if (res?.data?.success) toast.success('Leave application submitted!');
            }
            resetForm();
            fetchMyLeaves();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit leave');
        } finally { setSubmitting(false); }
    };

    const handleEdit = (leave) => {
        const match = leave.reason?.match(/^\[(.+?)\]\s*(.*)/s);
        setFormData({
            leaveType:   match ? match[1] : 'Other',
            startDate:   new Date(leave.startDate).toISOString().split('T')[0],
            endDate:     new Date(leave.endDate).toISOString().split('T')[0],
            reason:      match ? match[2] : leave.reason,
            documentUrl: leave.documents?.[0]?.url || '',
            substituteId: leave.substituteId || '',
        });
        setEditingLeave(leave);
        setShowForm(true);
    };

    const handleDelete = async (leaveId) => {
        const ok = await confirmDialog('Delete Leave Request', 'Are you sure you want to delete this leave request?', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/leaves/${leaveId}`);
            toast.success('Leave request deleted');
            fetchMyLeaves();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to delete'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading leaves...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Leave Request</h1>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}
                >
                    <MdAdd size={18} /> Request a Leave
                </button>
            </div>

            {/* ── Leave Form Modal ─────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh] custom-scrollbar animate-in fade-in zoom-in duration-200" 
                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                            </h3>
                            <button onClick={resetForm} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center transition-colors" 
                                style={{ width: '32px', height: '32px', backgroundColor: C.innerBg, borderRadius: '8px' }}>
                                <MdClose size={18} color={C.heading} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Leave Type</label>
                                <select style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: e.target.value })}>
                                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>From Date *</label>
                                    <input type="date" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>To Date *</label>
                                    <input type="date" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Reason for Leave *</label>
                                <textarea style={{ ...baseInputStyle, minHeight: '80px', resize: 'vertical' }} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    required maxLength={500}
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please provide the reason for your leave..." />
                                <p style={{ textAlign: 'right', fontSize: '11px', color: C.textMuted, fontWeight: T.weight.semibold }}>{formData.reason.length} / 500</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Attachment (Optional)</label>
                                    <input type="url" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        value={formData.documentUrl}
                                        onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                        placeholder="Paste document link" />
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Substitute Instructor (Optional)</label>
                                    <select style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        value={formData.substituteId}
                                        onChange={e => setFormData({ ...formData, substituteId: e.target.value })}>
                                        <option value="">No substitute needed</option>
                                        {tutors.map(t => (
                                            <option key={t._id} value={t._id}>
                                                {t.userId?.name || t.name || 'Unknown Tutor'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button type="button" onClick={resetForm}
                                    className="px-6 py-2.5 cursor-pointer bg-transparent border-none hover:opacity-70 transition-opacity"
                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {submitting && <MdHourglassEmpty size={16} className="animate-spin" />} {editingLeave ? 'Update Request' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Main Layout ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-500 delay-100">
                
                {/* Left Column: Stats & Table */}
                <div className="xl:col-span-3 space-y-6">
                    
                    {/* Table Container */}
                    <div className="p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        
                        {/* Tabs & Search */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'pending', label: 'Pending', count: stats.pending, color: C.warning, bg: C.warningBg },
                                    { id: 'approved', label: 'Approved', count: stats.approved, color: C.success, bg: C.successBg },
                                    { id: 'rejected', label: 'Rejected', count: stats.rejected, color: C.danger, bg: C.dangerBg },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveFilter(tab.id); setCurrentPage(1); }}
                                        className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70 pb-1"
                                        style={{ 
                                            color: activeFilter === tab.id ? C.heading : C.textMuted, 
                                            fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily,
                                            borderBottom: activeFilter === tab.id ? `2px solid ${C.btnPrimary}` : '2px solid transparent'
                                        }}
                                    >
                                        {tab.label}
                                        {tab.count !== undefined && (
                                            <span style={{ 
                                                backgroundColor: activeFilter === tab.id ? tab.bg : C.innerBg, 
                                                color: activeFilter === tab.id ? tab.color : C.textMuted, 
                                                padding: '2px 6px', borderRadius: '8px', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: '10px', fontWeight: T.weight.black 
                                            }}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="relative w-full md:w-64 shrink-0">
                                <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={18} color={C.textMuted} />
                                <input 
                                    type="text" 
                                    placeholder="Search requests..."
                                    style={{ ...baseInputStyle, paddingLeft: '40px' }}
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>

                        {/* List / Table */}
                        <div className="overflow-x-auto custom-scrollbar">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_2fr_1fr_100px] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Student', 'Leave Dates', 'Type', 'Reason', 'Status', 'Actions'].map(h => (
                                        <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                    ))}
                                </div>
                                
                                {paginatedLeaves.length === 0 ? (
                                    <div className="text-center py-16 flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: C.innerBg }}>
                                            <MdCalendarMonth size={28} color={C.textMuted} style={{ opacity: 0.5 }} />
                                        </div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No leave requests found.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {paginatedLeaves.map(leave => (
                                            <div key={leave._id} className="grid grid-cols-[2fr_1.5fr_1.5fr_2fr_1fr_100px] gap-4 px-4 py-3 items-center transition-colors"
                                                style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                                
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg }}>
                                                        <MdCalendarMonth size={18} color={C.iconColor} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>My Leave</p>
                                                        <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>Duration: {getDuration(leave.startDate, leave.endDate)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-center">
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {leave.startDate !== leave.endDate && (
                                                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                                            - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {getLeaveType(leave.reason)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="line-clamp-2" style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, lineHeight: 1.4 }}>
                                                        {getLeaveReason(leave.reason)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <StatusBadge status={leave.status} />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setViewingLeave(viewingLeave?._id === leave._id ? null : leave)}
                                                        className="px-4 py-1.5 cursor-pointer border-none transition-colors w-full shadow-sm"
                                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#fff'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.btnPrimary; }}>
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 pt-4 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, marginRight: '8px' }}>
                                    Rows per page: {ITEMS_PER_PAGE}
                                </span>
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="px-3 py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}`, opacity: currentPage === 1 ? 0.5 : 1 }}>
                                    ‹ Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                                        className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-all"
                                        style={{ 
                                            backgroundColor: currentPage === i + 1 ? C.btnPrimary : C.btnViewAllBg, 
                                            color: currentPage === i + 1 ? '#fff' : C.btnViewAllText, 
                                            borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold,
                                            border: currentPage === i + 1 ? 'none' : `1px solid ${C.cardBorder}`
                                        }}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}`, opacity: currentPage === totalPages ? 0.5 : 1 }}>
                                    Next ›
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Column: Guidelines */}
                <div className="xl:col-span-1">
                    <div className="p-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Guidelines</h3>
                        
                        <div className="space-y-4">
                            {[
                                { icon: MdEdit, text: 'Submit leave requests in advance when possible' },
                                { icon: MdCalendarMonth, text: 'Specify the start and end dates clearly' },
                                { icon: MdSubject, text: 'State the reason for the leave briefly' },
                                { icon: MdAttachFile, text: 'Attach supporting documents if required' },
                                { icon: MdPerson, text: 'Assign a substitute for your batches' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0" style={{ color: C.btnPrimary }}>
                                        <tip.icon size={18} />
                                    </div>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, margin: 0, lineHeight: 1.4 }}>{tip.text}</p>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 h-11 flex items-center justify-center cursor-pointer transition-colors"
                            style={{ backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                            View Leave Policy
                        </button>
                    </div>
                </div>

            </div>

            {/* ── View Detail Modal ─────────────────────────────────────────── */}
            {viewingLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setViewingLeave(null)}>
                    <div className="w-full max-w-md p-6 animate-in zoom-in duration-200" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdCalendarMonth size={18} color={C.iconColor} />
                                </div>
                                <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Leave Details</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={viewingLeave.status} />
                                <button onClick={() => setViewingLeave(null)} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center transition-colors" style={{ width: '32px', height: '32px', backgroundColor: C.innerBg, borderRadius: '8px' }}>
                                    <MdClose size={18} color={C.heading} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 4px 0' }}>Type</p>
                                <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{getLeaveType(viewingLeave.reason)}</p>
                            </div>
                            
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 4px 0' }}>Dates</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                    {new Date(viewingLeave.startDate).toLocaleDateString()} – {new Date(viewingLeave.endDate).toLocaleDateString()}
                                    <span style={{ color: C.textMuted, marginLeft: '8px', fontWeight: T.weight.semibold }}>({getDuration(viewingLeave.startDate, viewingLeave.endDate)})</span>
                                </p>
                            </div>

                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 4px 0' }}>Reason</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.5, backgroundColor: C.innerBg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    {getLeaveReason(viewingLeave.reason)}
                                </p>
                            </div>

                            {viewingLeave.adminComment && (
                                <div className="pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 4px 0' }}>Admin Response</p>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.5, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, padding: '12px', borderRadius: '10px' }}>
                                        {viewingLeave.adminComment}
                                    </p>
                                </div>
                            )}

                            {viewingLeave.status === 'pending' && (
                                <div className="pt-4 mt-2 flex justify-end">
                                    <button onClick={() => { setViewingLeave(null); handleDelete(viewingLeave._id); }} className="flex items-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                        style={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        <MdDelete size={16} /> Delete Request
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}