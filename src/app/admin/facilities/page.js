'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import {
    Building2, MapPin, Plus, Loader2, Trash2, Edit3, Phone, Mail, Globe, X
} from 'lucide-react';

export default function AdminFacilitiesPage() {
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        campusName: '', contactNumber: '', email: '', mapUrl: '',
        address: { street: '', city: '', state: '', zipCode: '', country: '' },
    });

    useEffect(() => { fetchFacilities(); }, []);

    const fetchFacilities = async () => {
        try {
            const res = await api.get('/facilities');
            if (res.data.success) setFacilities(res.data.data);
        } catch (err) {
            console.error('Fetch facilities error:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ campusName: '', contactNumber: '', email: '', mapUrl: '', address: { street: '', city: '', state: '', zipCode: '', country: '' } });
        setEditing(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.campusName) { toast.error('Campus name is required'); return; }
        setSaving(true);
        try {
            if (editing) {
                const res = await api.put(`/facilities/${editing}`, form);
                if (res.data.success) {
                    setFacilities(prev => prev.map(f => f._id === editing ? res.data.data : f));
                    toast.success('Facility updated!');
                }
            } else {
                const res = await api.post('/facilities', form);
                if (res.data.success) {
                    setFacilities(prev => [res.data.data, ...prev]);
                    toast.success('Facility created!');
                }
            }
            resetForm();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save facility');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (facility) => {
        setForm({
            campusName: facility.campusName,
            contactNumber: facility.contactNumber || '',
            email: facility.email || '',
            mapUrl: facility.mapUrl || '',
            address: facility.address || { street: '', city: '', state: '', zipCode: '', country: '' },
        });
        setEditing(facility._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this facility?')) return;
        try {
            await api.delete(`/facilities/${id}`);
            setFacilities(prev => prev.filter(f => f._id !== id));
            toast.success('Facility deleted');
        } catch (err) {
            toast.error('Failed to delete facility');
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Facility Manager</h1>
                    <p className="text-slate-500 mt-1">Manage your campus infrastructure and facilities</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Facility
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 mb-8 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Facility' : 'Add New Facility'}</h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label>Campus Name *</Label>
                                <Input placeholder="Main Campus" value={form.campusName} onChange={(e) => setForm({ ...form, campusName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Number</Label>
                                <Input placeholder="+91 98765 43210" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input placeholder="campus@institute.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Google Maps URL</Label>
                                <Input placeholder="https://maps.google.com/..." value={form.mapUrl} onChange={(e) => setForm({ ...form, mapUrl: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <Label>Street</Label>
                                <Input placeholder="Street Address" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input placeholder="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                            </div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Input placeholder="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editing ? 'Update Facility' : 'Create Facility'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Facility List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
            ) : facilities.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-slate-100">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No facilities yet</h3>
                    <p className="text-slate-400">Add your first campus or facility.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {facilities.map((f) => (
                        <div key={f._id} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-50 p-3 rounded-xl">
                                        <Building2 className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{f.campusName}</h3>
                                        {f.address?.city && (
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" /> {f.address.city}{f.address.state ? `, ${f.address.state}` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(f)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(f._id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
                                {f.contactNumber && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {f.contactNumber}</span>}
                                {f.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {f.email}</span>}
                                {f.mapUrl && <a href={f.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-500 hover:underline"><Globe className="h-3 w-3" /> Map</a>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
