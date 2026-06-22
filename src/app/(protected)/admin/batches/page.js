'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdSearch, MdAdd, MdVisibility, MdDelete, MdEdit,
    MdLayers, MdCheckCircle, MdWarning, MdHourglassEmpty, MdChevronRight, MdFilterList
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddBatchWizardModal from '@/components/shared/AddBatchWizardModal';
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
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

export default function AdminBatchesPage() {
    const router = useRouter();
    const { confirmDialog } = useConfirm();

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filtered.map(b => b._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        const isConfirmed = await confirmDialog("Bulk Delete Batches", `Are you sure you want to delete the ${selectedIds.length} selected batches? This action is permanent.`, { variant: 'destructive' });
        if (!isConfirmed) return;
        
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/batches/${id}`)));
            toast.success('Selected batches deleted successfully');
            setBatches(prev => prev.filter(b => !selectedIds.includes(b._id)));
            setSelectedIds([]);
        } catch (error) {
            toast.error('Failed to delete some batches');
            fetchBatches();
        }
    };

    const handleBulkStatusChange = async (newStatus) => {
        const actionMap = { 'active': 'Activate', 'upcoming': 'Mark Upcoming', 'completed': 'Complete' };
        const actionName = actionMap[newStatus] || newStatus;
        const isConfirmed = await confirmDialog(`Bulk ${actionName} Batches`, `Are you sure you want to change status to ${newStatus} for the ${selectedIds.length} selected batches?`, { variant: newStatus === 'completed' ? 'destructive' : 'default' });
        if (!isConfirmed) return;

        try {
            await Promise.all(selectedIds.map(id => api.put(`/batches/${id}`, { status: newStatus })));
            toast.success(`Selected batches status updated successfully`);
            setBatches(prev => prev.map(b => selectedIds.includes(b._id) ? { ...b, status: newStatus } : b));
            setSelectedIds([]);
        } catch (error) {
            toast.error(`Failed to update some batches' status`);
            fetchBatches();
        }
    };

    useEffect(() => { fetchBatches(); }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/batches');
            if (res.data.success) setBatches(res.data.batches || []);
        } catch (error) {
            toast.error('Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirmDialog('Delete Batch', 'Are you sure? This cannot be undone.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/batches/${id}`);
            setBatches(batches.filter(b => b._id !== id));
            toast.success('Batch deleted');
            setSelectedIds(prev => prev.filter(x => x !== id));
        } catch {
            toast.error('Failed to delete batch');
        }
    };


    // Compute unique grades from batches for filter dropdown
    const uniqueGrades = [...new Set(batches.map(b => b.grade).filter(Boolean))].sort();

    const filtered = batches.filter(b => {
        const matchSearch = !searchTerm || b.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !statusFilter || b.status === statusFilter;
        const matchGrade = !gradeFilter || b.grade === gradeFilter;
        return matchSearch && matchStatus && matchGrade;
    });

    // Dynamic stats from real data
    const totalBatches = batches.length;
    const activeBatches = batches.filter(b => b.status === 'active').length;
    const upcomingBatches = batches.filter(b => b.status === 'upcoming').length;
    const completedBatches = batches.filter(b => b.status === 'completed').length;

    const statusBadge = (status) => {
        const s = status || 'active';
        const map = {
            active: { bg: C.successBg, color: C.success, border: C.successBorder, label: 'Active' },
            upcoming: { bg: C.warningBg, color: C.warning, border: C.warningBorder, label: 'Upcoming' },
            completed: { bg: C.btnViewAllBg, color: C.btnPrimary, border: C.cardBorder, label: 'Completed' },
        };
        return map[s] || { bg: C.innerBg, color: C.text, border: C.cardBorder, label: s };
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
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen w-full" style={{ backgroundColor: C.pageBg, ...pageStyle }}>

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdLayers}
                    value={totalBatches}
                    label="Total Batches"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdCheckCircle}
                    value={activeBatches}
                    label="Active"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdWarning}
                    value={upcomingBatches}
                    label="Upcoming"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdHourglassEmpty}
                    value={completedBatches}
                    label="Completed"
                    iconBg={C.dangerBg}
                    iconColor={C.danger}
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="relative w-full xl:w-[360px] group">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ width: 18, height: 18, color: C.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <select
                        value={gradeFilter}
                        onChange={e => setGradeFilter(e.target.value)}
                        style={{ ...baseInputStyle, width: 'auto', minWidth: '120px', cursor: 'pointer' }}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    >
                        <option value="">All Grades</option>
                        {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ ...baseInputStyle, width: 'auto', minWidth: '120px', cursor: 'pointer' }}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                    </select>

                    <button
                        onClick={() => { setEditingBatch(null); setShowModal(true); }}
                        className="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer w-full sm:w-auto justify-center"
                        style={{ padding: '10px 20px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                    >
                        <MdAdd style={{ width: 18, height: 18 }} /> Add Batch
                    </button>
                </div>
            </div>

            {/* ── Batch Table ── */}
            {filtered.length === 0 ? (
                <div className="p-14 text-center border border-dashed flex flex-col items-center justify-center" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdLayers style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No batches found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                        {searchTerm || statusFilter || gradeFilter ? 'Try adjusting your filters.' : 'Create your first batch to get started.'}
                    </p>
                    {!searchTerm && !statusFilter && !gradeFilter && (
                        <button
                            onClick={() => { setEditingBatch(null); setShowModal(true); }}
                            className="mt-6 flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
                            style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                        >
                            <MdAdd style={{ width: 18, height: 18 }} /> Add Batch
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col overflow-hidden w-full" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    <th style={{ width: '48px', padding: '16px 0 16px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <input 
                                            type="checkbox"
                                            checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                            onChange={handleSelectAll}
                                            style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }}
                                        />
                                    </th>
                                    <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Batch Name</th>
                                    <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Course</th>
                                    <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Grade</th>
                                    <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Students</th>
                                    <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                    <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(batch => {
                                    const badge = statusBadge(batch.status);
                                    const courseName = batch.courseId?.title || '—';
                                    const studentCount = batch.students?.length || 0;
                                    return (
                                        <tr key={batch._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                            <td style={{ padding: '16px 0 16px 24px' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedIds.includes(batch._id)}
                                                    onChange={() => handleSelectRow(batch._id)}
                                                    style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>

                                                <div className="flex flex-col">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {batch.name}
                                                    </span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, marginTop: 4 }}>
                                                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <div className="line-clamp-1 max-w-[200px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                    {courseName}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                    {batch.grade || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {studentCount} enrolled
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
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
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                    border: `1px solid ${badge.border}`
                                                }}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => router.push(`/admin/batches/${batch._id}`)}
                                                        title="View"
                                                        className="transition-colors border-none cursor-pointer"
                                                        style={{ backgroundColor: 'transparent', padding: '6px', color: C.btnPrimary }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#5839D6'}
                                                        onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}
                                                    >
                                                        <MdVisibility style={{ width: 18, height: 18 }} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                                                        title="Edit"
                                                        className="transition-colors border-none cursor-pointer"
                                                        style={{ backgroundColor: 'transparent', padding: '6px', color: C.success }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#389E8D'}
                                                        onMouseLeave={e => e.currentTarget.style.color = C.success}
                                                    >
                                                        <MdEdit style={{ width: 18, height: 18 }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(batch._id)}
                                                        title="Delete"
                                                        className="transition-colors border-none cursor-pointer"
                                                        style={{ backgroundColor: 'transparent', padding: '6px', color: C.danger }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#C53030'}
                                                        onMouseLeave={e => e.currentTarget.style.color = C.danger}
                                                    >
                                                        <MdDelete style={{ width: 18, height: 18 }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Floating Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-6 py-4 rounded-2xl shadow-2xl border transition-all duration-300 animate-in slide-in-from-bottom-5"
                     style={{
                         backgroundColor: 'rgba(39, 34, 91, 0.95)',
                         backdropFilter: 'blur(10px)',
                         borderColor: 'rgba(255, 255, 255, 0.1)',
                         boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
                         minWidth: '320px',
                         maxWidth: '90%',
                         width: 'max-content'
                     }}>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: C.btnPrimary, color: '#ffffff', fontSize: T.size.sm }}>
                            {selectedIds.length}
                        </div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#ffffff' }}>
                            Batches Selected
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button onClick={() => handleBulkStatusChange('active')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.successBg, color: C.success, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdCheckCircle style={{ width: 16, height: 16 }} /> Activate
                        </button>
                        <button onClick={() => handleBulkStatusChange('upcoming')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.warningBg, color: C.warning, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdHourglassEmpty style={{ width: 16, height: 16 }} /> Upcoming
                        </button>
                        <button onClick={() => handleBulkStatusChange('completed')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdCheckCircle style={{ width: 16, height: 16 }} /> Complete
                        </button>
                        <button onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.dangerBg, color: C.danger, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdDelete style={{ width: 16, height: 16 }} /> Delete
                        </button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                        <button onClick={() => setSelectedIds([])}
                                className="transition-colors hover:text-white cursor-pointer border-none bg-transparent font-bold"
                                style={{ color: 'rgba(255,255,255,0.5)', fontSize: T.size.sm }}>
                            Clear
                        </button>
                    </div>
                </div>
            )}
            {/* ── Wizard Modal ── */}
            {showModal && (
                <AddBatchWizardModal
                    role="admin"
                    initialData={editingBatch}
                    onClose={() => { setShowModal(false); setEditingBatch(null); }}
                    onSuccess={fetchBatches}
                />
            )}
        </div>
    );
}