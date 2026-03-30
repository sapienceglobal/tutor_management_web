'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Plus, Clock, CheckCircle2, XCircle,
    Trash2, ChevronLeft, ChevronRight, ClipboardList, Loader2, X, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/tutorTokens';

const LEAVE_TYPES = [
    'Sick Leave', 'Medical Appointment', 'Personal Reasons',
    'Family Emergency', 'Family Function', 'Conference / Training', 'Vacation', 'Other',
];
const ITEMS_PER_PAGE = 10;

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8',
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
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
    const style = map[status] || map.pending;
    
    return (
        <span style={{ 
            fontSize: '11px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: R.md, textTransform: 'capitalize',
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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading leaves...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Leave Request</h1>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    <Plus size={16} /> Request a Leave
                </button>
            </div>

            {/* ── Leave Form Modal ─────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh] custom-scrollbar" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                            </h3>
                            <button onClick={resetForm} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center" style={{ width: '32px', height: '32px', backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                <X size={16} color={C.heading} />
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
                                <p style={{ textAlign: 'right', fontSize: '11px', color: C.textMuted }}>{formData.reason.length} / 500</p>
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
                                    className="px-6 py-2.5 cursor-pointer bg-transparent border-none hover:opacity-70"
                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {submitting && <Loader2 size={16} className="animate-spin" />} {editingLeave ? 'Update Request' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Main Layout ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Column: Stats & Table */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Table Container */}
                    <div className="p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        
                        {/* Tabs & Search */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'pending', label: 'Pending', count: stats.pending, color: C.warning },
                                    { id: 'approved', label: 'Approved', count: stats.approved, color: C.success },
                                    { id: 'rejected', label: 'Rejected', count: stats.rejected, color: C.danger },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveFilter(tab.id); setCurrentPage(1); }}
                                        className="flex items-center gap-1 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70 pb-1"
                                        style={{ 
                                            color: activeFilter === tab.id ? C.heading : C.textMuted, 
                                            fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily,
                                            borderBottom: activeFilter === tab.id ? `2px solid ${C.btnPrimary}` : '2px solid transparent'
                                        }}
                                    >
                                        {tab.label}
                                        {tab.count !== undefined && (
                                            <span style={{ 
                                                backgroundColor: activeFilter === tab.id ? tab.color : 'transparent', 
                                                color: activeFilter === tab.id ? '#fff' : tab.color, 
                                                width: '18px', height: '18px', borderRadius: R.full, 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: '10px', marginLeft: '4px', opacity: activeFilter === tab.id ? 1 : 0.5 
                                            }}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                                <input 
                                    type="text" 
                                    placeholder="Search requests..."
                                    style={{ ...baseInputStyle, paddingLeft: '36px' }}
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>

                        {/* List / Table */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_2fr_1fr_100px] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Student', 'Leave Dates', 'Type', 'Reason', 'Status', 'Actions'].map(h => (
                                        <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                                    ))}
                                </div>
                                
                                {paginatedLeaves.length === 0 ? (
                                    <div className="text-center py-16 flex flex-col items-center">
                                        <Calendar size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No leave requests found.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {paginatedLeaves.map(leave => (
                                            <div key={leave._id} className="grid grid-cols-[2fr_1.5fr_1.5fr_2fr_1fr_100px] gap-4 px-4 py-3 items-center"
                                                style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                                
                                                {/* Student (Placeholder for Tutor context, using Tutor info since it's "My Leaves") */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.heading, fontWeight: T.weight.bold }}>
                                                        {/* Normally Student Avatar, here we show just an icon since it's tutor's own leave */}
                                                        <Calendar size={18} color={C.btnPrimary} />
                                                    </div>
                                                    <div>
                                                        <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>My Leave</p>
                                                        <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Duration: {getDuration(leave.startDate, leave.endDate)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-center">
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, margin: '0 0 2px 0' }}>
                                                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {leave.startDate !== leave.endDate && (
                                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted }}>
                                                            - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading }}>
                                                        {getLeaveType(leave.reason)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="line-clamp-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, margin: 0 }}>
                                                        {getLeaveReason(leave.reason)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <StatusBadge status={leave.status} />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setViewingLeave(viewingLeave?._id === leave._id ? null : leave)}
                                                        className="px-3 py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80 w-full"
                                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
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
                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, marginRight: '8px' }}>
                                    Rows per page: {ITEMS_PER_PAGE}
                                </span>
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: '#E3DFF8', borderRadius: R.md, color: C.heading }}>
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                                        className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-all"
                                        style={{ 
                                            backgroundColor: currentPage === i + 1 ? C.btnPrimary : '#E3DFF8', 
                                            color: currentPage === i + 1 ? '#fff' : C.heading, 
                                            borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold 
                                        }}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: '#E3DFF8', borderRadius: R.md, color: C.heading }}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Column: Guidelines */}
                <div className="lg:col-span-1">
                    <div className="p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Guidelines</h3>
                        
                        <div className="space-y-4">
                            {[
                                { icon: '✏️', text: 'Submit leave requests in advance when possible' },
                                { icon: '📅', text: 'Specify the start and end dates clearly' },
                                { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                { icon: '📎', text: 'Attach supporting documents if required' },
                                { icon: '👤', text: 'Assign a substitute for your batches' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span style={{ fontSize: '18px' }}>{tip.icon}</span>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.4 }}>{tip.text}</p>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 h-11 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            View Leave Policy
                        </button>
                    </div>
                </div>

            </div>

            {/* ── View Detail Modal ─────────────────────────────────────────── */}
            {viewingLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setViewingLeave(null)}>
                    <div className="w-full max-w-md p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                    <Calendar size={18} color={C.btnPrimary} />
                                </div>
                                <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Leave Details</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={viewingLeave.status} />
                                <button onClick={() => setViewingLeave(null)} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center" style={{ width: '32px', height: '32px', backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                    <X size={16} color={C.heading} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Type</p>
                                <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{getLeaveType(viewingLeave.reason)}</p>
                            </div>
                            
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Dates</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, margin: 0 }}>
                                    {new Date(viewingLeave.startDate).toLocaleDateString()} – {new Date(viewingLeave.endDate).toLocaleDateString()}
                                    <span style={{ color: C.textMuted, marginLeft: '8px' }}>({getDuration(viewingLeave.startDate, viewingLeave.endDate)})</span>
                                </p>
                            </div>

                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Reason</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.5, backgroundColor: '#E3DFF8', padding: '12px', borderRadius: R.xl }}>
                                    {getLeaveReason(viewingLeave.reason)}
                                </p>
                            </div>

                            {viewingLeave.adminComment && (
                                <div className="pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Admin Response</p>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, margin: 0, lineHeight: 1.5, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, padding: '12px', borderRadius: R.xl }}>
                                        {viewingLeave.adminComment}
                                    </p>
                                </div>
                            )}

                            {viewingLeave.status === 'pending' && (
                                <div className="pt-4 mt-2 flex justify-end">
                                    <button onClick={() => { setViewingLeave(null); handleDelete(viewingLeave._id); }} className="flex items-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                        style={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        <Trash2 size={16} /> Delete Request
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