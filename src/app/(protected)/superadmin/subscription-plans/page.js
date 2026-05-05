'use client';

import React, { useState, useEffect } from 'react';
import { 
    MdAdd, MdEdit, MdDelete, MdCheckCircle, MdCancel, 
    MdBolt, MdSecurity, MdPublic, MdVideocam, MdMemory, MdSave, MdHourglassEmpty,
    MdMoreHoriz, MdBusiness, MdTrendingUp, MdSearch, 
    MdChevronLeft, MdChevronRight, MdDashboard
} from 'react-icons/md';
import toast from 'react-hot-toast';

// API services import
import { 
    getSubscriptionPlans, 
    createSubscriptionPlan, 
    updateSubscriptionPlan, 
    deleteSubscriptionPlan 
} from '@/services/superadminService';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1.5px solid ${C.cardBorder}`,
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function SubscriptionPlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');
    const initialFormState = {
        _id: null,
        name: '',
        price: '',
        billingCycle: 'monthly',
        isActive: true,
        isPopular: false,
        features: {
            // Core Limits
            maxTutors: 5,
            maxStudents: 100,
            storageLimitGB: 10,
            // Advanced LMS
            hlsStreaming: false, 
            customBranding: false, 
            zoomIntegration: false,
            apiAccess: false,
            // 🌟 The New AI Tiers & Credits
            aiAssistant: false,    // Basic Chat, Notes
            aiAssessment: false,   // Auto-grading, Plagiarism, Proctoring
            aiIntelligence: false, // Risk Predictor, Automation
            aiCreditsPerMonth: 1000 // The Bankruptcy Firewall
        }
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadPlans();
        
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await getSubscriptionPlans();
            if (data.success) {
                setPlans(data.plans || []);
            }
        } catch (error) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setFormData({ ...plan, _id: plan._id });
        } else {
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
        setOpenMenuId(null); 
    };

    const handleSavePlan = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let res;
            if (formData._id) {
                res = await updateSubscriptionPlan(formData._id, formData);
                toast.success('Plan updated successfully!');
            } else {
                const { _id, ...createData } = formData;
                res = await createSubscriptionPlan(createData);
                toast.success('New plan created!');
            }

            if (res.success) {
                setIsModalOpen(false);
                loadPlans();
            }
        } catch (error) {
            toast.error(error.message || 'Error saving plan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if(confirm("Are you sure you want to delete this plan?")) {
            await deleteSubscriptionPlan(id);
            toast.success("Plan deleted successfully");
            loadPlans();
        }
    };

    // 🌟 REAL CALCULATIONS FOR KPIs 🌟
    const totalActiveSubscriptions = plans.reduce((acc, plan) => acc + (plan.institutesCount || 0), 0);
    const totalMonthlyRevenue = plans.reduce((acc, plan) => {
        const count = plan.institutesCount || 0;
        const price = plan.price || 0;
        const monthlyValue = plan.billingCycle === 'yearly' ? price / 12 : price;
        return acc + (count * monthlyValue);
    }, 0);

    const advancedFeatures = [
        { key: 'hlsStreaming', label: 'HLS Video Security', icon: MdVideocam },
        { key: 'customBranding', label: 'White-Label Branding', icon: MdPublic },
        { key: 'apiAccess', label: 'Enterprise API Access', icon: MdSecurity },
        { key: 'zoomIntegration', label: 'Zoom Live Classes', icon: MdVideocam },
        // 🌟 New AI Tiers
        { key: 'aiAssistant', label: 'AI Assistant (Chat & Summary)', icon: MdBolt },
        { key: 'aiAssessment', label: 'AI Assessment (Proctoring & Grading)', icon: MdSecurity },
        { key: 'aiIntelligence', label: 'AI Intelligence (Risk & Analytics)', icon: MdMemory }
    ];

    const getTheme = (index, name) => {
        const n = name?.toLowerCase() || '';
        if (n.includes('basic') || index === 0) return { 
            bg: C.cardBg, border: C.cardBorder, 
            title: C.btnPrimary, price: C.heading, btn: C.innerBg, btnText: C.btnPrimary,
            iconBg: C.innerBg, iconColor: C.btnPrimary, tick: C.btnPrimary
        };
        if (n.includes('pro') || index === 1) return { 
            bg: C.cardBg, border: C.cardBorder, 
            title: '#8B5CF6', price: C.heading, btn: '#F3E8FF', btnText: '#8B5CF6',
            iconBg: '#F3E8FF', iconColor: '#8B5CF6', tick: '#8B5CF6'
        };
        if (n.includes('enterprise') || index === 2) return { 
            bg: C.cardBg, border: C.cardBorder, 
            title: C.warning, price: C.heading, btn: 'transparent', btnBorder: C.cardBorder, btnText: C.textMuted,
            iconBg: C.warningBg, iconColor: C.warning, tick: C.warning
        };
        return { 
            bg: C.cardBg, border: C.cardBorder, 
            title: C.text, price: C.heading, btn: C.innerBg, btnText: C.text,
            iconBg: C.innerBg, iconColor: C.textMuted, tick: C.textMuted
        };
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
                        Loading plans...
                    </p>
                </div>
            </div>
        );
    }

    const filteredPlans = plans.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                        Subscription Plans
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                        Manage and customize all subscription plans available for institutes.
                    </p>
                </div>
                <button onClick={() => handleOpenModal()} 
                    className="flex items-center gap-2 transition-opacity border-none cursor-pointer"
                    style={{
                        background: C.gradientBtn,
                        color: '#ffffff',
                        padding: '12px 24px',
                        borderRadius: R.xl,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        boxShadow: S.btn
                    }}
                >
                    <MdAdd style={{ width: 18, height: 18 }} /> Create Plan <MdChevronRight style={{ width: 16, height: 16, opacity: 0.7 }}/>
                </button>
            </div>

            {/* ── REAL KPI Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard 
                    icon={MdDashboard} 
                    value={plans.length} 
                    label="Total Plans" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={totalActiveSubscriptions.toLocaleString()} 
                    label="Active Subscriptions" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdTrendingUp} 
                    value={`₹${totalMonthlyRevenue.toLocaleString()}`} 
                    label="Total Revenue (Monthly)" 
                    iconBg="#FFF7ED" 
                    iconColor="#F59E0B" 
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ backgroundColor: C.cardBg, padding: '16px 24px', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                    Active Plans
                </h2>
                <div className="relative w-full md:w-[250px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" placeholder="Search plans..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {filteredPlans.map((plan, index) => {
                    const theme = getTheme(index, plan.name);
                    return (
                        <div key={plan._id} className="relative flex flex-col transition-transform hover:-translate-y-1" 
                            style={{ backgroundColor: theme.bg, borderRadius: R['2xl'], border: `1px solid ${theme.border}`, boxShadow: S.card }}>
                            
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === plan._id ? null : plan._id); }}
                                    className="flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                                    style={{ width: 32, height: 32, borderRadius: R.full, color: C.textFaint }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <MdMoreHoriz style={{ width: 20, height: 20 }} />
                                </button>

                                {openMenuId === plan._id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 py-2 z-50" 
                                        style={{ backgroundColor: C.cardBg, borderRadius: R.xl, boxShadow: S.cardHover, border: `1px solid ${C.cardBorder}` }} 
                                        onClick={e => e.stopPropagation()}>
                                        <button onClick={() => handleOpenModal(plan)} className="w-full text-left px-4 py-2 flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.btnPrimary; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text; }}
                                        >
                                            <MdEdit style={{ width: 16, height: 16 }}/> Edit Plan
                                        </button>
                                        <button className="w-full text-left px-4 py-2 flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.btnPrimary; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text; }}
                                        >
                                            <MdBusiness style={{ width: 16, height: 16 }}/> Manage Institutes
                                        </button>
                                        <button onClick={() => handleDelete(plan._id)} className="w-full text-left px-4 py-2 flex items-center gap-2 border-none bg-transparent cursor-pointer mt-1 pt-2 transition-colors"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.danger, borderTop: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <MdDelete style={{ width: 16, height: 16 }}/> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 pb-0">
                                <p className="absolute top-6 right-16 m-0" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textFaint }}>#INST{plan._id.slice(-4).toUpperCase()}</p>
                                <h3 className="m-0 mb-1" style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: theme.title }}>{plan.name}</h3>
                                
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '28px', fontWeight: T.weight.black, color: theme.price, letterSpacing: T.tracking.tight, lineHeight: 1 }}>₹{plan.price.toLocaleString()}</span>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted }}>/{plan.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                                </div>

                                <div className="flex items-center justify-between pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success }}>
                                        <MdCheckCircle style={{ width: 16, height: 16, color: C.success }} /> 
                                        {/* 🌟 REAL INSTITUTE COUNT HERE 🌟 */}
                                        {(plan.institutesCount || 0).toLocaleString()} Institutes
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: plan.isActive ? C.success : C.textMuted }}>{plan.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="space-y-3.5 flex-1 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: R.full, backgroundColor: theme.iconBg }}><MdPublic style={{ width: 14, height: 14, color: theme.iconColor }} /></div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Students Manager ({plan.features.maxStudents === -1 ? 'Unlimited' : plan.features.maxStudents})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: R.full, backgroundColor: theme.iconBg }}><MdMemory style={{ width: 14, height: 14, color: theme.iconColor }} /></div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Instructors Manager ({plan.features.maxTutors === -1 ? 'Unlimited' : plan.features.maxTutors})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: R.full, backgroundColor: C.warningBg }}><MdSecurity style={{ width: 14, height: 14, color: C.warning }} /></div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Storage Limit ({plan.features.storageLimitGB}GB)</span>
                                    </div>
                                    
                                    {advancedFeatures.map(feat => (
                                        <div key={feat.key} className="flex items-center gap-3">
                                            {plan.features[feat.key] ? (
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: R.full, backgroundColor: theme.iconBg }}><MdCheckCircle style={{ width: 14, height: 14, color: theme.iconColor }} /></div>
                                            ) : (
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: R.full, backgroundColor: C.innerBg }}><MdCancel style={{ width: 14, height: 14, color: C.textFaint }} /></div>
                                            )}
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: plan.features[feat.key] ? C.heading : C.textMuted, textDecoration: plan.features[feat.key] ? 'none' : 'line-through' }}>{feat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <button className="flex items-center justify-center gap-2 transition-all border-none cursor-pointer w-full"
                                        style={{
                                            padding: '10px 0',
                                            borderRadius: '10px',
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.base,
                                            fontWeight: T.weight.bold,
                                            backgroundColor: theme.btn,
                                            color: theme.btnText,
                                            border: theme.btnBorder ? `1px solid ${theme.btnBorder}` : 'none'
                                        }}
                                    >
                                        {plan.features.apiAccess ? 'Contact Sales' : (
                                            <> <MdCheckCircle style={{ width: 18, height: 18, color: theme.btnText, opacity: 0.7 }} /> Active </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div 
                    onClick={() => handleOpenModal()} 
                    className="flex flex-col items-center justify-center min-h-[400px] cursor-pointer transition-all group"
                    style={{ backgroundColor: C.surfaceWhite, border: `2px dashed ${C.cardBorder}`, borderRadius: R['2xl'] }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.surfaceWhite}
                >
                    <div className="flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ width: 56, height: 56, backgroundColor: C.iconBg, borderRadius: R.full, color: C.iconColor }}>
                        <MdAdd style={{ width: 28, height: 28 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Create New Plan</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, margin: 0, marginTop: 4 }}>Setup custom features</p>
                </div>

            </div>

            {/* ── Pagination ── */}
            <div className="flex justify-between items-center mt-8">
                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Rows per Page: 10</span>
                <div className="flex items-center gap-2">
                    <button className="border-none bg-transparent cursor-pointer transition-colors" style={{ padding: '6px 12px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }} onMouseEnter={(e) => e.currentTarget.style.color = C.heading} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}>Previous</button>
                    <span className="flex items-center justify-center shadow-sm" style={{ width: 32, height: 32, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, backgroundColor: C.cardBg, color: C.heading, border: `1px solid ${C.cardBorder}` }}>1</span>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted, margin: '0 8px' }}>of 1</span>
                    <button className="flex items-center justify-center shadow-sm border-none cursor-pointer transition-colors" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.cardBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` }} onMouseEnter={(e) => e.currentTarget.style.color = C.heading} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}><MdChevronLeft style={{ width: 18, height: 18 }} /></button>
                    <button className="flex items-center justify-center shadow-sm border-none cursor-pointer transition-colors" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.cardBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` }} onMouseEnter={(e) => e.currentTarget.style.color = C.heading} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}><MdChevronRight style={{ width: 18, height: 18 }} /></button>
                    <button className="border-none bg-transparent cursor-pointer transition-colors" style={{ padding: '6px 12px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }} onMouseEnter={(e) => e.currentTarget.style.color = C.heading} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}>Next</button>
                </div>
            </div>

            {/* ── ADVANCED MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSavePlan} className="flex flex-col w-full max-w-[550px] overflow-hidden" style={{ backgroundColor: C.pageBg, borderRadius: R['3xl'], boxShadow: S.cardHover, border: `1px solid ${C.cardBorder}`, maxHeight: '90vh' }}>
                        
                        <div className="px-8 py-6 flex justify-between items-center shrink-0" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{formData._id ? 'Edit Subscription Tier' : 'New Subscription Tier'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-transparent border-none cursor-pointer p-1 transition-colors"
                                style={{ color: C.textFaint, borderRadius: '10px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textFaint; }}
                            >
                                <MdCancel style={{ width: 24, height: 24 }}/>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Tier Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={baseInputStyle} placeholder="e.g. Enterprise Plus"/>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Price (₹)</label>
                                    <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={baseInputStyle} placeholder="9999"/>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Billing Cycle</label>
                                    <select value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})} style={{ ...baseInputStyle, cursor: 'pointer' }}>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            {/* 🌟 NEW: Core Plan Limits & AI Credits */}
                            <div className="col-span-2 mt-2">
                                <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '12px', margin: 0 }}>Core Limits & Credits</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'] }}>
                                   <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Max Tutors</label>
                                        <input type="number" min="-1" required 
                                            value={formData.features.maxTutors ?? ''} 
                                            onChange={(e) => setFormData({...formData, features: {...formData.features, maxTutors: e.target.value === '' ? '' : parseInt(e.target.value)}})} 
                                            style={{ ...baseInputStyle, padding: '8px', fontSize: T.size.sm }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: C.textFaint, margin: 0, marginTop: 4 }}>-1 for Unlimited</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Max Students</label>
                                        <input type="number" min="-1" required 
                                            value={formData.features.maxStudents ?? ''} 
                                            onChange={(e) => setFormData({...formData, features: {...formData.features, maxStudents: e.target.value === '' ? '' : parseInt(e.target.value)}})} 
                                            style={{ ...baseInputStyle, padding: '8px', fontSize: T.size.sm }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Storage (GB)</label>
                                        <input type="number" min="1" required 
                                            value={formData.features.storageLimitGB ?? ''} 
                                            onChange={(e) => setFormData({...formData, features: {...formData.features, storageLimitGB: e.target.value === '' ? '' : parseInt(e.target.value)}})} 
                                            style={{ ...baseInputStyle, padding: '8px', fontSize: T.size.sm }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', marginBottom: '4px' }}>AI Credits/Mo</label>
                                        <input type="number" min="0" required 
                                            value={formData.features.aiCreditsPerMonth ?? ''} 
                                            onChange={(e) => setFormData({...formData, features: {...formData.features, aiCreditsPerMonth: e.target.value === '' ? '' : parseInt(e.target.value)}})} 
                                            style={{ ...baseInputStyle, padding: '8px', fontSize: T.size.sm, color: C.btnPrimary, border: `1px solid ${C.btnPrimary}` }} />
                                    </div>
                                </div>
                            </div>
                            
                            <label className="flex items-center justify-between p-4 cursor-pointer transition-colors" 
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                            >
                                <div className="flex items-center gap-3">
                                    <MdBolt style={{ width: 20, height: 20, color: C.btnPrimary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>Highlight as "Most Popular"</span>
                                </div>
                                <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({...formData, isPopular: e.target.checked})} style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                            </label>

                            <div>
                                <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginTop: '8px', marginBottom: '12px', margin: 0 }}>Advanced LMS Modules</h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {advancedFeatures.map((feat) => (
                                        <label key={feat.key} className="flex items-center justify-between p-3.5 transition-all cursor-pointer shadow-sm"
                                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.btnPrimary}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.cardBorder}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center shrink-0" 
                                                    style={{ 
                                                        width: 28, height: 28, borderRadius: '8px',
                                                        backgroundColor: formData.features[feat.key] ? C.innerBg : C.surfaceWhite,
                                                        color: formData.features[feat.key] ? C.btnPrimary : C.textFaint
                                                    }}>
                                                    <feat.icon style={{ width: 16, height: 16 }} />
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{feat.label}</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.features[feat.key]} 
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    features: { ...formData.features, [feat.key]: e.target.checked }
                                                })} 
                                                style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} 
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 flex gap-3 shrink-0" style={{ backgroundColor: C.cardBg, borderTop: `1px solid ${C.cardBorder}` }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} 
                                className="flex-1 transition-colors cursor-pointer"
                                style={{
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: R.xl,
                                    padding: '12px 0',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold
                                }}
                            >Cancel</button>
                            <button type="submit" disabled={saving} 
                                className="flex-[2] flex items-center justify-center gap-2 transition-opacity cursor-pointer border-none"
                                style={{
                                    background: saving ? C.cardBorder : C.gradientBtn,
                                    color: '#ffffff',
                                    borderRadius: R.xl,
                                    padding: '12px 0',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold,
                                    boxShadow: saving ? 'none' : S.btn
                                }}
                            >
                                {saving ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin"/> : <MdSave style={{ width: 16, height: 16 }}/>}
                                {formData._id ? 'Update Tier' : 'Launch Tier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}