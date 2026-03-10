'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Users, Calendar, Plus, Eye } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors bg-white";

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
            if (res.data.success) setBatches(res.data.batches || res.data.data || []);
        } catch { toast.error('Failed to load batches'); }
        finally { setLoading(false); }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            if (res.data.success) setCourses(res.data.courses || res.data.data || []);
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
            if (res.data.success) {
                toast.success('Batch created successfully!');
                setShowForm(false);
                setFormData({ name: '', courseId: '', description: '', scheduleDescription: '', startDate: '', endDate: '' });
                fetchBatches();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create batch');
        } finally { setSaving(false); }
    };

    const filtered = batches.filter(b => b.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusStyle = (status) => {
        if (status === 'active')    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (status === 'completed') return 'bg-slate-100 text-slate-600 border-slate-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading batches...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <Users className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">My Batches</h1>
                        <p className="text-xs text-slate-400">Manage your student batches, announcements & analytics</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search batches..."
                            className="pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors w-full sm:w-52"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity flex-shrink-0"
                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                        <Plus className="w-4 h-4" /> New Batch
                    </button>
                </div>
            </div>

            {/* ── Create Form ───────────────────────────────────────────────── */}
            {showForm && (
                <div className="bg-white rounded-xl border border-slate-100 p-6 animate-in slide-in-from-top-3 duration-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Create New Batch</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Batch Name *</label>
                            <input type="text" className={inp}
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Morning Batch A" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Course *</label>
                            <select className={inp}
                                value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })}>
                                <option value="">Select a course...</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Schedule Description</label>
                            <input type="text" className={inp}
                                value={formData.scheduleDescription}
                                onChange={e => setFormData({ ...formData, scheduleDescription: e.target.value })}
                                placeholder="e.g. Mon-Wed-Fri 10:00 AM" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Description</label>
                            <input type="text" className={inp}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Start Date *</label>
                            <input type="date" className={inp}
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">End Date</label>
                            <input type="date" className={inp}
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Batch
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Batch Cards ───────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}>
                        <Users className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">No batches found</p>
                    <p className="text-xs text-slate-400">
                        {searchTerm ? 'Try a different search term.' : 'Create your first batch to get started.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(batch => (
                        <div key={batch._id}
                            className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                    <Users className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border capitalize ${statusStyle(batch.status)}`}>
                                    {batch.status || 'Active'}
                                </span>
                            </div>

                            <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:transition-colors"
                                style={{ '--tw-text-opacity': 1 }}>
                                {batch.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4">{batch.description || 'No description'}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {batch.students?.length || 0} students
                                </span>
                                {batch.startDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {new Date(batch.startDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                                <button onClick={() => router.push(`/tutor/batches/${batch._id}`)}
                                    className="flex items-center justify-center w-full gap-1.5 py-2 text-xs font-semibold rounded-xl border transition-colors"
                                    style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, white)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, white)' }}>
                                    <Eye className="w-3.5 h-3.5" /> View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}