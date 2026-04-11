'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Users, Calendar, Plus, Eye, Edit } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';
import AddBatchWizardModal from '@/components/shared/AddBatchWizardModal';

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
        if (status === 'completed') return { bg: C.btnViewAllBg, color: C.btnViewAllText, border: C.cardBorder };
        return { bg: C.warningBg, color: C.warning, border: C.warningBorder };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading batches...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl }}>
                        <Users size={20} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>My Batches</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Manage your student batches, announcements & analytics</p>
                    </div>
                </div>
            </div>

            {/* ── Filters & Actions ── */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
                style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        style={{ backgroundColor: '#E3DFF8', border: '1.5px solid transparent', borderRadius: R.xl, color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, outline: 'none', width: '100%', padding: '10px 16px 10px 36px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { setEditingBatch(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto justify-center"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                    <Plus size={16} /> New Batch
                </button>
            </div>

            {/* ── Batch List ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center"
                    style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-12 h-12 flex items-center justify-center mb-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Users size={24} color={C.btnPrimary} />
                    </div>
                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No batches found</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                        {searchTerm ? 'Try a different search term.' : 'Create your first batch to get started.'}
                    </p>
                </div>
            ) : (
                <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="min-w-[820px]">
                        <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_auto] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['Batch Name', 'Course', 'Grade', 'Students', 'Start Date', 'Actions'].map(h => (
                                <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2">
                            {filtered.map(batch => {
                                const st = statusStyle(batch.status || 'active');
                                const courseName = batch.courseId?.title || '—';
                                return (
                                    <div key={batch._id} className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_auto] gap-4 px-4 py-3 items-center"
                                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>

                                        <div>
                                            <h3 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{batch.name}</h3>
                                            <span style={{
                                                fontSize: '10px', fontWeight: T.weight.black, padding: '2px 8px', borderRadius: R.md, textTransform: 'uppercase',
                                                backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`
                                            }}>
                                                {batch.status || 'Active'}
                                            </span>
                                        </div>

                                        <p className="line-clamp-1" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>{courseName}</p>

                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{batch.grade || '—'}</p>

                                        <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                            <Users size={16} /> {batch.students?.length || 0} Enrolled
                                        </div>

                                        <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                            <Calendar size={16} />
                                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.push(`/tutor/batches/${batch._id}`)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 cursor-pointer transition-all hover:opacity-80 border-none"
                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.card }}>
                                                <Eye size={14} /> View
                                            </button>
                                            <button
                                                onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 cursor-pointer transition-all hover:opacity-80 border-none"
                                                style={{ backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                <Edit size={14} /> Edit
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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