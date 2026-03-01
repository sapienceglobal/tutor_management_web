'use client';

import { useState, useEffect } from 'react';
import { getInstitutes, createInstitute, updateInstituteStatus } from '@/services/superadminService';
import { Plus, Search, MoreVertical, Building2, Shield, Power, PowerOff, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function InstitutesPage() {
    const [institutes, setInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const router = useRouter();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        plan: 'free'
    });

    const loadInstitutes = async () => {
        try {
            setLoading(true);
            const data = await getInstitutes();
            if (data.success) {
                setInstitutes(data.institutes);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load institutes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInstitutes();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const data = await createInstitute(formData);
            if (data.success) {
                toast.success('Institute created successfully');
                setIsAddModalOpen(false);
                setFormData({ name: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'free' });
                loadInstitutes();
            }
        } catch (error) {
            toast.error(error.message || 'Error creating institute');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this institute?`)) return;
        try {
            const data = await updateInstituteStatus(id, !currentStatus);
            if (data.success) {
                toast.success(`Institute ${!currentStatus ? 'activated' : 'deactivated'}`);
                loadInstitutes();
            }
        } catch (error) {
            toast.error(error.message || 'Error updating status');
        }
    };

    const filteredInstitutes = institutes.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Institutes</h1>
                    <p className="text-slate-500 mt-1">Manage tenants, subscriptions, and platform access.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Institute
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        placeholder="Search institutes by name or subdomain..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-sm font-semibold text-slate-600">Institute</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Subdomain</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Plan</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Users</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                                    </td>
                                </tr>
                            ) : filteredInstitutes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No institutes found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredInstitutes.map((inst) => (
                                    <tr key={inst._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                                    {inst.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{inst.name}</p>
                                                    <p className="text-xs text-slate-500 select-all">ID: {inst._id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 font-mono text-sm">{inst.subdomain}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${inst.subscriptionPlan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                                inst.subscriptionPlan === 'pro' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {inst.subscriptionPlan}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">{inst.userCount || 0}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-max gap-1.5 ${inst.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${inst.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {inst.isActive ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => router.push(`/superadmin/institutes/${inst._id}`)}
                                                    className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    title="View Users"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(inst._id, inst.isActive)}
                                                    className={`p-2 rounded-lg transition-colors ${inst.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title={inst.isActive ? "Suspend Institute" : "Activate Institute"}
                                                >
                                                    {inst.isActive ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                Onboard New Institute
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Search className="w-5 h-5 rotate-45" /> {/* Use X icon logic securely */}
                                Close
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-6">

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">📝 Organization Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Institute Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="e.g. Acme Academy"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                                        <input
                                            required
                                            value={formData.subdomain}
                                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            type="text"
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                                            placeholder="acme"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Will be used for app.sapience.com/<b>subdomain</b> (or DNS)</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-indigo-600" />
                                    Admin Account
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Admin Full Name</label>
                                        <input
                                            required
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                            type="text"
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                                            <input
                                                required
                                                value={formData.adminEmail}
                                                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                                type="email"
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="admin@acme.edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                                            <input
                                                required
                                                value={formData.adminPassword}
                                                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                                type="text"
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">💎 Subscription Plan</h3>
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <option value="free">Free (Basic Features)</option>
                                    <option value="pro">Pro (Adds Custom Branding, AI Basic)</option>
                                    <option value="enterprise">Enterprise (HLS Streaming, Full AI, Zoom)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors border border-slate-200">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Create Institute</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
