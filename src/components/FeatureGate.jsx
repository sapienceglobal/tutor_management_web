'use client';

import { useState, useEffect } from 'react';
import { Lock, Shield, AlertCircle, Upgrade, CheckCircle } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

/**
 * Feature Gate Component
 * Restricts access to features based on subscription plan
 */
export default function FeatureGate({ 
    feature, 
    children, 
    fallback = null,
    showUpgradePrompt = true,
    className = ""
}) {
    const { tenant, loading } = useTenant();
    const [showPrompt, setShowPrompt] = useState(false);

    // Check if feature is available
    const hasFeature = () => {
        if (!tenant || loading) return false;
        
        const features = tenant.features || {};
        return features[feature] === true;
    };

    const getPlanName = () => {
        if (!tenant) return 'Unknown';
        const plan = tenant.subscriptionPlan || 'free';
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    };

    const getRequiredPlan = () => {
        const featureRequirements = {
            aiFeatures: 'basic',
            hlsStreaming: 'basic',
            customBranding: 'pro',
            zoomIntegration: 'basic',
            customDomain: 'pro',
            advancedAnalytics: 'pro',
            apiAccess: 'basic'
        };
        
        return featureRequirements[feature] || 'basic';
    };

    if (hasFeature()) {
        return <div className={className}>{children}</div>;
    }

    if (!showUpgradePrompt) {
        return fallback || <div className={className}>{fallback}</div>;
    }

    return (
        <div className={`relative ${className}`}>
            {children}
            {!hasFeature() && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-slate-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-red-600" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Feature Locked</h3>
                            <p className="text-slate-600 mb-4">
                                This feature is not available in your <span className="font-semibold text-indigo-600">{getPlanName()}</span> plan.
                            </p>
                            
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-indigo-800 mb-2">Required Plan: {getRequiredPlan().charAt(0).toUpperCase() + getRequiredPlan().slice(1)}</h4>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Unlimited access to this feature</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-600" />
                                        <span>Enhanced security and support</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Maybe Later
                                </button>
                                <button
                                    onClick={() => {
                                        // Contact super admin or redirect to upgrade
                                        window.location.href = 'mailto:support@sapience.com?subject=Plan Upgrade Request';
                                    }}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upgrade className="w-4 h-4" />
                                    Upgrade Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
