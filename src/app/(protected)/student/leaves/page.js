'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    MdCalendarToday, MdAdd, MdAccessTime, MdCheckCircle, MdCancel, MdArticle,
    MdDelete, MdVisibility, MdEdit, MdChevronLeft, MdChevronRight,
    MdAssignment, MdAutoAwesome, MdClose
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

const LEAVE_TYPES = [
    'Sick Leave', 'Medical Appointment', 'Personal Reasons',
    'Family Emergency', 'Family Function', 'Vacation', 'Other',
];

const ITEMS_PER_PAGE = 5;

// ─── Focus Handlers & Base Styles ──────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

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

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        pending:  { bg: C.warningBg,  color: C.warning,  label: 'Pending', icon: MdAccessTime },
        approved: { bg: C.successBg,  color: C.success,  label: 'Approved', icon: MdCheckCircle },
        rejected: { bg: C.dangerBg,   color: C.danger,   label: 'Rejected', icon: MdCancel },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 uppercase tracking-wider"
            style={{ backgroundColor: s.bg, color: s.color, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, borderRadius: '10px', border: `1px solid ${s.color}40` }}>
            <Icon style={{ width: 12, height: 12 }} />
            {s.label}
        </span>
    );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function UserLeavesPage() {
    const [leaves, setLeaves]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [submitting, setSubmitting]     = useState(false);
    const [showForm, setShowForm]         = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const { confirmDialog }               = useConfirm();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '',
    });

    useEffect(() => { fetchMyLeaves(); }, []);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaves/my');
            if (res.data.success) setLeaves(res.data.leaves);
        } catch { toast.error('Failed to load leave history'); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => ({
        pending:  leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        total:    leaves.length,
    }), [leaves]);

    const filteredLeaves = useMemo(() =>
        activeFilter === 'all' ? leaves : leaves.filter(l => l.status === activeFilter),
        [leaves, activeFilter]
    );

    const totalPages     = Math.max(1, Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE));
    const paginatedLeaves = filteredLeaves.slice(
        (currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE
    );

    const getDuration = (start, end) => {
        const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
        return `${diff} Day${diff !== 1 ? 's' : ''}`;
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
                endDate: formData.endDate,
                reason: `[${formData.leaveType}] ${formData.reason}`,
                documents: formData.documentUrl ? [{ name: 'Supporting Document', url: formData.documentUrl, type: 'url' }] : [],
            };
            if (editingLeave) {
                await api.put(`/leaves/${editingLeave._id}`, payload);
                toast.success('Leave request updated!');
            } else {
                await api.post('/leaves', payload);
                toast.success('Leave application submitted!');
            }
            setShowForm(false); setEditingLeave(null);
            setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '' });
            fetchMyLeaves();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit leave');
        } finally { setSubmitting(false); }
    };

    const handleEdit = (leave) => {
        const match = leave.reason?.match(/^\[(.+?)\]\s*(.*)/s);
        setFormData({
            leaveType: match ? match[1] : 'Other',
            startDate: new Date(leave.startDate).toISOString().split('T')[0],
            endDate: new Date(leave.endDate).toISOString().split('T')[0],
            reason: match ? match[2] : leave.reason,
            documentUrl: leave.documents?.[0]?.url || '',
        });
        setEditingLeave(leave); setShowForm(true);
    };

    const handleDelete = async (leaveId) => {
        const ok = await confirmDialog('Delete Leave Request', 'Are you sure?', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/leaves/${leaveId}`);
            toast.success('Leave request deleted');
            fetchMyLeaves();
        } catch { toast.error('Failed to delete'); }
    };

    const getLeaveType   = (r) => r?.match(/^\[(.+?)\]/)?.[1] || 'Leave';
    const getLeaveReason = (r) => r?.match(/^\[.+?\]\s*(.*)/s)?.[1] || r;

    // ── Loading State ──────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading leaves...
                </p>
            </div>
        </div>
    );

    const labelStyle = {
        display: 'block',
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.bold,
        color: C.statLabel,
        textTransform: 'uppercase',
        letterSpacing: T.tracking.wider,
        marginBottom: 6,
    };

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBox, borderRadius: '10px' }}>
                        <MdAssignment style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: '0 0 4px 0' }}>
                            Leave Requests
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>
                            Manage your leave applications
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm); setEditingLeave(null);
                        setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '' });
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', boxShadow: S.btn, fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                    <MdAdd style={{ width: 18, height: 18 }} /> {showForm ? 'Cancel Request' : 'New Request'}
                </button>
            </div>

            {/* ── Leave Form ───────────────────────────────────────────── */}
            {showForm && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Form */}
                    <div className="xl:col-span-2 p-6"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}>
                        
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="flex items-center justify-center shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdEdit style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading }}>
                                {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Leave Type */}
                            <div>
                                <label style={labelStyle}>Leave Type</label>
                                <select value={formData.leaveType}
                                    onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                    style={{ ...baseInputStyle, cursor: 'pointer', appearance: 'none' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[['startDate', 'From Date', new Date().toISOString().split('T')[0]],
                                  ['endDate',   'To Date',   formData.startDate || new Date().toISOString().split('T')[0]]]
                                .map(([field, label, minDate]) => (
                                    <div key={field}>
                                        <label style={labelStyle}>{label}</label>
                                        <input type="date" required min={minDate}
                                            value={formData[field]}
                                            onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                            style={baseInputStyle}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    </div>
                                ))}
                            </div>

                            {/* Reason */}
                            <div>
                                <label style={labelStyle}>Reason for Leave</label>
                                <textarea required rows={4} maxLength={500}
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please provide the reason for your leave…"
                                    style={{ ...baseInputStyle, resize: 'none' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textAlign: 'right', marginTop: 4, fontWeight: T.weight.bold }}>
                                    {formData.reason.length} / 500
                                </p>
                            </div>

                            {/* Attachment */}
                            <div>
                                <label style={labelStyle}>Attachment (optional)</label>
                                <input type="url" value={formData.documentUrl}
                                    onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                    placeholder="Paste document link (Google Drive, etc.)"
                                    style={baseInputStyle}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 4, fontWeight: T.weight.bold }}>
                                    Attach supporting document • Max 5MB
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: C.cardBorder }}>
                                <button type="button"
                                    onClick={() => { setShowForm(false); setEditingLeave(null); }}
                                    className="px-5 py-2.5 cursor-pointer transition-all hover:opacity-80"
                                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-6 py-2.5 cursor-pointer disabled:opacity-50 transition-all hover:opacity-90 border-none"
                                    style={{ background: C.gradientBtn, color: '#fff', borderRadius: '10px', boxShadow: S.btn, fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {submitting ? 'Submitting…' : (editingLeave ? 'Update Request' : 'Submit Request')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Guidelines */}
                    <div className="p-6 h-fit"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, borderRadius: R['2xl'] }}>
                        
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="flex items-center justify-center shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdArticle style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading }}>
                                Guidelines
                            </h2>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { icon: '✏️', text: 'Submit leave requests in advance, if possible' },
                                { icon: '📅', text: 'Specify the start and end dates clearly' },
                                { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                { icon: '📎', text: 'Attach supporting documents if required' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 border" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                                    <span className="text-base flex-shrink-0">{tip.icon}</span>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, margin: 0, lineHeight: T.leading.relaxed }}>
                                        {tip.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 cursor-pointer transition-all hover:opacity-80"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            View Leave Policy
                        </button>
                    </div>
                </div>
            )}

            {/* ── Stats + Table ─────────────────────────────────────────── */}
            {!showForm && (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Pending" value={stats.pending} icon={MdAccessTime} iconBg={C.warningBg} iconColor={C.warning} />
                        <StatCard label="Approved" value={stats.approved} icon={MdCheckCircle} iconBg={C.successBg} iconColor={C.success} />
                        <StatCard label="Rejected" value={stats.rejected} icon={MdCancel} iconBg={C.dangerBg} iconColor={C.danger} />
                        <StatCard label="Total" value={stats.total} icon={MdAssignment} iconBg="#EEF2FF" iconColor={C.btnPrimary} />
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* Table Area */}
                        <div className="xl:col-span-3 overflow-hidden"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, borderRadius: R['2xl'] }}>

                            {/* Filter bar */}
                            <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: C.innerBox, borderBottom: `1px solid ${C.cardBorder}` }}>
                                <div className="flex bg-white p-1 border shadow-sm" style={{ borderColor: C.cardBorder, borderRadius: '10px' }}>
                                    {[
                                        { key: 'all',      label: 'All' },
                                        { key: 'pending',  label: `Pending (${stats.pending})` },
                                        { key: 'approved', label: `Approved (${stats.approved})` },
                                        { key: 'rejected', label: `Rejected (${stats.rejected})` },
                                    ].map(f => (
                                        <button key={f.key}
                                            onClick={() => { setActiveFilter(f.key); setCurrentPage(1); }}
                                            className="px-4 py-2 capitalize cursor-pointer border-none transition-all"
                                            style={activeFilter === f.key
                                                ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                                                : { backgroundColor: 'transparent', color: C.textMuted, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, borderRadius: '8px' }}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
                                {paginatedLeaves.length === 0 ? (
                                    <div className="p-14 text-center border border-dashed mx-6 my-10" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                        <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                            <MdArticle style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Leave Requests</h3>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4, fontWeight: T.weight.semibold }}>You don't have any leave applications matching this filter.</p>
                                    </div>
                                ) : (
                                    <div className="min-w-[900px]">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-[40px_2.5fr_2fr_1.5fr_1.5fr_120px] gap-4 px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                                            {['#', 'Type', 'Dates', 'Duration', 'Status', 'Actions'].map((col, i) => (
                                                <span key={col} className={i === 5 ? 'text-right' : 'text-left'}
                                                    style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        {/* Table Rows */}
                                        <div className="flex flex-col p-3 gap-2">
                                            {paginatedLeaves.map((leave, idx) => (
                                                <div key={leave._id} className="grid grid-cols-[40px_2.5fr_2fr_1.5fr_1.5fr_120px] gap-4 px-4 py-4 items-center transition-colors hover:bg-white/40"
                                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                                    
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.btnPrimary, fontWeight: T.weight.bold }}>
                                                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                                    </span>

                                                    <div className="pr-2">
                                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                            {getLeaveType(leave.reason)}
                                                        </p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted, margin: 0, fontWeight: T.weight.bold }}>
                                                            Applied: {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>

                                                    <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, fontWeight: T.weight.semibold }}>
                                                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                                                        {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>

                                                    <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {getDuration(leave.startDate, leave.endDate)}
                                                    </div>

                                                    <div>
                                                        <StatusBadge status={leave.status} />
                                                    </div>

                                                    <div className="text-right flex items-center justify-end gap-1.5">
                                                        {leave.status === 'pending' ? (
                                                            <button onClick={() => handleEdit(leave)}
                                                                className="w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-all hover:opacity-80"
                                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                                                <MdEdit style={{ width: 16, height: 16 }} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setViewingLeave(viewingLeave?._id === leave._id ? null : leave)}
                                                                className="w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-all hover:opacity-80"
                                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                                                <MdVisibility style={{ width: 16, height: 16 }} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(leave._id)}
                                                            className="w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-all hover:opacity-80"
                                                            style={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px' }}>
                                                            <MdDelete style={{ width: 16, height: 16 }} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                        Showing page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-8 h-8 flex items-center justify-center cursor-pointer border-none disabled:opacity-40 transition-colors bg-white shadow-sm"
                                            style={{ borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                            <MdChevronLeft style={{ width: 16, height: 16, color: C.heading }} />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button key={i} onClick={() => setCurrentPage(i + 1)}
                                                className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-colors text-xs"
                                                style={currentPage === i + 1 ? { backgroundColor: C.btnPrimary, color: '#fff', fontWeight: T.weight.bold, borderRadius: '10px', boxShadow: S.card } : { backgroundColor: 'transparent', color: C.textMuted, fontWeight: T.weight.bold, borderRadius: '10px' }}>
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-8 h-8 flex items-center justify-center cursor-pointer border-none disabled:opacity-40 transition-colors bg-white shadow-sm"
                                            style={{ borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                            <MdChevronRight style={{ width: 16, height: 16, color: C.heading }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── View Modal ────────────────────────────────────────────── */}
            {viewingLeave && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingLeave(null)}>
                    <div className="shadow-2xl max-w-md w-full p-6"
                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdVisibility style={{ width: 20, height: 20, color: C.btnPrimary }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                    Leave Details
                                </h3>
                            </div>
                            <button onClick={() => setViewingLeave(null)} className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-colors"
                                style={{ backgroundColor: C.surfaceWhite, color: C.heading, borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}>
                                <MdClose style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', margin: 0 }}>Status</p>
                                <StatusBadge status={viewingLeave.status} />
                            </div>

                            {[
                                { label: 'Type',   value: getLeaveType(viewingLeave.reason) },
                                { label: 'Dates',  value: `${new Date(viewingLeave.startDate).toLocaleDateString()} – ${new Date(viewingLeave.endDate).toLocaleDateString()} (${getDuration(viewingLeave.startDate, viewingLeave.endDate)})` },
                                { label: 'Reason', value: getLeaveReason(viewingLeave.reason) },
                            ].map(item => (
                                <div key={item.label} className="p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>
                                        {item.label}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.heading, fontWeight: T.weight.bold, lineHeight: T.leading.relaxed, margin: 0 }}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}

                            {viewingLeave.adminComment && (
                                <div className="p-4" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.successBorder}`, borderRadius: '10px' }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.success, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>
                                        Admin Response
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.heading, fontWeight: T.weight.semibold, margin: 0 }}>
                                        {viewingLeave.adminComment}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setViewingLeave(null)}
                            className="w-full py-3 text-white cursor-pointer border-none transition-all hover:opacity-90"
                            style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, borderRadius: '10px', boxShadow: S.btn }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}