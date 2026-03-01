'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Users, Calendar, BookOpen, Plus, Eye, BarChart3 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function TutorBatchesPage() {
    const router = useRouter();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '' });

    useEffect(() => { fetchBatches(); }, []);

    const fetchBatches = async () => {
        try {
            const res = await api.get('/batches');
            if (res.data.success) setBatches(res.data.batches || res.data.data || []);
        } catch (error) {
            toast.error('Failed to load batches');
        } finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error('Batch name is required');
        setSaving(true);
        try {
            const res = await api.post('/batches', formData);
            if (res.data.success) {
                toast.success('Batch created!');
                setShowForm(false);
                setFormData({ name: '', description: '', startDate: '', endDate: '' });
                fetchBatches();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create batch');
        } finally { setSaving(false); }
    };

    const filtered = batches.filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Batches</h1>
                    <p className="text-slate-500 mt-1">Manage your student batches, announcements & analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search batches..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> New Batch
                    </Button>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4">Create New Batch</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-600">Batch Name *</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Morning Batch A" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-600">Description</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-600">Start Date</label>
                            <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-600">End Date</label>
                            <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Batch
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Batch Cards */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-600">No batches found</h3>
                    <p className="text-slate-400 text-sm mt-1">Create your first batch to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(batch => (
                        <div key={batch._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : batch.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                                    {batch.status || 'Active'}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{batch.name}</h3>
                            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{batch.description || 'No description'}</p>
                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {batch.students?.length || 0} students</span>
                                {batch.startDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(batch.startDate).toLocaleDateString()}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/tutor/batches/${batch._id}`)}>
                                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Details
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
