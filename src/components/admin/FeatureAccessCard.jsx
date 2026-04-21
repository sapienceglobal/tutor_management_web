'use client';

import { Shield, CheckCircle, XCircle, Video, Palette, Users, Brain, Zap, Cpu, Code } from 'lucide-react';

export default function FeatureAccessCard({ tenant, onUpgrade }) {
    // 🌟 Updated to match our New Enterprise Database Schema
    const features = [
        {
            key: 'zoomIntegration',
            name: 'Zoom Live Classes',
            description: 'Integrate Zoom for live classes and meetings',
            icon: Users,
            available: tenant?.features?.zoomIntegration
        },
        {
            key: 'hlsStreaming',
            name: 'HLS Video Security',
            description: 'Securely upload and stream encrypted video content',
            icon: Video,
            available: tenant?.features?.hlsStreaming
        },
        {
            key: 'customBranding',
            name: 'White-Label Branding',
            description: 'Customize institute colors, logo, and theme',
            icon: Palette,
            available: tenant?.features?.customBranding
        },
        {
            key: 'apiAccess',
            name: 'Enterprise API Access',
            description: 'Access backend APIs for custom ERP integrations',
            icon: Code,
            available: tenant?.features?.apiAccess
        },
        {
            key: 'aiAssistant',
            name: 'AI Assistant & Summary',
            description: 'Smart chatbot, doubt solver, and automated lecture notes',
            icon: Zap,
            available: tenant?.features?.aiAssistant
        },
        {
            key: 'aiAssessment',
            name: 'AI Assessment & Proctoring',
            description: 'Auto-grading, plagiarism checks, and strict webcam proctoring',
            icon: Brain,
            available: tenant?.features?.aiAssessment
        },
        {
            key: 'aiIntelligence',
            name: 'AI Intelligence & Risk',
            description: 'Predict dropout risks, study plans, and generate automated reports',
            icon: Cpu,
            available: tenant?.features?.aiIntelligence
        }
    ];

    // Added some dynamic fallback coloring
    const getPlanColor = (plan) => {
        const p = plan?.toLowerCase() || '';
        if (p.includes('enterprise')) return 'text-purple-600 bg-purple-50 border border-purple-200';
        if (p.includes('pro')) return 'text-blue-600 bg-blue-50 border border-blue-200';
        if (p.includes('basic') || p.includes('starter')) return 'text-green-600 bg-green-50 border border-green-200';
        return 'text-slate-600 bg-slate-50 border border-slate-200';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E9DFFC] p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#F4F0FD] rounded-[10px] flex items-center justify-center shrink-0 border border-[#E9DFFC]">
                    <Shield className="w-6 h-6 text-[#6B4DF1]" />
                </div>
                <div>
                    <h3 className="text-[17px] font-black text-[#27225B] m-0">Subscription Features</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${getPlanColor(tenant?.subscriptionPlan)}`}>
                            {tenant?.subscriptionPlan || 'Free'} Plan
                        </span>
                        <span className="text-[12px] font-bold text-[#7D8DA6]">
                            {tenant?.subscriptionExpiresAt 
                                ? `Expires: ${new Date(tenant.subscriptionExpiresAt).toLocaleDateString()}`
                                : 'No expiry limit'
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <div 
                            key={feature.key}
                            className={`p-4 rounded-xl border-2 transition-all ${
                                feature.available 
                                    ? 'border-emerald-100 bg-emerald-50/30' 
                                    : 'border-slate-100 bg-slate-50/50'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    feature.available 
                                        ? 'bg-emerald-100 text-emerald-600' 
                                        : 'bg-slate-200 text-slate-400'
                                }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-black text-[14px] ${feature.available ? 'text-[#27225B]' : 'text-slate-500'}`}>
                                            {feature.name}
                                        </h4>
                                        {feature.available ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-[12px] font-medium text-slate-500 mb-3 leading-snug">
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                                            feature.available
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {feature.available ? 'Available' : 'Requires Upgrade'}
                                        </span>
                                        
                                        {!feature.available && onUpgrade && (
                                            <button
                                                onClick={() => onUpgrade(feature)}
                                                className="text-[12px] text-[#6B4DF1] hover:text-[#5839D6] font-bold border-none bg-transparent cursor-pointer"
                                            >
                                                Upgrade →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}