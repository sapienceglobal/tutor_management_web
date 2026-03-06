'use client';

import { Shield, CheckCircle, XCircle, Crown, Zap, Video, Palette, Users, Brain } from 'lucide-react';

export default function FeatureAccessCard({ tenant, onUpgrade }) {
    const features = [
        {
            key: 'hlsStreaming',
            name: 'HLS Streaming',
            description: 'Upload and stream high-quality video content',
            icon: Video,
            requiredPlan: 'Enterprise',
            available: tenant?.features?.hlsStreaming
        },
        {
            key: 'customBranding',
            name: 'Custom Branding',
            description: 'Customize institute colors, logo, and theme',
            icon: Palette,
            requiredPlan: 'Pro',
            available: tenant?.features?.customBranding
        },
        {
            key: 'zoomIntegration',
            name: 'Zoom Integration',
            description: 'Integrate Zoom for live classes and meetings',
            icon: Users,
            requiredPlan: 'Basic',
            available: tenant?.features?.zoomIntegration
        },
        {
            key: 'aiFeatures',
            name: 'AI Features',
            description: 'AI-powered content generation and analytics',
            icon: Brain,
            requiredPlan: 'Pro',
            available: tenant?.features?.aiFeatures
        }
    ];

    const getPlanColor = (plan) => {
        switch (plan) {
            case 'enterprise': return 'text-purple-600 bg-purple-50';
            case 'pro': return 'text-blue-600 bg-blue-50';
            case 'basic': return 'text-green-600 bg-green-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 text-lg">Subscription Features</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPlanColor(tenant?.subscriptionPlan)}`}>
                            {tenant?.subscriptionPlan || 'Free'} Plan
                        </span>
                        <span className="text-xs text-slate-500">
                            {tenant?.subscriptionExpiresAt 
                                ? `Expires: ${new Date(tenant.subscriptionExpiresAt).toLocaleDateString()}`
                                : 'No expiry'
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
                            className={`p-4 rounded-lg border-2 transition-all ${
                                feature.available 
                                    ? 'border-green-200 bg-green-50' 
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    feature.available 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-slate-100 text-slate-400'
                                }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-slate-800">{feature.name}</h4>
                                        {feature.available ? (
                                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">{feature.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            feature.available
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {feature.available ? 'Available' : `Requires ${feature.requiredPlan}`}
                                        </span>
                                        {!feature.available && onUpgrade && (
                                            <button
                                                onClick={() => onUpgrade(feature)}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
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

            {/* Upgrade CTA */}
            {tenant?.subscriptionPlan === 'free' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3">
                        <Crown className="w-6 h-6 text-indigo-600" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-indigo-900">Unlock All Features</h4>
                            <p className="text-sm text-indigo-700">
                                Upgrade to Pro or Enterprise plan to access advanced features
                            </p>
                        </div>
                        {onUpgrade && (
                            <button
                                onClick={() => onUpgrade()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors"
                            >
                                View Plans
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
