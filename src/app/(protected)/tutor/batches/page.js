'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Users, Calendar, Plus, Eye, X } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

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

export default function TutorBatchesPage() {
    const router = useRouter();
    const [batches, setBatches]   = useState([]);
    const [courses, setCourses]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [formData, setFormData] = useState({
        name: '', courseId: '', description: '',
        scheduleDescription: '', startDate: '', endDate: '',
    });

    useEffect(() => { fetchBatches(); fetchCourses(); }, []);

    const fetchBatches = async () => {
        try {
            const res = await api.get('/batches');
            if (res?.data?.success) setBatches(res.data.batches || res.data.data || []);
        } catch { toast.error('Failed to load batches'); }
        finally { setLoading(false); }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            if (res?.data?.success) setCourses(res.data.courses || res.data.data || []);
        } catch { /* silent */ }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name)     { toast.error('Batch name is required'); return; }
        if (!formData.courseId) { toast.error('Please select a course for this batch'); return; }
        if (!formData.startDate){ toast.error('Start date is required'); return; }

        setSaving(true);
        try {
            const res = await api.post('/batches', formData);
            if (res?.data?.success) {
                toast.success('Batch created successfully!');
                setShowForm(false);
                setFormData({ name: '', courseId: '', description: '', scheduleDescription: '', startDate: '', endDate: '' });
                fetchBatches();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create batch');
        } finally { setSaving(false); }
    };

    const filtered = batches.filter(b => b?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusStyle = (status) => {
        if (status === 'active')    return { bg: C.successBg, color: C.success, border: C.successBorder };
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

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl }}>
                        <Users size={20} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>My Batches</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Manage your student batches, announcements & analytics</p>
                    </div>
                </div>
            </div>

            {/* ── Filters & Actions ─────────────────────────────────────────── */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                    <input 
                        type="text" 
                        placeholder="Search batches..."
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto justify-center"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                    <Plus size={16} /> New Batch
                </button>
            </div>

            {/* ── Create Form Modal ─────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-2xl p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Create Batch</h3>
                            <button onClick={() => setShowForm(false)} className="bg-transparent border-none cursor-pointer hover:opacity-70">
                                <X size={20} color={C.heading} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Batch Name *</label>
                                <input type="text" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Morning Batch A" />
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Course *</label>
                                <select style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })}>
                                    <option value="" disabled>Select a course...</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Schedule Description</label>
                                <input type="text" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.scheduleDescription}
                                    onChange={e => setFormData({ ...formData, scheduleDescription: e.target.value })}
                                    placeholder="e.g. Mon-Wed-Fri 10:00 AM" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Description</label>
                                <textarea style={{ ...baseInputStyle, minHeight: '80px', resize: 'vertical' }} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description" />
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Start Date *</label>
                                <input type="date" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>End Date</label>
                                <input type="date" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 pt-4 mt-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="px-6 py-2.5 cursor-pointer bg-transparent border-none hover:opacity-70"
                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {saving && <Loader2 size={16} className="animate-spin" />} Create Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Batch List (Table View) ───────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-12 h-12 flex items-center justify-center mb-3"
                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Users size={24} color={C.btnPrimary} />
                    </div>
                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No batches found</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                        {searchTerm ? 'Try a different search term.' : 'Create your first batch to get started.'}
                    </p>
                </div>
            ) : (
                <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['Batch Name', 'Course', 'Students', 'Start Date', 'Actions'].map(h => (
                                <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                            ))}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            {filtered.map(batch => {
                                const st = statusStyle(batch.status || 'active');
                                return (
                                    <div key={batch._id} className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-4 px-4 py-3 items-center"
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

                                        <div>
                                            <p className="line-clamp-1" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                                {courses.find(c => c._id === batch.courseId)?.title || 'Unknown Course'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                            <Users size={16} /> {batch.students?.length || 0} Enrolled
                                        </div>

                                        <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                            <Calendar size={16} /> {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                                        </div>

                                        <div>
                                            <button onClick={() => router.push(`/tutor/batches/${batch._id}`)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 cursor-pointer transition-opacity hover:opacity-80 border-none"
                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.card }}>
                                                <Eye size={14} /> View Details
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
    );
}