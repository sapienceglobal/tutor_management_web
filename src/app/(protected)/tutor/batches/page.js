'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdHourglassEmpty, 
    MdSearch, 
    MdPeople, 
    MdCalendarToday, 
    MdAdd, 
    MdVisibility, 
    MdEdit,
    MdGroup
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';
import AddBatchWizardModal from '@/components/shared/AddBatchWizardModal';

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
    backgroundColor: C.surfaceWhite,
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

export default function TutorBatchesPage() {
    const router = useRouter();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

    useEffect(() => { fetchBatches(); }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/batches');
            if (res?.data?.success) setBatches(res.data.batches || []);
        } catch {
            toast.error('Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const filtered = batches.filter(b => b?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusStyle = (status) => {
        if (status === 'active') return { bg: C.successBg, color: C.success, border: C.successBorder };
        if (status === 'completed') return { bg: C.innerBg, color: C.textMuted, border: C.cardBorder };
        return { bg: C.warningBg, color: C.warning, border: C.warningBorder };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading batches...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdGroup size={24} color={C.iconColor} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>My Batches</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Manage your student batches, announcements & analytics</p>
                    </div>
                </div>
            </div>

            {/* ── Filters & Actions ── */}
            <div className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in duration-500 delay-100"
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full sm:w-72">
                    <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={18} color={C.textMuted} />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        style={{ ...baseInputStyle, paddingLeft: '40px', height: '44px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <button
                    onClick={() => { setEditingBatch(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto justify-center"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, height: '44px', boxShadow: S.btn }}>
                    <MdAdd size={18} /> New Batch
                </button>
            </div>

            {/* ── Batch List ── */}
            <div className="animate-in fade-in duration-500 delay-200">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center"
                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                        <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: C.innerBg, borderRadius: '12px' }}>
                            <MdGroup size={28} color={C.textMuted} style={{ opacity: 0.5 }} />
                        </div>
                        <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No batches found</p>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            {searchTerm ? 'Try a different search term.' : 'Create your first batch to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="min-w-[850px]">
                            <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_auto] gap-4 px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                {['Batch Name', 'Course', 'Grade', 'Students', 'Start Date', 'Actions'].map((h, i) => (
                                    <span key={h} className={i === 5 ? 'text-right pr-2' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                ))}
                            </div>

                            <div className="flex flex-col">
                                {filtered.map((batch, index) => {
                                    const st = statusStyle(batch.status || 'active');
                                    const courseName = batch.courseId?.title || '—';
                                    
                                    return (
                                        <div key={batch._id} className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_auto] gap-4 px-6 py-4 items-center transition-colors"
                                            style={{ backgroundColor: C.cardBg, borderBottom: index !== filtered.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.cardBg}>

                                            <div className="min-w-0 pr-2">
                                                <h3 className="truncate" style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 6px 0' }}>{batch.name}</h3>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: T.weight.black, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                    backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`
                                                }}>
                                                    {batch.status || 'Active'}
                                                </span>
                                            </div>

                                            <div className="min-w-0 pr-2">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>{courseName}</p>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{batch.grade || '—'}</p>
                                            </div>

                                            <div className="flex items-center gap-2 min-w-0" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                                <MdPeople size={16} /> <span className="truncate">{batch.students?.length || 0} Enrolled</span>
                                            </div>

                                            <div className="flex items-center gap-2 min-w-0" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                                <MdCalendarToday size={16} />
                                                <span className="truncate">{batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                            </div>

                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/tutor/batches/${batch._id}`)}
                                                    className="flex items-center justify-center gap-1.5 px-4 py-2 cursor-pointer transition-colors border-none shadow-sm"
                                                    style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.btnPrimary; }}>
                                                    <MdVisibility size={14} /> View
                                                </button>
                                                <button
                                                    onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                                                    className="flex items-center justify-center gap-1.5 px-4 py-2 cursor-pointer transition-colors border-none shadow-sm"
                                                    style={{ backgroundColor: C.iconBg, color: C.btnPrimary, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.iconBg; e.currentTarget.style.color = C.btnPrimary; }}>
                                                    <MdEdit size={14} /> Edit
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Wizard Modal ── */}
            {showModal && (
                <AddBatchWizardModal
                    role="tutor"
                    initialData={editingBatch}
                    onClose={() => { setShowModal(false); setEditingBatch(null); }}
                    onSuccess={fetchBatches}
                />
            )}
        </div>
    );
}