'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Users, Calendar, Plus, Eye, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function AdminBatchesPage() {
    const router = useRouter();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const { confirmDialog } = useConfirm();
    const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '' });

    useEffect(() => { fetchBatches(); }, []);

    const fetchBatches = async () => {
        try {
            const res = await api.get('/batches');
            if (res.data.success) setBatches(res.data.batches || res.data.data || []);
        } catch (error) { toast.error('Failed to load batches'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error('Batch name is required');
        setSaving(true);
        try {
            const res = await api.post('/batches', formData);
            if (res.data.success) { toast.success('Batch created!'); setShowForm(false); setFormData({ name: '', description: '', startDate: '', endDate: '' }); fetchBatches(); }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to create batch'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        const ok = await confirmDialog('Delete Batch', 'Are you sure? This cannot be undone.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/batches/${id}`);
            setBatches(batches.filter(b => b._id !== id));
            toast.success('Batch deleted');
        } catch (error) { toast.error('Failed to delete batch'); }
    };

    const filtered = batches.filter(b => b.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Batch Management</h1>
                    <p className="text-slate-500">Create, manage & track student batches</p>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Batch</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Students</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Duration</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length > 0 ? filtered.map(batch => (
                            <tr key={batch._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center"><Users className="w-4 h-4 text-indigo-600" /></div>
                                        <div>
                                            <div className="font-medium text-slate-900">{batch.name}</div>
                                            <div className="text-xs text-slate-500">{batch.description || 'No description'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{batch.students?.length || 0}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                    {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '-'} → {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{batch.status || 'Active'}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => router.push(`/admin/batches/${batch._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(batch._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No batches found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
