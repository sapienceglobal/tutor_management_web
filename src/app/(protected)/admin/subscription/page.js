'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import FeatureAccessCard from '@/components/admin/FeatureAccessCard';
import UpgradeModal from '@/components/admin/UpgradeModal';
import {
    MdWorkspacePremium,
    MdCalendarMonth,
    MdPeople,
    MdCheckCircle,
    MdRefresh,
    MdBolt,
    MdMemory,
    MdCreditCard,
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

// ─── Plan Gradient ────────────────────────────────────────────────────────────
const getPlanGradient = (plan) => {
    switch (plan?.toLowerCase()) {
        case 'enterprise':
        case 'enterprise plus': return C.gradientBtn;
        case 'pro':             return 'linear-gradient(to right, #4F7BF0, #6EA0FF)';
        case 'starter':
        case 'basic':           return 'linear-gradient(to right, #4ABCA8, #60D3C0)';
        default:                return 'linear-gradient(to right, #A0ABC0, #CBD5E1)';
    }
};

// ─── Plan Icon ────────────────────────────────────────────────────────────────
const getPlanIcon = (plan) => {
    switch (plan?.toLowerCase()) {
        case 'enterprise':
        case 'enterprise plus': return <MdWorkspacePremium style={{ width: 48, height: 48, color: '#ffffff', opacity: 0.9 }} />;
        case 'pro':             return <MdBolt              style={{ width: 48, height: 48, color: '#ffffff', opacity: 0.9 }} />;
        case 'starter':
        case 'basic':           return <MdCheckCircle       style={{ width: 48, height: 48, color: '#ffffff', opacity: 0.9 }} />;
        default:                return <MdCreditCard         style={{ width: 48, height: 48, color: '#ffffff', opacity: 0.9 }} />;
    }
};

// ─── Format Date ──────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
    if (!dateString) return 'No expiry / Lifetime';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, isLast = false, accent }) {
    return (
        <div
            className="flex justify-between items-center py-3"
            style={{ borderBottom: isLast ? 'none' : `1px solid ${C.cardBorder}` }}
        >
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                {label}
            </span>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: accent || C.heading }}>
                {value}
            </span>
        </div>
    );
}

// ─── Inner Card ───────────────────────────────────────────────────────────────
function InnerCard({ title, icon: Icon, iconColor, children }) {
    return (
        <div
            className="p-5"
            style={{
                backgroundColor: C.innerBg,
                borderRadius:    '12px',
                border:          `1px solid ${C.cardBorder}`,
            }}
        >
            <h4
                className="flex items-center gap-2 mb-4"
                style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}
            >
                <Icon style={{ width: 16, height: 16, color: iconColor || C.btnPrimary }} />
                {title}
            </h4>
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
    const [institute, setInstitute]           = useState(null);
    const [plans, setPlans]                   = useState([]);
    const [loading, setLoading]               = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [refreshing, setRefreshing]         = useState(false);

    useEffect(() => {
        const loadRazorpay = () => {
            const script = document.createElement('script');
            script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
            document.body.appendChild(script);
        };
        loadRazorpay();
        fetchInstituteData();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions');
            if (res.data?.success) setPlans(res.data.plans);
        } catch (error) { console.error('Failed to load plans:', error); }
    };

    const fetchInstituteData = async () => {
        try {
            const res = await api.get('/user-institute/me');
            if (res.data?.success) setInstitute(res.data.institute);
        } catch (error) {
            console.error('Failed to fetch institute data:', error);
            toast.error('Failed to load subscription data');
        } finally { setLoading(false); }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchInstituteData();
            toast.success('Subscription data refreshed');
        } catch { toast.error('Failed to refresh data'); }
        finally { setRefreshing(false); }
    };

    const handleUpgrade = async (planId) => {
        if (!window.Razorpay) { toast.error('Payment gateway is still loading. Please wait.'); return; }
        try {
            const toastId = toast.loading('Initiating secure payment...');
            setShowUpgradeModal(false);

            const orderRes = await api.post('/payments/renew-subscription', {
                planId,
                instituteId: institute._id,
            });
            if (!orderRes.data.success) {
                toast.error(orderRes.data.message || 'Failed to initialize payment', { id: toastId });
                return;
            }
            toast.dismiss(toastId);

            const options = {
                key:         orderRes.data.key,
                amount:      orderRes.data.order.amount,
                currency:    orderRes.data.order.currency,
                name:        'Sapience LMS',
                description: 'Subscription Upgrade',
                order_id:    orderRes.data.order.id,
                handler: async function (response) {
                    const verifyToastId = toast.loading('Verifying your payment...');
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpayOrderId:    response.razorpay_order_id,
                            razorpayPaymentId:  response.razorpay_payment_id,
                            razorpaySignature:  response.razorpay_signature,
                        });
                        if (verifyRes.data.success) {
                            toast.success('Subscription Upgraded Successfully! 🎉', { id: verifyToastId });
                            fetchInstituteData();
                        } else {
                            toast.error('Payment verification failed.', { id: verifyToastId });
                        }
                    } catch { toast.error('An error occurred during verification.', { id: verifyToastId }); }
                },
                prefill: { name: institute.name, email: institute.contactEmail || '' },
                theme:   { color: '#6B4DF1' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('Upgrade error:', error);
            toast.error('Something went wrong while initiating payment.');
        }
    };

    const isExpired = institute?.subscriptionExpiresAt && new Date(institute.subscriptionExpiresAt) < new Date();

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ backgroundColor: C.pageBg }}
        >
            <div
                className="w-12 h-12 rounded-full border-[3px] animate-spin"
                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
            />
        </div>
    );

    return (
        <div
            className="space-y-6 min-h-screen w-full"
            style={{ backgroundColor: C.pageBg, ...pageStyle }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4"
                style={{
                    backgroundColor: C.cardBg,
                    borderRadius:    R['2xl'],
                    boxShadow:       S.card,
                    border:          `1px solid ${C.cardBorder}`,
                }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                            width:           44,
                            height:          44,
                            backgroundColor: C.btnViewAllBg,
                            borderRadius:    '10px',
                            border:          `1px solid ${C.cardBorder}`,
                        }}
                    >
                        <MdWorkspacePremium style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Subscription & Billing
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '2px 0 0 0' }}>
                            Manage your institute's active plan, limits, and features
                        </p>
                    </div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer transition-colors hover:opacity-80 disabled:opacity-50"
                    style={{
                        backgroundColor: C.cardBg,
                        border:          `1px solid ${C.cardBorder}`,
                        color:           C.btnPrimary,
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.sm,
                        fontWeight:      T.weight.bold,
                        borderRadius:    '10px',
                    }}
                >
                    <MdRefresh
                        style={{ width: 16, height: 16 }}
                        className={refreshing ? 'animate-spin' : ''}
                    />
                    Refresh Stats
                </button>
            </div>

            {/* ── Plan Details ─────────────────────────────────────────────── */}
            <div
                className="p-6 lg:p-8 flex flex-col"
                style={{
                    backgroundColor: C.cardBg,
                    borderRadius:    R['2xl'],
                    boxShadow:       S.card,
                    border:          `1px solid ${C.cardBorder}`,
                }}
            >
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 24px 0' }}>
                    Plan Details
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Plan Hero Card */}
                    <div
                        className="rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg"
                        style={{ background: getPlanGradient(institute?.subscriptionPlan) }}
                    >
                        {/* Decorative blobs */}
                        <div className="absolute -top-5 -right-5 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-3 -left-3 w-24 h-24 bg-white opacity-10 rounded-full blur-xl pointer-events-none" />

                        <div className="mb-4 relative z-10">
                            {getPlanIcon(institute?.subscriptionPlan)}
                        </div>

                        <h3
                            className="relative z-10 uppercase tracking-wide"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: '#ffffff', margin: '0 0 8px 0' }}
                        >
                            {institute?.subscriptionPlan || 'FREE'} PLAN
                        </h3>

                        {/* Status pill */}
                        <div
                            className="mt-4 inline-flex items-center gap-2 relative z-10 px-4 py-2"
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                backdropFilter:  'blur(4px)',
                                borderRadius:    '999px',
                            }}
                        >
                            {isExpired ? (
                                <>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: C.danger }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Expired
                                    </span>
                                </>
                            ) : (
                                <>
                                    <MdCheckCircle style={{ width: 16, height: 16, color: C.success }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Active
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Usage + Billing */}
                    <div className="lg:col-span-2 flex flex-col gap-5">

                        {/* Usage Overview */}
                        <InnerCard title="Usage Overview" icon={MdPeople} iconColor={C.btnPrimary}>
                            <InfoRow
                                label="Maximum Instructors"
                                value={institute?.features?.maxTutors === -1 ? 'Unlimited' : institute?.features?.maxTutors || 0}
                            />
                            <InfoRow
                                label="Maximum Students"
                                value={institute?.features?.maxStudents === -1 ? 'Unlimited' : institute?.features?.maxStudents || 0}
                            />
                            <InfoRow
                                label="Storage Limit"
                                value={`${institute?.features?.storageLimitGB || 0} GB`}
                            />
                            {/* AI Credits */}
                            <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-2">
                                    <MdMemory style={{ width: 16, height: 16, color: C.warning }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                        AI Credits Available
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="hidden sm:block overflow-hidden"
                                        style={{ width: 96, height: 8, backgroundColor: C.cardBorder, borderRadius: '999px' }}
                                    >
                                        <div
                                            style={{
                                                height:          '100%',
                                                backgroundColor: C.warning,
                                                borderRadius:    '999px',
                                                width:           `${Math.min(100, ((institute?.features?.aiCreditsPerMonth || 0) / 10000) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.warning }}>
                                        {institute?.features?.aiCreditsPerMonth?.toLocaleString() || 0}{' '}
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>Credits</span>
                                    </span>
                                </div>
                            </div>
                        </InnerCard>

                        {/* Billing Information */}
                        <InnerCard title="Billing Information" icon={MdCreditCard} iconColor={C.success}>
                            <InfoRow
                                label="Current Cycle"
                                value={institute?.subscriptionPlan || 'Free'}
                            />
                            <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                                    Valid Until
                                </span>
                                <div className="flex items-center gap-2">
                                    <MdCalendarMonth style={{ width: 16, height: 16, color: C.textMuted }} />
                                    <span
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.sm,
                                            fontWeight:  T.weight.bold,
                                            color:       isExpired ? C.danger : C.heading,
                                        }}
                                    >
                                        {formatDate(institute?.subscriptionExpiresAt)}
                                    </span>
                                </div>
                            </div>
                        </InnerCard>
                    </div>
                </div>
            </div>

            {/* ── Feature Access Card ──────────────────────────────────────── */}
            <FeatureAccessCard
                tenant={institute}
                onUpgrade={() => setShowUpgradeModal(true)}
            />

            {/* ── Upgrade Modal ────────────────────────────────────────────── */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentPlan={institute?.subscriptionPlan}
                plans={plans}
                onUpgrade={handleUpgrade}
            />
        </div>
    );
}