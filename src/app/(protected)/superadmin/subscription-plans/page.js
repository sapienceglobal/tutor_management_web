'use client';

import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, CheckCircle2, X, 
    Zap, ShieldCheck, Globe, Video, Cpu, Save, Loader2,
    MoreHorizontal, Building2, TrendingUp, Search, 
    ChevronLeft, ChevronRight, LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';

// API services import
import { 
    getSubscriptionPlans, 
    createSubscriptionPlan, 
    updateSubscriptionPlan, 
    deleteSubscriptionPlan 
} from '@/services/superadminService';

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
            maxTutors: 5,
            maxStudents: 100,
            storageLimitGB: 10,
            hlsStreaming: false, 
            aiBasic: false,      
            customBranding: false, 
            zoomIntegration: false,
            apiAccess: false,    
            supportType: 'email' 
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
    // Note: This assumes your backend sends `institutesCount` or `revenue` with each plan object. 
    // If not, it safely defaults to 0.
    const totalActiveSubscriptions = plans.reduce((acc, plan) => acc + (plan.institutesCount || 0), 0);
    const totalMonthlyRevenue = plans.reduce((acc, plan) => {
        const count = plan.institutesCount || 0;
        const price = plan.price || 0;
        // Basic calculation: if it's a yearly plan, you might divide by 12, else use full price
        const monthlyValue = plan.billingCycle === 'yearly' ? price / 12 : price;
        return acc + (count * monthlyValue);
    }, 0);

    const advancedFeatures = [
        { key: 'hlsStreaming', label: 'HLS Video Security', icon: Video },
        { key: 'aiBasic', label: 'AI Proctoring & Grading', icon: Cpu },
        { key: 'customBranding', label: 'White-Label Branding', icon: Globe },
        { key: 'apiAccess', label: 'Enterprise API Access', icon: ShieldCheck }
    ];

    const getTheme = (index, name) => {
        const n = name?.toLowerCase() || '';
        if (n.includes('basic') || index === 0) return { 
            bg: 'bg-gradient-to-b from-[#EEF2FF] to-white', border: 'border-blue-100/50', 
            title: 'text-[#3B82F6]', price: 'text-[#1E3A8A]', btn: 'bg-[#DBEAFE] text-[#3B82F6]',
            iconBg: 'bg-blue-500', iconColor: 'text-white', tick: 'text-blue-500'
        };
        if (n.includes('pro') || index === 1) return { 
            bg: 'bg-gradient-to-b from-[#F3E8FF] to-white', border: 'border-purple-100/50', 
            title: 'text-[#9333EA]', price: 'text-[#581C87]', btn: 'bg-[#F3E8FF] text-[#9333EA]',
            iconBg: 'bg-purple-500', iconColor: 'text-white', tick: 'text-purple-500'
        };
        if (n.includes('enterprise') || index === 2) return { 
            bg: 'bg-gradient-to-b from-[#FFF7ED] to-white', border: 'border-orange-100/50', 
            title: 'text-[#EA580C]', price: 'text-[#7C2D12]', btn: 'bg-transparent border border-gray-200 text-gray-500',
            iconBg: 'bg-orange-500', iconColor: 'text-white', tick: 'text-orange-500'
        };
        return { 
            bg: 'bg-gradient-to-b from-gray-50 to-white', border: 'border-gray-200', 
            title: 'text-gray-700', price: 'text-gray-900', btn: 'bg-gray-100 text-gray-700',
            iconBg: 'bg-gray-500', iconColor: 'text-white', tick: 'text-gray-500'
        };
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8F6FC]"><Loader2 className="animate-spin text-[#8B5CF6]" size={40}/></div>;

    const filteredPlans = plans.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen p-6 md:p-8 bg-[#F8F6FC] font-sans">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-[#2D235C] m-0">Subscription Plans</h1>
                    <p className="text-[13px] text-[#7D8DA6] m-0 mt-1">Manage and customize all subscription plans available for institutes.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-[#8B5CF6] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#7C3AED] transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] border-none cursor-pointer">
                    <Plus size={18} strokeWidth={3} /> Create Plan <ChevronRight size={16} className="opacity-70"/>
                </button>
            </div>

            {/* ── REAL KPI Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F4F0FD] text-[#8B5CF6] flex items-center justify-center shrink-0">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-[#7D8DA6] m-0 mb-1">Total Plans</p>
                        <h3 className="text-[24px] font-black text-[#2D235C] m-0">{plans.length}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4 relative overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-[#7D8DA6] m-0 mb-1">Active Subscriptions</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-[24px] font-black text-[#2D235C] m-0">{totalActiveSubscriptions.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-[#7D8DA6] m-0 mb-1">Total Revenue (Monthly)</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-[24px] font-black text-[#2D235C] m-0">₹{totalMonthlyRevenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-[18px] font-bold text-[#2D235C] m-0">Subscription Plans</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                        <input 
                            type="text" placeholder="Search plans..." 
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] w-48"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {filteredPlans.map((plan, index) => {
                    const theme = getTheme(index, plan.name);
                    return (
                        <div key={plan._id} className={`relative rounded-[24px] border ${theme.border} ${theme.bg} shadow-sm hover:shadow-md transition-all flex flex-col`}>
                            
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === plan._id ? null : plan._id); }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    <MoreHorizontal size={18} />
                                </button>

                                {openMenuId === plan._id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#E9DFFC] py-2 z-50" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => handleOpenModal(plan)} className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-[#F4F0FD] hover:text-[#8B5CF6] flex items-center gap-2 border-none bg-transparent cursor-pointer">
                                            <Edit2 size={14}/> Edit Plan
                                        </button>
                                        <button className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-[#F4F0FD] hover:text-[#8B5CF6] flex items-center gap-2 border-none bg-transparent cursor-pointer">
                                            <Building2 size={14}/> Manage Institutes
                                        </button>
                                        <button onClick={() => handleDelete(plan._id)} className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-none bg-transparent cursor-pointer mt-1 border-t border-gray-100 pt-2">
                                            <Trash2 size={14}/> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 pb-0">
                                <p className="absolute top-6 right-12 text-[10px] font-bold text-gray-400 m-0">#INST{plan._id.slice(-4).toUpperCase()}</p>
                                <h3 className={`text-[24px] font-black m-0 mb-1 ${theme.title}`}>{plan.name}</h3>
                                
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className={`text-[28px] font-black tracking-tight leading-none ${theme.price}`}>₹{plan.price.toLocaleString()}</span>
                                    <span className="text-[13px] font-medium text-gray-500">/{plan.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                                </div>

                                <div className="flex items-center justify-between pb-4 border-b border-gray-200/60">
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
                                        <CheckCircle2 size={14} className="fill-emerald-100 text-emerald-500 rounded-full" /> 
                                        {/* 🌟 REAL INSTITUTE COUNT HERE 🌟 */}
                                        {(plan.institutesCount || 0).toLocaleString()} Institutes
                                    </div>
                                    <span className="text-[12px] font-bold text-emerald-500">{plan.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="space-y-3.5 flex-1 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${theme.iconBg}`}><Globe size={10} className={theme.iconColor} /></div>
                                        <span className="text-[13px] font-bold text-gray-700">Students Manager ({plan.features.maxStudents === -1 ? 'Unlimited' : plan.features.maxStudents})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${theme.iconBg}`}><Cpu size={10} className={theme.iconColor} /></div>
                                        <span className="text-[13px] font-bold text-gray-700">Instructors Manager ({plan.features.maxTutors === -1 ? 'Unlimited' : plan.features.maxTutors})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-yellow-400"><ShieldCheck size={10} className="text-white" /></div>
                                        <span className="text-[13px] font-bold text-gray-700">Storage Limit ({plan.features.storageLimitGB}GB)</span>
                                    </div>
                                    
                                    {advancedFeatures.map(feat => (
                                        <div key={feat.key} className="flex items-center gap-3">
                                            {plan.features[feat.key] ? (
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${theme.iconBg}`}><CheckCircle2 size={10} className={theme.iconColor} /></div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200"><X size={10} className="text-white" /></div>
                                            )}
                                            <span className={`text-[13px] font-bold ${plan.features[feat.key] ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{feat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <button className={`w-full py-2.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2 transition-all border-none cursor-pointer ${theme.btn}`}>
                                        {plan.features.apiAccess ? 'Contact Sales' : (
                                            <> <CheckCircle2 size={16} className="fill-current text-white/50" /> Active </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div 
                    onClick={() => handleOpenModal()} 
                    className="rounded-[24px] border-2 border-dashed border-[#D5C2F6] bg-white/50 hover:bg-white flex flex-col items-center justify-center min-h-[400px] cursor-pointer transition-all hover:shadow-md group"
                >
                    <div className="w-14 h-14 bg-[#F4F0FD] text-[#8B5CF6] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <h3 className="text-[16px] font-bold text-[#2D235C] m-0">Create New Plan</h3>
                    <p className="text-[13px] text-gray-500 m-0 mt-1">Setup custom features</p>
                </div>

            </div>

            {/* ── Pagination ── */}
            <div className="flex justify-between items-center mt-8">
                <span className="text-[13px] font-bold text-gray-500">Rows per Page: 10</span>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-[13px] font-bold text-gray-500 border-none bg-transparent cursor-pointer hover:text-gray-800">Previous</button>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold bg-white text-[#2D235C] shadow-sm">1</span>
                    <span className="text-[13px] font-bold text-gray-500 mx-2">of 1</span>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 bg-white shadow-sm border-none cursor-pointer hover:text-gray-800"><ChevronLeft size={16} /></button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 bg-white shadow-sm border-none cursor-pointer hover:text-gray-800"><ChevronRight size={16} /></button>
                    <button className="px-3 py-1.5 text-[13px] font-bold text-gray-500 border-none bg-transparent cursor-pointer hover:text-gray-800">Next</button>
                </div>
            </div>

            {/* ── ADVANCED MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2D235C]/30 backdrop-blur-sm">
                    <form onSubmit={handleSavePlan} className="bg-white rounded-[32px] w-full max-w-[550px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#FDFBFF]">
                            <h2 className="text-[18px] font-black text-[#2D235C] m-0">{formData._id ? 'Edit Subscription Tier' : 'New Subscription Tier'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"><X size={20} strokeWidth={3}/></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[12px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wide">Tier Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#F8F6FC] border border-purple-100/50 p-3.5 rounded-xl font-bold text-[#2D235C] text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Enterprise Plus"/>
                                </div>
                                <div>
                                    <label className="text-[12px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wide">Price (₹)</label>
                                    <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#F8F6FC] border border-purple-100/50 p-3.5 rounded-xl font-bold text-[#2D235C] text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="9999"/>
                                </div>
                                <div>
                                    <label className="text-[12px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wide">Billing Cycle</label>
                                    <select value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})} className="w-full bg-[#F8F6FC] border border-purple-100/50 p-3.5 rounded-xl font-bold text-[#2D235C] text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center justify-between p-4 bg-purple-50 rounded-xl cursor-pointer border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <Zap size={18} className="text-[#8B5CF6]" />
                                    <span className="font-bold text-[#8B5CF6] text-[14px]">Highlight as "Most Popular"</span>
                                </div>
                                <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({...formData, isPopular: e.target.checked})} className="w-4 h-4 accent-[#8B5CF6]" />
                            </label>

                            <div>
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-2 mb-3">Advanced LMS Modules</h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {advancedFeatures.map((feat) => (
                                        <label key={feat.key} className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-all cursor-pointer shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-md ${formData.features[feat.key] ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <feat.icon size={16} />
                                                </div>
                                                <span className="font-bold text-gray-700 text-[13px]">{feat.label}</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.features[feat.key]} 
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    features: { ...formData.features, [feat.key]: e.target.checked }
                                                })} 
                                                className="w-4 h-4 accent-[#8B5CF6]" 
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-gray-100 bg-[#FDFBFF] flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 font-bold text-[13px] rounded-xl cursor-pointer hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={saving} className="flex-[2] py-3 bg-[#8B5CF6] text-white font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 shadow-md border-none cursor-pointer hover:bg-[#7C3AED]">
                                {saving ? <Loader2 className="animate-spin w-4 h-4"/> : <Save size={16}/>}
                                {formData._id ? 'Update Tier' : 'Launch Tier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}