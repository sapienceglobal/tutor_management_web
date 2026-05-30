'use client';

import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { 
    CheckCircle2, XCircle, Crown, Sparkles, Zap, Shield, 
    Video, BrainCircuit, Cpu, Palette, Code, Check, 
    ArrowRight, Star, HelpCircle
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SubscriptionDashboard() {
    const { 
        features, planName, personalSubscription, role, refreshSubscription,
        instituteCredits, instituteUsage
    } = useSubscription();

    const remainingInstCredits = Math.max(0, instituteCredits - instituteUsage);
    const instProgressPercent = instituteCredits > 0 ? Math.min(100, (remainingInstCredits / instituteCredits) * 100) : 0;

    const [isUpgrading, setIsUpgrading] = useState(null);
    const [personalPlans, setPersonalPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const loadRazorpay = () => {
            const script = document.createElement('script');
            script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
            document.body.appendChild(script);
        };
        loadRazorpay();

        const loadPersonalPlans = async () => {
            try {
                const roleParam = role ? `&planRole=${role}` : '';
                const { data } = await api.get(`/subscriptions?planType=personal${roleParam}`);
                if (data.success) {
                    setPersonalPlans(data.plans || []);
                }
            } catch (err) {
                console.error('Failed to fetch personal plans:', err);
            } finally {
                setLoadingPlans(false);
            }
        };
        loadPersonalPlans();
    }, [role]);

    const handlePurchase = async (plan) => {
        if (!window.Razorpay) {
            toast.error('Payment gateway is still loading. Please wait.');
            return;
        }
        try {
            setIsUpgrading(plan._id);
            const toastId = toast.loading('Initiating secure payment...');

            const { data: orderRes } = await api.post('/payments/renew-subscription', {
                planId: plan._id
            });

            if (!orderRes.success) {
                toast.error(orderRes.message || 'Failed to initialize payment', { id: toastId });
                return;
            }
            toast.dismiss(toastId);

            const options = {
                key:         orderRes.key,
                amount:      orderRes.order.amount,
                currency:    orderRes.order.currency,
                name:        'Sapience LMS',
                description: `Upgrade to Personal ${plan.name}`,
                order_id:    orderRes.order.id,
                handler: async function (response) {
                    const verifyToastId = toast.loading('Verifying your payment...');
                    try {
                        const { data: verifyRes } = await api.post('/payments/verify', {
                            razorpayOrderId:    response.razorpay_order_id,
                            razorpayPaymentId:  response.razorpay_payment_id,
                            razorpaySignature:  response.razorpay_signature,
                        });
                        if (verifyRes.success) {
                            toast.success(`Welcome to Personal ${plan.name}! Your AI limits are unlocked. 🎉`, { id: verifyToastId, duration: 5000 });
                            
                            // Instantly rehydrate global React states and remove UI locks!
                            if (refreshSubscription) {
                                await refreshSubscription();
                            }
                        } else {
                            toast.error('Payment verification failed.', { id: verifyToastId });
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        toast.error('An error occurred during verification.', { id: verifyToastId });
                    }
                },
                theme:   { color: '#6B4DF1' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('Upgrade request error:', error);
            const errMsg = error.response?.data?.message || error.message || 'Payment checkout failed. Please check your connection.';
            toast.error(errMsg);
        } finally {
            setIsUpgrading(null);
        }
    };

    const hasInstituteFeature = (key) => features && features[key] === true;

    const renderFeatureRow = (label, isSupported, desc) => (
        <div className="flex items-start justify-between py-3 border-b border-gray-100">
            <div>
                <p className="text-[13px] font-bold text-[#27225B]">{label}</p>
                {desc && <p className="text-[11px] text-[#7D8DA6] mt-0.5">{desc}</p>}
            </div>
            {isSupported ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
                <XCircle size={18} className="text-gray-300 shrink-0" />
            )}
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            
            {/* Header section with glassmorphism gradient card */}
            <div className="relative rounded-[32px] p-6 md:p-10 bg-gradient-to-r from-[#27225B] to-[#4F46E5] text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white tracking-widest uppercase">
                            <Crown size={14} className="fill-white" /> Subscription Hub
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">Your Subscriptions & Credits</h1>
                        <p className="text-blue-100 text-[14px] font-medium max-w-2xl leading-relaxed">
                            Monitor your institutional billing plan and supercharge your private teaching workspaces with Personal AI Subscriptions.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-5 shrink-0 shadow-lg text-center">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/20">
                            <Zap size={20} className="text-indigo-950 fill-indigo-950" />
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] uppercase tracking-widest text-indigo-200 font-black block">Active Plan Context</span>
                            <span className="text-lg font-black tracking-wide block uppercase text-yellow-400">
                                {personalSubscription?.isActive ? `Personal ${personalSubscription.planName}` : `${planName || 'Free'}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dual Grid - Institute Context vs Personal Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 🏫 Institute Subscription Card */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                    <span className="text-lg font-black text-indigo-600">🏫</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#27225B]">Institute Subscription</h2>
                                    <p className="text-xs text-[#7D8DA6] font-medium">Provided by your connected organization</p>
                                </div>
                            </div>
                            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 tracking-wider uppercase border border-indigo-200">
                                {planName || 'Free Plan'}
                            </span>
                        </div>

                        {/* Credits Usage Visual Progress block */}
                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-[#27225B]">AI Credits Remaining</span>
                                <span className="font-black text-indigo-700">
                                    {remainingInstCredits.toLocaleString()} / {instituteCredits.toLocaleString()} Left
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200/70 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${instProgressPercent}%` }}></div>
                            </div>
                            <p className="text-[11px] text-[#7D8DA6] leading-relaxed">
                                Institutional credits are only consumed when performing AI tasks inside classes, courses, or exams owned by your organization.
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#7D8DA6] mb-3">Enterprise Features</h3>
                            {renderFeatureRow('Zoom Integration', hasInstituteFeature('zoomIntegration'), 'Host real-time dynamic live lecture classes')}
                            {renderFeatureRow('HLS Video Security', hasInstituteFeature('hlsStreaming'), 'AES-128 secure video streaming encryption')}
                            {renderFeatureRow('White-Label Branding', hasInstituteFeature('customBranding'), 'Custom domain, logos, and institute brand colors')}
                            {renderFeatureRow('API Access', hasInstituteFeature('apiAccess'), 'Developer tokens for custom platform integrations')}
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100">
                        {role === 'admin' ? (
                            <p className="text-xs font-semibold text-[#7D8DA6] leading-relaxed">
                                You are the administrator. To upgrade this institute plan, please proceed to the Billing manager section.
                            </p>
                        ) : (
                            <p className="text-xs font-semibold text-[#7D8DA6] leading-relaxed">
                                If your institute's features are locked, please ask your principal or platform administrator to upgrade the organization subscription.
                            </p>
                        )}
                    </div>
                </div>

                {/* 👤 Personal Subscription Card */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100 shrink-0">
                                    <span className="text-lg font-black text-pink-600">👤</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#27225B]">Personal Subscription</h2>
                                    <p className="text-xs text-[#7D8DA6] font-medium">Your individual workspace quota</p>
                                </div>
                            </div>
                            <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${personalSubscription?.isActive ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {personalSubscription?.isActive ? `${personalSubscription.planName} Plan` : 'Inactive'}
                            </span>
                        </div>

                        {/* Credits Block */}
                        <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100/50 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-[#27225B]">Personal AI Credits</span>
                                <span className="font-black text-pink-700">
                                    {personalSubscription?.isActive 
                                        ? `${(personalSubscription.features?.aiCreditsPerMonth || 0) - (personalSubscription.features?.aiUsageCount || 0)}`
                                        : '0'} Left
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200/70 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" style={{ width: personalSubscription?.isActive ? '100%' : '0%' }}></div>
                            </div>
                            <p className="text-[11px] text-[#7D8DA6] leading-relaxed">
                                Personal credits are safely deducted when you perform AI buddy chat sessions or generate questions inside private/global assets.
                            </p>
                        </div>

                        {/* Feature checklist */}
                        <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#7D8DA6] mb-3">AI Plan Features</h3>
                            {renderFeatureRow('AI Assistant Chat', Boolean(personalSubscription?.isActive && personalSubscription.features?.aiAssistant), 'Conversational tutor and study buddy')}
                            {renderFeatureRow('AI Homework Assessment', Boolean(personalSubscription?.isActive && personalSubscription.features?.aiAssessment), 'Automatically evaluate subjective answer files')}
                            {renderFeatureRow('AI Student Weakness Predictor', Boolean(personalSubscription?.isActive && personalSubscription.features?.aiIntelligence), 'Identify dropouts and predict academic weak areas')}
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100">
                        {personalSubscription?.isActive ? (
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <Star size={14} className="fill-emerald-500" /> You have active personal AI credits. Enjoy unlimited global actions!
                            </p>
                        ) : (
                            <p className="text-xs font-semibold text-[#7D8DA6] leading-relaxed">
                                You currently do not have a personal plan active. Select a plan below to activate individual billing.
                            </p>
                        )}
                    </div>
                </div>

            </div>

            {/* Pricing Section (Shows personal plans) */}
            {!personalSubscription?.isActive && (
                <div className="space-y-6 pt-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-[#27225B]">Choose Your Personal AI Plan</h2>
                        <p className="text-[#7D8DA6] text-[14px] font-medium max-w-lg mx-auto">
                            Supercharge your private course workspace with independent AI credits. Instantly activated via dynamic plans.
                        </p>
                    </div>

                    {loadingPlans ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : personalPlans.length === 0 ? (
                        <div className="text-center py-12 text-[#7D8DA6] font-bold">
                            No personal AI plans are currently available. Ask the Superadmin to launch some personal tiers!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {personalPlans.map((plan) => (
                                <div key={plan._id} className={`bg-white rounded-[24px] p-6 md:p-8 border-2 transition-all relative flex flex-col justify-between ${plan.isPopular ? 'border-[#DB2777] shadow-xl shadow-pink-500/5 transform -translate-y-1' : 'border-gray-100 hover:border-gray-300'}`}>
                                    {plan.isPopular && (
                                        <span className="absolute -top-3 right-6 bg-gradient-to-r from-[#DB2777] to-[#F43F5E] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                                            Best Choice
                                        </span>
                                    )}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-[#27225B]">{plan.name}</h3>
                                            <p className="text-xs text-[#7D8DA6] leading-relaxed">
                                                Activate premium personal AI features and individual token credits.
                                            </p>
                                        </div>

                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-[#27225B]">₹{plan.price}</span>
                                            <span className="text-sm font-bold text-gray-400 capitalize">/{plan.billingCycle || 'month'}</span>
                                        </div>

                                        <div className="space-y-3.5 pt-4 border-t border-gray-100">
                                            {/* AI Credits */}
                                            <div className="flex items-center gap-2.5 text-[13px] font-black text-[#8B5CF6]">
                                                <div className="p-0.5 rounded-full bg-purple-50 text-purple-600"><Check size={12} /></div>
                                                <span>{plan.features?.aiCreditsPerMonth?.toLocaleString() || 0} Premium AI Credits/Mo</span>
                                            </div>

                                            {/* Max Students (Tutor only) */}
                                            {plan.planRole === 'tutor' && (
                                                <div className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                                                    <div className="p-0.5 rounded-full bg-emerald-50 text-emerald-600"><Check size={12} /></div>
                                                    <span>Students Manager ({plan.features?.maxStudents === -1 ? 'Unlimited' : plan.features?.maxStudents || 100})</span>
                                                </div>
                                            )}

                                            {/* Storage Limit */}
                                            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                                                <div className="p-0.5 rounded-full bg-emerald-50 text-emerald-600"><Check size={12} /></div>
                                                <span>Storage Limit ({plan.features?.storageLimitGB || 5}GB)</span>
                                            </div>

                                            {/* HLS Video Security (Tutor only) */}
                                            {plan.planRole === 'tutor' && (
                                                <div className="flex items-center gap-2.5 text-[13px]">
                                                    <div className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${plan.features?.hlsStreaming ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {plan.features?.hlsStreaming ? <Check size={12} /> : <span className="text-[10px] font-bold">✕</span>}
                                                    </div>
                                                    <span className={plan.features?.hlsStreaming ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal line-through'}>
                                                        HLS Video Security
                                                    </span>
                                                </div>
                                            )}

                                            {/* Zoom Live Classes (Tutor only) */}
                                            {plan.planRole === 'tutor' && (
                                                <div className="flex items-center gap-2.5 text-[13px]">
                                                    <div className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${plan.features?.zoomIntegration ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {plan.features?.zoomIntegration ? <Check size={12} /> : <span className="text-[10px] font-bold">✕</span>}
                                                    </div>
                                                    <span className={plan.features?.zoomIntegration ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal line-through'}>
                                                        Zoom Live Classes
                                                    </span>
                                                </div>
                                            )}

                                            {/* AI Assistant */}
                                            <div className="flex items-center gap-2.5 text-[13px]">
                                                <div className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${plan.features?.aiAssistant ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {plan.features?.aiAssistant ? <Check size={12} /> : <span className="text-[10px] font-bold">✕</span>}
                                                </div>
                                                <span className={plan.features?.aiAssistant ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal line-through'}>
                                                    AI Assistant (Chat & Summary)
                                                </span>
                                            </div>

                                            {/* AI Assessment */}
                                            <div className="flex items-center gap-2.5 text-[13px]">
                                                <div className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${plan.features?.aiAssessment ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {plan.features?.aiAssessment ? <Check size={12} /> : <span className="text-[10px] font-bold">✕</span>}
                                                </div>
                                                <span className={plan.features?.aiAssessment ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal line-through'}>
                                                    AI Assessment (Proctoring & Grading)
                                                </span>
                                            </div>

                                            {/* AI Intelligence */}
                                            <div className="flex items-center gap-2.5 text-[13px]">
                                                <div className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${plan.features?.aiIntelligence ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {plan.features?.aiIntelligence ? <Check size={12} /> : <span className="text-[10px] font-bold">✕</span>}
                                                </div>
                                                <span className={plan.features?.aiIntelligence ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal line-through'}>
                                                    AI Intelligence (Risk & Analytics)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8">
                                        <button 
                                            disabled={isUpgrading !== null}
                                            onClick={() => handlePurchase(plan)}
                                            className={`w-full py-3.5 rounded-xl font-black text-sm transition-all border-none cursor-pointer flex items-center justify-center gap-2 text-white bg-gradient-to-r ${plan.isPopular ? 'from-[#DB2777] to-[#F43F5E]' : 'from-blue-500 to-indigo-600'} hover:opacity-90 shadow-lg`}
                                        >
                                            {isUpgrading === plan._id ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Authorizing Checkout...
                                                </>
                                            ) : (
                                                <>
                                                    Activate Personal Plan <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
