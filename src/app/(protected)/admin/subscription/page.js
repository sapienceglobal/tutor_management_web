'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import FeatureAccessCard from '@/components/admin/FeatureAccessCard';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { Crown, Calendar, Users, CheckCircle, RefreshCw, Zap, Cpu, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SubscriptionPage() {
    const [institute, setInstitute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchInstituteData();
    }, []);

    const fetchInstituteData = async () => {
        try {
            const res = await api.get('/user-institute/me');
            if (res.data?.success) {
                setInstitute(res.data.institute);
            }
        } catch (error) {
            console.error('Failed to fetch institute data:', error);
            toast.error('Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchInstituteData();
            toast.success('Subscription data refreshed');
        } catch (error) {
            toast.error('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const handleUpgrade = (plan) => {
        toast.success(`Upgrade to ${plan} initiated!`);
        setShowUpgradeModal(false);
    };

    const getPlanGradient = (plan) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise': return 'from-[#6B4DF1] to-[#8C68F2]'; // Deep Purple
            case 'pro': return 'from-[#4F7BF0] to-[#6EA0FF]'; // Rich Blue
            case 'basic': return 'from-[#4ABCA8] to-[#60D3C0]'; // Emerald Green
            case 'free': return 'from-[#A0ABC0] to-[#CBD5E1]'; // Neutral Grey
            default: return 'from-[#6B4DF1] to-[#8C68F2]';
        }
    };

    const getPlanIcon = (plan) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise': return <Crown size={48} className="text-white opacity-90" />;
            case 'pro': return <Zap size={48} className="text-white opacity-90" />;
            case 'basic': return <CheckCircle size={48} className="text-white opacity-90" />;
            case 'free': return <CreditCard size={48} className="text-white opacity-90" />;
            default: return <Crown size={48} className="text-white opacity-90" />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No expiry';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isExpired = institute?.subscriptionExpiresAt && new Date(institute.subscriptionExpiresAt) < new Date();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F1EAFB]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#6B4DF1]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="bg-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between p-6" style={{ boxShadow: softShadow }}>
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-[#F4F0FD] rounded-[10px] flex items-center justify-center shrink-0 border border-[#E9DFFC]">
                        <Crown className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-black text-[#27225B] m-0">Subscription & Billing</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Manage your institute's active plan, limits, and features</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#E9DFFC] text-[#6B4DF1] font-bold rounded-xl hover:bg-[#F4F0FD] transition-colors cursor-pointer text-[13px] disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Stats
                </button>
            </div>

            {/* ── Current Plan Overview Grid ── */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 flex flex-col" style={{ boxShadow: softShadow }}>
                <h2 className="text-[17px] font-black text-[#27225B] mb-6 m-0">Plan Details</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Premium Plan Card */}
                    <div className={`bg-gradient-to-br ${getPlanGradient(institute?.subscriptionPlan)} rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg`}>
                        {/* Decorative background shapes */}
                        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        
                        <div className="mb-4 relative z-10">
                            {getPlanIcon(institute?.subscriptionPlan)}
                        </div>
                        <h3 className="text-[26px] font-black text-white mb-2 relative z-10 tracking-wide uppercase shadow-sm">
                            {institute?.subscriptionPlan || 'FREE'} PLAN
                        </h3>
                        
                        <div className="mt-4 inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full relative z-10">
                            {isExpired ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-[#FC8181]"></div>
                                    <span className="text-[13px] font-bold text-white uppercase tracking-wider">Expired</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 text-[#68D391]" />
                                    <span className="text-[13px] font-bold text-white uppercase tracking-wider">Active</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Usage & Billing Stats */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Usage Overview */}
                        <div className="bg-[#F9F7FC] rounded-xl p-5 border border-[#E9DFFC]">
                            <h4 className="text-[14px] font-black text-[#27225B] mb-4 flex items-center gap-2 m-0">
                                <Users className="w-4 h-4 text-[#6B4DF1]" /> Usage Overview
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-[#E9DFFC]/50">
                                    <span className="text-[13px] font-bold text-[#7D8DA6]">Maximum Instructors</span>
                                    <span className="text-[14px] font-black text-[#27225B]">{institute?.features?.maxTutors || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-[#E9DFFC]/50">
                                    <span className="text-[13px] font-bold text-[#7D8DA6]">Maximum Students</span>
                                    <span className="text-[14px] font-black text-[#27225B]">{institute?.features?.maxStudents || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-4 h-4 text-[#FC8730]" />
                                        <span className="text-[13px] font-bold text-[#7D8DA6]">AI Buddy Usage</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-[#E9DFFC] rounded-full overflow-hidden hidden sm:block">
                                            <div 
                                                className="h-full bg-[#FC8730]" 
                                                style={{ width: `${Math.min(100, ((institute?.aiUsageCount || 0) / (institute?.aiUsageQuota || 1000)) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[14px] font-black text-[#27225B]">
                                            {institute?.aiUsageCount || 0} <span className="text-[#A0ABC0] font-medium">/ {institute?.aiUsageQuota || 1000}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Billing Information */}
                        <div className="bg-[#F9F7FC] rounded-xl p-5 border border-[#E9DFFC]">
                            <h4 className="text-[14px] font-black text-[#27225B] mb-4 flex items-center gap-2 m-0">
                                <CreditCard className="w-4 h-4 text-[#4ABCA8]" /> Billing Information
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-[#E9DFFC]/50">
                                    <span className="text-[13px] font-bold text-[#7D8DA6]">Current Cycle</span>
                                    <span className="text-[13px] font-black text-[#27225B] capitalize">{institute?.subscriptionPlan || 'Free'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] font-bold text-[#7D8DA6]">Valid Until</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#A0ABC0]" />
                                        <span className={`text-[13px] font-black ${isExpired ? 'text-[#E53E3E]' : 'text-[#27225B]'}`}>
                                            {formatDate(institute?.subscriptionExpiresAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Feature Access Section ── */}
            <FeatureAccessCard 
                tenant={institute} 
                onUpgrade={() => setShowUpgradeModal(true)}
            />

            {/* ── Upgrade Modal ── */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentPlan={institute?.subscriptionPlan}
                onUpgrade={handleUpgrade}
            />
        </div>
    );
}