'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext'; 
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Advanced Feature Gate Component (Sleek UI Edition)
 * Restricts access based on dynamic subscription features without breaking layouts
 */
export default function FeatureGate({ 
    featureName, 
    children, 
    mode = 'lock', 
    fallback = null,
    className = ""
}) {
    const { hasFeature, role, loading,openUpsellModal } = useSubscription();
    const router = useRouter();

    if (loading) {
        return <div className={`animate-pulse opacity-50 pointer-events-none ${className}`}>{children}</div>;
    }

    if (hasFeature(featureName)) {
        return <div className={className}>{children}</div>;
    }

    if (mode === 'hide') {
        return fallback ? <div className={className}>{fallback}</div> : null;
    }

  const handleUpgradeClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Dono Admin aur Tutor ke liye Premium Modal khulega!
        openUpsellModal(); 
    };

    return (
        // 'group' class se hum hover effect trigger karenge
        <div className={`relative group w-full ${className}`}>
            
            {/* 🌟 The UI underneath: Grayscale, Faded & Unclickable. Layout stays 100% intact! */}
            <div className="grayscale opacity-40 pointer-events-none select-none transition-all duration-300" aria-hidden="true">
                {children}
            </div>

            {/* 🌟 The Smart Overlay: Makes the whole area clickable for the upgrade action */}
            <div 
                onClick={handleUpgradeClick}
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                title="Premium Feature - Click to unlock"
            >
                {/* 🌟 The Sleek Expandable Lock Badge */}
                <div className="bg-[#27225B] text-white p-2 md:p-2.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 transition-all duration-300 group-hover:px-4 group-hover:bg-[#6B4DF1] group-hover:shadow-[#6B4DF1]/40 border border-white/10">
                    <Lock size={15} className="shrink-0" />
                    {/* Ye text by default hidden rahega, hover pe smooth width expand hoke dikhega */}
                    <span className="hidden group-hover:inline-block text-[10px] md:text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                        Premium
                    </span>
                </div>
            </div>
            
        </div>
    );
}