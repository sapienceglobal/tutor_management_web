'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, CheckCircle2, Sparkles, Video, Lock, Crown, ZoomIn, Palette, Cpu, PlayCircle, ShieldCheck, BrainCircuit, Zap, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SubscriptionContext = createContext();

// --- PREMIUM UPSELL MODAL COMPONENT ---

const UpsellModal = ({ isOpen, onClose, role }) => {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchPlans();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/subscriptions'); 
            if (data.success) {
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error("Failed to fetch plans", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // 🌟 NEW: Updated mapping matching our new database schema
    const featureDetails = {
        zoomIntegration: { label: "Zoom Live Classes", icon: Video, color: "text-blue-500", bg: "bg-blue-100" },
        hlsStreaming: { label: "HLS Video Security", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-100" },
        aiAssistant: { label: "AI Assistant (Chat & Summary)", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
        aiAssessment: { label: "AI Assessment (Proctoring)", icon: Cpu, color: "text-purple-500", bg: "bg-purple-100" },
        aiIntelligence: { label: "AI Intelligence (Analytics)", icon: BrainCircuit, color: "text-pink-500", bg: "bg-pink-100" },
        customBranding: { label: "White-Label Branding", icon: Palette, color: "text-indigo-500", bg: "bg-indigo-100" },
        apiAccess: { label: "Enterprise API", icon: Code, color: "text-gray-700", bg: "bg-gray-200" }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-5xl bg-[#dfdaf3] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-[#C7D2FE]">
                
                <div className="bg-[#27225B] p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
                            <Crown size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Unlock Your True Potential</h2>
                        <p className="text-blue-100 max-w-lg mx-auto font-medium">
                            {role === 'admin' 
                                ? "Upgrade your institute's plan to access enterprise-grade features and empower your tutors."
                                : "These features require a premium institute plan. Ask your Admin to upgrade and supercharge your teaching!"}
                        </p>
                    </div>
                </div>

                <div className="p-8 bg-white overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center py-12"><div className="w-8 h-8 border-4 border-[#6B4DF1] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <div key={plan._id} className={`rounded-2xl p-6 border-2 transition-all ${plan.isPopular ? 'border-[#6B4DF1] bg-[#F4F0FD] shadow-lg shadow-[#6B4DF1]/10 transform -translate-y-2' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                                    {plan.isPopular && <div className="text-xs font-black text-white bg-[#6B4DF1] px-3 py-1 rounded-full uppercase tracking-wide inline-block mb-3">Most Popular</div>}
                                    <h3 className="text-xl font-black text-[#27225B] mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-black text-[#27225B]">₹{plan.price}</span>
                                        <span className="text-sm font-bold text-gray-400 capitalize">/{plan.billingCycle}</span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {/* 🌟 FIX: Show "Unlimited" instead of "-1" */}
                                        <div className="flex items-center gap-3 text-[13px] font-bold text-gray-700">
                                            <CheckCircle2 size={16} className="text-emerald-500" /> 
                                            {plan.features.maxTutors === -1 ? 'Unlimited' : `Up to ${plan.features.maxTutors}`} Tutors
                                        </div>
                                        <div className="flex items-center gap-3 text-[13px] font-bold text-gray-700">
                                            <CheckCircle2 size={16} className="text-emerald-500" /> 
                                            {plan.features.maxStudents === -1 ? 'Unlimited' : `Up to ${plan.features.maxStudents}`} Students
                                        </div>
                                        <div className="flex items-center gap-3 text-[13px] font-bold text-gray-700">
                                            <CheckCircle2 size={16} className="text-emerald-500" /> 
                                            {plan.features.storageLimitGB}GB Storage
                                        </div>
                                        {/* 🌟 NEW: Display AI Credits */}
                                        <div className="flex items-center gap-3 text-[13px] font-black text-[#8B5CF6]">
                                            <Zap size={16} className="text-[#8B5CF6] fill-purple-100" /> 
                                            {plan.features.aiCreditsPerMonth?.toLocaleString() || 0} AI Credits/Mo
                                        </div>
                                        
                                        <div className="w-full h-px bg-gray-100 my-4"></div>

                                        {/* Dynamic Features Mapping */}
                                        {Object.entries(featureDetails).map(([key, details]) => {
                                            const hasThisFeature = plan.features[key];
                                            
                                            // Hide Admin-only features from Tutors
                                            if (role !== 'admin' && (key === 'customBranding' || key === 'apiAccess')) return null;

                                            return (
                                                <div key={key} className={`flex items-center gap-3 text-[13px] font-bold ${hasThisFeature ? 'text-gray-800' : 'text-gray-400 opacity-60'}`}>
                                                    {hasThisFeature ? (
                                                        <div className={`p-1 rounded-md ${details.bg}`}><details.icon size={12} className={details.color} /></div>
                                                    ) : (
                                                        <X size={16} className="text-gray-300" />
                                                    )}
                                                    <span className={hasThisFeature ? '' : 'line-through'}>{details.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {role === 'admin' ? (
                                        <button onClick={() => { onClose(); router.push('/admin/subscription'); }} className={`w-full py-3 rounded-xl font-black text-sm transition-all ${plan.isPopular ? 'bg-[#6B4DF1] text-white hover:bg-[#5839D6] shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-none cursor-pointer'}`}>
                                            Upgrade to {plan.name}
                                        </button>
                                    ) : (
                                        <button disabled className="w-full py-3 rounded-xl font-black text-sm bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200">
                                            Admin Action Required
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUBSCRIPTION PROVIDER ---
export const SubscriptionProvider = ({ children }) => {
    const [features, setFeatures] = useState({});
    const [planName, setPlanName] = useState('');
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Upsell Modal State
    const [isUpsellOpen, setIsUpsellOpen] = useState(false);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/auth/me'); 
            
            if (data.success && data.user) {
                setRole(data.user.role);
                if (data.user.instituteId) {
                    setFeatures(data.user.instituteId.features || {});
                    setPlanName(data.user.instituteId.subscriptionPlan || 'Free');
                }
            }
        } catch (error) {
            console.error("Failed to fetch subscription context", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSubscriptionData(); }, []);

    const hasFeature = (featureKey) => {
        if (role === 'superadmin') return true;
        return features[featureKey] === true;
    };

    // API to open modal
    const openUpsellModal = () => setIsUpsellOpen(true);
    const closeUpsellModal = () => setIsUpsellOpen(false);

    return (
        <SubscriptionContext.Provider value={{ 
            features, planName, role, loading, hasFeature,
            openUpsellModal, // 🌟 Naya expose kiya
            refreshSubscription: fetchSubscriptionData 
        }}>
            {children}
            <UpsellModal isOpen={isUpsellOpen} onClose={closeUpsellModal} role={role} />
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider");
    return context;
};