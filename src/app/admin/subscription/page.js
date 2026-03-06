'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import FeatureAccessCard from '@/components/admin/FeatureAccessCard';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { Crown, Calendar, CreditCard, TrendingUp, Users, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SubscriptionPage() {
    const [institute, setInstitute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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

    const getPlanColor = (plan) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise': return 'text-purple-600 bg-purple-50';
            case 'pro': return 'text-blue-600 bg-blue-50';
            case 'basic': return 'text-green-600 bg-green-50';
            case 'free': return 'text-slate-600 bg-slate-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getPlanIcon = (plan) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise': return '👑';
            case 'pro': return '⭐';
            case 'basic': return '🚀';
            case 'free': return '🆓';
            default: return '📋';
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

    // Debug logging removed - subscription data is now properly fetched

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Crown className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Subscription Management</h1>
                            <p className="text-sm text-slate-600">Manage your institute subscription and features</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Current Plan Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Current Plan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Plan Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                        <div className="text-center">
                            <div className="text-4xl mb-2">{getPlanIcon(institute?.subscriptionPlan)}</div>
                            <h3 className={`text-xl font-bold mb-2 ${getPlanColor(institute?.subscriptionPlan)}`}>
                                {institute?.subscriptionPlan?.toUpperCase() || 'FREE'} PLAN
                            </h3>
                            <div className="text-sm text-slate-600">
                                {institute?.subscriptionExpiresAt ? (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Expires: {formatDate(institute.subscriptionExpiresAt)}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span>Active</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Usage Overview</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Max Tutors</span>
                                    <span className="font-semibold">{institute?.features?.maxTutors || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Max Students</span>
                                    <span className="font-semibold">{institute?.features?.maxStudents || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">AI Usage</span>
                                    <span className="font-semibold">
                                        {institute?.aiUsageCount || 0} / {institute?.aiUsageQuota || 1000}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Billing Info */}
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Billing Information</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Plan Type</span>
                                    <span className="font-semibold capitalize">{institute?.subscriptionPlan || 'Free'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Status</span>
                                    <span className={`font-semibold ${
                                        institute?.subscriptionExpiresAt && new Date(institute.subscriptionExpiresAt) < new Date() 
                                            ? 'text-red-600' 
                                            : 'text-green-600'
                                    }`}>
                                        {institute?.subscriptionExpiresAt && new Date(institute.subscriptionExpiresAt) < new Date() 
                                            ? 'Expired' 
                                            : 'Active'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <FeatureAccessCard 
                tenant={institute} 
                onUpgrade={() => setShowUpgradeModal(true)}
            />

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentPlan={institute?.subscriptionPlan}
                onUpgrade={handleUpgrade}
            />
        </div>
    );
}
