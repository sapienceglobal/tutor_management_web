'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2, Search, Plus, Eye, Trash2, Edit,
    Layers, Check, AlertTriangle, Hourglass, ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddBatchWizardModal from '@/components/shared/AddBatchWizardModal';

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

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
            active: { bg: '#DCFCE7', color: '#15803D', label: 'Active' },
            upcoming: { bg: '#FEF3C7', color: '#D97706', label: 'Upcoming' },
            completed: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Completed' },
        };
        return map[s] || { bg: '#F3F4F6', color: '#6B7280', label: s };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F1EAFB]">
                <Loader2 className="w-8 h-8 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { title: 'Total Batches', value: totalBatches, iconBg: '#6B4DF1', icon: Layers },
                    { title: 'Active', value: activeBatches, iconBg: '#4ABCA8', icon: Check },
                    { title: 'Upcoming', value: upcomingBatches, iconBg: '#F5A623', icon: AlertTriangle },
                    { title: 'Completed', value: completedBatches, iconBg: '#3182CE', icon: Hourglass },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 relative cursor-pointer" style={{ boxShadow: softShadow }}>
                        <div className="w-[46px] h-[46px] rounded-[10px] flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: stat.iconBg }}>
                            <stat.icon size={22} color="#ffffff" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[24px] font-black text-[#27225B] leading-none mb-1.5">{stat.value}</span>
                            <span className="text-[13px] font-semibold text-[#7D8DA6] leading-none">{stat.title}</span>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">
                            <ChevronRight size={18} className="text-[#27225B]" strokeWidth={3} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4" style={{ boxShadow: softShadow }}>
                <div className="relative w-full xl:w-[360px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        className="pl-10 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <select
                        value={gradeFilter}
                        onChange={e => setGradeFilter(e.target.value)}
                        className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer">
                        <option value="">All Grades</option>
                        {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                    </select>

                    <button
                        onClick={() => { setEditingBatch(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                        style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                        <Plus size={16} /> Add Batch
                    </button>
                </div>
            </div>

            {/* ── Batch Table ── */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-14 flex flex-col items-center gap-3 text-center" style={{ boxShadow: softShadow }}>
                    <div className="w-14 h-14 bg-[#F3EEFF] rounded-2xl flex items-center justify-center">
                        <Layers size={26} className="text-[#6B4DF1]" />
                    </div>
                    <p className="text-[16px] font-black text-[#27225B]">No batches found</p>
                    <p className="text-[13px] font-medium text-[#7D8DA6]">
                        {searchTerm || statusFilter || gradeFilter ? 'Try adjusting your filters.' : 'Create your first batch to get started.'}
                    </p>
                    {!searchTerm && !statusFilter && !gradeFilter && (
                        <button
                            onClick={() => { setEditingBatch(null); setShowModal(true); }}
                            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                            <Plus size={15} /> Add Batch
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: softShadow }}>
                    {/* Table Head */}
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 bg-[#F9F7FF] border-b border-[#F0EBFF]">
                        {['Batch Name', 'Course', 'Grade', 'Students', 'Status', 'Actions'].map(h => (
                            <span key={h} className="text-[11px] font-black text-[#7D8DA6] uppercase tracking-wide">{h}</span>
                        ))}
                    </div>

                    <div className="divide-y divide-[#F5F0FF]">
                        {filtered.map(batch => {
                            const badge = statusBadge(batch.status);
                            const courseName = batch.courseId?.title || '—';
                            const studentCount = batch.students?.length || 0;
                            return (
                                <div key={batch._id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-[#FBF9FF] transition-colors">
                                    <div>
                                        <p className="text-[13px] font-bold text-[#27225B] leading-tight">{batch.name}</p>
                                        <p className="text-[11px] font-medium text-[#A0ABC0] mt-0.5">
                                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                    <p className="text-[13px] font-semibold text-[#4A5568] line-clamp-1">{courseName}</p>
                                    <p className="text-[13px] font-semibold text-[#4A5568]">{batch.grade || '—'}</p>
                                    <p className="text-[13px] font-bold text-[#27225B]">{studentCount} enrolled</p>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black"
                                        style={{ backgroundColor: badge.bg, color: badge.color }}>
                                        {badge.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/batches/${batch._id}`)}
                                            title="View"
                                            className="w-8 h-8 rounded-lg bg-[#F3EEFF] flex items-center justify-center border-none cursor-pointer hover:bg-[#6B4DF1] hover:text-white text-[#6B4DF1] transition-colors">
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                                            title="Edit"
                                            className="w-8 h-8 rounded-lg bg-[#F0FFF4] flex items-center justify-center border-none cursor-pointer hover:bg-[#38A169] hover:text-white text-[#38A169] transition-colors">
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(batch._id)}
                                            title="Delete"
                                            className="w-8 h-8 rounded-lg bg-[#FFF5F5] flex items-center justify-center border-none cursor-pointer hover:bg-[#E53E3E] hover:text-white text-[#E53E3E] transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
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