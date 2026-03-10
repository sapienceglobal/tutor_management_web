'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    CreditCard,
    Shield,
    CheckCircle,
    ArrowLeft,
    BookOpen,
    Clock,
    Users,
    Star,
    Loader2,
    Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Script from 'next/script';

export default function CheckoutPage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${courseId}`);
                if (res.data.success || res.data.course) {
                    setCourse(res.data.course || res.data);
                }
            } catch (error) {
                console.error('Failed to load course:', error);
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
        } catch (error) {
            toast.error(error.response?.data?.message || 'Enrollment failed');
        } finally {
            setProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (!scriptLoaded) {
            toast.error('Payment system is loading. Please wait...');
            return;
        }

        setProcessing(true);
        try {
            // 1. Create order
            const orderRes = await api.post('/payments/create-order', { courseId });
            if (!orderRes.data.success) {
                toast.error(orderRes.data.message || 'Failed to create order');
                return;
            }

            const { order, key } = orderRes.data;

            // 2. Open Razorpay popup
            const options = {
                key,
                amount: order.amount,
                currency: order.currency,
                name: 'Sapience',
                description: `Enroll in ${course?.title}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 3. Verify payment
                        const verifyRes = await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
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
                prefill: {
                    name: '',
                    email: '',
                },
                theme: {
                    color: '#4f46e5',
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                        toast('Payment cancelled', { icon: '⚠️' });
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Payment initiation failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setScriptLoaded(true)}
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back</span>
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Lock className="w-4 h-4" />
                            Secure Checkout
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="grid lg:grid-cols-5 gap-10">
                        {/* Left: Course Details */}
                        <div className="lg:col-span-3 space-y-8">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Purchase</h1>
                                <p className="text-slate-500">You&apos;re one step away from starting your learning journey</p>
                            </div>

                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex gap-5">
                                        <div className="w-32 h-20 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                                            {course.thumbnail && course.thumbnail !== 'https://via.placeholder.com/400x250' ? (
                                                <img src={course.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <BookOpen className="w-8 h-8 text-indigo-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                                {course.duration > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" /> {course.duration}h
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" /> {course.enrolledCount || 0} enrolled
                                                </span>
                                                {course.rating > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {course.rating}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { icon: Shield, label: 'Secure Payment', sub: '256-bit SSL encryption' },
                                    { icon: CheckCircle, label: 'Instant Access', sub: 'Start learning right away' },
                                    { icon: CreditCard, label: 'Easy Refund', sub: '7-day money-back guarantee' },
                                ].map((badge, idx) => (
                                    <div key={idx} className="text-center p-4 rounded-xl bg-white border border-slate-100">
                                        <badge.icon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">{badge.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{badge.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Price Summary */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-24">
                                <Card className="border-slate-200 shadow-lg">
                                    <CardContent className="p-6 space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Course Price</span>
                                                <span>₹{course.price?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Platform Fee</span>
                                                <span className="text-emerald-600 font-medium">FREE</span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3 flex justify-between">
                                                <span className="text-base font-bold text-slate-900">Total</span>
                                                <span className="text-xl font-bold text-indigo-600">₹{course.price?.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={(!course.price || course.price === 0 || course.isFree) ? handleFreeEnroll : handlePayment}
                                            disabled={processing || (!course.isFree && !scriptLoaded)}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base font-semibold shadow-lg shadow-indigo-100 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...</>
                                            ) : (!course.price || course.price === 0 || course.isFree) ? (
                                                <><CheckCircle className="w-5 h-5 mr-2" /> Enroll for Free</>
                                            ) : (
                                                <><CreditCard className="w-5 h-5 mr-2" /> Pay ₹{course.price?.toFixed(2)}</>
                                            )}
                                        </Button>

                                        <p className="text-xs text-center text-slate-400">
                                            By clicking pay, you agree to our Terms of Service and Privacy Policy
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
