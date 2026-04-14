'use client';

import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext'; // 🌟 Naya hook use kiya!
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Advanced Feature Gate Component
 * Restricts access based on dynamic subscription features
 */
export default function FeatureGate({ 
    featureName, // e.g., 'aiFeatures', 'hlsStreaming'
    children, 
    mode = 'lock', // 'lock' (blurs and shows popup) or 'hide' (removes completely)
    fallback = null,
    className = ""
}) {
    // 🌟 Apne naye context se data nikal rahe hain
    const { hasFeature, role, loading } = useSubscription();
    const router = useRouter();

    if (loading) {
        return <div className={`animate-pulse opacity-50 pointer-events-none ${className}`}>{children}</div>;
    }

    // Agar feature available hai, toh original component dikhao
    if (hasFeature(featureName)) {
        return <div className={className}>{children}</div>;
    }

    // Agar mode 'hide' hai, toh UI se poori tarah gayab kar do (e.g., Sidebar tabs)
    if (mode === 'hide') {
        return fallback || <div className={className}>{fallback}</div>;
    }

    // --- Smart CTA Logic ---
    const handleUpgradeClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (role === 'admin') {
            // Admin ko upgrade page par bhej do (route apne hisaab se check kar lena)
            router.push('/admin/subscription'); 
        } else {
            // Tutor/Student ko error dikhao
            toast.error('Please ask your Institute Admin to upgrade the plan to unlock this feature.', {
                icon: '🔒',
                duration: 4000,
                style: { borderRadius: '12px', background: '#27225B', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
            });
        }
    };

    // --- Premium Locked UI (Glassmorphism Blur) ---
    return (
        <div className={`relative group rounded-2xl overflow-hidden ${className}`}>
            
            {/* Actual Content (Blurred & Unclickable) */}
            <div className="opacity-30 blur-[3px] pointer-events-none select-none transition-all duration-300" aria-hidden="true">
                {children}
            </div>

            {/* Glassmorphism Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#27225B]/5 backdrop-blur-[1px] p-4 text-center">
                <div className="bg-white p-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(107,77,241,0.2)] border border-[#E9DFFC] flex flex-col items-center max-w-[260px] transform transition-transform hover:scale-105">
                    
                    <div className="w-12 h-12 rounded-full bg-[#F4F0FD] flex items-center justify-center mb-3">
                        <Lock size={20} className="text-[#6B4DF1]" />
                    </div>
                    
                    <h4 className="text-[15px] font-black text-[#27225B] mb-1">Premium Feature</h4>
                    <p className="text-[12px] font-medium text-[#7D8DA6] mb-5 leading-tight">
                        This module is locked in your current subscription tier.
                    </p>
                    
                    <button 
                        onClick={handleUpgradeClick}
                        className="w-full py-2.5 bg-[#6B4DF1] text-white text-[13px] font-bold rounded-xl hover:bg-[#5839D6] hover:shadow-lg hover:shadow-purple-200 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                    >
                        <Crown size={16} /> Unlock Feature
                    </button>
                </div>
            </div>
            
        </div>
    );
}