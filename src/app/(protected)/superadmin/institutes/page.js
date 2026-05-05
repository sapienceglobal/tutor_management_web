'use client';

import { useState, useEffect } from 'react';
import { getInstitutes, createInstitute, updateInstituteStatus, getSubscriptionPlans, deleteInstitute } from '@/services/superadminService';
import {
    MdAdd, MdSearch, MdMoreHoriz, MdBusiness, MdSecurity, MdPowerSettingsNew, MdVisibility,
    MdCheckCircle, MdBlock, MdDelete, MdFilterList, MdKeyboardArrowDown, MdPeople, MdMenuBook, MdEdit, MdCheckBox, MdAccessTime, MdSchool,
    MdChevronRight, MdErrorOutline
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Input Base Style ────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function InstitutesPage() {
    const [institutes, setInstitutes] = useState([]);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const router = useRouter();

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
            const [instData, plansData] = await Promise.all([
                getInstitutes(),
                getSubscriptionPlans()
            ]);

            if (instData.success) {
                setInstitutes(instData.institutes || []);
            }
            if (plansData.success) {
                setAvailablePlans(plansData.plans || []);
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
                loadData();
            }
        } catch (error) {
            toast.error(error.message || 'Error deleting institute');
        }
        setOpenMenuId(null);
    };

    const filteredInstitutes = institutes.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPlanBadge = (planName) => {
        if (!planName) return { backgroundColor: C.innerBg, color: C.btnPrimary, border: 'none' };
        const name = planName.toLowerCase();
        if (name.includes('enterprise')) return { backgroundColor: C.btnPrimary, color: '#ffffff', border: 'none' };
        if (name.includes('pro')) return { backgroundColor: '#EBF8FF', color: '#3182CE', border: 'none' };
        if (name.includes('basic')) return { backgroundColor: C.innerBg, color: C.btnPrimary, border: 'none' };
        return { backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                        Institutes Management
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, marginTop: 4, margin: 0 }}>
                        Manage all registered institutes, approvals & subscriptions.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 transition-opacity hover:opacity-90"
                    style={{
                        background: C.gradientBtn,
                        color: '#ffffff',
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        borderRadius: '10px',
                        boxShadow: S.btn,
                        border: 'none',
                        cursor: 'pointer',
                        padding: '12px 20px',
                    }}
                >
                    <MdAdd style={{ width: 18, height: 18 }} /> Create Institute <MdChevronRight style={{ width: 16, height: 16, opacity: 0.7 }} />
                </button>
            </div>

            {/* ── Top KPI Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={MdBusiness}
                    value={institutes.length}
                    label="Total Institutes"
                    iconBg="#EEF2FF"
                    iconColor="#4F46E5"
                />
                <StatCard
                    icon={MdCheckCircle}
                    value={institutes.filter(i => i.isActive).length}
                    label="Active Institutes"
                    iconBg="#ECFDF5"
                    iconColor="#10B981"
                />
                <StatCard
                    icon={MdAccessTime}
                    value={institutes.filter(i => i.approvalStatus === 'pending').length || 0}
                    label="Pending Approvals"
                    iconBg="#FFF7ED"
                    iconColor="#F59E0B"
                />
                <StatCard
                    icon={MdBlock}
                    value={institutes.filter(i => !i.isActive && i.approvalStatus !== 'pending').length}
                    label="Suspended Institutes"
                    iconBg={C.dangerBg}
                    iconColor={C.danger}
                />
            </div>

            {/* ── Main Table Area ── */}
            <div className="flex flex-col" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                {/* Table Toolbar */}
                <div className="px-6 py-5 flex flex-col xl:flex-row items-center justify-between gap-4 border-b" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg, borderTopLeftRadius: R['2xl'], borderTopRightRadius: R['2xl'] }}>
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        {/* Status Filters - kept empty structurally based on original code */}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-80">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                            <input
                                type="text"
                                placeholder="Search institutes..."
                                style={{ ...baseInputStyle, paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto px-4 pb-4 min-h-[350px]">
                    <table className="w-full text-left border-collapse min-w-[1000px] mt-4">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                {['Institute Name ▾', 'Domain ^', 'Institute Type', 'Subscription Plan', 'Tutors', 'Students', 'Created', 'Actions'].map((header, idx) => (
                                    <th key={idx} style={{
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        color: C.statLabel,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                        padding: '16px',
                                        borderBottom: `1px solid ${C.cardBorder}`,
                                        textAlign: (header === 'Tutors' || header === 'Students') ? 'center' : 'left',
                                        borderTopLeftRadius: idx === 0 ? '10px' : '0',
                                        borderBottomLeftRadius: idx === 0 ? '10px' : '0',
                                        borderTopRightRadius: idx === 7 ? '10px' : '0',
                                        borderBottomRightRadius: idx === 7 ? '10px' : '0'
                                    }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInstitutes.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8">
                                        <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdBusiness style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Institutes Found</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Try adjusting your search criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredInstitutes.map((inst, i) => (
                                <tr key={inst._id} className="transition-colors relative"
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center shrink-0"
                                                style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: i % 3 === 0 ? C.btnPrimary : i % 3 === 1 ? C.warning : C.success, color: '#ffffff' }}>
                                                <MdBusiness style={{ width: 16, height: 16 }} />
                                            </div>
                                            <div className="flex flex-col">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.2 }}>{inst.name}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0, marginTop: 2 }}>#{inst._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'underline', cursor: 'pointer' }}>
                                            {inst.subdomain || 'domain'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                            {inst.instituteType || 'Coaching'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span style={{
                                            fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '4px 10px', borderRadius: '10px', textTransform: 'capitalize',
                                            ...getPlanBadge(inst.subscriptionPlan)
                                        }}>
                                            {inst.subscriptionPlan || 'No Plan'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text, backgroundColor: C.innerBg, padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                            <MdSchool style={{ width: 14, height: 14, color: C.btnPrimary }} /> {(inst.tutorsCount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text, backgroundColor: C.successBg, padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.successBorder}` }}>
                                            <MdPeople style={{ width: 14, height: 14, color: C.success }} /> {(inst.studentsCount || inst.userCount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                            {new Date(inst.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 relative">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.push(`/superadmin/institutes/${inst._id}`)}
                                                className="flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                                                style={{ width: 28, height: 28, borderRadius: '10px', color: C.btnPrimary }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                title="View Profile"
                                            >
                                                <MdVisibility style={{ width: 16, height: 16 }} />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    e.nativeEvent.stopImmediatePropagation();
                                                    setOpenMenuId(openMenuId === inst._id ? null : inst._id);
                                                }}
                                                className="flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                                                style={{ width: 28, height: 28, borderRadius: '10px', color: C.textMuted }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
                                            >
                                                <MdMoreHoriz style={{ width: 16, height: 16 }} />
                                            </button>

                                            {openMenuId === inst._id && (
                                                <div
                                                    className="absolute right-0 top-full mt-1 w-48 z-[9999] py-2"
                                                    style={{ backgroundColor: C.cardBg, borderRadius: '10px', boxShadow: S.cardHover, border: `1px solid ${C.cardBorder}` }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => { toggleStatus(inst._id, inst.isActive); setOpenMenuId(null); }}
                                                        className="w-full text-left px-4 py-2 flex items-center gap-3 transition-colors border-none bg-transparent cursor-pointer"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: inst.isActive ? C.danger : C.success }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = inst.isActive ? C.dangerBg : C.successBg; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                        {inst.isActive ? <MdBlock style={{ width: 16, height: 16 }} /> : <MdCheckBox style={{ width: 16, height: 16 }} />}
                                                        {inst.isActive ? 'Suspend Institute' : 'Activate Institute'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInstitute(inst._id)}
                                                        className="w-full text-left px-4 py-2 flex items-center gap-3 transition-colors border-none bg-transparent cursor-pointer mt-1 pt-2"
                                                        style={{ borderTop: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.danger }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                        <MdDelete style={{ width: 16, height: 16 }} /> Delete Permanently
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-2xl overflow-hidden flex flex-col" style={{ backgroundColor: C.pageBg, borderRadius: R['2xl'], boxShadow: S.cardHover, border: `1px solid ${C.cardBorder}`, maxHeight: '90vh' }}>
                        <div className="px-6 py-5 flex justify-between items-center shrink-0" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <MdBusiness style={{ width: 20, height: 20, color: C.btnPrimary }} /> Onboard New Institute
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="bg-transparent border-none cursor-pointer p-1 transition-colors"
                                style={{ color: C.textMuted, borderRadius: '10px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
                            >
                                <MdPowerSettingsNew style={{ width: 20, height: 20, transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6" style={{ backgroundColor: C.pageBg }}>
                            <form id="add-inst-form" onSubmit={handleCreate} className="space-y-6">

                                {/* Organization Details */}
                                <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: '20px', boxShadow: S.card }}>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                            <MdBusiness style={{ width: 14, height: 14, color: C.iconColor }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Organization Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Institute Name</label>
                                            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} type="text" style={baseInputStyle} placeholder="e.g. Acme Academy" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Subdomain</label>
                                            <input required value={formData.subdomain} onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} type="text" style={{ ...baseInputStyle, fontFamily: T.fontFamilyMono, color: C.btnPrimary }} placeholder="acme" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Institute Type</label>
                                            <select value={formData.instituteType} onChange={(e) => setFormData({ ...formData, instituteType: e.target.value })} style={baseInputStyle}>
                                                <option>Coaching</option>
                                                <option>School</option>
                                                <option>College</option>
                                                <option>University</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Account */}
                                <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: '20px', boxShadow: S.card }}>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                            <MdSecurity style={{ width: 14, height: 14, color: C.iconColor }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Admin Account</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Admin Full Name</label>
                                            <input required value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} type="text" style={baseInputStyle} placeholder="John Doe" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Admin Email</label>
                                                <input required value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} type="email" style={baseInputStyle} placeholder="admin@acme.edu" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Temporary Password</label>
                                                <input required value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} type="text" style={{ ...baseInputStyle, letterSpacing: T.tracking.wider }} placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Plan & Limits */}
                                <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: '20px', boxShadow: S.card }}>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                            <MdMenuBook style={{ width: 14, height: 14, color: C.iconColor }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Subscription Plan & Limits</h3>
                                    </div>

                                    {availablePlans.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center p-4" style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: '10px' }}>
                                            <MdErrorOutline style={{ width: 24, height: 24, color: C.warning, marginBottom: '8px' }} />
                                            <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.warning, margin: 0 }}>No Premium Plans Configured</h4>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.heading, marginTop: '4px', marginBottom: '12px' }}>You can create the institute with a free default plan, or setup premium plans first.</p>
                                            <Link href="/superadmin/subscription-plans" className="text-decoration-none" style={{ backgroundColor: C.warning, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, padding: '8px 16px', borderRadius: '10px' }}>
                                                Manage Plans
                                            </Link>
                                        </div>
                                    ) : null}

                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Select Base Plan</label>
                                            <select
                                                value={formData.planId || 'free'}
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    if (selectedId === 'free') {
                                                        setFormData({
                                                            ...formData, planId: '', maxTutors: 5, maxStudents: 50, storageLimitGB: 5, aiCreditsPerMonth: 0
                                                        });
                                                        return;
                                                    }
                                                    const selectedPlan = availablePlans.find(p => p._id === selectedId);
                                                    setFormData({
                                                        ...formData, planId: selectedId,
                                                        maxTutors: selectedPlan?.features?.maxTutors === -1 ? 1000 : (selectedPlan?.features?.maxTutors || 5),
                                                        maxStudents: selectedPlan?.features?.maxStudents === -1 ? 10000 : (selectedPlan?.features?.maxStudents || 50),
                                                        storageLimitGB: selectedPlan?.features?.storageLimitGB || 10,
                                                        aiCreditsPerMonth: selectedPlan?.features?.aiCreditsPerMonth || 0
                                                    });
                                                }}
                                                style={baseInputStyle}
                                            >
                                                <option value="free">No Plan (Free / Default Limits)</option>
                                                {availablePlans.map(plan => (
                                                    <option key={plan._id} value={plan._id}>
                                                        {plan.name} ({plan.features.maxTutors === -1 ? 'Unlimited' : plan.features.maxTutors} Tutors, {plan.features.maxStudents === -1 ? 'Unlimited' : plan.features.maxStudents} Students)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '16px' }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: T.tracking.wider }}>Custom Limit Overrides</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Max Tutors</label>
                                                    <input type="number" min="1" value={formData.maxTutors} onChange={(e) => setFormData({ ...formData, maxTutors: parseInt(e.target.value) || 5 })} style={baseInputStyle} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Max Students</label>
                                                    <input type="number" min="1" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 50 })} style={baseInputStyle} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, marginBottom: '6px' }}>Storage (GB)</label>
                                                    <input type="number" min="1" value={formData.storageLimitGB || 5} onChange={(e) => setFormData({ ...formData, storageLimitGB: parseInt(e.target.value) || 5 })} style={baseInputStyle} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, marginBottom: '6px' }}>AI Credits/Mo</label>
                                                    <input type="number" min="0" value={formData.aiCreditsPerMonth || 0} onChange={(e) => setFormData({ ...formData, aiCreditsPerMonth: parseInt(e.target.value) || 0 })} style={{ ...baseInputStyle, color: C.btnPrimary }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 flex justify-end gap-3 shrink-0" style={{ backgroundColor: C.cardBg, borderTop: `1px solid ${C.cardBorder}` }}>
                            <button type="button" onClick={() => setIsAddModalOpen(false)}
                                style={{
                                    backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`,
                                    fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, borderRadius: '10px', padding: '10px 24px', cursor: 'pointer'
                                }}
                            >Cancel</button>
                            <button
                                type="submit"
                                form="add-inst-form"
                                disabled={loading}
                                style={{
                                    background: loading ? C.cardBorder : C.gradientBtn, color: '#ffffff', border: 'none', boxShadow: loading ? 'none' : S.btn,
                                    fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, borderRadius: '10px', padding: '10px 32px', cursor: loading ? 'not-allowed' : 'pointer'
                                }}
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