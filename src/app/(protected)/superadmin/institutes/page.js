'use client';

import { useState, useEffect } from 'react';
import { getInstitutes, createInstitute, updateInstituteStatus, getSubscriptionPlans, deleteInstitute } from '@/services/superadminService';
import {
    Plus, Search, MoreHorizontal, Building2, Shield, PowerOff, Eye,
    CheckCircle2, Ban, Trash2, Filter, ChevronDown, Users, BookOpen, Edit, CheckSquare, Clock, GraduationCap,
    ChevronRight, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function InstitutesPage() {
    const [institutes, setInstitutes] = useState([]);
    const [availablePlans, setAvailablePlans] = useState([]); // 🌟 Naya state plans ke liye
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const router = useRouter();

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    // Form State (planId null rakha hai initially)
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        planId: '',
        maxTutors: 5,
        maxStudents: 50,
        instituteType: 'Coaching'
    });

    const loadData = async () => {
        try {
            setLoading(true);
            // 🌟 Ek saath Institutes aur Plans dono fetch karenge
            const [instData, plansData] = await Promise.all([
                getInstitutes(),
                getSubscriptionPlans()
            ]);

            if (instData.success) {
                setInstitutes(instData.institutes || []);
            }
            if (plansData.success) {
                setAvailablePlans(plansData.plans || []);
                // Default pehla plan set kar do agar plans hain toh
                if (plansData.plans?.length > 0) {
                    const firstPlan = plansData.plans[0];
                    setFormData(prev => ({
                        ...prev,
                        planId: firstPlan._id,
                        maxTutors: firstPlan.features?.maxTutors === -1 ? 1000 : (firstPlan.features?.maxTutors || 5),
                        maxStudents: firstPlan.features?.maxStudents === -1 ? 10000 : (firstPlan.features?.maxStudents || 50)
                    }));
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.planId && availablePlans.length > 0) {
            return toast.error("Please select a subscription plan");
        }
        try {
            const data = await createInstitute(formData);
            if (data.success) {
                toast.success('Institute created successfully');
                setIsAddModalOpen(false);
                setFormData({ name: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: '', planId: availablePlans[0]?._id || '', maxTutors: 5, maxStudents: 50, instituteType: 'Coaching' });
                loadData();
            }
        } catch (error) {
            toast.error(error.message || 'Error creating institute');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this institute?`)) return;
        try {
            const data = await updateInstituteStatus(id, !currentStatus);
            if (data.success) {
                toast.success(`Institute ${!currentStatus ? 'activated' : 'suspended'}`);
                loadData();
            }
        } catch (error) {
            toast.error(error.message || 'Error updating status');
        }
    };

    const handleDeleteInstitute = async (id) => {
        if (!confirm("🚨 DANGER: Are you sure you want to PERMANENTLY delete this institute? All associated users, courses, and data will be lost. This cannot be undone.")) return;

        try {
            const data = await deleteInstitute(id);
            if (data.success) {
                toast.success('Institute permanently deleted');
                loadData(); // Table refresh karne ke liye
            }
        } catch (error) {
            toast.error(error.message || 'Error deleting institute');
        }
        setOpenMenuId(null); // Dropdown band karne ke liye
    };

    const filteredInstitutes = institutes.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 🌟 Dynamic Theme Helper for Plans (Taki naye aur purane dono plans sundar dikhein)
    const getPlanBadge = (planName) => {
        if (!planName) return 'bg-[#F4F0FD] text-[#6B4DF1]';
        const name = planName.toLowerCase();
        if (name.includes('enterprise')) return 'bg-[#6B4DF1] text-white';
        if (name.includes('pro')) return 'bg-[#EBF8FF] text-[#3182CE]';
        if (name.includes('basic')) return 'bg-[#F4F0FD] text-[#6B4DF1]';
        // Generic fallback for custom plans (like Platinum, Gold, etc)
        return 'bg-[#FFF7ED] text-[#FC8730] border border-[#FDBA74]';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4EEFD]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#6B4DF1]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-black text-[#27225B] m-0">Institutes Management</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Manage all registered institutes, approvals & subscriptions.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                >
                    <Plus size={18} strokeWidth={3} /> Create Institute <ChevronRight size={16} className="ml-1 opacity-70" />
                </button>
            </div>

            {/* ── Top KPI Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 relative hover:-translate-y-1 transition-transform" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><Building2 size={16} strokeWidth={2.5} /></div>
                        <span className="text-[14px] font-bold text-[#4A5568]">Total Institutes</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-[28px] font-black text-[#27225B] leading-none">{institutes.length}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded-md">+ 10.2%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 relative hover:-translate-y-1 transition-transform" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#4ABCA8] flex items-center justify-center"><CheckCircle2 size={16} strokeWidth={2.5} /></div>
                        <span className="text-[14px] font-bold text-[#4A5568]">Active Institutes</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-[28px] font-black text-[#27225B] leading-none">{institutes.filter(i => i.isActive).length}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 relative hover:-translate-y-1 transition-transform" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#FC8730] flex items-center justify-center"><Clock size={16} strokeWidth={2.5} /></div>
                        <span className="text-[14px] font-bold text-[#4A5568]">Pending Approvals</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-[28px] font-black text-[#FC8730] leading-none">{institutes.filter(i => i.approvalStatus === 'pending').length || 0}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 relative hover:-translate-y-1 transition-transform" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#E53E3E] flex items-center justify-center"><Ban size={16} strokeWidth={2.5} /></div>
                        <span className="text-[14px] font-bold text-[#4A5568]">Suspended Institutes</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-[28px] font-black text-[#E53E3E] leading-none">{institutes.filter(i => !i.isActive && i.approvalStatus !== 'pending').length}</span>
                    </div>
                </div>
            </div>

            {/* ── Main Table Area ── */}
            <div className="bg-white rounded-3xl flex flex-col border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>

                {/* Table Toolbar */}
                <div className="px-6 py-5 flex flex-col xl:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD] bg-[#FDFBFF] rounded-t-3xl">
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        {/* Status Filters */}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                            <input
                                type="text"
                                placeholder="Search institutes..."
                                className="pl-9 pr-4 py-2 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto px-4 pb-4 min-h-[350px]">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-[#F9F7FC] rounded-xl">
                            <tr>
                                <th className="px-2 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider pl-6">Institute Name ▾</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Domain ^</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Institute Type</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Subscription Plan</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider text-center">Tutors</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider text-center">Students</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Created</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider last:rounded-r-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {filteredInstitutes.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-[#7D8DA6] font-medium">No institutes found.</td></tr>
                            ) : filteredInstitutes.map((inst, i) => (
                                <tr key={inst._id} className="hover:bg-[#F8F7FF] transition-colors relative">
                                    <td className="px-2 py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-[8px] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-sm ${i % 3 === 0 ? 'bg-[#6B4DF1]' : i % 3 === 1 ? 'bg-[#FC8730]' : 'bg-[#4ABCA8]'
                                                }`}>
                                                <Building2 size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[13px] font-black text-[#27225B] m-0 leading-tight">{inst.name}</p>
                                                <p className="text-[11px] font-bold text-[#A0ABC0] m-0 mt-0.5">#{inst._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-[13px] font-bold text-[#6B4DF1] underline cursor-pointer">{inst.subdomain || 'domain'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-[13px] font-semibold text-[#4A5568]">{inst.instituteType || 'Coaching'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {/* 🌟 Dynamic Plan Badge */}
                                        <span className={`px-2.5 py-1 text-[11px] font-black rounded-md capitalize ${getPlanBadge(inst.subscriptionPlan)}`}>
                                            {inst.subscriptionPlan || 'No Plan'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 text-[13px] font-black text-[#4A5568] bg-[#F4F0FD] px-2 py-0.5 rounded-md border border-[#E9DFFC]">
                                            <GraduationCap size={14} className="text-[#6B4DF1]" /> {(inst.tutorsCount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 text-[13px] font-black text-[#4A5568] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                                            <Users size={14} className="text-[#4ABCA8]" /> {(inst.studentsCount || inst.userCount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-[12px] font-semibold text-[#7D8DA6]">
                                            {new Date(inst.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-start gap-4 relative">
                                            <button
                                                onClick={() => router.push(`/superadmin/institutes/${inst._id}`)}
                                                className="w-7 h-7 rounded-md text-[#6B4DF1] hover:text-[#5839D6] hover:bg-[#F4F0FD] flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
                                                title="View Profile"
                                            >
                                                <Eye size={16} strokeWidth={2.5} />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    e.nativeEvent.stopImmediatePropagation();
                                                    setOpenMenuId(openMenuId === inst._id ? null : inst._id);
                                                }}
                                                className="w-7 h-7 rounded-md text-[#A0ABC0] hover:text-[#27225B] hover:bg-[#F4F0FD] flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>

                                            {openMenuId === inst._id && (
                                                <div
                                                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(107,77,241,0.2)] border border-[#E9DFFC] z-[9999] py-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button onClick={() => { toggleStatus(inst._id, inst.isActive); setOpenMenuId(null); }} className={`w-full text-left px-4 py-2 text-[12px] font-bold flex items-center gap-3 transition-colors border-none bg-transparent cursor-pointer ${inst.isActive ? 'text-[#E53E3E] hover:bg-[#FEE2E2]' : 'text-[#4ABCA8] hover:bg-[#ECFDF5]'}`}>
                                                        {inst.isActive ? <Ban size={14} /> : <CheckSquare size={14} />}
                                                        {inst.isActive ? 'Suspend Institute' : 'Activate Institute'}
                                                    </button>
                                                    <button onClick={() => handleDeleteInstitute(inst._id)} className="w-full text-left px-4 py-2 text-[12px] font-bold text-[#E53E3E] hover:bg-[#FEE2E2] flex items-center gap-3 transition-colors border-none bg-transparent cursor-pointer mt-1 border-t border-slate-100 pt-2">
                                                        <Trash2 size={14} /> Delete Permanently
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e103c]/40 backdrop-blur-md">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden border border-[#D5C2F6] max-h-[90vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF] flex justify-between items-center shrink-0">
                            <h2 className="text-[18px] font-black text-[#27225B] flex items-center gap-2 m-0">
                                <Building2 className="w-5 h-5 text-[#6B4DF1]" /> Onboard New Institute
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-[#A0ABC0] hover:text-[#E53E3E] bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-[#FEE2E2] transition-colors">
                                <PowerOff size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 custom-scrollbar bg-[#FAFAFA]">
                            <form id="add-inst-form" onSubmit={handleCreate} className="space-y-6">

                                {/* Organization Details */}
                                <div className="bg-white p-5 rounded-2xl border border-[#E9DFFC] shadow-sm">
                                    <h3 className="text-[13px] font-black text-[#6B4DF1] uppercase tracking-wider mb-4">Organization Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[13px] font-bold text-[#27225B] mb-1.5">Institute Name</label>
                                            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} type="text" className="w-full p-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-semibold text-[#27225B]" placeholder="e.g. Acme Academy" />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-bold text-[#27225B] mb-1.5">Subdomain</label>
                                            <input required value={formData.subdomain} onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} type="text" className="w-full p-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] font-mono text-[13px] font-bold text-[#6B4DF1]" placeholder="acme" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[13px] font-bold text-[#27225B] mb-1.5">Institute Type</label>
                                            <select value={formData.instituteType} onChange={(e) => setFormData({ ...formData, instituteType: e.target.value })} className="w-full p-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-semibold text-[#27225B] outline-none">
                                                <option>Coaching</option>
                                                <option>School</option>
                                                <option>College</option>
                                                <option>University</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Account */}
                                <div className="bg-white p-5 rounded-2xl border border-[#E9DFFC] shadow-sm">
                                    <h3 className="text-[13px] font-black text-[#6B4DF1] uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Shield className="w-4 h-4" /> Admin Account
                                    </h3>
                                    <div className="grid grid-cols-1 gap-5">
                                        <div>
                                            <label className="block text-[13px] font-bold text-[#27225B] mb-1.5">Admin Full Name</label>
                                            <input required value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} type="text" className="w-full p-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-semibold text-[#27225B]" placeholder="John Doe" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[13px] font-bold text-[#27225B] mb-1.5">Admin Email</label>
                                                <input required value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} type="email" className="w-full p-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-semibold text-[#27225B]" placeholder="admin@acme.edu" />
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-bold text-[#27225B] mb-1.5">Temporary Password</label>
                                                <input required value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} type="text" className="w-full p-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-semibold text-[#27225B] tracking-widest" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Plan - 🌟 NOW DYNAMIC */}
                             {/* Subscription Plan - 🌟 NOW DYNAMIC & CUSTOMIZABLE */}
                                <div className="bg-white p-5 rounded-2xl border border-[#E9DFFC] shadow-sm">
                                    <h3 className="text-[13px] font-black text-[#6B4DF1] uppercase tracking-wider mb-4">Subscription Plan & Limits</h3>

                                    {availablePlans.length === 0 ? (
                                        <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                            <AlertCircle className="w-6 h-6 text-[#FC8730] mb-2" />
                                            <h4 className="text-[14px] font-bold text-[#9A3412] m-0">No Premium Plans Configured</h4>
                                            <p className="text-[12px] text-[#C05621] mt-1 mb-3">You can create the institute with a free default plan, or setup premium plans first.</p>
                                            <Link href="/superadmin/subscription-plans" className="text-[13px] font-bold text-white bg-[#FC8730] px-4 py-2 rounded-lg hover:bg-[#EA580C] transition-colors text-decoration-none">
                                                Manage Plans
                                            </Link>
                                        </div>
                                    ) : null}

                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <label className="block text-[13px] font-bold text-[#27225B] mb-2">Select Base Plan</label>
                                            <select
                                                value={formData.planId || 'free'}
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    if (selectedId === 'free') {
                                                        setFormData({
                                                            ...formData,
                                                            planId: '',
                                                            maxTutors: 5,
                                                            maxStudents: 50,
                                                            storageLimitGB: 5,
                                                            aiCreditsPerMonth: 0
                                                        });
                                                        return;
                                                    }
                                                    
                                                    const selectedPlan = availablePlans.find(p => p._id === selectedId);
                                                    setFormData({
                                                        ...formData,
                                                        planId: selectedId,
                                                        maxTutors: selectedPlan?.features?.maxTutors === -1 ? 1000 : (selectedPlan?.features?.maxTutors || 5),
                                                        maxStudents: selectedPlan?.features?.maxStudents === -1 ? 10000 : (selectedPlan?.features?.maxStudents || 50),
                                                        storageLimitGB: selectedPlan?.features?.storageLimitGB || 10,
                                                        aiCreditsPerMonth: selectedPlan?.features?.aiCreditsPerMonth || 0
                                                    });
                                                }}
                                                className="w-full p-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[13px] font-bold text-[#27225B] outline-none cursor-pointer"
                                            >
                                                <option value="free">No Plan (Free / Default Limits)</option>
                                                {availablePlans.map(plan => (
                                                    <option key={plan._id} value={plan._id}>
                                                        {plan.name} ({plan.features.maxTutors === -1 ? 'Unlimited' : plan.features.maxTutors} Tutors, {plan.features.maxStudents === -1 ? 'Unlimited' : plan.features.maxStudents} Students)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="bg-[#F8F6FC] p-4 rounded-xl border border-purple-100/50">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Custom Limit Overrides</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-[#27225B] mb-1.5">Max Tutors</label>
                                                    <input type="number" min="1" value={formData.maxTutors} onChange={(e) => setFormData({ ...formData, maxTutors: parseInt(e.target.value) || 5 })} className="w-full p-2.5 bg-white border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B4DF1] text-[13px] font-bold text-[#27225B]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-[#27225B] mb-1.5">Max Students</label>
                                                    <input type="number" min="1" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 50 })} className="w-full p-2.5 bg-white border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B4DF1] text-[13px] font-bold text-[#27225B]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-[#27225B] mb-1.5">Storage (GB)</label>
                                                    <input type="number" min="1" value={formData.storageLimitGB || 5} onChange={(e) => setFormData({ ...formData, storageLimitGB: parseInt(e.target.value) || 5 })} className="w-full p-2.5 bg-white border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B4DF1] text-[13px] font-bold text-[#27225B]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-[#8B5CF6] mb-1.5">AI Credits/Mo</label>
                                                    <input type="number" min="0" value={formData.aiCreditsPerMonth || 0} onChange={(e) => setFormData({ ...formData, aiCreditsPerMonth: parseInt(e.target.value) || 0 })} className="w-full p-2.5 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6B4DF1] text-[13px] font-black text-[#8B5CF6] shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-[#F4F0FD] bg-white flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 bg-white border border-[#E9DFFC] text-[#7A6C9B] font-bold text-[13px] rounded-xl cursor-pointer hover:bg-[#F9F7FC] transition-colors">Cancel</button>
                           <button
                                type="submit"
                                form="add-inst-form"
                                disabled={loading} // 🌟 Disabled hata diya taaki Free par bhi create ho sake
                                className="px-8 py-2.5 bg-[#6B4DF1] text-white font-bold text-[13px] rounded-xl hover:bg-[#5839D6] disabled:bg-[#D1C4F9] transition-colors shadow-md border-none cursor-pointer"
                            >
                                {loading ? 'Creating...' : 'Create Institute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}