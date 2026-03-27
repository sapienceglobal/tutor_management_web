'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import {
    CreditCard, Shield, CheckCircle, ArrowLeft, BookOpen,
    Clock, Users, Star, Loader2, Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Script from 'next/script';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

export default function CheckoutPage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [course, setCourse]           = useState(null);
    const [loading, setLoading]         = useState(true);
    const [processing, setProcessing]   = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${courseId}`);
                if (res.data.success || res.data.course) setCourse(res.data.course || res.data);
            } catch (err) {
                console.error('Failed to load course:', err);
                toast.error('Course not found');
                router.push('/student/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, router]);

    const handleFreeEnroll = async () => {
        setProcessing(true);
        try {
            const res = await api.post('/enrollments', { courseId });
            if (res.data.success) {
                toast.success('🎉 Enrolled successfully! Start learning now.');
                router.replace(`/student/courses/${courseId}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Enrollment failed');
        } finally {
            setProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (!scriptLoaded) { toast.error('Payment system is loading. Please wait…'); return; }
        setProcessing(true);
        try {
            const orderRes = await api.post('/payments/create-order', { courseId });
            if (!orderRes.data.success) { toast.error(orderRes.data.message || 'Failed to create order'); return; }

            const { order, key } = orderRes.data;
            const options = {
                key,
                amount: order.amount,
                currency: order.currency,
                name: 'Sapience',
                description: `Enroll in ${course?.title}`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpayOrderId:   response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        if (verifyRes.data.success) {
                            toast.success('🎉 Payment successful! You are now enrolled.');
                            router.replace(`/student/courses/${courseId}`);
                        } else {
                            toast.error('Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        toast.error('Payment verification failed. Contact support if money was deducted.');
                    }
                },
                theme: { color: C.btnPrimary },
                modal: { ondismiss: () => { setProcessing(false); toast('Payment cancelled', { icon: '⚠️' }); } },
            };
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error('Payment error:', err);
            toast.error(err.response?.data?.message || 'Payment initiation failed');
        } finally {
            setProcessing(false);
        }
    };

    const isFree = !course?.price || course.price === 0 || course?.isFree;

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.pageBg }}>
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
        </div>
    );

    if (!course) return null;

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptLoaded(true)} />

            <div className="min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>

                {/* ── Top Bar ──────────────────────────────────────────── */}
                <div className="sticky top-0 z-10"
                    style={{ backgroundColor: C.surfaceWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                        <button onClick={() => router.back()}
                            className="flex items-center gap-2 transition-all hover:opacity-70"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="flex items-center gap-2"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                            <Lock className="w-3.5 h-3.5" /> Secure Checkout
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="grid lg:grid-cols-5 gap-8">

                        {/* ── Left: Course Details ─────────────────────── */}
                        <div className="lg:col-span-3 space-y-6">
                            <div>
                                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, marginBottom: 6 }}>
                                    Complete Your Purchase
                                </h1>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                                    You're one step away from starting your learning journey
                                </p>
                            </div>

                            {/* Course card */}
                            <div className="p-5 rounded-2xl"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                <div className="flex gap-4">
                                    <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                        style={{ backgroundColor: `${C.btnPrimary}15` }}>
                                        {course.thumbnail && course.thumbnail !== 'https://via.placeholder.com/400x250' ? (
                                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOpen className="w-8 h-8" style={{ color: C.btnPrimary }} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                                            {course.title}
                                        </h3>
                                        <p className="line-clamp-2 mt-1"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                                            {course.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                                            {course.duration > 0 && (
                                                <span className="flex items-center gap-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                    <Clock className="w-3.5 h-3.5" /> {course.duration}h
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                <Users className="w-3.5 h-3.5" /> {course.enrolledCount || 0} enrolled
                                            </span>
                                            {course.rating > 0 && (
                                                <span className="flex items-center gap-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                    <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#f59e0b' }} /> {course.rating}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: Shield,      label: 'Secure Payment', sub: '256-bit SSL encryption' },
                                    { icon: CheckCircle, label: 'Instant Access', sub: 'Start learning right away' },
                                    { icon: CreditCard,  label: 'Easy Refund',    sub: '7-day money-back guarantee' },
                                ].map(({ icon: Icon, label, sub }) => (
                                    <div key={label} className="text-center p-4 rounded-2xl"
                                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                                            style={{ backgroundColor: `${C.btnPrimary}15` }}>
                                            <Icon className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                            {label}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, marginTop: 2 }}>
                                            {sub}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Right: Order Summary ──────────────────────── */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-24 rounded-2xl overflow-hidden shadow-xl"
                                style={{ border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>

                                {/* Summary header */}
                                <div className="px-6 py-5 relative overflow-hidden"
                                    style={{ background: C.gradientBtn }}>
                                    <div className="absolute inset-0 opacity-[0.07]"
                                        style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                                    <p className="relative" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        Order Summary
                                    </p>
                                    <p className="relative" style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: '#ffffff', marginTop: 2 }}>
                                        {isFree ? 'Free' : `₹${course.price?.toFixed(2)}`}
                                    </p>
                                </div>

                                <div className="p-6 space-y-5" style={{ backgroundColor: C.cardBg }}>
                                    {/* Line items */}
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Course Price',  value: isFree ? 'Free' : `₹${course.price?.toFixed(2)}`, highlight: false },
                                            { label: 'Platform Fee',  value: 'FREE', highlight: true },
                                        ].map(item => (
                                            <div key={item.label} className="flex justify-between">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                    {item.label}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: item.highlight ? C.success : C.heading }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between pt-3"
                                            style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                Total
                                            </span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.btnPrimary }}>
                                                {isFree ? 'Free' : `₹${course.price?.toFixed(2)}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        onClick={isFree ? handleFreeEnroll : handlePayment}
                                        disabled={processing || (!isFree && !scriptLoaded)}
                                        className="w-full py-4 text-white text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-90"
                                        style={{ background: C.gradientBtn, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                        {processing ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                                        ) : isFree ? (
                                            <><CheckCircle className="w-5 h-5" /> Enroll for Free</>
                                        ) : (
                                            <><CreditCard className="w-5 h-5" /> Pay ₹{course.price?.toFixed(2)}</>
                                        )}
                                    </button>

                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textAlign: 'center' }}>
                                        By clicking pay, you agree to our Terms of Service and Privacy Policy
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}